import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';

const kind=process.env.TITLE_BROWSER??'chromium',base=process.env.TITLE_URL??'http://127.0.0.1:4185/';
const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const out=`audit/title-video/${kind}-${new URL(base).pathname==='/'?'root':'pages'}`;await mkdir(out,{recursive:true});
let previewServer;
async function startPreview(){
 if(!process.env.TITLE_OWN_PREVIEW)return;
 const {preview}=await import('vite'),url=new URL(base);
 previewServer=await preview({base:url.pathname,build:{outDir:url.pathname==='/'?'dist':'dist-pages'},preview:{host:'127.0.0.1',port:Number(url.port),strictPort:true}});
}
async function stopPreview(){
 if(!previewServer)return;
 const server=previewServer.httpServer;previewServer=null;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
await startPreview();
const browser=await(kind==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const checks=[],errors=[];let page;
const pass=s=>{checks.push(s);console.log('PASS',s);};
async function open({motion=true,blocked=false,missing=false}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:missing?'block':'allow'});
 await context.addInitScript(({motion,blocked})=>{
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({motion,quality:'low',sound:false,music:false}));
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({tutorial:{firstBattleCompleted:true}}));
  if(blocked){const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){return this.id==='title-video'?Promise.reject(new DOMException('Autoplay blocked','NotAllowedError')):play.call(this);};}
 },{motion,blocked});
 if(missing)await context.route('**/assets/title/adventure-loop.mp4',r=>r.abort());
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.waitForSelector('#loading',{state:'detached',timeout:60000});return p;
}
const playing=p=>p.waitForFunction(()=>{const v=document.querySelector('#title-video');return !v.paused&&v.currentTime>.1&&v.readyState>=2&&v.classList.contains('is-playing');},{},{timeout:20000});
const poster=p=>p.evaluate(()=>{const i=document.querySelector('.title-film img'),v=document.querySelector('#title-video');return i.complete&&i.naturalWidth===576&&getComputedStyle(v).opacity==='0';});
try{
 page=await open();await playing(page);
 assert.equal(await page.locator('.version').innerText(),`Ver. ${version}`);
 assert.deepEqual(await page.locator('#title-video').evaluate(v=>({w:v.videoWidth,h:v.videoHeight,muted:v.muted,inline:v.playsInline,loop:v.loop,controls:v.controls})),{w:576,h:1024,muted:true,inline:true,loop:true,controls:false});
 pass('Optimized 576×1024 movie autoplays muted, inline and looping in production');
 for(const size of [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);
  const box=await page.locator('#start').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1&&box.height>=44);
  assert.equal(await page.locator('#start').evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===el;}),true);
  assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);
  await page.locator('#title-video').evaluate(v=>new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=5;}));
  await page.screenshot({path:`${out}/title-${size.width}.png`});
 }
 pass('Five portrait/landscape sizes retain reachable start buttons without overflow');
 await page.locator('#title-video').evaluate(v=>{v.currentTime=v.duration-.25;});await page.waitForFunction(()=>document.querySelector('#title-video').currentTime<1);await playing(page);
 await page.click('#start');assert.equal(await page.locator('#title-video').evaluate(v=>v.paused),true);await page.click('#menu-title');await playing(page);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal(await page.locator('#title-video').evaluate(v=>v.paused),true);await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await playing(page);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.locator('#title-video').evaluate(v=>v.paused),true);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await playing(page);
 pass('Loop boundary, menu return, page restoration and background pause/resume work');
 await page.click('#start');await page.click('[data-act="0"]');await page.click('#chapter-start');await page.click('#story-skip');await page.waitForSelector('#hud:not(.hidden)');assert.equal(await page.locator('#title-video').evaluate(v=>v.paused),true);
 await page.click('#pause');await page.click('#quit');await page.click('#menu-title');await playing(page);
 pass('Battle starts from the title and leaves the hidden movie paused');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#title-video').paused);assert.equal(await poster(page),true);await page.emulateMedia({reducedMotion:'no-preference'});await playing(page);
 pass('OS reduced-motion preference pauses the movie and shows its matching poster');
 await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await page.reload();await page.waitForSelector('#loading',{state:'detached'});await playing(page);
 // WebKit's simulated offline mode can fail before dispatching a worker fetch.
 // A stopped preview verifies the real network failure path in that browser.
 assert.ok(await page.evaluate(()=>!!navigator.serviceWorker.controller));if(previewServer)await stopPreview();else await page.context().setOffline(true);await page.reload();await page.waitForSelector('#loading',{state:'detached'});await playing(page);
 const range=await page.evaluate(async()=>{const r=await fetch(document.querySelector('#title-video').src,{headers:{Range:'bytes=100-199'}});return {status:r.status,type:r.headers.get('Content-Type'),range:r.headers.get('Content-Range'),size:(await r.arrayBuffer()).byteLength};});
 assert.equal(range.status,206);assert.equal(range.size,100);assert.equal(range.type,'video/mp4');assert.match(range.range,/^bytes 100-199\//);
 await page.locator('#title-video').evaluate(v=>{v.currentTime=v.duration-.25;});await page.waitForFunction(()=>document.querySelector('#title-video').currentTime<1);await playing(page);
 pass('Offline reload, cached MP4 byte ranges and looping work');await page.context().close();await startPreview();
 for(const options of [{motion:false},{blocked:true},{missing:true}]){
  page=await open(options);
  if(options.missing)await page.waitForFunction(()=>!!document.querySelector('#title-video').error);
  assert.ok(await poster(page));assert.equal(await page.locator('#title-video').evaluate(v=>v.paused),true);
  if(options.motion===false)assert.equal(await page.locator('#title-video').getAttribute('src'),null);
  await page.screenshot({path:`${out}/fallback-${Object.keys(options)[0]}.png`});await page.click('#start');assert.equal(await page.locator('#chapter-menu').isVisible(),true);await page.context().close();
 }
 pass('Disabled motion, denied autoplay and failed video requests keep the title usable');
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({base,checks,errors},null,2));
}catch(e){if(page&&!page.isClosed())await page.screenshot({path:`${out}/failure.png`});await writeFile(`${out}/report.json`,JSON.stringify({base,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();await stopPreview();}
