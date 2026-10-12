import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {ACTS,actFor,isActUnlocked} from '../src/acts.js';
import {HEHE_EXTRA_ID,PARESIS_EXTRA_ID,extraCombatFor} from '../src/extra-stages.js';
import {darkHeheWave,finaleMemberDialog,DARK_HEHE_NAME} from '../src/dark-paresis.js';
import {LEGENDARY_UNIQUE} from '../src/chapter-unique-equipment.js';
import {UNIQUE_EQUIPMENT} from '../src/equipment.js';
import {stageSelectionView,stageBriefingView} from '../src/stage-selection-ui.js';
import {equipmentView} from '../src/rewards-ui.js';
import {fieldFor,contains} from '../src/terrain.js';
import {floorPatchesFor} from '../src/special-floors.js';

const ready=()=>normalizeProgression({
  story:{version:2,actClears:Array.from({length:50},(_,i)=>i<=45)},
  characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:100,breaks:8}])),
  equipment:{owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}},
},HEROES);
const gate=g=>{g.phase='playing';g.area=2;g.wave=6;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.equal(g.crossExit(),true);};

test('chapter 10 extra is level 100, uses the tower, and guarantees the rare on wave 1',()=>{
  const act=actFor(PARESIS_EXTRA_ID);
  assert.equal(act.chapter,9);assert.equal(act.recommendedLevel,100);assert.equal(act.towerExtra,true);assert.equal(act.roster,'paresis');
  assert.equal(isActUnlocked(ready(),PARESIS_EXTRA_ID),true);
  const locked=ready();locked.story.actClears[45]=false;assert.equal(isActUnlocked(locked,PARESIS_EXTRA_ID),false);
  assert.equal(darkHeheWave(act,()=>{throw Error('must not roll');}),1);
  assert.equal(darkHeheWave(actFor(42),()=>.99),null);
  assert.equal(darkHeheWave(actFor(42),()=>0),1);
  const g=new Adventure({act:PARESIS_EXTRA_ID,progression:ready(),party:['nyanluna','tsukineko'],seed:3});
  assert.deepEqual([...g.party],['nyanluna','tsukineko']);assert.equal(g.wave,1);assert.equal(g.darkHeheWave,1);
  g.spawn();g.spawn();assert.equal(g.enemies.some(e=>e.name===DARK_HEHE_NAME),false);g.spawn();
  const rares=g.enemies.filter(e=>e.name===DARK_HEHE_NAME);assert.equal(rares.length,1);assert.equal(g.spawnDarkHehe(),null);
  for(let area=0;area<3;area++)for(const room of fieldFor(PARESIS_EXTRA_ID,area).rooms){
    assert.equal(room.shapeLabel,'ダークパレシス');
    assert.ok(contains(room,room.entrance.x,room.entrance.z,.85),room.id);
    assert.ok(floorPatchesFor(room).length>=2,room.id);
  }
  const brief=stageBriefingView(PARESIS_EXTRA_ID,'hard',ready());
  assert.match(brief,/Lv\.100/);assert.match(brief,/WAVE 1/);assert.match(brief,/瘴金のへへへ/);
  const hehe=actFor(HEHE_EXTRA_ID),tower=act,heheCombat=extraCombatFor(hehe),towerCombat=extraCombatFor(tower),ratio=(a,b)=>a/b;
  assert.equal(tower.bossHp,hehe.bossHp*1.3);assert.equal(tower.hpScale,hehe.hpScale*1.3);
  assert.equal(tower.damageScale*(tower.menace??1),hehe.damageScale*(hehe.menace??1)*1.3);
  for(let i=0;i<5;i++)assert.equal(tower.counts[i],Math.round(hehe.counts[i]*1.3));
  assert.ok(Math.abs(ratio(towerCombat.cooldownRate,heheCombat.cooldownRate)-1.3)<.01);
  assert.ok(Math.abs(ratio(heheCombat.telegraphScale,towerCombat.telegraphScale)-1.3)<.01);
  assert.ok(Math.abs(ratio(towerCombat.moveScale,heheCombat.moveScale)-1.3)<.01);
  assert.ok(Math.abs(ratio(towerCombat.projectileScale,heheCombat.projectileScale)-1.3)<.01);
  assert.ok(Math.abs(ratio(heheCombat.spawnScale,towerCombat.spawnScale)-1.3)<.01);
  const prior=ready();
  const heheRun=new Adventure({act:HEHE_EXTRA_ID,progression:prior,party:['nyanluna','tsukineko'],seed:3});
  const towerBoss=g.spawnEnemy('boss',0,-8),heheBoss=heheRun.spawnEnemy('boss',0,-8);
  assert.ok(Math.abs(towerBoss.hp/heheBoss.hp-1.3)<.01);assert.ok(Math.abs(towerBoss.damage/heheBoss.damage-1.3)<.01);
});

test('the first chapter 10 extra clear grants the legendary unique once',()=>{
  for(const item of UNIQUE_EQUIPMENT)if(item.id!==LEGENDARY_UNIQUE.id){
    assert.ok((item.bonus.hp??0)<LEGENDARY_UNIQUE.bonus.hp,item.id);
    assert.ok((item.bonus.attack??0)<LEGENDARY_UNIQUE.bonus.attack,item.id);
    assert.ok((item.bonus.defense??0)<LEGENDARY_UNIQUE.bonus.defense,item.id);
  }
  const before=ready();
  assert.match(equipmentView(before,'nyanluna','unique'),/八光還りの塔冠/);
  assert.match(equipmentView(before,'nyanluna','unique'),/eight-light-crown-v1\.png/);
  assert.match(equipmentView(before,'nyanluna','unique'),/未入手/);
  assert.equal(equipmentView(before,'nyanluna','unique').includes('data-equip-item="eight-light-crown"'),false);
  const g=new Adventure({act:PARESIS_EXTRA_ID,progression:before,party:['shizuku','prim'],seed:4});
  gate(g);
  assert.equal(g.phase,'victory');assert.equal(g.earnedUnique,LEGENDARY_UNIQUE.id);
  assert.deepEqual(g.progression.equipment.owned,['meadow-charm',LEGENDARY_UNIQUE.id]);
  assert.equal(g.progression.equipment.loadout.nyanluna,'meadow-charm');
  assert.match(equipmentView(g.progression,'shizuku','unique'),/data-equip-item="eight-light-crown"/);
  const again=new Adventure({act:PARESIS_EXTRA_ID,progression:g.progression,party:['lumi'],seed:5});
  gate(again);
  assert.equal(again.earnedUnique,undefined);
  assert.equal(again.progression.equipment.owned.filter(id=>id===LEGENDARY_UNIQUE.id).length,1);
  assert.ok(again.progression.equipment.owned.includes('meadow-charm'));
});

test('chapter 11 opens a member selection screen above the acts',()=>{
  const profile=ready();
  const view=stageSelectionView(10,profile);
  assert.ok(view.indexOf('kephia-board')<view.indexOf('journey-acts'));
  const dialog=finaleMemberDialog(profile);
  assert.match(dialog,/終章のメンバー/);
  for(const hero of ['にゃんるな','つきねこ','オムソロ','もちにゃふぇ','雫','プリム','へへりある','るみ'])assert.match(dialog,new RegExp(hero));
});
