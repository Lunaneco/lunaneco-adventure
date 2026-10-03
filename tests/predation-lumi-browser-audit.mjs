import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.LUNARIA_URL??'http://127.0.0.1:5191/',out=process.env.PREDATION_LUMI_AUDIT_OUT??'audit/predation-lumi-20261003/local';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
async function open(spec){
 const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},hasTouch:spec.width<500,serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(spec=>{
  const ids=['nyanluna','tsukineko','omsolo','mochinyafe','shizuku','prim','hehereal','lumi'];
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(spec.firstClear?28:29).fill(true)},characters:Object.fromEntries(ids.map(id=>[id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}}));
  localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['omsolo','hehereal'],lead:spec.lead}));
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,voice:false,music:false,motion:false}));
 },spec);
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});
 const savedParty=await page.evaluate(()=>localStorage.getItem('lunaria-party-v1'));
 await page.locator('#start').click();await page.locator('[data-chapter="6"]').click();await page.locator('[data-act="28"]').click();await page.locator('#chapter-start').click();await page.locator('#story-skip').click();
 return {page,context,savedParty};
}
async function gate(page,wave){
 const state=await page.evaluate(wave=>{
  const t=window.__LUNARIA_TEST__,g=t.game;g.wave=wave;g.area=Math.floor((wave-1)/2);g.enemies=[];g.projectiles=[];g.hazards=[];g.ultimateEffects=[];g.orbs=[];g.pendingBlessings=0;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);
  if(!g.crossExit())throw Error('gate did not open');t.step(0);return t.state;
 },wave);
 await page.waitForSelector('#story-dialog[open]');await page.locator('#story-skip').click();
 return state;
}
try{
 for(const spec of [{name:'mobile-omsolo',width:390,height:844,lead:'omsolo'},{name:'mobile-hehereal',width:320,height:568,lead:'hehereal'},{name:'desktop-hehereal',width:1280,height:800,lead:'hehereal'}]){
  const {page,context,savedParty}=await open(spec);
  assert.equal(await page.locator('#predation').isEnabled(),true);await page.locator('#predation').click();
  assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.state.party),['hehereal']);
  await gate(page,2);await page.waitForTimeout(200);
  const state=await page.evaluate(()=>window.__LUNARIA_TEST__.state);
  assert.deepEqual(state.party,['hehereal']);assert.equal(state.guestHeroId,null);assert.equal(state.player.hero,6);assert.equal(state.predation.active,true);assert.equal(state.wave,3);assert.equal(state.phase,'playing');
  assert.equal(await page.locator('#hero-name').innerText(),'へへへ');assert.equal(await page.locator('#switch-action').isVisible(),false);assert.equal(await page.locator('#predation-status').innerText(),'解除不可');assert.match(await page.locator('.partner-label').innerText(),/オムソロ取り込み中/);
  const before=state.time;await page.keyboard.down('KeyD');await page.waitForTimeout(1000);await page.keyboard.up('KeyD');
  const after=await page.evaluate(()=>({state:window.__LUNARIA_TEST__.state,visible:window.__LUNARIA_TEST__.world.heheForm.visible,lumi:window.__LUNARIA_TEST__.world.heroes[7].visible}));
  assert.ok(after.state.time>before+.5);assert.ok(Math.hypot(after.state.player.x-state.player.x,after.state.player.z-state.player.z)>.5);assert.equal(after.visible,true);assert.equal(after.lumi,false);
  await page.screenshot({path:`${out}/${spec.name}.png`});
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.player.charge=100;t.ultimatePresentation.start(g);});
  await page.waitForSelector('#ultimate-cutin[data-hero="hehehe"]:not(.hidden)');assert.equal(await page.locator('.cutin-ability').innerText(),'捕食の舞');await page.locator('#cutin-skip').click();
  await gate(page,4);assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.state.party),['hehereal']);const end=await gate(page,6);
  await page.waitForSelector('#chapter-menu:not(.hidden)');
  assert.equal(end.phase,'victory');assert.equal(end.predation.active,false);assert.deepEqual(end.party,['omsolo','hehereal']);assert.equal(end.player.hero,spec.lead==='omsolo'?2:6);assert.equal(end.recruitedHeroId,null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('lunaria-party-v1')),savedParty);
  checks.push({name:spec.name,passed:true,postEncounterWave:3,form:'solo',running:true,restoredLead:spec.lead});await context.close();
 }
 {
  const {page,context}=await open({width:390,height:844,lead:'hehereal',firstClear:true});await gate(page,2);
  assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.state.party),['mochinyafe','lumi']);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.state.guestHeroId),'lumi');assert.equal(await page.locator('#switch-action').isVisible(),false);
  checks.push({name:'first-clear-npc-unchanged',passed:true});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({status:'PASS',url,checks,errors},null,2));console.log(JSON.stringify({status:'PASS',cases:checks.length,errors}));
}catch(e){await writeFile(`${out}/report.json`,JSON.stringify({status:'FAIL',url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
