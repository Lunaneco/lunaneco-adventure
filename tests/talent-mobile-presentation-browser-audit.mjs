import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {HEROES} from '../src/model.js';
import {TREE_RESOURCES} from '../src/talents.js';
import {normalizeProgression} from '../src/progression.js';

const url=process.env.LUNARIA_URL??'http://127.0.0.1:5187/';
const out=process.env.TREE_AUDIT_OUT??'audit/talent-detail-sheet-20261003';
await mkdir(out,{recursive:true});
const seed=normalizeProgression({
  story:{version:2,actClears:Array(32).fill(true)},tutorial:{firstBattleCompleted:true},
  characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:h.id==='tsukineko'?20:80,breaks:h.id==='tsukineko'?0:6,tree:[]}])),
  inventory:Object.fromEntries(Object.keys(TREE_RESOURCES).map(id=>[id,100000])),
},HEROES);
const browser=await chromium.launch({channel:'chrome',headless:true}),report={url,layouts:[],heroLayouts:[],sheets:[],unlocks:[],errors:[]};
async function open(motion=true){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  await context.addInitScript(({seed,motion})=>{
    if(!sessionStorage.getItem('talent-test-seeded')){
      localStorage.setItem('lunaria-progression-v1',JSON.stringify(seed));
      localStorage.setItem('lunaria-settings-v1',JSON.stringify({motion,quality:'low',sound:false,music:false,voice:false}));
      sessionStorage.setItem('talent-test-seeded','1');
    }
  },{seed,motion});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});
  await page.locator('#start').click();await page.locator('[data-menu-tab="talent"]').click();
  return {context,page};
}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
const treeScroll=page=>page.locator('#chapter-menu').evaluate(e=>e.scrollTop);
const nodeRect=async(page,id)=>page.locator(`[data-tree-node="${id}"]`).evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};});
async function explain(page,id){
  const star=page.locator(`[data-tree-node="${id}"]`);
  await star.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
  const top=await treeScroll(page),rect=await nodeRect(page,id);
  await star.tap();await page.waitForSelector('#modal.talent-explanation[open]');
  assert.equal(await treeScroll(page),top,'opening an explanation must not scroll the tree');
  assert.equal((await nodeRect(page,id)).top,rect.top,'the selected star must stay in place');
  assert.equal(await page.locator('#modal').getAttribute('aria-labelledby'),'talent-explanation-title');
  assert.equal(await page.locator('#talent-explanation-title').innerText(),await star.locator('strong').innerText());
  assert.equal(await page.locator('#modal').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
  assert.equal(await page.locator('#dialog-talent-detail').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
  assert.equal(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return new Set(ids).size===ids.length;}),true);
  return top;
}
async function unlock(page,id){
  const top=await explain(page,id);
  await page.locator(`#modal [data-unlock-node="${id}"]`).tap();
  await page.waitForTimeout(120);
  assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);
  assert.equal(await treeScroll(page),top,'unlocking must return to the same tree position');
}
try{
  const {context,page}=await open();
  const initial=await saved(page);
  for(const [width,height] of [[320,568],[375,812],[390,844],[430,932],[760,900],[844,390],[1440,1000]]){
    await page.setViewportSize({width,height});
    for(const tier of ['1','2','4','3']){
      await page.locator(`[data-tree-tier="${tier}"]`).click();
      const tabs=await page.locator('.tree-tiers button').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,width:r.width,height:r.height,overflow:e.scrollWidth>e.clientWidth+1};}));
      assert.equal(tabs.length,4);assert.ok(tabs.every(t=>Math.abs(t.top-tabs[0].top)<1));
      assert.ok(tabs.every(t=>t.left>=0&&t.right<=width+1&&t.width>=44&&t.height>=44&&!t.overflow),JSON.stringify({width,tier,tabs}));
      const geometry=await page.locator('.talent-map .talent-node').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.treeNode,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,overflow:e.scrollWidth>e.clientWidth+1};}));
      assert.ok(geometry.every(r=>r.left>=0&&r.right<=width+1&&r.width>=44&&r.height>=44&&!r.overflow),JSON.stringify({width,tier,geometry}));
      // Peer branches must stay on one row and must not overlap, even at 320px.
      if(tier!=='3'){
        const peers=geometry.slice(1,4);assert.ok(peers.every(r=>Math.abs(r.top-peers[0].top)<1));
        assert.ok(peers[0].right<=peers[1].left+1&&peers[1].right<=peers[2].left+1);
        assert.ok(geometry[0].bottom<peers[0].top&&peers[0].bottom<geometry[4].top);
      }
      assert.equal(await page.locator('#chapter-menu').evaluate(e=>e.scrollWidth>innerWidth+1),false);
      if(width<=760){
        assert.equal(await page.locator('#talent-detail').isVisible(),false);
        const id=geometry[0].id,top=await explain(page,id);
        const sheet=await page.locator('#modal').boundingBox();
        assert.ok(sheet.x>=0&&sheet.x+sheet.width<=width+1&&sheet.y>=0&&sheet.y+sheet.height<=height);
        if(width===390&&tier==='1')await page.screenshot({path:`${out}/detail-sheet-390.png`});
        await page.locator('#modal').evaluate(e=>e.scrollTop=e.scrollHeight);
        assert.equal(await treeScroll(page),top,'scrolling explanations must leave the tree alone');
        await page.locator('.talent-sheet-close').tap();
        assert.equal(await treeScroll(page),top);
        assert.equal(await page.evaluate(()=>document.activeElement.dataset.treeNode),id);
        assert.equal(await page.locator('#dialog-talent-detail').count(),0);
        report.sheets.push({width,height,tier,positionPreserved:true,isolatedScroll:true});
      }else{
        await page.locator(`[data-tree-node="${geometry[0].id}"]`).click();
        assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);
        assert.equal(await page.locator('#talent-detail').isVisible(),true);
        assert.equal(await page.locator('#talent-detail').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
      }
      report.layouts.push({width,height,tier,tabs,geometry});
    }
    await page.locator('[data-tree-tier="1"]').click();
    if([320,390,1440].includes(width)){
      await page.locator('.talent-map-heading').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
      await page.screenshot({path:`${out}/tree-${width}.png`});
    }
  }
  // Character-specific ultimate stars can have much longer names than Nyanluna's.
  for(const hero of HEROES){
    await page.locator(`[data-tree-hero="${hero.id}"]`).click();
    for(const width of [320,390]){
      await page.setViewportSize({width,height:844});
      for(const tier of ['1','2','4','3']){
        await page.locator(`[data-tree-tier="${tier}"]`).click();
        const bounds=await page.locator('.talent-map').evaluate(map=>{
          const m=map.getBoundingClientRect();
          return [...map.querySelectorAll('.talent-node')].map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.treeNode,left:r.left,right:r.right,bottom:r.bottom,mapBottom:m.bottom,overflow:e.scrollWidth>e.clientWidth+1};});
        });
        assert.ok(bounds.every(r=>r.left>=0&&r.right<=width+1&&r.bottom<=r.mapBottom&&!r.overflow),JSON.stringify({hero:hero.id,width,tier,bounds}));
        report.heroLayouts.push({hero:hero.id,width,tier,bounds});
      }
    }
  }
  await page.locator('[data-tree-hero="nyanluna"]').click();await page.locator('[data-tree-tier="1"]').click();
  assert.deepEqual(await saved(page),initial);
  await page.setViewportSize({width:390,height:844});
  // Escape / Tab, expanded disclosures and the horizontal picker survive sheet use.
  await page.locator('.inventory-disclosure').evaluate(e=>e.open=true);
  await page.locator('.tree-hero-picker').evaluate(e=>e.scrollLeft=30);
  const pickerLeft=await page.locator('.tree-hero-picker').evaluate(e=>e.scrollLeft);
  const cancelTop=await explain(page,'origin');
  for(let i=0;i<8;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('#modal')),true);}
  await page.keyboard.press('Escape');assert.equal(await treeScroll(page),cancelTop);
  assert.equal(await page.locator('.inventory-disclosure').evaluate(e=>e.open),true);
  assert.equal(await page.locator('.tree-hero-picker').evaluate(e=>e.scrollLeft),pickerLeft);
  await page.locator('.inventory-disclosure').evaluate(e=>e.open=false);
  await unlock(page,'origin');
  await page.waitForSelector('.constellation-unlock-notice');
  assert.equal(await page.locator('.constellation-unlock-spark').count(),8);
  assert.equal(await page.locator('.constellation-unlock-notice strong').innerText(),'はじまりの光');
  assert.equal((await saved(page)).inventory.starBud,initial.inventory.starBud-4);
  let r=await nodeRect(page,'origin');assert.ok(r.top>=0&&r.bottom<=844);
  await page.evaluate(()=>document.querySelector('[data-unlock-node="origin"]').click());
  assert.equal((await saved(page)).inventory.starBud,initial.inventory.starBud-4);
  await page.waitForTimeout(230);await page.screenshot({path:`${out}/unlock-origin-390.png`});
  await page.waitForSelector('.constellation-unlock-notice',{state:'detached',timeout:4000});
  assert.equal(await page.locator('.just-unlocked,.just-lit,.constellation-unlock-burst').count(),0);
  report.unlocks.push({kind:'origin',spentOnce:true,visibleStar:true,sparkles:8,cleanedUp:true});
  await unlock(page,'guard1');
  assert.equal(await page.locator('[data-link-node="guard1"].just-lit').count(),1);
  assert.equal(await page.locator('[data-link-node="guard1"]').evaluate(e=>getComputedStyle(e).animationName),'constellation-connect');
  await page.waitForTimeout(230);await page.screenshot({path:`${out}/unlock-branch-390.png`});
  report.unlocks.push({kind:'branch',incomingLinkAnimated:true});
  // Keyboard focus remains on the newly unlocked star.
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.treeNode),'guard1');
  await page.emulateMedia({reducedMotion:'reduce'});
  await unlock(page,'life1');
  assert.equal(await page.locator('.constellation-unlock-spark').count(),0);
  assert.equal(await page.locator('.constellation-unlock-notice').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.equal(await page.locator('[data-tree-node="life1"] .node-star').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.notEqual(await page.locator('[data-tree-node="life1"] .node-star').evaluate(e=>getComputedStyle(e).filter),'none');
  report.unlocks.push({kind:'system-reduced-motion',animated:false,persistentGlow:true});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('[data-tree-tier="3"]').tap();await unlock(page,'blessing1');
  assert.match(await page.locator('.constellation-unlock-notice p').innerText(),/新しいスキル/);
  report.unlocks.push({kind:'skill',unlocked:true});
  await explain(page,'blessing1');await page.locator('#modal [data-edit-blessings]').tap();
  assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);
  assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-blessing-slot')),true);
  const persisted=await saved(page);
  await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:120000});await page.locator('#start').click();await page.locator('[data-menu-tab="talent"]').click();
  assert.deepEqual(await saved(page),persisted);assert.equal(await page.locator('.just-unlocked,.constellation-unlock-notice').count(),0);
  await context.close();
  const still=await open(false);await still.page.locator('[data-tree-hero="tsukineko"]').tap();
  await still.page.locator('[data-tree-tier="3"]').tap();await unlock(still.page,'limit30');
  assert.equal(await still.page.locator('[data-tree-tier="3"]').getAttribute('aria-pressed'),'true');
  assert.equal(await still.page.locator('.constellation-unlock-notice small').innerText(),'LEVEL LIMIT UNLOCKED');
  assert.equal(await still.page.locator('.constellation-unlock-notice').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.equal(await still.page.locator('.constellation-unlock-spark').count(),0);
  assert.equal((await saved(still.page)).characters.tsukineko.breaks,1);
  assert.equal((await saved(still.page)).inventory.limitStone,99999);
  await still.page.locator('[data-tree-hero="nyanluna"]').tap();await explain(still.page,'guard2');
  const blocked=await saved(still.page);assert.equal(await still.page.locator('#modal [data-unlock-node="guard2"]').isDisabled(),true);
  await still.page.evaluate(()=>document.querySelector('#modal [data-unlock-node="guard2"]').click());assert.deepEqual(await saved(still.page),blocked);
  report.unlocks.push({kind:'settings-reduced-motion-and-limit',animated:false,spentOnce:true,blockedUnlockPreserved:true});
  await still.context.close();assert.deepEqual(report.errors,[]);report.status='PASS';
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
  console.log('PASS 20 floating sheets without tree scrolling, Escape / Tab / close / unlock focus, desktop inline details, 28 viewport layouts + 64 character layouts, unlock effects, reduced motion, cap/skill unlocks, single spending, persistence');
}finally{await browser.close();}
