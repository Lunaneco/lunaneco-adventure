import {RecruitedAdventure} from './recruited-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ATTACK_DURATION, MELEE_MIN_DOT } from '../src/model.js';
import { createSwordSlash, updateSwordSlash } from '../src/attack-effects.js';

function attackEvent(angle, support = false, reach = 0) {
  const game = new RecruitedAdventure({ hero: support ? 0 : 1, seed: 5 });
  game.enemies = [];
  game.skills.reach = reach;
  const source = support ? game.partner : game.player;
  source.x = 9; source.z = 6;
  game.spawnEnemy('golem', source.x + Math.sin(angle) * 3, source.z + Math.cos(angle) * 3);
  game.drainEvents();
  assert.ok(game.attackFrom(source, 1, support));
  return game.drainEvents().find(event => event.type === 'attack');
}
const dispose = effect => { effect.mesh.geometry.dispose(); effect.mesh.material.dispose(); };

test('sword arc covers the real melee sector in all eight headings, for lead and support', () => {
  for (const support of [false, true]) for (let i = 0; i < 8; i++) {
    const event = attackEvent(i * Math.PI / 4, support);
    const effect = createSwordSlash(event);
    const mesh = effect.mesh;
    mesh.updateMatrixWorld(true);
    const pos = mesh.geometry.attributes.position;
    const dots = [];
    for (let v = 0; v < pos.count; v++) {
      const point = new THREE.Vector3().fromBufferAttribute(pos, v).applyMatrix4(mesh.matrixWorld);
      const dx = point.x - event.x, dz = point.z - event.z;
      dots.push((dx * Math.sin(event.angle) + dz * Math.cos(event.angle)) / Math.hypot(dx, dz));
      assert.ok(point.y > .56, 'Full arc must clear the tallest grass');
    }
    assert.ok(Math.min(...dots) >= MELEE_MIN_DOT - 1e-6, 'No arc on the wrong side of the attacker');
    assert.ok(Math.abs(Math.min(...dots) - MELEE_MIN_DOT) < 1e-6, 'Arc reaches the side boundary of the hit sector');
    assert.ok(Math.max(...dots) > .99999, 'Arc includes the target direction');
    assert.equal(mesh.material.depthTest, true, 'Solid objects still have correct depth');
    assert.equal(mesh.material.depthWrite, false);
    dispose(effect);
  }
});

test('slash shows the full strike then fades until the attack animation completes', () => {
  for (const fps of [20, 30, 60, 120]) {
    const effect = createSwordSlash(attackEvent(0));
    assert.equal(effect.max, ATTACK_DURATION);
    let elapsed = 0;
    while (elapsed + 1 / fps < ATTACK_DURATION - 1e-9) {
      updateSwordSlash(effect, 1 / fps); elapsed += 1 / fps;
      assert.ok(effect.life > 0 && effect.mesh.material.opacity > 0);
      assert.equal(effect.mesh.position.y, 1.05);
      if (elapsed <= ATTACK_DURATION * .5) assert.ok(effect.mesh.material.opacity >= .84);
    }
    updateSwordSlash(effect, ATTACK_DURATION - elapsed + 1e-6);
    assert.equal(effect.life, 0);
    assert.equal(effect.mesh.material.opacity, 0);
    dispose(effect);
  }
});

test('range upgrades change the visual reach and consecutive attacks keep independent trails', () => {
  const first = createSwordSlash(attackEvent(0));
  const upgraded = createSwordSlash(attackEvent(Math.PI / 2, true, 3));
  const radius = effect => effect.mesh.geometry.parameters.outerRadius;
  assert.ok(Math.abs(radius(upgraded) / radius(first) - 1.54) < 1e-9);
  updateSwordSlash(first, .28);
  assert.ok(first.life > 0);
  assert.equal(upgraded.life, ATTACK_DURATION);
  assert.notEqual(first.mesh.geometry, upgraded.mesh.geometry);
  assert.notEqual(first.mesh.material, upgraded.mesh.material);
  dispose(first); dispose(upgraded);
});
