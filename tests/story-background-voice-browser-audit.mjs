import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';
import {maxedHeheProfile} from './chapter-six-extra-fixtures.js';

const url=process.env.LUNARIA_URL??'http://localhost:5187/',out=process.env.VOICE_AUDIT_OUT??'audit/story-background-voice-20261003';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'});
await context.addInitScript(profile=>{
 localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));
 localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['nyanluna','tsukineko'],lead:'nyanluna'}));
 localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:true,music:false,voice:false}));
},maxedHeheProfile());
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
try{
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});
 await page.locator('#start').click();await page.locator('[data-chapter="6"]').click();await page.locator('[data-act="28"]').click();await page.locator('#chapter-start').click();
 await page.waitForSelector('#story-dialog[open]');
 const backdrop=await page.locator('#story-dialog').evaluate(async el=>{const css=el.style.getPropertyValue('--story-image'),src=css.match(/url\(['"]?(.*?)['"]?\)/)[1],i=new Image();i.src=src;await i.decode();return {css,src,width:i.naturalWidth,height:i.naturalHeight,speaker:el.dataset.speaker};});
 assert.match(backdrop.src,/kemo-village-background-v2\.png$/);assert.equal(backdrop.speaker,'narrator');assert.ok(backdrop.width>1200&&backdrop.height>700);assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);
 await page.screenshot({path:out+'/narrator-mobile.png'});pass('Chapter-seven opening loads the new background-only asset on a phone',backdrop);
 const scenes=await page.evaluate(async()=>{const {SEVENTH_CHAPTER_SCENES,SEVENTH_CHAPTER_STORY_BACKGROUND}=await import('/src/chapter-seven.js'),t=window.__LUNARIA_TEST__,result=[];for(const act of SEVENTH_CHAPTER_SCENES)for(const scene of Object.values(act)){t.story.show(scene,()=>{});result.push({title:scene.title,background:t.story.dialog.style.getPropertyValue('--story-image'),expected:scene.image===SEVENTH_CHAPTER_STORY_BACKGROUND});}return result;});
 assert.equal(scenes.length,16);assert.ok(scenes.every(s=>s.expected&&s.background.includes('kemo-village-background-v2.png')));pass('All sixteen story dialogs reference the regenerated character-free backdrop');
 await page.evaluate(async()=>{const {SEVENTH_CHAPTER_SCENES}=await import('/src/chapter-seven.js'),t=window.__LUNARIA_TEST__;t.story.show(SEVENTH_CHAPTER_SCENES[0].ruins,()=>{});});
 await page.waitForFunction(()=>document.querySelector('.story-character-image').complete&&document.querySelector('.story-character-image').naturalWidth>0);
 assert.match(await page.locator('.story-character-image').getAttribute('src'),/lumi-story-v1\.png$/);assert.equal(await page.locator('#story-dialog').getAttribute('data-speaker'),'lumi');await page.screenshot({path:out+'/lumi-mobile.png'});
 await page.setViewportSize({width:1280,height:800});await page.screenshot({path:out+'/lumi-desktop.png'});pass('Lumi remains a separate unchanged foreground portrait, not baked into the background');
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.story.cancel();t.voice.setMode('battle');t.voice.configure(true,.85);t.audio.setEnabled(true);t.voice.init();});
 const decoded=await page.evaluate(async()=>{const {VOICE_MANIFEST}=await import('/src/voice-manifest.js'),t=window.__LUNARIA_TEST__,rows=[];for(const [id,item]of Object.entries(VOICE_MANIFEST).filter(([,v])=>v.who==='nyanluna'&&v.kind==='battle')){const b=await t.voice.load(id);if(!b)throw Error(id+': '+t.voice.lastError);const d=b.getChannelData(0);let peak=0;for(const v of d)peak=Math.max(peak,Math.abs(v));rows.push({id,file:item.file,duration:b.duration,declared:item.duration,channels:b.numberOfChannels,peak});}return rows;});
 assert.equal(decoded.length,27);for(const row of decoded){assert.equal(row.channels,1);assert.ok(Math.abs(row.duration-row.declared)<.015,row.id);assert.ok(row.peak<.81,row.id);}
 for(const row of decoded){const digest=createHash('sha256').update(await readFile('public/'+row.file)).digest('hex');assert.ok(row.file.endsWith('-'+digest.slice(0,12)+'.mp3'));assert.equal(row.file,VOICE_MANIFEST[row.id].file);}
 pass('All 27 revised battle clips download and decode through the actual voice player', {clips:decoded.length,seconds:decoded.reduce((n,v)=>n+v.duration,0)});
 const playback=await page.evaluate(async()=>{const t=window.__LUNARIA_TEST__,v=t.voice,result=[];await t.audio.ctx.resume();for(const id of ['nyanluna-attack-1','nyanluna-hurt-1','nyanluna-ultimate-1','nyanluna-switch-1','nyanluna-switch-2','nyanluna-heal-1','nyanluna-wave-1','nyanluna-support-1','nyanluna-exit-1','nyanluna-dash-2','nyanluna-attack-2']){const played=await v.play(id,{interrupt:true}),item=v.manifest[id],expected=.5*10**(item.normalizationDb/20);await new Promise(resolve=>setTimeout(resolve,30));result.push({id,played,gain:v.clipGain.gain.value,expected,voiceVolume:v.gain.gain.value});v.stop();}v.configure(false);return {result,muted:!v.audible,current:v.current,lastError:v.lastError};});
 console.log('PLAYBACK',JSON.stringify(playback));
 for(const row of playback.result){assert.equal(row.played,true);assert.ok(Math.abs(row.gain-row.expected)<1e-6);assert.ok(Math.abs(row.voiceVolume-.85)<1e-6);}assert.equal(playback.muted,true);assert.equal(playback.current,null);assert.equal(playback.lastError,null);pass('Attack, hurt, ultimate, seven consistency retakes and cleaned Hikari play with calibrated gain; voice mute remains effective',playback);
 assert.deepEqual(errors,[]);await writeFile(out+'/browser-report.json',JSON.stringify({url,checks,errors,decoded},null,2));
}catch(e){await writeFile(out+'/browser-report.json',JSON.stringify({url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
