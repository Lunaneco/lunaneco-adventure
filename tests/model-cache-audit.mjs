// Run after build:pages. Keep a legacy cache-first worker active while loading
// the new production bundle: changing only a query string would fail this test.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, extname} from 'node:path';
import {chromium} from '@playwright/test';
import {HERO_MODEL_NAMES,heroModelPath} from '../src/hero-model-paths.js';

const base='/lunaneco-adventure/', directory=resolve('dist-pages'), served=new Map();
const {version}=JSON.parse(await readFile(resolve('package.json'),'utf8'));
const legacyWorker=`
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>event.respondWith(caches.open('legacy-model-cache').then(async cache=>
  await cache.match(event.request,{ignoreSearch:true})||fetch(event.request))));`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
  '.svg':'image/svg+xml','.mp3':'audio/mpeg','.mp4':'video/mp4'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(!pathname.startsWith(base)){res.writeHead(404);res.end();return;}
    const relative=decodeURIComponent(pathname.slice(base.length))||'index.html';
    const file=resolve(directory,relative);
    if(!file.startsWith(directory+'/')){res.writeHead(403);res.end();return;}
    const body=relative==='sw.js'?Buffer.from(legacyWorker):relative==='seed.html'?
      Buffer.from('<!doctype html><title>Legacy cache setup</title>'):await readFile(file);
    if(relative.endsWith('.glb'))served.set(relative,createHash('sha256').update(body).digest('hex'));
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store','Service-Worker-Allowed':base});res.end(body);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+base+'seed.html');
  await page.evaluate(async base=>{
    await navigator.serviceWorker.register(base+'sw.js',{scope:base});
    await navigator.serviceWorker.ready;
    const cache=await caches.open('legacy-model-cache');
    for(const name of ['nyanluna','tsukineko'])await cache.put(base+`assets/models/${name}.glb`,new Response('obsolete model'));
    localStorage.setItem('lunaria-record-v1',JSON.stringify({chapterOneCleared:true}));
  },base);
  await page.goto(origin+base);
  await page.waitForSelector('#loading',{state:'detached',timeout:120000});
  assert.equal(await page.locator('.version').innerText(),`Ver. ${version}`);
  assert.equal(await page.evaluate(()=>!!navigator.serviceWorker.controller),true);
  for(const name of HERO_MODEL_NAMES){
    const expected=createHash('sha256').update(await readFile(resolve('public',heroModelPath(name,{})))).digest('hex');
    const path=heroModelPath(name,{[name]:expected.slice(0,12)});
    assert.equal(served.get(path),expected,`Current ${name} bypasses the legacy cache`);
  }
  assert.equal(await page.evaluate(async base=>{
    const cache=await caches.open('legacy-model-cache');
    return (await cache.match(base+'assets/models/nyanluna.glb')).text();
  },base),'obsolete model','Verification retains the stale cached model');
  assert.deepEqual(errors,[]);
  console.log('PASS all six current models load under a legacy cache-first worker; old model cache remains intact');
}finally{
  await browser.close();await new Promise(resolve=>server.close(resolve));
}
