import {chromium} from '@playwright/test';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const OUTPUT=process.env.VOICE_AUDIT_DIR||'audit/voices-v127';
const BASE=process.env.LUNARIA_URL||'http://127.0.0.1:5177/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],checks=[];const pass=name=>{checks.push(name);console.log('PASS',name);};
await mkdir(OUTPUT,{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(BASE);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.locator('[data-open="settings"]').tap();await page.locator('#setting-music').uncheck();await page.selectOption('#setting-quality','low');await page.locator('#setting-voice-volume').fill('44');await page.locator('[data-close]').first().tap();
 await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.locator('[data-open="settings"]').tap();assert.equal(await page.locator('#setting-voice-volume').inputValue(),'44');assert.equal(await page.locator('#setting-voice').isChecked(),true);await page.locator('[data-close]').first().tap();pass('Voice settings persist without modifying game progression');
 await page.locator('#start').tap();await page.locator('#chapter-start').tap();await page.waitForFunction(()=>!!window.__LUNARIA_TEST__.voice.current?.source);
 const expected=()=>page.evaluate(()=>{const t=window.__LUNARIA_TEST__;return {text:t.story.scene.lines[t.story.index].text,actual:t.voice.manifest[t.voice.current?.id]?.text,context:t.voice.sound.ctx.state,mode:t.voice.mode};});
 let state=await expected();assert.equal(state.text,state.actual);assert.equal(state.mode,'story');assert.equal(state.context,'running');pass('Opening narration plays from the real start gesture');
 await page.locator('#story-next').tap();await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source&&window.__LUNARIA_TEST__.voice.current.id.startsWith('nyanluna-'));state=await expected();assert.equal(state.text,state.actual);
 await page.evaluate(()=>window.__oldVoiceSource=window.__LUNARIA_TEST__.voice.current.source);await page.locator('#story-voice').tap();await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source&&window.__LUNARIA_TEST__.voice.current.source!==window.__oldVoiceSource);pass('Story advancement changes speaker and replay restarts the current line');
 for(const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await page.setViewportSize(size);const layout=await page.evaluate(()=>{const els=['#story-voice','#story-next','#story-skip'].map(s=>document.querySelector(s).getBoundingClientRect());return {overflow:document.body.scrollWidth>innerWidth,buttons:els.every(r=>r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1)};});assert.deepEqual(layout,{overflow:false,buttons:true});await page.screenshot({path:`${OUTPUT}/story-${size.width}.png`});
 }pass('Replay and story navigation fit narrow phones and landscape');await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.current),null);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>!!window.__LUNARIA_TEST__.voice.current?.source);pass('Backgrounding stops the voice and foregrounding resumes dialogue');
 await page.locator('#story-skip').tap();await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.mode==='tutorial'&&!!window.__LUNARIA_TEST__.voice.current?.source);const firstTutorial=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;return {text:t.game.tutorial.step.text,spoken:t.voice.manifest[t.voice.current.id].text};});assert.equal(firstTutorial.text,firstTutorial.spoken);
 await page.locator('#tutorial-next').tap();await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source&&window.__LUNARIA_TEST__.voice.manifest[window.__LUNARIA_TEST__.voice.current.id]?.text===window.__LUNARIA_TEST__.game.tutorial.step.text);await page.locator('#tutorial-skip').tap();await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.pause();t.voice.stop();});pass('Tutorial instructions follow the actual tutorial step and end on skip');
 for(const [event,action,prefix] of [
  ['damage','t.game.player.invincible=0;t.game.hurt(4,0,0);','nyanluna-hurt-'],
  ['heal','t.game.heal(4);','nyanluna-heal-'],
  ['ultimate','t.game.player.charge=100;t.game.ultimate();','nyanluna-ultimate-'],
 ]){
  await page.evaluate(action=>{const t=window.__LUNARIA_TEST__;t.voice.stop();t.voice.cooldowns.clear();t.game.phase='playing';new Function('t',action)(t);t.game.pause();t.step(0);},action);
  await page.waitForFunction(prefix=>window.__LUNARIA_TEST__.voice.current?.source&&window.__LUNARIA_TEST__.voice.current.id.startsWith(prefix),prefix);pass(`Real ${event} event plays the active character's voice`);
 }
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.voice.stop();t.voice.cooldowns.clear();t.voice.handle([{type:'ultimate',hero:0},{type:'characterXp',heroId:'tsukineko',before:2,level:3}],t.game);});await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source?.buffer);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.queue[0]?.id),'tsukineko-levelup-1');pass('An ally level-up waits for the ultimate instead of being lost');
 const decoded=await page.evaluate(async()=>{const v=window.__LUNARIA_TEST__.voice;v.stop();let count=0,maxCache=0;for(const id of Object.keys(v.manifest)){const b=await v.load(id);if(!b||!Number.isFinite(b.duration)||b.duration<=0)throw Error(`Undecodable: ${id} ${v.lastError}`);count++;maxCache=Math.max(maxCache,[...v.cache.values()].reduce((n,b)=>n+b.length*b.numberOfChannels*4,0));}return {count,maxCache};});assert.equal(decoded.count,Object.keys(VOICE_MANIFEST).length);assert.ok(decoded.maxCache<=16*1024*1024);pass(`All ${decoded.count} MP3 files decode in the browser with bounded audio memory`);
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.voice.setMode('battle');t.voice.cooldowns.clear();t.voice.cue('omsolo','ultimate');});await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source);await page.evaluate(()=>window.__LUNARIA_TEST__.voice.configure(false,.44));assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.current),null);assert.deepEqual(errors,[]);pass('Muting stops speech immediately; no browser or asset errors');
 await writeFile(`${OUTPUT}/browser-report.json`,JSON.stringify({date:new Date().toISOString(),checks,decoded,errors},null,2));await context.close();
}finally{await browser.close();}
