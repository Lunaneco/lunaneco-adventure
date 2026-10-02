import {BATTLE_VOICES} from './voice-catalog.js';
const HERO_IDS=['nyanluna','tsukineko','omsolo','mochinyafe','shizuku','prim','hehereal','lumi'];
export const BATTLE_VOICE_TARGET_LUFS=-18.5;
export const BATTLE_VOICE_VOLUME=.5;
// Calibrated per-clip gain aligns loudness before the 50% reduction. Dialogue keeps its own volume.
export function voicePlaybackGain(item){return item?.kind==='battle'?BATTLE_VOICE_VOLUME*10**((Number.isFinite(item.normalizationDb)?item.normalizationDb:0)/20):1;}
export const VOICE_PRIORITIES=Object.freeze({attack:10,support:11,wave:12,dash:15,exit:18,heal:20,treasure:23,blessing:25,start:27,predation:55,boss:28,hurt:30,switch:35,lowhp:38,levelup:45,recruit:48,ultimate:60,down:65,defeat:70,victory:70,equip:20});
export const VOICE_COOLDOWNS=Object.freeze({attack:1.25,support:8,hurt:.85,dash:1.5,lowhp:18,wave:5,heal:12,treasure:6});
export function battleVoiceCues(events,game){
 const cues=[],active=HERO_IDS[game.player.hero];
 const add=(who,event)=>{if(event==='predation'||BATTLE_VOICES[who]?.[event])cues.push({who,event,priority:VOICE_PRIORITIES[event]});};
 for(const e of events){
  if(e.type==='ultimate'&&e.voicePresented)continue;
  const who=e.heroId??HERO_IDS[e.hero]??active;
  if(e.type==='predationStart')add('hehereal','predation');
  else if(e.type==='attack')add(who,e.support?'support':'attack');
  else if(e.type==='characterXp'&&e.level>e.before)add(who,'levelup');
  else if(e.type==='heroDown')add(who,'down');
  else if(e.type==='wave')add(active,e.boss?'boss':e.wave===1?'start':'wave');
  else if(e.type==='exitOpen')add(active,'exit');
  else if(e.type==='skill')add(active,'blessing');
  else if(e.type==='weaponTicket'||e.type==='routeReward')add(active,'treasure');
  else if(e.type==='recruited')add(who,'recruit');
  else if(['hurt','dash','switch','ultimate','victory','defeat','heal'].includes(e.type))add(who,e.type);
 }
 if(events.some(e=>e.type==='hurt')&&game.player.hp>0&&game.player.hp/game.player.maxHp<.28)add(active,'lowhp');
 return cues.sort((a,b)=>b.priority-a.priority);
}
