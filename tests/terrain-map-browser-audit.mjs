import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const BASE=process.env.LUNARIA_URL||'http://127.0.0.1:5185/';
const OUT=process.env.MAP_AUDIT_DIR||'audit/terrain-map';
const engine=process.env.MAP_BROWSER||'chromium';
await mkdir(OUT,{recursive:true});
const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const checks=[],errors=[],pass=name=>{checks.push(name);console.log('PASS',name);};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await context.addInitScript(()=>{
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,voice:false,music:false}));
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(8).fill(true)},tutorial:{firstBattleCompleted:true}}));
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(BASE);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 async function fixture({act=0,area=0,bossOnly=false}={}){
  await page.evaluate(async({act,area,bossOnly})=>{
   const {ACTS}=await import('/src/acts.js'),t=window.__LUNARIA_TEST__;t.home();t.start();const g=t.game;
   g.act=act;g.actConfig=ACTS[act];g.area=area;g.wave=area*2+1;g.enemies=[];g.orbs=[];g.projectiles=[];g.hazards=[];
   g.waveSpawned=g.waveGoal=10;g.waveBreak=-999;g.spawnTimer=999;g.player.attack=g.partner.attack=999;g.player.x=0;g.player.z=8;
   if(bossOnly)g.spawnEnemy('boss',0,-5);
   else{g.spawnEnemy('moss',-8,-4);g.spawnEnemy('bat',7,2);g.spawnEnemy('archer',-6,9);g.spawnEnemy('boss',4,-9);g.spawnEnemy('boss',-5,-12,{elite:true});}
   for(const e of g.enemies){e.attack=e.special=999;e.damage=0;}
   g.pause();g.drainEvents();g.emit('wave',{wave:g.wave,area:g.area,theme:g.actConfig.stages[g.area].theme,act:g.act,boss:false});t.step(0);
  },{act,area,bossOnly});
 }
 async function checkPositions(){
  const state=await page.evaluate(()=>{
   const g=window.__LUNARIA_TEST__.game;
   return {expected:g.enemies.filter(e=>e.hp>0).map(e=>({id:String(e.id),transform:`translate(${e.x} ${e.z})`,boss:e.type==='boss'})),
    actual:[...document.querySelectorAll('#map-enemies .map-enemy')].map(e=>({id:e.dataset.enemyId,transform:e.getAttribute('transform'),boss:e.classList.contains('boss')}))};
  });
  assert.deepEqual(state.actual.sort((a,b)=>a.id.localeCompare(b.id)),state.expected.sort((a,b)=>a.id.localeCompare(b.id)));
 }
 await fixture();await checkPositions();
 assert.equal(await page.locator('#map-enemies circle').count(),3);assert.equal(await page.locator('#map-enemies path.boss').count(),2);
 assert.match(await page.locator('#field-map').getAttribute('aria-label'),/敵3体、ボス2体/);
 const appearance=await page.evaluate(()=>({
  enemy:getComputedStyle(document.querySelector('.map-enemy:not(.boss)')).fill,boss:getComputedStyle(document.querySelector('.map-enemy.boss')).fill,
  playerOnTop:document.querySelector('#field-map svg').lastElementChild.id==='map-player',legend:document.querySelector('.map-legend').innerText,
 }));
 assert.notEqual(appearance.enemy,appearance.boss);assert.equal(appearance.playerOnTop,true);assert.match(appearance.legend,/自分[\s\S]*敵[\s\S]*ボス/);
 pass('Live enemies appear at world coordinates; normal enemies, bosses and the player remain distinguishable');
 for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);
  for(const selector of ['#field-map','.map-legend']){
   const box=await page.locator(selector).boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=size.width&&box.y+box.height<=size.height,`${selector}: ${JSON.stringify(box)}`);
   assert.equal(await page.locator(selector).evaluate(e=>e.scrollWidth>e.clientWidth),false);
  }
  await page.screenshot({path:`${OUT}/${engine}-${size.width}.png`});
 }
 pass('Enemy markers and the legend fit narrow phones, landscape and desktop');
 await page.setViewportSize({width:390,height:844});
 const moved=await page.evaluate(()=>{
  const t=window.__LUNARIA_TEST__,g=t.game,id=g.enemies[0].id,old=document.querySelector(`[data-enemy-id="${id}"]`),before=old.getAttribute('transform');
  g.resume();for(let i=0;i<90;i++)g.tick(1/60,{x:.3,z:0});g.pause();t.step(0);
  return {reused:old===document.querySelector(`[data-enemy-id="${id}"]`),moved:before!==old.getAttribute('transform')};
 });
 assert.deepEqual(moved,{reused:true,moved:true});await checkPositions();pass('Real enemy movement updates existing markers without recreating them');
 const killed=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game,e=g.enemies[0];g.hit(e,999999,g.player.x,g.player.z);t.step(0);return {id:e.id,stillInArray:g.enemies.includes(e)};});
 assert.equal(killed.stillInArray,true);assert.equal(await page.locator(`[data-enemy-id="${killed.id}"]`).count(),0);await checkPositions();
 pass('Defeated enemies disappear immediately, before the simulation removes their records');
 for(const [area,kind,target] of [[1,'stairs','stairs'],[2,'branch','elite']]){
  await fixture({area});
  const travel=await page.evaluate(({kind,target})=>{
   const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];g.travelOpen=kind;g.travelDelay=0;t.step(0);
   const portal=g.travelTargets.find(p=>p.id===target),visible=document.querySelectorAll('#map-targets circle').length;
   Object.assign(g.player,{x:portal.x,z:portal.z});g.resume();const entered=g.enterPassage(target);g.pause();t.step(0);
   return {entered,visible,wave:g.wave,remaining:document.querySelectorAll('.map-enemy').length};
  },{kind,target});
  assert.equal(travel.entered,true);assert.ok(travel.visible>0);assert.equal(travel.wave,area*2+2);assert.equal(travel.remaining,0);
  await page.evaluate(elite=>{const t=window.__LUNARIA_TEST__;t.game.spawnEnemy('boss',0,-5,{elite});t.step(0);},kind==='branch');
  await checkPositions();assert.equal(await page.locator('.map-enemy').count(),1);
 }
 pass('Stairs and route changes clear old markers, retain passage markers and show enemies on the new floor');
 await fixture({bossOnly:true});await fixture();await checkPositions();assert.equal(await page.locator('.map-enemy').first().evaluate(e=>e.tagName),'circle');
 pass('Restarting the same field correctly resets reused enemy IDs and marker shapes');
 assert.deepEqual(errors,[]);await writeFile(`${OUT}/${engine}-report.json`,JSON.stringify({checks,errors},null,2));await context.close();
}finally{await browser.close();}
