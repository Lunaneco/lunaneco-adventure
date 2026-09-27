import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {ACTS,EXTRA_ACTS,completeAct,isActUnlocked} from '../src/acts.js';
import {normalizeProgression,breakthrough,breakthroughStatus,awardCharacterXp,levelCap,combatStats,unlockTalent} from '../src/progression.js';
import {LEVEL_AWAKENING_COSTS} from '../src/level-rules.js';
import {MATERIALS,FIRST_TIER_NODES,SECOND_TIER_NODES,THIRD_TIER_NODES,enemyMaterials} from '../src/talents.js';
import {enemyRosterForAct} from '../src/enemies.js';
import {isHeroUnlocked} from '../src/recruitment.js';
import {tickEnemyBehavior} from '../src/enemy-combat.js';
import {healHero,SHIZUKU_DUET} from '../src/shizuku-combat.js';
import {mochiCryHit} from '../src/mochi-combat.js';
import {tickUltimates} from '../src/ultimate-combat.js';
import {World} from '../src/world.js';
import {trialInput} from './country-bot.js';
import {chooseOffer} from './bot.js';
import {FOURTH_CHAPTER_SCENES} from '../src/chapter-four-story.js';
import {STORY_CAST} from '../src/story-cast.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('the fourth act voices its decisive scenes and presents Shizuku and Nyanluna as close friends',()=>{
 const act=FOURTH_CHAPTER_SCENES[3],lines=Object.values(act).flatMap(s=>s.lines);
 assert.equal(lines.filter(l=>l.who==='narrator'&&l.voiced).length,3);
 assert.ok(lines.filter(l=>l.who!=='narrator').every(l=>l.voiced));
 assert.ok(act.ending.lines.some(l=>l.voiced&&l.text.startsWith('雫が仲間になった。')));
 assert.ok(act.ending.lines.at(-1).text.includes('HP'));assert.equal(act.ending.lines.at(-1).voiced,false);
 assert.equal(STORY_CAST.shizukuDuet.role,'大の仲良し');
 assert.doesNotMatch(JSON.stringify(FOURTH_CHAPTER_SCENES),/昔から|昔みたいに|昔の合図/);
});
test('scythe and duet pulses animate their casters and use crimson and lunar effects',()=>{
 const world={heroes:HEROES.map(()=>({userData:{attackTime:0}})),ring(...args){this.rings.push(args);},burst(...args){this.bursts.push(args);},rings:[],bursts:[]};
 World.prototype.handle.call(world,[{type:'saberPulse',heroId:'shizuku',kind:'scytheDance',x:0,z:0,radius:6}]);
 assert.ok(world.heroes[4].userData.attackTime>0);assert.equal(world.heroes[2].userData.attackTime,0);assert.equal(world.rings[0][2],0xf2a6c7);
 World.prototype.handle.call(world,[{type:'saberPulse',heroId:'shizuku',heroIds:['nyanluna','shizuku'],kind:'moonDrop',x:0,z:0,radius:10}]);
 assert.ok(world.heroes[0].userData.attackTime>0);assert.equal(world.heroes[2].userData.attackTime,0);assert.equal(world.rings.at(-1)[2],0xd7b6ff);
});
function profile(cleared=16,level=60){return normalizeProgression({story:{version:2,actClears:ACTS.map((a,i)=>i<cleared)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level,breaks:level>=60?4:3,tree:[...FIRST_TIER_NODES,...SECOND_TIER_NODES].map(n=>n.id)}])),tutorial:{firstBattleCompleted:true}},HEROES);}
function quiet({party=['shizuku'],hero=4,act=12,...options}={}){const g=new Adventure({party,hero,act,progression:profile(),seed:9,...options});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.rng=()=>1;g.drainEvents();return g;}
function gate(g){g.phase='playing';g.area=2;g.wave=6;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.ok(g.crossExit());}

test('fourth chapter follows the old save, is playable at 50, and recruits Shizuku only on the final gate',()=>{
 const old=profile(12,50);assert.equal(old.story.chapterFourCleared,false);assert.equal(isHeroUnlocked(old,'shizuku'),false);assert.ok(isActUnlocked(old,12));assert.equal(isActUnlocked(old,13),false);
 assert.deepEqual(old.story.extraClears,[false,false,false]);assert.deepEqual(EXTRA_ACTS.map(a=>a.id),[20,21,22]);
 for(let act=12;act<16;act++){
  const g=quiet({act,progression:old,party:['nyanluna'],hero:0});assert.equal(g.act,act);assert.equal(g.player.hero,0);assert.equal(ACTS[act].recommendedLevel,60);
  const boss=g.spawnEnemy('boss',0,-5);g.hit(boss,1e9,0,0);assert.equal(isHeroUnlocked(g.progression,'shizuku'),false);gate(g);
  assert.equal(g.recruitedHeroId,act===15?'shizuku':null);Object.assign(old,normalizeProgression(JSON.parse(JSON.stringify(g.progression)),HEROES));
 }
 assert.ok(old.story.chapterFourCleared&&old.story.demonKingCalm&&isHeroUnlocked(old,'shizuku'));assert.equal(completeAct(old,15),false);
 const forged=normalizeProgression({story:{version:2,actClears:Array(12).fill(true),shizukuUnlocked:true,demonKingCalm:true}},HEROES);assert.equal(isHeroUnlocked(forged,'shizuku'),false);assert.equal(forged.story.demonKingCalm,false);
});
test('Lv.50 to 60 already requires rarity 3; no earlier limit step consumes it; cap ends at 80',()=>{
 for(const cost of LEVEL_AWAKENING_COSTS.slice(0,3))assert.ok(Object.keys(cost).every(id=>MATERIALS[id]?.rarity!==3));
 for(const cost of LEVEL_AWAKENING_COSTS.slice(3))assert.ok(cost.bloodCrystal>0&&cost.demonHeart>0);
 const p=profile(12,50);awardCharacterXp(p,'nyanluna',1e6);Object.assign(p.inventory,LEVEL_AWAKENING_COSTS[3],{bloodCrystal:0,demonHeart:0});const before=structuredClone(p);
 assert.equal(breakthroughStatus(p,'nyanluna').canBreak,false);assert.equal(breakthrough(p,'nyanluna'),false);assert.deepEqual(p,before);
 for(let i=3;i<6;i++){Object.assign(p.inventory,LEVEL_AWAKENING_COSTS[i]);assert.ok(breakthrough(p,'nyanluna'));assert.equal(levelCap(p.characters.nyanluna),30+i*10);}
 assert.equal(p.characters.nyanluna.level,80);assert.equal(p.characters.nyanluna.xp,0);assert.equal(breakthrough(p,'nyanluna'),false);
 const locked=profile(11,50);Object.assign(locked.inventory,LEVEL_AWAKENING_COSTS[3]);assert.equal(breakthroughStatus(locked,'nyanluna').chapterMet,false);
});
test('rarity 3 drops start in chapter four, persist through defeat, and fund the third ability tier',()=>{
 for(const act of [0,4,8,20,21,22]){const drops=enemyMaterials({type:'boss',hp:0},act,'hard',()=>0);assert.equal(drops.bloodCrystal??0,0);assert.equal(drops.demonHeart??0,0);}
 const g=quiet({party:['nyanluna'],hero:0,progression:profile(12,50)});g.materialRng=()=>0;
 g.hit(g.spawnEnemy('demonImp',8,8),1e9,0,0);assert.equal(g.earnedMaterials.bloodCrystal,1);g.hit(g.spawnEnemy('boss',8,8),1e9,0,0);assert.equal(g.earnedMaterials.demonHeart,2);
 g.player.invincible=0;g.hurt(1e9,0,0);const saved=normalizeProgression(g.progression,HEROES);assert.equal(saved.inventory.demonHeart,2);
 const p=profile(12,60);for(const n of THIRD_TIER_NODES)assert.ok(n.level>=60&&n.cost.bloodCrystal&&n.cost.demonHeart);
 Object.assign(p.inventory,THIRD_TIER_NODES[0].cost);assert.ok(unlockTalent(p,'nyanluna','demonGate'));assert.equal(unlockTalent(p,'nyanluna','attack4'),false);
});
test('scythe absorbs actual damage, never overkill; a support Shizuku heals only herself, without reviving',()=>{
 for(const support of [false,true]){
  const g=quiet(support?{party:['nyanluna','shizuku'],hero:0}:{}),source=support?g.partner:g.player;g.healthFor(4).hp=50;const lead=g.player.hp;
  const e=g.spawnEnemy('moss',source.x,source.z+1);e.hp=10;assert.ok(g.attackFrom(source,4,support));near(g.healthFor(4).hp,51);if(support)near(g.player.hp,lead);
  assert.equal(g.drainEvents().filter(e=>e.type==='lifeDrain').length,1);g.attackFrom(source,4,support);near(g.healthFor(4).hp,51);
  g.healthFor(4).hp=g.healthFor(4).maxHp-1;assert.equal(healHero(g,'shizuku',999,{drain:true}),1);g.healthFor(4).hp=0;assert.equal(healHero(g,'shizuku',999,{drain:true}),0);
 }
});
test('close friends receive their exact bonus, and the two-gauge duet consumes and heals both once',()=>{
 for(const hero of [0,4]){
  const g=quiet({party:['nyanluna','shizuku'],hero});for(const i of [0,4]){const stats=combatStats(g.progression,HEROES[i]);near(g.statsFor(i).attack,stats.attack*1.12);assert.equal(g.statsFor(i).maxHp,Math.round(stats.maxHp*1.12));}
  g.gainUltimateCharge('shizuku',10);const solo=quiet();solo.gainUltimateCharge('shizuku',10);near(g.ultimateCharges.shizuku,solo.ultimateCharges.shizuku*1.2);
  g.ultimateCharges.nyanluna=100;g.ultimateCharges.shizuku=99;assert.equal(g.duetReady,false);g.ultimateCharges.shizuku=100;assert.ok(g.duetReady);assert.equal(g.ultimateSpec().id,SHIZUKU_DUET.id);
  g.healthFor(0).hp=g.healthFor(4).hp=100;assert.ok(g.ultimate());assert.equal(g.ultimateEffects[0].kind,'moonDrop');near(g.healthFor(0).hp,160);near(g.healthFor(4).hp,160);assert.equal(g.ultimateCharges.nyanluna,0);assert.equal(g.ultimateCharges.shizuku,0);assert.equal(g.ultimate(),false);
  for(let i=0;i<120;i++)tickUltimates(g,1/60);assert.equal(g.ultimateEffects.length,0);assert.equal(g.drainEvents().filter(e=>e.type==='saberPulse').length,6);
 }
 const fallen=quiet({party:['nyanluna','shizuku'],hero:0});fallen.ultimateCharges.nyanluna=fallen.ultimateCharges.shizuku=100;fallen.healthFor(4).hp=0;assert.equal(fallen.duetReady,false);assert.ok(fallen.ultimate());assert.equal(fallen.ultimateEffects[0].kind,'sanctuary');
});
test('seven demons and four different bosses expose warnings and every boss enters its expanded phase',()=>{
 assert.equal(enemyRosterForAct(12).length,7);assert.equal(new Set(ACTS.slice(12,16).map(a=>a.bossId)).size,4);
 for(let act=12;act<16;act++)for(let action=0;action<3;action++){
  const g=quiet({act}),e=g.spawnEnemy('boss',0,-5);e.special=0;e.action=action;tickEnemyBehavior(g,e,1/60);assert.ok(g.hazards.length);assert.ok(g.hazards.every(h=>h.total>=.65));assert.ok(e.cast.waves>1||e.demonFollowup||g.hazards.length>=3);
  const before=structuredClone(e.cast);g.pause();tickEnemyBehavior(g,e,1);assert.deepEqual(e.cast,before);g.resume();e.hp=e.maxHp*.4;tickEnemyBehavior(g,e,.01);assert.ok(e.enraged);assert.equal(g.drainEvents().filter(e=>e.type==='bossPhase').length,1);
 }
});
test('homing fire turns at a bounded rate then flies straight, and interrupted demons lose queued attacks',()=>{
 const g=quiet(),e=g.spawnEnemy('demonWitch',0,-5);e.special=0;tickEnemyBehavior(g,e,.01);tickEnemyBehavior(g,e,e.cast.remaining+.001);const b=g.projectiles[0];assert.ok(b.homing>0);
 Object.assign(g.player,{x:12,z:8,invincible:999});const initial=Math.atan2(b.vx,b.vz);g.tick(.05);const angle=Math.atan2(b.vx,b.vz);assert.ok(Math.abs(angle-initial)>.001);assert.ok(Math.abs(angle-initial)<=b.turnRate*.05+1e-8);
 b.homing=0;const fixed=[b.vx,b.vz];g.tick(.05);assert.deepEqual([b.vx,b.vz],fixed);
 const h=g.spawnEnemy('demonHound',g.player.x,g.player.z-5);h.special=0;tickEnemyBehavior(g,h,.01);assert.ok(h.demonFollowup);mochiCryHit(g,h);assert.equal(h.demonFollowup,null);assert.equal(h.cast,null);
});
test('enraged demon king completes all three telegraphed rushes before the next attack cycle',()=>{
 const g=quiet({act:15}),e=g.spawnEnemy('boss',0,-5);e.hp=e.maxHp*.4;e.action=2;e.special=0;g.player.invincible=999;let rushes=0,previous=false;
 for(let i=0;i<480;i++){tickEnemyBehavior(g,e,1/60);if(e.rush&&!previous)rushes++;previous=!!e.rush;if(rushes===3&&!e.rush)break;}
 assert.equal(rushes,3);assert.equal(e.demonFollowup,null);assert.equal(e.action,3);
});
for(const act of ACTS.slice(12,16))test(`Lv.60 pair completes ${act.title} with normal attack patterns and actual rewards`,()=>{
 const g=new Adventure({act:act.id,progression:profile(act.id),party:['nyanluna','tsukineko'],hero:1,seed:1});
 for(let frame=0;frame<60*600;frame++){while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;g.tick(1/60,trialInput(g));g.drainEvents();}
 assert.equal(g.phase,'victory',JSON.stringify({act:g.act,wave:g.wave,hp:g.player.hp,time:g.time}));assert.ok(g.earnedMaterials.bloodCrystal>0&&g.earnedMaterials.demonHeart>=2);
});
