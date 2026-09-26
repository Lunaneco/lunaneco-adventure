import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';
import {ULTIMATE_ART} from '../src/ultimate-art.js';
const OUTPUT=process.env.VOICE_AUDIT_DIR||'audit/voices-v127';
const BASE=process.env.LUNARIA_URL||'http://127.0.0.1:4187/lunaneco-adventure/';
const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[],errors=[];
const pass=name=>{checks.push(name);console.log('PASS',name);};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'allow'});
 await context.addInitScript(()=>{
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:true,voice:true,voiceVolume:.44,music:false,quality:'low'}));
  window.__voiceAudit=[];window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.effectiveDirective));
  const Original=window.AudioContext||window.webkitAudioContext;
  window.AudioContext=class extends Original{createBufferSource(){const node=super.createBufferSource(),start=node.start;node.start=function(...args){window.__voiceAudit.push({duration:this.buffer?.duration,state:this.context.state});return start.apply(this,args);};return node;}};
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const worker=await(await fetch(new URL('sw.js',BASE))).text(),prefix=JSON.parse(worker.match(/const PREFIX=("[^"]+")/)[1]);
 const seedUrl=new URL('__voice-audit-seed',BASE).href;
 await page.route(seedUrl,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Voice cache migration</title>'}));await page.goto(seedUrl);
 await page.evaluate(async({prefix,base})=>{const cache=await caches.open(prefix+'previous');await cache.put(new URL('assets/voices/nyanluna/nyanluna-df12363a.mp3',base),new Response('obsolete voice'));await cache.put(new URL('assets/voices/tsukineko/tsukineko-ultimate-1-0b4faae75a70.mp3',base),new Response('obsolete Tsukineko voice'));await caches.open('unrelated-app');},{prefix,base:BASE});
 await page.goto(BASE);await page.waitForSelector('#loading',{state:'detached',timeout:60000});assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
 await page.locator('#start').tap();await page.locator('#chapter-start').tap();await page.waitForFunction(()=>window.__voiceAudit.length>0);let result=await page.evaluate(()=>window.__voiceAudit.at(-1));assert.equal(result.state,'running');assert.ok(result.duration>2);assert.deepEqual(await page.evaluate(()=>window.__csp),[]);pass('Published build plays opening voice under CSP without a development bridge');
 await page.locator('#story-next').tap();await page.waitForFunction(()=>window.__voiceAudit.length>1);assert.ok(Math.abs((await page.evaluate(()=>window.__voiceAudit.at(-1).duration))-VOICE_MANIFEST['nyanluna-df12363a'].duration)<.15);await page.locator('#story-voice').tap();await page.waitForFunction(()=>window.__voiceAudit.length>2);pass('Published dialogue plays the re-recorded Nyanluna voice and supports replay');
 await page.evaluate(()=>navigator.serviceWorker.ready);const files=await page.evaluate(async()=>{const keys=await caches.keys();const cache=await caches.open(keys.find(k=>k.startsWith('lunaria-v1-')));return(await cache.keys()).map(r=>r.url);});for(const item of Object.values(VOICE_MANIFEST))assert.ok(files.includes(new URL(item.file,BASE).href),`Not cached: ${item.file}`);assert.equal(files.filter(url=>url.includes('/assets/voices/')).length,Object.keys(VOICE_MANIFEST).length);pass(`All ${Object.keys(VOICE_MANIFEST).length} voices are saved in the correctly scoped offline cache`);
 for(const art of Object.values(ULTIMATE_ART))assert.ok(files.includes(new URL(art.file,BASE).href),`Not cached: ${art.file}`);
 pass('All three dedicated ultimate illustrations are cached with the published build');
 const keys=await page.evaluate(()=>caches.keys());assert.ok(!keys.includes(prefix+'previous'));assert.ok(keys.includes('unrelated-app'));assert.ok(!files.some(url=>url.endsWith('/nyanluna-df12363a.mp3')));assert.ok(!files.some(url=>url.endsWith('/tsukineko-ultimate-1-0b4faae75a70.mp3')));pass('Previous voice cache is removed while unrelated app caches are preserved');
 await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:60000});assert.ok(await page.evaluate(()=>navigator.serviceWorker.controller));await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.locator('#start').tap();await page.locator('#chapter-start').tap();await page.waitForFunction(()=>window.__voiceAudit.length>0);assert.equal(await page.evaluate(()=>window.__voiceAudit[0].state),'running');await page.locator('#story-next').tap();await page.waitForFunction(()=>window.__voiceAudit.length>1);assert.ok(Math.abs((await page.evaluate(()=>window.__voiceAudit.at(-1).duration))-VOICE_MANIFEST['nyanluna-df12363a'].duration)<.15);pass('Offline reload plays the re-recorded Nyanluna voice');
 const artWidths=await page.evaluate(async urls=>Promise.all(urls.map(async src=>{const image=new Image();image.src=src;await image.decode();return image.naturalWidth;})),Object.values(ULTIMATE_ART).map(art=>new URL(art.file,BASE).href));assert.ok(artWidths.every(width=>width>=1000));pass('All three ultimate illustrations decode at full resolution offline');
 const tsukineko=Object.entries(VOICE_MANIFEST).filter(([,v])=>v.who==='tsukineko');
 const decoded=await page.evaluate(async entries=>{
  const context=new (window.AudioContext||window.webkitAudioContext)(),rows=[];
  try{for(const [id,v] of entries){const response=await fetch(v.url);if(!response.ok)throw Error(`${id}: ${response.status}`);const buffer=await context.decodeAudioData(await response.arrayBuffer());rows.push({id,seconds:buffer.duration,channels:buffer.numberOfChannels});}}
  finally{await context.close();}return rows;
 },tsukineko.map(([id,v])=>[id,{...v,url:new URL(v.file,BASE).href}]));
 assert.equal(decoded.length,tsukineko.length);for(const row of decoded){assert.equal(row.channels,1);assert.ok(Math.abs(row.seconds-VOICE_MANIFEST[row.id].duration)<.05,`Voice timing mismatch: ${row.id}`);}
 pass(`All ${decoded.length} Tsukineko voices decode offline with the updated playback durations`);

 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__csp),[]);pass('No missing assets, CSP violations or runtime errors');await context.setOffline(false);
 await mkdir(OUTPUT,{recursive:true});await writeFile(`${OUTPUT}/${new URL(BASE).hostname.includes('github')?'hosted':'production'}-report.json`,JSON.stringify({base:BASE,date:new Date().toISOString(),checks,errors},null,2));await context.close();
}finally{await browser.close();}
