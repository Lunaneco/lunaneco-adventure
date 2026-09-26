import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/weapon-batch',base=process.env.LUNARIA_URL||'http://127.0.0.1:5177/';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[],checks=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await context.addInitScript(()=>{
  if(sessionStorage.getItem('ten-draw-audit'))return;sessionStorage.setItem('ten-draw-audit','1');
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:true,sound:false,music:false,voice:false}));
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({inventory:{weaponTicket:31},story:{version:2,actClears:Array(8).fill(true)},tutorial:{firstBattleCompleted:true}}));
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
 const openGacha=async()=>{await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.locator('#chapter-menu-open').tap();await page.locator('[data-menu-tab="weapons"]').tap();};
 const draw=async(values,twice=false)=>page.evaluate(({values,twice})=>{const previous=Math.random,rolls=[...values];Math.random=()=>rolls.length?rolls.shift():previous();try{const b=document.querySelector('[data-draw-weapons]');b.click();if(twice)b.click();}finally{Math.random=previous;}},{values,twice});
 const close=async()=>{await page.waitForTimeout(400);await page.locator('#weapon-draw-result [data-close]').tap();await page.waitForFunction(()=>!window.__LUNARIA_TEST__.weaponSummon.active);};
 await page.goto(base);await openGacha();assert.equal(await page.locator('[data-draw-weapons]').isDisabled(),false);
 const rolls=Array.from({length:10},(_,i)=>[i<3?0:i<6?.4:.8,i===4?.99:.1,0]).flat();
 await draw(rolls,true);let p=await saved();assert.equal(p.inventory.weaponTicket,21);assert.equal(p.weapons.draws,10);assert.equal(p.weapons.lastBatch.length,10);
 assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.weaponSummon.current.plan.rank),4);
 // Freeze the real presentation at each beat to inspect touch layouts without changing the draw.
 for(const [phase,time] of [['gather',2.5],['eclipse',3.5],['burst',4],['cards',6.7]]){
  await page.evaluate(time=>new Promise(resolve=>{const s=window.__LUNARIA_TEST__.weaponSummon;s.setHidden(false);const wait=()=>{if(s.current.t>=time){s.setHidden(true);resolve();}else requestAnimationFrame(wait);};wait();}),time);
  assert.equal(await page.locator('.batch-star').count(),10);
  await page.screenshot({path:`${out}/cinematic-${phase}.png`});
 }
 const frozen=await page.evaluate(()=>window.__LUNARIA_TEST__.weaponSummon.current.t);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.weaponSummon.current.t),frozen);
 await page.evaluate(()=>window.__LUNARIA_TEST__.weaponSummon.setHidden(false));
 await page.waitForSelector('.batch-cinematic.is-spotlight');
 assert.equal(await page.locator('.batch-spotlight-copy p').innerText(),'つきねこ専用');
 assert.equal(await page.locator('.batch-spotlight-copy h3').innerText(),'星穿銃・ノクス');
 await page.waitForTimeout(250);await page.screenshot({path:`${out}/cinematic-legend.png`});
 await page.waitForFunction(()=>window.__LUNARIA_TEST__.weaponSummon.finished);
 await page.waitForTimeout(750);assert.equal(await page.locator('.batch-cinematic').count(),0);
 assert.deepEqual(await saved(),p);

 assert.equal(await page.locator('#weapon-draw-result [data-batch-item]').count(),10);assert.match(await page.locator('.batch-result-header').innerText(),/新規 4本 ／ 重複 6本/);assert.match(await page.locator('.batch-result-header').innerText(),/星の芽 \+30/);
 for(const [width,height] of [[320,640],[390,844],[844,390],[1440,900]]){
  await page.setViewportSize({width,height});
  const fit=await page.locator('#weapon-draw-result [data-close]').evaluate(el=>{const r=el.getBoundingClientRect(),card=document.querySelector('#weapon-draw-result');return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height,overflow:card.scrollWidth>card.clientWidth+1};});
  assert.ok(fit.left>=0&&fit.right<=width+1&&fit.top>=0&&fit.bottom<=height+1&&fit.height>=44,JSON.stringify(fit));assert.equal(fit.overflow,false);
  await page.locator('#weapon-draw-result [data-batch-item]').last().scrollIntoViewIfNeeded();assert.equal(await page.locator('#weapon-draw-result [data-close]').isVisible(),true);
  await page.screenshot({path:`${out}/results-${width}.png`});
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#weapon-draw-result [data-equip-weapon="nox-rifle-r4"]').tap();assert.equal((await saved()).weapons.loadout.tsukineko,'nox-rifle-r4');assert.equal((await saved()).inventory.weaponTicket,21);assert.equal(await page.locator('#weapon-draw-result [data-batch-item]').count(),10);
 await close();assert.equal(await page.evaluate(()=>document.activeElement.matches('[data-draw-weapons]')),true);assert.equal(await page.locator('.last-weapon-batch [data-batch-item]').count(),10);
 checks.push('One ten-ticket transaction despite double click; natural ten-star presentation, eclipse, matching legendary cut-in, frozen background clock; ten results, duplicate totals, equip and responsive close button');
 // Reload during the next animation: rewards are already saved and remain available.
 await draw(Array(30).fill(0));const pending=await saved();assert.equal(pending.inventory.weaponTicket,11);await page.reload();await openGacha();assert.deepEqual(await saved(),pending);assert.equal(await page.locator('.last-weapon-batch [data-batch-item]').count(),10);
 checks.push('All ten results and duplicate grants survive reload during the animation');
 // Reduced motion finishes naturally, then the single-draw flow still works.
 await page.evaluate(()=>{const settings=JSON.parse(localStorage.getItem('lunaria-settings-v1'));settings.motion=false;localStorage.setItem('lunaria-settings-v1',JSON.stringify(settings));});
 await page.reload();await openGacha();await draw(Array(30).fill(0));await page.waitForFunction(()=>window.__LUNARIA_TEST__.weaponSummon.finished);assert.equal(await page.locator('#weapon-draw-result [data-batch-item]').count(),10);assert.equal((await saved()).inventory.weaponTicket,1);await close();assert.equal(await page.locator('[data-draw-weapons]').isDisabled(),true);
 await page.locator('[data-draw-weapon]').tap();await page.waitForFunction(()=>window.__LUNARIA_TEST__.weaponSummon.finished);assert.equal(await page.locator('.weapon-draw-result').count(),1);assert.equal(await page.locator('.weapon-batch-result').count(),0);assert.equal((await saved()).weapons.lastBatch,null);assert.equal((await saved()).inventory.weaponTicket,0);await close();
 assert.equal(await page.locator('[data-draw-weapons]').isDisabled(),true);assert.equal(await page.locator('[data-draw-weapon]').isDisabled(),true);
 checks.push('Reduced motion, exhausted ticket buttons, focus return and subsequent single draw');
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({checks,errors},null,2));console.log('PASS',JSON.stringify(checks));
}finally{await browser.close();}
