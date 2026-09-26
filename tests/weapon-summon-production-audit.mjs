import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {normalizeProgression} from '../src/progression.js';
import {HEROES} from '../src/model.js';

// The built game under its CSP and service worker: a legendary summon plays the clip in Chrome and
// Safari's engine, and in Chrome again offline from the cache. Needs a preview server (AUDIT_URL).
// Playwright's WebKit cannot emulate offline with a service worker, so offline is Chrome only.
const BASE=process.env.AUDIT_URL??'http://127.0.0.1:4173/',out='audit/weapon-summon-v137';await mkdir(out,{recursive:true});
const seed=normalizeProgression({inventory:{weaponTicket:10},story:{version:2,actClears:Array(8).fill(true)},tutorial:{firstBattleCompleted:true}},HEROES);
const later=ms=>new Promise(resolve=>setTimeout(resolve,ms)),report=[];

async function legendary(page){
  await page.locator('#chapter-menu-open').click();await page.locator('[data-menu-tab="weapons"]').click();
  await page.waitForFunction(()=>document.querySelector('.summon-video')?.readyState>=3,null,{timeout:60000,polling:250});
  await page.evaluate(()=>{
    const root=document.querySelector('.summon-root'),video=root.querySelector('.summon-video');window.__summonLog=[];
    new MutationObserver(()=>window.__summonLog.push({phase:root.dataset.phase,live:root.classList.contains('video-live'),css:root.classList.contains('no-video'),video:video.currentTime})).observe(root,{attributes:true,attributeFilter:['data-phase']});
    const original=Math.random,values=[.05,.99,0,.8];Math.random=()=>values.length?values.shift():original();
    try{document.querySelector('[data-draw-weapon]').click();}finally{Math.random=original;}
  });
  await page.waitForSelector('.summon-root.is-final',{timeout:30000});
  const log=await page.evaluate(()=>window.__summonLog),burst=log.find(e=>e.phase==='burst');
  assert.ok(log.some(e=>e.live)&&!log.some(e=>e.css),`the clip played: ${JSON.stringify(log)}`);
  assert.ok(Math.abs(burst.video-4.2)<.25,`burst on the clip's sunburst (${burst.video})`);
  assert.ok(Math.max(...log.map(e=>e.video))>6.1,'the clip reached the halo');
  assert.match(await page.locator('#weapon-draw-result').innerText(),/にゃんるな専用/);
  return Number(burst.video.toFixed(3));
}
async function closeResult(page){await later(400);await page.locator('#weapon-draw-result [data-close]').click();await page.waitForFunction(()=>!document.querySelector('#weapon-summon').open);}
async function clipCached(page){
  for(let i=0;i<120;i++){
    if(await page.evaluate(async()=>{const url=new URL('assets/gacha/weapon-summon-v1.mp4',location.href).href;for(const key of await caches.keys())if(await(await caches.open(key)).match(url,{ignoreSearch:true}))return true;return false;}))return true;
    await later(500);
  }
  return false;
}

for(const engine of [chromium,webkit]){
  const browser=await engine.launch(engine===chromium?{channel:'chrome',headless:true}:{headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'allow'});
    await context.addInitScript(({profile})=>{
      document.addEventListener('securitypolicyviolation',e=>console.error(`CSP blocked ${e.blockedURI} (${e.violatedDirective})`));
      if(sessionStorage.getItem('summon-production-audit'))return;
      localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));
      localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'high',motion:true,music:false,sound:true,voice:true}));
      sessionStorage.setItem('summon-production-audit','1');
    },{profile:seed});
    const page=await context.newPage(),errors=[],name=engine.name(),entry={engine:name};
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(BASE);await page.waitForSelector('#loading',{state:'detached',timeout:120000});
    assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
    entry.online=await legendary(page);await closeResult(page);
    console.log(`PASS ${name} online: the clip plays under the production CSP (burst at ${entry.online}s of the clip)`);
    assert.ok(await clipCached(page),'the service worker caches the summon clip');
    if(engine===chromium){
      await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:120000});
      assert.ok(await page.evaluate(()=>!!navigator.serviceWorker.controller),'the service worker controls the page');
      await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#loading',{state:'detached',timeout:120000});
      entry.offline=await legendary(page);await page.screenshot({path:`${out}/production-offline.png`});await closeResult(page);await context.setOffline(false);
      console.log(`PASS ${name} offline: the cached clip streams through the service worker (burst at ${entry.offline}s)`);
    }
    assert.deepEqual(errors,[],`${name} errors`);report.push(entry);
  }finally{await browser.close();}
}
await writeFile(`${out}/production-report.json`,JSON.stringify({date:new Date().toISOString(),base:BASE,report},null,2));
console.log('PASS production: no CSP violations or browser errors');
