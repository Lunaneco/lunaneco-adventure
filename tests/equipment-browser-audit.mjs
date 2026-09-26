import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {HEROES} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {WEAPON_CATALOG} from '../src/weapons.js';
import {UNIQUE_EQUIPMENT} from '../src/equipment.js';
const engine=process.env.EQUIPMENT_BROWSER||'chrome',base=process.env.LUNARIA_URL||'http://127.0.0.1:5177/',out='audit/equipment-v136';
await mkdir(out,{recursive:true});
const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'chrome',headless:true})),checks=[],errors=[];
const pass=name=>{checks.push(name);console.log('PASS',name);};
const sizes=[[320,568],[390,844],[844,390],[1440,900]],suffix=process.env.EQUIPMENT_PRODUCTION?'production':'dev';
async function open(profile){
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await context.addInitScript(profile=>{
  if(sessionStorage.getItem('equipment-fixture'))return;
  localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,music:false,sound:false,voice:false}));sessionStorage.setItem('equipment-fixture','1');
 },profile);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(base);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 if(process.env.EQUIPMENT_PRODUCTION)assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
 await page.locator('#chapter-menu-open').tap();await page.locator('[data-menu-tab="equipment"]').tap();
 return {context,page};
}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
const category=(page,id)=>page.locator(`[data-equipment-category="${id}"]`).tap();
async function layout(page,label){
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});await page.locator('.equipment-category-picker').scrollIntoViewIfNeeded();
  const overflow=await page.locator('#equipment-content').evaluate(el=>[el,...el.querySelectorAll('.equipment-item,.equipment-character-picker,.equipment-current,.weapon-comparison')].filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.className));assert.deepEqual(overflow,[],`${label} ${width}`);
  assert.equal(await page.locator('#chapter-menu').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
  for(const selector of ['.equipment-equip','.equipment-category-picker button','.equipment-character-picker button']){
   const targets=await page.locator(selector).evaluateAll(els=>els.map(e=>({h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width})));assert.ok(targets.every(t=>t.h>=44&&t.w>=44));
  }
  await page.locator('.equipment-heading').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${engine}-${suffix}-${label}-${width}.png`});
 }
 await page.setViewportSize({width:390,height:844});
}
try{
 const full=normalizeProgression({story:{version:2,actClears:Array(8).fill(true)},characters:{nyanluna:{level:6,xp:12}},inventory:{starBud:83,moonDew:12,weaponTicket:2},weapons:{version:2,owned:WEAPON_CATALOG.map(w=>w.id)},equipment:{owned:UNIQUE_EQUIPMENT.map(w=>w.id),loadout:{nyanluna:'meadow-charm',tsukineko:'ruins-lens'}},tutorial:{firstBattleCompleted:true}},HEROES);
 const {page,context}=await open(full);
 assert.equal(await page.locator('[data-weapon-option]').count(),10);assert.equal(await page.locator('[data-equipment-card]').count(),0);
 assert.equal(await page.locator('[data-equipment-detail][open]').count(),0);
 assert.match(await page.locator('[data-current-weapon]').innerText(),/月詠の杖/);assert.match(await page.locator('[data-current-unique]').innerText(),/星露の花飾り/);
 const rowHeights=await page.locator('[data-weapon-option]').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));assert.ok(rowHeights.every(h=>h<170),JSON.stringify(rowHeights));
 await layout(page,'weapons');pass('Owned weapons form compact rows with collapsed comparisons, usable at four viewport sizes');
 await page.locator('[data-equipment-detail="lilica-staff-r2"] summary').tap();assert.match(await page.locator('[data-equipment-detail="lilica-staff-r2"]').innerText(),/攻撃間隔/);
 await page.locator('[data-equip-weapon="lilica-staff-r2"]').tap();let p=await saved(page);
 assert.equal(p.weapons.loadout.nyanluna,'lilica-staff-r2');assert.deepEqual(p.weapons.owned,full.weapons.owned);assert.deepEqual(p.equipment.owned,full.equipment.owned);
 assert.equal(await page.locator('[data-equipment-detail="lilica-staff-r2"]').getAttribute('open'),'');assert.equal(await page.locator('[data-equip-weapon="lilica-staff-r2"]').isDisabled(),true);
 assert.match(await page.locator('[data-current-weapon]').innerText(),/星鈴の杖/);assert.ok((await page.locator('.equipment-statline').innerText()).includes(String(Number(combatStats(p,HEROES[0]).attack.toFixed(1)))));
 await layout(page,'comparison');pass('Equipping preserves every owned variant, updates actual stats and keeps the selected comparison open');
 await category(page,'unique');assert.equal(await page.locator('[data-equipment-card]').count(),10);assert.equal(await page.locator('[data-weapon-option]').count(),0);
 assert.match(await page.locator('[data-equipment-card="ruins-lens"]').innerText(),/つきねこが装備中/);
 await page.locator('[data-equip-item="ruins-lens"]').tap();p=await saved(page);assert.equal(p.equipment.loadout.nyanluna,'ruins-lens');assert.equal(p.equipment.loadout.tsukineko,undefined);assert.deepEqual(p.equipment.owned,full.equipment.owned);
 await layout(page,'relics');pass('All ten relics remain owned; transferring one clears only its previous wearer');
 await page.locator('[data-equip-item="ruins-lens"]').tap();assert.equal((await saved(page)).equipment.loadout.nyanluna,undefined);assert.match(await page.locator('[data-current-unique]').innerText(),/未装備/);
 await page.locator('[data-equipment-hero="omsolo"]').tap();assert.equal(await page.locator('[data-equipment-category="unique"]').getAttribute('aria-pressed'),'true');await page.locator('[data-equip-item="guardian-knot"]').tap();
 await category(page,'weapons');await page.locator('[data-equip-weapon="aegis-saber-r3"]').tap();p=await saved(page);assert.deepEqual(p.weapons.owned,full.weapons.owned);assert.deepEqual(p.equipment.owned,full.equipment.owned);
 await page.reload();await page.waitForSelector('#loading',{state:'detached'});assert.deepEqual(await saved(page),p);await page.locator('#chapter-menu-open').tap();await page.locator('[data-menu-tab="equipment"]').tap();await page.locator('[data-equipment-hero="omsolo"]').tap();assert.match(await page.locator('[data-current-weapon]').innerText(),/護光剣/);assert.match(await page.locator('[data-current-unique]').innerText(),/守り手の結び/);
 pass('Weapon choices, relic transfer/removal and all 40 item types survive browser reload');await context.close();
 const partial=normalizeProgression({weapons:{version:2,owned:['lilica-staff-r2','selene-staff-r2','nox-rifle-r4']},equipment:{owned:['meadow-charm','dawn-seal']}},HEROES);
 const partialRun=await open(partial),part=partialRun.page;assert.equal(await part.locator('[data-weapon-option]').count(),3);assert.equal(await part.locator('[data-weapon-option="luna-staff-r4"]').count(),0);await category(part,'unique');assert.equal(await part.locator('[data-equipment-card]').count(),2);assert.equal(await part.locator('[data-equipment-card="ruins-lens"]').count(),0);assert.ok((await saved(part)).weapons.owned.includes('nox-rifle-r4'));await partialRun.context.close();
 pass('Partial inventories show only acquired items and keep unrecruited-character weapons in storage');
 const fresh=await open(normalizeProgression({},HEROES));assert.equal(await fresh.page.locator('[data-weapon-option]').count(),1);await category(fresh.page,'unique');assert.equal(await fresh.page.locator('[data-equipment-card]').count(),0);assert.match(await fresh.page.locator('.equipment-empty').innerText(),/まだありません/);await fresh.page.locator('.equipment-empty [data-menu-tab="missions"]').tap();assert.equal(await fresh.page.locator('#missions-panel').isVisible(),true);await fresh.context.close();
 pass('New saves get no free unlocks; empty relic inventory links to missions without listing unowned gear');
 assert.deepEqual(errors,[]);pass('No JavaScript or missing-asset errors');
 await writeFile(`${out}/${engine}-${suffix}-report.json`,JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
