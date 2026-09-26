import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Box3,Group,Vector3} from 'three';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {WEAPON_CATALOG,drawWeapon,equipWeapon,equippedWeapon,weaponAttackProfile,weaponImage} from '../src/weapons.js';
import {UNIQUE_EQUIPMENT,equipmentImage,equipUnique} from '../src/equipment.js';
import {STAGE_MISSIONS,missionIndex} from '../src/missions.js';
import {setHeroWeapon} from '../src/hero-assets.js';

const profile=()=>normalizeProgression({story:{version:2,actClears:Array(12).fill(true)},tutorial:{firstBattleCompleted:true},weapons:{version:2,owned:WEAPON_CATALOG.map(w=>w.id)}},HEROES);
function quiet({weapon='mochi-voice-r1',support=false}={}){
 const p=profile();assert.ok(equipWeapon(p,'mochinyafe',weapon));
 const g=new Adventure({act:11,seed:7,progression:p,hero:support?0:3,party:support?['nyanluna','mochinyafe']:['mochinyafe']});
 g.enemies=[];g.projectiles=[];g.hazards=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.rng=()=>1;
 Object.assign(g.player,{x:0,z:0,attack:999,invincible:999});Object.assign(g.partner,{x:0,z:0,attack:999});return g;
}
const target=(g,type='mochiGolem',z=6)=>Object.assign(g.spawnEnemy(type,0,z),{hp:1000,maxHp:1000,speed:0,attack:999,special:999});
function tick(g,seconds){for(let i=0;i<Math.ceil(seconds*60);i++)g.tick(1/60);}

test('old natural-voice loadouts and prior gacha results migrate without spending tickets or replacing gear',()=>{
 const p=profile();p.weapons.owned=p.weapons.owned.filter(w=>!w.startsWith('mochi-')||w==='mochi-voice-r1');
 p.weapons.loadout.mochinyafe='mochi-voice-r1';p.weapons.loadout.nyanluna='selene-staff-r3';p.weapons.lastDraw={weaponId:'selene-staff-r3',duplicate:false};p.weapons.draws=17;p.inventory.weaponTicket=8;
 const restored=normalizeProgression(p,HEROES);assert.equal(restored.inventory.weaponTicket,8);assert.deepEqual(restored.weapons,p.weapons);assert.equal(equippedWeapon(restored,'mochinyafe').weapon.name,'ふぇ鈴・もちの音');
});
test('Mochi gacha grants all nine new variants before recruitment, equips only after recruitment, and keeps draws unchanged',()=>{
 const p=normalizeProgression({inventory:{weaponTicket:9}},HEROES),ids=[];
 for(const rarity of [0,.75,.95])for(const family of [0,.34,.67]){
  const rolls=[.75,rarity,family],r=drawWeapon(p,()=>rolls.shift());ids.push(r.item.id);assert.equal(r.item.heroId,'mochinyafe');assert.equal(equipWeapon(p,'mochinyafe',r.item.id),false);
 }
 assert.equal(new Set(ids).size,9);assert.equal(p.inventory.weaponTicket,0);assert.equal(p.weapons.loadout.mochinyafe,'mochi-voice-r1');
 p.story.actClears=Array(12).fill(true);const restored=normalizeProgression(p,HEROES);
 for(const id of ids)assert.ok(equipWeapon(restored,'mochinyafe',id));assert.equal(restored.weapons.draws,9);
});
test('Mochi main sound notes hit moving regular and boss targets at range, without support statuses',()=>{
 for(const type of ['mochiSlime','mochiGoblin','mochiSkeleton','mochiOrc','mochiWolf','mochiGolem','mochiDragon','boss']){
  const g=quiet(),e=target(g,type);assert.ok(g.attackFrom(g.player,3));assert.equal(e.hp,1000);assert.equal(g.projectiles[0].kind,'mochiNote');
  for(let i=0;i<45;i++){e.x+=.025;g.tick(1/60);}
  assert.equal(e.hp,995,type);assert.equal(e.mochiStopUntil,undefined);assert.equal(e.mochiWeakenUntil,undefined);
 }
});
test('a weak main note always deals at least one damage, while range and actual collision are still required',()=>{
 const g=quiet(),e=target(g);const stats=g.statsFor.bind(g);g.statsFor=hero=>({...stats(hero),attack:.01});
 assert.ok(g.attackFrom(g.player,3));tick(g,.8);assert.equal(e.hp,999);
 const far=quiet();target(far,'mochiGoblin',12);assert.equal(far.attackFrom(far.player,3),false);assert.equal(far.projectiles.length,0);
 const miss=quiet(),escaped=target(miss);miss.attackFrom(miss.player,3);escaped.z=100;tick(miss,1);assert.equal(escaped.hp,1000);assert.equal(miss.projectiles.length,0);
});
test('all Mochi weapon variants affect real attack damage and cadence while Lv.1 remains weaker than other starters',()=>{
 for(const item of WEAPON_CATALOG.filter(w=>w.heroId==='mochinyafe')){
  const g=quiet({weapon:item.id}),e=target(g,'mochiGolem',4),expected=combatStats(g.progression,HEROES[3]).attack;
  assert.ok(expected<HEROES[0].damage);g.player.attack=0;g.tick(1/60);
  assert.equal(g.player.attack,weaponAttackProfile(g.progression,HEROES[3]).interval);tick(g,.4);
  assert.ok(Math.abs(1000-e.hp-expected)<1e-8,item.id);
 }
});
test('chime family changes support cadence, reach and actual penetration without altering stop strength',()=>{
 for(const [id,interval,range,pierce] of [['mochi-voice-r4',4,13,4],['mochi-lull-chime-r4',3.2,11.7,4],['mochi-echo-bell-r4',4.8,16.9,6]]){
  const g=quiet({weapon:id,support:true}),enemies=[3,5,7,9,11,13,15].map(z=>target(g,'mochiGoblin',z));
  const stats=g.attackProfile(3);assert.ok(Math.abs(stats.supportRange-range)<1e-8);g.partner.attack=0;g.tick(1/60);
  assert.equal(g.partner.attack,interval);g.partner.attack=999;assert.equal(g.projectiles[0].pierce,pierce);tick(g,1.4);
  assert.equal(enemies.filter(e=>e.hp<1000).length,pierce,id);
  assert.ok(enemies[0].mochiStopUntil>g.time);assert.ok(enemies[0].mochiStopUntil<2.2);
 }
});
test('three chime models attach to the non-humanoid Mochi rig and reuse the cached family on re-equip',()=>{
 const root=new Group(),rig=new Group(),empty=new Group();root.add(rig);rig.add(empty);root.userData={hero:3,rig,weapon:empty};const geometries=[];
 for(const id of ['mochi-voice-r1','mochi-lull-chime-r3','mochi-echo-bell-r4']){
  const item=WEAPON_CATALOG.find(w=>w.id===id);setHeroWeapon(root,item);const model=root.userData.weapon,box=new Box3().setFromObject(model);
  assert.equal(model.userData.family,item.weapon.id);assert.ok(!box.isEmpty());assert.ok(Number.isFinite(box.max.x));assert.equal(rig.children.length,1);
  geometries.push(box.getSize(new Vector3()).x);
  setHeroWeapon(root,item);assert.equal(root.userData.weapon,model);
 }
 assert.equal(new Set(geometries).size,3);
});
const relics=UNIQUE_EQUIPMENT.filter(e=>e.act>=8);
function gate(g){g.area=2;g.wave=6;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.ok(g.crossExit());}
test('each chapter-three trial awards its distinct relic once, with exact time, hit and difficulty gates',()=>{
 assert.equal(relics.length,4);
 for(const relic of relics){const mission=STAGE_MISSIONS.find(m=>m.equipment===relic.id);
  for(const [difficulty,extraTime,hits,success] of [['hard',0,1,true],['hard',.01,1,false],['hard',0,2,false],['normal',0,0,false]]){
   const g=new Adventure({act:relic.act,progression:profile(),difficulty});g.time=mission.trial.seconds+extraTime;g.runHits=hits;gate(g);
   assert.equal(g.progression.equipment.owned.includes(relic.id),success);
   const restored=normalizeProgression(g.progression,HEROES);assert.deepEqual(restored.equipment,g.progression.equipment);assert.deepEqual(restored.inventory,g.progression.inventory);
   if(success){const again=new Adventure({act:relic.act,progression:restored,difficulty:'hard'});gate(again);assert.equal(again.earnedMissions.includes(mission.id),false);assert.equal(again.progression.equipment.owned.filter(id=>id===relic.id).length,1);}
  }
 }
});
test('already-claimed chapter-three trials recover only their new relics without duplicating material rewards or replacing slots',()=>{
 const raw=profile();raw.inventory.astralCore=7;raw.inventory.moonPrism=19;raw.equipment={owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}};
 for(const relic of relics){const mission=STAGE_MISSIONS.find(m=>m.equipment===relic.id);raw.missions.stages[missionIndex(relic.act,2)].trials=1;raw.missions.claimed.push(mission.id);}
 const restored=normalizeProgression(raw,HEROES);assert.deepEqual(restored.inventory,raw.inventory);assert.deepEqual(restored.equipment.loadout,raw.equipment.loadout);
 for(const relic of relics)assert.ok(restored.equipment.owned.includes(relic.id));assert.deepEqual(normalizeProgression(restored,HEROES),restored);
 raw.missions.claimed=[];assert.deepEqual(normalizeProgression(raw,HEROES).equipment,raw.equipment);
});
test('chapter-three relics change only the wearer stats and all seven new item illustrations are transparent runtime PNGs',()=>{
 for(const relic of relics){const p=profile();p.equipment.owned=[relic.id];const before=HEROES.map(h=>combatStats(p,h));assert.ok(equipUnique(p.equipment,'mochinyafe',relic.id));
  const after=combatStats(p,HEROES[3]);assert.equal(after.maxHp,before[3].maxHp+(relic.bonus.hp??0));assert.equal(after.defense,before[3].defense+(relic.bonus.defense??0));assert.equal(after.attack,before[3].attack*(1+(relic.bonus.attack??0)));
  for(let i=0;i<3;i++)assert.deepEqual(combatStats(p,HEROES[i]),before[i]);
 }
 const images=new Set([...WEAPON_CATALOG.filter(w=>w.heroId==='mochinyafe').map(weaponImage),...relics.map(r=>equipmentImage(r.id))]);assert.equal(images.size,7);
 for(const path of images){const png=readFileSync('public'+path);assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),512);assert.equal(png[25],6);assert.ok(png.length<500000);}
});
