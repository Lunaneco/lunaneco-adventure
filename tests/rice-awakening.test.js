import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,awardCharacterXp,xpRequired} from '../src/progression.js';
import {ACTS,PLAYABLE_ACTS,isActUnlocked,isActCleared,clearTicketReward} from '../src/acts.js';
import {RICE_QUEST,RICE_QUEST_ID,RICE_SCENES,hasRicePower} from '../src/rice-awakening.js';
import {RICE_RULES,riceTargets} from '../src/rice-combat.js';
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
  assert.deepEqual(g.progression.story,story);assert.deepEqual(g.progression.missions,missions);assert.equal(g.progression.story.actClears.length,32);assert.equal(g.progression.story.extraClears.length,3);
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
test('unlearned rice, other heroes, out-of-range targets and friendly attacks cannot be grabbed',()=>{
  for(const options of [{progression:profile(50,false)},{hero:0},{progression:profile(49,true)}]){const g=quiet(options),e=target(g,2,0);assert.equal(g.grabRice('enemy',e.id),false);}
  const g=quiet(),e=target(g,RICE_RULES.range+1,0);assert.equal(g.grabRice('enemy',e.id),false);
  const b=bullet(g);b.owner='player';assert.equal(g.grabRice('bullet',b.id),false);
  const h=hazard(g);h.damage=0;assert.equal(g.grabRice('hazard',h.id),false);
  assert.equal(g.grabRice('enemy',-1),false);
});
test('dragged enemy is suspended and swept impact damages another enemy once without moving the player',()=>{
  const g=quiet(),body=target(g,2,0),other=target(g,7,0),player={x:g.player.x,z:g.player.z};
  assert.ok(g.grabRice('enemy',body.id));assert.equal(g.grabRice('enemy',other.id),false);assert.equal(riceTargets(g).length,0);
  g.player.attack=0;step(g,.2);assert.equal(body.x,2);assert.equal(body.riceHeld,true);assert.equal(body.hp,body.maxHp);
  assert.ok(g.moveRice({x:9,z:0}));assert.ok(other.hp<other.maxHp);assert.equal(body.hp,body.maxHp);assert.equal(g.rice.held,null);assert.equal(body.riceHeld,false);
  assert.deepEqual({x:g.player.x,z:g.player.z},player);const hp=other.hp;assert.equal(g.moveRice({x:7,z:0}),false);assert.equal(other.hp,hp);assert.equal(g.grabRice('enemy',other.id),false);
});
test('enemy bullets and damaging telegraphs pause while held and are consumed on direct impact',()=>{
  for(const kind of ['bullet','hazard']){
    const g=quiet(),other=target(g,7,0),object=kind==='bullet'?bullet(g):hazard(g),remaining=object.life??object.timer;
    assert.ok(g.grabRice(kind,object.id));step(g,.2);assert.equal(object.x,2);assert.equal(object.life??object.timer,remaining);
    g.moveRice({x:9,z:0});assert.ok(other.hp<other.maxHp);assert.equal(object.riceHeld,false);assert.equal(object.life??object.timer,0);assert.equal(g.rice.held,null);
    // A consumed area warning must not explode on the player on the following tick.
    g.player.x=object.x;g.player.z=object.z;const health=g.player.hp;
    const hp=other.hp;step(g,.05);assert.equal(other.hp,hp);assert.equal(g.player.hp,health);assert.equal((kind==='bullet'?g.projectiles:g.hazards).includes(object),false);
  }
});
test('release throws bodies and returns attacks as friendly non-homing Omsolo damage',()=>{
  for(const kind of ['enemy','bullet','hazard']){
    const g=quiet(),other=target(g,8,0),object=kind==='enemy'?target(g,2,0):kind==='bullet'?bullet(g):hazard(g);
    g.grabRice(kind,object.id);g.moveRice({x:3,z:0});assert.ok(g.releaseRice());
    if(kind==='enemy')assert.ok(object.riceThrown);else{const returned=g.projectiles.find(b=>b.kind==='riceReturn');assert.equal(returned.owner,'player');assert.equal(returned.heroId,'omsolo');assert.equal(returned.homing,undefined);assert.equal(object.life??object.timer,0);assert.ok(returned.vx>0);}
    step(g,.4);assert.ok(other.hp<other.maxHp);assert.equal(g.player.hp,g.player.maxHp);
  }
});
test('holds expire and cancellation covers pause, upgrade, switching and death',()=>{
  const timed=quiet(),body=target(timed,2,0);timed.grabRice('enemy',body.id);step(timed,RICE_RULES.holdSeconds+.05);assert.equal(timed.rice.held,null);assert.equal(body.riceHeld,false);
  for(const finish of [g=>g.pause(),g=>g.switchHero(),g=>{g.pendingBlessings=1;g.offerSkills();},g=>g.hurt(1e9,0,0)]){
    const g=quiet(),e=target(g,2,0);g.grabRice('enemy',e.id);finish(g);assert.equal(g.rice.held,null);assert.equal(e.riceHeld,false);
  }
  const g=quiet(),e=target(g,2,0);g.grabRice('enemy',e.id);assert.equal(g.moveRice({x:NaN,z:0}),false);g.moveRice({x:999,z:999});assert.ok(Math.hypot(e.x,e.z)<=RICE_RULES.range+.001);assert.ok(contains(g.walkLayout,e.x,e.z));
  for(const kind of ['bullet','hazard']){const run=quiet(),object=kind==='bullet'?bullet(run):hazard(run);run.grabRice(kind,object.id);if(kind==='bullet')object.life=0;else object.timer=0;step(run,.05);assert.equal(run.rice.held,null);assert.equal(object.life??object.timer,0);}
});
test('boss bodies cannot be grabbed, but their ranged attacks can be returned and other enemies can hit them',()=>{
  for(const kind of ['bullet','hazard','enemy']){
    const g=quiet(),boss=target(g,7,0,'boss');assert.equal(riceTargets(g).some(t=>t.kind==='enemy'&&t.object===boss),false);assert.equal(g.grabRice('enemy',boss.id),false);
    const object=kind==='bullet'?bullet(g):kind==='hazard'?hazard(g):target(g,2,0);
    if(kind!=='enemy')object.sourceId=boss.id;
    assert.equal(g.grabRice(kind,object.id),true);g.moveRice({x:9,z:0});assert.ok(boss.hp<boss.maxHp);assert.equal(g.rice.held,null);assert.equal(boss.riceHeld,undefined);
  }
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
