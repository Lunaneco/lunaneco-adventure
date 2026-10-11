import assert from 'node:assert/strict';
import {chromium,webkit,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.LUNARIA_URL??'http://127.0.0.1:5193/',engine=process.env.VIEWPORT_BROWSER??'chrome',out=process.env.VIEWPORT_AUDIT_OUT??'audit/battle-viewport-20261004';
await mkdir(out,{recursive:true});
const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'chrome'})),errors=[],checks=[];
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',engine,name);};
const near=(a,b,name)=>assert.ok(Math.abs(a-b)<1e-6,`${name}: ${a} / ${b}`);
async function metrics(page){return page.evaluate(()=>{
  const w=window.__LUNARIA_TEST__.world,c=w.canvas;
  return {scale:visualViewport.scale,width:c.clientWidth,height:c.clientHeight,buffer:[c.width,c.height],projection:w.camera.projectionMatrix.elements.slice(),focal:w.camera.projectionMatrix.elements[5]*c.clientHeight,numbers:[document.querySelector('#numbers').width,document.querySelector('#numbers').height]};
});}
async function gestures(page,target){return page.locator(target).evaluate(el=>{
  const result={};
  for(const [name,type,props] of [['pinch','touchmove',{touches:[{},{}]}],['scroll','touchmove',{touches:[{}]}],['wheel','wheel',{}],['zoomWheel','wheel',{ctrlKey:true}],['zoomKey','keydown',{ctrlKey:true,key:'+'}],['click','click',{}],...['gesturestart','gesturechange','gestureend','dblclick'].map(type=>[type,type,{}])]){
    const event=new Event(type,{bubbles:true,cancelable:true});for(const [key,value] of Object.entries(props))Object.defineProperty(event,key,{value});
    el.dispatchEvent(event);result[name]=event.defaultPrevented;
  }
  return result;
});}
try{
  const context=await browser.newContext({...devices['iPhone 15'],viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.addInitScript(()=>{
    localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,voice:false,music:false,motion:false}));
    localStorage.setItem('lunaria-progression-v1',JSON.stringify({tutorial:{firstBattleCompleted:true},story:{version:2,actClears:[true,true,true,true]}}));
  });
  await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});
  const menu=await gestures(page,'#home');assert.ok(Object.values(menu).every(value=>value===false));pass('Menu zoom/scroll gestures are not cancelled');
  await page.evaluate(()=>{
    const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.player.invincible=1000;g.enemies=[];g.projectiles=[];g.hazards=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;
  });
  const reference=await metrics(page);near(reference.scale,1,'initial browser scale');
  for(const selector of ['#scene','#dash','#ultimate','#switch','#pause','#hud .health-panel'])assert.equal(await page.locator(selector).evaluate(el=>getComputedStyle(el).touchAction),'none',selector);
  const battle=await gestures(page,'#hud .health-panel');
  for(const key of ['pinch','zoomWheel','zoomKey','gesturestart','gesturechange','gestureend','dblclick'])assert.equal(battle[key],true,key);
  for(const key of ['scroll','wheel','click'])assert.equal(battle[key],false,key);
  pass('Battle controls disallow native zoom; Safari and browser shortcut fallbacks cancel only zoom');
  for(let i=0;i<8;i++)await page.locator('#switch-action').tap();
  near((await metrics(page)).scale,1,'rapid tap scale');pass('Rapid battle-button taps retain 1× viewport');
  if(engine!=='webkit'){
    const cdp=await context.newCDPSession(page);
    for(const target of [{x:180,y:390},{x:260,y:720}]){
      await cdp.send('Input.synthesizePinchGesture',{...target,scaleFactor:1.8,gestureSourceType:'touch'});
      near((await metrics(page)).scale,1,'native pinch scale');
    }
    const dash=await page.locator('#dash').boundingBox(),button={id:2,x:dash.x+dash.width/2,y:dash.y+dash.height/2},stick={id:1,x:150,y:390};
    await page.evaluate(()=>{window.__LUNARIA_TEST__.game.player.dashCooldown=0;});
    const before=await page.evaluate(()=>{const p=window.__LUNARIA_TEST__.game.player;return [p.x,p.z];});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[stick]});
    stick.x+=35;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[stick]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[stick,button]});
    assert.ok(await page.evaluate(()=>window.__LUNARIA_TEST__.game.player.dashCooldown>0),'second-finger dash works');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...stick,x:stick.x+4},button]});await page.waitForTimeout(120);
    const after=await page.evaluate(()=>{const p=window.__LUNARIA_TEST__.game.player;return [p.x,p.z];});assert.ok(Math.hypot(after[0]-before[0],after[1]-before[1])>.1,'movement continues with two touches');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.locator('#joystick').isVisible(),false);
    near((await metrics(page)).scale,1,'two-finger control scale');await cdp.detach();pass('Native pinches cannot zoom; simultaneous joystick + dash still work');
  }
  await page.locator('#pause').tap();assert.equal(await page.locator('#modal').evaluate(el=>getComputedStyle(el).touchAction),'pan-y');
  const paused=await gestures(page,'#modal .enemy-guide');assert.equal(paused.pinch,true);assert.equal(paused.scroll,false);assert.equal(paused.wheel,false);
  // Playwright mobile WebKit cannot synthesize mouse wheels; use its native
  // keyboard scroll while separately checking uncancelled single-touch events.
  if(engine==='webkit')await page.locator('#modal').press('PageDown');
  else{const modal=await page.locator('#modal').boundingBox();await page.mouse.move(modal.x+modal.width/2,modal.y+modal.height/2);await page.mouse.wheel(0,200);}
  await page.waitForTimeout(150);
  assert.ok(await page.locator('#modal').evaluate(el=>el.scrollTop>0),'pause explanation remains scrollable');await page.locator('#resume').tap();pass('Pause/resume and explanation scrolling still work without zoom');
  for(const [width,height] of [[390,659],[393,852],[852,393],[390,844]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(120);const m=await metrics(page);near(m.focal,reference.focal,'fixed camera scale');near(m.scale,1,'rotation scale');assert.deepEqual(m.numbers,[width,height]);assert.deepEqual(m.buffer,[width,height]);
  }
  pass('Toolbar-height changes and rotation retain camera scale and overlay alignment');
  const beforeInvalid=await metrics(page);await page.locator('#scene').evaluate(el=>el.style.height='0px');await page.waitForTimeout(120);const invalid=await metrics(page);
  assert.equal(invalid.height,0);assert.deepEqual(invalid.projection,beforeInvalid.projection);assert.deepEqual(invalid.buffer,beforeInvalid.buffer);assert.deepEqual(invalid.numbers,beforeInvalid.numbers);
  await page.locator('#scene').evaluate(el=>el.style.height='');await page.waitForTimeout(120);near((await metrics(page)).focal,reference.focal,'recovered scale');pass('A transient 0px canvas cannot overwrite the camera or render buffers');
  await page.screenshot({path:`${out}/${engine}-battle.png`});
  await page.locator('#pause').tap();await page.locator('#quit').tap();assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('playing')),false);
  const afterBattle=await gestures(page,'.journey-heading');assert.ok(Object.values(afterBattle).every(value=>value===false));pass('Leaving battle restores native menu gestures');
  assert.deepEqual(errors,[]);await writeFile(`${out}/${engine}-report.json`,JSON.stringify({status:'PASS',url,checks,errors},null,2));await context.close();
}catch(e){await writeFile(`${out}/${engine}-report.json`,JSON.stringify({status:'FAIL',url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
