import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/difficulty';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],checks=[];
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
await context.addInitScript(()=>{
 localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false}));
 if(!localStorage.getItem('lunaria-progression-v1'))localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:[true,true,true,true],tsukinekoUnlocked:true},tutorial:{firstBattleCompleted:true},characters:{nyanluna:{level:16,xp:12}},inventory:{starBud:123,moonDew:21,wardenCore:5,limitStone:2}}));
});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const mode=key=>page.locator(`#stage-difficulty [data-difficulty="${key}"]`);
const selected=async key=>{
 assert.equal(await mode(key).getAttribute('aria-pressed'),'true');
 assert.equal(await mode(key==='hard'?'normal':'hard').getAttribute('aria-pressed'),'false');
 assert.equal(await mode(key).locator('[data-mode-selection]').innerText(),'選択中');
 assert.match(await page.locator('#chapter-start').innerText(),key==='hard'?/チャレンジモードで出発/:/冒険モードで出発/);
};
try{
 await page.goto('http://127.0.0.1:5174/?v=difficulty-audit');await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.click('#chapter-menu-open');const saveBefore=await page.evaluate(()=>localStorage.getItem('lunaria-progression-v1'));
 await selected('normal');await mode('hard').click();await selected('hard');
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.difficulty),'hard');
 assert.equal(await page.locator('#modal').isVisible(),false);
 pass('Stage selection switches difficulty directly, keeps focus, and labels departure');
 for(let act=0;act<4;act++){
  await page.click(`[data-act="${act}"]`);await selected('hard');
  const expected=act===0?'meadow-trial':`act${act+1}-relic`;
  await page.locator('#stage-difficulty [data-show-mission]').click();
  assert.equal(await page.locator('#missions-panel').isVisible(),true);
  const box=await page.locator(`[data-mission="${expected}"]`).boundingBox();assert.ok(box.y>=0&&box.y<844);
  await page.click('[data-menu-tab="adventure"]');await selected('hard');
 }
 pass('All four acts retain the chosen mode and link to their own challenge conditions');
 await page.click('[data-menu-tab="growth"]');await page.click('[data-menu-tab="adventure"]');await selected('hard');
 await page.click('#menu-title');assert.match(await page.locator('#difficulty').innerText(),/チャレンジモード/);
 await page.click('#difficulty');await page.locator('#modal [data-difficulty="normal"]').click();
 assert.equal(await page.locator('#modal').isVisible(),false);await page.click('#chapter-menu-open');await selected('normal');
 await page.click('[data-menu-tab="missions"]');await page.click('[data-prepare-challenge]');await selected('hard');
 assert.equal(await page.locator('#adventure-panel').isVisible(),true);
 const selectorBox=await page.locator('#stage-difficulty').boundingBox();assert.ok(selectorBox.y>=0&&selectorBox.y<100);
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.difficulty),'hard');
 pass('Title, menu tabs and mission shortcut use the same mode and show the selection');
 await mode('normal').focus();await page.keyboard.press('Enter');await selected('normal');await page.keyboard.press('Tab');await page.keyboard.press('Space');await selected('hard');
 assert.equal(await page.evaluate(()=>localStorage.getItem('lunaria-progression-v1')),saveBefore);
 pass('Keyboard selection works without altering character growth, equipment or progress');
 for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.locator('#stage-difficulty').scrollIntoViewIfNeeded();
  for(const target of ['#stage-difficulty',...['normal','hard'].map(key=>`#stage-difficulty [data-difficulty="${key}"]`),'#chapter-start']){
   const bounds=await page.locator(target).boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=size.width+1,`${target} ${JSON.stringify(bounds)}`);
   assert.equal(await page.locator(target).evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
  }
  for(const key of ['normal','hard']){await mode(key).click();await selected(key);const b=await mode(key).boundingBox();assert.ok(b.height>=44);}
  for(const preview of await page.locator('.terrain-preview').all())if(await preview.isVisible()){
   const map=await preview.boundingBox(),title=await preview.locator('..').locator('h3').boundingBox();assert.ok(map.y+map.height<=title.y,'Terrain thumbnail must not cover the stage title');
  }
  await page.locator('#stage-difficulty').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:`${out}/selector-${size.width}.png`});
  await page.locator('#chapter-start').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/departure-${size.width}.png`});
 }
 pass('Mode cards and departure fit 320px, 390px, landscape and desktop viewports');
 await page.setViewportSize({width:390,height:844});await page.click('[data-act="0"]');
 const stats={};
 for(const key of ['hard','normal']){
  await mode(key).click();await page.click('#chapter-start');
  stats[key]=await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game,e=g.spawnEnemy('moss',0,-3);return {difficulty:g.difficulty,act:g.act,hp:e.maxHp,damage:e.damage};});
  assert.equal(stats[key].difficulty,key);assert.equal(stats[key].act,0);
  await page.click('#story-skip');await page.click('#pause');await page.click('#quit');await selected(key);
 }
 assert.ok(Math.abs(stats.hard.hp/stats.normal.hp-1.3)<1e-10);assert.ok(Math.abs(stats.hard.damage/stats.normal.damage-1.3)<1e-10);
 pass('Actual departures use the selected mode; challenge enemies have 30% higher HP and attack',stats);
 // Check the built app using an isolated origin/save; leave the user's browser untouched.
 await page.goto('http://127.0.0.1:4173/?v=difficulty-audit');await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');await page.click('#chapter-menu-open');
 await mode('hard').click();await selected('hard');await mode('normal').click();await selected('normal');
 pass('Built production app shows the selector and has no developer bridge');
 assert.deepEqual(errors,[]);pass('No JavaScript or resource errors');
 await writeFile(`${out}/report.json`,JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),checks,errors},null,2));
}finally{await browser.close();}
