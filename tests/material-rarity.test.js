import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,unlockTalent,talentStatus,grantMaterials} from '../src/progression.js';
import {MATERIALS,FIRST_TIER_NODES,SECOND_TIER_NODES,TALENT_NODES,tierMaterialCost} from '../src/talents.js';
import {missionsForAct} from '../src/missions.js';
const story={version:2,actClears:Array(8).fill(true)};
const game=(act=0,difficulty='normal',progression={story})=>new Adventure({act,difficulty,progression,seed:43});
function gate(g,area){g.area=area;g.wave=(area+1)*2;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,{x:g.exitPoint.x,z:g.exitPoint.z});assert.ok(g.crossExit());const saved=structuredClone(g.progression);assert.equal(g.crossExit(),false);assert.deepEqual(g.progression,saved);if(area<2)g.advanceStage();}
function kill(g,elite=false){const e=g.spawnEnemy('boss',0,5,{elite});g.hit(e,999999,0,0);const saved=structuredClone(g.progression);g.hit(e,999999,0,0);assert.deepEqual(g.progression,saved);}

test('all first-tier stars unlock using only rarity 1; every second-tier star requires both rarities',()=>{
  const cost=tierMaterialCost(FIRST_TIER_NODES);assert.deepEqual(cost,{starBud:100,moonDew:10,wardenCore:1});
  const p=normalizeProgression({characters:{nyanluna:{level:30,breaks:1}},inventory:cost},HEROES);
  for(const node of FIRST_TIER_NODES){assert.ok(Object.keys(node.cost).every(id=>MATERIALS[id].rarity===1));assert.ok(unlockTalent(p,'nyanluna',node.id));}
  assert.equal(p.inventory.moonPrism,0);assert.equal(p.inventory.astralCore,0);
  for(const node of SECOND_TIER_NODES){assert.deepEqual(new Set(Object.keys(node.cost).map(id=>MATERIALS[id].rarity)),new Set([1,2]));}
});
test('large rarity 1 reserves cannot replace rarity 2 or partially pay for an advanced star',()=>{
  const p=normalizeProgression({characters:{nyanluna:{level:30,breaks:1,tree:FIRST_TIER_NODES.map(n=>n.id)}},inventory:{starBud:99999,moonDew:99999,wardenCore:99999,limitStone:3}},HEROES),before=structuredClone(p);
  assert.deepEqual(talentStatus(p,'nyanluna','ascension').missing,[{id:'moonPrism',needed:12,owned:0},{id:'astralCore',needed:4,owned:0}]);assert.equal(unlockTalent(p,'nyanluna','ascension'),false);assert.deepEqual(p,before);
  grantMaterials(p,{moonPrism:12,astralCore:4});assert.ok(unlockTalent(p,'nyanluna','ascension'));assert.equal(p.inventory.moonPrism,0);assert.equal(p.inventory.astralCore,0);assert.equal(p.inventory.moonDew,99999);assert.equal(p.inventory.wardenCore,99999);assert.equal(p.inventory.limitStone,3);
});
test('legacy saves retain fully upgraded trees and old inventory without recharging or inventing rare items',()=>{
  const raw={story,characters:{nyanluna:{level:50,breaks:3,xp:0,tree:TALENT_NODES.filter(n=>n.level<=50).map(n=>n.id)}},inventory:{starBud:84,moonDew:9,wardenCore:7,limitStone:2}},p=normalizeProgression(raw,HEROES);
  assert.deepEqual(p.characters.nyanluna,raw.characters.nyanluna);assert.deepEqual(p.inventory,{bloodCrystal:0,demonHeart:0,...raw.inventory,moonPrism:0,astralCore:0,weaponTicket:0});const before=structuredClone(p);assert.equal(unlockTalent(p,'nyanluna','ascension'),false);assert.deepEqual(p,before);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
});
test('chapter 1 normal bosses and gates grant only rarity 1; XP and crystals stay separate',()=>{
  const g=game();kill(g);gate(g,0);assert.equal(g.progression.inventory.starBud,3);assert.equal(g.progression.inventory.wardenCore,1);assert.equal(g.progression.inventory.moonDew,1);assert.equal(g.earnedMaterials.moonPrism,0);assert.equal(g.earnedMaterials.astralCore,0);assert.equal(g.earnedXp.nyanluna,60);assert.equal(g.totalCrystals,0);
});
test('every chapter 2 and challenge gate adds rare dew once while keeping ordinary drops',()=>{
  for(const [act,mode] of [[0,'hard'],[3,'hard'],[4,'normal'],[7,'normal'],[7,'hard']]){
    const g=game(act,mode);for(const area of [0,1,2])gate(g,area);
    const rewards=g.drainEvents().filter(e=>e.type==='materials'&&e.source==='gate');assert.deepEqual(rewards.map(e=>e.amounts),[{moonDew:1,moonPrism:1},{moonDew:1,moonPrism:1},{moonDew:1,moonPrism:1}]);assert.equal(g.phase,'victory');
  }
});
test('rarity 2 cores come from chapter 2, challenge or branch bosses, once per boss without stacking qualifiers',()=>{
  for(const [act,mode,elite] of [[0,'hard',false],[4,'normal',false],[0,'normal',true],[7,'hard',true]]){const g=game(act,mode);kill(g,elite);assert.equal(g.earnedMaterials.astralCore,1);assert.equal(g.earnedMaterials.wardenCore,elite?2:1);}
  const g=game(4);const e=g.spawnEnemy('boss',0,5);e.training=true;g.hit(e,999999,0,0);assert.equal(g.earnedMaterials.astralCore,0);
});
test('rare materials remain farmable on replay after every mission was claimed; they survive save reload',()=>{
  let p={story};for(let run=1;run<=2;run++){const g=game(0,'hard',p);kill(g);for(const area of [0,1,2])gate(g,area);p=normalizeProgression(JSON.parse(JSON.stringify(g.progression)),HEROES);assert.equal(p.inventory.moonPrism,run*3);assert.equal(p.inventory.astralCore,run);}
});
test('chapter 2 rare mission bonuses wait for the final gate and cannot be claimed twice',()=>{
  const g=game(4);gate(g,0);assert.equal(g.earnedMaterials.moonPrism,1);assert.equal(g.earnedMissions.length,0);gate(g,1);gate(g,2);assert.equal(g.earnedMaterials.moonPrism,5);assert.equal(g.earnedMaterials.astralCore,1);assert.ok(missionsForAct(4).filter(m=>m.metric==='clears').every(m=>g.earnedMissions.includes(m.id)));
  const before=structuredClone(g.progression);g.claimMissions();assert.deepEqual(g.progression,before);
  const replay=game(4,'normal',g.progression);for(const area of [0,1,2])gate(replay,area);assert.equal(replay.earnedMaterials.moonPrism,3);assert.equal(replay.earnedMaterials.astralCore,0);
});
test('new rare inventory keys sanitize invalid values and reject invalid grants',()=>{
  const p=normalizeProgression({inventory:{moonPrism:-10,astralCore:'99'}},HEROES);assert.equal(p.inventory.moonPrism,0);assert.equal(p.inventory.astralCore,0);grantMaterials(p,{moonPrism:NaN,astralCore:Infinity});assert.equal(p.inventory.moonPrism,0);assert.equal(p.inventory.astralCore,0);grantMaterials(p,{moonPrism:2.8,astralCore:1});assert.equal(p.inventory.moonPrism,2);assert.equal(p.inventory.astralCore,1);
});

test('previously claimed chapter 2 missions keep their rewards, and new rare missions remain separately claimable',()=>{
  const previous=normalizeProgression({story},HEROES),old=missionsForAct(4).filter(m=>!m.id.endsWith('rare-material'));
  for(const m of old){previous.missions.stages[m.act*3+m.area][m.metric]=m.goal;previous.missions.claimed.push(m.id);}
  const normalized=normalizeProgression(previous,HEROES);assert.deepEqual(normalized.missions.claimed,previous.missions.claimed);assert.ok(old.every(m=>!m.rewards.moonPrism&&!m.rewards.astralCore));
  const g=game(4,'normal',normalized);for(const area of [0,1,2])gate(g,area);assert.equal(g.earnedMissions.length,3);assert.ok(g.earnedMissions.every(id=>id.endsWith('rare-material')));assert.equal(g.earnedMaterials.moonPrism,5);assert.equal(g.earnedMaterials.astralCore,1);
});
