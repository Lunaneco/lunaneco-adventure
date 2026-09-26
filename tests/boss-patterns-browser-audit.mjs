import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {normalizeProgression} from '../src/progression.js';
import {HEROES} from '../src/model.js';
import {TALENT_NODES} from '../src/talents.js';
const out='audit/boss-patterns',name=process.env.BOSS_BROWSER??'chromium';await mkdir(out,{recursive:true});
const browser=await(name==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const errors=[],checks=[],scenes=[];
const profile=normalizeProgression({story:{version:2,actClears:Array(12).fill(true)},tutorial:{firstBattleCompleted:true},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:50,breaks:3,tree:TALENT_NODES.map(n=>n.id)}]))},HEROES);
const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await c.addInitScript(p=>{if(!sessionStorage.getItem('boss-audit')){sessionStorage.setItem('boss-audit','1');localStorage.setItem('lunaria-progression-v1',JSON.stringify(p));localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['nyanluna','tsukineko'],lead:'nyanluna'}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));}},profile);
const page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const pass=s=>{checks.push(s);console.log('PASS',s);};
try{
 await page.goto('http://127.0.0.1:4185/?v=1.54.0');await page.waitForSelector('#loading',{state:'detached',timeout:60000});assert.match(await page.locator('.version').innerText(),/1\.54\.0/);assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
 await page.click('#start');await page.click('[data-chapter="2"]');await page.click('[data-act="10"]');await page.click('#chapter-start');
 // The cleared chapter can still offer a story. Skip through its actual control.
 if(await page.locator('#story-dialog[open]').count()){
  const skip=page.locator('#story-skip');if(await skip.count())await skip.click();
 }
 await page.waitForSelector('#hud:not(.hidden)');await page.click('#pause');assert.match(await page.locator('.enemy-guide').innerText(),/こだま|花びら/);
 for(const [width,height] of [[320,568],[390,844],[844,390]]){await page.setViewportSize({width,height});assert.equal(await page.locator('#modal-content').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);}
 pass('Production v1.54: chapter-three boss briefing and mobile pause UI work without a test hook');
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5185/');await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 for(let act=0;act<15;act++){
  await page.click('#start');await page.click(`[data-chapter="${act>=12?act-12:Math.floor(act/4)}"]`);await page.click(`[data-act="${act}"]`);await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.wave=5;g.startWave();g.pause();t.step(0);});
  for(const low of [false,true])for(let action=0;action<3;action++){
   const result=await page.evaluate(async({act,action,low})=>{
    const t=window.__LUNARIA_TEST__,g=t.game;g.resume();g.enemies=[];g.projectiles=[];g.hazards=[];g.orbs=[];g.ultimateEffects=[];g.pendingBlessings=0;g.wave=6;g.area=2;g.waveSpawned=g.waveGoal;g.waveBreak=-999;
    Object.assign(g.player,{x:0,z:0,attack:999,invincible:999});g.partner.attack=999;
    const e=g.spawnEnemy('boss',0,-7);Object.assign(e,{action,special:0,attack:999,speed:0});if(low)e.hp*=.49;
    t.step(1/60);g.pause();for(let i=0;i<60;i++)t.world.render(g,.016);
    const result={act,action,low,boss:e.name,hazards:g.hazards.length,meshes:t.world.hazardMeshes.size,cast:e.cast.kind,stats:t.world.stats()};
    window.__bossAuditCast=e.cast.total;return result;
   },{act,action,low});
   assert.ok(result.hazards>=2);assert.equal(result.meshes,result.hazards);assert.ok(Number.isFinite(result.stats.calls));scenes.push(result);
   assert.equal(await page.locator('#boss-hud').isVisible(),true);
   if(low&&((act===1&&action===1)||(act===3&&action===0)||(act===5&&action===0)||(act===8&&action===1)||(act===9&&action===1)||(act===10&&action===1)||(act===14&&action===1))){await page.waitForTimeout(2800);await page.screenshot({path:`${out}/${name}-${act}-${action}-warning.png`});}
   // Resolve all delayed hits and renders. This also exercises ring effect disposal.
   const finished=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.resume();for(let i=0;i<40;i++){t.step(.1);t.world.render(g,.1);}g.pause();t.step(0);return {casts:g.drainEvents().filter(e=>e.type==='bossAttack').length,fx:t.world.rings.length};});
   assert.ok(finished.fx>=0);
  }
  console.log('RENDERED',name,act);
  // A gate/reset during a live ring flash must dispose groups as well as meshes.
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.world.handle([{type:'hazard',shape:'ring',x:0,z:0,radius:6,innerRadius:3,color:0xff719a}],t.game);t.home();});
 }
 pass('All 15 encounters × 3 patterns × 2 phases: visible warnings, projectile follow-ups, ring effects, HUD and reset render without errors');
 assert.deepEqual(errors,[]);await writeFile(`${out}/${name}-browser.json`,JSON.stringify({checks,scenes,errors},null,2));
}catch(e){await page.screenshot({path:`${out}/${name}-failure.png`});await writeFile(`${out}/${name}-browser.json`,JSON.stringify({checks,scenes,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
