import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {ACTS,CHAPTERS,completeAct,isActUnlocked} from '../src/acts.js';
import {FIFTH_CHAPTER_SCENES} from '../src/chapter-five-story.js';
import {requiredPartyMember,partyForAct} from '../src/party.js';
import {isHeroUnlocked} from '../src/recruitment.js';
import {PRIM_MOUNT,PRIM_BOND,beamContains} from '../src/prim-combat.js';
import {PRISM_ENEMIES} from '../src/chapter-five-enemies.js';
import {tickEnemyBehavior} from '../src/enemy-combat.js';
import {WEAPON_CATALOG,weaponImage,equipWeapon,drawWeapon} from '../src/weapons.js';
import {UNIQUE_EQUIPMENT,equipmentImage} from '../src/equipment.js';
import {STAGE_MISSIONS} from '../src/missions.js';
import {enemyMaterials} from '../src/talents.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const profile=(clears=20)=>normalizeProgression({story:{version:2,actClears:ACTS.map(a=>a.id<clears)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}},HEROES);
function quiet(options={}){const g=new Adventure({act:16,seed:3,progression:profile(),party:['tsukineko','prim'],hero:1,...options});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.player.x=g.player.z=0;g.rng=()=>1;g.drainEvents();return g;}
const tick=(g,t,input)=>{for(let i=0;i<Math.ceil(t*60);i++)g.tick(1/60,input);};
const target=(g,x,z)=>{const e=g.spawnEnemy('prismCrawler',x,z);Object.assign(e,{hp:1e7,maxHp:1e7,radius:.1,speed:0,attack:999,special:999});return e;};
test('chapter five migrates existing saves, enforces each first-clear solo, and recruits Prim only at final gate',()=>{
 const old=profile(16);assert.equal(CHAPTERS[4].title,'プリズムの国');assert.ok(isActUnlocked(old,16));assert.equal(isHeroUnlocked(old,'prim'),false);
 for(let act=16;act<20;act++){
  const p=profile(act);assert.equal(requiredPartyMember(p,act),'tsukineko');assert.deepEqual(partyForAct(['nyanluna','shizuku'],HEROES,p,act,'shizuku'),['tsukineko']);
  const g=quiet({act,progression:p,hero:4,party:['shizuku','prim']});assert.deepEqual(g.party,['tsukineko']);assert.equal(g.player.hero,1);
  g.area=2;g.wave=6;g.hit(g.spawnEnemy('boss',0,8),1e9,0,0);assert.equal(isHeroUnlocked(g.progression,'prim'),false);
  g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.equal(g.crossExit(),true);
  assert.equal(isHeroUnlocked(g.progression,'prim'),act===19);assert.equal(g.recruitedHeroId,act===19?'prim':null);assert.equal(requiredPartyMember(g.progression,act),null);
  assert.deepEqual(quiet({act,progression:g.progression,party:['mochinyafe','shizuku'],hero:3}).party,['mochinyafe','shizuku']);
  assert.equal(completeAct(g.progression,act),false);assert.deepEqual(normalizeProgression(g.progression,HEROES),g.progression);
 }
});
test('chapter five uses two story voices and the reference dragon purification, with level-60 chapter-four stats and drops',()=>{
 for(const a of ACTS.filter(a=>a.chapter===4)){assert.equal(a.recommendedLevel,60);assert.deepEqual(a.counts,ACTS[a.id-4].counts);assert.equal(a.bossHp,ACTS[a.id-4].bossHp);assert.match(a.boss,/プリズムドラゴン/);assert.ok(enemyMaterials({type:'boss',hp:0},a.id,'normal',()=>0).demonHeart>0);}
 const lines=FIFTH_CHAPTER_SCENES.flatMap(a=>Object.values(a).flatMap(s=>s.lines));assert.deepEqual([...new Set(lines.map(l=>l.who))].sort(),['prim','tsukineko']);for(const l of lines.filter(l=>l.who==='prim'))assert.match(l.text,l.portrait==='primRaging'?/^グオオオ[ッ！…。]*$/:/^キュ〜[っ！♪…。]*$/);
 assert.ok(FIFTH_CHAPTER_SCENES[3].ending.lines.some(l=>l.text.includes('小さくなった')));assert.ok(FIFTH_CHAPTER_SCENES[3].ending.lines.some(l=>l.text.includes('きみの名前')));assert.equal(Object.keys(PRISM_ENEMIES).length,7);
});
test('ten generated claws and four distinct trial relics remain obtainable and persist',()=>{
 const claws=WEAPON_CATALOG.filter(w=>w.heroId==='prim');assert.equal(claws.length,10);assert.deepEqual([1,2,3,4].map(r=>claws.filter(w=>w.rarity.rank===r).length),[1,3,3,3]);assert.equal(new Set(claws.map(weaponImage)).size,10);
 const p=profile();p.inventory.weaponTicket=9;for(const rarity of [.1,.8,.99])for(const family of [.1,.5,.9]){const rolls=[5.5/7,rarity,family],r=drawWeapon(p,()=>rolls.shift());assert.equal(r.item.heroId,'prim');assert.equal(r.duplicate,false);assert.ok(equipWeapon(p,'prim',r.item.id));}
 for(const item of claws){const bytes=readFileSync('public'+weaponImage(item));assert.equal(bytes.toString('ascii',8,12),'WEBP');}
 const relics=UNIQUE_EQUIPMENT.filter(r=>r.act>=16);assert.equal(relics.length,4);for(const r of relics){assert.ok(existsSync('public'+equipmentImage(r.id)));assert.ok(STAGE_MISSIONS.some(m=>m.act===r.act&&m.equipment===r.id&&m.trial));}
 assert.equal(normalizeProgression(p,HEROES).weapons.owned.filter(id=>id.includes('claw')).length,10);
});
test('the pair bonus is confined to the deployed pair; mount uses Omsolo speed and both independent main attacks',()=>{
 const p=profile(),g=quiet({progression:p});for(const i of [1,5]){const s=combatStats(p,HEROES[i]);near(g.statsFor(i).attack,s.attack*PRIM_BOND.attack);near(g.statsFor(i).maxHp,Math.round(s.maxHp*PRIM_BOND.hp));}
 const solo=quiet({party:['prim'],hero:5});near(solo.statsFor(5).attack,combatStats(p,HEROES[5]).attack);assert.equal(solo.mountPrim(),false);
 assert.ok(g.mountPrim());assert.equal(g.switchHero(),false);const x=g.player.x;g.tick(.05,{x:1,z:0});near(g.player.x-x,HEROES[2].moveSpeed*.05);near(g.partner.x,g.player.x);near(g.partner.z,g.player.z);
 const e=target(g,g.player.x,2);g.player.attack=g.partner.attack=0;g.tick(.01);assert.ok(e.hp<e.maxHp);assert.ok(g.projectiles.some(b=>b.heroId==='tsukineko'));assert.ok(g.drainEvents().filter(e=>e.type==='attack').every(e=>!e.support));near(g.partner.attack,g.attackProfile(5).interval);
});
test('mounted damage uses each defense, ends on either knockout, and both down defeats once',()=>{
 for(const loser of ['prim','tsukineko','both']){const g=quiet();g.mountPrim();g.player.invincible=0;const before=[g.healthFor(1).hp,g.healthFor(5).hp];g.hurt(100,0,0);for(const [j,i] of [1,5].entries())near(before[j]-g.healthFor(i).hp,100*100/(100+g.statsFor(i).defense));
  g.player.invincible=0;if(loser!=='prim')g.healthFor(1).hp=1;if(loser!=='tsukineko')g.healthFor(5).hp=1;g.hurt(100,0,0);assert.equal(g.mount.active,false);assert.equal(g.mount.cooldown,20);assert.equal(g.phase,loser==='both'?'defeat':'playing');if(loser==='tsukineko')assert.equal(g.player.hero,5);assert.equal(g.drainEvents().filter(e=>e.type==='defeat').length,loser==='both'?1:0);
 }
});
test('mount duration/cooldown freeze in pause and choices, prevent immediate remount, then recover',()=>{
 const g=quiet();g.mountPrim();g.pause();tick(g,2);assert.equal(g.mount.remaining,12);g.resume();g.phase='upgrade';tick(g,2);assert.equal(g.mount.remaining,12);g.phase='playing';tick(g,12.1);assert.equal(g.mount.active,false);assert.ok(g.mount.cooldown>19.8);assert.equal(g.mountPrim(),false);tick(g,20.1);assert.equal(g.mount.cooldown,0);assert.equal(g.mountPrim(),true);assert.ok(PRIM_MOUNT.scale>1.5);
});
test('Prim breath is a forward fixed-direction piercing beam; duet consumes both meters and uses both attack values',()=>{
 for(const duet of [false,true]){const g=quiet({party:duet?['tsukineko','prim']:['prim'],hero:duet?1:5});Object.assign(g.partner,{x:0,z:0});const inside=target(g,0,2),far=target(g,0,18),side=target(g,6,3),back=target(g,0,-5);g.ultimateCharges.prim=100;if(duet)g.ultimateCharges.tsukineko=100;assert.ok(g.ultimate());const effect=g.ultimateEffects[0];assert.equal(effect.kind,'prismBeam');assert.equal(effect.angle,0);assert.equal(g.ultimateCharges.prim,0);if(duet)assert.equal(g.ultimateCharges.tsukineko,0);
  const expected=(duet?['tsukineko','prim']:['prim']).reduce((sum,id)=>sum+g.skillDamage(id,effect.spec.baseDamage),0);near(inside.maxHp-inside.hp,expected);near(far.maxHp-far.hp,expected);assert.equal(side.hp,side.maxHp);assert.equal(back.hp,back.maxHp);g.player.face=Math.PI;tick(g,.28);assert.equal(effect.angle,0);assert.equal(back.hp,back.maxHp);assert.ok(beamContains(effect,far));
 }
});
test('reference dragon alternates 3/5-way salvos and a locked straight breath, with pause and kill cancellation',()=>{
 for(const low of [false,true]){const g=quiet({party:['tsukineko']}),e=g.spawnEnemy('boss',0,-7);e.special=0;e.action=0;if(low)e.hp=e.maxHp*.49;tickEnemyBehavior(g,e,.01);assert.equal(e.cast.offsets.length,low?5:3);assert.ok(e.cast.total>0);const angle=e.cast.angle;g.player.x=5;tickEnemyBehavior(g,e,e.cast.remaining+.001);assert.equal(g.projectiles.filter(b=>b.owner==='enemy').length,low?5:3);
  e.salvo=null;e.special=0;tickEnemyBehavior(g,e,.01);const beam=g.hazards.find(h=>h.damage>0&&h.shape==='line');assert.ok(beam);assert.equal(e.cast.kind,'chant');const saved=structuredClone(beam);g.pause();tick(g,2);assert.deepEqual(beam,saved);g.resume();g.hit(e,1e9,0,0);tick(g,.1);assert.equal(g.hazards.filter(h=>h.sourceId===e.id).length,0);
 }
});
