import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {tickLumiAttacks} from '../src/lumi-combat.js';
import {NEKO_LUMI_ATTACK,nekoLumiAttackPose} from '../src/lumi-attack-motion.js';
import {lumiRailVisual,updateNekoRailVisual} from '../src/lumi-visuals.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function quiet({party=['lumi','mochinyafe'],hero=7,crit=false}={}){
 const progression=normalizeProgression({story:{version:2,actClears:Array(32).fill(true)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}},HEROES);
 const g=new Adventure({act:0,seed:17,progression,party,hero});
 g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.rng=()=>crit?0:1;g.drainEvents();return g;
}
function enemy(g,x,z,{hp=1e6,type='moss'}={}){
 const e=g.spawnEnemy(type,x,z);Object.assign(e,{hp,maxHp:hp,speed:0,special:999,attack:999});return e;
}
const finish=g=>{tickLumiAttacks(g,.09);tickLumiAttacks(g,.09);};

test('Neko normal attack hits three aligned enemies three times, preserving piercing count and infinite range',()=>{
 const g=quiet(),p=g.player,targets=[4,7,200].map(d=>enemy(g,p.x,p.z-d)),fourth=enemy(g,p.x,p.z-203),offLine=enemy(g,p.x+3,p.z-6),behind=enemy(g,p.x,p.z+6);
 const damage=g.statsFor(7).attack;
 assert.equal(g.attackProfile(7).range,Infinity);assert.ok(g.attackFrom(p,7));
 for(const e of targets)close(1e6-e.hp,damage*.3);
 tickLumiAttacks(g,.08);for(const e of targets)close(1e6-e.hp,damage*.3);
 tickLumiAttacks(g,.01);for(const e of targets)close(1e6-e.hp,damage*.6);
 tickLumiAttacks(g,.09);for(const e of targets)close(1e6-e.hp,damage);
 assert.equal(fourth.hp,1e6);assert.equal(offLine.hp,1e6);assert.equal(behind.hp,1e6);assert.deepEqual(g.lumiBursts,[]);
 const events=g.drainEvents(),rays=events.filter(e=>e.type==='lumiRail');
 assert.equal(events.filter(e=>e.type==='attack').length,1);assert.equal(rays.length,3);
 assert.deepEqual(rays.map(e=>e.pulse),[0,1,2]);assert.ok(rays.every(e=>e.nekoBurst&&Number.isFinite(e.range)&&e.range>=200));
 for(const e of targets)assert.equal(events.filter(v=>v.type==='hit'&&v.id===e.id).length,3);
 close(g.chargeFor(7),targets.length*.65*HEROES[7].chargeRate);
});
test('three-hit burst preserves the original total damage, crit, power modifier and main/support ownership',()=>{
 for(const support of [false,true])for(const crit of [false,true]){
  const g=quiet({hero:support?3:7,crit}),source=g.sourceFor('lumi'),e=enemy(g,source.x,source.z-6);
  g.skills.lumiPower=2;const expected=g.statsFor(7).attack*(support?.43:1)*(crit?2:1)*1.4;
  assert.ok(g.attackFrom(source,7,support));finish(g);close(1e6-e.hp,expected);
  assert.ok(g.drainEvents().filter(v=>v.type==='hit').every(v=>v.heroId==='lumi'&&v.crit===crit));
 }
});
test('normal Lumi retains her single finite-range ray and three-target piercing cap',()=>{
 const g=quiet({party:['lumi','tsukineko']}),p=g.player,targets=[4,6,8,10,200].map(d=>enemy(g,p.x,p.z-d));
 assert.ok(g.attackFrom(p,7));finish(g);
 targets.forEach((e,i)=>close(1e6-e.hp,i<3?g.statsFor(7).attack:0));
 assert.equal(g.attackProfile(7).range,14);assert.equal(g.drainEvents().filter(v=>v.type==='lumiRail').length,1);assert.deepEqual(g.lumiBursts,[]);
});
test('remaining hits keep their direction and owner after swapping, and recheck actual enemy positions',()=>{
 const g=quiet(),source=g.player,e=enemy(g,source.x,source.z-6),other=enemy(g,source.x+5,source.z-4);
 g.attackFrom(source,7);assert.ok(g.switchHero());const hp=e.hp;e.x+=4;finish(g);
 assert.equal(e.hp,hp);assert.equal(other.hp,1e6);
 assert.ok(g.drainEvents().filter(v=>v.type==='lumiRail').every(v=>v.heroId==='lumi'&&Math.abs(Math.abs(v.angle)-Math.PI)<1e-6));
});
test('pausing freezes pending hits; normal ticking delivers them once without extra auto-attack events',()=>{
 const g=quiet(),e=enemy(g,g.player.x,g.player.z-6);g.attackFrom(g.player,7);g.drainEvents();const hp=e.hp,due=g.lumiBursts[0].due;
 assert.ok(g.pause());g.tick(.05);tickLumiAttacks(g,10);assert.equal(e.hp,hp);assert.equal(g.lumiBursts[0].due,due);
 g.resume();for(let i=0;i<14;i++)g.tick(1/60);
 const events=g.drainEvents();assert.equal(events.filter(v=>v.type==='hit'&&v.id===e.id).length,2);assert.equal(events.filter(v=>v.type==='attack').length,0);assert.deepEqual(g.lumiBursts,[]);
});
test('knockout, exit, passage and wave changes cancel unfinished normal bursts',()=>{
 for(const end of [g=>{g.player.invincible=0;g.hurt(1e9,0,0);},g=>g.openExit(),g=>g.openPassage(),g=>g.startWave()]){
  const g=quiet(),e=enemy(g,g.player.x,g.player.z-6);g.attackFrom(g.player,7);const hp=e.hp;end(g);finish(g);assert.equal(e.hp,hp);assert.deepEqual(g.lumiBursts,[]);
 }
});
test('a later pulse can kill only once and rewards remain attributed to Lumi',()=>{
 const g=quiet(),damage=g.statsFor(7).attack,e=enemy(g,g.player.x,g.player.z-6,{hp:damage*.5});
 g.attackFrom(g.player,7);finish(g);assert.equal(g.kills,1);
 const events=g.drainEvents();assert.equal(events.filter(v=>v.type==='death'&&v.id===e.id).length,1);assert.equal(events.filter(v=>v.type==='hit'&&v.id===e.id).length,2);assert.ok(g.earnedXp.lumi>0);
});
test('recoil and light flash follow the three impact timings and settle cleanly',()=>{
 assert.equal(NEKO_LUMI_ATTACK.weights.reduce((a,b)=>a+b,0),1);
 for(const t of [0,.09,.18])assert.ok(nekoLumiAttackPose(NEKO_LUMI_ATTACK.duration-t).flash>.7);
 for(const t of [.035,.125,.215])assert.ok(nekoLumiAttackPose(NEKO_LUMI_ATTACK.duration-t).recoil>.65);
 for(let t=0;t<=NEKO_LUMI_ATTACK.duration;t+=.001)for(const value of Object.values(nekoLumiAttackPose(NEKO_LUMI_ATTACK.duration-t)))assert.ok(Number.isFinite(value)&&value>=0&&value<=1);
 assert.deepEqual(nekoLumiAttackPose(0),{stance:0,recoil:0,flash:0});assert.ok(nekoLumiAttackPose(.001).stance<.001);
});
test('Neko layered rails respect weapon colors and finite VFX bounds, and fade without stretching range',()=>{
 for(const color of [0x8feaff,0xba9fff,0xff9ecb]){
  const origin=new THREE.Vector3(2,1.8,3),mesh=lumiRailVisual(origin,{nekoBurst:true,pulse:2,range:200,angle:Math.PI/2,color});
  assert.equal(mesh.userData.distance,90);assert.equal(mesh.userData.mechanicalRange,200);assert.equal(mesh.position.distanceTo(origin),0);
  assert.ok(mesh.children.length<=10);assert.ok(mesh.userData.layers.some(v=>v.material.color.getHex()===color));
  const effect={mesh,life:.18,max:.18};updateNekoRailVisual(effect,.09);
  assert.ok(mesh.userData.travel.every(v=>v.position.z<=90));assert.ok(mesh.userData.layers.every(v=>v.material.opacity>=0&&v.material.opacity<=1));
  mesh.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(mesh);assert.ok(bounds.max.x<=origin.x+90.3);assert.ok(bounds.min.x>=origin.x-.3);
  updateNekoRailVisual(effect,.09);assert.equal(effect.life,0);assert.ok(mesh.userData.layers.every(v=>v.material.opacity===0));
  mesh.traverse(v=>{v.geometry?.dispose();v.material?.dispose();});
 }
 const normal=lumiRailVisual(new THREE.Vector3(),{range:14,angle:0,color:0x8feaff});assert.equal(normal.children.length,1);
 normal.traverse(v=>{v.geometry?.dispose();v.material?.dispose();});
});
