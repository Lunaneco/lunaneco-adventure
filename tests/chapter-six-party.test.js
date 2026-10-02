import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {HEHE_ACT_IDS} from '../src/chapter-six.js';
import {requiredPartyMember,partyForAct} from '../src/party.js';
import {availableHeroes} from '../src/recruitment.js';
import {partyView} from '../src/party-ui.js';
import {stageBriefingView} from '../src/stage-selection-ui.js';

const profile=(cleared=32)=>normalizeProgression({story:{version:2,actClears:Array.from({length:32},(_,i)=>(i<20||i>=24)&&i<cleared)},tutorial:{firstBattleCompleted:true}},HEROES);
const quiet=options=>{const g=new Adventure({seed:7,progression:profile(),...options});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.drainEvents();return g;};
const finish=g=>{g.area=2;g.wave=6;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.equal(g.crossExit(),true);};

for(const act of HEHE_ACT_IDS)test(`act ${act}: only the first clear requires Omsolo; saved parties and the next act stay intact`,()=>{
 const p=profile(act),before=structuredClone(p),chosen=['tsukineko','prim'];
 assert.equal(requiredPartyMember(p,act),'omsolo');
 assert.deepEqual(partyForAct(chosen,availableHeroes(p,HEROES),p,act,'prim'),['omsolo']);
 const initial=quiet({act,progression:p,party:chosen,hero:5});assert.equal(initial.player.hero,2);assert.equal(initial.switchHero(),false);
 assert.deepEqual(p,before);assert.deepEqual(chosen,['tsukineko','prim']);
 initial.player.invincible=0;initial.hurt(1e9,0,0);assert.equal(initial.phase,'defeat');
 const retry=quiet({act,progression:initial.progression,party:chosen,hero:5});assert.equal(retry.player.hero,2);assert.equal(requiredPartyMember(retry.progression,act),'omsolo');
 finish(retry);const saved=normalizeProgression(JSON.parse(JSON.stringify(retry.progression)),HEROES);
 assert.equal(requiredPartyMember(saved,act),null);
 for(const difficulty of ['normal','hard']){const replay=quiet({act,progression:saved,party:chosen,hero:5,difficulty});assert.deepEqual(replay.party,chosen);assert.equal(replay.player.hero,5);assert.equal(replay.guestHeroId,null);assert.equal(replay.switchHero(),true);}
 if(act<27)assert.equal(requiredPartyMember(saved,act+1),'omsolo');
});

for(const act of HEHE_ACT_IDS)test(`cleared act ${act}: every two-character party keeps its selected lead and never gains an NPC`,()=>{
 const p=profile();
 for(let a=0;a<HEROES.length;a++)for(let b=a+1;b<HEROES.length;b++)for(const hero of [a,b])for(const difficulty of ['normal','hard']){
  const party=[HEROES[a].id,HEROES[b].id],before=structuredClone(p),g=quiet({act,progression:p,party,hero,difficulty});
  assert.deepEqual(g.party,party);assert.equal(g.player.hero,hero);assert.equal(g.guestHeroId,null);
  for(let wave=1;wave<=6;wave++){
   assert.equal(g.meetHehereal(),false);assert.deepEqual(g.party,party);assert.equal(g.partyHeroes.length,2);assert.equal(g.guestHeroId,null);
   if(wave<6)g.startWave();
  }
  assert.ok(!g.drainEvents().some(e=>e.type==='guestJoin'));
  assert.equal(g.switchHero(),true);assert.equal(g.player.hero,hero===a?b:a);assert.deepEqual(p,before);
 }
});

test('a free two-character party can automatically switch on knockout without spawning story support',()=>{
 for(const act of HEHE_ACT_IDS){const g=quiet({act,party:['nyanluna','hehereal'],hero:0});g.player.invincible=0;assert.equal(g.hurt(1e9,0,0),true);assert.equal(g.phase,'playing');assert.equal(g.player.hero,6);assert.equal(g.guestHeroId,null);assert.equal(g.meetHehereal(),false);g.player.invincible=0;g.hurt(1e9,0,0);assert.equal(g.phase,'defeat');}
});

test('replaying solo preserves any selected hero, adds only Hehereal support at the story point, and never duplicates her',()=>{
 for(const act of HEHE_ACT_IDS)for(let hero=0;hero<HEROES.length;hero++){
  const id=HEROES[hero].id,g=quiet({act,hero,party:[id]});assert.equal(g.player.hero,hero);
  if(act===24){assert.deepEqual(g.party,[id]);g.wave=3;g.meetHehereal();}
  assert.deepEqual(g.party,id==='hehereal'?[id]:[id,'hehereal']);assert.equal(g.guestHeroId,id==='hehereal'?null:'hehereal');assert.equal(g.switchHero(),false);
  assert.equal(g.meetHehereal(),false);g.player.invincible=0;g.hurt(1e9,0,0);assert.equal(g.phase,'defeat');
 }
});

test('only the NPC uses the level-60 stat floor; a recruited Hehereal uses her saved level and gear',()=>{
 const p=profile(),base=combatStats(p,HEROES[6]);assert.equal(p.characters.hehereal.level,1);
 for(const act of HEHE_ACT_IDS){
  for(const party of [['hehereal'],['omsolo','hehereal'],['hehereal','nyanluna']]){const g=quiet({act,progression:p,hero:6,party});assert.equal(g.guestHeroId,null);assert.deepEqual(g.statsFor(6),base);assert.equal(g.healthFor(6).maxHp,base.maxHp);}
  const npc=quiet({act,progression:p,party:['nyanluna'],hero:0});if(act===24){npc.wave=3;npc.meetHehereal();}assert.ok(npc.statsFor(6).attack>base.attack);assert.ok(npc.healthFor(6).maxHp>base.maxHp);assert.equal(npc.progressFor(6).level,1);
 }
});

test('capture works immediately in a cleared Omsolo/Hehereal party and cannot re-add an NPC on later waves',()=>{
 for(const act of HEHE_ACT_IDS)for(const hero of [2,6]){
  const g=quiet({act,hero,party:['omsolo','hehereal']});assert.equal(g.guestHeroId,null);assert.equal(g.predationReady,true);const hp=structuredClone(g.heroHealth);assert.equal(g.predate(),true);assert.deepEqual(g.heroHealth,hp);
  for(let wave=1;wave<6;wave++){g.startWave();assert.deepEqual(g.party,['hehereal']);assert.equal(g.guestHeroId,null);assert.equal(g.meetHehereal(),false);assert.equal(g.predate(),false);}
  assert.equal(g.switchHero(),false);finish(g);assert.deepEqual(g.party,['omsolo','hehereal']);assert.equal(g.predation.active,false);assert.equal(g.player.hero,hero);
 }
});

test('briefing and party help distinguish first-clear solo rules from free replay',()=>{
 for(const act of HEHE_ACT_IDS){
  const first=profile(act),cleared=profile(act+1),brief=stageBriefingView(act,'normal',first),replay=stageBriefingView(act,'hard',cleared);
  assert.match(brief,/初回クリアまでのソロクエスト/);assert.match(brief,/オムソロ操作固定/);assert.match(brief,/クリアした幕は自由編成/);
  assert.match(replay,/クリア後の自由編成/);assert.match(replay,/2人編成ではNPCへへりあるを追加しません/);assert.doesNotMatch(replay,/オムソロ操作固定/);
  assert.match(partyView(['omsolo'],2,HEROES,()=>1,first,'戻る',act),/初回クリアまでオムソロ操作固定/);
  assert.doesNotMatch(partyView(['nyanluna','prim'],0,HEROES,()=>1,cleared,'戻る',act),/party-required-note/);
 }
 const rice=profile();rice.characters.omsolo.level=50;rice.characters.omsolo.breaks=3;rice.awakenings.rice=true;
 assert.equal(requiredPartyMember(rice,23),'omsolo');assert.deepEqual(partyForAct(['nyanluna','prim'],HEROES,rice,23,'prim'),['omsolo']);
});
