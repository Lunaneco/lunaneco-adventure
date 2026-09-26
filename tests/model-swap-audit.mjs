import {seedRecruitedRoster} from './recruited-browser-fixture.mjs';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await seedRecruitedRoster(context);
const page = await context.newPage();
const errors = [], checks = [], poses = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
const pass = (name, details) => { checks.push({ name, status: 'passed', details }); console.log('PASS', name); };
try {
  await page.goto('http://127.0.0.1:5174/');
  await page.waitForSelector('#loading', { state: 'detached', timeout: 60000 });
  const loaded = await page.evaluate(() => window.__LUNARIA_TEST__.world.heroes.map(h => ({
    source: h.userData.source, ...h.userData.metrics, bones: h.userData.bones.size,
  })));
  assert.deepEqual(loaded.map(h => h.source), ['/assets/models/nyanluna.glb', '/assets/models/tsukineko.glb']);
  assert.ok(loaded.every(h => h.skinnedMeshes === 1 && h.bones === 78));
  pass('Both supplied GLBs load as skinned characters', loaded);
  await page.evaluate(() => {
    window.__LUNARIA_TEST__.home();
    for (const id of ['home', 'wave-banner', 'ultimate-banner', 'toast']) document.getElementById(id).style.display = 'none';
  });
  for (const view of ['idle-front', 'idle-back', 'walk-left', 'walk-right', 'attack', 'turned']) {
    const result = await page.evaluate(async view => {
      const THREE = await import('/node_modules/three/build/three.core.js');
      const { animateHero } = await import('/src/hero-assets.js');
      const w = window.__LUNARIA_TEST__.world;
      const walk = view.startsWith('walk');
      const time = view === 'walk-right' ? .37 : .12;
      for (const [i, hero] of w.heroes.entries()) {
        hero.userData.attackTime = view === 'attack' ? .25 : 0;
        const state = { x: i === 0 ? -1.8 : 1.8, z: 0, face: view === 'turned' ? 1.2 : 0,
          moving: walk, invincible: 0 };
        for (let tick = 0; tick < 8; tick++) animateHero(hero, state, time, 1 / 60, i === 0);
      }
      w.camera.position.set(view === 'turned' ? 6 : 0, 3.1, view === 'idle-back' ? -11 : 11);
      w.camera.lookAt(0, 1.5, 0);
      w.renderer.render(w.scene, w.camera);
      return w.heroes.map(hero => {
        const box = new THREE.Box3().setFromObject(hero.userData.model, true);
        const hand = hero.userData.bones.get('hand.R').bone.getWorldPosition(new THREE.Vector3());
        const weapon = hero.userData.weapon.getWorldPosition(new THREE.Vector3());
        return { name: hero.name, min: box.min.toArray(), max: box.max.toArray(),
          size: box.getSize(new THREE.Vector3()).toArray(), weaponDistance: weapon.distanceTo(hand) };
      });
    }, view);
    for (const hero of result) {
      assert.ok([...hero.min, ...hero.max].every(Number.isFinite));
      assert.ok(hero.size[0] < 4 && hero.size[1] > 2.5 && hero.size[1] < 3.8 && hero.size[2] < 3.5, 'No exploding/deformed skin bounds');
      assert.ok(hero.min[1] > -.15, 'No foot or hair sinking below the floor');
      assert.ok(hero.weaponDistance < .15, 'Weapon follows the actual supplied hand bone');
    }
    poses.push({ pose: view, characters: result });
    await page.screenshot({ path: `audit/model-swap/${view}.png` });
  }
  pass('Front, back, both walking extremes, attacks and turns preserve skin bounds and hand sockets', poses);
  const cycles = await page.evaluate(() => {
    const w = window.__LUNARIA_TEST__.world;
    const bones = w.heroes.map(h => h.userData.bones.get('hand.R').bone.uuid);
    for (let i = 0; i < 12; i++) { w.reset(); w.setQuality(i % 2 ? 'high' : 'low'); }
    return { sameBones: w.heroes.every((h, i) => h.userData.bones.get('hand.R').bone.uuid === bones[i]),
      visible: w.heroes.every(h => h.userData.rig.visible), attackReset: w.heroes.every(h => h.userData.attackTime === 0) };
  });
  assert.ok(cycles.sameBones && cycles.visible && cycles.attackReset);
  pass('Retries and quality toggles preserve skins and reset the animation state', cycles);
  assert.deepEqual(errors, []);
  pass('No loader, shader or runtime errors', {});
  await writeFile('audit/model-swap/runtime-report.json', JSON.stringify({ date: new Date().toISOString(), checks, errors }, null, 2));
} finally { await browser.close(); }
