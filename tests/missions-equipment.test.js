import {RecruitedAdventure} from './recruited-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,STAGE_EXIT} from '../src/model.js';
import {normalizeProgression,characterStats,combatStats} from '../src/progression.js';
import {STAGE_MISSIONS,missionsFor,trialStatus} from '../src/missions.js';
import {WEAPONS,equipUnique,normalizeEquipment} from '../src/equipment.js';
const quiet=game=>{game.materialRng=()=>0;game.waveSpawned=game.waveGoal;game.waveBreak=-999;game.player.attack=game.partner.attack=999;game.drainEvents();return game;};
const gate=(game,area)=>{game.area=area;game.wave=area*2+2;game.exitOpen=true;game.exitDelay=0;game.pendingBlessings=0;Object.assign(game.player,{x:game.exitPoint.x,z:game.exitPoint.z});return game.crossExit();};
const kill=game=>{const e=game.spawnEnemy('moss',10,10);game.hit(e,999,0,0);return e;};
test('legacy progression gains empty mission and equipment records without losing character or material data',()=>{
  const raw={characters:{nyanluna:{level:20,xp:123,breaks:0,tree:['origin']},future:{level:3,xp:4}},inventory:{limitStone:2,starBud:8}};
  const p=normalizeProgression(raw,HEROES);assert.equal(p.characters.nyanluna.xp,123);assert.equal(p.characters.future.level,3);assert.equal(p.inventory.limitStone,2);assert.deepEqual(p.equipment,{owned:[],loadout:{}});assert.deepEqual(p.missions.claimed,[]);assert.equal(STAGE_MISSIONS.length,213);assert.equal(Object.keys(WEAPONS).length,5);
});
test('stage hunt progress accumulates across runs, remains separate by stage, and grants its reward only once',()=>{
  let g=quiet(new RecruitedAdventure());for(let i=0;i<12;i++)kill(g);assert.equal(g.progression.inventory.starBud,12);const prior=structuredClone(g.progression);
  g=quiet(new RecruitedAdventure({progression:prior}));for(let i=0;i<12;i++)kill(g);assert.equal(g.progression.inventory.starBud,24);assert.equal(g.progression.missions.claimed.includes('meadow-hunt'),false);assert.equal(g.progression.missions.stages[1].kills,0);
  kill(g);assert.equal(g.progression.inventory.starBud,25);gate(g,2);assert.equal(g.progression.inventory.starBud,41);assert.equal(g.earnedMissions.filter(id=>id==='meadow-hunt').length,1);assert.equal(prior.missions.stages[0].kills,12);
});
test('actual crystal collection advances mission counts without granting XP or duplicate rewards',()=>{
  const g=quiet(new RecruitedAdventure());const before=structuredClone(g.progression.characters);g.orbs=[{id:999,x:10,z:10,value:12,age:0}];g.collectAll();assert.equal(g.progression.inventory.moonDew,0);assert.equal(g.progression.missions.stages[0].crystals,12);g.collectAll();g.addCrystals(50);assert.equal(g.progression.inventory.moonDew,0);assert.deepEqual(g.progression.characters,before);gate(g,2);assert.equal(g.progression.inventory.moonDew,2);assert.ok(g.progression.missions.claimed.includes('meadow-crystals'));
});
test('normal clears never award unique gear or the challenge limit stone, even with perfect fast clears',()=>{
  const g=new RecruitedAdventure();for(let area=0;area<3;area++){assert.equal(gate(g,area),true);assert.equal(g.crossExit(),false);if(area<2)g.advanceStage();}
  assert.equal(g.progression.equipment.owned.length,0);assert.equal(g.progression.inventory.limitStone,0);assert.deepEqual(g.progression.missions.claimed,['meadow-clear','ruins-clear','dawn-clear']);assert.equal(g.progression.inventory.starBud,27);
});
for(const [area,seconds,hits,item] of [[0,55,1,'meadow-charm'],[1,70,1,'ruins-lens'],[2,80,0,'dawn-seal']])test(`unique stage ${area+1} checks difficulty, time and hits at the gate`,()=>{
  for(const [extraTime,extraHits,success] of [[0,0,true],[.001,0,false],[0,1,false]]){
    const g=new RecruitedAdventure({difficulty:'hard'});g.time=seconds+100+extraTime;g.stageTrial={startedAt:100,hits:hits+extraHits};g.runHits=5;assert.equal(gate(g,area),true);if(area<2){assert.equal(g.progression.equipment.owned.includes(item),false);g.phase='playing';gate(g,2);}assert.equal(g.progression.equipment.owned.includes(item),success);
    const before=structuredClone(g.progression);assert.equal(g.crossExit(),false);assert.deepEqual(g.progression,before);
  }
});
test('the limit stone trial checks total chapter time and all earlier damage, not just the final stage',()=>{
  for(const [time,hits,success] of [[210,0,true],[210.001,0,false],[80,1,false]]){
    const g=new RecruitedAdventure({difficulty:'hard',act:3});g.time=time;g.stageTrial={startedAt:time-20,hits:0};g.runHits=hits;gate(g,2);assert.equal(g.progression.inventory.limitStone,Number(success));assert.equal(g.progression.missions.claimed.includes('chapter-master'),success);
  }
});
test('damage counts cannot be erased by healing, hero swaps or advancing a stage; paused time does not count',()=>{
  const g=quiet(new RecruitedAdventure({difficulty:'hard'}));g.player.invincible=0;g.hurt(10,0,0);g.heal(100);g.switchHero();assert.equal(g.runHits,1);assert.equal(g.stageTrial.hits,1);g.pause();g.tick(.05);assert.equal(g.time,0);g.resume();g.time=40;gate(g,0);g.advanceStage();assert.equal(g.stageTrial.startedAt,40);assert.equal(g.stageTrial.hits,0);assert.equal(g.runHits,1);
  const trial=missionsFor(1).find(m=>m.trial);assert.equal(trialStatus(trial,g).seconds,0);
});
test('mission rewards, challenge ownership and completed flags survive reload without a second payout',()=>{
  let g=new RecruitedAdventure({difficulty:'hard'});gate(g,0);g.phase='playing';g.time=500;gate(g,2);const profile=JSON.parse(JSON.stringify(g.progression));assert.deepEqual(normalizeProgression(profile,HEROES),profile);
  g=new RecruitedAdventure({difficulty:'hard',progression:profile});gate(g,0);g.phase='playing';g.time=500;gate(g,2);assert.equal(g.progression.inventory.starBud,profile.inventory.starBud);assert.deepEqual(g.progression.equipment.owned,['meadow-charm']);assert.deepEqual(g.earnedMissions,[]);
});
test('locked, wrong-owner and duplicate relic slots are rejected; invalid saves are sanitized',()=>{
  const e=normalizeEquipment({owned:['meadow-charm','meadow-charm','unknown'],loadout:{nyanluna:'meadow-charm',tsukineko:'meadow-charm',other:'dawn-seal'}});assert.deepEqual(e,{owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}});
  assert.equal(equipUnique(e,'tsukineko','meadow-charm'),false);assert.equal(equipUnique(e,'nyanluna','ruins-lens'),false);assert.equal(equipUnique(e,'nyanluna','nox-rifle'),false);assert.equal(equipUnique(e,'unknown','meadow-charm'),false);
  assert.equal(equipUnique(e,'nyanluna',''),true);assert.equal(equipUnique(e,'tsukineko','meadow-charm'),true);
});
test('relic stats affect only their wearer in real attacks and defense while swaps preserve individual HP',()=>{
  const profile=normalizeProgression({},HEROES);profile.equipment.owned=['meadow-charm','ruins-lens','dawn-seal'];equipUnique(profile.equipment,'nyanluna','meadow-charm');equipUnique(profile.equipment,'tsukineko','ruins-lens');
  const g=quiet(new RecruitedAdventure({progression:profile}));assert.equal(g.player.maxHp,210);assert.equal(g.statsFor(1).maxHp,210);assert.equal(g.statsFor(1).attack,26*1.12);g.player.hp=105;g.switchHero();assert.equal(g.player.maxHp,210);assert.equal(g.player.hp,210);
  g.rng=()=>.9;const target=g.spawnEnemy('golem',0,6);g.attackFrom(g.player,1);g.player.attack=g.partner.attack=999;for(let i=0;i<7;i++)g.tick(1/60);assert.ok(Math.abs(target.maxHp-target.hp-g.statsFor(1).attack)<1e-8);
  equipUnique(profile.equipment,'tsukineko','dawn-seal');const armored=new RecruitedAdventure({hero:1,progression:profile});armored.player.invincible=0;armored.hurt(100,0,0);assert.ok(Math.abs(210-armored.player.hp-10000/126)<1e-8);assert.equal(characterStats(HEROES[1],profile.characters.tsukineko).defense,14);assert.equal(combatStats(profile,HEROES[1]).defense,26);
  const restored=normalizeProgression(JSON.parse(JSON.stringify(profile)),HEROES);assert.deepEqual(restored.equipment,profile.equipment);
});
test('defeat does not count late kills or crystals towards missions',()=>{
  const g=quiet(new RecruitedAdventure({party:['nyanluna']})),enemy=g.spawnEnemy('moss',0,8);g.player.invincible=0;g.hurt(999,0,0);const before=structuredClone(g.progression);g.hit(enemy,999,0,0);g.addCrystals(50);assert.deepEqual(g.progression,before);
});
