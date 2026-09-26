import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {ENEMY_TYPES,BOSSES,BOSS_IDS} from '../src/enemies.js';
const out='audit/enemies';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
const pass=(name,data={})=>{checks.push({name,...data});console.log('PASS',name,JSON.stringify(data));};
const sizes=[{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:1440,height:900}];
const context=await browser.newContext({viewport:sizes[0],hasTouch:true,isMobile:true,deviceScaleFactor:1});
await context.addInitScript(()=>{localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false}));localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:[true,true,true,true],tsukinekoUnlocked:true},tutorial:{firstBattleCompleted:true}}));});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
async function scene({act=0,type,action=0}={}){
 await page.evaluate(async({act,type,action})=>{
  const {ACTS}=await import('/src/acts.js'),t=window.__LUNARIA_TEST__;t.home();t.start();const g=t.game;g.act=act;g.actConfig=ACTS[act];g.enemies=[];g.projectiles=[];g.hazards=[];g.orbs=[];g.wave=type==='boss'?6:({archer:2,mage:3,charger:4}[type]??4);g.area=type==='boss'?2:0;g.waveGoal=1;g.waveSpawned=1;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.player.x=0;g.player.z=3;g.partner.x=-2;g.partner.z=4;g.drainEvents();
  if(type){g.waveSpawned=0;g.spawn();const e=g.enemies[0];e.x=-2;e.z=-3;e.action=action;e.special=0;g.tick(1/60);g.pause();}
  else g.pause();g.emit('wave',{wave:g.wave,boss:type==='boss',area:g.area});t.step(0);
 },{act,type,action});
 await page.waitForTimeout(180);
}
try{
 await page.goto('http://127.0.0.1:5174/?v=enemies-audit');await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 for(const type of ['archer','mage','charger']){
  await scene({type});const visual=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game,e=g.enemies[0],m=t.world.entities.get(e.id),h=g.hazards[0],hm=t.world.hazardMeshes.get(h.id);return {type:m.userData.type,hazardKind:h.kind,hazardShape:h.shape??'circle',children:hm.children.length,color:hm.children[0].material.color.getHex(),timer:h.timer,stats:t.stats};});
  assert.equal(visual.type,type);assert.equal(visual.children,2);assert.match(await page.locator('#toast').innerText(),new RegExp(ENEMY_TYPES[type].name));await page.screenshot({path:`${out}/${type}-warning-390.png`});
  const hp=await page.evaluate(()=>window.__LUNARIA_TEST__.game.player.hp);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.hazards[0].timer),visual.timer);
  if(type==='archer'){
   await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.resume();t.game.player.x=5;t.step(1);t.game.pause();});await page.waitForTimeout(100);const bullet=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,b=t.game.projectiles.find(b=>b.owner==='enemy'),m=t.world.bullets.get(b?.id);return {kind:b?.kind,parts:m?.children.length};});assert.equal(bullet.kind,'enemyArrow');assert.equal(bullet.parts,2);await page.screenshot({path:`${out}/archer-arrow-390.png`});
  }else if(type==='mage'){
   await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.resume();t.step(1.7);t.game.pause();});assert.ok(await page.evaluate(()=>window.__LUNARIA_TEST__.game.player.hp)<hp);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.world.hazardMeshes.size),0);
  }else{
   await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.resume();t.game.player.x=6;t.step(1.2);t.game.pause();});assert.ok(await page.evaluate(()=>!!window.__LUNARIA_TEST__.game.enemies[0].rush));assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.runHits),0);
  }
  pass(`${ENEMY_TYPES[type].name}: visible warning, frozen pause and distinct attack`,visual);
 }
 for(let act=0;act<4;act++){
  const id=BOSS_IDS[act];await scene({act,type:'boss',action:act===1?1:act===2?2:0});
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.emit('wave',{wave:6,boss:true,area:2});t.step(0);});
  assert.equal(await page.locator('#boss-hud span').innerText(),BOSSES[id].name);assert.equal(await page.locator('#boss-hud small').innerText(),BOSSES[id].subtitle);
  const model=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,e=t.game.enemies[0],m=t.world.entities.get(e.id);return {bossId:m.userData.bossId,wings:m.userData.wings.length,rotors:m.userData.rotors.length,hazards:t.world.hazardMeshes.size,stats:t.stats};});assert.equal(model.bossId,id);if(act===1)assert.equal(model.hazards,4);if(act===2)assert.equal(model.wings,2);
  for(const size of sizes){await page.setViewportSize(size);await page.waitForTimeout(100);assert.equal(await page.locator('#boss-hud').evaluate(el=>el.scrollWidth>el.clientWidth),false);const b=await page.locator('#wave-banner').boundingBox();assert.ok(b.x>=-.5&&b.x+b.width<=size.width+.5);if(size.width===390||size.width===1440)await page.screenshot({path:`${out}/boss-${id}-${size.width}.png`});}
  await page.setViewportSize(sizes[0]);await page.evaluate(()=>window.__LUNARIA_TEST__.game.resume());await page.click('#pause');assert.match(await page.locator('.enemy-guide').innerText(),new RegExp(BOSSES[id].name));
  for(const size of sizes){await page.setViewportSize(size);await page.locator('.enemy-guide').scrollIntoViewIfNeeded();assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth),false);}
  await page.click('#resume');await page.evaluate(()=>window.__LUNARIA_TEST__.game.pause());await page.setViewportSize(sizes[0]);pass(`Act ${act+1}: distinct ${BOSSES[id].name} model, attack and mobile HUD`,model);
 }
 await scene();const before=await page.evaluate(()=>window.__LUNARIA_TEST__.stats.geometries);
 for(let cycle=0;cycle<8;cycle++){
  await page.evaluate(async()=>{const t=window.__LUNARIA_TEST__,g=t.game,{ACTS}=await import('/src/acts.js');for(const [i,type] of ['archer','mage','charger'].entries())g.spawnEnemy(type,i*2-2,-2);for(let i=0;i<4;i++){g.actConfig=ACTS[i];g.spawnEnemy('boss',i*3-4,-5);}for(const e of g.enemies)e.special=0;g.resume();g.tick(1/60);g.pause();t.step(0);});await page.waitForTimeout(50);
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.enemies=[];t.game.projectiles=[];t.game.hazards=[];t.world.reset();});await page.waitForTimeout(70);
 }
 const after=await page.evaluate(()=>({geometries:window.__LUNARIA_TEST__.stats.geometries,entities:window.__LUNARIA_TEST__.world.entities.size,hazards:window.__LUNARIA_TEST__.world.hazardMeshes.size}));assert.ok(after.geometries<=before+2,JSON.stringify({before,after}));assert.equal(after.entities,0);assert.equal(after.hazards,0);pass('Repeated mobs, bosses and warnings release their geometry',{before,after});
 await scene({type:'mage'});for(const size of sizes){await page.setViewportSize(size);const fit=await page.locator('#toast').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&el.scrollWidth<=el.clientWidth;});assert.ok(fit,`Enemy hint overflow at ${size.width}`);}pass('Longest new enemy hint fits all four screen sizes');
 assert.deepEqual(errors,[]);pass('No JavaScript, WebGL shader or missing-resource errors');await writeFile(`${out}/report.json`,JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),checks,errors},null,2));
}finally{await browser.close();}
