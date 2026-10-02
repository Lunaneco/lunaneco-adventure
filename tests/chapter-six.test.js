import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {Adventure,HEROES,seededRandom} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {ACTS,CHAPTERS,actFor,isActUnlocked,completeAct,nextStoryAct,nextAct} from '../src/acts.js';
import {SIXTH_CHAPTER_SCENES,HEHE_ACT_IDS} from '../src/chapter-six.js';
import {storyScenesFor} from '../src/chapter.js';
import {GOLDEN_HEHE,HEHE_ENEMIES,HEHE_BOSSES,goldenHeheWave} from '../src/chapter-six-enemies.js';
import {GOLDEN_SLIME} from '../src/golden-slime.js';
import {enemyMaterials} from '../src/talents.js';
import {tickEnemyBehavior} from '../src/enemy-combat.js';
import {isHeroUnlocked} from '../src/recruitment.js';
import {fieldFor,contains} from '../src/terrain.js';
import {WEAPON_CATALOG,equipWeapon,weaponImage} from '../src/weapons.js';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';
import {dialogueVoiceId} from '../src/voice-catalog.js';
const profile=(cleared=24)=>normalizeProgression({story:{version:2,actClears:Array.from({length:32},(_,i)=>(i<20||i>=24)&&i<cleared)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}])),awakenings:{rice:true},tutorial:{firstBattleCompleted:true}},HEROES);
const quiet=(options={})=>{const g=new Adventure({act:24,hero:0,party:['nyanluna','prim'],seed:1,progression:profile(),...options});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.player.invincible=0;g.player.x=g.player.z=0;g.drainEvents();return g;};
const step=(g,t)=>{for(let i=0;i<Math.ceil(t*60);i++)g.tick(1/60);};
function finalGate(g){g.area=2;g.wave=6;g.pendingBlessings=0;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);return g.crossExit();}

test('chapter six preserves old quest IDs and saves; four acts recommend level 60, not a level gate',()=>{
 const old=profile();assert.equal(CHAPTERS[5].title,'へへへランド');assert.equal(nextAct(old),24);assert.equal(nextStoryAct(19),24);
 for(const id of HEHE_ACT_IDS){const a=actFor(id);assert.equal(a.chapter,5);assert.equal(a.recommendedLevel,60);assert.equal(a.soloHero,'omsolo');assert.ok(HEHE_BOSSES[a.bossId]);assert.equal(storyScenesFor(id),SIXTH_CHAPTER_SCENES[id-24]);}
 assert.deepEqual([20,21,22,23].map(id=>actFor(id).id),[20,21,22,23]);assert.equal(old.story.actClears.length,32);assert.deepEqual(old.story.actClears.slice(24,28),[false,false,false,false]);
 assert.equal(isActUnlocked(profile(19),24),false);old.characters.omsolo.level=20;assert.equal(isActUnlocked(old,24),true);assert.equal(isActUnlocked(old,25),false);assert.equal(isHeroUnlocked(old,'hehereal'),false);
 old.characters.omsolo.level=60;assert.deepEqual(normalizeProgression(old,HEROES),old);assert.equal(completeAct(old,27),false);assert.equal(old.story.chapterSixCleared,false);
});
test('food scene precedes ally combat; solo control is fixed only until the first clear without mutating selection',()=>{
 const p=profile(),before=structuredClone(p),party=['nyanluna','prim'],g=quiet({progression:p,party});assert.equal(g.player.hero,2);assert.deepEqual(g.party,['omsolo']);assert.equal(g.guestHeroId,null);
 assert.deepEqual(p,before);assert.deepEqual(party,['nyanluna','prim']);g.wave=2;g.phase='transition';g.advanceStage();assert.equal(g.wave,3);assert.equal(g.guestHeroId,'hehereal');assert.deepEqual(g.party,['omsolo','hehereal']);assert.equal(g.switchHero(),false);
 assert.equal(isHeroUnlocked(g.progression,'hehereal'),false);assert.ok(g.statsFor(6).attack>100);const beforeLevel=g.progression.characters.hehereal.level;g.statsFor(6);assert.equal(g.progression.characters.hehereal.level,beforeLevel);
 g.player.invincible=0;g.hurt(1e9,0,0);assert.equal(g.phase,'defeat');assert.equal(g.player.hero,2);assert.ok(g.healthFor(6).hp>0);assert.equal(isHeroUnlocked(g.progression,'hehereal'),false);
 for(const id of [25,26,27])assert.deepEqual(quiet({act:id,progression:profile(id)}).party,['omsolo','hehereal']);
 const replayPair=quiet({act:24,progression:profile(28)});assert.deepEqual(replayPair.party,['nyanluna','prim']);assert.equal(replayPair.guestHeroId,null);assert.equal(replayPair.switchHero(),true);
 const high=profile(28);high.characters.hehereal.level=70;high.characters.hehereal.breaks=5;const replay=quiet({act:25,progression:high});assert.equal(replay.statsFor(6).attack,combatStats(replay.progression,HEROES[6]).attack);
});
test('only the last chapter-six gate recruits; kills, earlier clears and forged flags never do',()=>{
 for(const id of HEHE_ACT_IDS){const g=quiet({act:id,progression:profile(id)});g.area=2;g.wave=6;g.hit(g.spawnEnemy('boss',0,7),1e9,0,0);assert.equal(isHeroUnlocked(g.progression,'hehereal'),false);assert.ok(finalGate(g));assert.equal(g.recruitedHeroId,id===27?'hehereal':null);assert.equal(isHeroUnlocked(g.progression,'hehereal'),id===27);assert.equal(completeAct(g.progression,id),false);assert.deepEqual(normalizeProgression(g.progression,HEROES),g.progression);}
 const forged=normalizeProgression({story:{version:2,chapterSixCleared:true,heherealUnlocked:true,actClears:Array(20).fill(true)}},HEROES);assert.equal(isHeroUnlocked(forged,'hehereal'),false);
 const free=quiet({act:0,progression:profile(28),hero:6,party:['hehereal','nyanluna']});assert.equal(free.player.hero,6);assert.ok(free.switchHero());
});
test('magic arrows steer to moving targets, reacquire a defeated target and credit their owner after switching',()=>{
 const g=quiet({act:0,progression:profile(28),hero:6,party:['hehereal','nyanluna']}),e=g.spawnEnemy('moss',0,8);Object.assign(e,{hp:1e6,maxHp:1e6,speed:0,special:999,attack:999});assert.ok(g.attackFrom(g.player,6));const b=g.projectiles[0];assert.equal(b.kind,'magicArrow');assert.equal(b.heroId,'hehereal');e.x=4;g.tick(.01);assert.ok(b.vx>0);
 const other=g.spawnEnemy('moss',-3,7);Object.assign(other,{hp:1,maxHp:1,speed:0,special:999,attack:999});e.hp=0;g.tick(.01);assert.equal(b.target,other.id);assert.ok(b.vx<0);g.switchHero();step(g,.7);assert.equal(other.hp<=0,true);assert.equal(g.earnedXp.hehereal,3);assert.equal(g.earnedXp.nyanluna,1.5);
});
test('flower-bow ultimate shoots nine homing arrows after a switch and uses its own damage',()=>{
 const g=quiet({act:0,progression:profile(28),hero:6,party:['hehereal','nyanluna']});g.player.charge=100;assert.ok(g.ultimate());assert.equal(g.ultimateEffects[0].kind,'homingBarrage');g.switchHero();step(g,1.4);const events=g.drainEvents().filter(e=>e.type==='ultimateShot');assert.equal(events.length,9);assert.ok(events.every(e=>e.heroId==='hehereal'));assert.equal(g.ultimateEffects.length,0);
});
test('each act rolls once at 20%, uses a separate RNG, and spawns at most one golden Hehehe',()=>{
 for(const [roll,expected] of [[0,1],[.199999,1],[.2,null],[.99,null]]){let calls=0;assert.equal(goldenHeheWave(actFor(24),()=>++calls===1?roll:0),expected);assert.equal(calls,expected?2:1);}
 assert.equal(goldenHeheWave(actFor(0),()=>{throw Error('wrong chapter rolled');}),null);
 let count=0;for(let seed=0;seed<2000;seed++){const g=quiet({seed});if(g.goldenHeheWave)count++;assert.equal(g.rng(),seededRandom(seed)());}assert.ok(count>330&&count<470,`${count}/2000`);
 const g=quiet();g.goldenHeheWave=1;assert.ok(g.spawnGoldenHehe());assert.equal(g.spawnGoldenHehe(),null);g.wave=2;assert.equal(g.spawnGoldenHehe(),null);
});
test('golden rewards are exactly twice slime materials plus abundant rarity-3 materials and persist once',()=>{
 const g=quiet();g.goldenHeheWave=1;const e=g.spawnGoldenHehe();g.hit(e,1e9,0,0);for(const [id,n] of Object.entries(GOLDEN_SLIME.materials))assert.equal(g.earnedMaterials[id],n*2);assert.equal(g.earnedMaterials.bloodCrystal,40);assert.equal(g.earnedMaterials.demonHeart,20);assert.equal(g.goldenHeheKills,1);const saved=structuredClone(g.progression);g.hit(e,1e9,0,0);assert.deepEqual(g.progression,saved);assert.deepEqual(normalizeProgression(saved,HEROES),saved);
 const escaped=quiet();escaped.goldenHeheWave=1;const rare=escaped.spawnGoldenHehe();escaped.time=rare.expiresAt;assert.equal(escaped.hit(rare,1e9,0,0),0);assert.equal(escaped.goldenHehe.status,'escaped');assert.equal(escaped.goldenHeheKills,0);assert.equal(Object.values(escaped.earnedMaterials).reduce((a,b)=>a+b,0),0);
 const paused=quiet();paused.goldenHeheWave=1;paused.spawnGoldenHehe();paused.pause();step(paused,25);assert.equal(paused.time,0);assert.equal(paused.goldenHehe.status,'active');
 assert.deepEqual(enemyMaterials({type:GOLDEN_HEHE.type},24,'hard',()=>{throw Error('rare drop rolled');}),GOLDEN_HEHE.materials);
});
test('five bald enemy classes and four bosses have readable attacks; boss bodies stay ungrabbable but their arrows can be thrown',()=>{
 assert.equal(Object.keys(HEHE_ENEMIES).length,5);for(const type of Object.keys(HEHE_ENEMIES)){const g=quiet(),e=g.spawnEnemy(type,0,-3);e.special=0;tickEnemyBehavior(g,e,.01);assert.ok(e.cast||e.rush,type);assert.ok(g.hazards.every(h=>h.total>=.65));}
 const g=quiet(),boss=g.spawnEnemy('boss',0,6);assert.equal(g.grabRice('enemy',boss.id),false);boss.special=0;boss.action=1;tickEnemyBehavior(g,boss,.01);tickEnemyBehavior(g,boss,boss.cast.remaining+.01);assert.ok(g.projectiles.length);const b=g.projectiles[0];assert.equal(g.grabRice('bullet',b.id),true);g.cancelRice();assert.equal(g.rice.held,null);
});
test('chapter-six terrain, generated art, voices, starter bow and all ten weapon ranks are available',()=>{
 for(const id of HEHE_ACT_IDS)for(let area=0;area<3;area++)for(const room of fieldFor(id,area).rooms){assert.ok(contains(room,room.entrance.x,room.entrance.z));assert.ok(contains(room,room.exit.x,room.exit.z));assert.ok(room.hehe);}
 const p=profile(28),bows=WEAPON_CATALOG.filter(w=>w.heroId==='hehereal');assert.equal(bows.length,10);p.weapons.owned.push(...bows.map(w=>w.id));for(const b of bows){assert.ok(equipWeapon(p,'hehereal',b.id));assert.ok(existsSync('public'+weaponImage(b)));}
 const text=SIXTH_CHAPTER_SCENES.flatMap(a=>Object.values(a).flatMap(s=>s.lines));assert.ok(text.some(l=>l.who==='omsolo'&&l.text.includes('顔のおむすび')));for(const l of text.filter(l=>l.voiced)){const v=VOICE_MANIFEST[dialogueVoiceId(l.who,l.text)];assert.equal(v.who,'hehereal');assert.ok(existsSync('public/'+v.file));}
 for(const file of ['story/hehereal-story-v1.png','portraits/hehereal-face-v1.png','equipment/hehereal-bow-v1.png'])assert.ok(readFileSync('public/assets/'+file).length>10000);
 assert.ok(combatStats(p,HEROES[6]).attack>100);assert.equal(ACTS.filter(a=>a.chapter===5).length,4);
});
