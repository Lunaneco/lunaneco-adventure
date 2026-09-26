import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {normalizeProgression} from '../src/progression.js';
import {HEROES} from '../src/model.js';

// Drives the real weapon gacha: each rarity and presentation route, skip paths, layouts, reduced
// motion, a clip that fails to load, and Safari's engine. Needs a dev server (LUNARIA_URL).
const BASE=process.env.LUNARIA_URL||'http://127.0.0.1:5189/',out='audit/weapon-summon-v137',SHOTS=process.env.SHOTS!=='0';
await mkdir(out,{recursive:true});
const seed=normalizeProgression({inventory:{weaponTicket:60,starBud:10},story:{version:2,actClears:Array(8).fill(true)},tutorial:{firstBattleCompleted:true}},HEROES);
const ROUTES=[
  {name:'r2',draw:[.05,.1,0],route:.5,rank:2,colors:['blue'],hero:'にゃんるな',moments:{pillar:450,burst:180,reveal:650}},
  {name:'r3',draw:[.4,.8,0],route:.5,rank:3,colors:['purple'],hero:'つきねこ',moments:{pillar:450,burst:180}},
  {name:'r3-promoted',draw:[.9,.8,.5],route:.1,rank:3,colors:['blue','purple'],hero:'オムソロ',moments:{crack:420,burst:180}},
  {name:'r4',draw:[.05,.99,0],route:.8,rank:4,colors:['gold'],hero:'にゃんるな',moments:{gold:1400,burst:180,cutin:420,reveal:650}},
  {name:'r4-promoted',draw:[.4,.99,.5],route:.4,rank:4,colors:['blue','gold'],hero:'つきねこ',moments:{crack:420,gold:700,halo:250}},
  {name:'r4-omen',draw:[.9,.99,.9],route:.1,rank:4,colors:['gold'],omen:true,hero:'オムソロ',moments:{omen:350,cutin:420,reveal:650}},
];
const checks=[],errors=[],RANK={blue:2,purple:3,gold:4};let clipBlocked=false;
async function open(engine,viewport={width:390,height:844}){
  const browser=await engine.launch(engine===chromium?{channel:'chrome',headless:true}:{headless:true});
  const context=await browser.newContext({viewport,...(engine===chromium?{isMobile:true}:{}),hasTouch:true});
  await context.addInitScript(({profile})=>{if(sessionStorage.getItem('summon-audit'))return;localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'high',motion:true,music:false,sound:true,voice:true}));sessionStorage.setItem('summon-audit','1');},{profile:seed});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(`${engine.name()}: ${e.message}`));page.on('console',m=>{if(m.type()==='error'&&!(clipBlocked&&/\.mp4/.test(m.location().url)))errors.push(`${engine.name()}: ${m.text()} ${m.location().url}`);});
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:180000});await page.waitForSelector('#loading',{state:'detached',timeout:180000});
  await page.locator('#chapter-menu-open').click();await page.locator('[data-menu-tab="weapons"]').click();
  // Players reach the gacha with the clip cached by the service worker; wait for the same here.
  await page.waitForFunction(()=>{const v=document.querySelector('.summon-video');return v.readyState>=3&&v.buffered.length&&v.buffered.end(v.buffered.length-1)>=6.2;},null,{timeout:180000,polling:500});
  await page.evaluate(()=>{const root=document.querySelector('.summon-root'),video=root.querySelector('.summon-video');window.__summonLog=[];
    new MutationObserver(()=>window.__summonLog.push({phase:root.dataset.phase,at:(performance.now()-window.__summonStart)/1000,video:Number(video.currentTime.toFixed(3)),live:root.classList.contains('video-live'),noVideo:root.classList.contains('no-video'),signal:root.dataset.signal})).observe(root,{attributes:true,attributeFilter:['data-phase']});});
  return {browser,page};
}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
const summon=(page,draw,route)=>page.evaluate(({draw,route})=>{const original=Math.random,values=[...draw,route];Math.random=()=>values.length?values.shift():original();window.__summonLog=[];window.__summonStart=performance.now();try{document.querySelector('[data-draw-weapon]').click();}finally{Math.random=original;}},{draw,route});
const reached=(page,phase,timeout=25000)=>page.waitForFunction(p=>{const root=document.querySelector('.summon-root');return p==='final'?root.classList.contains('is-final'):root.classList.contains(`at-${p}`);},phase,{polling:'raf',timeout});
const shot=(page,name)=>SHOTS?page.screenshot({path:`${out}/${name}.png`}):null;
const later=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const phases=log=>log.map(e=>`${e.phase}@${e.at.toFixed(2)}(v${e.video}${e.noVideo?' css':''})`).join(' ');
const layout=page=>page.evaluate(()=>{
  const q=s=>document.querySelector(s).getBoundingClientRect(),stage=q('.summon-stage'),weapon=q('.summon-weapon'),sheet=q('.draw-sheet'),close=q('#weapon-draw-result [data-close]'),title=q('.draw-title');
  const halo={x:stage.left+stage.width*.52,y:stage.top+stage.height*.368};
  const root=document.querySelector('.summon-root'),card=document.querySelector('#weapon-draw-result');
  return {overflow:document.documentElement.scrollWidth>innerWidth,scrolled:root.scrollLeft||root.scrollTop,cardScroll:card.scrollHeight-card.clientHeight,weaponOffset:Math.hypot(weapon.left+weapon.width/2-halo.x,weapon.top+weapon.height/2-halo.y),close:{top:close.top,bottom:close.bottom,height:close.height},sheet:{top:sheet.top,bottom:sheet.bottom,left:sheet.left,right:sheet.right},title:{top:title.top},ringBottom:halo.y+stage.width*.25,width:innerWidth,height:innerHeight,stageRight:stage.right};
});
const closeResult=async page=>{await later(400);await page.locator('#weapon-draw-result [data-close]').click();await page.waitForFunction(()=>!document.querySelector('#weapon-summon').open);};
const skipByTap=page=>{const {width,height}=page.viewportSize();return page.touchscreen.tap(Math.round(width/2),Math.round(height*.3));};

const browsers=[];
try{
  const chrome=await open(chromium);browsers.push(chrome.browser);const page=chrome.page;
  for(const r of ROUTES){
    const before=await saved(page);await summon(page,r.draw,r.route);
    assert.equal((await saved(page)).inventory.weaponTicket,before.inventory.weaponTicket-1,'the draw is saved before the presentation');
    for(const [phase,wait] of Object.entries(r.moments)){await reached(page,phase);await later(wait);await shot(page,`${r.name}-${phase}`);}
    await reached(page,'final');await later(900);await shot(page,`${r.name}-final`);
    const log=await page.evaluate(()=>window.__summonLog),text=await page.locator('#weapon-draw-result').innerText(),ranks=log.map(e=>RANK[e.signal]);
    assert.ok(ranks.every((v,i)=>v<=r.rank&&(i===0||v>=ranks[i-1])),`${r.name} colours never exceed the rarity or step down: ${log.map(e=>e.signal)}`);
    for(const color of r.colors)assert.ok(log.some(e=>e.signal===color),`${r.name} shows ${color}`);
    assert.equal(log.some(e=>e.phase==='omen'),!!r.omen);assert.equal(log.some(e=>e.phase==='crack'),r.colors.length>1);
    assert.equal(log.some(e=>e.noVideo),false,`${r.name} kept the clip: ${phases(log)}`);assert.ok(log.some(e=>e.live),`${r.name} played the clip`);
    const maxVideo=Math.max(...log.map(e=>e.video));assert.ok(r.rank===4?maxVideo<=6.26:maxVideo<1.04,`${r.name} clip reached ${maxVideo}`);
    if(r.rank===4){const burst=log.find(e=>e.phase==='burst');assert.ok(Math.abs(burst.video-4.2)<.2,`gold burst on the clip's sunburst (${burst.video})`);}
    assert.match(text,new RegExp(`${r.hero}専用`));assert.match(text,new RegExp(`★${r.rank}`));assert.equal(await page.locator('.draw-stars i.lit').count(),r.rank);
    const l=await layout(page);assert.ok(l.weaponOffset<2,`weapon centred in the halo (${l.weaponOffset})`);assert.equal(l.overflow,false);assert.ok(l.close.bottom<=l.height&&l.close.height>=44,'close button reachable');assert.ok(l.cardScroll<=1&&!l.scrolled,`${r.name} result fits unscrolled (${l.cardScroll}px over)`);
    assert.equal(await page.evaluate(()=>document.activeElement?.matches('#weapon-draw-result [data-close]')),true,'focus moves to the result');
    checks.push({route:r.name,finalAt:Number(log.at(-1).at.toFixed(2)),phases:phases(log)});
    await closeResult(page);assert.equal(await page.evaluate(()=>document.activeElement?.matches('[data-draw-weapon]')),true,'focus returns to the summon button');
  }
  console.log('PASS routes: every rarity and presentation route is honest, follows the clip, centred and reachable');

  await summon(page,[.05,.99,0],.8);await reached(page,'gold');await later(600);await skipByTap(page);
  await page.waitForSelector('.summon-root.is-final.is-skipped',{timeout:2000});assert.equal(await page.locator('.draw-stars i.lit').count(),4);await later(500);await shot(page,'skip-final');
  checks.push({skipVoice:await page.evaluate(()=>window.__LUNARIA_TEST__.voice.current?.id??null)});
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#weapon-summon').open);
  await summon(page,[.05,.1,0],.5);await later(300);await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  await page.waitForSelector('.summon-root.is-final.is-skipped',{timeout:2000});assert.equal(await page.locator('#weapon-summon').evaluate(el=>el.open),true,'a second Esc right after skipping counts as the same press');
  await later(400);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#weapon-summon').open);
  await summon(page,[.05,.1,0],.5);await later(500);
  const frozen=await page.evaluate(async()=>{const s=window.__LUNARIA_TEST__.weaponSummon,v=document.querySelector('.summon-video');s.setHidden(true);const t=s.current.t;await new Promise(r=>setTimeout(r,600));const held={clock:s.current.t===t,clip:v.paused};s.setHidden(false);return held;});
  assert.deepEqual(frozen,{clock:true,clip:true});await reached(page,'final');await closeResult(page);
  await summon(page,[.4,.8,.2],.5);await reached(page,'final');await later(400);await page.locator('#weapon-draw-result [data-equip-weapon]').click();
  assert.match(await page.locator('#weapon-draw-result .draw-equip').innerText(),/装備中/);assert.equal(await page.locator('.draw-stars i.lit').count(),3);await closeResult(page);
  console.log('PASS controls: tap skip, Esc skip then close with the double-press guard, hidden-tab freeze, equip from the result');

  for(const size of [{width:320,height:568},{width:375,height:667},{width:844,height:390},{width:1440,height:900},{width:768,height:1024}]){
    const name=`${size.width}x${size.height}`;await page.setViewportSize(size);await summon(page,[.05,.99,.4],.8);await reached(page,'burst');await later(200);await shot(page,`size-${name}-burst`);
    await skipByTap(page);await reached(page,'final');await later(800);await shot(page,`size-${name}-final`);
    const l=await layout(page);assert.equal(l.overflow,false);assert.ok(l.close.bottom<=l.height+1&&l.close.top>=0,`${name} close button on screen ${JSON.stringify(l.close)}`);assert.ok(l.sheet.right<=l.width&&l.sheet.left>=0,`${name} sheet inside ${JSON.stringify(l.sheet)}`);
    assert.equal(l.scrolled,0,`${name} stage never scrolls`);assert.ok(l.cardScroll<=1,`${name} result fits without scrolling (${l.cardScroll}px over)`);
    if(size.width>size.height)assert.ok(l.sheet.left>=l.stageRight-1,`${name} result beside the altar`);else assert.ok(l.title.top>=l.ringBottom-4,`${name} title below the halo ring`);
    checks.push({size:name,sheet:l.sheet,close:l.close});await closeResult(page);
  }
  await page.setViewportSize({width:390,height:844});
  console.log('PASS layouts: 320x568, 375x667, 844x390, 1440x900 and 768x1024');

  await page.locator('#chapter-menu [data-open="settings"]').click();await page.locator('#setting-motion').uncheck();await page.locator('#modal [data-close]').first().click();
  await summon(page,[.9,.99,0],.1);await page.waitForSelector('.summon-root.is-final',{timeout:2500});
  const calm=await page.evaluate(()=>window.__summonLog);assert.equal(calm.some(e=>e.live||['omen','crack','pillar','burst','gold','cutin'].includes(e.phase)),false,phases(calm));assert.ok(calm.at(-1).at<1.8);
  await later(300);await shot(page,'reduced-motion-final');await closeResult(page);
  await page.locator('#chapter-menu [data-open="settings"]').click();await page.locator('#setting-motion').check();await page.locator('#modal [data-close]').first().click();
  console.log('PASS reduced motion: no clip, promotion, omen or flash; result in under 1.8 s');

  clipBlocked=true;await page.route(url=>url.pathname.endsWith('.mp4'),route=>route.abort());await page.evaluate(()=>{const v=document.querySelector('.summon-video');v.src=`${v.src.split('?')[0]}?offline`;v.load();});await later(500);
  await summon(page,[.05,.99,0],.1);for(const phase of ['gold','burst']){await reached(page,phase);await later(phase==='gold'?1200:200);await shot(page,`no-clip-${phase}`);}
  await reached(page,'final');const broken=await page.evaluate(()=>window.__summonLog);assert.ok(broken.every(e=>!e.live)&&broken.some(e=>e.noVideo),phases(broken));
  checks.push({noClip:phases(broken)});await later(600);await shot(page,'no-clip-final');await closeResult(page);
  console.log('PASS missing clip: the stage finishes with its own light layers');

  const safari=await open(webkit);browsers.push(safari.browser);await summon(safari.page,[.05,.99,0],.8);await reached(safari.page,'burst');await later(200);await shot(safari.page,'webkit-burst');
  await reached(safari.page,'final');await later(800);await shot(safari.page,'webkit-final');const safariLog=await safari.page.evaluate(()=>window.__summonLog);
  checks.push({webkit:phases(safariLog)});assert.match(await safari.page.locator('#weapon-draw-result').innerText(),/にゃんるな専用/);await closeResult(safari.page);
  console.log(`PASS webkit: the legendary route completes (${safariLog.some(e=>e.noVideo)?'CSS light layers':'with the clip'}) and closes`);

  assert.deepEqual(errors,[]);
  await writeFile(`${out}/report.json`,JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));console.log(JSON.stringify(checks,null,1));
}finally{for(const browser of browsers)await browser.close();}
