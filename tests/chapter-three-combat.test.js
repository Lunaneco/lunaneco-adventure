import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {mochiCryHit} from '../src/mochi-combat.js';
import {distanceToHazard} from '../src/enemies.js';

function battle(type,act=8,distance=7){
 const progression=normalizeProgression({story:{version:2,actClears:Array(12).fill(true)},tutorial:{firstBattleCompleted:true}},HEROES);
 const g=new Adventure({act,seed:4,progression,party:['nyanluna','mochinyafe']});
 g.enemies=[];g.hazards=[];g.projectiles=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;
 Object.assign(g.player,{x:0,z:0,attack:1e6,invincible:1e6});g.partner.attack=1e6;
 const e=g.spawnEnemy(type,0,-distance);Object.assign(e,{hp:1e6,maxHp:1e6,special:0,attack:1e6,speed:0});
 g.drainEvents();return {g,e};
}
function tick(g,seconds){for(let i=0;i<Math.ceil(seconds*60);i++)g.tick(1/60);}
function pressure(type,act,{enraged=false,event='enemyShot'}={}){
 const {g,e}=battle(type,act);if(enraged)e.hp=e.maxHp*.49;
 tick(g,30);return g.drainEvents().filter(e=>e.type===event).length;
}

test('chapter-three ranged enemies deliver more shots per 30 seconds than chapter-two counterparts',()=>{
 for(const [later,earlier] of [['mochiSkeleton','matchlock'],['mochiDragon','pestmoth']]){
  const third=pressure(later,8),second=pressure(earlier,4);
  assert.ok(third>=second*1.4,`${later}: ${third} shots vs ${earlier}: ${second}`);
 }
});
test('every dark Mochi boss uses more attacks than its chapter-two counterpart, in both phases',()=>{
 for(let i=0;i<4;i++)for(const enraged of [false,true]){
  const third=pressure('boss',8+i,{enraged,event:'bossAttack'}),second=pressure('boss',4+i,{enraged,event:'bossAttack'});
  assert.ok(third>second,`act ${i+1}, enraged ${enraged}: ${third} vs ${second}`);
 }
});
test('skeleton four-shot burst follows visible locked aim lines and pauses with the game',()=>{
 const {g,e}=battle('mochiSkeleton');tick(g,1/60);
 const angles=g.hazards.map(h=>h.angle);assert.equal(angles.length,4);assert.ok(g.hazards.every(h=>h.total>=.9));
 g.player.x=9;tick(g,.8);assert.equal(g.projectiles.length,0);tick(g,.12);assert.equal(g.projectiles.length,1);
 g.pause();const queued=structuredClone(e.salvo);tick(g,1);assert.deepEqual(e.salvo,queued);g.resume();tick(g,.45);
 assert.equal(g.projectiles.length,4);assert.equal(e.salvo,null);
 for(const [i,p] of g.projectiles.entries()){assert.ok(Math.abs(Math.atan2(p.vx,p.vz)-angles[i])<1e-9);assert.ok(Math.hypot(p.vx,p.vz)>10);}
});
test('Mochi support interrupts a queued skeleton burst and all pending follow-up hazards',()=>{
 const {g,e}=battle('mochiSkeleton');tick(g,.95);assert.ok(e.salvo);const before=g.projectiles.length;
 mochiCryHit(g,e);tick(g,.8);assert.equal(e.salvo,null);assert.equal(g.projectiles.length,before);
 const melee=battle('mochiGoblin',8,3);tick(melee.g,1/60);assert.equal(melee.g.hazards.length,2);
 mochiCryHit(melee.g,melee.e);assert.equal(melee.g.hazards.length,0);assert.equal(melee.e.cast,null);
});
test('dragon fan shows every firing direction before seven fast projectiles leave gaps at range',()=>{
 const {g}=battle('mochiDragon');tick(g,1/60);const angles=g.hazards.map(h=>h.angle);
 assert.equal(angles.length,7);g.player.x=10;tick(g,1);assert.equal(g.projectiles.length,0);tick(g,.12);
 assert.equal(g.projectiles.length,7);
 for(const [i,p] of g.projectiles.entries())assert.ok(Math.abs(Math.atan2(p.vx,p.vz)-angles[i])<1e-9);
 const gap=2*8*Math.sin((angles[1]-angles[0])/2);assert.ok(gap>2*(.38+.4));
});
test('melee follow-ups stay at warned positions and leave time to escape',()=>{
 for(const [type,count] of [['mochiGoblin',2],['mochiOrc',2],['mochiGolem',3]]){
  const {g}=battle(type,8,3);tick(g,1/60);assert.equal(g.hazards.length,count);
  const warnings=g.hazards.map(h=>({x:h.x,z:h.z,angle:h.angle,timer:h.timer}));
  assert.ok(warnings[0].timer>=.85);assert.ok(warnings.every((h,i)=>i===0||h.timer>warnings[i-1].timer));
  g.player.x=10;tick(g,.5);assert.deepEqual(g.hazards.map(({x,z,angle})=>({x,z,angle})),warnings.map(({x,z,angle})=>({x,z,angle})));
  assert.ok(g.hazards.every(h=>distanceToHazard(10,0,h)>.7));
 }
});
test('slime and wolf warn before rushing and retain a stationary recovery window',()=>{
 for(const type of ['mochiSlime','mochiWolf']){
  const {g,e}=battle(type);tick(g,1/60);assert.equal(g.hazards[0].kind,'charge');assert.ok(g.hazards[0].total>=.9);
  const start=e.z;g.player.x=9;tick(g,.8);assert.equal(e.z,start);tick(g,.85);assert.ok(e.z>start);assert.ok(e.recovery>0);
  const end=e.z;tick(g,.2);assert.equal(e.z,end);
 }
});
test('Mochi bosses use distinct claw, dream, chime and crown patterns with stronger second phases',()=>{
 for(let act=8;act<=11;act++){
  const attacks=[];
  for(const enraged of [false,true]){
   const {g,e}=battle('boss',act);e.action=1;if(enraged)e.hp=e.maxHp*.49;
   tick(g,1/60);assert.ok(e.cast.total>=1);assert.ok(g.hazards.every(h=>h.total>=1));
   attacks.push(g.hazards.length);
   if(act===8)assert.ok(g.hazards.some(h=>h.shape==='line'&&h.damage>0));
   if(act===9)assert.ok(g.hazards.some(h=>h.shape==='ring')&&g.hazards.some(h=>!h.shape));
   if(act===10)assert.ok(g.hazards.every(h=>h.shape==='ring'&&h.damage>0));
   if(act===11){
    const count=e.cast.count;tick(g,1.12);assert.equal(g.projectiles.length,count-2);assert.ok(e.salvo);assert.ok(e.salvo.pattern.waves>1);
    const angles=g.projectiles.map(p=>Math.atan2(p.vx,p.vz)).map(a=>(a+Math.PI*2)%(Math.PI*2)).sort((a,b)=>a-b);
    const gaps=angles.map((a,i)=>(angles[(i+1)%angles.length]-a+Math.PI*2)%(Math.PI*2));assert.ok(Math.max(...gaps)>Math.PI*2/count*2.9);
   }
   assert.equal(g.drainEvents().filter(e=>e.type==='bossPhase').length,enraged?1:0);
  }
  assert.ok(attacks[1]>attacks[0]);
  for(const action of [0,2]){const {g,e}=battle('boss',act);e.action=action;tick(g,1/60);assert.ok(g.hazards.length>0);assert.ok(g.hazards.every(h=>h.total>=1));}
 }
});
