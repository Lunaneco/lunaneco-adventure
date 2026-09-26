import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/act-tickets-v138';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],checks=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await context.addInitScript(()=>{
  if(sessionStorage.getItem('act-ticket-audit'))return;
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({tutorial:{firstBattleCompleted:true},inventory:{weaponTicket:0}}));
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));
  sessionStorage.setItem('act-ticket-audit','1');
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.LUNARIA_URL??'http://127.0.0.1:5177/');await page.waitForSelector('#loading',{state:'detached',timeout:120000});
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
 for(const [run,drop,total] of [[1,false,1],[2,true,3]]){
  await page.evaluate(withDrop=>{
   const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.enemies=[];g.waveSpawned=g.waveGoal;
   if(withDrop){g.lootRng=()=>0;const boss=g.spawnEnemy('boss',10,10);g.hit(boss,999999,0,0);}
   g.wave=6;g.area=2;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);g.crossExit();t.step(0);
  },drop);
  await page.waitForSelector('.result.victory');
  const text=await page.locator('.result .run-ticket-reward').innerText();assert.match(text,new RegExp(`ガチャ券 \\+${drop?2:1}枚`));assert.match(text,/幕クリア保証1枚/);
  assert.equal((await saved()).inventory.weaponTicket,total);
  await page.screenshot({path:`${out}/clear-${run}.png`});await page.locator('#home-button').tap();
  await page.locator('[data-menu-tab="weapons"]').tap();assert.equal(await page.locator('#weapon-ticket-count').innerText(),`${total}枚`);
  await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:120000});assert.equal((await saved()).inventory.weaponTicket,total);
  checks.push({run,bossDrop:drop,savedTickets:total,result:text});
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({checks,errors},null,2));console.log('PASS clear reward, repeat reward, additive boss drop, result text, menu wallet and reload persistence');
}finally{await browser.close();}
