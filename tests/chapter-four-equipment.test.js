import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {UNIQUE_EQUIPMENT,equipmentImage,equipUnique} from '../src/equipment.js';
import {STAGE_MISSIONS,missionIndex} from '../src/missions.js';
import {missionsView,equipmentView} from '../src/rewards-ui.js';
const relics=UNIQUE_EQUIPMENT.filter(e=>e.act>=12&&e.act<16);
const profile=()=>normalizeProgression({story:{version:2,actClears:Array(20).fill(true)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}},HEROES);
function gate(g){g.area=2;g.wave=6;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.ok(g.crossExit());}
test('chapter-four challenge gates grant four distinct relics once and retain the original rarity-three materials',()=>{
 assert.equal(relics.length,4);assert.equal(UNIQUE_EQUIPMENT.length,30);
 for(const relic of relics){
  const mission=STAGE_MISSIONS.find(m=>m.equipment===relic.id);assert.equal(mission.id,`act${relic.act+1}-relic`);assert.deepEqual(mission.rewards,{bloodCrystal:6,demonHeart:2});
  for(const [difficulty,extraTime,hits,success] of [['hard',0,1,true],['hard',.001,1,false],['hard',0,2,false],['normal',0,0,false]]){
   const g=new Adventure({act:relic.act,progression:profile(),difficulty});g.time=mission.trial.seconds+extraTime;g.runHits=hits;gate(g);
   assert.equal(g.progression.equipment.owned.includes(relic.id),success);assert.equal(g.earnedMissions.includes(mission.id),success);
   if(success){
    assert.deepEqual(g.drainEvents().find(e=>e.type==='missionComplete'&&e.id===mission.id).rewards,mission.rewards);
    const saved=normalizeProgression(JSON.parse(JSON.stringify(g.progression)),HEROES);const again=new Adventure({act:relic.act,progression:saved,difficulty:'hard'});gate(again);
    assert.equal(again.earnedMissions.includes(mission.id),false);assert.equal(again.progression.equipment.owned.filter(id=>id===relic.id).length,1);
   }
  }
 }
});
test('claimed fourth-chapter trials recover missing relics once without paying materials again or changing equipped items',()=>{
 const raw=profile();raw.inventory.bloodCrystal=37;raw.inventory.demonHeart=11;raw.equipment={owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}};
 for(const relic of relics){raw.missions.stages[missionIndex(relic.act,2)].trials=1;raw.missions.claimed.push(`act${relic.act+1}-relic`);}
 const restored=normalizeProgression(raw,HEROES);assert.deepEqual(restored.inventory,raw.inventory);assert.deepEqual(restored.equipment.loadout,raw.equipment.loadout);
 assert.deepEqual(restored.equipment.owned,['meadow-charm',...relics.map(r=>r.id)]);assert.deepEqual(normalizeProgression(restored,HEROES),restored);
 const unclaimed=structuredClone(raw);unclaimed.missions.claimed=[];assert.deepEqual(normalizeProgression(unclaimed,HEROES).equipment,raw.equipment);
 const invalid=structuredClone(raw);for(const relic of relics)invalid.missions.stages[missionIndex(relic.act,2)].trials=0;
 assert.deepEqual(normalizeProgression(invalid,HEROES).equipment,raw.equipment);
});
test('new relics apply their bonuses only to the wearer, transfer to every hero, and survive save reload',()=>{
 for(const relic of relics){let p=profile();p.equipment.owned=[relic.id];const before=HEROES.map(h=>combatStats(p,h));
  for(const [i,hero] of HEROES.entries()){
   assert.ok(equipUnique(p.equipment,hero.id,relic.id,{transfer:true}));p=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.deepEqual(Object.values(p.equipment.loadout),[relic.id]);
   for(const [j,h] of HEROES.entries()){
    const stats=combatStats(p,h);if(i!==j){assert.deepEqual(stats,before[j]);continue;}
    assert.equal(stats.maxHp,before[j].maxHp+(relic.bonus.hp??0));assert.equal(stats.defense,before[j].defense+(relic.bonus.defense??0));assert.equal(stats.attack,before[j].attack*(1+(relic.bonus.attack??0)));
   }
  }
 }
});
test('missions show every new relic image and effect, while inventory shows only legitimately owned rewards',()=>{
 const p=profile();const missions=missionsView(p,12);const empty=equipmentView(p,'shizuku','unique');
 for(const relic of relics){assert.ok(missions.includes(relic.name));assert.ok(missions.includes(equipmentImage(relic.id)));assert.ok(!empty.includes(`data-equipment-card="${relic.id}"`));}
 p.equipment.owned=[relics[0].id];const owned=equipmentView(p,'shizuku','unique');assert.ok(owned.includes(`data-equipment-card="${relics[0].id}"`));assert.ok(!owned.includes(`data-equipment-card="${relics[1].id}"`));
});
