import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.LUNARIA_URL||'http://127.0.0.1:5177/';
const engine=process.env.VIEWPORT_BROWSER||'chrome',out='audit/viewport-v135';
await mkdir(out,{recursive:true});
const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'chrome',headless:true}));
const checks=[],errors=[];
const sizes=[[390,844],[320,568],[375,667],[430,932],[390,720],[844,390],[768,1024],[1440,900]];
const pass=(name,data={})=>{checks.push({name,...data});console.log('PASS',name);};
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<.02,`${label}: ${a} / ${b}`);
async function metrics(page){
 return page.evaluate(()=>{
  const t=window.__LUNARIA_TEST__,w=t.world,g=t.game,p=g.player,h=w.heroes[p.hero];
  w.render(g,0);const y=h.position.y;
  const pts=[[p.x,y,p.z],[p.x,y+2.8,p.z],[p.x-2,y,p.z],[p.x+2,y,p.z],[p.x,y,p.z-5],[p.x,y,p.z+5]].map(p=>w.project(...p));
  return {width:w.canvas.clientWidth,height:w.canvas.clientHeight,buffer:[w.canvas.width,w.canvas.height],dpr:w.renderer.getPixelRatio(),
   deltas:[0,2,4].flatMap(i=>[pts[i+1].x-pts[i].x,pts[i+1].y-pts[i].y]),
   foot:pts[0],head:pts[1],camera:w.camera.position.toArray(),rotation:w.camera.quaternion.toArray(),target:w.cameraTarget.toArray(),heroY:y,
   projection:w.camera.projectionMatrix.elements.slice(),numbers:[document.querySelector('#numbers').width,document.querySelector('#numbers').height],numberDisplay:[document.querySelector('#numbers').clientWidth,document.querySelector('#numbers').clientHeight],
   viewOffset:!!w.camera.view?.enabled,layout:g.layout.id,terrain:w.terrain.id};
 });
}
async function fixture(page,{act=0,area=0,upper=false,x=0,z=4}={}){
 await page.evaluate(async o=>{
  const t=window.__LUNARIA_TEST__,g=t.game,w=t.world,{ACTS}=await import('/src/acts.js');
  g.act=o.act;g.actConfig=ACTS[o.act];g.area=o.area;g.wave=o.area*2+(o.upper?2:1);g.route=null;
  g.player.x=o.x;g.player.z=o.z;g.partner.x=o.x-1.7;g.partner.z=o.z+1.5;
  g.player.attack=g.partner.attack=999;g.player.moving=g.partner.moving=false;
  g.enemies=[];g.projectiles=[];g.hazards=[];g.orbs=[];g.waveSpawned=g.waveGoal=1;g.waveBreak=-999;
  g.pause();g.drainEvents();g.emit('wave',{wave:g.wave,area:g.area,theme:g.actConfig.stages[g.area].theme,boss:g.wave===6});t.step(0);
  w.cameraTarget.set(g.player.x*.94,g.layout.height,g.player.z*.94);w.time=2;w.shake=0;w.render(g,0);
  document.querySelector('#wave-banner').classList.remove('visible');
 },{act,area,upper,x,z});
 await page.waitForTimeout(80);
}
try{
 let referenceDpr;
 for(const dpr of [1,3]){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:dpr,hasTouch:true,isMobile:true});
  await context.addInitScript(()=>{
   localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,voice:false,music:false,quality:'low',motion:false}));
   localStorage.setItem('lunaria-progression-v1',JSON.stringify({tutorial:{firstBattleCompleted:true}}));
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.start();const w=t.world;window.__renderField=w.render.bind(w);w.render=g=>window.__renderField(g,0);});
  await fixture(page);
  const reference=await metrics(page);
  if(referenceDpr)reference.deltas.forEach((v,i)=>near(v,referenceDpr.deltas[i],'DPR does not zoom'));else referenceDpr=reference;
  const measured=[];
  for(const [width,height] of dpr===1?sizes:[[390,844],[430,932],[844,390]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(100);const s=await metrics(page);measured.push(s);
   assert.equal(s.width,width);assert.equal(s.height,height);assert.deepEqual(s.numbers,[width,height]);assert.deepEqual(s.numberDisplay,[width,height]);
   s.deltas.forEach((v,i)=>near(v,reference.deltas[i],`${width}x${height} scale`));
   s.camera.forEach((v,i)=>near(v,reference.camera[i],'camera distance'));s.rotation.forEach((v,i)=>near(v,reference.rotation[i],'angle'));
   near(s.projection[0]*width,s.projection[5]*height,'no stretching');
   assert.ok(s.head.y>0&&s.foot.y<height&&s.foot.x>0&&s.foot.x<width,'hero is on screen');
   if(width<500&&height<700&&height>width){const b=await page.locator('#stage-crystal-hud').boundingBox();assert.ok(b.x+b.width<s.head.x-35,'compact crystal panel leaves the hero visible');}
   for(const selector of ['#dash','#ultimate','#pause']){const b=await page.locator(selector).boundingBox();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,`${selector} fits ${width}x${height}`);}
   if(dpr===1)await page.screenshot({path:`${out}/${engine}-field-${width}x${height}.png`});
  }
  pass(`Fixed camera, actor and terrain scale across sizes at DPR ${dpr}`,{measured});
  // A CSS-only height change models Safari's dynamic browser toolbar. No resize
  // event is dispatched: the actual canvas ResizeObserver must update rendering.
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(80);
  await page.locator('#scene').evaluate(el=>el.style.height='720px');await page.waitForTimeout(100);
  const toolbar=await metrics(page);assert.equal(toolbar.height,720);assert.deepEqual(toolbar.numbers,[390,720]);assert.deepEqual(toolbar.numberDisplay,[390,720]);
  toolbar.deltas.forEach((v,i)=>near(v,reference.deltas[i],'dynamic toolbar'));
  await page.locator('#scene').evaluate(el=>el.style.height='');await page.waitForTimeout(100);
  pass(`Dynamic canvas-height changes preserve scale and overlay alignment at DPR ${dpr}`);
  await page.evaluate(()=>window.__LUNARIA_TEST__.world.setQuality('high'));await page.waitForTimeout(180);
  const quality=await metrics(page);quality.deltas.forEach((v,i)=>near(v,reference.deltas[i],'pixel density'));
  assert.equal(quality.dpr,Math.min(dpr,1.65));near(quality.buffer[0],Math.floor(quality.width*quality.dpr),'drawing buffer');
  await page.evaluate(()=>window.__LUNARIA_TEST__.world.setQuality('low'));
  pass(`Render density ${quality.dpr} changes sharpness without changing scale`);
  if(dpr===1){
   for(const o of [{act:0,area:1,upper:true},{act:2,area:2,x:4,z:2},{act:4},{act:7,area:2,upper:true}]){
    await fixture(page,o);const before=await metrics(page);assert.equal(before.layout,before.terrain);
    for(const [width,height] of [[320,568],[844,390],[1440,900]]){
     await page.setViewportSize({width,height});await page.waitForTimeout(80);
     await page.evaluate(()=>window.__renderField(window.__LUNARIA_TEST__.game,2));const after=await metrics(page);
     after.deltas.forEach((v,i)=>near(v,before.deltas[i],'raised room/edge tracking'));
    }
   }
   pass('Raised floors, field edges and both chapters keep the same camera framing when rotated');
   await fixture(page);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(80);
   await page.evaluate(()=>window.__LUNARIA_TEST__.world.setQuality('high'));await page.waitForTimeout(180);const high=await metrics(page);
   high.deltas.forEach((v,i)=>near(v,reference.deltas[i],'bloom quality'));
   await page.screenshot({path:`${out}/${engine}-high-390x844.png`});pass('High-quality bloom and render resolution do not change scene scale');
   await page.evaluate(()=>window.__LUNARIA_TEST__.world.setQuality('low'));
   await page.evaluate(()=>window.__LUNARIA_TEST__.home());await page.locator('#home [data-open=guide]').first().tap();await page.locator('#tutorial-replay').tap();
   await page.waitForSelector('#battle-tutorial:not(.hidden)');await page.waitForTimeout(100);
   for(const [width,height] of [[320,568],[375,667],[390,720],[390,844],[430,932],[844,390]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(100);await page.evaluate(()=>window.__renderField(window.__LUNARIA_TEST__.game,2));
    const s=await metrics(page),card=await page.locator('#battle-tutorial').boundingBox();
    assert.ok(card.x>=0&&card.y>=0&&card.x+card.width<=width+1&&card.y+card.height<=height+1);
    assert.ok(s.head.y>=card.y+card.height||s.foot.y<=card.y||s.foot.x<card.x||s.foot.x>card.x+card.width,`tutorial overlaps hero at ${width}x${height}: ${JSON.stringify({s,card})}`);
    await page.screenshot({path:`${out}/${engine}-tutorial-${width}x${height}.png`});
   }
   await page.locator('#tutorial-skip').tap();await page.waitForTimeout(100);assert.equal((await metrics(page)).viewOffset,false);
   pass('Tutorial framing fits short portrait and landscape screens without covering the hero');
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);pass('No JavaScript or missing-resource errors');
 await writeFile(`${out}/${engine}-report.json`,JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
