import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {SCENES} from '../src/chapter.js';
import {STORY_CAST} from '../src/story-cast.js';
const out='audit/story-art';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[],pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
const sizes=[{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:1440,height:900}];
const lines=Object.values(SCENES).flatMap(s=>s.lines);
async function open(production=false){
 const context=await browser.newContext({viewport:sizes[0],hasTouch:true,isMobile:true,deviceScaleFactor:1});
 await context.addInitScript(()=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('lunaria-record-v1',JSON.stringify({chapterOneCleared:true}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,music:false,motion:false,quality:'low'}));sessionStorage.setItem('seeded','1');}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(`http://127.0.0.1:${production?4173:5174}/?v=story-art-audit`);await page.waitForSelector('#loading',{state:'detached',timeout:60000});return {context,page};
}
const saved=page=>page.evaluate(()=>localStorage.getItem('lunaria-progression-v1'));
async function imageReady(page,who){await page.waitForFunction(({who,image})=>{const dialog=document.querySelector('#story-dialog'),img=dialog.querySelector('.story-character-image');return dialog.dataset.speaker===who&&img.complete&&img.naturalWidth===1024&&new URL(img.src).pathname===image;},{who,image:STORY_CAST[who].image});}
try{
 const {context,page}=await open();await page.click('#chapter-menu-open');const before=await saved(page);
 for(const size of sizes){
  await page.setViewportSize(size);await page.click('#chapter-story');const captured=new Set();
  for(const [i,line] of lines.entries()){
   await imageReady(page,line.who);assert.equal(await page.locator('.story-speaker strong').innerText(),STORY_CAST[line.who].name);assert.equal(await page.locator('.story-dialogue>p').innerText(),line.text);
   const layout=await page.evaluate(()=>{
    const d=document.querySelector('#story-dialog'),rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};},r=rect(d),image=rect(d.querySelector('.story-character-image')),figure=rect(d.querySelector('.story-cast')),title=rect(d.querySelector('.story-title-block')),dialogue=rect(d.querySelector('.story-dialogue')),p=rect(d.querySelector('.story-dialogue>p')),button=rect(d.querySelector('#story-next')),skip=rect(d.querySelector('#story-skip'));
    return {r,image,figure,title,dialogue,p,button,skip,overflow:d.scrollHeight>d.clientHeight||d.scrollWidth>d.clientWidth};
   });
   const {r,image,figure,title,dialogue,p,button,skip}=layout;assert.ok(!layout.overflow&&r.x>=0&&r.y>=0&&r.right<=size.width&&r.bottom<=size.height,JSON.stringify({size,i,layout}));assert.ok(image.height>=70&&image.width>=60&&image.y>=title.bottom-1&&image.bottom<=r.bottom,JSON.stringify({size,i,layout}));assert.ok(p.bottom<=button.y&&button.bottom<=r.bottom&&button.width>=44&&button.height>=44&&skip.width>=44&&skip.height>=44,JSON.stringify({size,i,layout}));
   if(size.width<size.height)assert.ok(figure.bottom<=dialogue.y+1,JSON.stringify({size,i,layout}));else assert.ok(figure.right<=dialogue.x+1,JSON.stringify({size,i,layout}));
   if(!captured.has(line.who)){captured.add(line.who);await page.locator('.story-character-image').evaluate(img=>img.decode());const figure=page.locator('.story-cast'),visible=await figure.screenshot({animations:'disabled'});await page.locator('.story-character-image').evaluate(img=>img.style.visibility='hidden');const hidden=await figure.screenshot({animations:'disabled'});await page.locator('.story-character-image').evaluate(img=>img.style.visibility='');assert.ok(Math.abs(visible.length-hidden.length)>2000,`The ${line.who} portrait must actually paint pixels at ${size.width}px`);await page.screenshot({animations:'disabled',path:`${out}/${line.who}-${size.width}.png`});}
   await page.click('#story-next');
  }
  assert.equal(await page.locator('#story-dialog').isVisible(),false);assert.deepEqual(await saved(page),before);pass(`All 30 lines display the matching generated image at ${size.width}×${size.height}, with visible artwork, readable text and 44px controls`);
 }
 await page.setViewportSize(sizes[0]);await page.click('#chapter-story');await page.click('#story-skip');assert.equal(await page.locator('#chapter-menu').isVisible(),true);await page.click('#chapter-start');await imageReady(page,'narrator');assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.phase),'paused');await page.click('#story-next');await imageReady(page,'nyanluna');await page.keyboard.press('Enter');await imageReady(page,'narrator');await page.click('#story-skip');assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.phase),'playing');pass('Actual adventure intro pauses battle, switches artwork by speaker, supports keyboard reading and skips back to combat');await context.close();
 const prod=await open(true);assert.equal(await prod.page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');await prod.page.click('#chapter-menu-open');await prod.page.click('#chapter-story');await imageReady(prod.page,'narrator');await prod.page.waitForFunction(async()=>{await navigator.serviceWorker.ready;return navigator.serviceWorker.controller!==null;});await prod.page.click('#story-skip');await prod.context.setOffline(true);await prod.page.reload();await prod.page.waitForSelector('#loading',{state:'detached'});await prod.page.click('#chapter-menu-open');await prod.page.click('#chapter-story');
 const seen=new Set();for(const line of lines){await imageReady(prod.page,line.who);seen.add(line.who);await prod.page.click('#story-next');}assert.equal(seen.size,4);await prod.context.close();pass('Production and offline replay load all four local illustrations without developer controls');
 assert.deepEqual(errors,[]);pass('No JavaScript, image, shader or resource errors');await writeFile(`${out}/report.json`,JSON.stringify({checks,errors,lines:lines.length,date:new Date().toISOString()},null,2));
}finally{await browser.close();}
