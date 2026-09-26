import {chromium} from '@playwright/test';
import {FIELD_THEMES} from '../src/field-themes.js';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/field-backgrounds';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],checks=[];
const check=(name,data={})=>{checks.push({name,...data});console.log('PASS',name,JSON.stringify(data));};
try{
 for(const size of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport:size,deviceScaleFactor:1,isMobile:size.width<500,hasTouch:size.width<500});
  await context.addInitScript(()=>{window.requestAnimationFrame=()=>0;localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'high',sound:false,music:false,motion:true}));});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:5174/');await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.click('#start');await page.click('#chapter-start');await page.click('#story-skip');
  const initial=await page.evaluate(()=>window.__LUNARIA_TEST__.world.fields.state);
  assert.deepEqual(initial.loaded.sort(),FIELD_THEMES.map((_,i)=>i));assert.deepEqual(initial.failures,[]);check(`All registered field images load at ${size.width}px`);
  await page.evaluate(()=>{
   const t=window.__LUNARIA_TEST__,g=t.game;document.querySelector('#wave-banner').style.display='none';g.enemies=[];g.spawnEnemy('golem',5,-5);g.spawnEnemy('moss',-4,-2);g.spawnEnemy('bat',1,-8);g.drainEvents();
   Object.assign(g.player,{x:1,z:4,invincible:0,face:Math.PI});Object.assign(g.partner,{x:-1,z:4,face:Math.PI});
  });
  for(const area of [0,1,2]){
   const transition=await page.evaluate(area=>{
    const t=window.__LUNARIA_TEST__,w=t.world,g=t.game;g.area=area;g.wave=area*2+1;g.emit('wave',{area,wave:g.wave,boss:false});t.step(0);
    w.render(g,.12);const partial=w.fields.state;w.render(g,1.5);return {partial,settled:w.fields.state,stats:w.stats()};
   },area);
   assert.equal(transition.settled.target,area);assert.equal(transition.settled.blend,1);
   if(area>0)assert.ok(transition.partial.blend>0&&transition.partial.blend<1);
   await page.screenshot({path:`${out}/${size.width}-field-${area+1}.png`});
   check(`Field ${area+1} switches at ${size.width}px`,transition);
  }
  const reset=await page.evaluate(()=>{
   const t=window.__LUNARIA_TEST__,w=t.world;const before=w.heroes[1].userData.weapon.children[0].material.color.getHex();const counts=[];
   for(let i=0;i<18;i++){w.fields.setArea(i%3,{immediate:true});w.render(t.game,.016);counts.push(w.stats().textures);}
   w.settings.motion=false;w.fields.setArea(2);w.render(t.game,.016);const reduced=w.fields.state;const parallax=w.fields.material.uniforms.parallax.value.toArray();
   t.home();t.start();w.render(t.game,.016);return {before,after:w.heroes[1].userData.weapon.children[0].material.color.getHex(),counts,reduced,parallax,reset:w.fields.state};
  });
  assert.equal(reset.before,reset.after);assert.equal(reset.reduced.blend,1);assert.deepEqual(reset.parallax,[0,0]);assert.equal(reset.reset.target,0);assert.equal(new Set(reset.counts.slice(-9)).size,1);
  check(`Restart, reduced motion, material isolation and texture reuse at ${size.width}px`,reset);
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.world.setQuality('low');t.world.fields.setArea(1,{immediate:true});t.world.render(t.game,.016);});
  await page.screenshot({path:`${out}/${size.width}-low-quality.png`});check(`Low-quality renderer draws the new background at ${size.width}px`);
  await context.close();
 }
 const failedContext=await browser.newContext();await failedContext.route('**/assets/fields/moonlit-ruins.webp',r=>r.abort());
 const fallback=await failedContext.newPage();fallback.on('pageerror',e=>errors.push(e.message));
 await fallback.goto('http://127.0.0.1:5174/');await fallback.waitForSelector('#loading',{state:'detached',timeout:60000});await fallback.click('#start');await fallback.click('#chapter-start');await fallback.click('#story-skip');
 const fallbackState=await fallback.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.world.fields.setArea(1,{immediate:true});t.world.render(t.game,.016);return {phase:t.state.phase,field:t.world.fields.state};});
 assert.equal(fallbackState.phase,'playing');assert.deepEqual(fallbackState.field.failures,[1]);check('A failed background request does not prevent gameplay',fallbackState);await failedContext.close();
 assert.deepEqual(errors,[]);check('No shader, asset or uncaught errors in normal field rendering');
 await writeFile(`${out}/report.json`,JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
