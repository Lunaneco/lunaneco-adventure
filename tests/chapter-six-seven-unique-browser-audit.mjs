import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {HEROES} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {CHAPTER_UNIQUE_EQUIPMENT} from '../src/chapter-unique-equipment.js';
import {missionIndex} from '../src/missions.js';
const url=process.env.LUNARIA_URL??'http://localhost:5187/',out=process.env.UNIQUE67_AUDIT_OUT??'audit/chapter-six-seven-uniques',checks=[],errors=[];
await mkdir(out,{recursive:true});
const raw=normalizeProgression({story:{version:2,actClears:Array(32).fill(true)},inventory:{bloodCrystal:37,demonHeart:11},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}])),equipment:{owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}}},HEROES);
for(const r of CHAPTER_UNIQUE_EQUIPMENT){raw.missions.stages[missionIndex(r.act,2)].trials=1;raw.missions.claimed.push(`act${r.act+1}-relic`);}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
 await context.addInitScript(raw=>{if(sessionStorage.getItem('unique67-audit'))return;localStorage.setItem('lunaria-progression-v1',JSON.stringify(raw));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false,voice:false}));sessionStorage.setItem('unique67-audit','1');},raw);
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});await page.locator('#start').click();await page.locator('[data-menu-tab="missions"]').click();
 for(const r of CHAPTER_UNIQUE_EQUIPMENT){
  const mission=page.locator(`[data-mission="act${r.act+1}-relic"]`);await mission.evaluate(e=>e.closest('details').open=true);await mission.scrollIntoViewIfNeeded();assert.match(await mission.innerText(),new RegExp(r.name));assert.match(await mission.innerText(),new RegExp(String(420+(r.act%4)*20)));
  const img=mission.locator(`img[src*="${r.id}"]`);await img.scrollIntoViewIfNeeded();const alpha=await img.evaluate(async i=>{await i.decode();const canvas=document.createElement('canvas');canvas.width=i.naturalWidth;canvas.height=i.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(i,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let clear=0,solid=0;for(let j=3;j<pixels.length;j+=4){clear+=Number(pixels[j]===0);solid+=Number(pixels[j]>240);}return {width:canvas.width,height:canvas.height,clearFraction:clear/(pixels.length/4),solidFraction:solid/(pixels.length/4),corners:[pixels[3],pixels[canvas.width*4-1],pixels[pixels.length-canvas.width*4+3],pixels[pixels.length-1]]};});
  assert.ok(alpha.width>=512&&alpha.height>=512);assert.ok(alpha.clearFraction>.15&&alpha.solidFraction>.08);assert.deepEqual(alpha.corners,[0,0,0,0]);checks.push({name:r.name,alpha});
 }
 for(const [act,width] of [[24,390],[28,320]]){await page.setViewportSize({width,height:844});await page.locator(`[data-mission="act${act+1}-relic"]`).scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);await page.screenshot({path:`${out}/missions-${act}-${width}.png`});}
 await page.setViewportSize({width:390,height:844});await page.locator('[data-menu-tab="equipment"]').click();await page.locator('[data-equipment-category="unique"]').click();await page.locator('[data-equipment-hero="hehereal"]').click();assert.equal(await page.locator('[data-equipment-card]').count(),9);
 const item=CHAPTER_UNIQUE_EQUIPMENT[3];await page.locator(`[data-equip-item="${item.id}"]`).click();let p=await saved();assert.equal(p.equipment.loadout.hehereal,item.id);assert.equal(p.inventory.bloodCrystal,37);assert.equal(p.inventory.demonHeart,11);const stats=combatStats(normalizeProgression(p,HEROES),HEROES[6]);assert.deepEqual(await page.locator('.equipment-statline dd').allTextContents(),[String(stats.maxHp),String(Number(stats.attack.toFixed(1))),String(stats.defense)]);
 await page.locator('[data-equipment-hero="lumi"]').click();await page.locator(`[data-equip-item="${item.id}"]`).click();p=await saved();assert.equal(p.equipment.loadout.lumi,item.id);assert.equal(p.equipment.loadout.hehereal,undefined);assert.equal(p.equipment.owned.length,9);await page.screenshot({path:`${out}/inventory-mobile.png`});checks.push({name:'All eight rewards restored, equip/transfer changes owner only; materials preserved'});
 await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:120000});await page.locator('#start').click();await page.locator('[data-menu-tab="equipment"]').click();await page.locator('[data-equipment-category="unique"]').click();assert.equal(await page.locator('[data-equipment-card]').count(),9);assert.deepEqual(await saved(),p);
 assert.deepEqual(errors,[]);await writeFile(`${out}/browser-report.json`,JSON.stringify({url,checks,errors},null,2));console.log('PASS eight transparent illustrations, conditions, legacy recovery, mobile equipment, transfer and save reload');
}catch(e){await writeFile(`${out}/browser-report.json`,JSON.stringify({url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
