import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3} from 'three';
import {Adventure} from '../src/model.js';
import {ENEMY_TYPES,BOSSES,enemyForSpawn,distanceToHazard} from '../src/enemies.js';
import {ENEMY_REWARDS} from '../src/progression.js';
import {MATERIAL_DROPS} from '../src/talents.js';
import {createEnemy,animateEnemy} from '../src/characters.js';
function quiet(act=0,party){const g=new Adventure({seed:4,act,party,progression:{story:{version:2,actClears:[true,true,true,true],tsukinekoUnlocked:true}}});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=999;g.player.invincible=0;g.drainEvents();return g;}
const tick=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds*60)&&g.phase==='playing';i++)g.tick(1/60);};
test('twenty-eight regular enemy types have unique roles and complete XP, crystal and material rewards',()=>{
 assert.equal(Object.values(ENEMY_TYPES).filter(s=>!s.rare).length,28);
 for(const [type,spec] of Object.entries(ENEMY_TYPES).filter(([,s])=>!s.rare)){
  assert.equal(ENEMY_REWARDS[type].xp,spec.xp);assert.equal(MATERIAL_DROPS[type].starBud,spec.buds);
  const g=quiet(),e=g.spawnEnemy(type,10,10);g.materialRng=()=>0;g.hit(e,9999,0,0,false,false,'tsukineko');assert.equal(g.earnedXp.tsukineko,spec.xp);assert.equal(g.earnedXp.nyanluna,spec.xp/2);assert.equal(g.orbs[0].value,spec.crystals);assert.equal(g.earnedMaterials.starBud,spec.buds);
 }
});
test('new enemy types appear in predictable introductory waves and every act has a different boss',()=>{
 for(let i=0;i<10;i++)assert.equal(enemyForSpawn(0,1,i,i/10),'moss');
 assert.equal(enemyForSpawn(0,2,0,.99),'archer');assert.equal(enemyForSpawn(0,3,0,.99),'mage');assert.equal(enemyForSpawn(0,4,0,.99),'charger');
 assert.equal(enemyForSpawn(0,6,0,0),'boss');
 assert.deepEqual([0,1,2,3].map(act=>quiet(act).spawnEnemy('boss',0,0).bossId),['treant','chronarch','tempest','eclipse']);
});
test('archer keeps range, visibly locks aim, then fires along the original line',()=>{
 const g=quiet(),e=g.spawnEnemy('archer',0,-5);e.special=0;g.tick(1/60);assert.equal(e.cast.kind,'arrow');assert.equal(g.projectiles.length,0);assert.equal(g.hazards[0].shape,'line');const angle=e.cast.angle,position={x:e.x,z:e.z};
 g.player.x=6;tick(g,.5);assert.equal(g.projectiles.length,0);assert.equal(e.x,position.x);assert.equal(e.z,position.z);tick(g,.5);const b=g.projectiles.find(b=>b.owner==='enemy');assert.ok(b);assert.equal(b.kind,'enemyArrow');assert.ok(Math.abs(Math.atan2(b.vx,b.vz)-angle)<1e-9);
 const close=quiet(),archer=close.spawnEnemy('archer',0,0);archer.special=999;tick(close,.5);assert.ok(archer.z<0,'backs away instead of chasing into melee');
});
test('mage spell fixes its target, waits for the warning, and is cancelled when killed during casting',()=>{
 const g=quiet(),mage=g.spawnEnemy('mage',0,-5);mage.special=0;g.tick(1/60);const h=g.hazards[0],hp=g.player.hp;assert.equal(h.kind,'sigil');assert.equal(h.x,0);assert.equal(h.z,3);tick(g,1);assert.equal(g.player.hp,hp);g.player.x=6;tick(g,.7);assert.equal(g.player.hp,hp);assert.equal(g.hazards.length,0);
 const interrupted=quiet(),caster=interrupted.spawnEnemy('mage',0,-5);caster.special=0;interrupted.tick(1/60);interrupted.hit(caster,9999,0,0);interrupted.tick(1/60);assert.equal(interrupted.hazards.length,0);tick(interrupted,2);assert.equal(interrupted.runHits,0);
});
test('magic damages only after the warning and challenge difficulty scales hostile damage',()=>{
 for(const difficulty of ['normal','hard']){const g=quiet();g.difficulty=difficulty;const caster=g.spawnEnemy('mage',0,-5);caster.special=0;const hp=g.player.hp;tick(g,1.6);assert.equal(g.player.hp,hp);tick(g,.1);assert.ok(Math.abs(hp-g.player.hp-15*(difficulty==='hard'?1.3:1)*100/108)<1e-8);assert.equal(g.runHits,1);}
});
test('charger gives a full warning, locks direction and exposes a recovery window',()=>{
 const g=quiet(),e=g.spawnEnemy('charger',0,-5);e.special=0;g.tick(1/60);const z=e.z;assert.equal(g.hazards[0].kind,'charge');g.player.x=8;tick(g,.8);assert.equal(e.z,z);tick(g,.8);assert.ok(e.z>z+5);assert.equal(e.x,0);assert.ok(e.recovery>0);const end=e.z;tick(g,.2);assert.equal(e.z,end);
});
test('rotated rectangular warnings have matching collision bounds, including their ends',()=>{
 const h={shape:'line',x:0,z:0,width:2,length:10,angle:Math.PI/2};for(const [x,z,expected] of [[0,0,-1],[4,0,-1],[0,2,1],[6,0,1]])assert.ok(Math.abs(distanceToHazard(x,z,h)-expected)<1e-9);assert.ok(distanceToHazard(6,2,h)>1.4);
});
test('enemy projectiles use swept collision and cannot jump over the player',()=>{
 const g=quiet();g.projectiles=[{id:999,owner:'enemy',kind:'enemyArrow',x:-2,z:3,vx:100,vz:0,life:1,damage:10,radius:.15}];const hp=g.player.hp;g.tick(.05);assert.ok(g.player.hp<hp);assert.equal(g.projectiles.length,0);assert.equal(g.runHits,1);
});
test('pause freezes enemy casting; gates and defeat clear queued danger',()=>{
 const g=quiet(),e=g.spawnEnemy('mage',0,-5);e.special=0;g.tick(1/60);g.pause();const cast=structuredClone(e.cast),hazards=structuredClone(g.hazards);for(let i=0;i<120;i++)g.tick(1/60);assert.deepEqual(e.cast,cast);assert.deepEqual(g.hazards,hazards);g.resume();g.openExit();assert.equal(g.hazards.length,0);assert.equal(g.projectiles.length,0);
 const dead=quiet(0,['nyanluna']),mage=dead.spawnEnemy('mage',0,-5);mage.special=0;dead.tick(1/60);dead.hurt(99999,0,0);assert.equal(dead.phase,'defeat');assert.equal(dead.hazards.length,0);
});
test('a fatal hit stops the same frame before another caster or nearby crystals can act',()=>{
 for(const cause of ['melee','projectile','magic']){
  const g=quiet(0,['nyanluna']);g.player.hp=1;g.orbs=[{id:100,x:0,z:3,value:1,age:0}];
  if(cause==='melee'){const e=g.spawnEnemy('moss',0,3);e.attack=0;const mage=g.spawnEnemy('mage',0,-5);mage.special=0;}
  if(cause==='projectile')g.projectiles=[{id:101,owner:'enemy',x:0,z:3,vx:0,vz:0,life:1,radius:.2,damage:10}];
  if(cause==='magic')g.hazards=[{id:102,x:0,z:3,radius:2,timer:0,total:1,damage:10}];
  g.tick(1/60);assert.equal(g.phase,'defeat');assert.equal(g.hazards.length,0);assert.equal(g.projectiles.length,0);assert.equal(g.totalCrystals,0);assert.equal(g.drainEvents().filter(e=>e.type==='defeat').length,1);
 }
});
test('boss attacks differ: roots, clock beams, winged dives, and an eclipse phase change',()=>{
 const signatures=[];
 for(let act=0;act<4;act++){
  const g=quiet(act),e=g.spawnEnemy('boss',0,-6);const attacks=[];
  for(let action=0;action<3;action++){
   e.special=0;e.cast=null;e.rush=null;e.recovery=0;g.hazards=[];g.projectiles=[];g.tick(1/60);attacks.push(g.drainEvents().find(event=>event.type==='bossAttack').label);
   if(act===1&&action===1){assert.equal(g.hazards.filter(h=>h.shape==='line'&&h.damage>0).length,12);}
   if(e.cast?.kind==='charge')assert.ok(g.hazards[0].width>=e.radius*2,'charge warning covers the full body');
   if(act===2&&action===2){assert.equal(e.cast.kind,'charge');assert.equal(e.cast.speed,14);}
  }
  signatures.push(attacks.join(','));if(act===3){e.hp=e.maxHp*.49;g.tick(1/60);assert.equal(e.enraged,true);assert.equal(g.drainEvents().filter(e=>e.type==='bossPhase').length,1);g.tick(1/60);assert.equal(g.drainEvents().filter(e=>e.type==='bossPhase').length,0);}
 }
 assert.equal(new Set(signatures).size,4);
});
test('all enemy model silhouettes have valid finite geometry within mobile rendering budgets',()=>{
 const shapes=[...Object.keys(ENEMY_TYPES).map(type=>[type,null]),...Object.keys(BOSSES).map(id=>['boss',id])],bossBounds=[];
 for(const [type,bossId] of shapes){
  const model=createEnemy(type,bossId),bounds=new Box3().setFromObject(model);let triangles=0,meshes=0;
  model.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});
  assert.ok(triangles<16000&&meshes<30,`${type}/${bossId}: ${triangles} triangles, ${meshes} draws`);assert.ok(bounds.max.y>1&&bounds.max.y<(bossId==='colossus'||bossId?.startsWith('prism')?7:5)&&bounds.max.x-bounds.min.x<(bossId?.startsWith('prism')?11:7));
  animateEnemy(model,{x:0,z:0,face:0,type,bossId,id:1,speed:1,hit:0,cast:{kind:'chant'}},1);assert.ok(model.children.length);
  if(type==='boss')bossBounds.push([bounds.max.x-bounds.min.x,bounds.max.y,bounds.max.z-bounds.min.z].map(n=>n.toFixed(2)).join(','));
 }
 assert.equal(new Set(bossBounds).size,20);
});
