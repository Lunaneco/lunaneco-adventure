import test from 'node:test';
import assert from 'node:assert/strict';
import {Raycaster,Vector3} from 'three';
import {Adventure,HEROES} from '../src/model.js';
import {BOSSES,distanceToHazard} from '../src/enemies.js';
import {tickEnemyBehavior} from '../src/enemy-combat.js';
import {createTelegraph,updateTelegraph} from '../src/enemy-effects.js';
import {normalizeProgression} from '../src/progression.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function battle(act,action=0,low=false){
 const progression=normalizeProgression({story:{version:2,actClears:Array(20).fill(true)},tutorial:{firstBattleCompleted:true}},HEROES);
 const g=new Adventure({act,seed:5,progression});g.enemies=[];g.hazards=[];g.projectiles=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;
 Object.assign(g.player,{x:0,z:0,attack:999,invincible:999});g.partner.attack=999;
 const e=g.spawnEnemy('boss',0,-7);Object.assign(e,{special:0,attack:999,speed:0,action});if(low)e.hp*=.49;g.drainEvents();
 tickEnemyBehavior(g,e,1/60);return {g,e};
}
const tick=(g,t)=>{for(let i=0;i<Math.ceil(t*60);i++)g.tick(1/60);};
const castDone=({g,e})=>tickEnemyBehavior(g,e,e.cast.remaining+.0001);
const dispose=m=>m.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});

test('all fifteen boss encounters have distinct geometry and chained attacks, with faster cooldowns',()=>{
 const signatures=[];
 for(const act of [...Array(12).keys(),20,21,22]){
  const actions=[];
  for(let action=0;action<3;action++){
   const {g,e}=battle(act,action),warnings=g.hazards;
   assert.ok(warnings.length>=2,`${act}/${action} must have follow-ups`);
   assert.ok(warnings.every(h=>h.total>=.65&&Number.isFinite(h.damage)));
   assert.ok(e.special<(act===22?2.4:act>=20?3.7:act>=8?3:act>=4?4.2:5.1));
   // Every promised attack has either delayed damaging geometry or repeated shots.
   assert.ok(new Set(warnings.map(h=>h.timer)).size>1||e.cast.waves>1);
   actions.push(warnings.map(h=>[h.shape??'circle',h.x,h.z,h.radius,h.innerRadius,h.angle,h.width,h.timer,h.damage>0]));
  }
  signatures.push(JSON.stringify(actions));
 }
 assert.equal(new Set(signatures).size,15);
});
test('each normal boss enters its expanded phase once; all three attack cycles remain reachable',()=>{
 for(let act=0;act<12;act++){
  const normal=battle(act),late=battle(act,0,true);assert.equal(late.e.enraged,true);assert.ok(late.e.special<normal.e.special);
  assert.equal(late.g.drainEvents().filter(e=>e.type==='bossPhase').length,1);
  tick(late.g,25);const events=late.g.drainEvents();assert.equal(events.filter(e=>e.type==='bossPhase').length,0);
  const labels=new Set(events.filter(e=>e.type==='bossAttack').map(e=>e.label));for(const label of BOSSES[late.e.bossId].attacks)assert.ok(labels.has(label),`${act}: ${label}`);
 }
});
test('annular collision and rendered fill agree: the empty middle and outside are safe',()=>{
 const h={shape:'ring',x:2,z:-3,innerRadius:3,radius:6,timer:1,total:1},m=createTelegraph(h);updateTelegraph(m,h);m.updateMatrixWorld(true);
 assert.equal(m.children.length,2);
 for(const [r,expected] of [[0,3],[2,1],[3,0],[4,-1],[5,-1],[6,0],[7,1]]){
  near(distanceToHazard(h.x+r,h.z,h),expected);
  if(r!==3&&r!==6){const hits=new Raycaster(new Vector3(h.x+r,10,h.z),new Vector3(0,-1,0)).intersectObject(m.children[0]);assert.equal(hits.length>0,r>3&&r<6);}
 }
 dispose(m);
});
test('ring damage hits the band only, after its timer, and still applies defense',()=>{
 for(const radius of [0,4,6,11]){
  const {g,e}=battle(3);const h=g.hazards.find(h=>h.shape==='ring');g.hazards=[h];e.cast=null;e.special=999;
  Object.assign(g.player,{x:h.x+radius,z:h.z,invincible:0});const hp=g.player.hp;
  h.timer=.2;tick(g,.1);assert.equal(g.player.hp,hp);tick(g,.12);
  assert.equal(g.runHits,radius===6?1:0);assert.equal(hp>g.player.hp,radius===6);
 }
});
test('multi-shot fans follow every original warning even if caster and player move',()=>{
 for(const act of [0,1,5]){
  const run=battle(act,act===1?2:1),{g,e}=run,warnings=structuredClone(g.hazards),pattern=structuredClone(e.cast);
  Object.assign(g.player,{x:10,z:5});Object.assign(e,{x:-4,z:-10});castDone(run);
  while(e.salvo)tickEnemyBehavior(g,e,e.salvo.timer+.0001);
  assert.equal(g.projectiles.length,warnings.length);
  for(let i=0;i<g.projectiles.length;i++){
   const b=g.projectiles[i],h=warnings[i];near(Math.atan2(b.vx,b.vz),h.angle);
   near(b.x,pattern.origin.x+Math.sin(h.angle)*(e.radius+.2));near(b.z,pattern.origin.z+Math.cos(h.angle)*(e.radius+.2));
  }
 }
});
test('all radial salvos aim at the player and show the real escape gap for every round',()=>{
 for(const act of [2,3,7,11,20,21,22])for(const low of [false,true]){
  const run=battle(act,1,low),{g,e}=run,c=structuredClone(e.cast),warnings=g.hazards.filter(h=>h.kind==='volley');
  assert.equal(warnings.length,c.waves);castDone(run);
  for(let round=0;round<c.waves;round++){
   if(round)tickEnemyBehavior(g,e,e.salvo.timer+.0001);
   const shots=g.projectiles.slice(round*(c.count-2)),h=warnings[round],step=Math.PI*2/c.count;
   assert.equal(shots.length,c.count-2);assert.ok(shots.some(b=>Math.abs(Math.atan2(b.vx,b.vz)-(c.angle+c.turn*round))<1e-7));
   for(const b of shots){const a=Math.atan2(b.vx,b.vz),delta=Math.abs(Math.atan2(Math.sin(a-h.gapAngle),Math.cos(a-h.gapAngle)));assert.ok(delta>=step*1.49);}
   const m=createTelegraph(h);updateTelegraph(m,h);m.updateMatrixWorld(true);const radius=(h.innerRadius+h.radius)/2;
   for(const [a,filled] of [[h.gapAngle,false],[h.gapAngle+Math.PI,true]]){const ray=new Raycaster(new Vector3(h.x+Math.sin(a)*radius,10,h.z+Math.cos(a)*radius),new Vector3(0,-1,0));assert.equal(ray.intersectObject(m.children[0]).length>0,filled);}
   dispose(m);
  }
  assert.equal(e.salvo,null);
 }
});
test('boss follow-ups freeze for pause and blessing choices; defeat, gates and kills stop new shots',()=>{
 for(const end of ['pause','upgrade','kill','gate','defeat']){
  const run=battle(22,1,true),{g,e}=run;castDone(run);assert.ok(e.salvo);const count=g.projectiles.length,queued=structuredClone(e.salvo),hazards=structuredClone(g.hazards);
  if(end==='pause')g.pause();if(end==='upgrade'){g.pendingBlessings=1;g.offerSkills();}
  if(end==='kill')g.hit(e,1e9,0,0);
  if(end==='gate')g.openExit();
  if(end==='defeat'){g.player.invincible=0;g.heroHealth[g.heroId(g.partnerHero)].hp=0;g.hurt(1e9,0,0);assert.equal(g.phase,'defeat');}
  tick(g,1);
  if(['pause','upgrade'].includes(end)){assert.deepEqual(e.salvo,queued);assert.deepEqual(g.hazards,hazards);assert.equal(g.projectiles.length,count);}
  else{assert.equal(g.drainEvents().filter(e=>e.type==='enemyShot').length,count);assert.equal(g.hazards.length,0);}
 }
});
test('every damaging sequence leaves walkable safe ground at each detonation',()=>{
 for(let act=0;act<15;act++)for(let action=0;action<3;action++){
  const {g}=battle(act,action,true),damaging=g.hazards.filter(h=>h.damage>0),times=[...new Set(damaging.map(h=>h.timer))];
  for(const time of times){const simultaneous=damaging.filter(h=>Math.abs(h.timer-time)<.05);let safe=0;
   for(let x=-12;x<=12;x++)for(let z=-12;z<=12;z++)if(g.canWalk(x,z)&&simultaneous.every(h=>distanceToHazard(x,z,h)>.7))safe++;
   assert.ok(safe>20,`${act}/${action}: ${safe} safe points at ${time}`);
  }
 }
});

test('later warnings stay faint until their turn, preserving visible space in layered attacks',()=>{
 const h={shape:'ring',x:0,z:0,innerRadius:3,radius:7,timer:2,total:2},m=createTelegraph(h);updateTelegraph(m,h);
 assert.ok(m.children[0].material.opacity<.03);assert.ok(m.children[1].material.opacity<.3);
 h.timer=.9;updateTelegraph(m,h);assert.ok(m.children[0].material.opacity>.2);assert.ok(m.children[1].material.opacity>.7);dispose(m);
});
