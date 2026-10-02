import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.LUNARIA_URL??'http://127.0.0.1:4176/lunaneco-adventure/',out='audit/nyanluna-awakening',checks=[],errors=[];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const base=new URL(url).pathname;
try{
 for(const [level,learned] of [[49,false],[50,false],[50,true]]){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await context.addInitScript(({level,learned})=>{localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(32).fill(true)},characters:{nyanluna:{level,breaks:3},shizuku:{level:50,breaks:3}},awakenings:{nyanluna:learned},tutorial:{firstBattleCompleted:true}}));localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['nyanluna','shizuku'],lead:'nyanluna'}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false,voice:false}));},{level,learned});
  await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');await page.locator('#start').click();await page.locator('[data-chapter="0"]').click();assert.equal(await page.locator('[data-act="32"]').isEnabled(),level>=50);
  if(level>=50){await page.locator('[data-act="32"]').click();assert.match(await page.locator('.stage-briefing').innerText(),/にゃんるな1人で出撃/);await page.locator('#chapter-start').click();await page.locator('#story-skip').click();assert.equal(await page.locator('#nyan-awakening').isVisible(),learned);if(learned){await page.locator('#nyan-awakening').click();await page.waitForFunction(()=>document.querySelector('#hero-name').textContent==='にゃんるな・覚醒');assert.match(await page.locator('#switch .portrait').evaluate(e=>getComputedStyle(e).backgroundImage),new RegExp(base+'assets/portraits/nyanluna-awakening-face'));assert.match(await page.locator('#ultimate').getAttribute('aria-label'),/月華覚醒/);await page.screenshot({path:`${out}/production-awakening-mobile.png`});}}
  checks.push({level,learned,questEnabled:level>=50,awakeningAvailable:learned});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/production-report.json`,JSON.stringify({url,checks,errors},null,2));console.log('PASS Pages prefix, Lv.49/50, unlearned/learned controls, native awakening and face asset; no dev bridge');
}catch(e){await writeFile(`${out}/production-report.json`,JSON.stringify({url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
