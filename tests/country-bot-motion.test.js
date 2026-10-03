import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {trialPosition,trialShotRisk} from './country-bot.js';
import {PRIM_MOUNT} from '../src/prim-combat.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function game(hero){
 const progression=normalizeProgression({story:{version:2,actClears:Array(32).fill(true)},tutorial:{firstBattleCompleted:true}},HEROES);
 const g=new Adventure({hero,party:[HEROES[hero].id],progression});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=999;g.skills.stride=2;return g;
}
test('challenge pilot predicts each character walking speed instead of assuming 5.6',()=>{
 for(let hero=0;hero<HEROES.length;hero++){
  const g=game(hero),angle=.4,predicted=trialPosition(g,angle,.05);g.tick(.05,{x:Math.sin(angle),z:Math.cos(angle)});
  close(g.player.x,predicted.x);close(g.player.z,predicted.z);
 }
});
test('challenge pilot predicts actual new and ongoing dash speed and its locked direction',()=>{
 for(let hero=0;hero<HEROES.length;hero++){
  const g=game(hero),angle=.4,predicted=trialPosition(g,angle,.05,true);g.dash(Math.sin(angle),Math.cos(angle));g.tick(.05,{x:-1,z:0});
  close(g.player.x,predicted.x);close(g.player.z,predicted.z);
  const ongoing=trialPosition(g,-1,.05);g.tick(.05,{x:Math.sin(-1),z:Math.cos(-1)});close(g.player.x,ongoing.x);close(g.player.z,ongoing.z);
 }
});
test('challenge pilot honors mounted movement and resumes walking after the remaining dash',()=>{
 const g=game(1);g.mount.active=true;const walk=trialPosition(g,Math.PI/2,.1);close(walk.x,PRIM_MOUNT.speed*1.24*.1);
 const dash=trialPosition(g,Math.PI/2,.3,true);close(dash.x,PRIM_MOUNT.dashSpeed*.22+PRIM_MOUNT.speed*1.24*.08);
 g.mount.active=false;Object.assign(g.player,{dash:.05,dashSpeed:20,dx:0,dz:1});
 const turn=trialPosition(g,Math.PI/2,.2);close(turn.x,HEROES[1].moveSpeed*1.24*.15);close(turn.z,g.player.z+1);
});
test('challenge pilot catches a fast projectile crossing between forecast samples',()=>{
 const g=game(3);g.player.invincible=0;
 const motion={speed:5,dashSpeed:20},shot={x:-1.08,z:g.player.z,vx:18,vz:5,radius:.2,life:1.05};
 for(const t of [.12,.28,.48,.75,1.05]){
  const p=trialPosition(g,0,t,false,motion);
  assert.ok(Math.hypot(p.x-shot.x-shot.vx*t,p.z-shot.z-shot.vz*t)-shot.radius>.7);
 }
 assert.ok(trialShotRisk(g,0,shot,false,motion)>=100);
});
test('challenge pilot does not dodge shots that expire before invulnerability ends',()=>{
 const g=game(3);g.player.invincible=.5;
 assert.equal(trialShotRisk(g,0,{x:-1,z:g.player.z,vx:18,vz:0,radius:.2,life:.2}),0);
});
