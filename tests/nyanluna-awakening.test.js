import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,awardCharacterXp,xpRequired} from '../src/progression.js';
import {ACTS,PLAYABLE_ACTS,isActUnlocked,isActCleared,actLabel} from '../src/acts.js';
import {NYAN_QUEST,NYAN_QUEST_ID,NYAN_AWAKENING_RULES,NYAN_AWAKENING_SCENES,hasNyanAwakening,nyanQuestUnlocked} from '../src/nyanluna-awakening.js';
import {hasRicePower} from '../src/rice-awakening.js';
import {partyForAct} from '../src/party.js';
import {stageSelectionView,stageBriefingView} from '../src/stage-selection-ui.js';
import {fieldFor,contains,layoutFor} from '../src/terrain.js';
import {enemyForSpawn,CHAPTER_ONE_ENEMIES} from '../src/enemies.js';
import {ULTIMATE_ART} from '../src/ultimate-art.js';
import {STORY_CAST} from '../src/story-cast.js';
import {UltimatePresentation} from '../src/ultimate-presentation.js';
import {botInput,chooseOffer} from './bot.js';

const profile=(level=50,learned=false,full=false)=>normalizeProgression({story:{version:2,actClears:Array(32).fill(full)},characters:{nyanluna:{level,breaks:3},omsolo:{level:50,breaks:3},shizuku:{level:50,breaks:3}},awakenings:{nyanluna:learned,rice:full},tutorial:{firstBattleCompleted:true}},HEROES);
const quiet=(options={})=>{const g=new Adventure({act:1,seed:8,hero:0,party:['nyanluna'],progression:profile(50,true,true),...options});g.player.x=g.player.z=0;g.player.attack=g.partner.attack=999;g.player.invincible=0;g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.enemies=[];g.drainEvents();return g;};
const target=(g,x,z)=>{const e=g.spawnEnemy('moss',x,z);Object.assign(e,{hp:100000,maxHp:100000,speed:0,special:999,attack:999});return e;};
const step=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds*60);i++)g.tick(1/60);};
const gate=(g,area)=>{g.area=area;g.wave=area*2+2;g.enemies=[];g.pendingBlessings=0;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);return g.crossExit();};

test('Nyanluna trial unlocks at exactly Lv.50, independently of story chapter clears',()=>{
 const p=profile(49);assert.equal(isActUnlocked(p,32),false);assert.equal(new Adventure({act:32,progression:p}).act,0);awardCharacterXp(p,'nyanluna',xpRequired(49));assert.equal(p.characters.nyanluna.level,50);assert.equal(isActUnlocked(p,32),true);
 for(const level of [50,60,80])assert.equal(isActUnlocked(profile(level),32),true);
 for(const level of [49,'50',NaN,Infinity,null])assert.equal(nyanQuestUnlocked({characters:{nyanluna:{level}}}),false);
 assert.equal(NYAN_QUEST_ID,32);assert.equal(PLAYABLE_ACTS.at(-1),NYAN_QUEST);assert.equal(ACTS.length,28);assert.equal(profile().story.actClears.length,32);assert.equal(actLabel(32),'にゃんるな・ソロ覚醒');
});
test('unlearned and malformed old saves keep awakening locked; rice flag is independent',()=>{
 assert.equal(hasNyanAwakening(profile()),false);assert.equal(hasNyanAwakening(profile(49,true)),false);
 for(const nyanluna of ['true',1,{},null])assert.equal(hasNyanAwakening(normalizeProgression({...profile(),awakenings:{nyanluna}},HEROES)),false);
 const p=profile(50,true,true);assert.equal(hasNyanAwakening(p),true);assert.equal(hasRicePower(p),true);assert.equal(hasNyanAwakening(normalizeProgression({...p,awakenings:{rice:true}},HEROES)),false);
 const q=normalizeProgression({...p,awakenings:{nyanluna:true}},HEROES);assert.equal(hasNyanAwakening(q),true);assert.equal(hasRicePower(q),false);
});
test('first trial and replays are Nyanluna solo without changing saved party, lead or story',()=>{
 const party=['omsolo','shizuku'];for(const learned of [false,true]){const p=profile(50,learned,true),before=structuredClone(p);assert.deepEqual(partyForAct(party,HEROES,p,32,'shizuku'),['nyanluna']);assert.deepEqual(p,before);assert.deepEqual(party,['omsolo','shizuku']);const g=new Adventure({act:32,hero:4,party,progression:p,difficulty:'hard'});assert.equal(g.player.hero,0);assert.deepEqual(g.party,['nyanluna']);assert.equal(g.partnerHero,null);assert.equal(g.guestHeroId,null);assert.equal(g.difficulty,'normal');assert.equal(g.switchHero(),false);}
});
test('only final gate clear grants permanent awakening; defeat, boss kill and retreat do not',()=>{
 const g=quiet({act:32,progression:profile()}),story=structuredClone(g.progression.story),missions=structuredClone(g.progression.missions);assert.equal(g.awakenNyan(),false);gate(g,0);g.advanceStage();gate(g,1);g.advanceStage();assert.equal(hasNyanAwakening(g.progression),false);g.hit(g.spawnEnemy('boss',0,-8),1e9,0,0);assert.equal(hasNyanAwakening(g.progression),false);assert.ok(gate(g,2));assert.equal(g.phase,'victory');assert.equal(hasNyanAwakening(g.progression),true);assert.equal(hasRicePower(g.progression),false);assert.equal(isActCleared(g.progression,32),true);assert.equal(g.clearRewardTickets,1);assert.deepEqual(g.progression.story,story);assert.deepEqual(g.progression.missions,missions);assert.equal(g.drainEvents().filter(e=>e.type==='nyanAwakeningLearned').length,1);assert.equal(g.crossExit(),false);
 const loaded=normalizeProgression(JSON.parse(JSON.stringify(g.progression)),HEROES);assert.ok(hasNyanAwakening(loaded));const replay=quiet({act:32,progression:loaded});gate(replay,2);assert.equal(replay.drainEvents().some(e=>e.type==='nyanAwakeningLearned'),false);
 const fail=quiet({act:32,progression:profile()});fail.hurt(1e9,0,0);assert.equal(fail.phase,'defeat');assert.equal(hasNyanAwakening(fail.progression),false);assert.equal(hasNyanAwakening(normalizeProgression(quiet({act:32,progression:profile()}).progression,HEROES)),false);
});
test('all six waves use proper moon arenas and only first-chapter monsters',()=>{
 for(let wave=1;wave<=6;wave++){const area=Math.floor((wave-1)/2),layout=layoutFor(32,area,wave);assert.equal(fieldFor(32,area).kind,'single');assert.match(layout.id,/nyanluna-awakening/);assert.ok(contains(layout,layout.entrance.x,layout.entrance.z));assert.ok(contains(layout,layout.exit.x,layout.exit.z));for(let i=0;i<16;i++)assert.ok(wave===6?enemyForSpawn(32,wave,i,.93)==='boss':CHAPTER_ONE_ENEMIES.includes(enemyForSpawn(32,wave,i,.93)));}
});
test('menu shows correct Lv.50 lock, learned status, solo replay and rewards',()=>{
 assert.match(stageSelectionView(0,profile(49)),/data-act="32"[^>]*disabled/);assert.doesNotMatch(stageSelectionView(0,profile()),/data-act="32"[^>]*disabled/);assert.match(stageSelectionView(0,profile(50,true)),/にゃんるな覚醒 習得済み/);assert.doesNotMatch(stageSelectionView(1,profile()),/data-act="32"/);
 const brief=stageBriefingView(32,'hard',profile());for(const text of ['にゃんるな1人で出撃','再挑戦も単独限定','貫通弾1発＋追尾弾2発','20秒','60秒','威力2倍'])assert.ok(brief.includes(text));assert.doesNotMatch(brief,/data-difficulty|オムソロ|ライスの力/);
 for(const scene of Object.values(NYAN_AWAKENING_SCENES)){assert.equal(scene.act,32);assert.ok(scene.lines.every(l=>['nyanluna','narrator'].includes(l.who)&&!l.voiced));}assert.equal(NYAN_AWAKENING_SCENES.ending.lines[1].portrait,'nyanlunaAwakened');
});
test('activation changes no HP, invincibility, charge, damage counters, party or permanent stats',()=>{
 const g=quiet();g.player.hp-=30;g.player.charge=55;const before={hp:g.player.hp,invincible:g.player.invincible,charge:g.player.charge,hits:g.runHits,stats:g.statsFor(0),party:g.party,profile:structuredClone(g.progression)};assert.ok(g.awakenNyan());assert.equal(g.awakenNyan(),false);assert.equal(g.nyanAwakening.remaining,20);assert.deepEqual({hp:g.player.hp,invincible:g.player.invincible,charge:g.player.charge,hits:g.runHits,stats:g.statsFor(0),party:g.party,profile:g.progression},before);assert.equal(g.snapshot().nyanAwakening.active,true);
});
test('other heroes, unlearned Nyanluna, pause, tutorial, gate, passage, dead and active ultimate cannot awaken',()=>{
 for(const options of [{progression:profile()},{hero:2,party:['omsolo','nyanluna']},{progression:profile(49,true)}])assert.equal(quiet(options).awakenNyan(),false);
 for(const change of [g=>g.phase='paused',g=>g.exitOpen=true,g=>g.travelOpen='stairs',g=>g.player.hp=0,g=>g.tutorial={active:true},g=>g.ultimateEffects=[{heroId:'nyanluna'}]]){const g=quiet();change(g);assert.equal(g.awakenNyan(),false);}
});
test('20-second duration and 60-second after-end cooldown; no manual cancellation or timer restart',()=>{
 const g=quiet();g.awakenNyan();step(g,19.95);assert.equal(g.nyanAwakening.active,true);assert.equal(g.awakenNyan(),false);step(g,.06);assert.equal(g.nyanAwakening.active,false);assert.ok(g.nyanAwakening.cooldown>59.9);assert.equal(g.awakenNyan(),false);step(g,59.95);assert.equal(g.awakenNyan(),false);step(g,.1);assert.ok(g.awakenNyan());
});
test('pauses, story/ultimate intros, upgrades, transitions and open gates freeze awakening clocks',()=>{
 for(const phase of ['paused','story','ultimateIntro','upgrade','transition']){const g=quiet();g.awakenNyan();g.phase=phase;step(g,5);assert.equal(g.nyanAwakening.remaining,20);g.nyanAwakening.active=false;g.nyanAwakening.cooldown=60;step(g,5);assert.equal(g.nyanAwakening.cooldown,60);}
 for(const change of [g=>g.exitOpen=true,g=>{g.travelOpen='stairs';g.travelDelay=99;}]){const g=quiet();g.awakenNyan();change(g);step(g,1);assert.equal(g.nyanAwakening.remaining,20);}
});
test('switching preserves form and continues timer; Nyanluna support fires awakened shots',()=>{
 const g=quiet({party:['nyanluna','omsolo']});g.awakenNyan();assert.ok(g.switchHero());assert.equal(g.player.hero,2);assert.equal(g.nyanAwakening.active,true);step(g,.8);assert.ok(g.nyanAwakening.remaining<20);target(g,0,-5);assert.ok(g.attackFrom(g.partner,0,true));assert.equal(g.projectiles.filter(b=>b.awakened).length,3);assert.equal(g.awakenNyan(),false);assert.ok(g.switchHero());assert.equal(g.player.hero,0);assert.equal(g.ultimateSpec().awakened,true);
});
test('KO and final gate reset form; new battles start normal with ready cooldown',()=>{
 const g=quiet({party:['nyanluna','omsolo']});g.awakenNyan();g.hurt(1e9,0,0);assert.equal(g.player.hero,2);assert.equal(g.nyanAwakening.active,false);
 const win=quiet();win.awakenNyan();assert.ok(gate(win,2));assert.equal(win.nyanAwakening.active,false);assert.equal(win.nyanAwakening.cooldown,0);const fresh=quiet({progression:win.progression});assert.equal(fresh.nyanAwakening.active,false);assert.ok(fresh.nyanAwakeningReady);
 const fail=quiet();fail.awakenNyan();fail.hurt(1e9,0,0);assert.equal(fail.phase,'defeat');assert.deepEqual(fail.nyanAwakening,{active:false,remaining:0,cooldown:0});
});
test('normal attack is unchanged before awakening; awakened volley is exactly one piercing plus two guided shots',()=>{
 const g=quiet();target(g,0,-5);g.attackFrom(g.player,0);assert.equal(g.projectiles.length,1);assert.equal(g.projectiles[0].kind,'magic');assert.equal(g.projectiles[0].awakened,undefined);g.projectiles=[];g.awakenNyan();assert.ok(g.attackFrom(g.player,0));assert.equal(g.projectiles.length,3);assert.equal(g.projectiles.filter(b=>b.kind==='moonPierce').length,1);assert.equal(g.projectiles.filter(b=>b.kind==='magic').length,2);assert.ok(g.projectiles.every(b=>b.heroId==='nyanluna'&&b.damage===g.projectiles[0].damage));assert.equal(g.projectiles[0].pierce,Infinity);
});
test('piercing round crosses multiple enemies, each at most once even with overlapping swept steps',()=>{
 const g=quiet(),targets=[target(g,0,-3),target(g,0,-6),target(g,0,-9)];g.awakenNyan();g.attackFrom(g.player,0);const shot=g.projectiles.find(b=>b.kind==='moonPierce');g.projectiles=[shot];step(g,.4);assert.equal(shot.hitIds.length,3);assert.equal(new Set(shot.hitIds).size,3);for(const e of targets)assert.ok(Math.abs(e.maxHp-e.hp-shot.damage)<1e-7);
});
test('two homing shots hit independent targets and retarget if their original enemy dies',()=>{
 const g=quiet(),a=target(g,0,-5),b=target(g,4,-6);g.awakenNyan();g.attackFrom(g.player,0);const guided=g.projectiles.filter(s=>s.kind==='magic');assert.equal(new Set(guided.map(s=>s.target)).size,2);g.projectiles=guided;step(g,.7);assert.ok(a.hp<a.maxHp);assert.ok(b.hp<b.maxHp);
 const q=quiet(),first=target(q,0,-5),second=target(q,3,-6);q.awakenNyan();q.attackFrom(q.player,0);const shot=q.projectiles.find(s=>s.kind==='magic'&&s.target===first.id);q.projectiles=[shot];first.hp=0;step(q,.7);assert.equal(shot.target,second.id);assert.ok(second.hp<second.maxHp);
});
test('awakened ultimate doubles upgraded damage, widens radius and preserves normal trees and pulse count',()=>{
 const g=quiet();g.progressFor(0).talents={};const normal=g.ultimateSpec(),stats=g.statsFor(0);g.awakenNyan();const spec=g.ultimateSpec();assert.equal(spec.id,'moon-awakening-sanctuary');assert.equal(spec.baseDamage,normal.baseDamage*2);assert.equal(spec.radius,normal.radius+2);assert.equal(spec.pulses,normal.pulses);assert.equal(spec.heal,normal.heal);assert.deepEqual(g.statsFor(0),stats);const e=target(g,0,-3);g.player.charge=100;assert.ok(g.ultimate());assert.ok(Math.abs(e.maxHp-e.hp-g.skillDamage('nyanluna',normal.baseDamage)*2)<1e-7);assert.equal(g.ultimateEffects[0].spec.awakened,true);
});
test('awakened Nyanluna ultimate takes priority over Shizuku duet without consuming partner charge',()=>{
 const g=quiet({party:['nyanluna','shizuku']});g.ultimateCharges.nyanluna=g.ultimateCharges.shizuku=100;assert.equal(g.duetReady,true);g.awakenNyan();assert.equal(g.duetReady,false);g.ultimate();assert.equal(g.ultimateCharges.nyanluna,0);assert.equal(g.ultimateCharges.shizuku,100);assert.equal(g.ultimateEffects[0].heroId,'nyanluna');assert.equal(g.ultimateEffects[0].heroIds,undefined);
});
test('ultimate cut-in selects new artwork and freezes combat while keeping real voice identity',()=>{
 const g=quiet();g.awakenNyan();g.player.charge=100;let chosen;const p=new UltimatePresentation({voice:{setMode(){},stop(){}},view:{show:(id,line,spec)=>{chosen={id,line,spec};},hide(){}},getGame:()=>g});assert.ok(p.start(g));assert.equal(chosen.id,'nyanlunaAwakened');assert.equal(chosen.line.who,'nyanluna');assert.equal(chosen.spec.awakened,true);step(g,1);assert.equal(g.nyanAwakening.remaining,20);p.cancel();assert.equal(g.phase,'playing');
});
test('new artwork and separate portable body/staff exist without replacing the normal art',()=>{
 for(const file of [ULTIMATE_ART.nyanlunaAwakened.file,STORY_CAST.nyanlunaAwakened.image.replace(/^\//,''),'assets/portraits/nyanluna-awakening-face-v1.png','assets/models/nyanluna-awakening.glb','assets/models/nyanluna-awakening-staff.glb'])assert.ok(existsSync(new URL(`../public/${file}`,import.meta.url)),file);
 for(const n of ['nyanluna-awakening','nyanluna-awakening-staff']){const bytes=readFileSync(new URL(`../public/assets/models/${n}.glb`,import.meta.url)),doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));assert.doesNotMatch(JSON.stringify(doc),/\/Users\/|\/private\//);for(const m of doc.materials)assert.ok(!m.alphaMode||m.alphaMode==='OPAQUE');assert.ok(bytes.length<17*1048576);if(n.endsWith('staff'))assert.equal(doc.skins,undefined);else assert.equal(doc.skins[0].joints.length,39);}
});
test('unlearned Lv.50 Nyanluna can complete all six trial waves with ordinary attacks and ultimate',()=>{
 for(const seed of [7,29,101]){const g=new Adventure({act:32,seed,hero:0,party:['nyanluna'],progression:profile()});let frames=0;while(!['victory','defeat'].includes(g.phase)&&frames++<60*420){if(g.phase==='upgrade'){g.chooseSkill(chooseOffer(g));continue;}if(g.phase==='transition'){g.advanceStage();continue;}g.tick(1/60,botInput(g));}assert.equal(g.phase,'victory',`seed ${seed}, wave ${g.wave}, HP ${g.player.hp}`);assert.ok(hasNyanAwakening(g.progression));assert.equal(g.stagesCleared,3);assert.equal(g.nyanAwakening.active,false);}
});
