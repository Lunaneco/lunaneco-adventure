import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';
const BASE=process.env.LUNARIA_URL||'http://127.0.0.1:5177/';
const OUTPUT=process.env.VOICE_AUDIT_DIR||'audit/voices-v129';
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[];const pass=name=>{checks.push(name);console.log('PASS',name);};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await context.addInitScript(()=>{
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:true,voice:true,voiceVolume:.44,music:false,quality:'low',motion:false}));
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(8).fill(true)},tutorial:{firstBattleCompleted:true}}));
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(BASE);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.locator('#chapter-menu-open').tap();let voiced=0,silent=0;
 for(let act=0;act<8;act++){
  await page.locator(`[data-chapter="${Math.floor(act/4)}"]`).tap();
  await page.locator(`[data-act="${act}"]`).tap();await page.locator('#chapter-story').tap();
  const lines=await page.evaluate(()=>window.__LUNARIA_TEST__.story.scene.lines);
  for(let index=0;index<lines.length;index++){
   const line=lines[index];assert.equal(await page.locator('.story-dialogue>p').innerText(),line.text);
   assert.equal(await page.locator('#story-voice').count(),line.voiced?1:0);
   if(line.voiced){
    await page.waitForFunction(text=>{const v=window.__LUNARIA_TEST__.voice;return v.current?.source&&v.manifest[v.current.id].text===text;},line.text);voiced++;
   }else{
    const state=await page.evaluate(()=>{const v=window.__LUNARIA_TEST__.voice;return {current:v.current,mode:v.mode,resume:v.resumeLine,queued:v.queue.length,battle:v.cue('nyanluna','attack')};});
    assert.deepEqual(state,{current:null,mode:'story',resume:null,queued:0,battle:false});silent++;
   }
   const fits=await page.locator('#story-next').evaluate(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;});assert.ok(fits,`${act}/${index}`);
   await page.locator('#story-next').tap();
  }
  assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.current),null);
 }
 assert.equal(voiced,46);assert.equal(silent,79);pass('All 125 story lines remain readable; only 46 selected lines play, including in all eight act replays');
 pass('Silent scenes hide replay, stop previous speech and prevent battle chatter without hiding the dialogue');
 const id='nyanluna-df12363a',item=VOICE_MANIFEST[id];let held;
 await page.route(`**/${item.file}`,route=>{held=route;});
 await page.evaluate(async id=>{
  const {ACT_SCENES}=await import('/src/chapter.js'),t=window.__LUNARIA_TEST__;
  t.voice.cache.delete(id);t.story.show({...ACT_SCENES[0].opening,lines:[ACT_SCENES[0].opening.lines[1]]},()=>{});
 },id);
 for(let i=0;i<100&&!held;i++)await page.waitForTimeout(50);assert.ok(held,'Expected a pending audio request');
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.story.show({...t.story.scene,lines:[{...t.story.scene.lines[0],voiced:false}]},()=>{});});
 await held.continue();await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.loading.size===0);
 assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.current),null);assert.equal(await page.locator('#story-voice').count(),0);
 await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));});
 assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.current),null);
 pass('A delayed voice load cannot start after entering a silent line, including after background/foreground');
 assert.deepEqual(errors,[]);await mkdir(OUTPUT,{recursive:true});await writeFile(`${OUTPUT}/story-selection-report.json`,JSON.stringify({checks,voiced,silent,errors},null,2));
 await context.close();
}finally{await browser.close();}
