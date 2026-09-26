import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {EXTRA_ACTS} from '../src/acts.js';
import {extraCombatFor} from '../src/extra-stages.js';
import {enemyRosterForAct,distanceToHazard} from '../src/enemies.js';
import {tickEnemyBehavior} from '../src/enemy-combat.js';
import {mochiCryHit} from '../src/mochi-combat.js';
import {fieldFor,contains,walkingLayout,navGrid,spawnPoint} from '../src/terrain.js';
import {extraStageSelector,extraDifficultyView} from '../src/extra-stage-ui.js';
import {encounterPreparation} from '../src/encounter-ui.js';
import {normalizeProgression} from '../src/progression.js';
const profile=()=>normalizeProgression({story:{version:2,actClears:Array(12).fill(true)},tutorial:{firstBattleCompleted:true}},HEROES);
function quiet(act=18,type='boss',distance=7){
 const g=new Adventure({act,progression:profile(),seed:5,party:['nyanluna','mochinyafe'],difficulty:'hard'});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.projectiles=[];g.hazards=[];
 Object.assign(g.player,{x:0,z:0,attack:999,invincible:999});g.partner.attack=999;
 const e=g.spawnEnemy(type,0,-distance);Object.assign(e,{special:0,attack:999});g.drainEvents();return {g,e};
}
const tick=(g,t)=>{for(let i=0;i<Math.ceil(t*60);i++)g.tick(1/60);};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('new EX exceeds both existing EXs in every wave count, total durability, boss damage and combat pressure',()=>{
 const [moon,rice,apex]=EXTRA_ACTS,combat=extraCombatFor(apex),boss=quiet().e;
 function healthBudget(act){const {g}=quiet(act.id);let hp=0;for(let wave=1;wave<=5;wave++){g.wave=wave;for(let i=0;i<act.counts[wave-1];i++)hp+=g.spawnEnemy(enemyRosterForAct(act.id)[i%enemyRosterForAct(act.id).length],0,-5).maxHp;}return hp;}
 const budget=healthBudget(apex);
 for(const old of [moon,rice]){const oldCombat=extraCombatFor(old),enemy=quiet(old.id).e;assert.ok(boss.maxHp>enemy.maxHp*1.6);assert.ok(boss.damage>enemy.damage);assert.ok(budget>healthBudget(old)*1.5);for(let i=0;i<5;i++)assert.ok(apex.counts[i]>old.counts[i]);for(const key of ['cooldownRate','moveScale','projectileScale','rangedLimit'])assert.ok(combat[key]>oldCombat[key]);for(const key of ['telegraphScale','spawnScale'])assert.ok(combat[key]<oldCombat[key]);}
 assert.equal(boss.maxHp,28600);assert.equal(boss.name,'ダークもちにゃふぇ・夢蝕王');
});
test('all seven Mochi enemies actually consume attack cooldown faster in EX while story cadence is unchanged',()=>{
 for(const type of enemyRosterForAct(18)){const a=quiet(8,type),b=quiet(18,type);a.e.special=b.e.special=5;tickEnemyBehavior(a.g,a.e,.1);tickEnemyBehavior(b.g,b.e,.1);near(a.e.special,4.9);near(b.e.special,4.79);assert.ok(b.e.damage>a.e.damage);assert.ok(b.e.speed>a.e.speed);}
});
test('EX arrows retain their four visible directions, gain speed and damage, and Mochi can interrupt the remaining burst',()=>{
 const {g,e}=quiet(18,'mochiSkeleton');tick(g,1/60);const angles=g.hazards.map(h=>h.angle);assert.equal(angles.length,4);assert.ok(e.cast.total>.55);near(e.cast.total,g.hazards[0].total);g.player.x=8;tick(g,e.cast.total+.02);assert.ok(e.salvo);assert.equal(g.projectiles.length,1);near(Math.atan2(g.projectiles[0].vx,g.projectiles[0].vz),angles[0]);near(Math.hypot(g.projectiles[0].vx,g.projectiles[0].vz),11*1.45);
 mochiCryHit(g,e);assert.equal(e.salvo,null);assert.equal(g.hazards.length,0);tick(g,.5);assert.equal(g.projectiles.length,1);
});
test('dream king awakens once at half health and adds seals, stars and diagonal follow-up strikes',()=>{
 for(const action of [0,1,2]){const base=quiet(),late=quiet();base.e.action=late.e.action=action;late.e.hp=late.e.maxHp*.5;tickEnemyBehavior(base.g,base.e,1/60);tickEnemyBehavior(late.g,late.e,1/60);
  assert.equal(base.e.apexAwakened,undefined);assert.equal(late.e.apexAwakened,true);assert.ok(late.e.special<base.e.special);
  if(action===1){assert.equal(base.e.cast.count,32);assert.equal(late.e.cast.count,38);assert.ok(late.e.cast.speed>base.e.cast.speed);}else{assert.equal(late.g.hazards.length,base.g.hazards.length+2);assert.ok(late.g.hazards.every(h=>h.total>=.65));}
  tickEnemyBehavior(late.g,late.e,1/60);assert.equal(late.g.drainEvents().filter(e=>e.type==='bossPhase').length,1);
 }
});
test('boss seals remain locked, pause freezes follow-up warnings, and kill cancels damaging hazards',()=>{
 const {g,e}=quiet();tick(g,1/60);const warnings=g.hazards.map(h=>({x:h.x,z:h.z,timer:h.timer}));assert.equal(warnings.length,10);assert.ok(g.hazards.every(h=>distanceToHazard(0,0,h)>0||h.timer>1.7));
 g.player.x=12;g.pause();const before=structuredClone(g.hazards);tick(g,3);assert.deepEqual(g.hazards,before);g.resume();tick(g,.1);assert.deepEqual(g.hazards.map(h=>({x:h.x,z:h.z})),warnings.map(({x,z})=>({x,z})));
 g.hit(e,1e9,0,0);tick(g,1/60);assert.equal(g.hazards.length,0);assert.equal(g.enemies.filter(e=>e.hp>0).length,0);
});
test('both phases retain an angular escape gap in the actual circular volley',()=>{
 for(const hp of [1,.49]){const {g,e}=quiet();e.hp*=hp;e.action=1;tickEnemyBehavior(g,e,1/60);const count=e.cast.count,duration=e.cast.total;assert.ok(duration>=.65);tickEnemyBehavior(g,e,duration+.001);
  assert.equal(g.projectiles.length,count-2);const angles=g.projectiles.map(b=>(Math.atan2(b.vx,b.vz)+Math.PI*2)%(Math.PI*2)).sort((a,b)=>a-b);const gaps=angles.map((a,i)=>(angles[(i+1)%angles.length]-a+Math.PI*2)%(Math.PI*2));assert.ok(Math.max(...gaps)>=Math.PI*2/count*2.99);
 }
});
test('new EX terrain connects every floor, entrances and exits, and spawning stays on the Mochi-themed ground',()=>{
 for(let area=0;area<3;area++)for(const room of fieldFor(18,area).rooms){assert.ok(room.mochi);const layout=walkingLayout(room),nodes=navGrid(layout).nodes;const seen=new Set([0]),queue=[0];for(let i=0;i<queue.length;i++)for(const n of nodes[queue[i]].neighbors)if(!seen.has(n)){seen.add(n);queue.push(n);}assert.equal(seen.size,nodes.length);assert.ok(contains(room,room.entrance.x,room.entrance.z,.65));assert.ok(contains(room,room.exit.x,room.exit.z,.65));for(let i=0;i<32;i++){const p=spawnPoint(layout,room.entrance,i*Math.PI/16);assert.ok(contains(layout,p.x,p.z,.8));}}
 const {g}=quiet();assert.equal(g.goldenSlimeWave,1);assert.ok(g.spawnGoldenSlime());assert.equal(g.spawnGoldenSlime(),null);assert.equal(g.rescue,null);
});
test('EX selector states the chapter-three unlock, unique difficulty and unchanged first/repeat rewards',()=>{
 const locked=profile();locked.story.actClears[11]=false;assert.match(extraStageSelector(2,11,locked),/data-act="18"[^>]*disabled/);assert.match(extraStageSelector(2,11,locked),/第3章・第4幕/);const open=profile();assert.match(extraStageSelector(2,18,open),/全EX最難関/);assert.match(extraStageSelector(2,18,open),/10枚/);open.story.extraClears[2]=true;assert.match(extraStageSelector(2,18,open),/2枚/);const detail=extraDifficultyView(EXTRA_ACTS[2]);assert.match(detail,/夢蝕覚醒/);assert.match(detail,/240体/);assert.doesNotMatch(detail,/data-difficulty=/);const prep=encounterPreparation(EXTRA_ACTS[2],['nyanluna'],open,HEROES);assert.match(prep,/適正 Lv.50/);assert.doesNotMatch(prep,/Lv.40|救出|加入/);
});
