import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {FirstBattleTutorial,needsFirstBattleTutorial} from '../src/tutorial.js';
const tick=(g,frames=60,input={x:0,z:0})=>{for(let i=0;i<frames;i++)g.tick(1/60,input);};
const practiceToAttack=g=>{assert.equal(g.advanceTutorial(),true);tick(g,35,{x:1,z:0});assert.equal(g.tutorial.step.id,'dash');assert.equal(g.dash(1,0),true);assert.equal(g.tutorial.step.id,'attack');};

test('tutorial policy handles new, completed, recruited and legacy saves without losing progress',()=>{
  const fresh=normalizeProgression({},HEROES);assert.equal(needsFirstBattleTutorial(fresh),true);
  for(const value of [1,'true',{},null])assert.equal(normalizeProgression({tutorial:{firstBattleCompleted:value}},HEROES).tutorial.firstBattleCompleted,false);
  const done=normalizeProgression({...fresh,tutorial:{firstBattleCompleted:true}},HEROES);assert.equal(needsFirstBattleTutorial(done),false);assert.deepEqual(normalizeProgression(done,HEROES),done);
  assert.equal(needsFirstBattleTutorial(normalizeProgression({},HEROES,{chapterOneCleared:true})),false);
});
test('instructions cannot be completed by the wrong actions, stationary movement or next presses',()=>{
  const t=new FirstBattleTutorial();assert.equal(t.observe('dash'),false);assert.equal(t.next(),true);assert.equal(t.next(),false);
  for(const n of [0,-1,NaN,Infinity])assert.equal(t.observe('move',n),false);assert.equal(t.distance,0);
  assert.equal(t.observe('move',1),false);assert.equal(t.observe('move',1.5),true);assert.equal(t.step.id,'dash');assert.equal(t.observe('move',100),false);assert.equal(t.observe('dash'),true);assert.equal(t.observe('defeat'),true);assert.equal(t.next(),true);assert.equal(t.next(),true);assert.equal(t.active,false);assert.equal(t.next(),false);
});
test('introduction freezes enemies, movement and time; practice leaves damage, mission clocks and rewards untouched',()=>{
  const g=new Adventure({tutorial:true,difficulty:'hard',hero:1,party:['tsukineko'],progression:{story:{chapterOneCleared:true}}}),before=structuredClone(g.progression);
  assert.deepEqual(g.party,['nyanluna']);assert.equal(g.player.hero,0);tick(g,600,{x:1,z:1});assert.equal(g.player.x,0);assert.equal(g.time,0);assert.equal(g.enemies.length,0);assert.equal(g.dash(1,0),false);
  g.player.invincible=0;assert.equal(g.hurt(999,0,0),false);g.player.charge=100;assert.equal(g.ultimate(),false);g.player.charge=0;
  practiceToAttack(g);assert.equal(g.enemies.length,1);assert.equal(g.enemies[0].training,true);tick(g,200);assert.equal(g.tutorial.step.id,'crystals');
  assert.equal(g.time,0);assert.equal(g.kills,0);assert.equal(g.damageDealt,0);assert.equal(g.runHits,0);assert.equal(g.stageTrial.hits,0);assert.equal(g.player.charge,0);assert.equal(g.orbs.length,0);assert.deepEqual(g.earnedXp,{nyanluna:0,tsukineko:0,omsolo:0,mochinyafe:0,shizuku:0});assert.deepEqual(g.progression,before);
});
test('pause suspends tutorial actions and completion starts a clean, normally timed first wave',()=>{
  const g=new Adventure({tutorial:true,seed:21});g.pause();assert.equal(g.advanceTutorial(),false);assert.equal(g.skipTutorial(),false);g.resume();practiceToAttack(g);tick(g,200);g.advanceTutorial();g.pause();g.advanceTutorial();assert.equal(g.tutorial.step.id,'ready');g.resume();assert.equal(g.advanceTutorial(),true);
  assert.equal(g.tutorial.active,false);assert.equal(g.progression.tutorial.firstBattleCompleted,true);assert.equal(g.wave,1);assert.equal(g.player.x,0);assert.equal(g.player.z,3);assert.equal(g.player.dash,0);assert.equal(g.player.dashCooldown,0);assert.equal(g.enemies.length,0);assert.equal(g.projectiles.length,0);assert.equal(g.time,0);assert.equal(g.waveSpawned,0);
  tick(g,60);const normal=new Adventure({seed:21});tick(normal,60);assert.equal(g.time,normal.time);assert.deepEqual(g.enemies.map(({type,x,z,hp})=>({type,x,z,hp})),normal.enemies.map(({type,x,z,hp})=>({type,x,z,hp})));
  assert.equal(g.advanceTutorial(),false);assert.equal(g.skipTutorial(),false);assert.equal(g.drainEvents().filter(e=>e.type==='tutorialComplete').length,1);
});
test('skip works at every step without leaving a target, cooldown or duplicate reward behind',()=>{
  for(let step=0;step<6;step++){const g=new Adventure({tutorial:true});if(step>=1)g.advanceTutorial();if(step>=2)tick(g,35,{x:1,z:0});if(step>=3)g.dash(1,0);if(step>=4)tick(g,200);if(step>=5)g.advanceTutorial();assert.equal(g.tutorial.index,step);assert.equal(g.skipTutorial(),true);assert.equal(g.enemies.length,0);assert.equal(g.projectiles.length,0);assert.equal(g.kills,0);assert.equal(g.time,0);assert.equal(g.player.hp,g.player.maxHp);assert.equal(g.progression.tutorial.firstBattleCompleted,true);assert.equal(g.skipTutorial(),false);}
});
test('quitting an unfinished practice does not mark it complete; a replay preserves progression and recruitment',()=>{
  const before=normalizeProgression({story:{chapterOneCleared:true},characters:{nyanluna:{level:10,xp:3,tree:['origin']}},inventory:{limitStone:2,starBud:8},tutorial:{firstBattleCompleted:true}},HEROES),g=new Adventure({progression:before,tutorial:true});practiceToAttack(g);tick(g,200);g.skipTutorial();assert.deepEqual(g.progression,before);
  const unfinished=new Adventure({tutorial:true});practiceToAttack(unfinished);assert.equal(needsFirstBattleTutorial(normalizeProgression(unfinished.progression,HEROES)),true);
});
