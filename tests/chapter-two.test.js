import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {Adventure,HEROES} from '../src/model.js';
import {ACTS,CHAPTERS,actLabel,completeAct,nextAct} from '../src/acts.js';
import {ACT_SCENES} from '../src/chapter.js';
import {STORY_CAST} from '../src/story-cast.js';
import {BOSSES,BOSS_IDS} from '../src/enemies.js';
import {FIELD_LAYOUTS} from '../src/terrain.js';
import {normalizeProgression,combatStats,unlockTalent} from '../src/progression.js';
import {isHeroUnlocked} from '../src/recruitment.js';
import {STAGE_MISSIONS} from '../src/missions.js';
import {UNIQUE_EQUIPMENT,equipmentImage,equipUnique} from '../src/equipment.js';
import {skillsForParty} from '../src/blessings.js';
import {ultimateFor} from '../src/abilities.js';
import {botInput,chooseOffer} from './bot.js';
import {trialInput} from './country-bot.js';
import {prepareWithEarnedRewards,levelThirtyProfile} from './chapter-two-fixtures.js';
const story=n=>({version:2,actClears:ACTS.map((_,i)=>i<n),tsukinekoUnlocked:n>=4});
const profile=n=>normalizeProgression({story:story(n)},HEROES);
function rescue(){const g=new Adventure({act:7,progression:profile(7),seed:1});g.wave=5;g.enemies=[];g.startWave();g.player.attack=g.partner.attack=999;g.drainEvents();return g;}
function gate(g){g.phase='playing';g.exitDelay=0;Object.assign(g.player,g.exitPoint);assert.equal(g.crossExit(),true);}
function quiet(g){g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=999;g.player.x=g.player.z=0;return g;}
test('chapter one saves keep every value and unlock only the second chapter, never Omsolo',()=>{
 const raw={story:story(4),characters:{nyanluna:{level:18,xp:37,tree:['origin']},tsukineko:{level:4,xp:3}},inventory:{limitStone:2,starBud:97,moonDew:8,wardenCore:3},equipment:{owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}},missions:{version:2,claimed:['meadow-hunt'],stages:[{kills:24}]}};
 const p=normalizeProgression(raw,HEROES);assert.deepEqual(p.characters.nyanluna,{...raw.characters.nyanluna,breaks:0});assert.deepEqual(p.inventory,{bloodCrystal:0,demonHeart:0,...raw.inventory,moonPrism:0,astralCore:0,weaponTicket:0});assert.deepEqual(p.equipment,raw.equipment);assert.equal(p.missions.stages[0].kills,24);assert.ok(p.missions.claimed.includes('meadow-hunt'));assert.equal(nextAct(p),4);assert.ok(isHeroUnlocked(p,'tsukineko'));assert.equal(isHeroUnlocked(p,'omsolo'),false);assert.deepEqual(p.characters.omsolo,{level:1,xp:0,breaks:0,tree:[]});assert.deepEqual(normalizeProgression(p,HEROES),p);
 const corrupt=normalizeProgression({story:{...story(3),actClears:[true,true,true,false,true,true,true,true],omsoloUnlocked:true}},HEROES);assert.equal(isHeroUnlocked(corrupt,'omsolo'),false);assert.equal(corrupt.story.chapterTwoCleared,false);
});
test('twenty sequential acts have matching story, terrains, distinct bosses and illustrated equipment',()=>{
 assert.equal(CHAPTERS.length,5);assert.equal(ACTS.length,20);assert.equal(ACT_SCENES.length,20);assert.deepEqual(ACTS.map(a=>a.bossId),BOSS_IDS);assert.equal(new Set(FIELD_LAYOUTS.flat().flatMap(f=>f.rooms).map(r=>r.id)).size,100);
 for(const act of ACTS){assert.equal(actLabel(act.id),`第${act.chapter+1}章・第${act.number}幕`);assert.ok(BOSSES[act.bossId]);for(const scene of Object.values(ACT_SCENES[act.id]))for(const line of scene.lines)assert.ok(STORY_CAST[line.who],line.who);}
 for(const id of ['komusubi','omsolo','omsolo_hurt'])assert.ok(existsSync('public'+STORY_CAST[id].image));
 for(const item of UNIQUE_EQUIPMENT.filter(e=>e.act>=4)){assert.ok(existsSync('public'+equipmentImage(item.id)));const m=STAGE_MISSIONS.find(m=>m.equipment===item.id);assert.equal(m.act,item.act);assert.ok(m.trial);}
 assert.ok(ACT_SCENES[4].opening.lines.some(l=>l.who==='komusubi'&&l.text.includes('お父さん')));assert.ok(ACT_SCENES[7].guardian.lines.some(l=>l.text.includes('180秒')));
});
test('the injured father is a rescue NPC, cannot be deployed or switched to before rescue',()=>{
 const g=rescue();assert.equal(g.rescue.remaining,180);assert.equal(g.rescue.active,true);assert.deepEqual(g.party,['nyanluna','tsukineko']);assert.equal(g.enemies.filter(e=>e.type==='boss').length,1);assert.ok(g.switchHero());assert.equal(g.player.hero,1);assert.equal(g.partyHeroes.includes(2),false);assert.deepEqual(new Adventure({progression:profile(7),party:['omsolo'],hero:2}).party,['nyanluna','tsukineko']);
});
test('rescue clock freezes in pause and blessing menus; expiration loses without recruitment or clear',()=>{
 const g=rescue();g.pause();g.tick(.05);assert.equal(g.rescue.remaining,180);g.resume();g.addCrystals(8);g.tick(1/60);assert.equal(g.phase,'upgrade');const t=g.rescue.remaining;for(let i=0;i<100;i++)g.tick(.05);assert.equal(g.rescue.remaining,t);g.chooseSkill(g.offers[0].id);g.rescue.remaining=.01;g.tick(.05);assert.equal(g.phase,'defeat');assert.equal(isHeroUnlocked(g.progression,'omsolo'),false);assert.equal(g.progression.story.actClears[7],false);assert.equal(g.earnedMissions.length,0);assert.equal(g.drainEvents().find(e=>e.type==='defeat').reason,'rescueTimeout');
});
test('boss defeat stops the clock; only crossing the final gate recruits once and persists',()=>{
 const g=rescue(),boss=g.enemies[0];g.hit(boss,99999,0,0,false,false,'tsukineko');assert.equal(g.rescue.saved,true);assert.equal(g.rescue.active,false);assert.equal(isHeroUnlocked(g.progression,'omsolo'),false);g.openExit();gate(g);assert.equal(g.phase,'victory');assert.equal(g.recruitedHeroId,'omsolo');assert.equal(isHeroUnlocked(g.progression,'omsolo'),true);assert.equal(g.drainEvents().filter(e=>e.type==='recruited').length,1);assert.equal(completeAct(g.progression,7),false);assert.equal(g.crossExit(),false);assert.equal(normalizeProgression(g.progression,HEROES).story.chapterTwoCleared,true);
});
test('Omsolo light blade hits a near forward arc, never a distant enemy or enemies behind him; XP is his',()=>{
 const g=quiet(new Adventure({progression:profile(8),party:['omsolo'],hero:2}));g.rng=()=>.99;
 const front=g.spawnEnemy('moss',0,2),side=g.spawnEnemy('moss',1.5,2),back=g.spawnEnemy('moss',0,-3),far=g.spawnEnemy('moss',0,9);g.drainEvents();assert.ok(g.attackFrom(g.player,2));assert.ok(front.hp<=0&&side.hp<=0);assert.equal(back.hp,back.maxHp);assert.equal(far.hp,far.maxHp);assert.equal(g.projectiles.length,0);assert.equal(g.earnedXp.omsolo,6);assert.equal(g.earnedXp.nyanluna,0);assert.equal(g.earnedXp.tsukineko,0);assert.ok(g.drainEvents().some(e=>e.type==='attack'&&e.hero===2));
});
test('six allowed compositions keep a two-character limit and their own eligible three-choice pools',()=>{
 const compositions=[['nyanluna'],['tsukineko'],['omsolo'],['nyanluna','tsukineko'],['nyanluna','omsolo'],['tsukineko','omsolo']];
 for(const party of compositions)for(let seed=1;seed<=20;seed++){const g=new Adventure({progression:profile(8),party,seed});assert.deepEqual(g.party,party);g.addCrystals(8);g.tick(1/60);assert.equal(g.offers.length,3);assert.equal(new Set(g.offers.map(s=>s.id)).size,3);for(const s of g.offers)assert.ok(!s.requires||s.requires.every(id=>party.includes(id)));}
 const g=new Adventure({progression:profile(8),party:HEROES.map(h=>h.id)});assert.equal(g.party.length,2);assert.equal(skillsForParty(['omsolo']).length,7);assert.ok(skillsForParty(['nyanluna','omsolo']).some(s=>s.id==='moonGuard'));assert.ok(skillsForParty(['tsukineko','omsolo']).some(s=>s.id==='starBlade'));
});
test('Omsolo ultimate follows his position through a swap, heals and cannot recharge itself',()=>{
 const g=quiet(new Adventure({progression:profile(8),party:['omsolo','nyanluna'],hero:2}));const e=g.spawnEnemy('boss',0,4);g.player.hp=100;g.player.charge=100;assert.ok(g.ultimate());assert.equal(g.player.hp,128);assert.ok(g.player.invincible>=1.6);assert.equal(g.ultimateEffects[0].kind,'bladeDance');const hp=e.hp;g.switchHero();Object.assign(g.partner,{x:0,z:2});for(let i=0;i<60;i++){g.player.attack=g.partner.attack=999;g.tick(1/60);}assert.ok(e.hp<hp);assert.equal(g.chargeFor(2),0);assert.equal(ultimateFor('omsolo').pulses,5);assert.ok(g.drainEvents().filter(e=>e.type==='saberPulse').length>=5);
});
test('Omsolo can spend shared growth materials and transfer unique gear without changing the other hero stats',()=>{
 const p=profile(8);p.inventory.starBud=20;p.equipment.owned=['guardian-knot'];const n=structuredClone(p.characters.nyanluna);assert.ok(unlockTalent(p,'omsolo','origin'));assert.equal(p.inventory.starBud,16);assert.deepEqual(p.characters.nyanluna,n);assert.ok(equipUnique(p.equipment,'nyanluna','guardian-knot'));assert.ok(equipUnique(p.equipment,'omsolo','guardian-knot',{transfer:true}));assert.equal(p.equipment.loadout.nyanluna,undefined);assert.equal(combatStats(p,HEROES[2]).maxHp,297);
});
for(const difficulty of ['normal','hard'])test(`all 48 waves can be cleared with earned Lv.30 preparation: ${difficulty}`,()=>{
 let p;const runs=[];for(let act=0;act<8;act++){
  if(act===4){const training=prepareWithEarnedRewards(p);p=training.profile;console.log('EARNED PREPARATION',difficulty,training.runs,JSON.stringify(p.characters));}
  const g=new Adventure({act,seed:1,difficulty,progression:p});for(let f=0;f<60*550;f++){while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;g.tick(1/60,botInput(g));g.drainEvents();}
  assert.equal(g.phase,'victory',JSON.stringify({act,wave:g.wave,hp:g.player.hp,seconds:g.time,rescue:g.rescue}));assert.equal(g.kills,ACTS[act].counts.reduce((a,b)=>a+b));assert.equal(isHeroUnlocked(g.progression,'omsolo'),act===7);assert.ok(g.earnedMissions.length>=9);runs.push({act,time:g.time,hits:g.runHits,rescue:g.rescue});p=JSON.parse(JSON.stringify(g.progression));
 }assert.equal(p.story.chapterTwoCleared,true);console.log('CAMPAIGN',difficulty,JSON.stringify(runs));
});
for(const difficulty of ['normal','hard'])test(`Omsolo solo can finish an act from level one: ${difficulty}`,()=>{
 const g=new Adventure({progression:profile(8),party:['omsolo'],hero:2,seed:1,difficulty});for(let f=0;f<60*500;f++){while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;g.tick(1/60,botInput(g));g.drainEvents();}assert.equal(g.phase,'victory',JSON.stringify({wave:g.wave,hp:g.player.hp,time:g.time}));assert.equal(g.earnedXp.nyanluna,0);assert.equal(g.earnedXp.tsukineko,0);assert.ok(g.earnedXp.omsolo>0);
});
for(const act of [4,5,6,7])test(`second-chapter unique and breakthrough missions are achievable: act ${act-3}`,()=>{
 let success=null;for(const seed of [2,1,3,5,8]){
  const p=levelThirtyProfile({tree:true});
  const g=new Adventure({act,seed,difficulty:'hard',progression:p,hero:1});for(let f=0;f<60*350;f++){while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;g.tick(1/60,trialInput(g));g.drainEvents();}
  if(g.phase==='victory'&&g.progression.equipment.owned.length===1&&g.progression.inventory.limitStone===1){success={seed,seconds:g.time,hits:g.runHits};break;}
 }assert.ok(success,`act ${act+1} no achievable tested seed`);console.log('TRIAL',act,JSON.stringify(success));
});
