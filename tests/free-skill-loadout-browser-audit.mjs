import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {SKILLS} from '../src/blessings.js';

const url=process.env.LUNARIA_URL??'http://localhost:5187/',out=process.env.FREE_SKILL_AUDIT_OUT??'audit/free-skill-loadout-20261003';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
try{
 for(const cleared of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.addInitScript(cleared=>{
   if(localStorage.getItem('free-skill-audit-seeded'))return;
   localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(32).fill(true),extraClears:[false,false,false,false,false,cleared]},characters:{omsolo:{level:50,breaks:3}},awakenings:{rice:true},tutorial:{firstBattleCompleted:true}}));
   localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['lumi'],lead:'lumi'}));
   localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,voice:false,music:false}));
   localStorage.setItem('free-skill-audit-seeded','1');
  },cleared);
  const open=async()=>{await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});await page.locator('#start').click();await page.locator('#chapter-menu [data-open="party"]').click();};
  await open();
  if(!cleared){assert.equal(await page.locator('#party-skill-loadout').count(),0);checks.push({cleared,locked:true});await context.close();continue;}
  assert.equal(await page.locator('.version').innerText(),'Ver. 2.2.5');
  assert.equal(await page.locator('[data-party-equip-skill]').count(),SKILLS.length);assert.equal(await page.locator('[data-party-skill-slot]').count(),3);
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
  for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]){
   await page.setViewportSize({width,height});await page.locator('#party-skill-loadout header').scrollIntoViewIfNeeded();
   const sizes=await page.locator('#party-skill-loadout').evaluate(e=>({overflow:e.scrollWidth>e.clientWidth+1,slots:[...e.querySelectorAll('[data-party-skill-slot]')].map(b=>{const r=b.getBoundingClientRect();return {w:r.width,h:r.height};}),options:[...e.querySelectorAll('[data-party-equip-skill]')].map(b=>b.getBoundingClientRect().height),right:e.getBoundingClientRect().right}));
   assert.equal(sizes.overflow,false);assert.ok(sizes.right<=width+1);assert.ok(sizes.slots.every(s=>s.w>=44&&s.h>=44));assert.ok(sizes.options.every(h=>h>=44));
   checks.push({cleared,width,height,...sizes});await page.screenshot({path:`${out}/party-skills-${width}.png`});
  }
  await page.setViewportSize({width:390,height:844});
  for(const [slot,skill] of [[0,'bladeTempo'],[1,'moonDropBond'],[2,'moonFrost']]){
   await page.locator(`[data-party-skill-slot="${slot}"]`).click();await page.locator(`[data-party-equip-skill="${skill}"]`).click();
   assert.ok((await page.locator('#party-skill-feedback').innerText()).includes('保存しました'));
   assert.equal(await page.locator(`[data-party-skill-slot="${slot}"]`).getAttribute('aria-pressed'),'true');
  }
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
  assert.deepEqual(saved.blessingLoadouts.lumi,['bladeTempo','moonDropBond','moonFrost']);assert.deepEqual(saved.characters,before.characters);assert.deepEqual(saved.inventory,before.inventory);
  await open();for(const [slot,name] of [[0,'翠刃の連舞'],[1,'コーラは二人分'],[2,'月影の結界']])assert.ok((await page.locator(`[data-party-skill-slot="${slot}"]`).innerText()).includes(name));
  await page.locator('[data-party-toggle="omsolo"]').click();assert.equal(await page.locator('[data-party-skill-hero]').count(),2);
  await page.locator('[data-party-skill-hero="omsolo"]').click();await page.locator('[data-party-skill-slot="2"]').click();await page.locator('[data-party-equip-skill="lumiBrave"]').click();
  assert.ok((await page.locator('[data-party-skill-slot="2"]').innerText()).includes('好きでいても、いい'));
  await page.locator('[data-party-toggle="lumi"]').click();assert.equal(await page.locator('[data-party-skill-hero]').count(),1);
  assert.equal(await page.locator('[data-party-equip-skill="nova"]').getAttribute('data-blessing-hero'),'omsolo');
  checks.push({savedReload:true,allSlots:true,foreignUpper:true,foreignPair:true,soloDuo:true,unchangedGrowthWallet:true});
  await page.locator('#modal .dialog-close').click();
  if(await page.evaluate(()=>!!window.__LUNARIA_TEST__)){
   await page.evaluate(()=>window.__LUNARIA_TEST__.start());await page.waitForFunction(()=>window.__LUNARIA_TEST__.state.phase==='playing');
   const pool=await page.evaluate(()=>window.__LUNARIA_TEST__.state.skillPool);assert.ok(pool.includes('lumiBrave'));checks.push({combatPool:pool});
  }else{
   await page.locator('[data-act="0"]').click();await page.locator('#chapter-start').click();await page.locator('#story-skip').click();
   await page.waitForSelector('#rice:not(.hidden)');await page.locator('#rice').click();assert.equal(await page.locator('#rice').isDisabled(),true);assert.equal(await page.locator('#rice-label').innerText(),'反射中');
   await page.screenshot({path:`${out}/production-rice-mobile.png`});checks.push({production:true,testBridgeAbsent:true,riceButton:true,riceActivated:true});
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/browser-report.json`,JSON.stringify({url,checks,errors,status:'PASS'},null,2));console.log('PASS locked/unlocked, all slots, foreign/pair/upper candidates, solo/duo, reload, responsive layout and safe saves');
}finally{await browser.close();}
