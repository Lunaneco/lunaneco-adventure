import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {MUSIC_TRACKS} from '../src/music.js';
const OUT=process.env.MUSIC_AUDIT_DIR||'audit/bgm-v134',BASE=process.env.LUNARIA_URL||'http://127.0.0.1:5177/';
await mkdir(OUT,{recursive:true});
const engine=process.env.MUSIC_BROWSER||'chrome';
const browser=await(engine==='webkit'?webkit.launch({headless:true,...(process.env.MUSIC_BROWSER_PATH?{executablePath:process.env.MUSIC_BROWSER_PATH}:{})}):chromium.launch({channel:'chrome',headless:true})),checks=[],errors=[];
const pass=s=>{checks.push(s);console.log('PASS',s);};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await context.addInitScript(()=>{
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:true,voice:false,music:true,quality:'low'}));
  window.__musicPlays=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__musicPlays.push(this.src);return play.apply(this,args);};
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const state=()=>page.evaluate(()=>{const a=window.__LUNARIA_TEST__.audio,b=a.bgm;return {scene:a.scene,track:b.track,paused:b.media.paused,time:b.media.currentTime,src:b.media.currentSrc,loop:b.media.loop,rate:b.media.playbackRate,volume:b.volume,error:b.lastError,context:a.ctx.state,plays:window.__musicPlays.length};});
 const waitTrack=track=>page.waitForFunction(track=>{const a=window.__LUNARIA_TEST__.audio;return a.bgm.track===track&&!a.bgm.media.paused&&a.bgm.media.currentTime>.05;},track);
 await page.goto(BASE);await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.locator('#start').tap();await page.locator('#chapter-start').tap();await waitTrack('field');
 let s=await state();assert.ok(s.src.endsWith(MUSIC_TRACKS.field.file));assert.equal(s.loop,true);assert.equal(s.rate,1);assert.equal(s.context,'running');assert.equal(s.error,null);
 pass('The real start tap plays the supplied field track at its original speed');
 await page.locator('#story-skip').tap();if(await page.locator('#tutorial-skip').isVisible())await page.locator('#tutorial-skip').tap();
 await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=999;g.player.invincible=999;});
 const plays=s.plays;await page.waitForTimeout(350);s=await state();assert.equal(s.plays,plays);assert.ok(s.time>.2);pass('Frames and tutorial transitions do not restart or duplicate the music');
 await page.locator('#pause').tap();const paused=await state();await page.waitForTimeout(250);s=await state();assert.equal(s.paused,true);assert.ok(Math.abs(s.time-paused.time)<.05);await page.locator('#resume').tap();await waitTrack('field');assert.ok((await state()).time>=paused.time);pass('Pause/resume preserves the song position');
 await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;g.spawnEnemy('boss',g.player.x+7,g.player.z,{elite:true});});await waitTrack('boss');s=await state();assert.ok(s.src.endsWith(MUSIC_TRACKS.boss.file));pass('A strong-route boss switches to the supplied boss track');
 await page.evaluate(()=>{const v=window.__LUNARIA_TEST__.voice;v.configure(true,.44);v.dialogue('nyanluna','「ほどけても結び直せばいい」って、いつも言ってたよね。うん。離れても、また会える。');});
 await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source);assert.ok(Math.abs((await state()).volume-MUSIC_TRACKS.boss.volume*.28)<.0001);await page.evaluate(()=>{window.__LUNARIA_TEST__.voice.stop();window.__LUNARIA_TEST__.voice.configure(false);});assert.equal((await state()).volume,MUSIC_TRACKS.boss.volume);pass('Dialogue ducks the new music and restores it without restarting');
 for(const track of ['boss','field']){
  if(track==='field'){await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;for(const e of g.enemies.filter(e=>e.type==='boss'))g.hit(e,e.hp+1,e.x,e.z);});await waitTrack('field');pass('Defeating the boss returns to field music');}
  await page.waitForFunction(()=>Number.isFinite(window.__LUNARIA_TEST__.audio.bgm.media.duration));
  await page.evaluate(()=>{const m=window.__LUNARIA_TEST__.audio.bgm.media;m.currentTime=m.duration-.25;});
  await page.waitForFunction(()=>{const m=window.__LUNARIA_TEST__.audio.bgm.media;return !m.paused&&m.currentTime<2;},{},{timeout:10000});pass(`${track} loops across its ending without stopping`);
 }
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await state()).paused,true);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal((await state()).paused,true);await page.locator('#resume').tap();await waitTrack('field');pass('Backgrounding pauses music and resume continues it');
 await page.locator('#pause').tap();await page.locator('#quit').tap();await page.locator('#menu-title').tap();assert.equal((await state()).paused,true);assert.equal((await state()).track,null);
 await page.locator('#home [data-open=settings]').tap();await page.locator('#setting-music').uncheck();assert.equal(await page.locator('#setting-sound').isChecked(),true);await page.locator('#modal .primary[data-close]').tap();await page.locator('#start').tap();await page.locator('#chapter-start').tap();await page.waitForTimeout(350);assert.equal((await state()).paused,true);
 pass('Music OFF stops tracks while leaving the sound-effects setting enabled');
 assert.deepEqual(errors,[]);assert.equal((await state()).error,null);await writeFile(`${OUT}/${engine}-browser-report.json`,JSON.stringify({checks,errors},null,2));await context.close();
}finally{await browser.close();}
