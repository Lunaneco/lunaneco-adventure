import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {ACTS,CHAPTERS,actFor,completeAct,nextStoryAct,isActUnlocked} from '../src/acts.js';
import {LUMI_ACT_IDS,SEVENTH_CHAPTER_SCENES,SEVENTH_CHAPTER_STORY_BACKGROUND} from '../src/chapter-seven.js';
import {hasNekoLumi} from '../src/lumi-combat.js';
import {ANTI_KEMO_ENEMIES,ANTI_KEMO_BOSSES} from '../src/chapter-seven-enemies.js';
import {enemyRosterForAct} from '../src/enemies.js';
import {tickEnemyBehavior} from '../src/enemy-combat.js';
import {requiredPartyMember} from '../src/party.js';
import {isHeroUnlocked} from '../src/recruitment.js';
import {fieldFor,contains} from '../src/terrain.js';
import {floorPatchesFor} from '../src/special-floors.js';
import {WEAPON_CATALOG,equipWeapon,weaponImage} from '../src/weapons.js';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';
import {dialogueVoiceId,LUMI_NEKO_ULTIMATE_LINE} from '../src/voice-catalog.js';
import {battleVoiceLines} from '../src/hehe-form-voice.js';
import {stageBriefingView} from '../src/stage-selection-ui.js';
import {botInput,chooseOffer} from './bot.js';
const profile=(cleared=32)=>normalizeProgression({story:{version:2,actClears:Array.from({length:32},(_,i)=>(i<20||i>=24)&&i<cleared)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}},HEROES);
const quiet=(options={})=>{const g=new Adventure({act:0,seed:17,progression:profile(),hero:7,party:['lumi'],...options});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.rng=()=>1;g.drainEvents();return g;};
const finish=g=>{g.wave=6;g.area=2;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.ok(g.crossExit());};
const target=(g,x,z)=>{const e=g.spawnEnemy('moss',x,z);Object.assign(e,{hp:1e6,maxHp:1e6,speed:0,special:999,attack:999});return e;};

test('every chapter-seven dialogue uses the character-free village background, not the Lumi cast illustration',()=>{
 assert.equal(SEVENTH_CHAPTER_STORY_BACKGROUND,'assets/story/kemo-village-background-v2.png');
 assert.ok(readFileSync('public/'+SEVENTH_CHAPTER_STORY_BACKGROUND).length>10000);
 const scenes=SEVENTH_CHAPTER_SCENES.flatMap(act=>Object.values(act));assert.equal(scenes.length,16);
 for(const scene of scenes)assert.equal(scene.image,SEVENTH_CHAPTER_STORY_BACKGROUND,scene.title);
 assert.ok(existsSync('public/assets/story/lumi-village-story-v1.png'),'original cast art is retained');
});

test('chapter seven preserves all previous IDs and saves, unlocks sequentially, and recruits only at the last gate',()=>{
 const p=profile(28);assert.equal(p.story.actClears.length,32);assert.deepEqual(p.story.actClears.slice(28),[false,false,false,false]);assert.equal(nextStoryAct(27),28);assert.ok(isActUnlocked(p,28));assert.ok(!isHeroUnlocked(p,'lumi'));assert.equal(CHAPTERS[6].start,28);assert.equal(ACTS.length,28);
 for(const id of [20,21,22,23,24,25,26,27])assert.equal(actFor(id).id,id);
 const forged=normalizeProgression({story:{version:2,actClears:[],lumiUnlocked:true,chapterSevenCleared:true}},HEROES);assert.ok(!isHeroUnlocked(forged,'lumi'));
 for(const id of LUMI_ACT_IDS){const g=quiet({act:id,progression:profile(id)});assert.equal(g.player.hero,3);assert.equal(actFor(id).recommendedLevel,60);assert.ok(ANTI_KEMO_BOSSES[g.actConfig.bossId]);g.hit(g.spawnEnemy('boss',0,-5),1e9,0,0);assert.ok(!isHeroUnlocked(g.progression,'lumi'));finish(g);assert.equal(g.recruitedHeroId,id===31?'lumi':null);assert.equal(isHeroUnlocked(g.progression,'lumi'),id===31);assert.equal(completeAct(g.progression,id),false);assert.deepEqual(normalizeProgression(g.progression,HEROES),g.progression);}
});
for(const act of LUMI_ACT_IDS)test(`act ${act}: first clear is Mochi control, replays keep a free duo without NPC or saved-party mutations`,()=>{
 const p=profile(act),before=structuredClone(p),chosen=['tsukineko','prim'],g=quiet({act,progression:p,party:chosen,hero:5});assert.equal(requiredPartyMember(p,act),'mochinyafe');assert.equal(g.player.hero,3);assert.deepEqual(g.party,act===28?['mochinyafe']:['mochinyafe','lumi']);assert.deepEqual(p,before);assert.deepEqual(chosen,['tsukineko','prim']);
 if(act===28){g.wave=2;g.phase='transition';g.advanceStage();assert.equal(g.guestHeroId,'lumi');}
 assert.ok(hasNekoLumi(g.party));assert.equal(g.switchHero(),false);assert.equal(g.attackProfile(7).range,Infinity);g.player.invincible=0;g.hurt(1e9,0,0);assert.equal(g.phase,'defeat');
 const retry=quiet({act,progression:p,party:chosen});finish(retry);const replay=quiet({act,progression:retry.progression,party:chosen,hero:5});assert.deepEqual(replay.party,chosen);assert.equal(replay.guestHeroId,null);assert.ok(replay.switchHero());for(let i=1;i<6;i++)replay.startWave();assert.deepEqual(replay.party,chosen);assert.equal(replay.meetLumi(),false);
 assert.match(stageBriefingView(act,'normal',p),/もちにゃふぇ操作固定/);assert.match(stageBriefingView(act,'normal',retry.progression),/2人編成ではNPCるみを追加しません/);
});
test('NPC stat floor never overwrites recruited levels or creates a duplicate Lumi',()=>{
 const p=profile();p.characters.lumi.level=1;p.characters.lumi.breaks=0;const base=combatStats(p,HEROES[7]);
 const guest=quiet({act:29,progression:p,party:['nyanluna'],hero:0});assert.equal(guest.guestHeroId,'lumi');assert.ok(guest.statsFor(7).attack>base.attack);assert.equal(guest.progressFor(7).level,1);
 const self=quiet({act:29,progression:p,party:['lumi']});assert.deepEqual(self.party,['lumi']);assert.equal(self.guestHeroId,null);assert.deepEqual(self.statsFor(7),base);assert.equal(self.meetLumi(),false);
});
test('finite railgun cannot hit at 200 units; Neko main and support reach actual distant targets with finite VFX',()=>{
 const normal=quiet(),e=target(normal,0,-200);assert.equal(normal.attackProfile(7).range,14);assert.equal(normal.attackFrom(normal.player,7),false);assert.equal(e.hp,1e6);
 for(const hero of [3,7]){const g=quiet({party:['lumi','mochinyafe'],hero}),source=hero===7?g.player:g.partner,e=target(g,source.x,source.z-200);assert.equal(g.attackProfile(7).range,Infinity);assert.ok(g.attackFrom(source,7,hero===3));assert.ok(e.hp<1e6);const fx=g.drainEvents().find(e=>e.type==='lumiRail');assert.ok(Number.isFinite(fx.range)&&fx.range>=200);assert.equal(g.earnedXp.lumi,0);}
 const unrelated=quiet({party:['lumi','tsukineko']});assert.equal(unrelated.attackProfile(7).range,14);assert.equal(hasNekoLumi(['mochinyafe']),false);
});
test('normal finite and Neko infinite ultimate each fire seven penetrating rays, keep owner after switch, and never refill charge',()=>{
 for(const pair of [false,true]){const g=quiet({party:['lumi',pair?'mochinyafe':'nyanluna']}),far=target(g,0,-200),near=target(g,0,-6),behind=target(g,0,-8);assert.equal(g.ultimateSpec().range,pair?Infinity:20);assert.equal(g.ultimateSpec().id,pair?'nekolumi-infinite-rail':'lumi-railgun');assert.equal(battleVoiceLines('lumi','ultimate',g)[0].id,pair?LUMI_NEKO_ULTIMATE_LINE.id:'lumi-ultimate-1');g.player.charge=100;assert.ok(g.ultimate());assert.ok(g.switchHero());for(let i=0;i<90;i++)g.tick(1/60);assert.ok(near.hp<1e6&&behind.hp<1e6);assert.equal(far.hp<1e6,pair);assert.equal(g.chargeFor(7),0);const shots=g.drainEvents().filter(e=>e.type==='ultimateShot');assert.equal(shots.length,7);assert.ok(shots.every(e=>e.heroId==='lumi'));assert.equal(g.ultimateEffects.length,0);}
});
test('anti-kemomimi enemies and bosses cast safely, all village stairs/gates and special floors are reachable',()=>{
 assert.equal(Object.keys(ANTI_KEMO_ENEMIES).length,5);
 for(const act of LUMI_ACT_IDS){assert.deepEqual(enemyRosterForAct(act),Object.keys(ANTI_KEMO_ENEMIES));for(let area=0;area<3;area++)for(const room of fieldFor(act,area).rooms){assert.equal(room.chapter,6);assert.ok(room.kemoVillage);assert.ok(contains(room,room.entrance.x,room.entrance.z));assert.ok(contains(room,room.exit.x,room.exit.z));assert.ok(floorPatchesFor(room).length);}
  for(let action=0;action<3;action++){const g=quiet({act,party:['nyanluna','lumi'],hero:0}),e=g.spawnEnemy('boss',0,-4);e.special=0;e.action=action;tickEnemyBehavior(g,e,.01);assert.ok(e.cast);assert.ok(g.hazards.every(h=>Number.isFinite(h.damage)&&Number.isFinite(h.timer)));}
 }
 for(const type of Object.keys(ANTI_KEMO_ENEMIES)){const g=quiet({act:29,hero:0,party:['nyanluna','lumi']}),e=g.spawnEnemy(type,0,0);e.special=0;tickEnemyBehavior(g,e,.01);assert.ok(e.cast,type);}
});
test('all railgun colors/ranks, generated normal/Neko art and exact voiced story text are available',()=>{
 const p=profile(),weapons=WEAPON_CATALOG.filter(w=>w.heroId==='lumi');assert.equal(weapons.length,10);p.weapons.owned.push(...weapons.map(w=>w.id));for(const w of weapons){assert.ok(equipWeapon(p,'lumi',w.id));assert.ok(existsSync('public'+weaponImage(w)));}
 const colors=new Set(weapons.map(w=>w.weapon.effectColor));assert.equal(colors.size,3);
 for(const file of ['models/lumi.glb','portraits/lumi-face-v1.png','portraits/nekolumi-face-v1.png','story/lumi-story-v1.png','story/nekolumi-story-v1.png','story/lumi-village-story-v1.png','ultimates/lumi-railgun-v1.png','ultimates/nekolumi-infinite-rail-v1.png'])assert.ok(readFileSync('public/assets/'+file).length>10000);
 const lines=SEVENTH_CHAPTER_SCENES.flatMap(a=>Object.values(a).flatMap(s=>s.lines));assert.ok(lines.some(l=>l.text.includes('アンチケモみみ集団')));for(const l of lines.filter(l=>l.voiced)){const v=VOICE_MANIFEST[dialogueVoiceId(l.who,l.text)];assert.ok(v,l.text);assert.equal(v.who,l.who);assert.ok(existsSync('public/'+v.file));}assert.ok(VOICE_MANIFEST[LUMI_NEKO_ULTIMATE_LINE.id]);
});
for(const difficulty of ['normal','hard'])test(`all four first-clear solo stories are beatable at level 60 (${difficulty})`,()=>{
 const results=[];for(const act of LUMI_ACT_IDS){const g=new Adventure({act,difficulty,progression:profile(act),party:['nyanluna','prim'],seed:1});for(let i=0;i<60*550;i++){while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;g.tick(1/60,botInput(g));g.drainEvents();}results.push({act,phase:g.phase,time:Math.round(g.time),hits:g.runHits});assert.equal(g.phase,'victory',JSON.stringify(results));}console.log('CHAPTER_SEVEN_TRIAL',JSON.stringify(results));
});
