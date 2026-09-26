import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const out='audit/extra-stages',base=process.env.LUNARIA_URL||'http://127.0.0.1:5177/';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],checks=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await context.addInitScript(()=>{
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));
  if(!localStorage.getItem('lunaria-progression-v1'))localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:[true,true,true,true,true,true,true,false]},characters:Object.fromEntries(['nyanluna','tsukineko','omsolo'].map(id=>[id,{level:50,breaks:3}])),tutorial:{firstBattleCompleted:true}}));
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const load=async()=>{await page.goto(base);await page.waitForSelector('#loading',{state:'detached',timeout:60000});};
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
 const finalGate=()=>page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.resume();g.enemies=[];g.projectiles=[];g.hazards=[];g.orbs=[];g.pendingBlessings=0;g.wave=6;g.area=2;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);g.crossExit();t.step(0);});
 await load();await page.locator('#chapter-menu-open').tap();
 for(const chapter of [0,1]){await page.locator(`[data-chapter="${chapter}"]`).tap();assert.equal(await page.locator(`[data-act="${8+chapter}"]`).isDisabled(),true);}
 await page.locator('[data-act="7"]').tap();await page.evaluate(()=>window.__LUNARIA_TEST__.start());await finalGate();await page.waitForSelector('.result.victory');await page.locator('#home-button').tap();
 for(const chapter of [0,1]){await page.locator(`[data-chapter="${chapter}"]`).tap();assert.equal(await page.locator(`[data-act="${8+chapter}"]`).isDisabled(),false);}
 checks.push('Both extras unlock together after chapter two final gate');
 let total=(await saved()).inventory.weaponTicket;const initialMissions=(await saved()).missions,stones=(await saved()).inventory.limitStone;
 for(const [act,reward] of [[8,10],[9,10],[8,2],[9,2]]){
  await page.locator(`[data-chapter="${act-8}"]`).tap();await page.locator(`[data-act="${act}"]`).tap();
  assert.equal(await page.locator('#chapter-story').count(),0);assert.equal(await page.locator('#stage-difficulty [data-difficulty]').count(),0);assert.match(await page.locator('#stage-difficulty').innerText(),/最高難度固定/);assert.match(await page.locator('.act-intro small').innerText(),new RegExp(`ガチャ券${reward}枚`));
  if(act===8&&reward===10){
   for(const [width,height] of [[320,640],[390,844],[844,390],[1440,900]]){
    await page.setViewportSize({width,height});await page.locator('.extra-stage-selector').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.chapter-shell').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
    await page.screenshot({path:`${out}/menu-${width}.png`});
   }
   await page.setViewportSize({width:390,height:844});
  }
  await page.locator('#chapter-start').tap();await page.waitForFunction(()=>window.__LUNARIA_TEST__.game?.phase==='playing');
  assert.equal(await page.locator('#story-dialog[open]').count(),0);assert.equal(await page.locator('#mission-tracker').isVisible(),false);
  assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.difficulty),'hard');assert.match(await page.locator('#area-sub').innerText(),/EXTRA/);
  await page.locator('#pause').tap();assert.equal(await page.locator('.current-missions').count(),0);assert.match(await page.locator('.enemy-guide').innerText(),/最高難度固定/);await page.locator('#resume').tap();
  // Exercise stage transitions through the normal callbacks: extras have no story scenes.
  for(let area=0;area<2;area++){
   await page.evaluate(area=>{const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];g.orbs=[];g.pendingBlessings=0;g.wave=area*2+2;g.area=area;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);g.crossExit();t.step(0);},area);
   assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.phase),'playing');
  }
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];g.wave=5;g.startWave();g.spawn();t.step(0);g.pause();});
  await page.screenshot({path:`${out}/battle-${act}-${reward}.png`});
  assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.rescue),null);
  await finalGate();await page.waitForSelector('.chapter-reward');total+=reward;
  assert.match(await page.locator('.chapter-reward .run-ticket-reward').innerText(),new RegExp(`クリア報酬${reward}枚`));assert.match(await page.locator('.act-intro small').innerText(),/ガチャ券2枚/);
  const p=await saved();assert.equal(p.inventory.weaponTicket,total);assert.equal(p.inventory.limitStone,stones);assert.deepEqual(p.missions,initialMissions);assert.equal(p.story.extraClears[act-8],true);
  await page.locator('[data-menu-tab="weapons"]').tap();assert.equal(await page.locator('#weapon-ticket-count').innerText(),`${total}枚`);
  await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:60000});assert.equal((await saved()).inventory.weaponTicket,total);await page.locator('#chapter-menu-open').tap();
  checks.push(`Extra ${act}: ${reward} clear tickets, no missions or rescue, wallet and reload persisted`);
 }
 await page.locator('[data-act="9"]').tap();await page.locator('[data-menu-tab="missions"]').tap();await page.locator('[data-prepare-challenge]').tap();assert.equal(await page.locator('#chapter-start').getAttribute('data-mode'),'hard');assert.equal(await page.locator('#chapter-story').count(),1);
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({checks,errors,totalTickets:total},null,2));console.log('PASS',JSON.stringify(checks));
}finally{await browser.close();}
