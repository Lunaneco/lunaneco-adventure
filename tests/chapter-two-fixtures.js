import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,grantLimitStone,unlockTalent,breakthrough} from '../src/progression.js';
import {FIRST_TIER_NODES} from '../src/talents.js';
import {botInput,chooseOffer} from './bot.js';

export function levelThirtyProfile({level=30,tree=false,cleared=7}={}){
 return normalizeProgression({story:{version:2,actClears:Array.from({length:16},(_,i)=>i<cleared),tsukinekoUnlocked:cleared>=4},characters:Object.fromEntries(['nyanluna','tsukineko','omsolo'].map(id=>[id,{level,breaks:level>=30?1:0,tree:tree?FIRST_TIER_NODES.map(n=>n.id):[]}]))},HEROES);
}
export function playRun(game,limit=550){
 for(let f=0;f<60*limit;f++){
  while(game.phase==='upgrade')game.chooseSkill(chooseOffer(game));
  if(game.phase==='transition')game.advanceStage();
  if(game.phase!=='playing')break;
  game.tick(1/60,botInput(game));game.drainEvents();
 }
 return game;
}
// Reproduce the UI's existing repeatable chapter-clear stone reward and actual
// XP from replaying chapter one. No levels, XP, enemy HP or timers are injected.
export function prepareWithEarnedRewards(profile){
 let p=profile,runs=0;grantLimitStone(p);
 while(['nyanluna','tsukineko'].some(id=>p.characters[id].level<30)&&runs<40){
  for(const id of ['nyanluna','tsukineko']){
   if(p.characters[id].level===20&&p.characters[id].breaks===0)breakthrough(p,id);
   for(const node of FIRST_TIER_NODES)unlockTalent(p,id,node.id);
  }
  if(['nyanluna','tsukineko'].every(id=>p.characters[id].level>=30))break;
  const hero=p.characters.nyanluna.level<p.characters.tsukineko.level?0:1;
  const g=playRun(new Adventure({act:3,hero,progression:p,difficulty:'normal',seed:1+runs}));
  assert.equal(g.phase,'victory',`Preparation run ${runs}: wave ${g.wave}`);p=g.progression;grantLimitStone(p);runs++;
 }
 assert.ok(['nyanluna','tsukineko'].every(id=>p.characters[id].level>=30));
 return {profile:p,runs};
}
