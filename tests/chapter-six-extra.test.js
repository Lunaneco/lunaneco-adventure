import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {ACTS,PLAYABLE_ACTS,actFor,isActUnlocked,isActCleared,clearTicketReward,normalizeStory} from '../src/acts.js';
import {normalizeProgression} from '../src/progression.js';
import {HEHE_EXTRA_ID,HEHE_EXTRA_COMBAT,extraCombatFor,extraCombatHint} from '../src/extra-stages.js';
import {goldenHeheWave,GOLDEN_HEHE} from '../src/chapter-six-enemies.js';
import {tickEnemyBehavior} from '../src/enemy-combat.js';
import {enemyRosterForAct,distanceToHazard} from '../src/enemies.js';
import {fieldFor,contains,layoutFor} from '../src/terrain.js';
import {missionsForAct} from '../src/missions.js';
import {stageSelectionView,stageBriefingView} from '../src/stage-selection-ui.js';
import {extraStageSelector,extraDifficultyView} from '../src/extra-stage-ui.js';
import {maxedHeheProfile} from './chapter-six-extra-fixtures.js';
import {trialInput} from './country-bot.js';
import {chooseOffer} from './bot.js';

const act=actFor(HEHE_EXTRA_ID);
const game=(options={})=>new Adventure({act:HEHE_EXTRA_ID,progression:maxedHeheProfile(),seed:7,party:['mochinyafe','lumi'],hero:3,...options});
const gate=(g,area)=>{g.phase='playing';g.wave=area*2+2;g.area=area;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.ok(g.crossExit());};

test('Hehe EX has a new stable ID, requires chapter-six final clear, and does not require chapter seven',()=>{
 assert.equal(HEHE_EXTRA_ID,33);assert.equal(new Set(PLAYABLE_ACTS.map(a=>a.id)).size,PLAYABLE_ACTS.length);assert.equal(act.chapter,5);assert.equal(act.recommendedLevel,80);
 assert.equal(isActUnlocked(maxedHeheProfile(27),33),false);assert.equal(isActUnlocked(maxedHeheProfile(28),33),true);assert.equal(new Adventure({act:33,progression:maxedHeheProfile(27)}).act,0);
 assert.equal(game({progression:maxedHeheProfile(28),difficulty:'normal'}).difficulty,'hard');assert.equal(ACTS.length,28);assert.equal(missionsForAct(33).length,0);
});
test('new chapter-indexed EX saves preserve old clears and skip non-story ID gaps',()=>{
 const raw={version:2,actClears:Array(28).fill(true),extraClears:[true,false,true,false,false,true]};
 const story=normalizeStory(raw);assert.deepEqual(story.extraClears,[true,false,true,false,false,true]);
 raw.actClears[27]=false;assert.deepEqual(normalizeStory(raw).extraClears,[true,false,true,false,false,false]);
 assert.deepEqual(normalizeStory({version:2,actClears:Array(12).fill(true),extraClears:[true,false]}).extraClears,[true,false,false,false,false,false]);
});
test('free solo and duo lineups never receive a story NPC or a level floor in Hehe EX',()=>{
 for(const party of [['nyanluna'],['hehereal'],['omsolo','hehereal'],['mochinyafe','lumi']]){
  const g=game({party,hero:HEROES.findIndex(h=>h.id===party[0])});assert.deepEqual(g.party,party);g.wave=2;g.startWave();assert.deepEqual(g.party,party);assert.equal(g.guestHeroId,null);
 }
});
test('WAVE 3 schedules exactly one golden Hehe without a chance roll, in every new run',()=>{
 assert.equal(goldenHeheWave(act,()=>{throw Error('must not roll');}),3);
 for(const seed of [0,1,7,60,99,1000]){
  const g=game({seed});assert.equal(g.goldenHeheWave,3);assert.equal(g.spawnGoldenHehe(),null);g.wave=2;g.startWave();for(let i=0;i<3;i++)g.spawn();
  const rares=g.enemies.filter(e=>e.type===GOLDEN_HEHE.type);assert.equal(rares.length,1);assert.equal(g.waveSpawned,3);assert.equal(g.spawnGoldenHehe(),null);
  assert.equal(rares[0].maxHp,GOLDEN_HEHE.hp*1.28*1.3);g.hit(rares[0],1e9,0,0);assert.equal(g.goldenHeheKills,1);assert.equal(g.earnedMaterials.bloodCrystal,40);assert.equal(g.earnedMaterials.demonHeart,20);assert.equal(g.earnedWeaponTickets,10);
  g.wave=4;g.startWave();assert.equal(g.spawnGoldenHehe(),null);g.wave=3;assert.equal(g.spawnGoldenHehe(),null);
 }
 const g=game();g.wave=3;const e=g.spawnGoldenHehe();g.time=e.expiresAt+.01;assert.ok(g.expireGoldenSlime(e));assert.equal(g.spawnGoldenHehe(),null);assert.equal(g.goldenHeheKills,0);
});
test('EX unlock/card/briefing describe Lv.80, free parties, dodge pressure and the guaranteed rare wave',()=>{
 const locked=normalizeProgression({},HEROES);assert.match(stageSelectionView(0,locked),/第2章クリアで解放/);assert.match(extraStageSelector(0,20,locked),/第2章・第4幕/);
 assert.match(stageSelectionView(5,maxedHeheProfile(27)),/data-act="33"[^>]*disabled/);assert.match(stageSelectionView(5,maxedHeheProfile(27)),/第6章クリアで解放/);
 const p=maxedHeheProfile(),brief=stageBriefingView(33,'normal',p);for(const text of ['フルカンスト','Lv.80','NPCなし','WAVE 3','1体確定'])assert.ok(brief.includes(text),text);
 assert.doesNotMatch(brief,/オムソロ操作固定|初回クリアまでのソロ|各幕で一度だけ20%|data-difficulty=/);
 assert.match(extraStageSelector(5,33,p),/Lv.80/);assert.match(extraStageSelector(5,33,maxedHeheProfile(27)),/第6章・第4幕/);assert.match(extraDifficultyView(act),/Lv.80/);assert.match(extraCombatHint(act),/260体/);
});
test('Hehe EX uses only the Hehe roster and connected, unique Hehe-themed room entrances/exits',()=>{
 assert.deepEqual(enemyRosterForAct(33),enemyRosterForAct(24));const ids=new Set();
 for(let area=0;area<3;area++)for(const room of fieldFor(33,area).rooms){assert.equal(room.hehe,true);assert.equal(ids.has(room.id),false);ids.add(room.id);assert.ok(contains(room,room.entrance.x,room.entrance.z));assert.ok(contains(room,room.exit.x,room.exit.z));}
 assert.equal(ids.size,4);for(let wave=1;wave<=6;wave++)assert.match(layoutFor(33,Math.floor((wave-1)/2),wave).id,/extra-hehe/);
});
test('EX damage, speed and cadence increase while all boss attacks retain warnings and an escape route',()=>{
 assert.deepEqual(extraCombatFor(act),HEHE_EXTRA_COMBAT);
 const g=game();g.enemies=[];const e=g.spawnEnemy('heheArcher',0,-8);e.special=5;tickEnemyBehavior(g,e,.1);assert.ok(Math.abs(e.special-4.785)<1e-7);e.special=0;tickEnemyBehavior(g,e,.01);assert.equal(e.cast.total,1.05*.78);assert.equal(g.hazards[0].total,e.cast.total);tickEnemyBehavior(g,e,e.cast.total+.01);assert.equal(g.projectiles.length,3);assert.equal(g.projectiles[0].speed,18);
 for(const action of [0,1,2]){
  const q=game();q.enemies=[];q.hazards=[];q.projectiles=[];q.player.x=q.player.z=0;const boss=q.spawnEnemy('boss',0,-8);boss.action=action;boss.special=0;tickEnemyBehavior(q,boss,1/60);
  assert.ok(boss.enraged);assert.ok(boss.maxHp>200000);assert.ok(q.hazards.length>0);assert.ok(q.hazards.every(h=>h.total>=.6));
  for(const timer of new Set(q.hazards.map(h=>h.timer))){const warnings=q.hazards.filter(h=>h.timer===timer),escapes=Array.from({length:1089},(_,i)=>({x:(i%33-16)/4,z:(Math.floor(i/33)-16)/4})).filter(p=>Math.hypot(p.x,p.z)<=4&&contains(q.walkLayout,p.x,p.z,.7)&&warnings.every(h=>distanceToHazard(p.x,p.z,h)>.8));assert.ok(escapes.length>0,`action ${action} at ${timer} needs a reachable safe gap`);}
  if(action===1){assert.equal(boss.cast.waves,3);assert.equal(boss.cast.turn,.12);assert.equal(boss.cast.origin.x,boss.x);}
 }
});
test('first/repeat clear awards remain separate and survive reload without changing story/mission/party',()=>{
 let p=maxedHeheProfile();p.story.extraClears[0]=true;
 for(const reward of [10,2]){
  const g=game({progression:p}),before=structuredClone(g.progression),party=[...g.party];gate(g,0);gate(g,1);assert.equal(g.clearRewardTickets,0);gate(g,2);
  assert.equal(g.clearRewardTickets,reward);assert.ok(isActCleared(g.progression,33));assert.deepEqual(g.party,party);assert.deepEqual(g.progression.story.actClears,before.story.actClears);assert.deepEqual(g.progression.missions,before.missions);assert.equal(g.progression.story.extraClears[0],true);
  p=normalizeProgression(JSON.parse(JSON.stringify(g.progression)),HEROES);assert.ok(isActCleared(p,33));assert.equal(clearTicketReward(p,33),2);
 }
});
test('full maxed parties fail early when stationary, while a dodge pilot can clear all six waves with ordinary rules',()=>{
 for(const party of [['nyanluna','mochinyafe'],['mochinyafe','lumi']]){
  const g=game({party,hero:HEROES.findIndex(h=>h.id===party[0])});for(let i=0;i<60*45&&g.phase!=='defeat';i++){if(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.player.charge>=100)g.ultimate();g.tick(1/60);g.drainEvents();}assert.equal(g.phase,'defeat');assert.equal(g.wave,1);
 }
 const g=game(),rooms=new Set(),waves=new Set();let frames=0;
 while(!['victory','defeat'].includes(g.phase)&&frames++<60*600){if(g.phase==='upgrade'){g.chooseSkill(chooseOffer(g));continue;}if(g.phase==='transition'){g.advanceStage();continue;}rooms.add(g.layout.id);waves.add(g.wave);g.tick(1/60,trialInput(g));g.drainEvents();}
 console.log('HEHE_EX_DODGE_TRIAL',JSON.stringify({phase:g.phase,seconds:Math.round(g.time),hits:g.runHits,rare:g.goldenHehe,waves:[...waves]}));assert.equal(g.phase,'victory');assert.equal(rooms.size,4);assert.equal(waves.size,6);assert.equal(g.clearRewardTickets,10);assert.ok(g.goldenHehe);assert.equal(g.guestHeroId,null);
});
