import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {UNIQUE_EQUIPMENT,equipUnique} from '../src/equipment.js';
import {WEAPON_CATALOG,equipWeapon,drawWeapon} from '../src/weapons.js';
import {equipmentView} from '../src/rewards-ui.js';

const profile=()=>normalizeProgression({story:{version:2,actClears:Array(28).fill(true)},inventory:{starBud:75,weaponTicket:1},weapons:{version:2,owned:WEAPON_CATALOG.flatMap(w=>[w.id,w.id])},equipment:{owned:UNIQUE_EQUIPMENT.flatMap(w=>[w.id,w.id])}},HEROES);
const ids=(html,attribute)=>[...html.matchAll(new RegExp(`${attribute}="([^"]+)"`,'g'))].map(m=>m[1]);

test('all 60 weapon variants and 22 relics coexist once each through equip, transfer and save reload',()=>{
 let p=profile();const weapons=WEAPON_CATALOG.map(w=>w.id),relics=UNIQUE_EQUIPMENT.map(w=>w.id);
 assert.deepEqual(p.weapons.owned,weapons);assert.deepEqual(p.equipment.owned,relics);
 for(const item of WEAPON_CATALOG){assert.ok(equipWeapon(p,item.heroId,item.id));p=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.deepEqual(p.weapons.owned,weapons);assert.equal(p.weapons.loadout[item.heroId],item.id);}
 for(const item of UNIQUE_EQUIPMENT)for(const hero of HEROES){
   assert.ok(equipUnique(p.equipment,hero.id,item.id,{transfer:true}));p=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);
   assert.deepEqual(p.equipment.owned,relics);assert.equal(p.equipment.loadout[hero.id],item.id);
   assert.equal(Object.values(p.equipment.loadout).filter(id=>id===item.id).length,1);
 }
 assert.ok(equipUnique(p.equipment,'omsolo',''));assert.deepEqual(p.equipment.owned,relics);assert.deepEqual(p.weapons.owned,weapons);
 const rolls=[0,0,0],result=drawWeapon(p,()=>rolls.shift());assert.ok(result.duplicate);assert.deepEqual(p.weapons.owned,weapons);assert.equal(p.inventory.starBud,80);
});

test('inventory tabs contain each owned item once, hide unowned items and use a clear empty state',()=>{
 const p=normalizeProgression({weapons:{version:2,owned:['lilica-staff-r2','selene-staff-r2']},equipment:{owned:['meadow-charm','dawn-seal']}},HEROES);
 const weapons=equipmentView(p,'nyanluna'),relics=equipmentView(p,'nyanluna','unique');
 assert.deepEqual(ids(weapons,'data-weapon-option'),['lilica-staff-r2','selene-staff-r2','luna-staff-r1']);
 assert.equal(ids(weapons,'data-equipment-card').length,0);
 assert.deepEqual(ids(relics,'data-equipment-card'),['meadow-charm','dawn-seal']);
 assert.equal(ids(relics,'data-weapon-option').length,0);assert.doesNotMatch(relics,/月影の照準石|試練達成で入手/);
 const empty=equipmentView(normalizeProgression({},HEROES),'nyanluna','unique');
 assert.match(empty,/ユニーク装備はまだありません/);assert.match(empty,/data-menu-tab="missions"/);assert.equal(ids(empty,'data-equipment-card').length,0);
});

test('all owned weapon rarities remain selectable and relic ownership is visible across heroes',()=>{
 const p=profile();equipUnique(p.equipment,'nyanluna','meadow-charm');
 for(const hero of HEROES){
   const html=equipmentView(p,hero.id);assert.equal(ids(html,'data-weapon-option').length,10);
   for(const item of WEAPON_CATALOG.filter(w=>w.heroId!==hero.id))assert.ok(!ids(html,'data-weapon-option').includes(item.id));
 }
 const relics=equipmentView(p,'tsukineko','unique');assert.equal(ids(relics,'data-equipment-card').length,22);assert.match(relics,/にゃんるなが装備中/);assert.match(relics,/にゃんるなから付け替える/);
 assert.match(equipmentView(p,'nyanluna','unique'),/星露の花飾りを外す/);
});
