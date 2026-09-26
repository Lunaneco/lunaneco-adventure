import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {HEROES} from '../src/model.js';
import {FIRST_TIER_NODES,SECOND_TIER_NODES} from '../src/talents.js';
const base=process.env.LUNARIA_URL||'http://127.0.0.1:5185',out='audit/chapter-four';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],checks=[];
const report=async()=>writeFile(`${out}/browser-report.json`,JSON.stringify({checks,errors},null,2));
const check=(name,detail={})=>{checks.push({name,...detail});console.log('PASS',name,JSON.stringify(detail));};
const seed={story:{version:2,actClears:Array(16).fill(true)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4,tree:[...FIRST_TIER_NODES,...SECOND_TIER_NODES].map(n=>n.id)}])),inventory:{limitStone:100,starBud:9000,moonDew:1000,wardenCore:1000,moonPrism:1000,astralCore:1000,bloodCrystal:500,demonHeart:100},tutorial:{firstBattleCompleted:true}};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 await context.addInitScript(seed=>{if(!localStorage.getItem('chapter-four-audit-seeded')){localStorage.setItem('lunaria-progression-v1',JSON.stringify(seed));localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['shizuku','nyanluna'],lead:'shizuku'}));localStorage.setItem('chapter-four-audit-seeded','1');}},seed);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()}: ${r.url()}`);});page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#loading',{state:'detached',timeout:45000});check('Five hero models and all story assets load');
 await page.click('#start');await page.click('[data-chapter="3"]');assert.match(await page.locator('#adventure-panel').innerText(),/悪魔の国/);await page.screenshot({path:`${out}/chapter-menu.png`});
 await page.click('#menu-party-open');assert.match(await page.locator('.shizuku-bond').innerText(),/12%/);await page.screenshot({path:`${out}/party-bonus.png`});await page.locator('#modal [data-close]').last().click();
 await page.click('[data-menu-tab="talent"]');await page.click('[data-tree-hero="shizuku"]');await page.click('[data-tree-tier="4"]');assert.match(await page.locator('#talent-panel').innerText(),/紅月の星/);await page.screenshot({path:`${out}/growth-tree.png`});check('Party bonus and Lv.60–80 third talent tier are visible');
 await page.click('[data-tree-node="limit60"]');assert.match(await page.locator('#talent-panel').innerText(),/紅月の結晶/);
 await page.click('[data-tree-tier="4"]');
 for(const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await page.setViewportSize(size);assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);await page.screenshot({path:`${out}/growth-${size.width}.png`});check(`Growth view fits ${size.width}×${size.height}`);
 }
 await page.setViewportSize({width:1440,height:1000});await page.click('[data-menu-tab="adventure"]');await page.click('[data-act="12"]');await page.click('#chapter-start');await page.waitForSelector('#story-dialog',{state:'visible'});await page.click('#story-next');
 await page.locator('.story-character-image').evaluate(img=>img.decode());assert.equal(await page.locator('#story-dialog').getAttribute('data-speaker'),'shizuku');
 for(const size of [{width:1440,height:1000},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){await page.setViewportSize(size);await page.screenshot({path:`${out}/shizuku-story-${size.width}.png`});}
 await page.setViewportSize({width:1440,height:1000});await page.click('#story-skip');check('Reference-based Shizuku story portrait loads in four viewports');
 const setup=await page.evaluate(async()=>{
  const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.invincible=999;g.player.attack=g.partner.attack=999;g.healthFor(4).hp=100;g.materialRng=()=>0;
  const s=g.player,e=g.spawnEnemy('demonImp',s.x,s.z+1);e.hp=100;const hp=g.healthFor(4).hp;g.attackFrom(s,4);const healed=g.healthFor(4).hp-hp;t.step(0);
  g.enemies=[];const {enemyRosterForAct}=await import('/src/enemies.js');for(const [i,id] of enemyRosterForAct(12).entries()){const e=g.spawnEnemy(id,g.player.x+(i-3)*2.1,g.player.z-6-Math.abs(i-3));e.special=999;e.attack=999;e.speed=0;}
  g.pause();return {hero:g.player.hero,healed,stats:t.stats};
 });assert.equal(setup.hero,4);assert.ok(setup.healed>0);await page.waitForTimeout(150);await page.screenshot({path:`${out}/demon-battle.png`});check('Imported Shizuku, scythe, seven demon shapes and HP drain render',setup);
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.resume();g.ultimateCharges.shizuku=g.ultimateCharges.nyanluna=100;t.step(0);});await page.click('#ultimate');
 await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.id==='nyanluna-shizuku-duet'&&!!window.__LUNARIA_TEST__.voice.current.source,{timeout:10000});
 assert.equal(await page.locator('#ultimate-cutin').getAttribute('data-hero'),'shizukuDuet');await page.waitForTimeout(300);
 const captureCutin=async prefix=>{
  await page.waitForTimeout(650);await page.evaluate(()=>window.__LUNARIA_TEST__.ultimatePresentation.pause());await page.locator('.cutin-face').evaluate(img=>img.decode());
  for(const size of [{width:1440,height:1000},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
   await page.setViewportSize(size);const box=await page.locator('.cutin-ability').boundingBox();assert.ok(box.x>=-1&&box.x+box.width<=size.width+1,`${prefix}: ability text fits ${size.width}`);await page.screenshot({path:`${out}/${prefix}-${size.width}.png`});
  }
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.__LUNARIA_TEST__.ultimatePresentation.resume());
 };
 assert.match(await page.locator('#ultimate-cutin').innerText(),/大の仲良し/);await captureCutin('duet-cutin');
 await page.click('#cutin-pause');const time=await page.evaluate(()=>window.__LUNARIA_TEST__.game.time);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.time),time);await page.click('#resume');
 await page.waitForFunction(()=>window.__LUNARIA_TEST__.game.ultimateEffects.some(e=>e.kind==='moonDrop'),{timeout:16000});await page.screenshot({path:`${out}/duet-cast.png`});
 const duet=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;return {charge:{...t.game.ultimateCharges},audioError:t.voice.lastError,phase:t.game.phase};});assert.equal(duet.audioError,null);assert.ok(duet.charge.shizuku<10&&duet.charge.nyanluna<10);check('Duet voice decodes, pauses, finishes, and releases exactly one two-gauge skill',duet);
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.ultimateEffects=[];g.ultimateCharges.shizuku=100;g.ultimateCharges.nyanluna=0;t.step(0);});await page.click('#ultimate');
 await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.id==='shizuku-ultimate-1'&&!!window.__LUNARIA_TEST__.voice.current.source,{timeout:10000});assert.equal(await page.locator('#ultimate-cutin').getAttribute('data-hero'),'shizuku');await captureCutin('shizuku-cutin');await page.click('#cutin-skip');
 await page.waitForFunction(()=>window.__LUNARIA_TEST__.game.ultimateEffects.some(e=>e.kind==='scytheDance'));check('Solo and duet use separate illustrations and fit four viewports');
 await page.evaluate(()=>window.__LUNARIA_TEST__.home());await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#loading',{state:'detached'});await page.click('#start');await page.click('#menu-party-open');assert.match(await page.locator('.shizuku-bond').innerText(),/月と雫/);check('Party selection and chapter unlock persist after reload');
 assert.deepEqual(errors,[]);await report();await context.close();
}catch(e){errors.push(e.stack);await report();throw e;}finally{await browser.close();}
