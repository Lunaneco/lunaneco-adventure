import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {CHAPTER_UNIQUE_EQUIPMENT} from '../src/chapter-unique-equipment.js';
import {UNIQUE_EQUIPMENT,equipmentImage,equipUnique} from '../src/equipment.js';
import {STAGE_MISSIONS,missionIndex} from '../src/missions.js';
import {equipmentView,missionsView} from '../src/rewards-ui.js';
import {equippedWeapon} from '../src/weapons.js';
const profile=()=>normalizeProgression({story:{version:2,actClears:Array(32).fill(true)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}},HEROES);
const gate=g=>{g.area=2;g.wave=6;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.ok(g.crossExit());};

test('chapters six and seven each have four distinct generated unique items, preserving mission IDs and rewards',()=>{
 assert.equal(CHAPTER_UNIQUE_EQUIPMENT.length,8);assert.equal(UNIQUE_EQUIPMENT.length,30);assert.equal(STAGE_MISSIONS.length,381);
 assert.deepEqual(CHAPTER_UNIQUE_EQUIPMENT.map(r=>r.act),[24,25,26,27,28,29,30,31]);assert.equal(new Set(CHAPTER_UNIQUE_EQUIPMENT.map(r=>equipmentImage(r.id))).size,8);
 for(const relic of CHAPTER_UNIQUE_EQUIPMENT){
  const mission=STAGE_MISSIONS.find(m=>m.equipment===relic.id);assert.equal(mission.id,`act${relic.act+1}-relic`);assert.equal(mission.area,2);assert.equal(mission.trial.seconds,420+(relic.act%4)*20);assert.equal(mission.trial.hits,1);assert.equal(mission.trial.chapter,true);assert.deepEqual(mission.rewards,{bloodCrystal:6,demonHeart:2});
  assert.equal(equipmentImage(relic.id),`/${relic.image}`);const png=readFileSync('public'+equipmentImage(relic.id));assert.ok(png.length>10000);assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.ok(png.readUInt32BE(16)>=512&&png.readUInt32BE(20)>=512);
 }
});

for(const relic of CHAPTER_UNIQUE_EQUIPMENT)test(`${relic.name}: full challenge gate awards once at the boundary, never for normal/late/excess-hit/retreat`,()=>{
 const mission=STAGE_MISSIONS.find(m=>m.equipment===relic.id);
 for(const [difficulty,extra,hits,success] of [['hard',0,1,true],['hard',.001,1,false],['hard',0,2,false],['normal',0,0,false]]){
  const g=new Adventure({act:relic.act,progression:profile(),difficulty,party:['hehereal','lumi']});g.time=mission.trial.seconds+extra;g.runHits=hits;
  assert.ok(!g.progression.equipment.owned.includes(relic.id));gate(g);assert.equal(g.progression.equipment.owned.includes(relic.id),success);assert.equal(g.earnedMissions.includes(mission.id),success);
  if(success){const saved=normalizeProgression(JSON.parse(JSON.stringify(g.progression)),HEROES),again=new Adventure({act:relic.act,progression:saved,difficulty:'hard'});again.time=1;gate(again);assert.equal(again.earnedMissions.includes(mission.id),false);assert.equal(again.progression.equipment.owned.filter(id=>id===relic.id).length,1);}
 }
 const retreat=new Adventure({act:relic.act,progression:profile(),difficulty:'hard'});retreat.area=2;retreat.wave=6;retreat.time=1;retreat.pendingTrials.add(mission.id);retreat.pause();assert.ok(!retreat.progression.equipment.owned.includes(relic.id));
});

test('previously claimed chapter six/seven trials restore missing gear once on load without repaying materials or changing loadouts',()=>{
 const raw=profile();raw.inventory.bloodCrystal=37;raw.inventory.demonHeart=11;raw.equipment={owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}};
 for(const relic of CHAPTER_UNIQUE_EQUIPMENT){raw.missions.stages[missionIndex(relic.act,2)].trials=1;raw.missions.claimed.push(`act${relic.act+1}-relic`);}
 const saved=normalizeProgression(raw,HEROES);assert.deepEqual(saved.inventory,raw.inventory);assert.deepEqual(saved.equipment.loadout,raw.equipment.loadout);assert.deepEqual(saved.equipment.owned,['meadow-charm',...CHAPTER_UNIQUE_EQUIPMENT.map(r=>r.id)]);assert.deepEqual(normalizeProgression(saved,HEROES),saved);
 const invalid=structuredClone(raw);for(const relic of CHAPTER_UNIQUE_EQUIPMENT)invalid.missions.stages[missionIndex(relic.act,2)].trials=0;assert.deepEqual(normalizeProgression(invalid,HEROES).equipment,raw.equipment);
 const unclaimed=structuredClone(raw);unclaimed.missions.claimed=[];assert.deepEqual(normalizeProgression(unclaimed,HEROES).equipment,raw.equipment);
});

test('all eight items transfer to every hero with owner-only combat stats and keep the bow, fingertip attack and Neko range',()=>{
 for(const relic of CHAPTER_UNIQUE_EQUIPMENT){let p=profile();p.equipment.owned=[relic.id];const before=HEROES.map(h=>combatStats(p,h));
  for(const [i,hero] of HEROES.entries()){
   assert.ok(equipUnique(p.equipment,hero.id,relic.id,{transfer:true}));p=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.deepEqual(Object.values(p.equipment.loadout),[relic.id]);
   for(const [j,h] of HEROES.entries()){const s=combatStats(p,h);if(i!==j){assert.deepEqual(s,before[j]);continue;}assert.equal(s.maxHp,before[j].maxHp+(relic.bonus.hp??0));assert.equal(s.defense,before[j].defense+(relic.bonus.defense??0));assert.equal(s.attack,before[j].attack*(1+(relic.bonus.attack??0)));}
  }
  const neko=new Adventure({act:29,progression:p,party:['lumi','mochinyafe'],hero:7});assert.equal(neko.attackProfile(7).range,Infinity);const normal=new Adventure({act:29,progression:p,party:['lumi','hehereal'],hero:7});assert.equal(normal.attackProfile(7).range,14);assert.equal(equippedWeapon(p,'hehereal').weapon.kind,'bow');assert.equal(equippedWeapon(p,'lumi').weapon.kind,'railgun');
 }
});

test('new rewards show their artwork, bonuses and conditions in missions, and only owned gear appears in inventory',()=>{
 const p=profile(),empty=equipmentView(p,'lumi','unique');
 for(const relic of CHAPTER_UNIQUE_EQUIPMENT){const html=missionsView(p,relic.act);assert.ok(html.includes(relic.name));assert.ok(html.includes(equipmentImage(relic.id)));assert.ok(!empty.includes(`data-equipment-card="${relic.id}"`));}
 p.equipment.owned=CHAPTER_UNIQUE_EQUIPMENT.map(r=>r.id);const owned=equipmentView(p,'lumi','unique');for(const r of CHAPTER_UNIQUE_EQUIPMENT)assert.ok(owned.includes(`data-equipment-card="${r.id}"`));
});
