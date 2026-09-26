import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {normalizeProgression} from '../src/progression.js';
import {HEROES} from '../src/model.js';
import {FIRST_TIER_NODES} from '../src/talents.js';
const out='audit/skills-v142';await mkdir(out,{recursive:true});const errors=[],checks=[];
const profile=normalizeProgression({story:{version:2,actClears:Array(8).fill(true)},tutorial:{firstBattleCompleted:true},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:35,breaks:2,tree:[...FIRST_TIER_NODES.map(n=>n.id),'ascension']} ])),inventory:{starBud:2000,moonDew:100,wardenCore:20,moonPrism:100,astralCore:20,weaponTicket:5,limitStone:4}},HEROES);
for(const engine of [chromium,webkit]){
 const name=engine.name(),browser=await engine.launch(name==='chromium'?{channel:'chrome',headless:true}:{headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await context.addInitScript(profile=>{
   if(sessionStorage.getItem('skills-audit'))return;
   localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['nyanluna','tsukineko'],lead:'nyanluna'}));sessionStorage.setItem('skills-audit','1');
  },profile);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
  const load=async url=>{await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});};
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
  await load(process.env.AUDIT_URL??'http://127.0.0.1:4187/lunaneco-adventure/');assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');assert.match(await page.locator('.version').innerText(),/1\.42/);
  await page.locator('#chapter-menu-open').tap();await page.locator('[data-menu-tab="talent"]').tap();await page.locator('[data-tree-tier="3"]').tap();assert.equal(await page.locator('[data-blessing-slot]').count(),3);assert.equal(await page.locator('[data-equip-blessing]').count(),3);
  for(const id of ['blessing1','blessing2','blessing3']){await page.locator(`[data-tree-node="${id}"]`).tap();assert.equal(await page.locator(`[data-unlock-node="${id}"]`).isEnabled(),true);await page.locator(`[data-unlock-node="${id}"]`).tap();assert.equal(await page.locator(`[data-unlock-node="${id}"]`).isDisabled(),true);}
  let p=await saved();assert.deepEqual(p.inventory,{...profile.inventory,starBud:1710,moonDew:89,wardenCore:18,moonPrism:88,astralCore:16});assert.deepEqual(p.blessingLoadouts.nyanluna,['nova','orbit','reach']);assert.deepEqual(p.characters.tsukineko,profile.characters.tsukineko);
  await page.locator('[data-edit-blessings]').tap();await page.locator('[data-equip-blessing="arcanePower"]').tap();await page.locator('[data-blessing-slot="1"]').tap();await page.locator('[data-equip-blessing="arcanePower"]').tap();await page.locator('[data-blessing-slot="2"]').tap();await page.locator('[data-equip-blessing="starlightHeal"]').tap();
  p=await saved();assert.deepEqual(p.blessingLoadouts.nyanluna,['orbit','arcanePower','starlightHeal']);assert.equal(p.inventory.starBud,1710);
  for(const [width,height] of [[320,740],[390,844],[844,390],[1440,900]]){
   await page.setViewportSize({width,height});await page.locator('#blessing-loadout').scrollIntoViewIfNeeded();
   const overflow=await page.locator('#blessing-loadout button,.tree-tiers button,.skill-talent-map button').evaluateAll(elements=>elements.filter(el=>{const r=el.getBoundingClientRect();return r.width&& (r.left< -1||r.right>innerWidth+1);}).map(el=>el.textContent.trim()));assert.deepEqual(overflow,[],`${name} ${width}`);
   const sizes=await page.locator('#blessing-loadout button').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));assert.ok(sizes.every(n=>n>=44));
   if(width===390||width===1440)await page.locator('#blessing-loadout').screenshot({path:`${out}/${name}-loadout-${width}.png`});
  }
  await page.setViewportSize({width:390,height:844});await page.locator('.skill-talent-map').screenshot({path:`${out}/${name}-skill-tree.png`});
  await page.locator('[data-blessing-slot="0"]').tap();await page.locator('[data-equip-blessing="moonFrost"]').tap();p=await saved();assert.deepEqual(p.blessingLoadouts.nyanluna,['moonFrost','arcanePower','starlightHeal']);await page.locator('.blessing-loadout-note').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${name}-loadout-bottom.png`});
  await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:120000});assert.deepEqual(await saved(),p);
  await page.locator('#chapter-menu-open').tap();await page.locator('#chapter-menu [data-open="party"]').tap();assert.equal(await page.locator('[data-party-blessing="arcanePower"]').count(),1);assert.equal(await page.locator('[data-party-blessing="nova"]').count(),0);for(const id of ['echo','power'])assert.equal(await page.locator(`[data-party-blessing="${id}"]`).count(),1);
  await page.locator('[data-open-skill-loadout]').tap();assert.equal(await page.locator('#blessing-loadout').isVisible(),true);assert.equal(await page.locator('#modal').evaluate(el=>el.open),false);
  for(const [id,skill] of [['tsukineko','penetration'],['omsolo','bladeTempo']]){await page.locator(`[data-tree-hero="${id}"]`).tap();await page.locator('[data-unlock-node="blessing1"]').tap();await page.locator('[data-edit-blessings]').tap();await page.locator(`[data-equip-blessing="${skill}"]`).tap();assert.equal((await saved()).blessingLoadouts[id][0],skill);}
  p=await saved();checks.push(`${name}: unlock/pay, three slots, swap, per-hero persistence, pair preview, party shortcut and 320/390/844/1440 layouts`);
  await context.close();
  const battle=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await battle.addInitScript(p=>{localStorage.setItem('lunaria-progression-v1',JSON.stringify(p));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['nyanluna','tsukineko'],lead:'nyanluna'}));},p);
  const bp=await battle.newPage();bp.on('pageerror',e=>errors.push(`${name} battle: ${e.message}`));await bp.goto(process.env.LUNARIA_URL??'http://127.0.0.1:5177/');await bp.waitForSelector('#loading',{state:'detached',timeout:120000});
  const pool=await bp.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=999;g.player.hp=100;const pool=g.skillPool.map(s=>s.id);g.rng=()=>.5;g.addCrystals(8);t.step(.02);return {pool,skills:g.skills,hp:g.player.hp};});assert.deepEqual(pool.skills,{});assert.equal(pool.hp,100);assert.ok(pool.pool.includes('arcanePower'));assert.ok(!pool.pool.includes('nova'));assert.ok(pool.pool.includes('echo')&&pool.pool.includes('power'));
  let chosen=await bp.locator('[data-skill]').evaluateAll(els=>els.map(el=>el.dataset.skill));assert.equal(chosen.length,3);assert.ok(chosen.every(id=>pool.pool.includes(id)));await bp.locator('[data-skill]').first().tap();
  const state=await bp.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;g.pause();return {skills:g.skills,pool:g.skillPool.map(s=>s.id)};});assert.equal(state.skills[chosen[0]],1);assert.deepEqual(state.pool,pool.pool);
  checks.push(`${name}: runtime 3-choice uses saved candidates; equip grants no immediate effects; real tap activates one rank`);
  await battle.close();
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);await writeFile(`${out}/browser-report.json`,JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
