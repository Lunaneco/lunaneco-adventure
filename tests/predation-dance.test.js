import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {tickUltimates} from '../src/ultimate-combat.js';
import {finishPredation,predationUltimate,PREDATION_KILL_ATTACK_RATE} from '../src/hehereal-predation.js';
import {ULTIMATE_ART} from '../src/ultimate-art.js';
import {statSync} from 'node:fs';
import {TALENT_NODES} from '../src/talents.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} !== ${b}`);
function game(){const g=new Adventure({seed:3,hero:6,party:['hehereal','omsolo'],progression:{story:{version:2,actClears:Array(28).fill(true)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:80,breaks:5}]))}});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.player.x=g.player.z=0;g.player.invincible=0;g.drainEvents();return g;}
function enemy(g,x=0,z=3,hp=1e9){const e=g.spawnEnemy('moss',x,z);e.hp=e.maxHp=hp;e.speed=0;e.special=e.attack=999;return e;}
function cast(g){g.predate();g.player.charge=100;assert.equal(g.ultimate(),true);g.player.attack=999;return g.ultimateEffects[0];}
test('normal Hehereal keeps her homing ultimate; only transformed Hehehe gets Predation Dance',()=>{const g=game();assert.equal(g.ultimateSpec().kind,'homingBarrage');assert.equal(g.ultimateSpec().shots,9);cast(g);assert.equal(g.ultimateSpec().name,'捕食の舞');assert.equal(g.ultimateEffects[0].kind,'predationDance');assert.equal(g.projectiles.length,0);assert.equal(g.player.charge,0);assert.ok(g.player.invincible>=2.8);});
test('eight mobile-following dance pulses hit nearby enemies and not distant ones, without free healing or charge',()=>{
 const g=game(),inside=enemy(g),outside=enemy(g,17,0);g.healthFor(6).hp=131;cast(g);const after=inside.hp;assert.ok(after<1e9);assert.equal(outside.hp,1e9);assert.equal(g.player.hp,131);
 for(let i=0;i<180;i++){inside.x=0;inside.z=3;inside.knockX=inside.knockZ=0;g.tick(1/60);}assert.equal(g.drainEvents().filter(e=>e.type==='predationPulse').length,8);assert.equal(g.ultimateEffects.length,0);assert.equal(g.player.charge,0);assert.equal(g.player.hp,131);
});
test('each kill during the dance adds a fixed 10% of the combined transformation attack, not compounding',()=>{
 const g=game();enemy(g,0,2,1);enemy(g,1,2,1);cast(g);const base=g.predation.baseAttack;assert.equal(g.predation.danceKills,2);near(g.predation.attackBonus,base*PREDATION_KILL_ATTACK_RATE*2);near(g.statsFor(6).attack,base+base*.2);const third=enemy(g,10,0,1);g.hit(third,999,0,0,false,false,'hehereal');assert.equal(g.predation.danceKills,3);near(g.statsFor(6).attack,base+base*.3);assert.equal(g.runHits,0);assert.equal(g.stageTrial.hits,0);
});
test('normal attacks and chained nova kills during the ultimate also qualify; non-ultimate kills never do',()=>{
 const g=game();g.predate();const before=enemy(g,0,2,1);g.hit(before,999,0,0);assert.equal(g.predation.danceKills,0);g.skills.nova=1;enemy(g,0,2,1);enemy(g,.5,2,1);g.player.charge=100;g.ultimate();assert.equal(g.predation.danceKills,2);const count=g.predation.danceKills;tickUltimates(g,10);assert.equal(g.ultimateEffects.length,0);const after=enemy(g,10,0,1);g.hit(after,999,0,0);assert.equal(g.predation.danceKills,count);
});
test('same dead enemy, training enemies, rare escape and other owners cannot farm attack',()=>{
 const g=game();const dead=enemy(g,0,2,1);cast(g);assert.equal(g.predation.danceKills,1);g.hit(dead,999,0,0);assert.equal(g.predation.danceKills,1);const training=enemy(g,10,0,1);training.training=true;g.hit(training,999,0,0);assert.equal(g.predation.danceKills,1);
 const other=enemy(g,10,0,1);g.hit(other,999,0,0,false,false,'omsolo');assert.equal(g.predation.danceKills,1);const rare=g.spawnEnemy('goldenHehe',10,0);rare.expiresAt=g.time;g.hit(rare,1e9,0,0);assert.equal(g.predation.danceKills,1);
});
test('power scales subsequent dance hits immediately, persists after dance and waves, and accumulates across casts',()=>{
 const g=game();g.predate();const base=g.predation.baseAttack;g.player.charge=100;g.ultimate();const effect=g.ultimateEffects[0],normalDamage=g.skillDamage('hehereal',effect.spec.baseDamage);const kill=enemy(g,10,0,1);g.hit(kill,999,0,0);near(g.skillDamage('hehereal',effect.spec.baseDamage),normalDamage*1.1);tickUltimates(g,10);near(g.statsFor(6).attack,base*1.1);g.startWave();near(g.statsFor(6).attack,base*1.1);g.enemies=[];enemy(g,0,2,1);g.player.charge=100;g.ultimate();assert.equal(g.predation.danceKills,2);near(g.statsFor(6).attack,base*1.2);
});
test('movement relocates the dance; pause freezes it and stage doors cancel only the dance, not earned power',()=>{
 const g=game();enemy(g,0,2,1);cast(g);const bonus=g.predation.attackBonus;g.player.x=5;g.player.z=0;const nearNew=enemy(g,7,0);tickUltimates(g,.35);assert.ok(nearNew.hp<1e9);assert.equal(g.ultimateEffects[0].x,5);g.pause();const effect=structuredClone(g.ultimateEffects);g.tick(3);assert.deepEqual(g.ultimateEffects,effect);g.resume();g.openExit();assert.equal(g.ultimateEffects.length,0);assert.equal(g.predation.active,true);assert.equal(g.predation.attackBonus,bonus);
});
for(const phase of ['victory','defeat'])test(`${phase} ends both transformation and accumulated attack; next battle has no power`,()=>{const g=game(),base=g.statsFor(6).attack;enemy(g,0,2,1);cast(g);assert.ok(g.predation.attackBonus>0);g.phase=phase;assert.equal(finishPredation(g),true);assert.equal(g.predation.attackBonus,0);assert.equal(g.predation.danceKills,0);near(g.statsFor(6).attack,base);assert.equal(g.ultimateSpec().kind,'homingBarrage');assert.equal(game().predation.attackBonus,0);});
test('normal homing-shot/range talents become dance pulse/radius upgrades instead of disappearing',()=>{
 const base=predationUltimate({level:80,tree:[]});const tree=TALENT_NODES.map(n=>n.id);const upgraded=predationUltimate({level:80,tree});assert.ok(upgraded.pulses>base.pulses);assert.ok(upgraded.radius>base.radius);assert.ok(upgraded.baseDamage>base.baseDamage);assert.ok(upgraded.immunity>base.immunity);
});
test('both normal and transformed ultimates have new dedicated generated illustrations',()=>{assert.equal(ULTIMATE_ART.hehehe.file,'assets/ultimates/hehe-predation-dance-v1.png');assert.equal(ULTIMATE_ART.hehereal.file,'assets/ultimates/hehereal-sakura-promise-v1.png');for(const id of ['hehehe','hehereal'])assert.ok(statSync(new URL('../public/'+ULTIMATE_ART[id].file,import.meta.url)).size>1000);});
