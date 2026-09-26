import test from 'node:test';
import assert from 'node:assert/strict';
import {VoicePlayer} from '../src/voice-player.js';
import {Soundscape} from '../src/audio.js';
import {dialogueVoiceId,BATTLE_VOICES} from '../src/voice-catalog.js';
import {battleVoiceCues,voicePlaybackGain} from '../src/voice-policy.js';
import {ACT_SCENES} from '../src/chapter.js';
import {TUTORIAL_STEPS} from '../src/tutorial.js';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness(){
 const sources=[],captions=[],duck=[],requests=[],buffers=new Map();let time=10;
 const ctx={state:'running',currentTime:0,destination:{},createGain:()=>({gain:{value:1,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}},connect(node){this.destination=node;}}),decodeAudioData:async()=>({duration:10}),createBufferSource:()=>{const source={connect(node){this.destination=node;},disconnect(){},start(when,offset){this.offset=offset;this.started=true;},stop(){this.stopped=true;},onended:null};sources.push(source);return source;}};
 const sound={ctx,enabled:true,init(){},setDucking:v=>duck.push(v)};
 const lines=Object.values(BATTLE_VOICES).flatMap(events=>Object.values(events).flat()),manifest=Object.fromEntries(lines.map(line=>[line.id,{...line,file:`assets/voices/${line.id}.mp3`}]));
 for(const who of ['nyanluna','tsukineko'])for(const text of ['一行目。','次の台詞。']){const id=dialogueVoiceId(who,text);manifest[id]={who,text,file:`assets/voices/${id}.mp3`};}
 const voice=new VoicePlayer(sound,{manifest,onCaption:c=>captions.push(c),clock:()=>time,fetcher:async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};}});
 return {voice,sound,ctx,sources,captions,duck,requests,advance:n=>{time+=n;ctx.currentTime+=n;}};
}
test('every story line and tutorial has a stable, distinct dialogue key',()=>{
 const lines=[...ACT_SCENES.flatMap(scenes=>Object.values(scenes).flatMap(scene=>scene.lines)),...TUTORIAL_STEPS.map(s=>({who:'nyanluna',text:s.text}))];const ids=new Map();for(const line of lines){const id=dialogueVoiceId(line.who,line.text);assert.match(id,/^[a-z_]+-[0-9a-f]+$/);if(ids.has(id))assert.deepEqual(ids.get(id),line);ids.set(id,line);}assert.ok(ids.size>100);assert.notEqual(dialogueVoiceId('nyanluna','はい'),dialogueVoiceId('tsukineko','はい'));
});
test('all playable heroes have attack, damage, dash, ultimate, growth, defeat and other battle voice coverage',()=>{
 for(const [who,events] of Object.entries(BATTLE_VOICES))for(const key of ['attack','hurt','dash','ultimate','levelup','switch','support','lowhp','down','victory','defeat','start','wave','boss','exit','blessing','treasure','recruit','heal','equip']){assert.ok(events[key]?.length,`${who}/${key}`);for(const line of events[key])assert.equal(line.who,who);}
});
test('Tsukineko damage cues never rotate back to the removed grunt',async()=>{
 const h=harness();h.voice.setMode('battle');assert.deepEqual(BATTLE_VOICES.tsukineko.hurt.map(line=>line.text),['いたっ！']);
 for(let i=0;i<4;i++){h.voice.handle([{type:'hurt'}],{player:{hero:1,hp:100,maxHp:100}});await flush();assert.equal(h.captions.at(-1).text,'いたっ！');h.sources.at(-1).onended();h.advance(1);}
});
test('battle voices match loudness then halve amplitude without changing dialogue gain',()=>{
 for(const normalizationDb of [-4.5,0,1.5]){const gain=voicePlaybackGain({kind:'battle',normalizationDb});assert.ok(Math.abs(gain/(10**(normalizationDb/20))-.5)<1e-10);}
 assert.equal(voicePlaybackGain({kind:'battle',normalizationDb:0}),.5);
 for(const kind of ['story','tutorial'])assert.equal(voicePlaybackGain({kind,normalizationDb:-4.5}),1);
});
test('normalized battle gain survives volume changes, queued speech and ultimate pause without compounding',async()=>{
 const h=harness();h.voice.manifest['tsukineko-ultimate-1'].normalizationDb=0;h.voice.setMode('ultimate');await h.voice.play('tsukineko-ultimate-1');
 assert.equal(h.sources.at(-1).destination,h.voice.clipGain);assert.equal(h.voice.clipGain.destination,h.voice.gain);assert.equal(h.voice.gain.destination,h.ctx.destination);assert.equal(h.voice.clipGain.gain.value,.5);assert.equal(h.voice.gain.gain.value,.85);
 h.voice.configure(true,.44);assert.equal(h.voice.gain.gain.value,.44);assert.equal(h.voice.clipGain.gain.value,.5);
 h.advance(2);h.voice.suspend();h.voice.resume();await flush();assert.equal(h.sources.at(-1).offset,2);assert.equal(h.voice.clipGain.gain.value,.5);
 h.voice.setMode('battle');h.voice.cue('tsukineko','hurt');await flush();h.voice.manifest['nyanluna-levelup-1'].normalizationDb=1.5;h.voice.cue('nyanluna','levelup');h.sources.at(-1).onended();await flush();assert.equal(h.voice.current.id,'nyanluna-levelup-1');assert.equal(h.voice.clipGain.gain.value,voicePlaybackGain(h.voice.manifest['nyanluna-levelup-1']));
 await h.voice.dialogue('nyanluna','一行目。');assert.equal(h.voice.clipGain.gain.value,1);assert.equal(h.voice.gain.gain.value,.44);
});
test('only actual character level increases trigger levelup voices; support attacks keep their speaker',()=>{
 const game={player:{hero:0,hp:100,maxHp:180}};const cues=battleVoiceCues([{type:'characterXp',heroId:'tsukineko',before:3,level:4},{type:'characterXp',heroId:'nyanluna',before:2,level:2},{type:'attack',hero:1,support:true}],game);
 assert.deepEqual(cues.map(c=>[c.who,c.event]),[['tsukineko','levelup'],['tsukineko','support']]);assert.equal(battleVoiceCues([{type:'upgrade'}],game).length,0);
});
test('loading an older story line cannot play after advancing to another speaker',async()=>{
 const h=harness(),resolve=[];h.voice.fetcher=url=>new Promise(done=>resolve.push(()=>done({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})));
 const first=h.voice.dialogue('nyanluna','一行目。'),second=h.voice.dialogue('tsukineko','次の台詞。');await flush();resolve[1]();await second;resolve[0]();await first;assert.equal(h.sources.length,1);assert.equal(h.voice.current.id,dialogueVoiceId('tsukineko','次の台詞。'));assert.equal(h.captions.at(-1).who,'tsukineko');
});
test('story replay and skip stop the previous voice; battle chatter cannot interrupt dialogue',async()=>{
 const h=harness();await h.voice.dialogue('nyanluna','一行目。');assert.equal(h.voice.cue('tsukineko','attack'),false);await h.voice.dialogue('nyanluna','一行目。');assert.equal(h.sources[0].stopped,true);assert.equal(h.requests.length,1);h.voice.setMode('menu');assert.equal(h.sources[1].stopped,true);assert.equal(h.voice.current,null);assert.equal(h.duck.at(-1),false);
});
test('rapid attacks never overlap and cycle lines only when a voice can be heard',async()=>{
 const h=harness();h.voice.setMode('battle');assert.equal(h.voice.cue('nyanluna','attack'),true);await flush();assert.equal(h.voice.cue('nyanluna','attack'),false);h.advance(2);assert.equal(h.voice.cue('nyanluna','attack'),false);h.sources[0].onended();assert.equal(h.voice.cue('nyanluna','attack'),true);await flush();assert.equal(h.voice.current.id,'nyanluna-attack-2');assert.equal(h.sources.length,2);
});
test('ultimates interrupt grunts, while important levelup speech queues behind hurt without overlapping',async()=>{
 const h=harness();h.voice.setMode('battle');h.voice.cue('nyanluna','attack');await flush();h.voice.cue('tsukineko','ultimate');await flush();assert.equal(h.sources[0].stopped,true);assert.equal(h.voice.current.id,'tsukineko-ultimate-1');h.sources[1].onended();h.voice.cue('nyanluna','hurt');await flush();h.voice.cue('nyanluna','levelup');await flush();assert.equal(h.voice.current.id,'nyanluna-hurt-1');h.sources[2].onended();await flush();assert.equal(h.voice.current.id,'nyanluna-levelup-1');
});
test('muting is immediate, canceled loads stay silent, and volume zero is retained',async()=>{
 const h=harness();await h.voice.dialogue('nyanluna','一行目。');h.voice.configure(false,0);assert.equal(h.sources[0].stopped,true);assert.equal(h.voice.volume,0);assert.equal(await h.voice.dialogue('tsukineko','次の台詞。'),false);h.voice.configure(true,.4);h.sound.enabled=false;assert.equal(await h.voice.dialogue('tsukineko','次の台詞。'),false);
});
test('backgrounding pauses story at its position; returning to the title discards that pending voice',async()=>{
 const h=harness();await h.voice.dialogue('nyanluna','一行目。');h.advance(2);h.voice.suspend();h.voice.suspend();assert.equal(h.sources[0].stopped,true);h.voice.resume();await flush();assert.equal(h.sources[1].offset,2);h.voice.suspend();h.voice.setMode('menu');h.voice.resume();await flush();assert.equal(h.sources.length,2);
});
test('audio decode failures do not crash or leave a stuck speaking state',async()=>{
 const h=harness();h.voice.fetcher=async()=>({ok:false,status:404});assert.equal(await h.voice.dialogue('nyanluna','一行目。'),false);assert.equal(h.voice.current,null);assert.match(h.voice.lastError,/404/);assert.equal(h.sources.length,0);
});
test('decoded audio cache stays bounded and nonexistent IDs never make requests',async()=>{
 const h=harness();for(const line of Object.values(BATTLE_VOICES.nyanluna).flat())await h.voice.load(line.id);for(const line of Object.values(BATTLE_VOICES.tsukineko).flat())await h.voice.load(line.id);assert.ok(h.voice.cache.size<=24);const n=h.requests.length;assert.equal(await h.voice.load('../../private'),null);assert.equal(h.requests.length,n);
});
test('levelup earned during an ultimate is preserved and plays when the ultimate call finishes',async()=>{
 const h=harness();h.voice.setMode('battle');h.voice.handle([{type:'ultimate',hero:0},{type:'characterXp',heroId:'tsukineko',before:2,level:3}],{player:{hero:0,hp:180,maxHp:180}});await flush();assert.equal(h.voice.current.id,'nyanluna-ultimate-1');assert.equal(h.voice.queue[0].id,'tsukineko-levelup-1');h.sources[0].onended();await flush();assert.equal(h.voice.current.id,'tsukineko-levelup-1');
});

test('default fetch keeps the browser global receiver instead of binding the voice player',async()=>{
 const h=harness(),original=globalThis.fetch;let calls=0;
 globalThis.fetch=async function(){assert.equal(this,globalThis);calls++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
 try{const player=new VoicePlayer(h.sound,{manifest:h.voice.manifest});assert.equal(await player.dialogue('nyanluna','一行目。'),true);assert.equal(calls,1);}finally{globalThis.fetch=original;}
});

test('zero voice volume does not mute the effects bus through silent ducking',async()=>{
 const h=harness();await h.voice.dialogue('nyanluna','一行目。');h.voice.configure(true,0);assert.equal(h.sources[0].stopped,true);assert.equal(h.duck.at(-1),false);assert.equal(h.voice.audible,false);assert.equal(await h.voice.dialogue('tsukineko','次の台詞。'),false);
});
test('a synchronously failing fetch is retryable after recovery',async()=>{
 const h=harness();h.voice.fetcher=()=>{throw Error('unavailable');};assert.equal(await h.voice.dialogue('nyanluna','一行目。'),false);assert.equal(h.voice.loading.size,0);h.voice.fetcher=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});assert.equal(await h.voice.dialogue('nyanluna','一行目。'),true);
});

test('chapter reward menu plays victory then the recruited character, without battle chatter',async()=>{
 const h=harness();assert.equal(h.voice.cue('nyanluna','attack'),false);h.voice.cue('nyanluna','victory');h.voice.cue('omsolo','recruit');await flush();assert.equal(h.voice.current.id,'nyanluna-victory-1');h.sources[0].onended();await flush();assert.equal(h.voice.current.id,'omsolo-recruit-1');h.voice.setMode('story');assert.equal(h.sources[1].stopped,true);
});

test('an interrupted mobile audio context resumes on the next interaction',async()=>{
 const sound=new Soundscape();let resumed=0;sound.ctx={state:'interrupted',resume:async()=>{resumed++;}};sound.init();assert.equal(resumed,1);sound.ctx.state='closed';sound.init();assert.equal(resumed,1);
});

test('ultimate completion follows audio ending and survives a pause at the original offset',async()=>{
 const h=harness(),events=[];h.voice.setMode('ultimate');await h.voice.play('nyanluna-ultimate-1',{priority:100,onStart:()=>events.push('start'),onFinish:reason=>events.push(reason)});
 h.advance(2);h.voice.suspend();assert.deepEqual(events,['start']);h.voice.resume();await flush();assert.equal(h.sources[1].offset,2);assert.deepEqual(events,['start','start']);h.sources[1].onended();assert.deepEqual(events,['start','start','ended']);
});
test('an ultimate paused while loading starts only after resume and completes once',async()=>{
 const h=harness(),events=[];let resolve;h.voice.fetcher=()=>new Promise(done=>resolve=()=>done({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));h.voice.setMode('ultimate');const pending=h.voice.play('omsolo-ultimate-1',{priority:100,onFinish:reason=>events.push(reason)});await flush();h.voice.suspend();resolve();await pending;assert.equal(h.sources.length,0);assert.deepEqual(events,[]);h.voice.resume();await flush();h.sources[0].onended();assert.deepEqual(events,['ended']);
});
test('cancelling or failing an awaited voice completes it without a late audio start',async()=>{
 const h=harness(),events=[];h.voice.setMode('ultimate');await h.voice.play('tsukineko-ultimate-1',{onFinish:r=>events.push(r)});h.voice.stop();assert.deepEqual(events,['cancelled']);h.voice.fetcher=async()=>({ok:false,status:404});await h.voice.play('omsolo-ultimate-1',{onFinish:r=>events.push(r)});assert.deepEqual(events,['cancelled','unavailable']);
});
test('muting a paused ultimate resolves its pending completion and never resumes its audio',async()=>{
 const h=harness(),events=[];h.voice.setMode('ultimate');await h.voice.play('nyanluna-ultimate-1',{onFinish:r=>events.push(r)});h.voice.suspend();h.voice.configure(false);assert.deepEqual(events,['cancelled']);h.voice.resume();await flush();assert.equal(h.sources.length,1);
});
