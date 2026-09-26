import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3} from 'three';
import {Adventure,HEROES,seededRandom} from '../src/model.js';
import {ACTS,EXTRA_ACTS} from '../src/acts.js';
import {GOLDEN_SLIME,goldenSlimeWave,guaranteedExtraRareWave,goldenSlimeHud} from '../src/golden-slime.js';
import {normalizeProgression} from '../src/progression.js';
import {mochiCryHit} from '../src/mochi-combat.js';
import {contains,projectInside} from '../src/terrain.js';
import {createEnemy,animateEnemy} from '../src/characters.js';
import {enemyForSpawn} from '../src/enemies.js';

const profile=()=>normalizeProgression({story:{version:2,actClears:Array(12).fill(true)},tutorial:{firstBattleCompleted:true}},HEROES);
function quiet(options={}){
 const g=new Adventure({act:8,seed:9,hero:0,party:['nyanluna','mochinyafe'],progression:profile(),...options});
 g.wave=2;g.area=0;g.enemies=[];g.projectiles=[];g.hazards=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;
 Object.assign(g.player,{x:0,z:0,attack:999,invincible:999});g.partner.attack=999;g.drainEvents();return g;
}
const tick=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds*60);i++)g.tick(1/60);};
const inventory=g=>({...g.progression.inventory});

test('rare chance is 20% on every chapter-three wave, and other chapters never roll one',()=>{
 for(const act of [...ACTS,...EXTRA_ACTS])for(const wave of [1,2,3,4,5,6]){
  assert.equal(goldenSlimeWave(act,()=>.199999,wave),act.chapter===2&&!act.extra?wave:null);
  assert.equal(goldenSlimeWave(act,()=>.2,wave),null);
 }
 const outcomes=Array.from({length:5000},(_,i)=>goldenSlimeWave(ACTS[8],seededRandom(i),1));assert.ok(outcomes.filter(Boolean).length>900&&outcomes.filter(Boolean).length<1100);
 for(const act of [...ACTS,...EXTRA_ACTS])assert.equal(guaranteedExtraRareWave(act),act.chapter===2&&act.extra?1:null);
});
test('chapter three extra guarantees exactly one rare slime, on the first wave',()=>{
 for(let seed=1;seed<=12;seed++){
  const g=new Adventure({act:18,seed,party:['nyanluna','mochinyafe'],progression:profile()});
  assert.equal(g.goldenSlimeWave,1);let rares=0;
  for(let wave=1;wave<=6;wave++){g.wave=wave;g.waveSpawned=2;g.enemies=[];if(g.goldenSlime?.status==='active')g.goldenSlime.status='escaped';g.spawn();rares+=g.enemies.filter(e=>e.rare).length;}
  assert.equal(rares,1);
 }
 for(const act of [16,17]){const g=new Adventure({act,seed:4,party:['nyanluna','mochinyafe'],progression:profile()});assert.equal(g.goldenSlimeWave,null);assert.equal(g.spawnGoldenSlime(),null);}
});
test('a rare spawn supplements the normal wave once without changing its roster, count or RNG',()=>{
 const a=quiet(),b=quiet();a.waveSpawned=b.waveSpawned=0;a.goldenSlimeWave=2;b.goldenSlimeWave=null;
 for(let i=0;i<a.waveGoal;i++){a.spawn();b.spawn();}
 assert.equal(a.enemies.filter(e=>e.rare).length,1);assert.equal(a.enemies.length,b.enemies.length+1);assert.equal(a.waveSpawned,b.waveSpawned);assert.equal(a.waveGoal,b.waveGoal);
 assert.deepEqual(a.enemies.filter(e=>!e.rare).map(e=>[e.type,e.x,e.z,e.hp,e.special]),b.enemies.map(e=>[e.type,e.x,e.z,e.hp,e.special]));
 assert.equal(a.spawnGoldenSlime(),null);assert.equal(a.rng(),b.rng());assert.equal(a.lootRng(),b.lootRng());assert.equal(a.materialRng(),b.materialRng());
 for(const act of [0,4,16,17])assert.equal(quiet({act}).spawnGoldenSlime(),null);
 const boss=quiet();boss.wave=6;assert.ok(boss.spawnGoldenSlime());assert.equal(enemyForSpawn(8,6,0,0),'boss');
});
test('gold flees from the player, never attacks or causes a contact hit, and can be stopped by Mochi',()=>{
 const g=quiet(),e=g.spawnGoldenSlime();Object.assign(e,{x:0,z:4,knockX:0,knockZ:0});const hp=g.player.hp;
 tick(g,1);assert.ok(Math.hypot(e.x,e.z)>7);assert.equal(e.cast,null);assert.equal(g.hazards.length,0);assert.equal(g.projectiles.length,0);
 Object.assign(e,{x:0,z:0,speed:0,attack:0});g.player.invincible=0;tick(g,.2);assert.equal(g.player.hp,hp);assert.equal(g.runHits,0);
 e.speed=GOLDEN_SLIME.speed;mochiCryHit(g,e);const before=[e.x,e.z];tick(g,1);assert.deepEqual([e.x,e.z],before);assert.equal(g.goldenSlime.status,'active');
});
test('flight keeps moving inside every chapter-three floor, narrow bridge and branch',()=>{
 for(let act=8;act<=11;act++)for(let wave=2;wave<=5;wave++)for(const route of ['safe','elite']){
  const g=quiet({act});g.wave=wave;g.area=Math.floor((wave-1)/2);g.route=route;Object.assign(g.player,projectInside(g.walkLayout,0,3,.85));
  const e=g.spawnGoldenSlime();let travelled=0;
  for(let i=0;i<600;i++){const before={x:e.x,z:e.z};g.tick(1/60);travelled+=Math.hypot(e.x-before.x,e.z-before.z);assert.ok(contains(g.walkLayout,e.x,e.z,.7),`${act}/${wave}/${route}`);}
  assert.ok(travelled>25,`${act}/${wave}/${route}: ${travelled}`);
 }
});
test('deadline uses battle time: pause stops it, Mochi freeze does not extend it, escape grants nothing',()=>{
 const g=quiet(),e=g.spawnGoldenSlime(),before=inventory(g);tick(g,5);g.pause();tick(g,40);assert.ok(Math.abs(g.time-5)<1e-6);assert.equal(e.hp,e.maxHp);g.resume();
 g.time=e.expiresAt-.1;mochiCryHit(g,e);tick(g,.2);assert.equal(g.goldenSlime.status,'escaped');assert.equal(e.escaped,true);assert.equal(g.enemies.includes(e),false);
 assert.deepEqual(inventory(g),before);assert.equal(g.kills,0);assert.equal(g.earnedXp.nyanluna,0);assert.equal(g.earnedXp.mochinyafe,0);assert.equal(g.orbs.length,0);
 g.hit(e,1e9,0,0);assert.deepEqual(inventory(g),before);assert.equal(g.drainEvents().filter(e=>e.type==='rareEscape').length,1);
});
test('an expired enemy cannot pay out even when a hit lands directly at the deadline',()=>{
 const g=quiet(),e=g.spawnGoldenSlime(),before=inventory(g);g.time=e.expiresAt;g.hit(e,1e9,0,0);
 assert.equal(g.goldenSlime.status,'escaped');assert.deepEqual(inventory(g),before);assert.equal(g.kills,0);
});
test('kill just before expiry grants all five material stacks, ten tickets, one awakening stone and party EXP exactly once',()=>{
 for(const difficulty of ['normal','hard']){
  const g=quiet({difficulty}),e=g.spawnGoldenSlime();g.time=e.expiresAt-.001;mochiCryHit(g,e);g.hit(e,1e9,0,0);
  assert.equal(g.goldenSlime.status,'defeated');assert.equal(g.kills,1);assert.equal(g.earnedWeaponTickets,10);assert.equal(g.progression.inventory.weaponTicket,10);assert.equal(g.progression.inventory.limitStone,1);assert.equal(g.earnedRareStones,1);
  for(const [id,count] of Object.entries(GOLDEN_SLIME.materials)){assert.equal(g.progression.inventory[id],count);assert.equal(g.earnedMaterials[id],count);}
  assert.equal(g.earnedXp.nyanluna,1500);assert.equal(g.earnedXp.mochinyafe,750);assert.equal(g.earnedXp.tsukineko,0);assert.equal(g.earnedXp.omsolo,0);
  const saved=JSON.stringify(g.progression);g.hit(e,1e9,0,0);tick(g,.2);assert.equal(JSON.stringify(g.progression),saved);assert.deepEqual(normalizeProgression(JSON.parse(saved),HEROES),g.progression);
  const events=g.drainEvents();assert.equal(events.filter(e=>e.type==='rareDefeated').length,1);assert.equal(events.filter(e=>e.type==='weaponTicket'&&e.source==='goldenSlime').length,1);assert.equal(g.orbs.length,0);
 }
});
test('undeployed heroes get no XP and a fallen partner gets half, while caps and full wallets stay valid',()=>{
 const g=quiet();g.healthFor(3).hp=0;const e=g.spawnGoldenSlime();g.hit(e,1e9,0,0);assert.equal(g.earnedXp.mochinyafe,750);assert.equal(g.healthFor(3).hp,0);assert.equal(g.earnedXp.nyanluna,1500);
 const full=quiet();full.progression.characters.nyanluna.level=80;full.progression.characters.nyanluna.breaks=6;for(const id of Object.keys(full.progression.inventory))full.progression.inventory[id]=99999999;
 full.hit(full.spawnGoldenSlime(),1e9,0,0);assert.equal(full.earnedXp.nyanluna,0);assert.equal(full.earnedRareStones,0);assert.equal(full.earnedWeaponTickets,0);assert.ok(Object.values(full.progression.inventory).every(n=>n===99999999));
});
test('additional encounters and new runs pay the full bounty for every kill, with no one-time claim',()=>{
 const g=quiet();g.hit(g.spawnGoldenSlime(),1e9,0,0);assert.equal(g.spawnGoldenSlime(),null);
 g.rareRng=()=>0;g.startWave();assert.equal(g.goldenSlimeWave,3);g.enemies=[];g.spawn();g.spawn();g.spawn();
 const second=g.enemies.find(e=>e.rare);assert.ok(second);g.hit(second,1e9,0,0);
 assert.equal(g.goldenSlimeKills,2);assert.equal(g.progression.inventory.weaponTicket,20);assert.equal(g.progression.inventory.limitStone,2);assert.equal(g.earnedXp.nyanluna,3000);assert.equal(g.earnedXp.mochinyafe,1500);
 for(const [id,count] of Object.entries(GOLDEN_SLIME.materials))assert.equal(g.progression.inventory[id],count*2);
 const next=quiet({progression:g.progression});next.hit(next.spawnGoldenSlime(),1e9,0,0);assert.equal(next.progression.inventory.weaponTicket,30);assert.equal(next.progression.inventory.limitStone,3);
 for(const [id,count] of Object.entries(GOLDEN_SLIME.materials))assert.equal(next.progression.inventory[id],count*3);
 const miss=quiet();miss.spawnGoldenSlime();miss.rareRng=()=>.2;miss.startWave();assert.notEqual(miss.goldenSlimeWave,3);
});
test('escape unblocks an otherwise cleared wave without counting as a kill',()=>{
 const g=quiet(),e=g.spawnGoldenSlime();g.time=e.expiresAt-.01;tick(g,.05);assert.equal(g.exitOpen,true);assert.equal(g.kills,0);assert.equal(g.waveSpawned,g.waveGoal);
});
test('gold model has its own metallic body and finite geometry; HUD reports time and all special rewards',()=>{
 const g=quiet(),e=g.spawnGoldenSlime(),root=createEnemy(e.type);animateEnemy(root,e,1);assert.ok(!new Box3().setFromObject(root).isEmpty());
 let metallic=false;root.traverse(o=>{if(o.isMesh){assert.ok(Number.isFinite(o.geometry.attributes.position.getX(0)));if(o.material.metalness>=.6)metallic=true;}});assert.ok(metallic);
 assert.match(goldenSlimeHud(g),/逃走まで 20秒/);g.time=18;assert.match(goldenSlimeHud(g),/逃走まで 2秒/);g.hit(e,1e9,0,0);assert.match(goldenSlimeHud(g),/覚醒の輝石1個/);g.time+=6.1;assert.equal(goldenSlimeHud(g),'');
});
