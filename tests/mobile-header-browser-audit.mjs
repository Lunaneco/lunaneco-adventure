import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const engine=process.env.MOBILE_BROWSER||'chromium';
const base=process.env.LUNARIA_URL||'http://127.0.0.1:5185/';
const out=process.env.MOBILE_AUDIT_OUT||'audit/mobile-header-v149';
const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const cases=[
  {name:'small-phone',width:320,height:568,top:0,left:0,right:0},
  {name:'android',width:360,height:640,top:24,left:0,right:0},
  {name:'iphone-notch',width:390,height:844,top:47,left:0,right:0},
  {name:'iphone-island',width:393,height:852,top:59,left:0,right:0},
  {name:'short-standalone',width:375,height:568,top:59,left:0,right:0},
  {name:'landscape-left',width:844,height:390,top:0,left:59,right:0},
  {name:'landscape-right',width:844,height:390,top:0,left:0,right:59},
];
const errors=[],report=[];
await mkdir(out,{recursive:true});
try{
  const context=await browser.newContext({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
  await context.addInitScript(()=>localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,voice:false,music:false,motion:false,quality:'low'})));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
  await page.locator('#start').tap();
  for(const fixture of cases){
    await page.setViewportSize({width:fixture.width,height:fixture.height});
    // Desktop browser runners do not expose real hardware safe areas. Reserve
    // that screen space explicitly, then test actual touch input outside it.
    await page.locator('#chapter-menu').evaluate((el,area)=>{
      el.scrollTop=0;
      for(const side of ['top','left','right'])el.style.setProperty(`--menu-safe-${side}`,`${area[side]}px`);
    },fixture);
    const buttons=['#menu-title','.chapter-header [data-open="settings"]'];
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
    await page.screenshot({path:`${out}/${engine}-${fixture.name}.png`});
    await page.locator(buttons[1]).tap({position:{x:8,y:8}});
    await page.waitForSelector('#setting-sound',{state:'visible'});
    await page.locator('#modal .dialog-close').tap();
    await page.locator(buttons[0]).tap({position:{x:8,y:8}});
    assert.equal(await page.locator('#home').isVisible(),true);
    await page.locator('#start').tap();
    report.push({fixture,positions});
    console.log(`PASS ${engine} ${fixture.name}: safe-area clearance, 48px targets, settings and title touch navigation`);
  }
  assert.deepEqual(errors,[]);await writeFile(`${out}/${engine}-report.json`,JSON.stringify({base,errors,cases:report},null,2));
  await context.close();
}finally{await browser.close();}
