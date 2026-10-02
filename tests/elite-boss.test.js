import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure} from '../src/model.js';
import {ACTS} from '../src/acts.js';
import {FIELD_LAYOUTS,HEHE_FIELD_LAYOUTS} from '../src/terrain.js';
import {tickEnemyBehavior} from '../src/enemy-combat.js';
import {levelThirtyProfile,playRun} from './chapter-two-fixtures.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function quiet(act=0,difficulty='normal'){
 const g=new Adventure({act,difficulty,seed:2,progression:levelThirtyProfile({tree:true,cleared:28})});
 g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.enemies=[];g.projectiles=[];g.hazards=[];g.player.attack=g.partner.attack=999;g.player.invincible=0;g.drainEvents();return g;
}
function cast(act,difficulty,elite,action,low=false){
 const g=quiet(act,difficulty),e=g.spawnEnemy('boss',0,-5,{elite});e.action=action;e.special=0;if(low)e.hp=e.maxHp*.4;
 tickEnemyBehavior(g,e,1/60);const warning=e.cast.total,cooldown=e.special;e.cast.remaining=0;tickEnemyBehavior(g,e,1/60);
 return {g,e,warning,cooldown};
}
test('all sixteen strong bosses have exactly twice normal HP and contact damage in every wave and mode',()=>{
 for(const act of ACTS)for(const difficulty of ['normal','hard'])for(const wave of [2,4,6]){
  const g=quiet(act.id,difficulty);g.wave=wave;const normal=g.spawnEnemy('boss',0,-5),elite=g.spawnEnemy('boss',0,-5,{elite:true}),hard=difficulty==='hard'?1.3:1;
  near(normal.maxHp,act.bossHp*hard);near(normal.damage,(act.id>=12?92:act.id>=8?62:act.id>=4?45:22)*hard);near(elite.maxHp,normal.maxHp*2);near(elite.damage,normal.damage*2);assert.equal(elite.speed,normal.speed);
 }
});
test('all boss attacks double projectile, circle and beam damage including enraged phases; warning time is retained',()=>{
 let bullets=0,circles=0,beams=0,charges=0;
 for(const act of ACTS)for(const mode of ['normal','hard'])for(const low of [false,true])for(let action=0;action<3;action++){
  const base=cast(act.id,mode,false,action,low),elite=cast(act.id,mode,true,action,low);
  assert.equal(elite.warning,base.warning);assert.equal(elite.cooldown,base.cooldown);
  assert.equal(elite.g.projectiles.length,base.g.projectiles.length);assert.equal(elite.g.hazards.length,base.g.hazards.length);
  for(let i=0;i<base.g.projectiles.length;i++){const a=base.g.projectiles[i],b=elite.g.projectiles[i];near(b.damage,a.damage*2);assert.equal(b.life,a.life);near(Math.hypot(b.vx,b.vz),Math.hypot(a.vx,a.vz));bullets++;}
  for(let i=0;i<base.g.hazards.length;i++){const a=base.g.hazards[i],b=elite.g.hazards[i];near(b.damage,a.damage*2);assert.equal(b.timer,a.timer);if(a.damage){if(a.shape==='line')beams++;else circles++;}}
  if(base.e.rush){assert.deepEqual(elite.e.rush,base.e.rush);near(elite.e.damage,base.e.damage*2);charges++;}
 }
 assert.ok(bullets>0&&circles>0&&beams>0&&charges>0);
});
test('actual HP loss after defense doubles for body contact, charge, projectile, magic circle and beam',()=>{
 for(const mode of ['normal','hard'])for(const kind of ['contact','charge','projectile','circle','beam']){
  const amounts=[false,true].map(elite=>{
   const act=kind==='beam'?1:0,action=kind==='projectile'?1:kind==='charge'?2:kind==='beam'?1:0;
   const {g,e}=cast(act,mode,elite,action);e.attack=999;g.player.invincible=0;g.skills.ward=1;
   if(kind==='contact'||kind==='charge'){g.hazards=[];g.projectiles=[];Object.assign(e,{x:g.player.x,z:g.player.z,attack:0,special:999});if(kind==='contact'){e.rush=null;e.cast=null;}else assert.ok(e.rush);}
   else if(kind==='projectile'){const b=g.projectiles[0];g.projectiles=[b];g.hazards=[];Object.assign(b,{x:g.player.x,z:g.player.z,vx:0,vz:0});}
   else{const h=g.hazards.find(h=>h.damage>0);g.hazards=[h];g.projectiles=[];h.timer=0;Object.assign(g.player,{x:h.x,z:h.z});}
   const hp=g.player.hp;g.tick(1/60);assert.equal(g.runHits,1,`${mode} ${kind}`);return hp-g.player.hp;
  });near(amounts[1],amounts[0]*2);
 }
});
test('each fork spawns a doubled boss only on the strong route, without changing ordinary enemies',()=>{
 for(const act of ACTS)for(const route of ['safe','elite']){
  const area=(act.chapter===5?HEHE_FIELD_LAYOUTS[act.id-24]:FIELD_LAYOUTS[act.id]).findIndex(f=>f.kind==='branch');if(area<0)continue;const g=quiet(act.id);g.area=area;g.wave=area*2+1;g.route=route;g.startWave();
  if(g.wave!==6){g.waveSpawned=0;g.spawn();const ordinary=g.enemies.at(-1),base=quiet(act.id);base.wave=g.wave;const reference=base.spawnEnemy(ordinary.type,0,-5);near(ordinary.maxHp,reference.maxHp);near(ordinary.damage,reference.damage);assert.equal(ordinary.elite,false);}
  g.enemies=[];g.waveSpawned=g.waveGoal-1;g.spawn();const last=g.enemies.at(-1);
  assert.equal(last.elite,route==='elite');if(route==='elite'){assert.equal(last.type,'boss');near(last.maxHp,act.bossHp*2);near(last.damage,(act.id>=12?92:act.id>=8?62:act.id>=4?45:22)*2);}
 }
});
for(const mode of ['normal','hard'])test(`chapter two's strong routes can be cleared with level 30 and the first talent tier (${mode})`,()=>{
 for(let act=4;act<8;act++){
  const g=new Adventure({act,difficulty:mode,hero:1,seed:1,progression:levelThirtyProfile({tree:true})});g.auditRoute='elite';playRun(g);
  assert.equal(g.phase,'victory',JSON.stringify({act,wave:g.wave,hp:g.player.hp,seconds:g.time,mode}));assert.equal(g.routeRewards.length,FIELD_LAYOUTS[act].filter(f=>f.kind==='branch').length);assert.ok(g.earnedMaterials.astralCore>=1);
 }
});
