import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const url=process.env.LUNARIA_URL??'http://127.0.0.1:5191/';
const out=process.env.DESCRIPTION_AUDIT_OUT??'audit/chapter-description-20261003';
const captureOnly=process.env.DESCRIPTION_CAPTURE_ONLY==='1';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
const report={url,checks:[],errors:[]};
await context.addInitScript(()=>{
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(32).fill(true)},tutorial:{firstBattleCompleted:true}}));
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false,voice:false}));
});
const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
try{
  await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});await page.locator('#start').click();
  const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
  for(const [width,height] of [[320,568],[390,844],[430,932],[844,390],[1440,1000]]){
    await page.setViewportSize({width,height});
    for(const [chapter,selector] of [[5,'.chapter-six-brief'],[6,'.chapter-seven-brief']]){
      await page.locator(`[data-chapter="${chapter}"]`).click();
      await page.locator('#chapter-menu').evaluate(e=>e.scrollTop=0);
      const node=page.locator(selector);await node.scrollIntoViewIfNeeded();
      const appearance=await node.evaluate(e=>{
        const parse=color=>color.match(/[\d.]+/g).map(Number),composite=(fg,bg)=>fg.slice(0,3).map((n,i)=>n*(fg[3]??1)+bg[i]*(1-(fg[3]??1)));
        const luminance=color=>color.reduce((n,value,i)=>{value/=255;return n+[.2126,.7152,.0722][i]*(value<=.04045?value/12.92:((value+.055)/1.055)**2.4);},0);
        const chain=[];for(let node=e;node;node=node.parentElement)chain.unshift(node);
        let background=[255,255,255];for(const ancestor of chain)background=composite(parse(getComputedStyle(ancestor).backgroundColor),background);
        const style=getComputedStyle(e),foreground=composite(parse(style.color),background),a=luminance(foreground),b=luminance(background),r=e.getBoundingClientRect();
        return {text:e.textContent,color:style.color,background:style.backgroundColor,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),fontSize:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight),overflow:e.scrollWidth>e.clientWidth+1,left:r.left,right:r.right,top:r.top,bottom:r.bottom};
      });
      if(!captureOnly){
        assert.match(appearance.text,/推奨\s?Lv\.60/);
        assert.ok(appearance.contrast>=4.5,JSON.stringify({width,chapter,...appearance}));
        assert.ok(appearance.fontSize>=16&&appearance.lineHeight>=appearance.fontSize*1.7,JSON.stringify(appearance));
        assert.equal(appearance.overflow,false);assert.ok(appearance.left>=0&&appearance.right<=width+1);
        assert.ok(appearance.top>=-1&&appearance.bottom<=height+1,JSON.stringify({width,height,chapter,...appearance}));
        assert.equal(await page.locator('#chapter-menu').evaluate(e=>e.scrollWidth>innerWidth+1),false);
      }
      if([390,1440].includes(width))await page.screenshot({path:`${out}/chapter-${chapter+1}-${width}.png`});
      report.checks.push({chapter:chapter+1,width,height,...appearance});
    }
  }
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1'))),original);
  assert.deepEqual(report.errors,[]);report.status=captureOnly?'CAPTURED':'PASS';
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({status:report.status,checks:report.checks.length,contrasts:report.checks.map(({chapter,width,contrast})=>({chapter,width,contrast:Number(contrast.toFixed(2))})),errors:report.errors}));
}finally{await context.close();await browser.close();}
