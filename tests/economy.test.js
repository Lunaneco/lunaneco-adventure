import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,xpRequired,unlockTalent} from '../src/progression.js';
import {enemyMaterials,gateMaterials,MATERIAL_DROP_CHANCE,FIRST_TIER_NODES} from '../src/talents.js';
import {ENEMY_TYPES} from '../src/enemies.js';
import {missionsForAct} from '../src/missions.js';
import {drawWeapon} from '../src/weapons.js';
import {weaponGachaView} from '../src/weapons-ui.js';
const story={version:2,actClears:Array(8).fill(true)};
const kill=(g,type='moss')=>{const e=g.spawnEnemy(type,10,10);g.hit(e,999999,0,0);return e;};

test('level pacing doubles early requirements and increases the relative hurdle after level 20',()=>{
  let previousRatio=2;
  for(let level=1;level<50;level++){
    const ratio=xpRequired(level)/(24+level*12);
    assert.ok(Number.isInteger(xpRequired(level))&&xpRequired(level)>0);
    if(level<=20)assert.equal(ratio,2);else assert.ok(ratio>previousRatio);
    previousRatio=ratio;
  }
  assert.equal(xpRequired(30),868);assert.equal(xpRequired(40),1408);
  const g=new Adventure({party:['nyanluna'],seed:17});g.enemies=[];
  for(let i=0;i<12;i++)kill(g);assert.equal(g.progressFor(0).level,1);
  for(let i=0;i<12;i++)kill(g);assert.equal(g.progressFor(0).level,2);assert.equal(g.progressFor(0).xp,0);
});

test('every regular enemy has exactly 50% material odds; a missed drop still gives full XP and crystals',()=>{
  assert.equal(MATERIAL_DROP_CHANCE,.5);
  for(const [type,spec] of Object.entries(ENEMY_TYPES).filter(([,s])=>!s.rare)){
    let drops=0,buds=0;
    for(let i=0;i<100;i++){const rewards=enemyMaterials({type},0,'normal',()=>(i+.5)/100);if(rewards.starBud)drops++;buds+=rewards.starBud??0;}
    assert.equal(drops,50);assert.equal(buds,spec.buds*50);
  }
  const g=new Adventure({seed:1,party:['nyanluna']});g.materialRng=()=>.5;
  const e=kill(g);assert.equal(g.progressFor(0).xp,3);assert.equal(g.orbs[0].value,1);assert.equal(g.earnedMaterials.starBud,0);
  g.materialRng=()=>0;g.hit(e,999999,0,0);assert.equal(g.earnedMaterials.starBud,0);
  kill(g);assert.equal(g.earnedMaterials.starBud,1);assert.equal(g.progressFor(0).xp,6);
});

test('material rolls do not alter enemy behavior or weapon-ticket randomness; boss cores remain guaranteed',()=>{
  const a=new Adventure({seed:31}),b=new Adventure({seed:31});
  a.materialRng=()=>0;b.materialRng=()=>1;
  for(let i=0;i<30;i++){kill(a);kill(b);}
  assert.equal(a.rng(),b.rng());assert.equal(a.lootRng(),b.lootRng());
  kill(a,'boss');kill(b,'boss');assert.equal(a.earnedWeaponTickets,b.earnedWeaponTickets);
  assert.equal(a.earnedMaterials.wardenCore,1);assert.equal(b.earnedMaterials.wardenCore,1);
  assert.deepEqual(enemyMaterials({type:'boss'},4,'normal',()=>{throw Error('boss rewards must not roll');}),{starBud:3,wardenCore:1,astralCore:1});
});

test('full-act gate rewards are three dew of each eligible rarity and mission bonuses remain one-time',()=>{
  for(const [act,mode,rare] of [[0,'normal',false],[0,'hard',true],[4,'normal',true]]){
    const total={};for(let area=0;area<3;area++)for(const [id,n] of Object.entries(gateMaterials(area,act,mode)))total[id]=(total[id]??0)+n;
    assert.deepEqual(total,rare?{moonDew:3,moonPrism:3}:{moonDew:3});
  }
  const g=new Adventure({seed:2,progression:{story},act:0});
  for(const m of missionsForAct(0))if(!m.trial)g.progression.missions.stages[m.area][m.metric]=m.goal;
  g.claimMissions();assert.equal(g.earnedMaterials.starBud,39);assert.equal(g.earnedMaterials.moonDew,4);
  const before=structuredClone(g.progression);g.claimMissions();assert.deepEqual(g.progression,before);
});

test('existing levels, banked XP, unlocked trees and saved materials survive the new reward balance',()=>{
  const raw={story,characters:{nyanluna:{level:20,xp:400,breaks:0,tree:FIRST_TIER_NODES.map(n=>n.id)},tsukineko:{level:40,xp:100,breaks:2}},inventory:{limitStone:3,starBud:5000,moonDew:300,wardenCore:40,moonPrism:216,astralCore:66}};
  const p=normalizeProgression(raw,HEROES);assert.deepEqual(p.characters.nyanluna,raw.characters.nyanluna);
  for(const [id,count] of Object.entries(raw.inventory))assert.equal(p.inventory[id],count);
  assert.equal(p.characters.tsukineko.level,40);assert.equal(p.characters.tsukineko.xp,100);
  const reloaded=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.deepEqual(reloaded,p);
  assert.ok(unlockTalent(p,'nyanluna','limit30'));assert.equal(p.characters.nyanluna.level,20);assert.equal(p.characters.nyanluna.xp,400);
});

test('old gacha history retains the amount paid then, while a new duplicate saves the lower actual amount',()=>{
  const p=normalizeProgression({inventory:{weaponTicket:1,starBud:100},weapons:{version:2,owned:['luna-staff-r4'],lastDraw:{weaponId:'luna-staff-r4',duplicate:true}}},HEROES);
  assert.equal(p.weapons.lastDraw.duplicateBuds,100);assert.equal(p.inventory.starBud,100);
  assert.match(weaponGachaView(p),/重複 → 星の芽 ×100/);
  const rolls=[0,.99,0],draw=drawWeapon(p,()=>rolls.shift());assert.equal(draw.duplicateBuds,50);
  assert.equal(p.inventory.starBud,150);assert.equal(p.weapons.lastDraw.duplicateBuds,50);
  const restored=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.deepEqual(restored,p);assert.match(weaponGachaView(restored),/重複 → 星の芽 ×50/);
});
