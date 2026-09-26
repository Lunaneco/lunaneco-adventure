import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], checks = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
    });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
    await page.goto('http://127.0.0.1:5174/');
    await page.waitForSelector('#loading', { state: 'detached', timeout: 60000 });
    await page.evaluate(async () => {
      const { Adventure } = await import('/src/model.js');
      window.__attackAudit = { Adventure, world: window.__LUNARIA_TEST__.world };
      window.__LUNARIA_TEST__.home();
      for (const id of ['home', 'wave-banner', 'ultimate-banner', 'toast']) document.getElementById(id).style.display = 'none';
    });
    for (const quality of ['high', 'low']) for (const support of [false, true]) {
      const cases = await page.evaluate(({ quality, support }) => {
        const { world: w, Adventure } = window.__attackAudit;
        w.setQuality(quality);
        const rows = [];
        for (let direction = 0; direction < 8; direction++) {
          w.reset();
          const game = new Adventure({ hero: support ? 0 : 1, seed: 5 });
          const x = 9, z = 6, angle = direction * Math.PI / 4;
          Object.assign(game.player, { x: support ? x - 2 : x, z, invincible: 0 });
          Object.assign(game.partner, { x: support ? x : x - 2, z });
          game.spawnEnemy('golem', x + Math.sin(angle) * 3, z + Math.cos(angle) * 3);
          game.drainEvents(); game.attackFrom(support ? game.partner : game.player, 1, support);
          w.handle(game.drainEvents().filter(e => e.type === 'attack'), game);
          w.cameraTarget.set(game.player.x * .65, 0, game.player.z * .65);
          w.render(game, .1);
          const effect = w.rings.find(r => r.kind === 'sword-slash');
          const pos = effect.mesh.geometry.attributes.position;
          let minY = Infinity;
          for (let i = 0; i < pos.count; i++) {
            const p = w.cameraTarget.clone().fromBufferAttribute(pos, i).applyMatrix4(effect.mesh.matrixWorld);
            minY = Math.min(minY, p.y);
          }
          const peakOpacity = effect.mesh.material.opacity;
          w.render(game, .18);
          const followsThrough = w.rings.includes(effect) && effect.mesh.material.opacity > .2;
          let geometryDisposed = false, materialDisposed = false;
          effect.mesh.geometry.addEventListener('dispose', () => geometryDisposed = true);
          effect.mesh.material.addEventListener('dispose', () => materialDisposed = true);
          w.render(game, .08);
          rows.push({ direction, minY, peakOpacity, followsThrough,
            removed: !w.rings.includes(effect) && !effect.mesh.parent,
            disposed: geometryDisposed && materialDisposed });
          if (direction === 7) {
            game.attackFrom(support ? game.partner : game.player, 1, support);
            w.handle(game.drainEvents().filter(e => e.type === 'attack'), game);
            w.render(game, .12);
          }
        }
        return rows;
      }, { quality, support });
      for (const row of cases) {
        assert.ok(row.minY > .56);
        assert.ok(row.peakOpacity > .8);
        assert.ok(row.followsThrough, 'Effect must still be visible after the old 0.25-second cutoff');
        assert.ok(row.removed && row.disposed);
      }
      const label = `${mobile ? 'mobile' : 'desktop'}-${quality}-${support ? 'support' : 'lead'}`;
      checks.push({ name: label, status: 'passed', cases });
      console.log('PASS', label, '8 directions, follow-through, disposal');
      await page.screenshot({ path: `audit/attack-effect/${label}.png` });
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile('audit/attack-effect/runtime-report.json', JSON.stringify({ date: new Date().toISOString(), checks, errors }, null, 2));
} finally { await browser.close(); }
