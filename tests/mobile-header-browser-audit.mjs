import {chromium,webkit,devices} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const engine=process.env.MOBILE_BROWSER||'chromium';
const base=process.env.LUNARIA_URL||'http://127.0.0.1:5185/';
const out=process.env.MOBILE_AUDIT_OUT||'audit/mobile-safe-area';
const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const cases=[
  {name:'small-phone',width:320,height:568,top:0,bottom:0,left:0,right:0},
  {name:'android',width:360,height:640,top:24,bottom:0,left:0,right:0},
  {name:'iphone-notch',width:390,height:844,top:47,bottom:34,left:0,right:0},
  {name:'iphone15-standalone',width:393,height:852,top:59,bottom:34,left:0,right:0},
  {name:'iphone15-browser-bars',width:393,height:659,top:0,bottom:0,left:0,right:0},
  {name:'short-standalone',width:375,height:568,top:59,bottom:34,left:0,right:0},
  {name:'landscape-left',width:852,height:393,top:0,bottom:21,left:59,right:0},
  {name:'landscape-right',width:852,height:393,top:0,bottom:21,left:0,right:59},
  {name:'tall-centered-menu',width:600,height:1400,top:59,bottom:34,left:0,right:0},
];
const errors=[],report=[];
await mkdir(out,{recursive:true});
try{
  const context=await browser.newContext({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
    localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,voice:false,music:false,motion:false,quality:'low'}));
    localStorage.setItem('lunaria-progression-v1',JSON.stringify({tutorial:{firstBattleCompleted:true},story:{version:2,tsukinekoUnlocked:true}}));
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
  assert.equal(await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content'),'default');
  await page.locator('#start').tap();
  for(const fixture of cases){
    await page.setViewportSize({width:fixture.width,height:fixture.height});
    // Desktop browser runners do not expose real hardware safe areas. Reserve
    // that screen space explicitly, then test actual touch input outside it.
    await page.evaluate(area=>{
      document.querySelector('#chapter-menu').scrollTop=0;
      for(const side of ['top','bottom','left','right'])document.documentElement.style.setProperty(`--viewport-safe-${side}`,`${area[side]}px`);
    },fixture);
    const buttons=['#menu-title','.journey-tools [data-open="settings"]'];
    const positions=[];
    for(const selector of buttons){
      const button=page.locator(selector),box=await button.boundingBox();
      assert.ok(box.y>=fixture.top+32,`${fixture.name}: ${selector} is too close to the status bar`);
      assert.ok(box.x>=fixture.left+16&&box.x+box.width<=fixture.width-fixture.right-16,`${fixture.name}: ${selector} overlaps a side cutout`);
      assert.ok(box.width>=48&&box.height>=48,`${fixture.name}: touch target is too small`);
      assert.ok(box.y+box.height<=fixture.height);
      assert.equal(await button.evaluate(el=>{
        const r=el.getBoundingClientRect();
        return [[.5,.5],[.15,.15],[.85,.85]].every(([x,y])=>el.contains(document.elementFromPoint(r.x+r.width*x,r.y+r.height*y)));
      }),true,`${fixture.name}: another element blocks the button`);
      positions.push({selector,...box});
    }
    assert.equal(await page.locator('#chapter-menu').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
    const menu=await page.locator('#chapter-menu').boundingBox(),shell=await page.locator('.chapter-shell').boundingBox();
    assert.equal(menu.height,fixture.height,'Menu fills the viewport without a bottom gap');
    const centeredTop=fixture.top+Math.max(0,(fixture.height-fixture.top-fixture.bottom-shell.height)/2);
    assert.ok(Math.abs(shell.y-centeredTop)<1,'Short menus are centered inside the safe area; long menus start below it');
    const canvas=await page.locator('#scene').boundingBox();assert.equal(canvas.height,menu.height,'Canvas and menu use the same viewport');
    await page.locator('.journey-footer').scrollIntoViewIfNeeded();
    const footer=await page.locator('.journey-footer').boundingBox();
    assert.ok(footer.y+footer.height<=fixture.height-fixture.bottom+1,'Footer can scroll clear of the home indicator');
    await page.locator('#chapter-menu').evaluate(el=>el.scrollTop=0);
    await page.screenshot({path:`${out}/${engine}-${fixture.name}.png`});
    await page.locator(buttons[1]).tap({position:{x:8,y:8}});
    await page.waitForSelector('#setting-sound',{state:'visible'});
    const modal=await page.locator('#modal').boundingBox();
    assert.ok(modal.y>=fixture.top&&modal.y+modal.height<=fixture.height-fixture.bottom+1,'Settings stay inside the safe area');
    await page.locator('#modal .dialog-close').tap();
    await page.locator(buttons[0]).tap({position:{x:8,y:8}});
    assert.equal(await page.locator('#home').isVisible(),true);
    await page.locator('#start').tap();
    report.push({fixture,positions});
    console.log(`PASS ${engine} ${fixture.name}: safe-area clearance, viewport fill, centering, scrolling and touch navigation`);
  }
  await page.locator('[data-act="0"]').tap();
  await page.locator('#chapter-start').tap();await page.locator('#story-skip').tap();
  await page.waitForSelector('#hud:not(.hidden)');
  for(const fixture of cases.filter(f=>f.name.startsWith('iphone15')||f.name.startsWith('landscape'))){
    await page.setViewportSize({width:fixture.width,height:fixture.height});
    await page.evaluate(area=>{
      for(const side of ['top','bottom','left','right'])document.documentElement.style.setProperty(`--viewport-safe-${side}`,`${area[side]}px`);
    },fixture);
    const hud=await page.locator('#hud').boundingBox(),canvas=await page.locator('#scene').boundingBox();
    assert.deepEqual(hud,canvas,'Battle controls and rendering fill the same viewport');
    const pause=await page.locator('#pause').boundingBox();
    assert.ok(pause.y>=fixture.top+12&&pause.x+pause.width<=fixture.width-fixture.right-15);
    assert.ok(pause.width>=44&&pause.height>=44);
    for(const selector of ['#dash','#ultimate','#switch-action']){
      const box=await page.locator(selector).boundingBox();
      assert.ok(box.x>=fixture.left&&box.x+box.width<=fixture.width-fixture.right);
      assert.ok(box.y>=fixture.top&&box.y+box.height<=fixture.height-fixture.bottom);
    }
    await page.screenshot({path:`${out}/${engine}-battle-${fixture.name}.png`});
    await page.locator('#pause').tap({position:{x:8,y:8}});
    await page.waitForSelector('#resume');await page.locator('#resume').tap();
    console.log(`PASS ${engine} battle ${fixture.name}: viewport alignment, safe controls and pause/resume touch input`);
  }
  assert.deepEqual(errors,[]);
  await context.close();
  // Reproduce an existing iPhone install: safe-area env values are zero and dvh
  // reports a viewport 59px shorter than the actual home-screen window.
  const installed=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,userAgent:devices['iPhone 15'].userAgent});
  await installed.addInitScript(()=>{
    Object.defineProperty(navigator,'standalone',{get:()=>true});
    localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false,voice:false}));
    localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:[true,true,true,true]},tutorial:{firstBattleCompleted:true}}));
  });
  let shortenedViewport=false;
  await installed.route('**/src/mobile-layout.css',async route=>{
    const response=await route.fetch();
    const body=await response.text();shortenedViewport=body.includes('--app-height:100dvh');
    await route.fulfill({response,body:body.replace('--app-height:100dvh','--app-height:calc(100vh - 59px)')});
  });
  const phone=await installed.newPage();phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(base);await phone.waitForSelector('#loading',{state:'detached',timeout:60000});
  assert.ok(shortenedViewport,'The short-dvh regression fixture was applied');
  assert.ok(await phone.locator('html').evaluate(e=>e.classList.contains('ios-standalone')));
  const title=await phone.locator('#home').boundingBox();assert.equal(title.y+title.height,852,'Home-screen title reaches the bottom despite the shorter dvh');
  await phone.screenshot({path:`${out}/${engine}-installed-title.png`});
  await phone.locator('#start').tap();await phone.locator('[data-chapter="1"]').tap();await phone.locator('[data-act="4"]').tap();
  for(const [width,height] of [[393,852],[852,393],[393,852]]){
    await phone.setViewportSize({width,height});
    const box=await phone.locator('#modal').boundingBox(),close=await phone.locator('.brief-close').boundingBox();
    const portrait=height>width;
    assert.ok(close.y>=(portrait?88:24),'The stage close button stays below system icons');
    assert.ok(close.width>=48&&close.height>=48,'The close button has a usable touch target');
    assert.ok(box.y>=0&&box.y+box.height<=height-(portrait?34:21));
    assert.ok(box.x>=0&&box.x+box.width<=width);
    await phone.locator('#chapter-start').scrollIntoViewIfNeeded();
    const start=await phone.locator('#chapter-start').boundingBox();assert.ok(start.y+start.height<=height-(portrait?34:21));
    await phone.locator('#modal').evaluate(el=>el.scrollTop=0);
  }
  await phone.screenshot({path:`${out}/${engine}-installed-brief.png`});
  await phone.locator('.brief-close').tap({position:{x:8,y:8}});assert.equal(await phone.locator('#modal').isVisible(),false);
  console.log(`PASS ${engine} existing iPhone install: zero env insets, short dvh, full-height title and accessible stage close/start controls`);
  report.push({fixture:{name:'existing-iphone-install'},shortenedViewport,title});
  assert.deepEqual(errors,[]);await writeFile(`${out}/${engine}-report.json`,JSON.stringify({base,errors,cases:report},null,2));await installed.close();
}finally{await browser.close();}
