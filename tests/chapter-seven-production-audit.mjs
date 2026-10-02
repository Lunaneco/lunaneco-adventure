import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {CHAPTER_SEVEN_VOICE_MANIFEST} from '../src/chapter-seven-voice-manifest.js';
const url=process.env.LUNARIA_URL??'http://127.0.0.1:4176/lunaneco-adventure/',out='audit/chapter-seven';
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
try{
 for(const initial of [true,false]){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.addInitScript(initial=>{
   const ids=['nyanluna','tsukineko','omsolo','mochinyafe','shizuku','prim','hehereal','lumi'];
   localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array.from({length:32},(_,i)=>(i<20||i>=24)&&i<(initial?29:32))},characters:Object.fromEntries(ids.map(id=>[id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}}));
   localStorage.setItem('lunaria-party-v1',JSON.stringify({members:initial?['nyanluna','prim']:['lumi','mochinyafe'],lead:initial?'prim':'lumi'}));
   localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,voice:false,music:false,motion:false}));
  },initial);
  await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
  await page.locator('#start').click();await page.locator('[data-chapter="6"]').click();await page.locator('[data-act="29"]').click();assert.match(await page.locator('.stage-briefing').innerText(),/推奨 Lv.60/);assert.match(await page.locator('.brief-party-rule').innerText(),initial?/もちにゃふぇ操作固定/:/自由編成/);
  await page.locator('#chapter-start').click();await page.waitForFunction(()=>{const i=document.querySelector('.story-character-image');return i?.complete&&i.naturalWidth>0;});await page.screenshot({path:`${out}/production-story-${initial?'first':'replay'}.png`});await page.locator('#story-skip').click();
  assert.equal(await page.locator('#hero-name').innerText(),initial?'もちにゃふぇ':'ねこるみ');assert.equal(await page.locator('#switch-action').isVisible(),!initial);
  assert.match(await page.locator('#switch .portrait').evaluate(e=>getComputedStyle(e).backgroundImage),initial?/mochi/:/nekolumi-face/);await page.screenshot({path:`${out}/production-mobile-${initial?'first':'neko'}.png`});
  if(!initial){
   await page.locator('#switch-action').click();assert.equal(await page.locator('#hero-name').innerText(),'もちにゃふぇ');await page.locator('#switch-action').click();assert.equal(await page.locator('#hero-name').innerText(),'ねこるみ');
   const paths=[...Object.values(CHAPTER_SEVEN_VOICE_MANIFEST).map(v=>v.file),'assets/equipment/lumi-rail-cyan-v1.png','assets/equipment/lumi-rail-violet-v1.png','assets/equipment/lumi-rail-rose-v1.png','assets/ultimates/lumi-railgun-v1.png','assets/ultimates/nekolumi-infinite-rail-v1.png'];
   const valid=await page.evaluate(async({paths,url})=>{const results=await Promise.all(paths.map(async path=>{const r=await fetch(new URL(path,url));return r.ok&&(await r.arrayBuffer()).byteLength>1000;}));return results.every(Boolean);},{paths,url});assert.equal(valid,true);
  }
  checks.push({name:initial?'Production first-clear solo rule':'Production free duo, Neko portraits and switching',passed:true});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/production-report.json`,JSON.stringify({url,checks,voiceClips:37,errors},null,2));console.log('PASS production chapter seven, normal/Neko art, all 37 voices, mobile and party rules');
}catch(e){await writeFile(`${out}/production-report.json`,JSON.stringify({url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
