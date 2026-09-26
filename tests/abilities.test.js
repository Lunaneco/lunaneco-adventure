import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,STAGE_EXIT} from '../src/model.js';
import {RecruitedAdventure} from './recruited-fixture.js';
import {ultimateFor} from '../src/abilities.js';
import {enemySpeedScale} from '../src/ultimate-combat.js';
import {normalizeProgression,characterStats} from '../src/progression.js';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-6,`${actual} != ${expected}`);
const quiet=(hero=0,party)=>{const g=new RecruitedAdventure({hero,seed:41,party});g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=999;g.drainEvents();return g;};
const tick=(g,n)=>{for(let i=0;i<n;i++)g.tick(1/60);};
const target=(g,type='boss',x=0,z=8)=>{const e=g.spawnEnemy(type,x,z);e.hp=e.maxHp=10000;e.speed=0;e.attack=e.special=999;return e;};

test('Tsukineko has higher basic HP, attack, defense and normal fire rate; Nyanluna has stronger skills and faster charge',()=>{
 const [n,t]=HEROES;assert.equal(n.baseHp,180);assert.equal(t.baseHp,210);
 for(const level of [1,20,50]){const p=normalizeProgression({characters:{nyanluna:{level,breaks:3},tsukineko:{level,breaks:3}}},HEROES),ns=characterStats(n,p.characters.nyanluna),ts=characterStats(t,p.characters.tsukineko);assert.ok(ts.maxHp>ns.maxHp&&ts.attack>ns.attack&&ts.defense>ns.defense);assert.ok(ts.attack/t.interval>ns.attack/n.interval);}
 const g=quiet();near(g.skillDamage(n.id,20),30);near(g.skillDamage(t.id,20),20);assert.equal(n.chargeRate,1.5);assert.equal(t.chargeRate,1);
});
test('charges belong to the attacking hero, including support; switching never transfers charge',()=>{
 const g=quiet(),enemy=target(g);g.hit(enemy,1,0,0,false,false,'nyanluna');g.hit(enemy,1,0,0,false,false,'tsukineko');near(g.player.charge,.65*1.5);near(g.chargeFor(1),.65);
 g.switchHero();near(g.player.charge,.65);g.player.charge=100;g.ultimate();near(g.chargeFor(0),.65*1.5);assert.equal(g.chargeFor(1),0);g.player.switchCooldown=0;g.switchHero();near(g.player.charge,.65*1.5);
 g.skills.focus=1;const before=g.chargeFor(1);g.hit(enemy,1,0,0,false,false,'tsukineko');near(g.chargeFor(1)-before,.65*1.3);g.gainUltimateCharge('unknown',999);assert.equal(g.ultimateCharges.unknown,undefined);
});
test('a projectile fired before switching still fills its original caster gauge',()=>{
 const g=quiet(),e=target(g,'moss',0,6);g.attackFrom(g.player,0);g.switchHero();g.player.attack=999;tick(g,25);assert.ok(e.hp<10000);assert.ok(g.chargeFor(0)>0);assert.equal(g.chargeFor(1),0);
});
test('Moon Sanctuary delivers exactly four area pulses, heals once and does not refill itself',()=>{
 const g=quiet(),inside=target(g),outside=target(g,'boss',17,3);g.player.hp=90;g.player.charge=100;assert.equal(g.ultimate(),true);near(g.player.hp,114);near(10000-inside.hp,90);assert.equal(outside.hp,10000);g.player.charge=100;assert.equal(g.ultimate(),false);g.player.charge=0;
 // Hold targets in place so this measures all four pulses within the fixed field.
 for(let i=0;i<180;i++){inside.x=0;inside.z=8;inside.knockX=inside.knockZ=0;g.tick(1/60);}
 near(10000-inside.hp,360);assert.equal(g.drainEvents().filter(e=>e.type==='ultimatePulse').length,4);assert.equal(g.ultimateEffects.length,0);assert.equal(g.player.charge,0);assert.equal(outside.hp,10000);assert.equal(g.player.hp,114);
});
test('Moon Sanctuary slows enemies inside its actual footprint, with reduced effect on bosses',()=>{
 const g=quiet(),inside=target(g,'moss',5,3),boss=target(g,'boss',-5,3),outside=target(g,'moss',17,3);g.player.charge=100;g.ultimate();near(enemySpeedScale(g,inside),.55);near(enemySpeedScale(g,boss),.8);near(enemySpeedScale(g,outside),1);
 inside.speed=1.4;inside.knockX=inside.knockZ=0;const x=inside.x;g.tick(1/60);near(x-inside.x,1.4/60*.55);g.ultimateEffects=[];near(enemySpeedScale(g,inside),1);
});
test('Comet Barrage creates eight aimed, three-target piercing rounds and gives no free healing',()=>{
 const g=quiet(1),e=target(g,'boss',0,9);g.player.hp=100;g.player.charge=100;g.ultimate();assert.equal(g.player.hp,100);const first=g.projectiles[0];assert.equal(first.ultimate,true);assert.equal(first.pierce,3);assert.equal(first.kind,'gun');assert.equal(e.hp,10000);
 for(let i=0;i<120;i++){e.x=0;e.z=9;e.knockX=e.knockZ=0;g.tick(1/60);}
 assert.equal(g.drainEvents().filter(e=>e.type==='ultimateShot').length,8);near(10000-e.hp,38*8);assert.equal(g.chargeFor(1),0);assert.equal(g.ultimateEffects.length,0);assert.equal(g.projectiles.length,0);
});
test('an ultimate rifle round hits each of three collinear targets once and stops before a fourth',()=>{
 const g=quiet(1),enemies=[5,7,9,11].map(z=>target(g,'moss',0,z));g.player.charge=100;g.ultimate();g.ultimateEffects=[];
 for(let i=0;i<24;i++){for(let j=0;j<4;j++){Object.assign(enemies[j],{x:0,z:5+j*2,knockX:0,knockZ:0});}g.tick(1/60);}
 for(const e of enemies.slice(0,3))near(10000-e.hp,38);assert.equal(enemies[3].hp,10000);assert.equal(g.projectiles.length,0);
});
test('delayed casts keep their owner after swapping and ultimate-triggered nova cannot refill a gauge',()=>{
 for(const hero of [0,1]){const g=quiet(hero);g.skills.nova=1;g.player.charge=100;g.ultimate();g.switchHero();g.player.attack=g.partner.attack=999;const e=g.spawnEnemy('moss',0,6);e.hp=1;e.speed=0;const b=g.spawnEnemy('bat',.5,6);b.hp=1;b.speed=0;tick(g,90);assert.equal(g.kills,2);assert.equal(g.earnedXp[HEROES[hero].id],7);assert.equal(g.earnedXp[HEROES[1-hero].id],3.5);assert.equal(g.chargeFor(0),0);assert.equal(g.chargeFor(1),0);}
});
test('pause, upgrade, defeat and gate transitions cannot leak delayed shots or area effects',()=>{
 for(const hero of [0,1]){const g=quiet(hero,[HEROES[hero].id]),e=target(g);g.player.charge=100;g.ultimate();g.pause();const before=g.snapshot();tick(g,300);assert.deepEqual(g.snapshot(),before);g.resume();g.phase='upgrade';const effect=structuredClone(g.ultimateEffects);tick(g,100);assert.deepEqual(g.ultimateEffects,effect);g.phase='playing';g.player.invincible=0;g.hurt(9999,0,0);assert.equal(g.ultimateEffects.length,0);assert.equal(g.projectiles.length,0);const hp=e.hp;tick(g,200);assert.equal(e.hp,hp);}
 const g=quiet();g.wave=2;g.player.charge=100;g.ultimate();g.ultimateCharges.tsukineko=70;g.openExit();assert.equal(g.ultimateEffects.length,0);g.exitDelay=0;Object.assign(g.player,{x:g.exitPoint.x,z:g.exitPoint.z});g.crossExit();g.advanceStage();assert.equal(g.ultimateEffects.length,0);assert.equal(g.chargeFor(1),70);
});
test('equipment and permanent growth scale skill damage once while each signature retains its identity',()=>{
 const g=quiet();g.progression.characters.nyanluna.level=10;g.progression.equipment.owned=['ruins-lens'];g.progression.equipment.loadout.nyanluna='ruins-lens';g.skills.power=2;
 near(g.skillDamage('nyanluna',60),60*(1+9*.045)*1.12*1.5*1.5);assert.notEqual(ultimateFor('nyanluna').id,ultimateFor('tsukineko').id);assert.equal(ultimateFor('tsukineko').heal,undefined);
});
