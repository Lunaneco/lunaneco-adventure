import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/progression';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[],check=(name,data={})=>{checks.push({name,...data});console.log('PASS',name,JSON.stringify(data));};
const key='lunaria-progression-v1',url='http://127.0.0.1:5174/';
const saved=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
async function open(profile){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await context.addInitScript(({key,profile})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('lunaria-record-v1',JSON.stringify({...JSON.parse(localStorage.getItem('lunaria-record-v1')||'{}'),chapterOneCleared:true}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,music:false,quality:'low'}));if(profile)localStorage.setItem(key,JSON.stringify(profile));sessionStorage.setItem('seeded','1');}},{key,profile});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:60000});return {context,page};
}
try{
 const {context,page}=await open();
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=1000;g.enemies=[];
   for(const [id,count] of [['nyanluna',6],['tsukineko',2]])for(let i=0;i<count;i++){const e=g.spawnEnemy('moss',10,10);g.hit(e,999,0,0,false,false,id);}t.step(0);});
 let profile=await saved(page);assert.deepEqual(profile.characters.nyanluna,{level:2,xp:0,breaks:0,tree:[]});assert.deepEqual(profile.characters.tsukineko,{level:1,xp:12,breaks:0,tree:[]});
 assert.equal(await page.locator('#level').innerText(),'Lv. 2');assert.equal(await page.locator('[data-skill]').count(),0);await page.locator('#stage-crystal-hud').waitFor({state:'visible'});assert.equal(await page.locator('#crystal-count').innerText(),'0 / 8');
 check('Actual kill events immediately save separate character XP and update the active level without a blessing menu',profile);
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.collectAll();t.step(.02);});
 assert.equal(await page.locator('[data-skill]').count(),3);assert.match(await page.locator('.upgrade-heading h2').innerText(),/クリスタルの祝福/);assert.deepEqual((await saved(page)).characters,profile.characters);assert.deepEqual((await saved(page)).inventory,profile.inventory);assert.equal((await saved(page)).missions.stages[0].crystals,8);profile=await saved(page);
 await page.screenshot({path:`${out}/crystal-choices-mobile.png`});await page.locator('[data-skill]').first().tap();
 assert.ok(Object.keys(await page.evaluate(()=>window.__LUNARIA_TEST__.game.skills)).length>0);assert.equal(await page.locator('#level').innerText(),'Lv. 2');
 check('Picking up eight dropped crystals opens the three stage blessings without adding XP');
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.wave=2;g.area=0;g.exitOpen=true;g.exitDelay=0;g.player.x=0;g.player.z=-16.6;t.step(.02);g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.enemies=[];g.player.attack=g.partner.attack=1000;});
 const after=await page.evaluate(()=>window.__LUNARIA_TEST__.state);assert.equal(after.wave,3);assert.deepEqual(after.skills,{});assert.equal(after.stageCrystals,0);assert.equal(after.blessingTier,0);assert.deepEqual((await saved(page)).characters,profile.characters);assert.equal((await saved(page)).inventory.moonDew,1);profile=await saved(page);
 assert.equal(await page.locator('#acquired>span').count(),0);await page.locator('#stage-crystal-hud').waitFor({state:'visible'});assert.equal(await page.locator('#crystal-count').innerText(),'0 / 8');
 check('Passing through the gate resets every stage blessing and its meter while retaining permanent growth');
 await page.locator('#switch-action').tap();assert.equal(await page.locator('#level').innerText(),'Lv. 1');assert.equal(await page.locator('#hero-exp').innerText(),'EXP 12 / 36');
 await page.locator('#stage-crystal-hud').waitFor({state:'visible'});assert.equal(await page.locator('#wave-banner').evaluate(el=>getComputedStyle(el).opacity),'0');await page.screenshot({path:`${out}/combat-mobile.png`});check('Switching characters updates the active character level and XP meter');
 await page.click('#pause');await page.click('#quit');await page.click('[data-menu-tab="growth"]');
 assert.equal(await page.locator('#growth-nyanluna .growth-level b').innerText(),'2');assert.equal(await page.locator('#growth-tsukineko .growth-level b').innerText(),'1');assert.match(await page.locator('#growth-tsukineko .growth-exp').innerText(),/EXP 12/);
 for(const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.evaluate(()=>document.querySelector('#chapter-menu').scrollTop=0);
  assert.equal(await page.evaluate(()=>document.querySelector('#chapter-menu').scrollWidth>innerWidth),false);
  for(const id of ['nyanluna','tsukineko']){const button=page.locator(`[data-open-tree="${id}"][data-tree-target]`);await button.scrollIntoViewIfNeeded();const b=await button.boundingBox();assert.ok(b.width>=44&&b.height>=44&&b.x>=0&&b.x+b.width<=size.width);const fit=await page.locator(`#growth-${id}`).evaluate(el=>el.scrollWidth===el.clientWidth);assert.equal(fit,true);}
  await page.evaluate(()=>document.querySelector('#chapter-menu').scrollTop=0);await page.screenshot({path:`${out}/growth-${size.width}.png`});
 }
 check('The growth menu shows both characters and all controls fit four narrow and wide layouts');
 await page.reload();await page.waitForSelector('#loading',{state:'detached'});assert.deepEqual(await saved(page),profile);await page.click('#chapter-menu-open');await page.click('[data-menu-tab="growth"]');assert.equal(await page.locator('#growth-nyanluna .growth-level b').innerText(),'2');
 await page.click('[data-menu-tab="adventure"]');await page.click('#chapter-start');await page.click('#story-skip');
 assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.player.maxHp),186);assert.equal(await page.locator('#level').innerText(),'Lv. 2');
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;const e=g.spawnEnemy('moss',0,8);g.hit(e,999,0,0,false,false,'tsukineko');g.player.invincible=0;g.hurt(999,0,0);t.step(0);});
 profile=await saved(page);assert.ok(profile.characters.tsukineko.xp>=18);assert.equal(await page.locator('.result.defeat').isVisible(),true);
 await page.click('#retry');await page.click('#story-skip');assert.deepEqual(await saved(page),profile);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.stageCrystals),0);
 check('Menu, reload, defeat and retry preserve XP; a fresh run starts with the grown base HP');await context.close();

 const noStone={version:1,characters:{nyanluna:{level:20,xp:400,breaks:0,tree:[]},tsukineko:{level:1,xp:0,breaks:0,tree:[]}},inventory:{limitStone:0}};
 const empty=await open(noStone);await empty.page.click('#chapter-menu-open');await empty.page.click('[data-menu-tab="growth"]');assert.match(await empty.page.locator('#growth-nyanluna .growth-exp').innerText(),/蓄積EXP 400/);await empty.page.click('[data-open-tree="nyanluna"][data-tree-target]');assert.equal(await empty.page.locator('[data-unlock-node="limit30"]').isDisabled(),true);await empty.context.close();
 check('A character at Lv.20 banks XP but cannot break the cap without an item');
 const seeded=structuredClone(noStone);seeded.inventory.limitStone=2;seeded.characters.future_hero={level:7,xp:12,breaks:1,tree:[]};
 const limit=await open(seeded),p=limit.page;await p.click('#chapter-menu-open');await p.click('[data-menu-tab="growth"]');await p.click('[data-open-tree="tsukineko"][data-tree-target]');assert.equal(await p.locator('[data-unlock-node="limit30"]').isDisabled(),true);await p.click('[data-tree-hero="nyanluna"]');await p.click('[data-tree-node="limit30"]');assert.equal(await p.locator('[data-unlock-node="limit30"]').isEnabled(),true);
 await p.evaluate(()=>{for(let i=0;i<2;i++)document.querySelector('[data-unlock-node="limit30"]').click();});
 let unlocked=await saved(p);assert.equal(unlocked.inventory.limitStone,1);assert.deepEqual(unlocked.characters.nyanluna,{level:21,xp:136,breaks:1,tree:[]});assert.equal(await p.locator('[data-material-count="limitStone"]').innerText(),'1');assert.match(await p.locator('#tree-feedback').innerText(),/上限 Lv.20 → Lv.30/);
 assert.deepEqual(unlocked.characters.future_hero,seeded.characters.future_hero);await p.waitForTimeout(700);assert.equal(await p.locator('[data-unlock-node="limit30"]').isDisabled(),true);
 await p.screenshot({path:`${out}/limit-break-mobile.png`});await p.reload();await p.waitForSelector('#loading',{state:'detached'});assert.deepEqual(await saved(p),unlocked);await p.click('#chapter-menu-open');await p.click('[data-menu-tab="growth"]');assert.equal(await p.locator('#growth-nyanluna .growth-level b').innerText(),'21');
 check('Limit break consumes exactly one stone, raises only the selected cap, applies banked XP and survives reload',unlocked);await limit.context.close();
 assert.deepEqual(errors,[]);check('No JavaScript, shader or resource errors');
 await writeFile(`${out}/report.json`,JSON.stringify({checks,errors,date:new Date().toISOString()},null,2));
}finally{await browser.close();}
