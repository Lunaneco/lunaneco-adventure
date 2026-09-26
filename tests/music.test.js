import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {MusicPlayer,MUSIC_TRACKS,musicScene} from '../src/music.js';
import {cachedMediaResponse} from '../src/offline-range.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness(){
 const media={paused:true,currentTime:0,plays:0,loads:0,play(){this.plays++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;},load(){this.loads++;this.currentTime=0;},addEventListener(){}};
 const gain={value:0,setTargetAtTime(value){this.value=value;}};
 const ctx={state:'running',currentTime:0,destination:{},createMediaElementSource(){return {connect(){}};},createGain(){return {gain,connect(){}};}};
 const player=new MusicPlayer({createMedia:()=>media});player.attach(ctx);
 return {player,media,ctx,gain};
}
test('boss music follows living bosses on both routes; defeated bosses and the menu release it',()=>{
 assert.equal(musicScene(null),'menu');
 for(const elite of [false,true]){const boss={type:'boss',hp:100,elite},g={phase:'playing',enemies:[boss]};assert.equal(musicScene(g),'boss');g.phase='ultimateIntro';assert.equal(musicScene(g),'boss');boss.hp=0;assert.equal(musicScene(g),'field');boss.hp=100;g.phase='defeat';assert.equal(musicScene(g),'field');}
 assert.equal(musicScene({phase:'playing',enemies:[{type:'mage',hp:100}]}),'field');
});
test('long tracks stream and loop at their original speed without per-frame restart',async()=>{
 const {player,media}=harness();player.update({scene:'field'});await flush();media.currentTime=42;
 for(let i=0;i<180;i++)player.update();
 assert.equal(media.loop,true);assert.equal(media.playbackRate,1);assert.equal(media.plays,1);assert.equal(media.loads,1);assert.equal(media.currentTime,42);assert.ok(media.src.endsWith(MUSIC_TRACKS.field.file));
});
test('switching to a boss fades the old track, then starts exactly one boss stream',async()=>{
 const {player,media,ctx,gain}=harness();player.update({scene:'field'});await flush();
 player.update({scene:'boss'});assert.equal(gain.value,0);assert.equal(player.track,'field');ctx.currentTime=.2;player.update();await flush();
 assert.equal(player.track,'boss');assert.equal(media.loads,2);assert.equal(media.plays,2);assert.equal(gain.value,MUSIC_TRACKS.boss.volume);
 player.update({scene:'menu'});assert.equal(media.paused,true);assert.equal(player.track,null);assert.equal(gain.value,0);
});
test('pause, music-off and backgrounding retain playback position and cannot restart audio late',async()=>{
 const {player,media}=harness();player.update({scene:'field'});await flush();media.currentTime=23;
 for(const state of [{suspended:true},{enabled:false}]){
  player.update(state);assert.equal(media.paused,true);player.update();assert.equal(media.paused,true);
  player.update({enabled:true,suspended:false});await flush();assert.equal(media.currentTime,23);assert.equal(media.paused,false);assert.equal(media.loads,1);
 }
 let resolve;media.pause();media.play=()=>{media.paused=false;return new Promise(r=>resolve=r);};player.update();player.update({enabled:false});resolve();await flush();assert.equal(media.paused,true);assert.equal(player.pending,false);
});
test('voice ducking lowers just the music level and restores it without restarting the song',async()=>{
 const {player,media,gain}=harness();player.update({scene:'field'});await flush();player.update({ducked:true});assert.equal(gain.value,MUSIC_TRACKS.field.volume*.28);player.update({ducked:false});assert.equal(gain.value,MUSIC_TRACKS.field.volume);assert.equal(media.plays,1);
});
test('an autoplay rejection waits for the next gesture and mute wins over pending playback',async()=>{
 const {player,media,ctx}=harness();ctx.state='suspended';let calls=0;media.play=()=>{calls++;return Promise.reject(new Error('NotAllowedError'));};
 player.update({scene:'field'});await flush();assert.equal(calls,1);for(let i=0;i<10;i++)player.update();assert.equal(calls,1);
 media.play=()=>{calls++;media.paused=false;return Promise.resolve();};player.unlock();await flush();assert.equal(calls,2);player.update({enabled:false});assert.equal(media.paused,true);
});
test('a cancelled boss transition restores the field song without reloading',async()=>{
 const {player,media,gain}=harness();player.update({scene:'field'});await flush();media.currentTime=12;player.update({scene:'boss'});player.update({scene:'field'});assert.equal(gain.value,MUSIC_TRACKS.field.volume);assert.equal(media.loads,1);assert.equal(media.currentTime,12);
});
test('both music URLs carry their content digest and point to distinct MP3 assets',async()=>{
 const hashes=[];
 for(const [id,item] of Object.entries(MUSIC_TRACKS)){const bytes=await readFile(new URL('../public/'+item.file,import.meta.url)),hash=createHash('sha256').update(bytes).digest('hex');assert.ok(bytes.length>1000000);assert.ok(item.file.endsWith(`${id}-${hash.slice(0,12)}.mp3`));assert.ok(item.volume>0&&item.volume<1);hashes.push(hash);}
 assert.notEqual(hashes[0],hashes[1]);
});
test('offline cached audio supports bounded, suffix and open-ended byte ranges',async()=>{
 for(const [range,expected,header] of [['bytes=0-1','01','bytes 0-1/10'],['bytes=6-','6789','bytes 6-9/10'],['bytes=-3','789','bytes 7-9/10'],['bytes=8-99','89','bytes 8-9/10'],['bytes=-99','0123456789','bytes 0-9/10']]){
  const request=new Request('https://game.test/music.mp3',{headers:{range}}),response=await cachedMediaResponse(request,new Response('0123456789',{headers:{'Content-Type':'audio/mpeg'}}));assert.equal(response.status,206);assert.equal(response.headers.get('Content-Range'),header);assert.equal(response.headers.get('Content-Type'),'audio/mpeg');assert.equal(await response.text(),expected);
 }
});
test('offline audio rejects unsatisfiable ranges and safely ignores malformed or multipart ranges',async()=>{
 for(const range of ['bytes=10-','bytes=5-2','bytes=-0','bytes=999999999999999999-']){const r=await cachedMediaResponse(new Request('https://game.test/a',{headers:{range}}),new Response('0123456789'));assert.equal(r.status,416);assert.equal(r.headers.get('Content-Range'),'bytes */10');}
 for(const range of [null,'bytes=a-b','bytes=0-1,3-4']){const request=new Request('https://game.test/a',range?{headers:{range}}:{}),response=new Response('0123');assert.equal(await cachedMediaResponse(request,response),response);}
});
