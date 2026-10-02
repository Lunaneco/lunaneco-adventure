import test from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {WEAPON_CATALOG,weaponImage,equipWeapon,equippedWeapon,drawWeapon} from '../src/weapons.js';
import {createWeaponVariant} from '../src/weapon-models.js';
import {setHeroWeapon} from '../src/hero-assets.js';
import {HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {shizukuScytheCollection} from '../src/weapons-ui.js';
const scythes=WEAPON_CATALOG.filter(w=>w.heroId==='shizuku');

test('Shizuku has ten distinct named and illustrated scythes through rarity four',async()=>{
 assert.equal(scythes.length,10);assert.deepEqual([1,2,3,4].map(r=>scythes.filter(w=>w.rarity.rank===r).length),[1,3,3,3]);
 assert.equal(new Set(scythes.map(w=>w.weapon.name)).size,10);assert.equal(new Set(scythes.map(weaponImage)).size,10);
 for(const item of scythes){assert.ok((await stat(new URL('../public'+weaponImage(item),import.meta.url))).size>1000);assert.match(item.weapon.note,/HP[へを]吸収/);}
});
test('all ten scythes have different geometry and stay within a bounded weapon budget',()=>{
 const hashes=new Set();
 for(const item of scythes){const model=createWeaponVariant(item),hash=createHash('sha256');let triangles=0,draws=0;
  model.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;hash.update(Buffer.from(p.array.buffer));triangles+=(o.geometry.index?.count??p.count)/3;draws++;}});
  hashes.add(hash.digest('hex'));assert.equal(model.userData.variantId,item.id);assert.equal(model.name,item.weapon.name);assert.ok(triangles<20000);assert.ok(draws<12);
  const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());assert.ok(size.y<5&&size.x<3.1);
  model.traverse(o=>o.geometry?.dispose());
 }
 assert.equal(hashes.size,10);
});
test('same-family rarity switches update the held model and reuse the right cached variant',()=>{
 const [one,two,,four]=scythes.filter(w=>w.weapon.id==='crimson-scythe'),rig=new THREE.Group(),original=createWeaponVariant(one),root={userData:{hero:4,rig,weapon:original}};rig.add(original);
 setHeroWeapon(root,four);const legendary=root.userData.weapon;assert.notEqual(legendary,original);assert.equal(legendary.userData.rarity,4);assert.equal(rig.children.length,1);
 setHeroWeapon(root,two);assert.equal(root.userData.weapon.userData.rarity,2);setHeroWeapon(root,four);assert.equal(root.userData.weapon,legendary);setHeroWeapon(root,one);assert.equal(root.userData.weapon,original);
 for(const weapon of root.userData.weaponCache.values())weapon.traverse(o=>o.geometry?.dispose());
});
test('all gacha scythes can be acquired, equipped after recruitment, and retained in a save',()=>{
 const p=normalizeProgression({story:{version:2,actClears:Array(20).fill(true)},inventory:{weaponTicket:20}},HEROES);
 for(const rarity of [.1,.8,.99])for(const family of [.1,.5,.9]){const rolls=[4.5/8,rarity,family];const draw=drawWeapon(p,()=>rolls.shift());assert.equal(draw.item.heroId,'shizuku');assert.equal(draw.duplicate,false);assert.ok(equipWeapon(p,'shizuku',draw.item.id));}
 assert.equal(p.weapons.owned.filter(id=>id.includes('scythe')).length,10);const saved=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.equal(equippedWeapon(saved,'shizuku').id,equippedWeapon(p,'shizuku').id);
 const html=shizukuScytheCollection(saved);assert.equal([...html.matchAll(/data-scythe=/g)].length,10);assert.match(html,/魔王の護鎌・おかえり/);assert.match(html,/★1〜★4/);
});
