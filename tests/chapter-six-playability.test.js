import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {FIRST_TIER_NODES,SECOND_TIER_NODES} from '../src/talents.js';
import {HEHE_ACT_IDS} from '../src/chapter-six.js';
import {equipWeapon} from '../src/weapons.js';
import {trialInput} from './country-bot.js';
import {chooseOffer} from './bot.js';

function profile(act){
 const p=normalizeProgression({story:{version:2,actClears:Array.from({length:28},(_,i)=>(i<20||i>=24)&&i<act)},characters:{omsolo:{level:60,breaks:4,tree:[...FIRST_TIER_NODES,...SECOND_TIER_NODES].map(n=>n.id)}},tutorial:{firstBattleCompleted:true}},HEROES);
 p.weapons.owned.push('light-saber-r3');assert.ok(equipWeapon(p,'omsolo','light-saber-r3'));return p;
}
for(const act of HEHE_ACT_IDS)for(const difficulty of ['normal','hard'])test(`Lv.60 Omsolo and story ally complete chapter-six act ${act}, ${difficulty}, three seeds`,()=>{
 const results=[];
 for(const seed of [1,3,17]){
  const g=new Adventure({act,difficulty,seed,progression:profile(act),party:['nyanluna','tsukineko'],hero:0}),seen=new Set();let helped=false;
  for(let f=0;f<60*600;f++){
   while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));
   if(g.phase==='transition')g.advanceStage();
   if(g.phase!=='playing')break;
   seen.add(g.wave);helped||=g.guestHeroId==='hehereal';g.tick(1/60,trialInput(g));g.drainEvents();
  }
  const row={act,difficulty,seed,phase:g.phase,wave:g.wave,hp:Math.round(g.player.hp),time:Math.round(g.time),hits:g.runHits,ally:g.guestHeroId};results.push(row);
  assert.equal(g.phase,'victory',JSON.stringify(row));assert.deepEqual([...seen],[1,2,3,4,5,6]);assert.equal(g.player.hero,2);assert.equal(helped,true);assert.ok(g.earnedMaterials.bloodCrystal>0&&g.earnedMaterials.demonHeart>=2);
 }
 console.log('CHAPTER_SIX_TRIAL',JSON.stringify(results));
});
