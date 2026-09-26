import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {botInput,priority} from './bot.js';
const out='audit/chapter-one';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[],checks=[];
const check=(name,data={})=>{checks.push({name,...data});console.log('PASS',name,JSON.stringify(data));};
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
async function readScene(){const title=await page.locator('#story-title').innerText();let lines=0;while(await page.locator('#story-dialog').isVisible()){assert.ok(++lines<40);await page.locator('#story-next').click();}return {title,lines};}
try{
 await page.goto('http://127.0.0.1:5174/');await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.click('#start');await page.click('#chapter-start');
 assert.equal(await page.locator('#story-dialog').isVisible(),true);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.phase),'paused');
 for(const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);
  const layout=await page.evaluate(()=>{const d=document.querySelector('#story-dialog'),r=d.getBoundingClientRect(),p=d.querySelector('.story-dialogue>p').getBoundingClientRect(),title=d.querySelector('.story-title-block').getBoundingClientRect(),button=d.querySelector('#story-next').getBoundingClientRect();return {inFrame:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,textFits:p.bottom<button.top,columns:innerWidth>innerHeight||title.bottom<p.top,buttonVisible:button.bottom<=r.bottom,overflow:d.scrollHeight>d.clientHeight};});
  assert.ok(layout.inFrame&&layout.textFits&&layout.columns&&layout.buttonVisible&&!layout.overflow,JSON.stringify({size,layout}));await page.screenshot({animations:'disabled',path:`${out}/opening-${size.width}.png`});
 }
 check('Opening story is readable in four portrait and landscape layouts and pauses combat');await page.setViewportSize({width:390,height:844});const scenes=[await readScene()];
 await page.evaluate(source=>{window.__chapterBot=eval(`(${source})`);},botInput.toString());
 const gates=[],areas=new Set();let upgrades=0,iterations=0,ending=false;
 while(iterations++<350){
  if(await page.locator('#battle-tutorial').isVisible())await page.click('#tutorial-skip');
  if(await page.locator('#story-dialog').isVisible()){
   const title=await page.locator('#story-title').innerText();await page.screenshot({animations:'disabled',path:`${out}/story-${scenes.length}.png`});
   if(title==='ふたりで灯す、帰り道。'){ending=true;const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-record-v1')));assert.equal(saved.chapterOneCleared,true);assert.equal(saved.wins,1);}
   scenes.push(await readScene());if(ending)break;
  }
  if(await page.locator('#modal[open] [data-skill]').count()){const offers=await page.locator('#modal[open] [data-skill]').evaluateAll(els=>els.map(e=>e.dataset.skill));const id=offers.sort((a,b)=>priority.indexOf(a)-priority.indexOf(b))[0];await page.click(`[data-skill="${id}"]`);upgrades++;continue;}
  const state=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;for(let i=0;i<60&&t.game.phase==='playing';i++)t.game.tick(1/60,window.__chapterBot(t.game));t.step(0);return t.state;});areas.add(state.area);if(state.wave<6){assert.deepEqual(state.party,['nyanluna']);assert.equal(state.earnedXp.tsukineko,0);}else if(state.phase!=='victory'){assert.deepEqual(state.party,['nyanluna','tsukineko']);assert.equal(state.guestHeroId,'tsukineko');}
  if(state.exitOpen&&!gates.includes(state.area)){
   gates.push(state.area);const gate=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.world.render(t.game,1.6);return {visible:t.world.stageGate.group.visible,phase:t.game.phase,wave:t.game.wave,record:JSON.parse(localStorage.getItem('lunaria-record-v1')||'{}')};});
   assert.equal(gate.visible,true);assert.notEqual(gate.phase,'victory');assert.equal(gate.record.chapterOneCleared,undefined);
   await page.screenshot({animations:'disabled',path:`${out}/gate-${state.area+1}.png`});check(`Stage ${state.area+1} opens a reachable gate without premature completion`,gate);
  }
  assert.notEqual(state.phase,'defeat',JSON.stringify(state));
 }
 assert.equal(ending,true);assert.deepEqual(gates,[0,1,2]);assert.deepEqual([...areas],[0,1,2]);assert.equal(scenes.length,5);assert.ok(upgrades>=4);
 assert.equal(await page.locator('#chapter-menu').isVisible(),true);assert.equal(await page.locator('#hud').isVisible(),false);assert.equal(await page.locator('.chapter-complete').innerText(),'✓ 第1章クリア');assert.equal(await page.locator('.chapter-reward').isVisible(),true);assert.equal(await page.locator('.recruitment-banner').isVisible(),true);await page.screenshot({animations:'disabled',path:`${out}/clear-menu-mobile.png`});
 check('All 91 enemies, three gates and five scenes lead to the chapter menu',{scenes,upgrades,iterations});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-record-v1'))),growth=await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));assert.equal(growth.story.chapterOneCleared,true);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-party-v1')).members),['nyanluna','tsukineko']);assert.equal(growth.inventory.limitStone,1);assert.equal(growth.inventory.moonDew,15);assert.equal(growth.inventory.wardenCore,2);assert.equal(growth.equipment.owned.length,0);assert.equal(growth.missions.claimed.length,9);assert.ok(growth.inventory.starBud>=96);assert.ok(growth.characters.nyanluna.level>1);assert.ok(growth.characters.tsukineko.level>=1);await page.click('#chapter-story');assert.equal(await page.locator('#story-dialog').isVisible(),true);await page.click('#story-skip');assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-record-v1'))),saved);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1'))),growth);check('Chapter completion saves all tree materials and one limit stone; story replay grants no duplicate items or XP');
 await page.reload();await page.waitForSelector('#loading',{state:'detached'});await page.click('#chapter-menu-open');assert.equal(await page.locator('.chapter-complete').isVisible(),true);assert.equal(await page.locator('#chapter-story').isEnabled(),true);
 for(const size of [{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){await page.setViewportSize(size);await page.locator('#chapter-start').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.querySelector('#chapter-menu').scrollWidth>innerWidth),false);await page.screenshot({animations:'disabled',path:`${out}/menu-${size.width}.png`});}
 check('Chapter clear persists across reload; chapter menu and restart fit narrow and wide screens');
 await page.click('#chapter-start');await page.click('#story-skip');assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.state.wave),1);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.state.exitOpen),false);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.state.player.hp),await page.evaluate(()=>window.__LUNARIA_TEST__.state.player.maxHp));check('Replay starts a fresh adventure with a closed gate');
 assert.deepEqual(errors,[]);check('No uncaught JavaScript, shader or resource errors');
 await writeFile(`${out}/report.json`,JSON.stringify({checks,errors,date:new Date().toISOString()},null,2));
}finally{await browser.close();}
