import {publicUrl} from './public-url.js';
import {VOICE_MANIFEST} from './voice-manifest.js';
import {dialogueVoiceId,BATTLE_VOICES} from './voice-catalog.js';
import {battleVoiceCues,VOICE_PRIORITIES,VOICE_COOLDOWNS,voicePlaybackGain} from './voice-policy.js';

export class VoicePlayer{
 constructor(sound,{enabled=true,volume=.85,manifest=VOICE_MANIFEST,fetcher=(...args)=>globalThis.fetch(...args),clock=()=>performance.now()/1000,onCaption=()=>{}}={}){
  this.sound=sound;this.enabled=enabled;this.volume=volume;this.manifest=manifest;this.fetcher=fetcher;this.clock=clock;this.onCaption=onCaption;this.mode='menu';this.cache=new Map();this.loading=new Map();this.counters=new Map();this.cooldowns=new Map();this.serial=0;this.current=null;this.suspended=false;this.queue=[];this.gain=null;this.lastError=null;
 }
 get audible(){return this.enabled&&this.volume>0&&this.sound.enabled&&!this.suspended;}
 init(){this.sound.init();const ctx=this.sound.ctx;if(!ctx)return false;if(!this.gain){this.gain=ctx.createGain();this.gain.connect(ctx.destination);this.clipGain=ctx.createGain();this.clipGain.connect(this.gain);}this.gain.gain.setValueAtTime(this.audible?this.volume:0,ctx.currentTime);return true;}
 configure(enabled,volume=this.volume){this.enabled=enabled;this.volume=Math.max(0,Math.min(1,Number(volume)||0));if(!this.audible)this.stop();if(this.gain)this.gain.gain.setTargetAtTime(this.audible?this.volume:0,this.sound.ctx.currentTime,.03);}
 setMode(mode){if(this.mode!==mode){this.stop();this.resumeLine=null;this.mode=mode;}}
 stop({keepQueue=false,preserveCompletion=false}={}){
  this.serial++;const current=this.current,pending=this.resumeLine;this.current=null;this.resumeLine=null;if(!keepQueue)this.queue=[];
  if(current?.source){current.source.onended=null;try{current.source.stop();}catch{}current.source.disconnect();}
  this.sound.setDucking?.(false);this.onCaption(null);if(!preserveCompletion)(current??pending)?.onFinish?.('cancelled');
 }
 suspend(){if(this.suspended)return;const c=this.current,line=c&&['story','tutorial','ultimate'].includes(this.mode)?{id:c.id,priority:c.priority,onStart:c.onStart,onFinish:c.onFinish,offset:(c.offset??0)+(c.started===undefined?0:this.sound.ctx.currentTime-c.started)}:null;this.suspended=true;this.stop({preserveCompletion:!!line});this.resumeLine=line;}
 resume(){if(!this.suspended)return;this.suspended=false;const line=this.resumeLine;this.resumeLine=null;if(line&&this.audible)void this.play(line.id,{...line,interrupt:true});else line?.onFinish?.('cancelled');}
 async load(id){
  const item=this.manifest[id];if(!item)return null;if(this.cache.has(id)){const value=this.cache.get(id);this.cache.delete(id);this.cache.set(id,value);return value;}
  if(this.loading.has(id))return this.loading.get(id);if(!this.sound.ctx)return null;
  const promise=Promise.resolve().then(async()=>{try{const response=await this.fetcher(publicUrl(item.file));if(!response.ok)throw Error(`Voice ${response.status}: ${id}`);const data=await response.arrayBuffer(),buffer=await this.sound.ctx.decodeAudioData(data);this.cache.set(id,buffer);while(this.cache.size>1&&(this.cache.size>24||[...this.cache.values()].reduce((total,b)=>total+(b.length??b.duration*48000)*(b.numberOfChannels??1)*4,0)>16*1024*1024))this.cache.delete(this.cache.keys().next().value);return buffer;}catch(error){this.lastError=String(error);return null;}finally{this.loading.delete(id);}});
  this.loading.set(id,promise);return promise;
 }
 preload(ids){if(!this.audible||!this.init())return;for(const id of ids.slice(0,8))void this.load(id);}
 async play(id,{priority=20,interrupt=false,offset=0,onStart,onFinish}={}){
  if(!this.manifest[id]||!this.audible||!this.init()){onFinish?.('unavailable');return false;}
  if(this.current&&!interrupt){if(priority>=40&&priority<60&&this.current.priority>=30){if(!this.queue.some(q=>q.id===id))this.queue.push({id,priority,created:this.clock()});this.queue=this.queue.sort((a,b)=>b.priority-a.priority).slice(0,3);return false;}if(priority<=this.current.priority)return false;}
  this.stop({keepQueue:true});const token=this.serial,item=this.manifest[id];this.current={id,priority,offset,onStart,onFinish};
  const buffer=await this.load(id);if(token!==this.serial||!this.audible)return false;
  if(!buffer||offset>=buffer.duration){this.current=null;onFinish?.(buffer?'ended':'unavailable');this.drain();return false;}
  const source=this.sound.ctx.createBufferSource();source.buffer=buffer;this.clipGain.gain.setValueAtTime(voicePlaybackGain(item),this.sound.ctx.currentTime);source.connect(this.clipGain);this.current={id,priority,source,offset,started:this.sound.ctx.currentTime,onStart,onFinish};this.sound.setDucking?.(true);this.onCaption(item);
  source.onended=()=>{if(token!==this.serial)return;source.disconnect();this.current=null;this.sound.setDucking?.(false);this.onCaption(null);onFinish?.('ended');this.drain();};
  try{source.start(0,offset);onStart?.(buffer.duration-offset);return true;}catch(error){this.lastError=String(error);this.stop();return false;}
 }
 drain(){const next=this.queue.shift();if(next&&this.clock()-next.created<12&&['battle','menu'].includes(this.mode))void this.play(next.id,{priority:next.priority});else if(this.queue.length)this.drain();}
 dialogue(who,text,mode='story'){this.setMode(mode);this.queue=[];return this.play(dialogueVoiceId(who,text),{priority:100,interrupt:true});}
 cue(who,event){
  if(this.mode!=='battle'&&!(this.mode==='menu'&&['equip','victory','recruit'].includes(event)))return false;const lines=BATTLE_VOICES[who]?.[event];if(!lines?.length||!this.audible)return false;
  const key=`${who}:${event}`,now=this.clock(),last=this.cooldowns.get(key)??-Infinity;if(now-last<(who==='mochinyafe'&&event==='support'?3:VOICE_COOLDOWNS[event]??3))return false;
  const priority=VOICE_PRIORITIES[event]??20;if(this.current&&priority<=this.current.priority&&!(priority>=40&&priority<60))return false;
  const index=this.counters.get(key)??0;this.counters.set(key,index+1);this.cooldowns.set(key,now);void this.play(lines[index%lines.length].id,{priority});return true;
 }
 handle(events,game){if(this.mode!=='battle'||game.tutorial?.active)return;let played=false;for(const cue of battleVoiceCues(events,game)){if(!played||cue.priority>=40&&cue.priority<60){if(this.cue(cue.who,cue.event))played=true;}}}
}
