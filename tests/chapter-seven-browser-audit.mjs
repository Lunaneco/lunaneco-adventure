import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.LUNARIA_URL??'http://localhost:5187/',out='audit/chapter-seven';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
async function open({act=29,cleared=32,members=['lumi','mochinyafe'],lead=members[0],mobile=true}={}){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},hasTouch:mobile,serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(({cleared,members,lead})=>{
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array.from({length:32},(_,i)=>(i<20||i>=24)&&i<cleared)},characters:Object.fromEntries(['nyanluna','tsukineko','omsolo','mochinyafe','shizuku','prim','hehereal','lumi'].map(id=>[id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}}));
  localStorage.setItem('lunaria-party-v1',JSON.stringify({members,lead}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,voice:false,music:false,motion:false}));
 },{cleared,members,lead});
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.locator('#start').click();await page.locator('[data-chapter="6"]').click();await page.locator(`[data-act="${act}"]`).click();const briefing=await page.locator('.brief-party-rule').innerText();
 await page.locator('#chapter-start').click();await page.locator('#story-skip').click();
 await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;g.enemies=[];g.hazards=[];g.projectiles=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;});return {context,page,briefing};
}
try{
 for(const act of [28,29]){const {context,page,briefing}=await open({act,cleared:act,members:['nyanluna','prim'],lead:'prim'});assert.match(briefing,/もちにゃふぇ操作固定/);let state=await page.evaluate(()=>window.__LUNARIA_TEST__.state);assert.equal(state.player.hero,3);assert.deepEqual(state.party,act===28?['mochinyafe']:['mochinyafe','lumi']);assert.equal(await page.locator('#switch-action').isVisible(),false);
  if(act===28){await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.wave=2;g.phase='transition';g.advanceStage();t.step(0);});await page.waitForTimeout(150);assert.equal(await page.locator('#partner-name').innerText(),'ねこるみ');}
  const npc=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,h=t.world.heroes[7];return {guest:t.game.guestHeroId,ears:h.userData.ears.visible,range:t.game.attackProfile(7).range===Infinity};});assert.deepEqual(npc,{guest:'lumi',ears:true,range:true});await page.screenshot({path:`${out}/first-clear-act-${act}.png`});pass(`First clear ${act}: Mochi fixed, Neko Lumi support, no manual switch`);await context.close();}
 {
  const {context,page}=await open({mobile:false});assert.equal(await page.locator('#hero-name').innerText(),'ねこるみ');assert.equal(await page.locator('#switch-action').isVisible(),true);
  const result=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game,h=t.world.heroes[7];g.enemies=[];const e=g.spawnEnemy('antiGuard',g.player.x,g.player.z-200);Object.assign(e,{hp:1e6,maxHp:1e6,speed:0,attack:999,special:999});g.attackFrom(g.player,7);t.step(0);const fx=g.drainEvents();return {hit:e.hp<1e6,guest:g.guestHeroId,ears:h.userData.ears.visible,triangles:h.userData.metrics.triangles,meshes:h.userData.metrics.meshes,weapon:h.userData.weapon.name,transparent:[]};});
  assert.equal(result.hit,true);assert.equal(result.guest,null);assert.equal(result.ears,true);assert.ok(result.triangles<180000&&result.meshes<=18);assert.equal(result.weapon,'Lumi fingertip light');
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];for(let i=0;i<5;i++)g.spawnEnemy(['antiBrawler','antiSniper','antiCaster','antiRunner','antiGuard'][i],-7+i*3,-7);g.waveSpawned=g.waveGoal;g.waveBreak=-999;});await page.waitForTimeout(120);await page.screenshot({path:`${out}/nekolumi-desktop.png`});pass('Neko Lumi real 3D ears, fingertip light and distant damage',result);
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.player.charge=100;t.ultimatePresentation.start(t.game);});assert.equal(await page.locator('#ultimate-cutin').getAttribute('data-hero'),'nekolumi');assert.equal(await page.locator('.cutin-hero').innerText(),'ねこるみ');await page.waitForFunction(()=>{const i=document.querySelector('.cutin-face');return i.complete&&i.naturalWidth>0;});await page.waitForTimeout(900);await page.screenshot({path:`${out}/nekolumi-ultimate.png`});await page.evaluate(()=>window.__LUNARIA_TEST__.ultimatePresentation.skip());pass('Neko ultimate has its dedicated illustration, name and voice text');await context.close();
 }
 {
  const {context,page}=await open({members:['lumi','tsukineko']});assert.equal(await page.locator('#hero-name').innerText(),'るみ');
  const result=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game,h=t.world.heroes[7];const e=g.spawnEnemy('antiGuard',g.player.x,g.player.z-200);Object.assign(e,{hp:1e6,maxHp:1e6,speed:0,attack:999,special:999});return {attacked:g.attackFrom(g.player,7),range:g.attackProfile(7).range,ears:h.userData.ears.visible,guest:g.guestHeroId};});assert.deepEqual(result,{attacked:false,range:14,ears:false,guest:null});await page.screenshot({path:`${out}/lumi-mobile.png`});
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.player.charge=100;t.ultimatePresentation.start(t.game);});assert.equal(await page.locator('#ultimate-cutin').getAttribute('data-hero'),'lumi');await page.waitForFunction(()=>{const i=document.querySelector('.cutin-face');return i.complete&&i.naturalWidth>0;});await page.waitForTimeout(900);await page.screenshot({path:`${out}/lumi-ultimate-mobile.png`});await page.evaluate(()=>window.__LUNARIA_TEST__.ultimatePresentation.skip());pass('Normal Lumi remains human, finite-range, with separate ultimate');await context.close();
 }
 {
  const {context,page}=await open({members:['nyanluna','prim'],lead:'prim'});assert.equal(await page.locator('#hero-name').innerText(),'プリム');await page.locator('#switch-action').click();assert.equal(await page.locator('#hero-name').innerText(),'にゃんるな');const state=await page.evaluate(()=>window.__LUNARIA_TEST__.state);assert.deepEqual(state.party,['nyanluna','prim']);assert.equal(state.guestHeroId,null);pass('Free replay preserves the selected duo and ordinary touch switching');await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/browser-report.json`,JSON.stringify({url,checks,errors},null,2));
}catch(e){await writeFile(`${out}/browser-report.json`,JSON.stringify({url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
