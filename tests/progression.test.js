import {RecruitedAdventure} from './recruited-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,STAGE_EXIT,SKILLS} from '../src/model.js';
import {normalizeProgression,awardCharacterXp,breakthrough,levelCap,xpRequired,grantLimitStone,characterStats,LEVEL_RULES} from '../src/progression.js';
import {LEVEL_AWAKENING_COSTS} from '../src/level-rules.js';

const fresh=()=>normalizeProgression({},HEROES);
const tick=(g,n=1)=>{for(let i=0;i<n;i++)g.tick(1/60);};
const quiet=g=>{g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=1000;g.drainEvents();};
const kill=(g,hero=0,type='moss')=>{const e=g.spawnEnemy(type,10,10);g.hit(e,10000,0,0,false,false,HEROES[hero].id);return e;};

test('kill XP gives 100% to its attacker and 50% to the deployed partner and crystals grant no character XP',()=>{
 const g=new RecruitedAdventure();quiet(g);kill(g,1);assert.equal(g.progressFor(1).xp,3);assert.equal(g.progressFor(0).xp,1.5);assert.equal(g.stageCrystals,0);assert.equal(g.orbs[0].value,1);
 const before=structuredClone(g.progression);g.collectAll();g.addCrystals(20);tick(g);assert.equal(g.phase,'upgrade');assert.deepEqual(g.progression.characters,before.characters);assert.equal(g.progression.inventory.moonDew,0);assert.equal(g.progression.missions.stages[0].crystals,12);assert.equal(g.progression.missions.claimed.includes('meadow-crystals'),false);assert.equal(g.offers.length,3);
});
test('XP levels a character immediately without opening the crystal choice',()=>{
 const g=new RecruitedAdventure();quiet(g);for(let i=0;i<24;i++)kill(g);assert.equal(g.progressFor(0).level,2);assert.equal(g.progressFor(0).xp,0);assert.equal(g.progressFor(1).level,1);assert.equal(g.phase,'playing');assert.equal(g.pendingBlessings,0);assert.equal(g.player.maxHp,186);
});
test('a projectile keeps its caster after swapping before impact',()=>{
 const g=new RecruitedAdventure();quiet(g);const e=g.spawnEnemy('moss',0,-2);e.hp=1;g.attackFrom(g.player,0);assert.equal(g.projectiles[0].heroId,'nyanluna');g.switchHero();g.player.attack=1000;tick(g,30);
 assert.equal(g.kills,1);assert.equal(g.progressFor(0).xp,3);assert.equal(g.progressFor(1).xp,1.5);
});
test('both gun and magic support attacks award the supporting character',()=>{
 for(const lead of [0,1]){const g=new RecruitedAdventure({hero:lead});quiet(g);const e=g.spawnEnemy('moss',g.partner.x,g.partner.z+2);e.hp=1;g.attackFrom(g.partner,1-lead,true);tick(g,25);assert.equal(g.kills,1);assert.equal(g.progressFor(1-lead).xp,3);assert.equal(g.progressFor(lead).xp,1.5);}
});
test('chain explosions credit the triggering attacker and duplicate hits do not award twice',()=>{
 const g=new RecruitedAdventure();quiet(g);g.skills.nova=1;const a=g.spawnEnemy('moss',10,10),b=g.spawnEnemy('bat',11,10);b.hp=1;g.hit(a,999,0,0,false,false,'tsukineko');g.hit(a,999,0,0,false,false,'nyanluna');
 assert.equal(g.kills,2);assert.equal(g.progressFor(1).xp,7);assert.equal(g.progressFor(0).xp,3.5);assert.equal(g.drainEvents().filter(e=>e.type==='death').length,2);
});
test('ultimate and orbit credit the controlled hero',()=>{
 const g=new RecruitedAdventure({hero:1});quiet(g);g.spawnEnemy('moss',0,5);g.player.charge=100;g.ultimate();tick(g,120);assert.equal(g.progressFor(1).xp,3);
 g.skills.orbit=1;const angle=(g.time+1/60)*2.3;const e=g.spawnEnemy('moss',g.player.x+Math.cos(angle)*2.5,g.player.z+Math.sin(angle)*2.5);e.hp=1;tick(g);assert.equal(g.progressFor(1).xp,6);assert.equal(g.progressFor(0).xp,3);
});
test('defeat cannot award a late projectile kill',()=>{
 const g=new RecruitedAdventure({party:['nyanluna']});quiet(g);const e=g.spawnEnemy('boss',10,10);g.player.invincible=0;g.hurt(999,0,0);g.hit(e,9999,0,0);assert.equal(g.kills,0);assert.equal(g.progressFor(0).xp,0);
});
test('permanent stats apply to attack, defense and new adventure HP',()=>{
 const p=fresh();p.characters.tsukineko.level=10;const g=new RecruitedAdventure({hero:1,progression:p});quiet(g);g.rng=()=>.99;
 const stats=characterStats(HEROES[1],p.characters.tsukineko);assert.equal(g.player.maxHp,stats.maxHp);assert.equal(g.player.hp,stats.maxHp);
 const e=g.spawnEnemy('golem',0,5);g.attackFrom(g.player,1);g.player.attack=g.partner.attack=1000;g.tick(.05);assert.ok(Math.abs(e.maxHp-e.hp-stats.attack)<1e-8);
 g.player.invincible=0;const before=g.player.hp;g.hurt(100,0,0);assert.ok(Math.abs(before-g.player.hp-10000/(100+stats.defense))<1e-8);
});
test('unequal character levels retain individual health across repeated swaps',()=>{
 const p=fresh();p.characters.tsukineko.level=20;const g=new RecruitedAdventure({progression:p});g.player.hp=90;
 for(let i=0;i<10;i++){g.player.switchCooldown=0;g.switchHero();assert.equal(g.player.hp/g.player.maxHp,g.player.hero===0?.5:1);}
 assert.equal(g.player.hp,90);
});
test('wave changes retain blessings and crossing a stage retains them and preserves character progress',()=>{
 const g=new RecruitedAdventure();quiet(g);for(let i=0;i<24;i++)kill(g);g.orbs=[];g.skills.power=2;g.startWave();assert.equal(g.rank('power'),2);
 g.phase='upgrade';g.pendingBlessings=1;g.offers=[SKILLS.find(s=>s.id==='vitality')];g.chooseSkill('vitality');g.player.hp=g.player.maxHp*.5;
 g.wave=2;g.area=0;g.exitOpen=true;g.exitDelay=0;g.stageCrystals=7;g.blessingTier=2;Object.assign(g.player,{x:g.exitPoint.x,z:g.exitPoint.z});const permanent=structuredClone(g.progression);
 assert.equal(g.crossExit(),true);assert.deepEqual(g.skills,{power:2,vitality:1});assert.equal(g.stageCrystals,7);assert.equal(g.blessingTier,2);assert.equal(g.crystalGoal,8);assert.equal(g.player.hp/g.player.maxHp,.5);assert.equal(g.player.maxHp,226);assert.deepEqual(g.progression.characters,permanent.characters);assert.equal(g.progression.inventory.moonDew,1);g.advanceStage();assert.equal(g.progressFor(0).level,2);
});
test('new runs restore only permanent growth, without sharing a mutable profile',()=>{
 const g=new RecruitedAdventure();kill(g,1,'boss');for(let i=0;i<4;i++)kill(g,1);g.skills.power=3;g.addCrystals(7);const saved=JSON.parse(JSON.stringify(g.progression));const next=new RecruitedAdventure({hero:1,progression:saved});assert.equal(next.progressFor(1).level,2);assert.equal(next.player.maxHp,216);assert.deepEqual(next.skills,{});assert.equal(next.stageCrystals,0);kill(next,1);assert.deepEqual(g.progression,saved);
});
test('level caps require the current cap and an item; XP waits and unlocks after consumption',()=>{
 const p=fresh();Object.assign(p.inventory,LEVEL_AWAKENING_COSTS[0]);assert.equal(breakthrough(p,'nyanluna'),false);assert.equal(p.inventory.limitStone,1);
 awardCharacterXp(p,'nyanluna',9999);assert.equal(p.characters.nyanluna.level,20);assert.ok(p.characters.nyanluna.xp>0);const xp=p.characters.nyanluna.xp;
 assert.equal(breakthrough(p,'nyanluna'),true);assert.equal(p.inventory.limitStone,0);assert.equal(levelCap(p.characters.nyanluna),30);assert.ok(p.characters.nyanluna.level>20);assert.ok(p.characters.nyanluna.xp<xp);assert.equal(breakthrough(p,'nyanluna'),false);assert.equal(p.characters.tsukineko.breaks,0);
});
test('cap unlocks never exceed 80 or consume items once fully unlocked',()=>{
 const p=fresh();p.story.chapterThreeCleared=true;for(const cost of LEVEL_AWAKENING_COSTS)for(const [id,n] of Object.entries(cost))p.inventory[id]+=n;grantLimitStone(p,1);awardCharacterXp(p,'tsukineko',999999);
 for(const cap of [30,40,50,60,70,80]){assert.equal(breakthrough(p,'tsukineko'),true);assert.equal(levelCap(p.characters.tsukineko),cap);}
 assert.equal(p.characters.tsukineko.level,80);assert.equal(p.characters.tsukineko.xp,0);assert.equal(breakthrough(p,'tsukineko'),false);assert.equal(p.inventory.limitStone,1);assert.equal(awardCharacterXp(p,'tsukineko',100).amount,0);
});
test('unaffordable or invalid breakthroughs never spend an item',()=>{
 const p=fresh();p.characters.nyanluna.level=20;assert.equal(breakthrough(p,'nyanluna'),false);assert.equal(breakthrough(p,'__proto__'),false);assert.equal(p.inventory.limitStone,0);
});
test('saved progression survives normalization, keeps future character IDs and validates corrupt values',()=>{
 const raw=JSON.parse('{"characters":{"future_hero":{"level":7,"xp":9,"breaks":1},"nyanluna":{"level":-8,"xp":"999","breaks":-1},"tsukineko":{"level":999,"xp":-1,"breaks":99},"__proto__":{"level":42}},"inventory":{"limitStone":-9}}');
 const p=normalizeProgression(raw,HEROES);assert.deepEqual(p.characters.future_hero,{level:7,xp:9,breaks:1,tree:[]});assert.deepEqual(p.characters.nyanluna,{level:1,xp:0,breaks:0,tree:[]});assert.equal(p.characters.tsukineko.level,80);assert.equal(p.inventory.limitStone,0);assert.equal(Object.hasOwn(p.characters,'__proto__'),false);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);assert.deepEqual(normalizeProgression(null,HEROES),fresh());
});
test('each level consumes the defined XP once with no rounding or reload loss',()=>{
 const p=fresh();awardCharacterXp(p,'nyanluna',xpRequired(1)+xpRequired(2)+5);assert.deepEqual(p.characters.nyanluna,{level:3,xp:5,breaks:0,tree:[]});assert.deepEqual(normalizeProgression(p,HEROES),p);assert.equal(LEVEL_RULES.initialCap,20);
});
