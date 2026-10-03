import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,awardCharacterXp,xpRequired} from '../src/progression.js';
import {ACTS,PLAYABLE_ACTS,isActUnlocked,isActCleared,clearTicketReward} from '../src/acts.js';
import {RICE_QUEST,RICE_QUEST_ID,RICE_SCENES,hasRicePower} from '../src/rice-awakening.js';
import {RICE_RULES} from '../src/rice-combat.js';
import {partyForAct} from '../src/party.js';
import {stageSelectionView,stageBriefingView} from '../src/stage-selection-ui.js';
import {fieldFor,contains,layoutFor} from '../src/terrain.js';
import {botInput,chooseOffer} from './bot.js';

const profile=(level=50,learned=false,clears=8)=>normalizeProgression({story:{version:2,actClears:ACTS.map(a=>a.id<clears)},characters:{omsolo:{level,breaks:3}},awakenings:{rice:learned},tutorial:{firstBattleCompleted:true}},HEROES);
const quiet=(options={})=>{
  const g=new Adventure({act:4,seed:8,hero:2,party:['omsolo','nyanluna'],progression:profile(50,true),...options});
  g.player.x=g.player.z=0;g.player.attack=g.partner.attack=999;g.player.invincible=0;g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.enemies=[];g.drainEvents();return g;
};
const target=(g,x,z,type='reaper')=>{const e=g.spawnEnemy(type,x,z);Object.assign(e,{hp:10000,maxHp:10000,speed:0,special:999,attack:999});return e;};
const bullet=(g,x=2,z=0)=>{const b={id:g.ids++,owner:'enemy',kind:'arrow',x,z,vx:-8,vz:0,radius:.2,life:2,damage:40,homing:2,speed:8,turnRate:3};g.projectiles.push(b);return b;};
const hazard=(g,x=2,z=0)=>{const h={id:g.ids++,shape:'circle',x,z,radius:1,damage:50,timer:1,total:1};g.hazards.push(h);return h;};
function gate(g,area){g.area=area;g.wave=area*2+2;g.enemies=[];g.pendingBlessings=0;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);return g.crossExit();}
const step=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds*60);i++)g.tick(1/60);};

test('rice trial unlocks at level 50, not at 49 or for an unrecruited/invalid character',()=>{
  const p=profile(49);assert.equal(isActUnlocked(p,RICE_QUEST_ID),false);assert.equal(new Adventure({act:23,progression:p}).act,0);
  awardCharacterXp(p,'omsolo',xpRequired(49));assert.equal(p.characters.omsolo.level,50);assert.equal(isActUnlocked(p,23),true);
  for(const level of [50,60,80])assert.equal(isActUnlocked(profile(level),23),true);
  assert.equal(isActUnlocked(profile(50,false,7),23),false);
  assert.equal(PLAYABLE_ACTS[23],RICE_QUEST);assert.equal(ACTS.length,28);
  assert.equal(hasRicePower(normalizeProgression({awakenings:{rice:true}},HEROES)),false);
  for(const rice of ['true',1,{},null])assert.equal(hasRicePower(normalizeProgression({...profile(),awakenings:{rice}},HEROES)),false);
});
test('rice trial and replay always deploy Omsolo alone without mutating saved party or lead',()=>{
  const party=['nyanluna','tsukineko'];for(const learned of [false,true]){
    const p=profile(50,learned),before=structuredClone(p);
    assert.deepEqual(partyForAct(party,HEROES,p,23,'tsukineko'),['omsolo']);assert.deepEqual(party,['nyanluna','tsukineko']);assert.deepEqual(p,before);
    const g=new Adventure({progression:p,party,hero:1,act:23,difficulty:'hard'});
    assert.deepEqual(g.party,['omsolo']);assert.equal(g.player.hero,2);assert.equal(g.partnerHero,null);assert.equal(g.switchHero(),false);assert.equal(g.difficulty,'normal');
  }
});
test('only crossing the final gate learns rice; boss kill, intermediate gates, defeat and retreat do not',()=>{
  const g=quiet({act:23,progression:profile(50,false)}),story=structuredClone(g.progression.story),missions=structuredClone(g.progression.missions);
  assert.equal(g.riceAvailable,false);gate(g,0);assert.equal(hasRicePower(g.progression),false);g.advanceStage();gate(g,1);assert.equal(hasRicePower(g.progression),false);g.advanceStage();
  g.wave=6;g.area=2;g.hit(g.spawnEnemy('boss',0,-8),1e9,0,0);assert.equal(hasRicePower(g.progression),false);
  assert.equal(gate(g,2),true);assert.equal(g.phase,'victory');assert.equal(hasRicePower(g.progression),true);assert.equal(isActCleared(g.progression,23),true);assert.equal(g.clearRewardTickets,1);
  assert.deepEqual(g.progression.story,story);assert.deepEqual(g.progression.missions,missions);assert.equal(g.progression.story.actClears.length,32);assert.equal(g.progression.story.extraClears.length,6);
  assert.equal(g.drainEvents().filter(e=>e.type==='riceAwakened').length,1);assert.equal(g.crossExit(),false);
  const restored=normalizeProgression(JSON.parse(JSON.stringify(g.progression)),HEROES);assert.equal(hasRicePower(restored),true);assert.equal(clearTicketReward(restored,23),1);
  const replay=quiet({act:23,progression:restored});gate(replay,2);assert.equal(replay.drainEvents().some(e=>e.type==='riceAwakened'),false);
  const fail=quiet({act:23,progression:profile(50,false)});fail.hurt(1e9,0,0);assert.equal(fail.phase,'defeat');assert.equal(fail.crossExit(),false);assert.equal(hasRicePower(fail.progression),false);
  assert.equal(hasRicePower(normalizeProgression(quiet({act:23,progression:profile(50,false)}).progression,HEROES)),false);
});
test('quest terrain, menu, rewards and the Yuda story are independent of later chapters and existing artwork',()=>{
  for(let wave=1;wave<=6;wave++){
    const area=Math.floor((wave-1)/2),layout=layoutFor(23,area,wave);assert.ok(contains(layout,layout.entrance.x,layout.entrance.z));assert.ok(contains(layout,layout.exit.x,layout.exit.z));assert.equal(fieldFor(23,area).kind,'single');assert.match(layout.id,/rice-awakening/);
  }
  assert.match(stageSelectionView(1,profile(49)),/data-act="23"[^>]*disabled/);
  assert.doesNotMatch(stageSelectionView(1,profile()),/data-act="23"[^>]*disabled/);
  assert.match(stageSelectionView(1,profile(50,true)),/ライスの力 習得済み/);
  const brief=stageBriefingView(23,'hard',profile());assert.match(brief,/再挑戦も単独限定/);assert.match(brief,/永久習得/);assert.doesNotMatch(brief,/data-difficulty/);
  const text=Object.values(RICE_SCENES).flatMap(s=>s.lines.map(l=>l.text)).join('');for(const word of ['ユーダ','退屈','楽にできる方法','破門','仲間','ライスの力','繰り返'])assert.ok(text.includes(word));
  assert.ok(Object.values(RICE_SCENES).every(s=>s.lines.every(l=>['omsolo','narrator'].includes(l.who)&&!l.voiced)));
});
test('only learned, living, controlled Omsolo can activate rice during combat',()=>{
  for(const options of [{progression:profile(50,false)},{hero:0},{progression:profile(49,true)}])assert.equal(quiet(options).activateRice(),false);
  for(const mutate of [g=>g.phase='paused',g=>g.exitOpen=true,g=>g.travelOpen='stairs',g=>g.mount.active=true,g=>g.player.hp=0,g=>g.tutorial={active:true}]){
    const g=quiet();mutate(g);assert.equal(g.activateRice(),false);
  }
  const g=quiet(),charge=g.player.charge,attack=g.statsFor(2).attack;assert.equal(g.riceAvailable,true);assert.equal(g.activateRice(),true);
  assert.deepEqual(g.rice,{active:true,remaining:5,cooldown:0});assert.equal(g.riceAvailable,false);assert.equal(g.activateRice(),false);
  assert.equal(g.player.charge,charge);assert.equal(g.statsFor(2).attack,attack);assert.equal(g.drainEvents().filter(e=>e.type==='riceStarted').length,1);
  assert.equal(typeof g.grabRice,'undefined');assert.equal(typeof g.moveRice,'undefined');assert.equal(typeof g.releaseRice,'undefined');
});
test('rice lasts five combat seconds, then cools down for ten seconds without stacking',()=>{
  const g=quiet();g.activateRice();step(g,4.9);assert.equal(g.rice.active,true);assert.ok(g.rice.remaining<=.101);
  step(g,.1);assert.deepEqual(g.rice,{active:false,remaining:0,cooldown:10});assert.equal(g.activateRice(),false);
  step(g,9.9);assert.equal(g.riceAvailable,false);step(g,.1);assert.equal(g.riceAvailable,true);assert.equal(g.activateRice(),true);
  assert.equal(g.rice.remaining,RICE_RULES.duration);assert.equal(g.rice.cooldown,0);
});
test('pause, dialogue, cut-ins and blessing selection freeze rice rather than cancelling it',()=>{
  const g=quiet();g.activateRice();step(g,1);const before={...g.rice};g.pause();step(g,20);assert.deepEqual(g.rice,before);g.resume();
  for(const phase of ['story','cutin','upgrade']){g.phase=phase;step(g,20);assert.deepEqual(g.rice,before);}g.phase='playing';
  g.pendingBlessings=1;g.offerSkills();assert.equal(g.phase,'upgrade');assert.deepEqual(g.rice,before);g.chooseSkill(g.offers[0].id);
  step(g,1);assert.ok(g.rice.remaining<before.remaining);g.cancelRice();g.pause();step(g,20);assert.equal(g.rice.cooldown,10);
});
test('switching, death and stage exit end reflection but repeated cancellation cannot reset cooldown',()=>{
  for(const finish of [g=>g.switchHero(),g=>g.hurt(1e9,0,0),g=>g.openExit(),g=>g.openPassage()]){
    const g=quiet();g.activateRice();finish(g);assert.equal(g.rice.active,false);assert.equal(g.rice.remaining,0);assert.equal(g.rice.cooldown,10);
  }
  const g=quiet();g.activateRice();g.cancelRice();step(g,1);assert.equal(g.cancelRice(),false);assert.ok(Math.abs(g.rice.cooldown-9)<1e-8);
});
test('incoming normal and boss shots return to their shooter without any hurt or hit-counter event',()=>{
  for(const type of ['reaper','boss']){
    const g=quiet(),shooter=target(g,7,0,type),b=bullet(g);b.sourceId=shooter.id;const hp=g.player.hp;g.activateRice();g.tick(.05);
    const returned=g.projectiles.find(b=>b.kind==='riceReturn');assert.ok(returned);assert.equal(b.life,0);assert.equal(returned.owner,'player');
    assert.equal(returned.heroId,'omsolo');assert.equal(returned.target,shooter.id);assert.equal(returned.damage,b.damage);
    assert.equal(returned.homing,undefined);assert.equal(returned.turnRate,undefined);assert.notEqual(returned.id,b.id);
    assert.ok(returned.vx>0);step(g,.5);assert.ok(shooter.hp<shooter.maxHp);assert.equal(g.player.hp,hp);assert.equal(g.runHits,0);assert.equal(g.stageTrial.hits,0);
    assert.equal(shooter.riceHeld,undefined);assert.equal(shooter.riceThrown,undefined);assert.equal(g.drainEvents().some(e=>e.type==='hurt'),false);
  }
});
test('a single activation reflects repeated homing shots throughout its five-second window',()=>{
  const g=quiet(),shooter=target(g,9,0);g.activateRice();
  for(let i=0;i<5;i++){const b=bullet(g);b.sourceId=shooter.id;step(g,.2);assert.equal(b.life,0);}
  assert.equal(g.rice.active,true);assert.equal(g.drainEvents().filter(e=>e.type==='riceReflected').length,5);assert.equal(g.runHits,0);
});
test('swept reflection catches a fast shot crossing the entire player between frames',()=>{
  const g=quiet(),shooter=target(g,12,0),b=bullet(g,10,0);Object.assign(b,{vx:-400,homing:0,speed:400,sourceId:shooter.id});
  g.activateRice();g.tick(.05);assert.equal(b.life,0);assert.equal(g.runHits,0);assert.equal(g.projectiles.find(b=>b.kind==='riceReturn').target,shooter.id);
});
test('reflection falls back to another living enemy when the original shooter is absent',()=>{
  const g=quiet(),e=target(g,7,0),b=bullet(g);b.sourceId=-1;g.activateRice();g.tick(.05);
  assert.equal(g.projectiles.find(b=>b.kind==='riceReturn').target,e.id);step(g,.5);assert.ok(e.hp<e.maxHp);
  const empty=quiet(),orphan=bullet(empty);empty.activateRice();empty.tick(.05);const returned=empty.projectiles.find(b=>b.kind==='riceReturn');
  assert.ok(returned.vx>0);assert.equal(returned.target,undefined);assert.equal(orphan.life,0);assert.equal(empty.runHits,0);
});
test('distant shots and friendly projectiles are not reflected; enemy bodies and ground hazards remain dangerous',()=>{
  const g=quiet();target(g,7,0);g.activateRice();const distant=bullet(g,5,0);distant.homing=0;distant.vx=8;g.tick(.05);assert.ok(distant.life>0);
  const friend=bullet(g);friend.owner='player';friend.heroId='omsolo';friend.homing=0;g.tick(.05);assert.equal(friend.kind,'arrow');assert.ok(friend.life>0);
  const body=target(g,0,0);body.attack=0;g.tick(.05);assert.equal(g.runHits,1);assert.equal(body.riceHeld,undefined);
  const ground=quiet();target(ground,7,0);ground.activateRice();hazard(ground,0,0);step(ground,1);assert.equal(ground.runHits,1);assert.equal(ground.rice.active,true);
});
test('without an active reflection or during cooldown, incoming projectiles still damage Omsolo',()=>{
  for(const cooldown of [false,true]){const g=quiet();target(g,7,0);if(cooldown){g.activateRice();g.cancelRice();}bullet(g,1,0);step(g,.1);assert.equal(g.runHits,1);assert.ok(g.player.hp<g.player.maxHp);}
});
test('a level-50 solo Omsolo can clear all six trial waves before learning rice',()=>{
  const g=new Adventure({act:23,seed:1,progression:profile(),party:['nyanluna','tsukineko'],hero:1});const seen=new Set();
  for(let frame=0;frame<60*600;frame++){
    while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;
    seen.add(g.area);g.tick(1/60,botInput(g));g.drainEvents();
  }
  console.log('RICE SOLO RUN',JSON.stringify({phase:g.phase,wave:g.wave,seconds:Math.round(g.time),hits:g.runHits,hp:Math.round(g.player.hp)}));
  assert.equal(g.phase,'victory');assert.equal(g.kills,RICE_QUEST.counts.reduce((a,b)=>a+b));assert.equal(seen.size,3);assert.equal(hasRicePower(g.progression),true);
});
