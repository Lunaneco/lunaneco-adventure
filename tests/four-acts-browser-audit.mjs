import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {ACTS} from '../src/acts.js';
import {ACT_SCENES} from '../src/chapter.js';
import {UNIQUE_EQUIPMENT} from '../src/equipment.js';
import {botInput,priority} from './bot.js';
const out='audit/four-acts';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[],errors=[];
const pass=(name,data={})=>{checks.push({name,...data});console.log('PASS',name,JSON.stringify(data));};
const sizes=[{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:1440,height:900}];
async function open({seed,production=false}={}){
 const context=await browser.newContext({viewport:sizes[0],hasTouch:true,isMobile:true,deviceScaleFactor:1});
 await context.addInitScript(seed=>{if(sessionStorage.getItem('audit-seeded'))return;localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,music:false,motion:false,quality:'low'}));if(seed)localStorage.setItem('lunaria-progression-v1',JSON.stringify(seed));sessionStorage.setItem('audit-seeded','1');},seed);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(`http://127.0.0.1:${production?4173:5174}/?v=four-acts-audit`);await page.waitForSelector('#loading',{state:'detached',timeout:60000});return {page,context};
}
const profile=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
try{
 const {page,context}=await open();await page.click('#chapter-menu-open');
 assert.equal(await page.locator('[data-act]').count(),4);assert.equal(await page.locator('[data-act="0"]').isEnabled(),true);for(const act of [1,2,3])assert.equal(await page.locator(`[data-act="${act}"]`).isEnabled(),false);
 pass('Fresh save exposes four acts and locks acts 2–4');
 await page.evaluate(source=>{window.__actBot=eval(`(${source})`);},botInput.toString());
 const scenes=[];
 for(let act=0;act<4;act++){
  await page.click(`[data-act="${act}"]`);await page.click('#chapter-start');let completed=false,upgrades=0,skillsBefore={},gates=new Set();
  for(let iteration=0;iteration<600;iteration++){
   if(await page.locator('#story-dialog').isVisible()){
    const title=await page.locator('#story-title').innerText();scenes.push(title);await page.screenshot({animations:'disabled',path:`${out}/act${act+1}-scene${scenes.length}.png`});
    await page.click('#story-skip');
    if(await page.locator('#chapter-menu').isVisible()){completed=true;break;}
   }
   if(await page.locator('#battle-tutorial').isVisible())await page.click('#tutorial-skip');
   if(await page.locator('#modal[open] [data-skill]').count()){
    const offers=await page.locator('#modal[open] [data-skill]').evaluateAll(els=>els.map(e=>e.dataset.skill));const id=offers.sort((a,b)=>priority.indexOf(a)-priority.indexOf(b))[0];await page.click(`[data-skill="${id}"]`);upgrades++;continue;
   }
   const state=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;for(let i=0;i<120&&t.game.phase==='playing';i++)t.game.tick(1/60,window.__actBot(t.game));t.step(0);return t.state;});
   assert.equal(state.act,act);assert.notEqual(state.phase,'defeat');for(const [id,rank] of Object.entries(skillsBefore))assert.ok(state.skills[id]>=rank,`Lost skill ${id}, act ${act}, wave ${state.wave}`);skillsBefore=state.skills;
   if(act<3||state.wave<6){assert.deepEqual(state.party,['nyanluna']);assert.equal(state.earnedXp.tsukineko,0);}else if(state.phase!=='victory')assert.equal(state.guestHeroId,'tsukineko');
   if(state.phase!=='victory')assert.equal(state.earnedMissions.length,0);
   if(state.exitOpen)gates.add(state.area);
  }
  assert.ok(completed,`Act ${act+1} did not finish`);const saved=await profile(page);
  assert.deepEqual(saved.story.actClears,ACTS.map((_,i)=>i<=act));assert.equal(saved.story.tsukinekoUnlocked,act===3);assert.equal(saved.story.chapterOneCleared,act===3);assert.equal(saved.inventory.limitStone,act===3?1:0);
  assert.ok(await page.locator('.mission-run-rewards').isVisible());assert.ok(upgrades>=4);await page.screenshot({animations:'disabled',path:`${out}/act${act+1}-rewards.png`});
  pass(`Act ${act+1}: all six waves, retained blessings, delayed mission rewards and correct unlock`,{upgrades,level:saved.characters.nyanluna.level,missionCount:saved.missions.claimed.length});
 }
 assert.equal(scenes.length,17);assert.equal(await page.locator('.recruitment-banner').isVisible(),true);await page.reload();await page.waitForSelector('#loading',{state:'detached'});await page.click('#chapter-menu-open');assert.equal(await page.locator('.chapter-complete').isVisible(),true);assert.equal(await page.locator('[data-hero="1"]').last().isEnabled(),true);pass('All 17 story scenes reach the menu; reunion and four-act progress persist across reload');await context.close();

 const seed={story:{version:2,actClears:[true,true,true,true],tsukinekoUnlocked:true},equipment:{owned:UNIQUE_EQUIPMENT.map(i=>i.id),loadout:{}},tutorial:{firstBattleCompleted:true}};
 const art=await open({seed}),p=art.page;await p.click('#chapter-menu-open');const before=await profile(p);
 for(const size of sizes){
  await p.setViewportSize(size);
  for(let act=0;act<4;act++){
   await p.click(`[data-act="${act}"]`);await p.click('#chapter-story');
   for(const line of Object.values(ACT_SCENES[act]).flatMap(s=>s.lines)){
    await p.waitForFunction(who=>{const d=document.querySelector('#story-dialog'),im=d.querySelector('img');return d.dataset.speaker===who&&im.complete&&im.naturalWidth>0;},line.who);
    assert.equal(await p.locator('.story-dialogue>p').innerText(),line.text);
    const fit=await p.evaluate(()=>{const d=document.querySelector('#story-dialog'),r=d.getBoundingClientRect(),p=d.querySelector('.story-dialogue>p').getBoundingClientRect(),b=d.querySelector('#story-next').getBoundingClientRect();return d.scrollWidth<=d.clientWidth&&d.scrollHeight<=d.clientHeight&&p.bottom<=b.top&&b.bottom<=r.bottom&&b.width>=44&&b.height>=44;});assert.ok(fit,`${size.width}, act ${act}, ${line.text}`);
    await p.click('#story-next');
   }
  }
  await p.click('[data-menu-tab="equipment"]');
  for(const img of await p.locator('#equipment-content img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(im=>im.decode());assert.equal(await img.evaluate(im=>im.naturalWidth),768);}
  assert.equal(await p.evaluate(()=>document.querySelector('#chapter-menu').scrollWidth>innerWidth),false);await p.locator('.unique-card').first().scrollIntoViewIfNeeded();await p.screenshot({animations:'disabled',path:`${out}/equipment-${size.width}.png`});
  await p.click('[data-menu-tab="adventure"]');pass(`All story lines and equipment illustrations fit ${size.width}×${size.height}`);
 }
 assert.deepEqual(await profile(p),before);await p.setViewportSize(sizes[0]);await p.click('[data-menu-tab="equipment"]');await p.click('[data-equip-item="ruins-lens"]');assert.equal((await profile(p)).equipment.loadout.nyanluna,'ruins-lens');await p.click('[data-equipment-hero="tsukineko"]');
 assert.match(await p.locator('[data-equip-item="ruins-lens"]').innerText(),/にゃんるなから付け替え/);await p.click('[data-equip-item="ruins-lens"]');assert.deepEqual((await profile(p)).equipment.loadout,{tsukineko:'ruins-lens'});await p.click('[data-equip-item="dawn-seal"]');assert.deepEqual((await profile(p)).equipment.loadout,{tsukineko:'dawn-seal'});
 await p.reload();await p.waitForSelector('#loading',{state:'detached'});await p.click('#chapter-menu-open');await p.click('[data-menu-tab="equipment"]');await p.click('[data-equipment-hero="tsukineko"]');assert.match(await p.locator('.equipped-summary').innerText(),/暁守の紋章/);assert.match(await p.locator('.equipped-summary').innerText(),/26/);await p.locator('.signature-weapon').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/equipment-tsukineko.png`});pass('Gear selects, replaces and transfers between heroes; stats and loadout survive reload');
 await p.click('[data-menu-tab="adventure"]');await p.click('[data-act="3"]');await p.click('#chapter-start');await p.click('#story-skip');
 await p.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.wave=5;t.game.enemies=[];t.game.orbs=[];t.game.startWave();t.step(0);});assert.equal(await p.locator('#story-title').innerText(),'やっと、見つけた。');assert.equal(await p.evaluate(()=>window.__LUNARIA_TEST__.game.guestHeroId),null);pass('Previously recruited players still see the act-four reunion story during replay');await art.context.close();
 const legacy=await open({seed:{story:{chapterOneCleared:true},characters:{tsukineko:{level:19,xp:8}},inventory:{limitStone:4},equipment:{owned:['dawn-seal'],loadout:{tsukineko:'dawn-seal'}}}});await legacy.page.click('#chapter-menu-open');const migrated=await profile(legacy.page);assert.deepEqual(migrated.story.actClears,[true,false,false,false]);assert.equal(migrated.story.tsukinekoUnlocked,true);assert.equal(migrated.characters.tsukineko.level,19);assert.equal(migrated.inventory.limitStone,4);assert.equal(migrated.equipment.loadout.tsukineko,'dawn-seal');assert.equal(await legacy.page.locator('[data-act="1"]').isEnabled(),true);assert.equal(await legacy.page.locator('[data-act="2"]').isEnabled(),false);await legacy.context.close();pass('Legacy clear migrates to act one without losing Tsukineko, growth, stones or equipment');

 const prod=await open({seed,production:true});assert.equal(await prod.page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');await prod.page.waitForFunction(async()=>{await navigator.serviceWorker.ready;return !!navigator.serviceWorker.controller;});await prod.context.setOffline(true);await prod.page.reload();await prod.page.waitForSelector('#loading',{state:'detached'});await prod.page.click('#chapter-menu-open');await prod.page.click('[data-menu-tab="equipment"]');
 for(const hero of ['nyanluna','tsukineko']){await prod.page.click(`[data-equipment-hero="${hero}"]`);for(const img of await prod.page.locator('#equipment-content img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(im=>im.decode());assert.equal(await img.evaluate(im=>im.naturalWidth),768);}}
 await prod.context.close();pass('Production works offline with all eight equipment images and no debug bridge');assert.deepEqual(errors,[]);pass('No uncaught JavaScript or missing resources');
 await writeFile(`${out}/report.json`,JSON.stringify({checks,errors,scenes,date:new Date().toISOString()},null,2));
}finally{await browser.close();}
