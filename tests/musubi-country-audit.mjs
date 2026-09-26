import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/musubi-country';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
await context.addInitScript(()=>{
 window.requestAnimationFrame=()=>0;
 localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false}));
 localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(8).fill(true),tsukinekoUnlocked:true,omsoloUnlocked:true},characters:{nyanluna:{level:20,xp:7}},tutorial:{firstBattleCompleted:true}}));
});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
async function frame(){await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.world.resize();t.world.render(t.game,2);});}
async function fixture(act,area,room=0){
 return page.evaluate(async({act,area,room})=>{
  const {ACTS}=await import('/src/acts.js'),{FIELD_LAYOUTS,contains}=await import('/src/terrain.js'),t=window.__LUNARIA_TEST__;
  t.home();t.start();const g=t.game,w=t.world,field=FIELD_LAYOUTS[act][area];
  g.act=act;g.actConfig=ACTS[act];g.area=area;g.wave=area*2+(room===0?1:2);g.route=room===2?'elite':'safe';
  g.enemies=[];g.orbs=[];g.projectiles=[];g.hazards=[];g.waveSpawned=g.waveGoal=1;g.waveBreak=-999;
  g.player.attack=g.partner.attack=999;Object.assign(g.player,{x:0,z:3,face:Math.PI});Object.assign(g.partner,{x:-2,z:5,face:Math.PI});
  g.spawnEnemy('archer',5,0);g.spawnEnemy('mage',-4,-4);g.drainEvents();g.emit('wave',{wave:g.wave,area,theme:g.actConfig.stages[area].theme,boss:false});
  if(field.kind==='floors'&&room===0)g.travelOpen='stairs';if(field.kind==='branch'&&room===0)g.travelOpen='branch';
  g.pause();t.step(0);w.render(g,2);document.querySelector('#wave-banner').classList.remove('visible');
  const props=w.terrain.countryProps,blocked=props.filter(p=>contains(g.layout,p.x,p.z)||Array.from({length:24},(_,i)=>i*Math.PI/12).some(a=>contains(g.layout,p.x+Math.sin(a)*p.radius,p.z+Math.cos(a)*p.radius)));
  const visible=w.fields.landmarks.flatMap((g,i)=>g.visible?[i]:[]);
  return {act,area,room,layout:g.layout.id,country:g.layout.country,theme:w.fields.state.target,image:w.fields.state.image,focus:w.fields.material.uniforms.focusX.value,props:props.map(p=>p.type),blocked,visible,height:g.layout.height,heroY:w.heroes[g.player.hero].position.y,stats:w.stats()};
 },{act,area,room});
}
try{
 await page.goto('http://127.0.0.1:5174/?v=musubi-country-audit');await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 const loading=await page.evaluate(()=>window.__LUNARIA_TEST__.world.fields.state);assert.deepEqual(loading.loaded.sort(),[0,1,2,3,4,5,6]);assert.deepEqual(loading.failures,[]);pass('All seven background images load without fallback',loading);const surfaces=await page.evaluate(()=>({loaded:Object.keys(window.__LUNARIA_TEST__.world.terrain.surfaces),failures:window.__LUNARIA_TEST__.world.terrain.surfaceFailures}));assert.deepEqual(surfaces.loaded.sort(),['earth','stone']);assert.deepEqual(surfaces.failures,[]);
 await page.click('#chapter-menu-open');await page.click('[data-chapter="1"]');
 for(let act=4;act<8;act++){
  await page.click(`[data-act="${act}"]`);
  const cards=await page.locator('.chapter-stage').evaluateAll(cards=>cards.map(i=>i.style.getPropertyValue('--stage-image')));assert.equal(cards.length,3);assert.ok(cards.every(p=>p.includes(['village','valley','town','fortress'][act-4])));
  await page.screenshot({path:`${out}/menu-act-${act-3}.png`});
 }
 pass('All twelve chapter-two stage cards use their country background');
 await page.click('[data-act="4"]');await page.click('#chapter-start');await page.click('#story-next');await page.locator('.story-character-image').evaluate(i=>i.decode());await page.screenshot({path:`${out}/komusubi-story.png`});await page.click('#story-skip');
 const fields=await page.evaluate(async()=>{const {FIELD_LAYOUTS}=await import('/src/terrain.js');return FIELD_LAYOUTS.slice(4).map(a=>a.map(f=>f.rooms.length));});
 for(let act=4;act<8;act++)for(let area=0;area<3;area++)for(let room=0;room<fields[act-4][area];room++){
  const state=await fixture(act,area,room);assert.equal(state.theme,act-1);assert.ok(Number.isFinite(state.focus));assert.equal(state.country,['village','valley','town','fortress'][act-4]);assert.ok(state.props.length>0);assert.deepEqual(state.blocked,[]);assert.deepEqual(state.visible,[act-1]);assert.equal(state.height,state.heroY);
  if(room===0||area===1){await page.screenshot({path:`${out}/${state.layout}-390.png`});}
  if(room===0){await page.setViewportSize({width:1440,height:900});await frame();await page.screenshot({path:`${out}/${state.layout}-1440.png`});await page.setViewportSize({width:390,height:844});await frame();}
  pass(`Country field ${state.layout}`,state);
 }
 const transitions=await page.evaluate(()=>{
  const t=window.__LUNARIA_TEST__,w=t.world;w.settings.motion=true;const states=[];
  for(const area of [0,3,4,5,6,2]){w.fields.setArea(area);w.render(t.game,.15);const focus=w.fields.material.uniforms.focusX.value,blend=w.fields.state.blend;w.render(t.game,1.5);states.push({area,focus,blend,settled:w.fields.state.blend});}return states;
 });
 transitions.forEach(s=>{assert.ok(Number.isFinite(s.focus));assert.ok(s.blend>0&&s.blend<1);assert.equal(s.settled,1);});pass('Cross-chapter backgrounds and lighting transition without invalid portrait crop',{transitions});
 for(const quality of ['high','low']){await fixture(7,2);await page.evaluate(q=>window.__LUNARIA_TEST__.world.setQuality(q),quality);await frame();await page.screenshot({path:`${out}/fortress-${quality}-390.png`});}
 const memories=[];for(let lap=0;lap<3;lap++)memories.push(await page.evaluate(async()=>{const {FIELD_LAYOUTS}=await import('/src/terrain.js'),t=window.__LUNARIA_TEST__,w=t.world;for(const room of FIELD_LAYOUTS.slice(4).flatMap(a=>a.flatMap(f=>f.rooms))){w.terrain.build(room);w.renderer.render(w.scene,w.camera);}w.render(t.game,0);return w.stats().geometries;}));assert.ok(memories[2]<=memories[0]+1);pass('All country geometry is released when changing rooms',{memories});
 const original=await fixture(0,0);assert.equal(original.theme,0);assert.equal(original.country,undefined);assert.deepEqual(original.props,[]);pass('Chapter-one rendering stays independent from the new country');
 const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));assert.equal(save.characters.nyanluna.level,20);assert.equal(save.characters.nyanluna.xp,7);
 assert.deepEqual(errors,[]);pass('No asset, JavaScript or shader errors; character growth is preserved');
 await writeFile(`${out}/report.json`,JSON.stringify({checks,errors},null,2));
}catch(error){await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});console.error(errors);throw error;}finally{await browser.close();}
