import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES,STAGE_EXIT,SKILLS} from '../src/model.js';
import {ACTS,isActUnlocked,completeAct,nextAct} from '../src/acts.js';
import {normalizeProgression} from '../src/progression.js';
import {normalizeMissions,missionIndex} from '../src/missions.js';
import {isHeroUnlocked} from '../src/recruitment.js';
import {equipUnique,UNIQUE_EQUIPMENT} from '../src/equipment.js';
import {botInput,chooseOffer} from './bot.js';
import {trialInput} from './country-bot.js';
const gate=(g,area)=>{g.phase='playing';g.area=area;g.wave=area*2+2;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.equal(g.crossExit(),true);};
test('old chapter clear preserves recruitment but only completes act one, including on repeated migration',()=>{
 const p=normalizeProgression({story:{chapterOneCleared:true},characters:{tsukineko:{level:17,xp:4}},inventory:{limitStone:3}},HEROES);
 assert.deepEqual(p.story.actClears,[true,...Array(27).fill(false)]);assert.equal(p.story.chapterOneCleared,false);assert.equal(isHeroUnlocked(p,'tsukineko'),true);assert.equal(nextAct(p),1);
 assert.deepEqual(normalizeProgression(p,HEROES,{chapterOneCleared:true}),p);assert.equal(p.characters.tsukineko.level,17);assert.equal(p.inventory.limitStone,3);
});
test('act locks and completion cannot skip ahead; tutorial always starts at act one',()=>{
 const p=normalizeProgression({},HEROES);for(const id of [-1,1,2,3,4,NaN,'1'])assert.equal(isActUnlocked(p,id),false);
 assert.equal(completeAct(p,3),false);assert.equal(new Adventure({act:3}).act,0);
 for(let act=0;act<4;act++){assert.ok(isActUnlocked(p,act));assert.equal(completeAct(p,act),act===3);assert.equal(p.story.chapterOneCleared,act===3);assert.equal(p.story.tsukinekoUnlocked,act===3);}
 assert.equal(new Adventure({progression:p,act:3,tutorial:true}).act,0);
});
test('all chosen skill ranks, actual damage, vitality and crystal progress persist through both field gates',()=>{
 const g=new Adventure({progression:{story:{chapterOneCleared:true}}});g.rng=()=>.9;
 for(const id of ['power','orbit','ward','vitality','haste','reach','nova']){g.phase='upgrade';g.offers=[SKILLS.find(s=>s.id===id)];g.pendingBlessings=1;assert.equal(g.chooseSkill(id),true);}
 g.addCrystals(7);const skills={...g.skills},damage=g.skillDamage('nyanluna',12),maxHp=g.player.maxHp;
 for(const area of [0,1]){gate(g,area);assert.deepEqual(g.skills,skills);assert.equal(g.stageCrystals,7);assert.equal(g.player.maxHp,maxHp);g.advanceStage();assert.deepEqual(g.skills,skills);assert.equal(g.skillDamage('nyanluna',12),damage);}
 const next=new Adventure({progression:g.progression});assert.deepEqual(next.skills,{});assert.equal(next.stageCrystals,0);assert.equal(next.player.maxHp,maxHp-40);
});
test('an early field trial is held until act clear and is discarded on retreat',()=>{
 const g=new Adventure({difficulty:'hard'});g.trackMission('kills',24);gate(g,0);
 assert.equal(g.progression.inventory.starBud,0);assert.deepEqual(g.earnedMissions,[]);assert.deepEqual(g.progression.equipment.owned,[]);assert.ok(g.pendingTrials.has('meadow-trial'));
 const retry=new Adventure({progression:g.progression,difficulty:'normal'});gate(retry,2);
 assert.ok(retry.earnedMissions.includes('meadow-hunt'));assert.equal(retry.progression.equipment.owned.includes('meadow-charm'),false);
 gate(g,2);assert.ok(g.progression.equipment.owned.includes('meadow-charm'));assert.equal(g.earnedMissions.filter(id=>id==='meadow-hunt').length,1);assert.equal(g.crossExit(),false);
});
test('mission counters and trials are isolated by act and legacy stone claim moves without a second payout',()=>{
 const p=normalizeProgression({story:{version:2,actClears:[true,true,true,false]}},HEROES),g=new Adventure({act:1,progression:p});g.trackMission('kills',4);
 assert.equal(g.progression.missions.stages[0].kills,0);assert.equal(g.progression.missions.stages[3].kills,4);
 const migrated=normalizeMissions({stages:[{},{},{chapterMaster:1}],claimed:['chapter-master']});assert.ok(migrated.claimed.includes('chapter-master'));assert.equal(migrated.stages[missionIndex(3,2)].chapterMaster,1);assert.deepEqual(normalizeMissions(migrated),migrated);
});
test('explicitly transferring gear releases its former wearer, replaces the selected slot, and survives reload',()=>{
 const p=normalizeProgression({equipment:{owned:UNIQUE_EQUIPMENT.map(x=>x.id),loadout:{nyanluna:'ruins-lens',tsukineko:'dawn-seal'}}},HEROES);
 assert.ok(equipUnique(p.equipment,'tsukineko','ruins-lens',{transfer:true}));assert.deepEqual(p.equipment.loadout,{tsukineko:'ruins-lens'});
 assert.deepEqual(normalizeProgression(p,HEROES).equipment,p.equipment);assert.equal(equipUnique(p.equipment,'tsukineko','missing',{transfer:true}),false);assert.deepEqual(p.equipment.loadout,{tsukineko:'ruins-lens'});
});
for(const difficulty of ['normal','hard'])for(const seed of [1,3,17])test(`all 24 waves are completable in order with earned progression: ${difficulty}, seed ${seed}`,()=>{
 let profile;let total=0;
 for(let act=0;act<4;act++){
  const g=new Adventure({act,difficulty,seed,progression:profile});let met=false;
  for(let frame=0;frame<60*480;frame++){
   while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;
   if(act<3||g.wave<6){assert.deepEqual(g.party,['nyanluna']);assert.equal(g.earnedXp.tsukineko,0);}else{met=true;assert.deepEqual(g.party,['nyanluna','tsukineko']);}
   assert.equal(g.progression.equipment.owned.length,profile?.equipment.owned.length??0);
   g.tick(1/60,botInput(g));g.drainEvents();
  }
  assert.equal(g.phase,'victory',`act ${act+1}, wave ${g.wave}, HP ${g.player.hp}`);assert.equal(g.kills,ACTS[act].counts.reduce((a,b)=>a+b));assert.equal(met,act===3);assert.equal(g.progression.story.chapterOneCleared,act===3);assert.equal(isHeroUnlocked(g.progression,'tsukineko'),act===3);
  assert.ok(g.earnedMissions.length>=9);assert.ok(g.blessingsTaken>=4);total+=g.kills;profile=JSON.parse(JSON.stringify(g.progression));
 }
 assert.equal(total,426);assert.deepEqual(profile.story.actClears,[...Array(4).fill(true),...Array(24).fill(false)]);
});
for(const [act,seed] of [[0,1],[1,3],[2,5],[3,2]])test(`all difficult missions are reachable in act ${act+1} without changing enemy stats or clocks`,()=>{
 const p=normalizeProgression({story:{version:2,actClears:[true,true,true,true],tsukinekoUnlocked:true},characters:{nyanluna:{level:20},tsukineko:{level:20}}},HEROES);
 const g=new Adventure({act,seed,hero:1,difficulty:'hard',progression:p});
 for(let frame=0;frame<60*300;frame++){
  while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;g.tick(1/60,g.enemies.some(e=>e.type==='boss')?trialInput(g):botInput(g));g.drainEvents();
 }
 assert.equal(g.phase,'victory');assert.equal(g.runHits,0);assert.equal(g.earnedMissions.length,act===0?12:11);assert.equal(g.progression.equipment.owned.length,act===0?3:1);assert.equal(g.progression.inventory.limitStone,act===0?0:1);
});
