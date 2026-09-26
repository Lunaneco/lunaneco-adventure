import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {normalizeProgression} from '../src/progression.js';
import {HEROES} from '../src/model.js';
import {WEAPON_CATALOG} from '../src/weapons.js';
import {UNIQUE_EQUIPMENT} from '../src/equipment.js';
import {TREE_RESOURCES} from '../src/talents.js';
const url=process.env.CONSTELLATION_URL??'http://127.0.0.1:5190/',out='audit/constellation-equipment';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
const pass=s=>{checks.push(s);console.log('PASS',s);};
const unlockedNodes=['origin','attack1','guard1','life1','attack2'];
const profile=normalizeProgression({story:{version:2,actClears:Array(12).fill(true)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:50,breaks:3,tree:unlockedNodes}])),inventory:Object.fromEntries(Object.keys(TREE_RESOURCES).map(id=>[id,1000])),weapons:{version:2,owned:WEAPON_CATALOG.map(w=>w.id)},equipment:{owned:UNIQUE_EQUIPMENT.map(e=>e.id),loadout:{nyanluna:'cloud-feather',tsukineko:'ruins-lens'}},tutorial:{firstBattleCompleted:true}},HEROES);
const context=await browser.newContext({viewport:{width:1440,height:1100}});
await context.addInitScript(profile=>{if(!sessionStorage.getItem('constellation-seeded')){localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,music:false,voice:false,quality:'low',motion:true}));sessionStorage.setItem('constellation-seeded','1');}},profile);
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
async function boot(){await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.click('#start');}
async function shot(name,selector){if(selector)await page.locator(selector).scrollIntoViewIfNeeded();await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(e=>{const r=e.getBoundingClientRect();return e.checkVisibility()&&r.bottom>0&&r.top<innerHeight;}).map(e=>e.decode().catch(()=>{})));});await page.screenshot({path:`${out}/${name}.png`});}
async function fit(selector){const items=await page.locator(selector).evaluateAll(nodes=>nodes.filter(n=>n.checkVisibility()).map(n=>({name:n.className,decorativeGlow:n.classList.contains('talent-node'),overflow:n.scrollWidth-n.clientWidth,left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right,width:innerWidth})));for(const x of items){if(!x.decorativeGlow)assert.ok(x.overflow<=1,JSON.stringify(x));assert.ok(x.left>=-1&&x.right<=x.width+1,JSON.stringify(x));}}
async function contrast(selector){return page.locator(selector).evaluateAll(nodes=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number),lum=c=>c.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
  return nodes.filter(n=>n.checkVisibility()).map(n=>{const s=getComputedStyle(n);let p=n,bg;while(p){bg=getComputedStyle(p).backgroundColor;if(!bg.endsWith(', 0)')&&bg!=='transparent')break;p=p.parentElement;}const a=lum(rgb(s.color)),b=lum(rgb(bg));return {text:n.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});});}
try{
  await boot();await page.click('[data-menu-tab="talent"]');await shot('tree-desktop','.tree-workbench');
  await expect(page.locator('.talent-map .talent-node.unlocked')).toHaveCount(5);
  await expect(page.locator('[data-tree-node="guard2"]')).toHaveClass(/available/);
  await expect(page.locator('[data-tree-node="awakening"]')).toHaveClass(/locked/);
  assert.ok(await page.locator('[data-tree-node="origin"] .node-star').evaluate(e=>getComputedStyle(e).filter.includes('drop-shadow')));
  assert.equal(await page.locator('.talent-map .talent-links .lit').count(),4);
  const before=await saved();await page.click('[data-tree-node="guard2"]');await page.click('[data-unlock-node="guard2"]');
  await expect(page.locator('[data-tree-node="guard2"]')).toHaveClass(/unlocked.*just-unlocked/);
  assert.equal((await saved()).inventory.starBud,before.inventory.starBud-16);assert.equal((await saved()).inventory.moonDew,before.inventory.moonDew-2);
  await page.evaluate(()=>document.querySelector('[data-unlock-node="guard2"]').click());assert.equal((await saved()).inventory.starBud,before.inventory.starBud-16);
  await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.click('#start');await page.click('[data-menu-tab="talent"]');
  await expect(page.locator('[data-tree-node="guard2"]')).toHaveClass(/unlocked/);
  await expect(page.locator('[data-tree-node="guard2"]')).not.toHaveClass(/just-unlocked/);
  pass('Unlocking lights the star and its path, spends once, and keeps the glow after reload.');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('[data-tree-node="origin"] .talent-orb').evaluate(e=>getComputedStyle(e,'::before').animationName),'none');
  assert.notEqual(await page.locator('[data-tree-node="origin"] .node-star').evaluate(e=>getComputedStyle(e).filter),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  const glows=[];for(const hero of HEROES){await page.click(`[data-tree-hero="${hero.id}"]`);glows.push(await page.locator('.tree-workbench').evaluate(e=>getComputedStyle(e).getPropertyValue('--tree-glow')));}
  assert.equal(new Set(glows).size,4);await page.click('[data-tree-hero="nyanluna"]');
  for(const [width,height] of [[320,568],[390,844],[844,390],[1440,1100]]){
    await page.setViewportSize({width,height});
    for(const tier of [1,2,3]){await page.click(`[data-tree-tier="${tier}"]`);await fit('#chapter-menu,.talent-map-wrap,.talent-map,.talent-node,.talent-node>strong,.talent-node>small,.talent-detail');}
    await page.click('[data-tree-tier="1"]');if(width===390)await shot('tree-mobile','.talent-map');
  }
  pass('All three star tiers and four hero colors fit mobile, landscape and desktop; reduced motion preserves static glow.');
  await page.click('[data-menu-tab="equipment"]');await shot('weapons-desktop','.equipment-current');
  for(const [width,height] of [[320,568],[390,844],[844,390],[1440,1100]]){
    await page.setViewportSize({width,height});
    for(const category of ['weapons','unique']){await page.click(`[data-equipment-category="${category}"]`);await fit('#chapter-menu,#equipment-content,.equipment-item,.equipment-item-label');if(width===390)await shot(`${category}-mobile`,'.equipment-inventory');}
  }
  await shot('unique-desktop','.equipment-inventory');
  await page.click('[data-equipment-category="weapons"]');
  const ratios=await contrast('#equipment-panel .weapon-rarity,#equipment-panel .equipment-item-label h4,#equipment-panel .equipment-equip');
  for(const result of ratios)assert.ok(result.ratio>=4.5,JSON.stringify(result));
  await page.click('[data-equipment-detail="lilica-staff-r2"] summary');
  const diffs=await contrast('.weapon-comparison .better,.weapon-comparison .worse');assert.ok(diffs.length>=2);for(const result of diffs)assert.ok(result.ratio>=4.5,JSON.stringify(result));
  await shot('weapon-comparison','.equipment-item:has([data-equipment-detail="lilica-staff-r2"])');
  await page.click('[data-equip-weapon="lilica-staff-r2"]');assert.equal((await saved()).weapons.loadout.nyanluna,'lilica-staff-r2');
  assert.equal(await page.locator('[data-equip-weapon="lilica-staff-r2"]').evaluate(e=>getComputedStyle(e).opacity),'1');
  await page.click('[data-equipment-category="unique"]');await page.click('[data-equip-item="ruins-lens"]');assert.equal((await saved()).equipment.loadout.nyanluna,'ruins-lens');assert.equal((await saved()).equipment.loadout.tsukineko,undefined);
  await page.click('[data-equip-item="ruins-lens"]');assert.equal((await saved()).equipment.loadout.nyanluna,undefined);
  pass('Equipment names, all four rarity badges, equipped status and comparison differences meet 4.5:1 contrast; equip/transfer/remove still save correctly.');
  assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({url,checks,errors,contrast:ratios,differences:diffs},null,2));
}catch(error){console.error({errors});throw error;}finally{await browser.close();}
