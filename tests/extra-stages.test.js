import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {ACTS,EXTRA_ACTS,actLabel,isActUnlocked,isActCleared,clearTicketReward} from '../src/acts.js';
import {enemyRosterForAct,enemyForSpawn} from '../src/enemies.js';
import {tickEnemyBehavior} from '../src/enemy-combat.js';
import {missionsForAct} from '../src/missions.js';
import {fieldFor,layoutFor,contains} from '../src/terrain.js';
import {TALENT_NODES} from '../src/talents.js';
import {WEAPONS} from '../src/equipment.js';
import {trialInput} from './country-bot.js';
import {chooseOffer} from './bot.js';

const profile=(cleared=12)=>normalizeProgression({story:{version:2,actClears:ACTS.map(a=>a.id<cleared)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:50,breaks:3,tree:TALENT_NODES.map(n=>n.id)}])),weapons:{version:2,owned:HEROES.map(h=>`${WEAPONS[h.id].id}-r4`),loadout:Object.fromEntries(HEROES.map(h=>[h.id,`${WEAPONS[h.id].id}-r4`]))}},HEROES);
function gate(g,area){g.phase='playing';g.area=area;g.wave=area*2+2;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.equal(g.crossExit(),true);}
function attack(act,type='boss',action=0){
 const g=new Adventure({act,progression:profile(),seed:5,difficulty:'hard'});g.enemies=[];g.hazards=[];g.projectiles=[];
 Object.assign(g.player,{x:0,z:0});const e=g.spawnEnemy(type,0,-5);e.special=0;e.action=action;tickEnemyBehavior(g,e,1/60);return {g,e};
}

test('chapter one and two extras unlock after chapter two; the new extra requires chapter three final gate',()=>{
 for(let cleared=0;cleared<12;cleared++)for(const act of EXTRA_ACTS){const p=profile(cleared),ready=cleared>act.unlockAfterAct;assert.equal(isActUnlocked(p,act.id),ready);if(!ready)assert.equal(new Adventure({act:act.id,progression:p}).act,0);}
 for(const [finalAct,extras] of [[7,[20,21]],[11,[20,21,22]]]){
  const g=new Adventure({act:finalAct,progression:profile(finalAct)});g.wave=5;g.startWave();g.lootRng=()=>1;g.hit(g.enemies.find(e=>e.type==='boss'),1e6,0,0);
  assert.equal(isActUnlocked(g.progression,finalAct===7?20:22),false);gate(g,2);for(const act of extras)assert.equal(isActUnlocked(g.progression,act),true);
 }
 const existing=profile(8);assert.deepEqual(existing.story.extraClears,[false,false,false]);assert.equal(existing.inventory.weaponTicket,0);
 for(const cleared of [7,8,11,12]){const corrupt=profile(cleared);corrupt.story.extraClears=[true,true,true];assert.deepEqual(normalizeProgression(corrupt,HEROES).story.extraClears,[cleared>=8,cleared>=8,cleared>=12]);}
 const old=profile(12);old.story.extraClears=[true,false];assert.deepEqual(normalizeProgression(old,HEROES).story.extraClears,[true,false,false]);
 for(const act of [-1,15,10,8.5,NaN,'8'])assert.equal(isActUnlocked(existing,act),false);
});
test('each extra awards ten tickets first, two on repeats, once at the final gate and across reloads',()=>{
 let p=profile(),total=0;
 for(const [act,expected] of [[21,10],[20,10],[22,10],[21,2],[20,2],[22,2],[20,2]]){
  const g=new Adventure({act,progression:p});const before=structuredClone(g.progression.missions),storyClears=[...p.story.actClears];
  g.trackMission('kills',100);g.trackMission('crystals',100);gate(g,0);gate(g,1);assert.equal(g.earnedWeaponTickets,0);
  gate(g,2);total+=expected;assert.equal(g.clearRewardTickets,expected);assert.equal(g.progression.inventory.weaponTicket,total);assert.equal(g.recruitedHeroId,null);
  assert.deepEqual(g.progression.missions,before);assert.deepEqual(g.earnedMissions,[]);assert.deepEqual(g.progression.story.actClears,storyClears);assert.equal(isActCleared(g.progression,act),true);
  const saved=structuredClone(g.progression);assert.equal(g.crossExit(),false);assert.deepEqual(g.progression,saved);
  p=normalizeProgression(JSON.parse(JSON.stringify(saved)),HEROES);assert.equal(clearTicketReward(p,act),2);
 }
 assert.deepEqual(p.story.extraClears,[true,true,true]);
});
test('retreat and defeat do not consume first clear; boss ticket drops remain separate',()=>{
 for(const act of EXTRA_ACTS){
  const g=new Adventure({act:act.id,progression:profile(),party:['nyanluna']});gate(g,0);const returned=normalizeProgression(g.progression,HEROES);assert.equal(clearTicketReward(returned,act.id),10);assert.equal(returned.inventory.weaponTicket,0);
  g.phase='playing';g.player.invincible=0;g.hurt(1e6,0,0);assert.equal(g.phase,'defeat');assert.equal(g.crossExit(),false);assert.equal(isActCleared(g.progression,act.id),false);
  const win=new Adventure({act:act.id,progression:returned});win.lootRng=()=>0;win.hit(win.spawnEnemy('boss',0,-5),1e6,0,0);gate(win,2);assert.equal(win.clearRewardTickets,10);assert.equal(win.earnedWeaponTickets,11);
 }
});
test('extra encounters have chapter-specific rosters, valid unique terrain and no missions',()=>{
 const ids=new Set();for(const act of EXTRA_ACTS){
  assert.match(actLabel(act.id),/エクストラ/);assert.equal(act.recommendedLevel,50);assert.deepEqual(missionsForAct(act.id),[]);
  const roster=enemyRosterForAct(act.chapter*4);assert.deepEqual(enemyRosterForAct(act.id),roster);
  assert.deepEqual(Array.from({length:roster.length},(_,i)=>enemyForSpawn(act.id,1,i,.5)),roster);
  for(let wave=1;wave<=6;wave++){const area=Math.floor((wave-1)/2),layout=layoutFor(act.id,area,wave);assert.ok(contains(layout,layout.entrance.x,layout.entrance.z));if(wave%2===0)assert.ok(contains(layout,layout.exit.x,layout.exit.z));}
  for(let area=0;area<3;area++)for(const room of fieldFor(act.id,area).rooms){assert.equal(ids.has(room.id),false);ids.add(room.id);}
 }
});
test('extra difficulty cannot be lowered and increases actual HP, damage, cadence, movement and projectiles',()=>{
 for(const [act,story,type] of [[20,3,'archer'],[21,7,'matchlock']]){
  assert.equal(new Adventure({act,progression:profile(),difficulty:'normal'}).difficulty,'hard');
  const base=attack(story,type),extra=attack(act,type);assert.ok(extra.e.hp>base.e.hp);assert.ok(extra.e.damage>base.e.damage);assert.ok(extra.e.speed>base.e.speed);assert.ok(extra.e.cast.total<base.e.cast.total);
  assert.equal(extra.e.cast.total,extra.g.hazards[0].total);
  for(const run of [base,extra]){run.e.cast.remaining=0;tickEnemyBehavior(run.g,run.e,1/60);}
  assert.ok(extra.g.projectiles[0].damage>base.g.projectiles[0].damage);assert.ok(Math.hypot(extra.g.projectiles[0].vx,extra.g.projectiles[0].vz)>Math.hypot(base.g.projectiles[0].vx,base.g.projectiles[0].vz));
  for(const run of [base,extra]){run.e.salvo=null;run.e.special=2;tickEnemyBehavior(run.g,run.e,.1);}
  assert.ok(extra.e.special<base.e.special);
 }
});
test('extra bosses use their strongest phase at full health with matching visible warnings',()=>{
 for(const act of EXTRA_ACTS){
  const {g,e}=attack(act.id);assert.equal(e.hp,e.maxHp);assert.equal(e.enraged,true);assert.ok(g.hazards.every(h=>h.total>0));assert.equal(e.cast.total,g.hazards[0].total);
  const stars=attack(act.id,'boss',1);if(act.chapter===0)assert.equal(stars.e.cast.count,22);else if(act.chapter===1)assert.equal(stars.g.hazards.filter(h=>h.damage>0).length,8);else assert.equal(stars.e.cast.count,32);
  assert.equal(g.rescue,null);
 }
});
for(const act of EXTRA_ACTS)test(`Lv.50 equipped pair can clear ${act.title} through all waves and stairs`,()=>{
 const g=new Adventure({act:act.id,progression:profile(),seed:1,hero:1,party:['nyanluna','tsukineko']});const seen=new Set();
 for(let frame=0;frame<60*600;frame++){
  while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;
  seen.add(g.layout.id);g.tick(1/60,trialInput(g));g.drainEvents();
 }
 console.log('EXTRA RUN',JSON.stringify({act:act.id,phase:g.phase,wave:g.wave,seconds:Math.round(g.time),hits:g.runHits,health:g.heroHealth}));
 assert.equal(g.phase,'victory');assert.equal(g.kills,act.counts.reduce((a,b)=>a+b));assert.equal(seen.size,4);assert.equal(g.clearRewardTickets,10);assert.deepEqual(g.earnedMissions,[]);
});
