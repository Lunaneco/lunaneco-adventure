import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {MUSIC_TRACKS} from '../src/music.js';
import {cachedMediaResponse} from '../src/offline-range.js';
const OUT=process.env.MUSIC_AUDIT_DIR||'audit/bgm-v134',engine=process.env.MUSIC_BROWSER||'chrome';
let BASE=process.env.LUNARIA_URL||'http://127.0.0.1:4187/lunaneco-adventure/',originServer;
// WebKit's emulated offline mode bypasses its worker fetch handling. For that
// engine, remove a test-owned origin instead; no user server is stopped.
if(engine==='webkit'&&!process.env.LUNARIA_URL){
 const root=resolve('dist-pages'),prefix='/lunaneco-adventure/';
 originServer=createServer(async(req,res)=>{
  try{
   const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(!path.startsWith(prefix))throw Error('outside build');
   const file=resolve(root,path.slice(prefix.length)||'index.html');if(!file.startsWith(root+'/'))throw Error('outside build');
   const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary'};
   const full=new Response(await readFile(file),{headers:{'Content-Type':types[extname(file)]||'application/octet-stream'}});
   const response=await cachedMediaResponse(new Request('http://localhost'+req.url,{headers:req.headers}),full);
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>originServer.listen(0,'127.0.0.1',resolve));BASE=`http://127.0.0.1:${originServer.address().port}${prefix}`;
}
await mkdir(OUT,{recursive:true});const browser=await(engine==='webkit'?webkit.launch({headless:true,...(process.env.MUSIC_BROWSER_PATH?{executablePath:process.env.MUSIC_BROWSER_PATH}:{})}):chromium.launch({channel:'chrome',headless:true}));
const checks=[],errors=[];const pass=t=>{checks.push(t);console.log('PASS',t);};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'allow'});
 await context.addInitScript(()=>{
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:true,voice:false,music:true,quality:'low'}));
  window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.effectiveDirective));
  const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){if(this.src.includes('/assets/music/'))window.__music=this;return play.apply(this,args);};
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const ready=()=>page.waitForFunction(()=>window.__music&&!window.__music.paused&&window.__music.currentTime>.1);
 await page.goto(BASE);await page.waitForSelector('#loading',{state:'detached',timeout:60000});assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');await page.locator('#start').tap();await page.locator('#chapter-start').tap();await ready();assert.ok((await page.evaluate(()=>window.__music.currentSrc)).endsWith(MUSIC_TRACKS.field.file));
 pass('Production start gesture plays the supplied field music under CSP');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:60000});assert.ok(await page.evaluate(()=>navigator.serviceWorker.controller));
 if(originServer){originServer.closeAllConnections();await new Promise(resolve=>originServer.close(resolve));}else await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.locator('#start').tap();await page.locator('#chapter-start').tap();await ready();pass('Offline reload and start play the cached field track');
 for(const [id,track] of Object.entries(MUSIC_TRACKS)){
  const url=new URL(track.file,BASE).href;
  const range=await page.evaluate(async url=>{const r=await fetch(url,{headers:{Range:'bytes=0-1'}});return {status:r.status,range:r.headers.get('Content-Range'),type:r.headers.get('Content-Type'),size:(await r.arrayBuffer()).byteLength};},url);
  assert.equal(range.status,206);assert.equal(range.size,2);assert.match(range.range,/^bytes 0-1\/\d+$/);assert.match(range.type,/audio/);
  await page.evaluate(url=>{const m=window.__music;m.pause();m.src=url;m.load();return m.play();},url);await ready();
  await page.evaluate(()=>{const m=window.__music;m.currentTime=m.duration-.25;});await page.waitForFunction(()=>window.__music.currentTime<2&&!window.__music.paused,{},{timeout:10000});
  pass(`${id}: cached byte ranges, seeking and end-to-start looping work offline`);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__csp),[]);pass('No missing music assets, CSP violations or runtime errors');
 await writeFile(`${OUT}/${engine}-production-report.json`,JSON.stringify({checks,errors},null,2));await context.close();
}finally{await browser.close();if(originServer?.listening){originServer.closeAllConnections();await new Promise(resolve=>originServer.close(resolve));}}
