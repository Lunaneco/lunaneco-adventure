import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const url=process.env.LUNARIA_URL??'http://localhost:5187/',out=process.env.TREE_AUDIT_OUT??'audit/lumi-tree-layout-20261003';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
try{
  for(const unlocked of [true,false]){
    const context=await browser.newContext({viewport:{width:1440,height:900},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(unlocked=>{
      localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array.from({length:32},(_,i)=>(i<20||i>=24)&&i<(unlocked?32:8))},tutorial:{firstBattleCompleted:true}}));
      localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,voice:false,music:false}));
    },unlocked);
    await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});await page.locator('#start').click();
    await page.locator('[data-menu-tab="growth"]').click();await page.locator('[data-open-tree="nyanluna"]').first().click();
    await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.tree-hero-picker .portrait')].map(async e=>{const url=getComputedStyle(e).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];if(url){const image=new Image();image.src=url;await image.decode();}}));});
    const saved=await page.evaluate(()=>localStorage.getItem('lunaria-progression-v1'));
    for(const [width,height] of [[320,568],[390,844],[760,900],[761,900],[844,390],[1024,768],[1440,900],[1920,1080]]){
      await page.setViewportSize({width,height});await page.locator('.tree-hero-picker').scrollIntoViewIfNeeded();
      const layout=await page.locator('.tree-hero-picker').evaluate(e=>{
        const rect=id=>{const b=e.querySelector(`[data-tree-hero="${id}"]`),r=b.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,w:r.width,h:r.height,disabled:b.disabled};};
        return {hehereal:rect('hehereal'),lumi:rect('lumi'),overflow:e.scrollWidth>e.clientWidth+1,columns:getComputedStyle(e).gridTemplateColumns.split(' ').length};
      });
      console.log('TREE_LAYOUT',JSON.stringify({unlocked,width,height,...layout}));
      assert.ok(Math.abs(layout.hehereal.y-layout.lumi.y)<1);assert.ok(layout.lumi.x>=layout.hehereal.right);
      assert.ok(layout.lumi.right<=width+1);assert.ok(layout.hehereal.x>=0);assert.ok(layout.hehereal.h>=44&&layout.lumi.h>=44);
      assert.equal(layout.overflow,false);assert.equal(layout.columns,width<=760?2:4);assert.equal(layout.lumi.disabled,!unlocked);assert.equal(layout.hehereal.disabled,!unlocked);
      checks.push({unlocked,width,height,...layout});
      if([390,844,1440].includes(width))await page.screenshot({path:`${out}/${unlocked?'joined':'locked'}-${width}.png`});
    }
    if(unlocked){await page.locator('[data-tree-hero="lumi"]').click();assert.equal(await page.locator('[data-tree-hero="lumi"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.talent-map-heading h3').innerText(),'るみの成長ツリー');}
    assert.equal(await page.evaluate(()=>localStorage.getItem('lunaria-progression-v1')),saved);await context.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS Lumi beside Hehereal at eight viewport sizes, locked/recruited, selection and unchanged save');
  await writeFile(`${out}/browser-report.json`,JSON.stringify({url,checks,errors,status:'PASS'},null,2));
}finally{await browser.close();}
