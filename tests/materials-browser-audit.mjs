import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {normalizeProgression} from '../src/progression.js';
import {HEROES} from '../src/model.js';
import {TREE_RESOURCES,FIRST_TIER_NODES} from '../src/talents.js';
const BASE=process.env.LUNARIA_URL||'http://127.0.0.1:5185/',OUT=process.env.MATERIAL_AUDIT_OUT||'audit/materials-v148',engine=process.env.MATERIAL_BROWSER||'chromium';
const seed=normalizeProgression({story:{version:2,actClears:Array(8).fill(true)},characters:{nyanluna:{level:30,breaks:1,tree:FIRST_TIER_NODES.map(n=>n.id)}},inventory:{starBud:1280,moonDew:36,wardenCore:9,moonPrism:24,astralCore:8,limitStone:3}},HEROES);
const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true})),errors=[];await mkdir(OUT,{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await context.addInitScript(seed=>{if(sessionStorage.getItem('materials-seeded'))return;localStorage.setItem('lunaria-progression-v1',JSON.stringify(seed));localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,music:false,voice:false,quality:'low',motion:false}));sessionStorage.setItem('materials-seeded','1');},seed);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 async function openTree(){await page.locator('#chapter-menu-open').click();await page.locator('[data-menu-tab="talent"]').click();await page.locator('.material-wallet img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));}
 await page.goto(BASE);await page.waitForSelector('#loading',{state:'detached',timeout:60000});await openTree();
 assert.equal(await page.locator('.material-item.rarity-1').count(),3);assert.equal(await page.locator('.material-item.rarity-2').count(),2);assert.equal(await page.locator('.material-item.rarity-special').count(),1);
 const sources=new Set();for(const [id,item] of Object.entries(TREE_RESOURCES)){const card=page.locator(`[data-material="${id}"]`);assert.equal(await card.locator('h4').innerText(),item.name);assert.equal(await card.locator('strong').innerText(),seed.inventory[id].toLocaleString());sources.add(await card.locator('img').getAttribute('src'));assert.ok(await card.locator('img').evaluate(img=>img.naturalWidth>=256));}
 assert.equal(sources.size,6);console.log('PASS all six materials have distinct illustrations, names and explicit rarity badges');
 for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.locator('.material-wallet').scrollIntoViewIfNeeded();
  const overflows=await page.locator('.material-item,.material-name,.material-stock').evaluateAll(els=>els.filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.className));assert.deepEqual(overflows,[]);
  assert.equal(await page.locator('#chapter-menu').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
  await page.locator('.material-wallet').screenshot({path:`${OUT}/${engine}-wallet-${size.width}.png`});
 }
 console.log('PASS material art, full names and counts fit narrow phones, landscape and desktop');
 await page.setViewportSize({width:390,height:844});await page.locator('[data-tree-tier="2"]').click();
 const costs=page.locator('#talent-detail .talent-cost');assert.match(await costs.innerText(),/月虹の結晶/);assert.match(await costs.innerText(),/深星の宝珠/);assert.equal(await costs.locator('img').count(),3);await costs.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
 await page.locator('[data-tree-node="limit40"]').click();assert.match(await costs.innerText(),/覚醒の輝石/);await costs.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));await page.locator('#talent-detail').screenshot({path:`${OUT}/${engine}-costs.png`});
 await page.locator('[data-menu-tab="missions"]').click();const reward=page.locator('[data-mission="act5-0-rare-material"] .mission-reward');assert.match(await reward.innerText(),/★2 月虹の結晶 ×1/);await reward.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
 await reward.screenshot({path:`${OUT}/${engine}-mission-reward.png`});
 console.log('PASS costs and mission rewards use the same material names and illustrations');
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')).inventory),seed.inventory);
 await page.reload();await page.waitForSelector('#loading',{state:'detached'});await openTree();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')).inventory),seed.inventory);
 const maximumContext=await browser.newContext({viewport:{width:320,height:568},hasTouch:true});
 const maximumProfile=structuredClone(seed);for(const id of Object.keys(TREE_RESOURCES))maximumProfile.inventory[id]=99999999;
 await maximumContext.addInitScript(profile=>{localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,music:false,voice:false,quality:'low',motion:false}));},maximumProfile);
 const maximumPage=await maximumContext.newPage();maximumPage.on('pageerror',e=>errors.push(e.message));await maximumPage.goto(BASE);await maximumPage.waitForSelector('#loading',{state:'detached',timeout:60000});await maximumPage.locator('#chapter-menu-open').click();await maximumPage.locator('[data-menu-tab="talent"]').click();
 assert.equal(await maximumPage.locator('[data-material=starBud] strong').innerText(),'99,999,999');
 assert.deepEqual(await maximumPage.locator('.material-item,.material-stock').evaluateAll(els=>els.filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.className)),[]);await maximumContext.close();
 console.log('PASS existing saved counts survive reload and maximum counts remain readable');
 assert.deepEqual(errors,[]);await writeFile(`${OUT}/${engine}-report.json`,JSON.stringify({base:BASE,errors,inventory:seed.inventory,art:[...sources]},null,2));await context.close();
}finally{await browser.close();}
