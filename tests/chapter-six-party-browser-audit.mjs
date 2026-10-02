import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const url=process.env.LUNARIA_URL??'http://localhost:5187/',out='audit/chapter-six';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
async function open({act=25,cleared=28,members=['nyanluna','prim'],lead=members[0]}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(({cleared,members,lead})=>{
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array.from({length:28},(_,i)=>(i<20||i>=24)&&i<cleared)},characters:Object.fromEntries(['nyanluna','tsukineko','omsolo','mochinyafe','shizuku','prim','hehereal'].map(id=>[id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}}));
  localStorage.setItem('lunaria-party-v1',JSON.stringify({members,lead}));
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,voice:false,music:false,motion:false}));
 },{cleared,members,lead});
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.locator('#start').click();await page.locator('[data-chapter="5"]').click();await page.locator(`[data-act="${act}"]`).click();
 const briefing=await page.locator('.brief-party-rule').innerText();
 await page.locator('#chapter-start').click();await page.locator('#story-skip').click();
 // Freeze enemy attacks, but keep real UI/input handling and renderer updates.
 await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;g.enemies=[];g.hazards=[];g.projectiles=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;});
 return {context,page,briefing};
}
try{
 for(const act of [24,25]){
  const {context,page,briefing}=await open({act,cleared:act});assert.match(briefing,/初回クリアまで/);
  const state=await page.evaluate(()=>window.__LUNARIA_TEST__.state);assert.equal(state.player.hero,2);assert.deepEqual(state.party,act===24?['omsolo']:['omsolo','hehereal']);assert.equal(await page.locator('#switch-action').isVisible(),false);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-party-v1')).members),['nyanluna','prim']);pass(`Uncleared act ${act} remains Omsolo solo-control without overwriting saved party`);await context.close();
 }
 for(const act of [24,25]){
  const {context,page,briefing}=await open({act,members:['nyanluna','prim'],lead:'prim'});assert.match(briefing,/クリア後の自由編成/);assert.match(briefing,/2人編成ではNPCへへりあるを追加しません/);
  assert.equal(await page.locator('#hero-name').innerText(),'プリム');assert.equal(await page.locator('#switch-action').isVisible(),true);assert.equal(await page.locator('#predation').isVisible(),false);
  const state=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;for(let i=1;i<6;i++)g.startWave();g.waveSpawned=g.waveGoal;g.waveBreak=-999;t.step(0);return t.state;});assert.deepEqual(state.party,['nyanluna','prim']);assert.equal(state.guestHeroId,null);
  await page.locator('#switch-action').click();assert.equal(await page.locator('#hero-name').innerText(),'にゃんるな');
  await page.screenshot({path:`${out}/free-party-act-${act}.png`});pass(`Cleared act ${act} keeps the chosen duo, allows touch switching and has no NPC in any wave`);await context.close();
 }
 {
  const {context,page}=await open({members:['hehereal','nyanluna'],lead:'hehereal'});assert.equal(await page.locator('#hero-name').innerText(),'へへりある');assert.equal(await page.locator('#switch-action').isVisible(),true);
  const state=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.player.invincible=0;g.hurt(1e9,0,0);t.step(0);return t.state;});assert.equal(state.phase,'playing');assert.equal(state.player.hero,0);assert.equal(state.guestHeroId,null);assert.equal(await page.locator('#hero-name').innerText(),'にゃんるな');pass('Recruited Hehereal is playable and an ordinary duo automatically switches on knockout');await context.close();
 }
 {
  const {context,page}=await open({members:['nyanluna']});const state=await page.evaluate(()=>window.__LUNARIA_TEST__.state);assert.deepEqual(state.party,['nyanluna','hehereal']);assert.equal(state.guestHeroId,'hehereal');assert.equal(state.player.hero,0);assert.equal(await page.locator('#switch-action').isVisible(),false);pass('Solo replay retains the selected character and receives only the NPC support slot');await context.close();
 }
 {
  const {context,page}=await open({members:['hehereal']});const state=await page.evaluate(()=>window.__LUNARIA_TEST__.state);assert.deepEqual(state.party,['hehereal']);assert.equal(state.guestHeroId,null);assert.equal(await page.locator('#switch-action').isVisible(),false);pass('Hehereal solo never gets a duplicate NPC');await context.close();
 }
 {
  const {context,page}=await open({act:24,members:['omsolo','hehereal']});assert.equal(await page.locator('#predation').isEnabled(),true);assert.equal(await page.locator('#switch-action').isVisible(),true);
  const health=await page.evaluate(()=>structuredClone(window.__LUNARIA_TEST__.game.heroHealth));await page.locator('#predation').click();assert.equal(await page.locator('#hero-name').innerText(),'へへへ');assert.equal(await page.locator('#switch-action').isVisible(),false);
  const state=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;for(let i=1;i<6;i++)g.startWave();g.waveSpawned=g.waveGoal;g.waveBreak=-999;t.step(0);return {state:t.state,hits:g.runHits,health:structuredClone(g.heroHealth),form:t.world.heheForm.visible};});assert.deepEqual(state.state.party,['hehereal']);assert.equal(state.state.guestHeroId,null);assert.equal(state.state.predation.active,true);assert.equal(state.state.predation.used,true);assert.equal(state.form,true);assert.equal(state.hits,0);assert.deepEqual(state.health,health);assert.equal(await page.locator('#predation').isEnabled(),false);pass('Free-party capture remains damage-free and irreversible; later waves never add an NPC');await context.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${out}/free-party-browser-report.json`,JSON.stringify({url,checks,errors},null,2));
}catch(e){await writeFile(`${out}/free-party-browser-report.json`,JSON.stringify({url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
