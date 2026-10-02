import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,seededRandom} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {drawWeapon,drawWeapons,normalizeWeapons,WEAPON_CATALOG} from '../src/weapons.js';
import {weaponGachaView,weaponBatchResult} from '../src/weapons-ui.js';
const profile=(tickets=10)=>normalizeProgression({inventory:{weaponTicket:tickets}},HEROES);

test('ten draws consume exactly ten tickets and match ten independent single draws',()=>{
 for(const seed of [1,7,29,101]){
  const p=profile(11),single=structuredClone(p),r=seededRandom(seed),before=structuredClone(p);
  const expected=Array.from({length:10},()=>drawWeapon(single,r)),actual=drawWeapons(p,10,seededRandom(seed));assert.deepEqual(actual,expected);
  assert.equal(p.inventory.weaponTicket,1);assert.equal(p.weapons.draws,10);assert.deepEqual(p.inventory,single.inventory);assert.deepEqual(p.weapons.owned,single.weapons.owned);assert.deepEqual(p.weapons.loadout,before.weapons.loadout);assert.deepEqual(p.characters,before.characters);assert.deepEqual(p.story,before.story);
  assert.equal(p.weapons.lastBatch.length,10);assert.deepEqual(p.weapons.lastDraw,p.weapons.lastBatch.at(-1));assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
 }
});
test('insufficient tickets and invalid batch sizes do not roll or alter the save',()=>{
 for(const tickets of [0,1,9]){const p=profile(tickets),before=structuredClone(p);assert.equal(drawWeapons(p,10,()=>{throw Error('must not roll');}),null);assert.deepEqual(p,before);}
 for(const amount of [0,2,9,11,10.5,'10',NaN]){const p=profile(30),before=structuredClone(p);assert.equal(drawWeapons(p,amount),null);assert.deepEqual(p,before);}
});
test('invalid rolls and RNG failures after earlier valid draws do not partially grant or charge',()=>{
 for(const invalid of [NaN,Infinity,-.1,1]){const p=profile(),before=structuredClone(p);let n=0;assert.equal(drawWeapons(p,10,()=>++n===29?invalid:0),null);assert.deepEqual(p,before);}
 const p=profile(),before=structuredClone(p);let n=0;assert.throws(()=>drawWeapons(p,10,()=>{if(++n===29)throw Error('random unavailable');return 0;}));assert.deepEqual(p,before);
});
test('duplicates within the batch convert once per repeated item and preserve actual capped grants',()=>{
 const p=profile();const results=drawWeapons(p,10,()=>0);assert.equal(results[0].duplicate,false);assert.ok(results.slice(1).every(r=>r.duplicate&&r.duplicateBuds===5));assert.equal(p.inventory.starBud,45);assert.equal(p.weapons.owned.length,9);
 const capped=profile();capped.inventory.starBud=99999997;const r=drawWeapons(capped,10,()=>0);assert.equal(r[1].duplicateBuds,2);assert.ok(r.slice(2).every(r=>r.duplicateBuds===0));assert.equal(capped.inventory.starBud,99999999);
 assert.deepEqual(normalizeWeapons(capped.weapons).lastBatch,capped.weapons.lastBatch);
});
test('batch history stays bounded, rejects unknown weapons and clears after the next single draw',()=>{
 const p=profile(21);drawWeapons(p);const first=structuredClone(p.weapons.lastBatch);drawWeapons(p,10,seededRandom(42));assert.equal(p.weapons.lastBatch.length,10);assert.notDeepEqual(p.weapons.lastBatch,first);
 for(const batch of [[...p.weapons.lastBatch,first[0]],p.weapons.lastBatch.map((r,i)=>i===0?{weaponId:'unknown',duplicate:false}:r)])assert.equal(normalizeWeapons({...p.weapons,lastBatch:batch}).lastBatch,null);
 drawWeapons(p,1,()=>0);assert.equal(p.weapons.lastBatch,null);assert.equal(p.weapons.draws,21);assert.equal(p.inventory.weaponTicket,0);
});
test('ten-draw UI shows all results, conversions, locked character storage and both ticket thresholds',()=>{
 for(const tickets of [0,1,9,10]){const html=weaponGachaView(profile(tickets));assert.equal(/data-draw-weapons disabled/.test(html),tickets<10);assert.equal(/data-draw-weapon disabled/.test(html),tickets<1);}
 const p=profile(),results=drawWeapons(p,10,()=>.9),html=weaponBatchResult(results,p,true);assert.equal((html.match(/data-batch-item=/g)||[]).length,10);assert.match(html,/10回分の結果を保存/);assert.match(html,/加入まで保管/);assert.match(html,/重複 9本/);assert.doesNotMatch(html,/data-equip-weapon/);
 const saved=weaponGachaView(normalizeProgression(p,HEROES));assert.match(saved,/前回の10連結果/);assert.equal((saved.match(/data-batch-item=/g)||[]).length,10);assert.match(saved,/10連は同じ割合で10回抽選/);
 const full=profile();full.weapons.owned=WEAPON_CATALOG.map(w=>w.id);assert.ok(drawWeapons(full,10,()=>.99).every(r=>r.duplicate));
});
