import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {HEROES} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {UNIQUE_EQUIPMENT} from '../src/equipment.js';
import {missionIndex} from '../src/missions.js';
const base=process.env.LUNARIA_URL||'http://127.0.0.1:5185/',hosted=new URL(base).hostname.endsWith('.github.io');
const out='audit/chapter-four/relics-v162';await mkdir(out,{recursive:true});const checks=[],errors=[],relics=UNIQUE_EQUIPMENT.filter(r=>r.act>=12&&r.act<16);
const raw=normalizeProgression({story:{version:2,actClears:Array(16).fill(true)},inventory:{bloodCrystal:37,demonHeart:11},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}])),equipment:{owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}}},HEROES);
for(const relic of relics){raw.missions.stages[missionIndex(relic.act,2)].trials=1;raw.missions.claimed.push(`act${relic.act+1}-relic`);}
const pass=name=>{checks.push(name);console.log('PASS',name);};
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await context.addInitScript(raw=>{if(sessionStorage.getItem('relic-v162-fixture'))return;localStorage.setItem('lunaria-progression-v1',JSON.stringify(raw));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false,voice:false}));sessionStorage.setItem('relic-v162-fixture','1');},raw);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#loading',{state:'detached',timeout:90000});assert.equal(await page.locator('.version').innerText(),'Ver. 1.62.0');
 if(hosted)assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
 await page.click('#start');await page.click('[data-chapter="3"]');await page.click('[data-menu-tab="missions"]');
 for(const relic of relics){
  const mission=page.locator(`[data-mission="act${relic.act+1}-relic"]`);await mission.evaluate(el=>el.closest('details').open=true);await mission.scrollIntoViewIfNeeded();
  assert.match(await mission.innerText(),new RegExp(relic.name));assert.ok((await mission.innerText()).includes(String(420+(relic.act-12)*20)));
  const img=mission.locator(`img[src*="${relic.id}"]`);await img.scrollIntoViewIfNeeded();assert.equal(await img.evaluate(async i=>{await i.decode();return i.naturalWidth;}),512);
 }
 pass('All four chapter-four missions show their generated relic image, condition and bonus');
 const first=page.locator('[data-mission="act13-relic"]');for(const width of [390,320]){await page.setViewportSize({width,height:844});await first.scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);await page.screenshot({path:`${out}/${hosted?'hosted':'local'}-mission-${width}.png`});}
 pass('Mission rewards fit 390px and 320px mobile views');
 await page.setViewportSize({width:1440,height:1000});await page.click('[data-menu-tab="equipment"]');await page.click('[data-equipment-hero="shizuku"]');await page.click('[data-equipment-category="unique"]');
 assert.equal(await page.locator('[data-equipment-card]').count(),5);
 for(const relic of relics){const img=page.locator(`[data-equipment-card="${relic.id}"] img`);await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());}
 await page.screenshot({path:`${out}/${hosted?'hosted':'local'}-inventory.png`});
 pass('Previously claimed trials restore four missing relics alongside the existing owned item');
 const crown=relics.at(-1);await page.click(`[data-equip-item="${crown.id}"]`);assert.match(await page.locator('[data-current-unique]').innerText(),new RegExp(crown.name));
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));let p=await saved();assert.equal(p.equipment.loadout.shizuku,crown.id);assert.equal(p.inventory.bloodCrystal,37);assert.equal(p.inventory.demonHeart,11);
 const stats=combatStats(normalizeProgression(p,HEROES),HEROES[4]);assert.deepEqual(await page.locator('.equipment-statline dd').allTextContents(),[String(stats.maxHp),String(Number(stats.attack.toFixed(1))),String(stats.defense)]);
 await page.click('[data-equipment-hero="nyanluna"]');await page.click(`[data-equip-item="${crown.id}"]`);p=await saved();assert.equal(p.equipment.loadout.nyanluna,crown.id);assert.equal(p.equipment.loadout.shizuku,undefined);assert.equal(p.equipment.owned.length,5);
 pass('New crown affects Shizuku stats and transfers to Nyanluna without duplicating ownership or material rewards');
 await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.click('#start');await page.click('[data-menu-tab="equipment"]');await page.click('[data-equipment-category="unique"]');assert.equal(await page.locator('[data-equipment-card]').count(),5);assert.deepEqual(await saved(),p);
 pass('All rewards, materials and the transferred equipment survive reload');assert.deepEqual(errors,[]);
 await writeFile(`${out}/${hosted?'hosted':'local'}-browser-report.json`,JSON.stringify({base,checks,errors},null,2));
}finally{await browser.close();}
