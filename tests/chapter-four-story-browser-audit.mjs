import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {FOURTH_CHAPTER_SCENES} from '../src/chapter-four-story.js';
import {dialogueVoiceId} from '../src/voice-catalog.js';
const browser=await chromium.launch({channel:'chrome',headless:true}),out='audit/chapter-four',checks=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(()=>{localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(16).fill(true)},tutorial:{firstBattleCompleted:true}}));});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('http://127.0.0.1:5185',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.click('#start');await page.click('[data-chapter="3"]');await page.click('[data-act="15"]');await page.click('#chapter-story');
 const lines=Object.values(FOURTH_CHAPTER_SCENES[3]).flatMap(s=>s.lines);
 for(const [i,line] of lines.entries()){
  assert.equal(await page.locator('#story-dialog').getAttribute('data-speaker'),line.who);
  assert.equal(await page.locator('.story-dialogue>p').innerText(),line.text);
  if(line.voiced){
   const id=dialogueVoiceId(line.who,line.text);await page.waitForFunction(id=>window.__LUNARIA_TEST__.voice.current?.id===id&&!!window.__LUNARIA_TEST__.voice.current?.source,id,{timeout:20000});
   assert.equal(await page.locator('#story-voice').isEnabled(),true);checks.push(id);
   if(line.who==='narrator'){
    await page.click('#story-voice');await page.waitForFunction(id=>window.__LUNARIA_TEST__.voice.current?.id===id&&!!window.__LUNARIA_TEST__.voice.current?.source,id,{timeout:10000});
    await page.screenshot({path:`${out}/act-four-story-${i}.png`});
   }
  }else{assert.equal(await page.locator('#story-voice').count(),0);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.current),null);}
  assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.lastError),null);
  if(i<lines.length-1)await page.click('#story-next');
 }
 await page.click('#story-skip');assert.equal(await page.locator('#story-dialog').isVisible(),false);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.current),null);
 assert.equal(checks.length,17);assert.deepEqual(errors,[]);
}catch(e){errors.push(e.stack);throw e;}finally{await writeFile(`${out}/story-browser-report.json`,JSON.stringify({checks,errors},null,2));await browser.close();}
console.log('PASS',checks.length,'voiced chapter-four final-act lines, replay, and skip');
