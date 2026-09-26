// Requires local ffmpeg. Measures the real VoicePlayer output, including both Web Audio gain stages.
import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';
import {BATTLE_VOICE_TARGET_LUFS,BATTLE_VOICE_VOLUME,voicePlaybackGain} from '../src/voice-policy.js';
const BASE=process.env.LUNARIA_URL||'http://127.0.0.1:5185/';
const OUT=process.env.VOICE_AUDIT_DIR||'audit/voices-v146';
const engine=process.env.VOICE_BROWSER||'chromium';
const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const rows=[],errors=[];await mkdir(OUT,{recursive:true});
try{
 const context=await browser.newContext();
 await context.addInitScript(()=>{
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:true,voice:true,voiceVolume:.44,music:false,quality:'low',motion:false}));
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(8).fill(true)},tutorial:{firstBattleCompleted:true}}));
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 const entries=Object.entries(VOICE_MANIFEST).filter(([,v])=>v.kind==='battle');
 entries.push(Object.entries(VOICE_MANIFEST).find(([,v])=>v.kind==='story'&&v.who==='tsukineko'));
 entries.push(Object.entries(VOICE_MANIFEST).find(([,v])=>v.kind==='tutorial'));
 for(const [id,item] of entries){
  const result=await page.evaluate(async id=>{
   const {VoicePlayer}=await import('/src/voice-player.js'),{VOICE_MANIFEST}=await import('/src/voice-manifest.js');
   const decoder=new OfflineAudioContext(1,1,48000),response=await fetch(VOICE_MANIFEST[id].file);
   const input=await decoder.decodeAudioData(await response.arrayBuffer());
   const ctx=new OfflineAudioContext(input.numberOfChannels,input.length,48000),sound={ctx,enabled:true,init(){}};
   const player=new VoicePlayer(sound,{volume:1});player.cache.set(id,input);player.setMode(id.includes('-ultimate-')?'ultimate':'battle');
   if(!await player.play(id))throw Error(`Could not render ${id}`);
   const output=await ctx.startRendering(),pcm=output.getChannelData(0),source=input.getChannelData(0);
   let inputPower=0,outputPower=0;for(let i=0;i<pcm.length;i++){inputPower+=source[i]**2;outputPower+=pcm[i]**2;}
   const bytes=new Uint8Array(pcm.buffer,pcm.byteOffset,pcm.byteLength);let binary='';
   for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   return {pcm:btoa(binary),ratio:Math.sqrt(outputPower/inputPower),gain:player.clipGain.gain.value};
  },id);
  const gain=voicePlaybackGain(item);assert.ok(Math.abs(result.ratio-gain)<1e-6,`${id}: Web Audio gain mismatch`);
  const reference=spawnSync('ffmpeg',['-v','error','-i',`public/${item.file}`,'-f','f32le','-ac','1','-ar','48000','pipe:1'],{maxBuffer:16*1024*1024});assert.equal(reference.status,0);
  const rendered=Buffer.from(result.pcm,'base64'),extraFrames=(rendered.length-reference.stdout.length)/4;
  // MP3 decoders retain different encoder padding. Align actual samples before comparing loudness gates.
  assert.ok(Number.isInteger(extraFrames)&&extraFrames>=0&&extraFrames<=2304,`${id}: unexpected decoder padding`);
  const expected=new Float32Array(Uint8Array.from(reference.stdout).buffer),actual=new Float32Array(Uint8Array.from(rendered).buffer);
  let peakIndex=0;for(let i=1;i<expected.length;i++)if(Math.abs(expected[i])>Math.abs(expected[peakIndex]))peakIndex=i;
  const start=Math.max(0,peakIndex-5000),end=Math.min(expected.length,start+12000);let offset=0,bestError=Infinity;
  for(let shift=0;shift<=extraFrames;shift++){let error=0;for(let i=start;i<end;i+=13)error+=(actual[i+shift]-expected[i]*gain)**2;if(error<bestError){bestError=error;offset=shift;}}
  const aligned=rendered.subarray(offset*4,offset*4+reference.stdout.length);let squaredError=0;
  for(let i=0;i<aligned.length;i+=4)squaredError+=(aligned.readFloatLE(i)-reference.stdout.readFloatLE(i)*gain)**2;
  const rmsError=Math.sqrt(squaredError/(aligned.length/4));assert.ok(rmsError<.0001,`${id}: decoded waveform error ${rmsError}, offset ${offset}, extra frames ${extraFrames}`);
  const measured=spawnSync('ffmpeg',['-hide_banner','-nostats','-f','f32le','-ar','48000','-ac','1','-i','pipe:0','-af','loudnorm=print_format=json','-f','null','-'],{input:aligned});
  assert.equal(measured.status,0,measured.stderr.toString());const log=measured.stderr.toString(),level=JSON.parse(log.slice(log.lastIndexOf('{'),log.lastIndexOf('}')+1));
  const row={id,gain:result.ratio,paddingFrames:offset,rmsError,lufs:Number(level.input_i),truePeak:Number(level.input_tp)};rows.push(row);
  if(item.kind==='battle'){assert.ok(Math.abs(row.lufs-(BATTLE_VOICE_TARGET_LUFS+20*Math.log10(BATTLE_VOICE_VOLUME)))<.15,`${id}: ${row.lufs} LUFS`);assert.ok(row.truePeak<-6,`${id}: unexpected peak`);}
 }
 console.log(`PASS ${entries.filter(([,v])=>v.kind==='battle').length} battle clips render at matching loudness and 50% gain; dialogue/tutorial gain stays unchanged`);
 await page.locator('[data-open=settings]').click();await page.locator('#modal .primary[data-close]').click();
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.start();t.game.enemies=[];t.game.player.hero=1;t.game.pause();t.game.drainEvents();t.voice.stop();const tone=t.audio.tone.bind(t.audio);window.__damageTones=[];t.audio.tone=(...args)=>{window.__damageTones.push({frequency:args[0],duration:args[1],waveform:args[2]});return tone(...args);};});
 for(let i=0;i<4;i++){
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;t.voice.stop();t.voice.cooldowns.clear();window.__damageTones=[];g.phase='playing';g.player.hp=g.player.maxHp;g.player.invincible=0;g.hurt(1,0,0);g.pause();t.step(0);});
  await page.waitForFunction(()=>!!window.__LUNARIA_TEST__.voice.current?.source);
  const state=await page.evaluate(()=>{const v=window.__LUNARIA_TEST__.voice;return {text:v.manifest[v.current.id].text,clipGain:v.clipGain.gain.value,volume:v.gain.gain.value,effects:window.__damageTones};});
  assert.equal(state.text,'いたっ！');assert.ok(Math.abs(state.volume-.44)<1e-6);assert.ok(Math.abs(state.clipGain-voicePlaybackGain(VOICE_MANIFEST['tsukineko-hurt-1']))<1e-6);
  assert.equal(state.effects.length,1);assert.equal(state.effects[0].waveform,'sine');assert.ok(state.effects[0].frequency>300&&state.effects[0].duration<=.1,'Tsukineko damage must not add a low, rough grunt-like effect');
 }
 console.log('PASS repeated in-game Tsukineko damage only plays the remaining line with normalized half-volume and the saved volume setting');
 assert.deepEqual(errors,[]);await writeFile(`${OUT}/${engine}-loudness-report.json`,JSON.stringify({engine,rows,errors},null,2));await context.close();
}finally{await browser.close();}
