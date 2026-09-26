import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {ENEMY_TYPES,CHAPTER_ONE_ENEMIES,CHAPTER_TWO_ENEMIES,enemyForSpawn,enemyRosterForAct,distanceToHazard,isRangedEnemy} from '../src/enemies.js';
import {Box3} from 'three';
import {createTelegraph,updateTelegraph} from '../src/enemy-effects.js';
import {ACTS} from '../src/acts.js';
import {encounterPreparation} from '../src/encounter-ui.js';
import {levelThirtyProfile,playRun} from './chapter-two-fixtures.js';
function quiet(act=4,difficulty='normal'){
 const g=new Adventure({act,difficulty,seed:1,hero:1,progression:levelThirtyProfile()});
 g.enemies=[];g.projectiles=[];g.hazards=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;
 g.player.attack=g.partner.attack=999;Object.assign(g.player,{x:0,z:3,invincible:0});g.drainEvents();return g;
}
function tick(g,seconds){for(let i=0;i<Math.ceil(seconds*60);i++)g.tick(1/60);}
function cast(type,{act=4,difficulty='normal'}={}){const g=quiet(act,difficulty),e=g.spawnEnemy(type,0,type==='reaper'?0:-5);e.special=0;g.tick(1/60);return {g,e};}
test('all chapter-two spawns, including ranged-cap fallback, use an entirely separate roster',()=>{
 assert.equal(new Set([...CHAPTER_ONE_ENEMIES,...CHAPTER_TWO_ENEMIES]).size,12);
 for(let act=0;act<8;act++){
  const roster=enemyRosterForAct(act);assert.deepEqual(roster,act<4?CHAPTER_ONE_ENEMIES:CHAPTER_TWO_ENEMIES);
  for(let wave=1;wave<=5;wave++)for(let index=0;index<30;index++)for(let r=0;r<100;r++)assert.ok(roster.includes(enemyForSpawn(act,wave,index,r/100)));
  if(act<4)continue;
  const g=quiet(act);for(let i=0;i<4;i++)g.spawnEnemy('matchlock',i*2,-8);
  g.wave=1;g.waveSpawned=1;g.spawn();assert.equal(g.enemies.at(-1).type,'reaper');
  assert.equal(g.enemies.filter(e=>isRangedEnemy(e.type)).length,4);
  g.wave=6;g.waveSpawned=0;g.spawn();assert.equal(g.enemies.at(-1).bossId,ACTS[act].bossId);
 }
});
test('all four acts advertise Lv.30 with preparation guidance; lower levels can still enter',()=>{
 for(const act of ACTS.slice(0,8)){const html=encounterPreparation(act,['nyanluna'],levelThirtyProfile({level:20}),HEROES);if(act.id<4){assert.equal(html,'');continue;}
  assert.equal(act.recommendedLevel,30);assert.match(html,/適正 Lv.30/);assert.match(html,/にゃんるな Lv.20/);assert.match(html,/現在のレベルでも出撃/);assert.match(html,/data-prepare-levels/);
  const g=new Adventure({act:act.id,progression:levelThirtyProfile({level:20})});assert.equal(g.phase,'playing');assert.equal(g.act,act.id);
 }
 assert.match(encounterPreparation(ACTS[4],['nyanluna','tsukineko'],levelThirtyProfile(),HEROES),/育成の目安を達成/);
});
test('the reaper gives a full locked melee warning and a recovery window',()=>{
 const {g,e}=cast('reaper');assert.equal(g.hazards.length,1);const h=g.hazards[0],hp=g.player.hp;
 assert.equal(h.shape,'line');assert.equal(h.width,3.4);assert.ok(h.timer>.9);assert.equal(h.damage,38);
 tick(g,.7);assert.equal(g.player.hp,hp);g.player.x=6;tick(g,.3);assert.equal(g.player.hp,hp);assert.ok(e.recovery>0);
});
test('matchlock warns before all three fixed-direction shots and never tracks after aim locks',()=>{
 const {g,e}=cast('matchlock'),angle=e.cast.angle;
 assert.equal(g.hazards.length,3);assert.equal(g.projectiles.length,0);g.player.x=9;tick(g,.85);assert.equal(g.projectiles.length,0);
 tick(g,.12);assert.equal(g.projectiles.length,1);tick(g,.2);assert.equal(g.projectiles.length,2);tick(g,.2);assert.equal(g.projectiles.length,3);
 for(const [i,b] of g.projectiles.entries()){assert.equal(b.kind,'enemyMusket');assert.ok(Math.abs(Math.atan2(b.vx,b.vz)-(angle+(i-1)*.11))<1e-8);assert.equal(b.damage,34);}
 assert.equal(e.salvo,null);
});
test('a queued volley freezes during pause/blessing choice and is cancelled when its caster dies',()=>{
 const {g,e}=cast('matchlock');g.player.x=9;tick(g,1);assert.equal(g.projectiles.length,1);assert.ok(e.salvo);const s=structuredClone(e.salvo);
 g.pause();tick(g,2);assert.deepEqual(e.salvo,s);g.resume();g.addCrystals(8);g.tick(1/60);assert.equal(g.phase,'upgrade');const frozen=structuredClone(e.salvo);tick(g,2);assert.deepEqual(e.salvo,frozen);
 g.chooseSkill(g.offers[0].id);g.hit(e,99999,0,0,false,false,'tsukineko');tick(g,.5);assert.equal(g.projectiles.filter(b=>b.owner==='enemy').length,1);assert.equal(g.hazards.length,0);
});
test('storm lantern circles resolve in order at the original three marked positions',()=>{
 const {g}=cast('stormlantern'),positions=g.hazards.map(h=>[h.x,h.z]);assert.equal(positions.length,3);const times=g.hazards.map(h=>h.timer);assert.ok(times[0]<times[1]&&times[1]<times[2]);
 const hp=g.player.hp;g.player.x=8;tick(g,1.05);assert.equal(g.hazards.length,3);assert.deepEqual(g.hazards.map(h=>[h.x,h.z]),positions);tick(g,.15);assert.equal(g.hazards.length,2);tick(g,.4);assert.equal(g.hazards.length,1);tick(g,.4);assert.equal(g.hazards.length,0);assert.equal(g.player.hp,hp);
});
test('pest moth fires five distinct fan shots only after its warning',()=>{
 const {g}=cast('pestmoth');assert.equal(g.hazards.length,5);g.player.x=9;tick(g,1);assert.equal(g.projectiles.length,0);tick(g,.15);
 assert.equal(g.projectiles.length,5);assert.ok(g.projectiles.every(b=>b.kind==='enemyPollen'));assert.equal(new Set(g.projectiles.map(b=>Math.atan2(b.vx,b.vz))).size,5);
});
test('armored crab leaves a real safe gap between its two claw warnings',()=>{
 const {g}=cast('ironcrab');assert.equal(g.hazards.length,2);for(const h of g.hazards){assert.ok(distanceToHazard(0,3,h)>.45);assert.equal(h.damage,46);assert.ok(h.timer>1.2);}
 const hp=g.player.hp;tick(g,1.3);assert.equal(g.player.hp,hp);
});
test('ram cart locks its full-width charge, then stops for counterattacks',()=>{
 const {g,e}=cast('ramcart'),z=e.z;assert.equal(g.hazards[0].kind,'charge');assert.ok(g.hazards[0].width>=e.radius*2);assert.ok(g.hazards[0].timer>1);g.player.x=9;
 tick(g,.95);assert.equal(e.z,z);tick(g,.9);assert.ok(e.z>z+8);assert.ok(e.recovery>0);const end=e.z;tick(g,.25);assert.equal(e.z,end);
});
test('normal enemy special damage scales by exactly 30% in challenge mode',()=>{
 for(const type of ['reaper','stormlantern','ironcrab']){const normal=cast(type),hard=cast(type,{difficulty:'hard'});assert.equal(hard.g.hazards[0].damage,normal.g.hazards[0].damage*1.3);}
});
test('all chapter-two bosses have stronger specials and enter a faster second phase once',()=>{
 for(let act=4;act<8;act++){
  const {g,e}=cast('boss',{act});assert.ok(e.maxHp>=4200);assert.equal(e.damage,45);assert.equal(e.special,3.35);assert.ok(g.hazards[0].damage>=23*1.7);
  e.hp=e.maxHp*.49;e.cast=null;e.recovery=0;e.special=0;g.tick(1/60);assert.equal(e.enraged,true);assert.equal(e.special,2.5);assert.equal(g.drainEvents().filter(e=>e.type==='bossPhase').length,1);g.tick(1/60);assert.equal(g.drainEvents().filter(e=>e.type==='bossPhase').length,0);
 }
 const {e}=cast('boss',{act:0});assert.equal(e.damage,22);assert.equal(e.special,4.1);
});
for(const difficulty of ['normal','hard'])for(let act=4;act<8;act++)test(`Lv.30 can clear act ${act-3} (${difficulty}) without tree bonuses or unique equipment`,()=>{
 const g=playRun(new Adventure({act,difficulty,hero:1,seed:1,progression:levelThirtyProfile()}));assert.equal(g.phase,'victory',`wave ${g.wave} / HP ${g.player.hp}`);assert.equal(g.kills,ACTS[act].counts.reduce((a,b)=>a+b));assert.ok(g.player.hp>0);
});

test('dense telegraphs use two meshes while retaining their dimensions and independently animated fill',()=>{
 for(const shape of ['line','circle']){
  const h={shape,width:1.8,length:19,radius:3,x:2,z:-4,angle:.3,timer:1,total:1},m=createTelegraph(h),box=new Box3().setFromObject(m);
  assert.equal(m.children.length,2);assert.notEqual(m.children[0].material,m.children[1].material);
  assert.ok(Math.abs(box.max.x-box.min.x-(shape==='line'?1.885:6))<.01);assert.ok(Math.abs(box.max.z-box.min.z-(shape==='line'?19.085:6))<.01);
  updateTelegraph(m,h);const outline=m.children[1].material.opacity,start=m.children[0].material.opacity;h.timer=0;updateTelegraph(m,h);assert.ok(m.children[0].material.opacity>start);assert.equal(m.children[1].material.opacity,outline);
  m.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 }
});
