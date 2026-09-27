import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {PRISM_ENEMIES} from '../src/chapter-five-enemies.js';
import {enemyForSpawn,isRangedEnemy,distanceToHazard} from '../src/enemies.js';
import {tickEnemyBehavior} from '../src/enemy-combat.js';
function arena(act=16,difficulty='normal'){
 const g=new Adventure({act,difficulty,seed:3,hero:1,party:['tsukineko'],progression:{story:{version:2,actClears:Array(20).fill(true)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}}});
 g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.player.x=g.player.z=0;g.player.invincible=999;g.drainEvents();return g;
}
const advance=(g,e,seconds)=>{for(let i=0;i<Math.ceil(seconds*60);i++)tickEnemyBehavior(g,e,1/60);};
test('all seven crystal enemies appear in every chapter-five wave while ranged groups remain capped',()=>{
 const roster=Object.keys(PRISM_ENEMIES);
 for(let act=16;act<20;act++)for(let wave=1;wave<=5;wave++)assert.deepEqual(roster.map((_,i)=>enemyForSpawn(act,wave,i,.5)),roster);
 const g=arena();g.waveSpawned=0;g.rng=()=>.99;for(let i=0;i<24;i++)g.spawn();assert.equal(g.enemies.filter(e=>isRangedEnemy(e.type)).length,5);assert.ok(g.enemies.every(e=>roster.includes(e.type)));
});
test('each chapter-five role matches its chapter-four attack frequency and chain timing over one minute',t=>{
 const pairs=[['prismCrawler','demonImp'],['prismBat','demonBat'],['prismHound','demonHound'],['prismLancer','demonReaper'],['prismGolem','demonArmor'],['prismWisp','demonWitch'],['prismBloom','demonEye']];
 function sample(type,act){const g=arena(act),e=g.spawnEnemy(type,0,-6);e.special=0;let casts=0;for(let i=0;i<3600;i++){e.x=0;e.z=-6;tickEnemyBehavior(g,e,1/60);casts+=g.drainEvents().filter(v=>v.id===e.id&&(v.type==='enemyCast'||v.type===type)).length;}return {casts,hazards:g.hazards.length,shots:g.projectiles.length};}
 for(const [prism,demon] of pairs){const actual=sample(prism,16),reference=sample(demon,12);t.diagnostic(`${prism}: ${JSON.stringify(actual)} / chapter four ${JSON.stringify(reference)}`);assert.ok(actual.casts>=8,prism);assert.deepEqual(actual,reference,prism);}
});
test('crystal missiles wait for their tell, have bounded homing, and two three-way volleys stay at their warned origin',()=>{
 for(const type of ['prismBat','prismWisp']){
  const g=arena(),e=g.spawnEnemy(type,0,-6);e.special=0;tickEnemyBehavior(g,e,.01);assert.equal(g.projectiles.length,0);assert.equal(e.cast.total,.75);const angle=e.cast.angle,origin=e.cast.origin;
  advance(g,e,.7);assert.equal(g.projectiles.length,0);g.player.x=9;e.x=-5;advance(g,e,.5);
  assert.equal(g.projectiles.length,type==='prismBat'?2:6);for(const b of g.projectiles){assert.equal(b.homing,1.5);assert.equal(b.turnRate,1.35);assert.ok(Math.abs(b.x-origin.x)<1.5);}
  assert.equal(g.projectiles[0].vx,Math.sin(angle+(type==='prismBat'?-.2:-.5))*7.8);
 }
});
test('heavy crystal shockwaves leave a safe inner area and lancer stripes lock before striking',()=>{
 const g=arena(),e=g.spawnEnemy('prismGolem',0,-6);e.special=0;tickEnemyBehavior(g,e,.01);const [center,outer]=g.hazards;
 assert.ok(center.timer<outer.timer);assert.ok(distanceToHazard(e.x,e.z,outer)>0);assert.ok(distanceToHazard(e.x+5,e.z,outer)<0);
 const lancer=g.spawnEnemy('prismLancer',2,-6);lancer.special=0;tickEnemyBehavior(g,lancer,.01);const lines=g.hazards.slice(2),before=structuredClone(lines);g.player.x=-9;advance(g,lancer,.4);assert.deepEqual(lines,before);assert.ok(lines[0].timer<lines[1].timer);assert.ok(Math.abs(lines[1].angle-lines[0].angle-Math.PI/2)<1e-8);
});
test('crystal follow-up telegraphs re-aim only between strikes and freeze or cancel with their caster',()=>{
 for(const type of ['prismBloom','prismHound']){
  const g=arena(),e=g.spawnEnemy(type,0,-6);e.special=0;tickEnemyBehavior(g,e,.01);assert.ok(e.prismFollowup);const before=structuredClone({followup:e.prismFollowup,cast:e.cast,hazards:g.hazards});
  g.pause();advance(g,e,2);assert.deepEqual({followup:e.prismFollowup,cast:e.cast,hazards:g.hazards},before);g.resume();
  g.player.x=5;advance(g,e,type==='prismBloom'?.5:2);assert.ok(g.hazards.length>before.hazards.length);const next=g.hazards.at(-1);if(type==='prismBloom')assert.equal(next.x,5);else assert.ok(next.angle!==before.cast.angle);
  g.hit(e,1e9,0,0);g.tick(.01);advance(g,e,3);assert.equal(g.hazards.filter(h=>h.sourceId===e.id).length,0);assert.equal(g.projectiles.filter(b=>b.sourceId===e.id).length,0);
 }
});
test('dragon volleys and breaths are two-hit chains, escalating to three hits and five-way fans at half HP',()=>{
 for(const low of [false,true]){
  const g=arena(),e=g.spawnEnemy('boss',0,-8);e.special=0;if(low)e.hp=e.maxHp*.49;tickEnemyBehavior(g,e,.01);
  assert.equal(e.cast.waves,low?3:2);assert.equal(e.cast.offsets.length,low?5:3);const angle=e.cast.angle;
  g.player.x=10;advance(g,e,1.7);assert.equal(g.projectiles.length,low?15:6);assert.equal(g.projectiles[0].vx,Math.sin(angle+(low?-.56:-.4))*(low?10:8.5));
  e.special=0;tickEnemyBehavior(g,e,.01);const lines=g.hazards.filter(h=>h.damage>0);assert.equal(lines.length,low?3:2);assert.ok(lines.every(h=>h.shape==='line'&&h.width===2.4&&h.length===27));assert.ok(lines.every((h,i)=>i===0||h.timer>lines[i-1].timer));
  const locked=structuredClone(lines);g.player.z=10;advance(g,e,.2);assert.deepEqual(lines,locked);g.hit(e,1e9,0,0);g.tick(.01);assert.equal(g.hazards.filter(h=>h.sourceId===e.id).length,0);
 }
});
test('new crystal specials keep the existing 30-percent challenge damage multiplier',()=>{
 for(const type of Object.keys(PRISM_ENEMIES)){
  const results=['normal','hard'].map(mode=>{const g=arena(16,mode),e=g.spawnEnemy(type,0,-6);e.special=0;advance(g,e,1.8);return [...g.hazards.filter(h=>h.damage>0).map(h=>h.damage),...g.projectiles.map(b=>b.damage),e.damage];});
  assert.equal(results[0].length,results[1].length,type);for(let i=0;i<results[0].length;i++)assert.ok(Math.abs(results[1][i]-results[0][i]*1.3)<1e-8,type);
 }
});
