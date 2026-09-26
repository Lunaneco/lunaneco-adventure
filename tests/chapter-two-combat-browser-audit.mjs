import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/chapter-two-combat';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});
await context.addInitScript(()=>{
 window.requestAnimationFrame=()=>0;
 localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false}));
 localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(8).fill(true),tsukinekoUnlocked:true,omsoloUnlocked:true},characters:{nyanluna:{level:30,xp:17,breaks:1},tsukineko:{level:20,xp:8}},inventory:{limitStone:2,starBud:123,moonDew:17,wardenCore:5},tutorial:{firstBattleCompleted:true}}));
});
const page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
const shot=async name=>page.screenshot({path:`${out}/${name}.png`});
async function fixture({act=4,area=0,room=0,type=null,all=false}={}){
 return page.evaluate(async({act,area,room,type,all})=>{
  const {ACTS}=await import('/src/acts.js'),{CHAPTER_TWO_ENEMIES}=await import('/src/enemies.js'),a=window.__LUNARIA_TEST__;
  a.home();a.start();const g=a.game,w=a.world;g.act=act;g.actConfig=ACTS[act];g.area=area;g.wave=area*2+(room===0?1:2);g.route='safe';
  g.enemies=[];g.projectiles=[];g.hazards=[];g.orbs=[];g.waveSpawned=g.waveGoal=99;g.waveBreak=-999;
  Object.assign(g.player,{x:0,z:5,attack:999,invincible:0,face:Math.PI});Object.assign(g.partner,{x:-2,z:6,attack:999});
  if(all)CHAPTER_TWO_ENEMIES.forEach((id,i)=>g.spawnEnemy(id,(i%3-1)*6,-6+Math.floor(i/3)*6));
  else{const e=g.spawnEnemy(type,0,type==='reaper'?2:-3);e.special=0;g.tick(1/60);}
  g.emit('wave',{wave:g.wave,area,theme:g.actConfig.stages[area].theme,boss:type==='boss'});g.pause();a.step(0);w.render(g,2);document.querySelector('#wave-banner').classList.remove('visible');
  return {height:g.layout.height,stats:w.stats(),types:g.enemies.map(e=>e.type),hazards:g.hazards.map(h=>({shape:h.shape,kind:h.kind,timer:h.timer})),hazardYs:[...w.hazardMeshes.values()].map(m=>m.position.y),enemies:[...w.entities.values()].map(m=>({y:m.position.y,visible:m.visible}))};
 },{act,area,room,type,all});
}
try{
 await page.goto('http://127.0.0.1:5174/?v=chapter-two-combat-audit');await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.click('#chapter-menu-open');await page.click('[data-chapter="1"]');await page.click('[data-act="4"]');
 for(const [width,height] of [[320,640],[390,844],[844,390],[1440,900]]){
  await page.setViewportSize({width,height});await page.locator('.encounter-brief').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('.encounter-roster span').count(),6);assert.match(await page.locator('.encounter-brief').innerText(),/適正 Lv.30/);assert.match(await page.locator('.encounter-levels').innerText(),/にゃんるな Lv.30/);assert.match(await page.locator('.encounter-levels').innerText(),/つきねこ Lv.20/);
  assert.equal(await page.locator('.chapter-shell').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);await shot(`preparation-${width}`);
 }
 await page.click('[data-prepare-levels]');assert.equal(await page.locator('[data-menu-tab="talent"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-tree-node="limit30"]').getAttribute('aria-pressed'),'true');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));assert.equal(saved.inventory.limitStone,2);assert.equal(saved.characters.tsukineko.level,20);pass('Lv.30 guidance, six-enemy roster and growth shortcut fit four viewport sizes without spending or resetting data');
 await page.click('[data-menu-tab="adventure"]');await page.click('[data-chapter="0"]');assert.equal(await page.locator('.encounter-brief').count(),0);pass('Chapter-one menu is unchanged');
 await page.setViewportSize({width:390,height:844});const roster=await fixture({all:true});await shot('six-enemies-390');await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>{const a=window.__LUNARIA_TEST__;a.world.resize();a.world.render(a.game,2);});await shot('six-enemies-1440');pass('All six bespoke enemy models render together',roster);
 for(const type of ['reaper','matchlock','stormlantern','pestmoth','ironcrab','ramcart']){
  await page.setViewportSize({width:390,height:844});const state=await fixture({type});assert.ok(state.hazards.length>0);await shot(`${type}-warning`);
  if(['matchlock','pestmoth'].includes(type)){
   const bullets=await page.evaluate(()=>{const a=window.__LUNARIA_TEST__,g=a.game;g.player.x=9;g.resume();for(let i=0;i<85;i++)g.tick(1/60);g.pause();a.step(0);a.world.render(g,.01);return g.projectiles.map(p=>p.kind);});assert.ok(bullets.length>=3);await shot(`${type}-projectiles`);
  }
  pass(`Enemy warning and model: ${type}`,state);
 }
 for(let act=4;act<8;act++){const state=await fixture({act,area:2,room:1,type:'boss'});await shot(`boss-${act-3}`);assert.ok(state.hazards.length>=3);pass(`Chapter-two boss ${act-3} new opening attack`,state);}
 const memory=[];
 for(let lap=0;lap<3;lap++){await fixture({type:'pestmoth'});memory.push(await page.evaluate(()=>{const a=window.__LUNARIA_TEST__,g=a.game;g.enemies=[];g.hazards=[];for(let i=0;i<4;i++){const e=g.spawnEnemy('pestmoth',(i-1.5)*3,-5);e.special=0;}g.resume();g.tick(1/60);g.pause();a.world.render(g,0);return {stats:a.world.stats(),hazards:a.world.hazardMeshes.size,parts:[...a.world.hazardMeshes.values()].map(m=>m.children.length)};}));}
 assert.equal(memory[2].hazards,20);assert.ok(memory[2].parts.every(n=>n===2));assert.ok(memory[2].stats.calls<180);assert.ok(memory[2].stats.geometries<=memory[0].stats.geometries+1);await shot('overlapping-fans');pass('Twenty overlapping warning lines stay batched and release geometry between encounters',{memory});
 // A true second floor is elevated; warning planes and new models must follow it.
 const elevated=await fixture({act:4,area:1,room:1,type:'stormlantern'});assert.equal(elevated.height,4.5);assert.ok(elevated.enemies.every(e=>e.y===4.5));assert.ok(elevated.hazardYs.every(y=>y===4.5));await shot('upper-floor-lightning');pass('New enemies and warnings also render on the second floor',elevated);
 await page.evaluate(()=>{window.__LUNARIA_TEST__.game.resume();});await page.click('#pause');assert.equal(await page.locator('.enemy-guide p b').count(),6);await shot('pause-guide');pass('Pause guide lists all six chapter-two attacks');
 assert.deepEqual(errors,[]);await writeFile(`${out}/browser.json`,JSON.stringify({checks,errors},null,2));
}catch(error){console.error(errors);await shot('browser-failure').catch(()=>{});throw error;}finally{await browser.close();}
