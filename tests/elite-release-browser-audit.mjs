import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const url=process.env.AUDIT_URL??'http://127.0.0.1:4173/',out='audit/elite-release';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await context.addInitScript(()=>{if(sessionStorage.getItem('elite-audit'))return;localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(8).fill(true)},characters:{nyanluna:{level:30,breaks:1},tsukineko:{level:30,breaks:1}},inventory:{starBud:321,moonDew:21,wardenCore:7,moonPrism:12,astralCore:4,limitStone:2},tutorial:{firstBattleCompleted:true}}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,music:false,sound:false}));sessionStorage.setItem('elite-audit','1');});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:60000});assert.match(await page.locator('.version').innerText(),/1\.23/);assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));await page.locator('#chapter-menu-open').tap();const before=await saved();
 for(const chapter of [0,1]){await page.locator(`[data-chapter="${chapter}"]`).tap();for(let act=chapter*4;act<chapter*4+4;act++){await page.locator(`[data-act="${act}"]`).tap();const notes=await page.locator('.terrain-badge').allTextContents();for(const note of notes.filter(t=>t.includes('分岐')))assert.match(note,/強ボス HP×2・攻撃威力×2/);}}
 await page.locator('[data-chapter="0"]').tap();await page.locator('[data-act="0"]').tap();
 for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){await page.setViewportSize(size);assert.equal(await page.locator('#chapter-menu').evaluate(el=>el.scrollWidth>el.clientWidth),false);for(const el of await page.locator('.terrain-badge').all())assert.equal(await el.evaluate(el=>el.scrollWidth>el.clientWidth),false);await page.locator('.terrain-badge').last().scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/menu-${size.width}.png`});}
 await page.reload();await page.waitForSelector('#loading',{state:'detached'});assert.deepEqual(await saved(),before);assert.deepEqual(errors,[]);console.log('PASS',url,'v1.23: seven fork descriptions, four screen sizes, save preservation, production bridge removal and no browser errors');await context.close();
}finally{await browser.close();}
