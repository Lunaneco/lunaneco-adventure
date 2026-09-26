import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {ACTS,EXTRA_ACTS,isActUnlocked,completeAct} from '../src/acts.js';
import {ACT_SCENES} from '../src/chapter.js';
import {normalizeProgression,characterStats,combatStats,awardCharacterXp,unlockTalent} from '../src/progression.js';
import {TALENT_NODES,talentNode} from '../src/talents.js';
import {MOCHI_SUPPORT,mochiCryHit,mochiIncomingDamage} from '../src/mochi-combat.js';
import {isHeroUnlocked} from '../src/recruitment.js';
import {CHAPTER_THREE_ENEMIES,enemyForSpawn} from '../src/enemies.js';
import {MOCHI_VOICE_MANIFEST} from '../src/mochi-voice-manifest.js';
import {MOCHI_VOICE_CLIPS} from '../src/mochi-voice-clips.js';
import {voicePlaybackGain} from '../src/voice-policy.js';
import {equippedWeapon,drawWeapon,WEAPON_HERO_IDS} from '../src/weapons.js';
import {trialInput} from './country-bot.js';
import {chooseOffer} from './bot.js';
const profile=(cleared=12,level=1,tree=[])=>normalizeProgression({story:{version:2,actClears:ACTS.map(a=>a.id<cleared)},tutorial:{firstBattleCompleted:true},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level,breaks:3,tree}]))},HEROES);
const quiet=(options={})=>{const g=new Adventure({progression:profile(),party:['nyanluna','mochinyafe'],seed:9,...options});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.player.x=0;g.player.z=0;g.partner.x=0;g.partner.z=0;g.rng=()=>1;g.drainEvents();return g;};
const advance=(g,seconds)=>{for(let i=0;i<seconds*60;i++)g.tick(1/60);};
const target=(g,type='mochiGoblin',z=4)=>{const e=g.spawnEnemy(type,0,z);e.hp=e.maxHp=1e6;e.attack=e.special=999;return e;};
const gate=g=>{g.phase='playing';g.wave=6;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.ok(g.crossExit());};

test('chapter three opens after chapter two; existing extras, wallets and heroes survive migration',()=>{
 for(const n of [0,4,7])assert.equal(isActUnlocked(profile(n),8),false);
 const old=profile(8);old.story.extraClears=[true,false];old.inventory.starBud=456;const restored=normalizeProgression(JSON.parse(JSON.stringify(old)),HEROES);
 assert.ok(isActUnlocked(restored,8));assert.equal(isActUnlocked(restored,9),false);assert.deepEqual(restored.story.extraClears,[true,false,false]);assert.equal(restored.inventory.starBud,456);assert.equal(restored.characters.mochinyafe.level,1);
 for(const a of EXTRA_ACTS)assert.equal(isActUnlocked(restored,a.id),a.chapter<2);assert.equal(isHeroUnlocked(restored,'mochinyafe'),false);
});
test('only the last chapter-three gate recruits Mochinyafe once and saves it permanently',()=>{
 const g=quiet({act:11,progression:profile(11),party:['mochinyafe'],hero:3});assert.equal(g.party.includes('mochinyafe'),false);
 const b=g.spawnEnemy('boss',0,-5);g.hit(b,1e8,0,0);assert.equal(isHeroUnlocked(g.progression,'mochinyafe'),false);
 gate(g);assert.equal(g.recruitedHeroId,'mochinyafe');assert.ok(isHeroUnlocked(g.progression,'mochinyafe'));const p=normalizeProgression(g.progression,HEROES);assert.ok(isHeroUnlocked(p,'mochinyafe'));assert.equal(completeAct(p,11),false);
 const solo=new Adventure({progression:p,party:['mochinyafe'],hero:3});assert.deepEqual(solo.party,['mochinyafe']);assert.equal(solo.player.hero,3);
});
test('all chapter-three waves use the referenced enemy roster and four different dark Mochi bosses',()=>{
 assert.equal(new Set(ACTS.slice(8,12).map(a=>a.bossId)).size,4);
 for(const a of ACTS.slice(8,12))for(let wave=1;wave<=5;wave++)for(let i=0;i<40;i++)assert.ok(CHAPTER_THREE_ENEMIES.includes(enemyForSpawn(a.id,wave,i,i/40)));
 const lines=ACT_SCENES.slice(8).flatMap(a=>Object.values(a).flatMap(s=>s.lines));
 assert.ok(lines.some(l=>l.text.includes('最後の一匹')));assert.ok(lines.some(l=>l.text.includes('戻ってこない')));
 for(const l of lines.filter(l=>l.who==='mochinyafe')){assert.match(l.text,/^ふぇ〜[っ！？…]*$/u);assert.equal(l.voiced,true);}
});
test('support cry must hit: it stops regular targets and interrupts pending spells, not distant enemies',()=>{
 const g=quiet(),e=target(g),far=target(g,'mochiGoblin',20);e.cast={remaining:2,kind:'chant'};g.hazards=[{id:9,sourceId:e.id,timer:5,total:5,x:0,z:0,damage:50,radius:3}];
 assert.ok(g.attackFrom(g.partner,3,true));assert.equal(e.mochiStopUntil,undefined);advance(g,.4);
 assert.ok(e.mochiStopUntil>g.time);assert.equal(e.cast,null);assert.equal(g.hazards.length,0);assert.equal(far.mochiStopUntil,undefined);
 const pos={x:e.x,z:e.z};advance(g,1);assert.equal(e.x,pos.x);assert.equal(e.z,pos.z);
 advance(g,1.1);assert.ok(Math.hypot(e.x-pos.x,e.z-pos.z)>0);
});
test('main-controlled Mochi uses a weak homing note without the support stop',()=>{
 const g=quiet({party:['mochinyafe'],hero:3}),near=target(g,'mochiGoblin',2),far=target(g,'mochiGoblin',10);g.attackFrom(g.player,3);assert.equal(g.projectiles[0].kind,'mochiNote');advance(g,.4);
 assert.equal(near.maxHp-near.hp,5);assert.equal(far.hp,far.maxHp);assert.equal(near.mochiStopUntil,undefined);assert.equal(g.projectiles.length,0);
});
test('bosses keep moving but attack and defense debuffs apply and expire without stacking',()=>{
 const g=quiet({act:11}),e=target(g,'boss');mochiCryHit(g,e);
 assert.equal(e.mochiStopUntil,undefined);assert.equal(mochiIncomingDamage(g,100,e.id),70);
 let hp=e.hp;g.hit(e,70,0,0);assert.ok(Math.abs(hp-e.hp-100)<1e-7);
 mochiCryHit(g,e);hp=e.hp;g.hit(e,70,0,0);assert.ok(Math.abs(hp-e.hp-100)<1e-7);
 e.knockX=e.knockZ=0;advance(g,.2);assert.ok(e.z<4);g.time=6;assert.equal(mochiIncomingDamage(g,100,e.id),100);
 hp=e.hp;g.hit(e,70,0,0);assert.equal(hp-e.hp,70);
 mochiCryHit(g,e,{ultimate:true});assert.equal(e.mochiAttackDown,.4);g.time+=8;mochiCryHit(g,e);assert.equal(e.mochiAttackDown,.3);
});
test('assisted kills give Mochi half XP without an additional assist award; repeating a dead hit never doubles experience',()=>{
 const g=quiet(),e=target(g);mochiCryHit(g,e);g.hit(e,1e8,0,0,false,false,'nyanluna');
 assert.equal(g.earnedXp.mochinyafe,11);assert.equal(g.earnedXp.nyanluna,22);g.hit(e,1e8,0,0);assert.equal(g.earnedXp.mochinyafe,11);
});
test('every supplied clip is used, normalized, and battle playback remains at half-volume policy',()=>{
 assert.equal(MOCHI_VOICE_CLIPS.length,4);assert.equal(new Set(Object.values(MOCHI_VOICE_MANIFEST).map(v=>v.file)).size,4);
 for(const item of Object.values(MOCHI_VOICE_MANIFEST).filter(v=>v.kind==='battle'))assert.ok(Math.abs(voicePlaybackGain(item)-.5*10**(item.normalizationDb/20))<1e-10);
});
test('Mochi starts weakest, grows progressively faster, and beats every fully equipped Lv.50 hero in HP, attack and defense',()=>{
 const mochi=HEROES[3],fresh=characterStats(mochi,{level:1,tree:[]}),full=profile(12,50,TALENT_NODES.map(n=>n.id));
 for(const h of HEROES.slice(0,3))for(const stat of ['maxHp','attack','defense'])assert.ok(fresh[stat]<characterStats(h,{level:1,tree:[]})[stat]);
 const at=level=>characterStats(mochi,{level,tree:[]});assert.ok(at(50).attack-at(40).attack>at(20).attack-at(10).attack);
 for(const [hero,id] of [['nyanluna','selene-staff-r4'],['tsukineko','artemis-rifle-r4'],['omsolo','aegis-saber-r4']]){full.weapons.owned.push(id);full.weapons.loadout[hero]=id;full.equipment.owned=['ruins-lens'];full.equipment.loadout[hero]='ruins-lens';}
 const grown=combatStats(full,mochi);for(const h of HEROES.slice(0,3))for(const stat of ['maxHp','attack','defense'])assert.ok(grown[stat]>combatStats(full,h)[stat],`${stat}/${h.id}`);
 assert.equal(talentNode('origin','mochinyafe').bonus.hp,36);assert.equal(talentNode('guard3','mochinyafe').bonus.defense,54);assert.ok(Math.abs(talentNode('attack3','mochinyafe').bonus.attack-.45)<1e-9);
 const p=profile();awardCharacterXp(p,'mochinyafe',100000000);assert.equal(p.characters.mochinyafe.level,50);
});
test('starter chime survives migration and Mochi joins the four-hero weapon gacha',()=>{
 const p=profile();assert.equal(equippedWeapon(p,'mochinyafe').id,'mochi-voice-r1');p.inventory.weaponTicket=30;
 for(let i=0;i<30;i++){const rolls=[i/30,.96,.5];assert.ok(WEAPON_HERO_IDS.includes(drawWeapon(p,()=>rolls.shift()).item.heroId));}
 const g=quiet({progression:profile(12,50),hero:3,party:['mochinyafe']});assert.ok(Math.abs(g.attackProfile(3).interval-.35)<1e-9);
});
test('Mochi ultimate stops regular enemies, weakens bosses and heals without draining anyone else gauge',()=>{
 const g=quiet({hero:3,party:['mochinyafe','nyanluna']}),a=target(g),b=target(g,'boss',5);g.player.hp=10;g.player.charge=100;g.ultimateCharges.nyanluna=43;
 assert.ok(g.ultimate());assert.equal(g.player.charge,0);assert.equal(g.ultimateCharges.nyanluna,43);assert.equal(g.player.hp,46);assert.ok(a.mochiStopUntil>=3);assert.equal(b.mochiAttackDown,.4);advance(g,3);assert.equal(g.ultimateEffects.length,0);
});
for(const act of ACTS.slice(8,12))test(`Lv.40 party can clear ${act.title}, through all six waves and the final gate`,()=>{
 const tree=TALENT_NODES.filter(n=>n.level<=40).map(n=>n.id),p=profile(act.id,40,tree);
 const g=new Adventure({act:act.id,progression:p,party:['nyanluna','tsukineko'],hero:1,seed:1});
 for(let frame=0;frame<60*600;frame++){
  while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;
  g.tick(1/60,trialInput(g));g.drainEvents();
 }
 assert.equal(g.phase,'victory',`${act.id}: wave ${g.wave}, HP ${g.player.hp}, time ${g.time}`);assert.ok(g.progression.story.actClears[act.id]);
});
