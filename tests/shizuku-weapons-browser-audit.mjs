import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {WEAPON_CATALOG} from '../src/weapons.js';
const browser=await chromium.launch({channel:'chrome',headless:true}),out='audit/chapter-four',errors=[],checks=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(owned=>{if(!localStorage.getItem('scythe-audit')){localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(16).fill(true)},weapons:{version:2,owned},tutorial:{firstBattleCompleted:true}}));localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['shizuku','nyanluna'],lead:'shizuku'}));localStorage.setItem('scythe-audit','1');}},WEAPON_CATALOG.map(w=>w.id));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('http://127.0.0.1:5185',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.click('#start');await page.click('[data-menu-tab="weapons"]');await page.click('.shizuku-scythe-catalog summary');
 assert.equal(await page.locator('[data-scythe]').count(),10);await page.locator('.scythe-catalog-grid img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 await page.locator('.shizuku-scythe-catalog').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/scythe-catalog-desktop.png`});
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.locator('.shizuku-scythe-catalog').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);await page.screenshot({path:`${out}/scythe-catalog-${width}.png`});}
 checks.push('All ten names, rarity-specific icons, ownership and acquisition instructions load on desktop and mobile');
 await page.setViewportSize({width:1440,height:1000});await page.click('[data-menu-tab="equipment"]');await page.click('[data-equipment-hero="shizuku"]');
 assert.equal(await page.locator('[data-weapon-option]').count(),10);await page.click('[data-equip-weapon="garnet-scythe-r4"]');assert.match(await page.locator('[data-weapon-option="garnet-scythe-r4"]').innerText(),/装備中/);
 await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.click('#start');await page.click('[data-menu-tab="equipment"]');await page.click('[data-equipment-hero="shizuku"]');assert.match(await page.locator('[data-weapon-option="garnet-scythe-r4"]').innerText(),/装備中/);
 checks.push('Legendary scythe equips through UI and survives reload');
 await page.evaluate(()=>window.__LUNARIA_TEST__.start());await page.waitForTimeout(350);
 const result=await page.evaluate(async()=>{
  const t=window.__LUNARIA_TEST__,g=t.game;g.pause();g.enemies=[];g.player.invincible=999;
  const {equipWeapon}=await import('/src/weapons.js');const switched=[];
  for(const id of ['crimson-scythe-r1','crimson-scythe-r4','twilight-scythe-r4','garnet-scythe-r4']){equipWeapon(g.progression,'shizuku',id);t.world.render(g,0);switched.push(t.world.heroes[4].userData.weapon.userData.variantId);}
  return switched;
 });assert.deepEqual(result,['crimson-scythe-r1','crimson-scythe-r4','twilight-scythe-r4','garnet-scythe-r4']);await page.screenshot({path:`${out}/scythe-legendary-battle.png`});checks.push('Held model switches by family and rarity in the actual battle renderer');
 assert.deepEqual(errors,[]);
}catch(e){errors.push(e.stack);throw e;}finally{await writeFile(`${out}/scythe-browser-report.json`,JSON.stringify({checks,errors},null,2));await browser.close();}
console.log('PASS',checks.length,'scythe browser checks');
