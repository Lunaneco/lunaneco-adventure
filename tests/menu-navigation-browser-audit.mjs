import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base=process.env.LUNARIA_URL??'http://127.0.0.1:5185/';
const out='audit/navigation';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const sizes=[{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}];
const errors=[];
async function open(recruited=false){
  const context=await browser.newContext({viewport:sizes[1],isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(recruited=>{
    if(sessionStorage.getItem('navigation-seeded'))return;
    localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,music:false,motion:false,quality:'low'}));
    if(recruited){
      localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(8).fill(true)},tutorial:{firstBattleCompleted:true}}));
      localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['nyanluna','tsukineko'],lead:'nyanluna'}));
    }
    sessionStorage.setItem('navigation-seeded','1');
  },recruited);
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base);
  await page.waitForSelector('#loading',{state:'detached',timeout:60000});
  return {context,page};
}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-party-v1')));
async function reachable(page,selector){
  const box=await page.locator(selector).boundingBox(),size=page.viewportSize();
  assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,`${selector}: ${JSON.stringify({box,size})}`);
  assert.ok(box.height>=44);
  assert.equal(await page.locator(selector).evaluate(el=>{const b=el.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===el;}),true);
}
try{
  const {context,page}=await open();
  for(const size of sizes){
    await page.setViewportSize(size);
    await reachable(page,'#start');
    await page.locator('#start').tap();
    assert.equal(await page.locator('#chapter-menu').isVisible(),true);
    assert.equal(await page.locator('#home').isVisible(),false);
    assert.equal(await page.locator('#hud').isVisible(),false);
    assert.equal(await page.locator('#story-dialog').isVisible(),false);
    assert.equal(await page.locator('#battle-tutorial').isVisible(),false);
    await reachable(page,'#menu-party-open');
    assert.equal(await page.locator('#chapter-menu').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    await page.screenshot({path:`${out}/menu-${size.width}.png`});
    await page.locator('#menu-party-open').tap();
    assert.equal(await page.locator('[data-party-toggle="nyanluna"]').isDisabled(),true);
    assert.equal(await page.locator('[data-party-toggle="tsukineko"]').isDisabled(),true);
    await reachable(page,'.party-back');
    assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    await page.screenshot({path:`${out}/party-${size.width}.png`});
    await page.locator('.party-back').tap();
    assert.equal(await page.locator('#menu-party-open').evaluate(el=>el===document.activeElement),true);
    await page.locator('#menu-title').tap();
    assert.equal(await page.locator('#start').evaluate(el=>el===document.activeElement),true);
  }
  console.log('PASS: title → menu → party → menu → title; four viewport sizes, touch targets, focus restoration, no accidental battle');
  await page.setViewportSize(sizes[1]);
  await page.locator('#start').tap();
  await page.locator('#chapter-start').tap();
  await page.locator('#story-skip').tap();
  await page.waitForSelector('#battle-tutorial:not(.hidden)');
  assert.equal(await page.locator('body').getAttribute('data-tutorial-step'),'welcome');
  await page.locator('#tutorial-skip').tap();
  await page.locator('#pause').tap();
  await page.locator('#quit').tap();
  assert.equal(await page.locator('#chapter-menu').isVisible(),true);
  assert.equal(await page.locator('#hud').isVisible(),false);
  console.log('PASS: explicit stage departure starts the story and first-battle tutorial; quitting returns to menu');
  await context.close();

  const returning=await open(true),p=returning.page;
  await p.locator('#start').tap();
  await p.locator('[data-difficulty="hard"]').tap();
  await p.locator('[data-menu-tab="equipment"]').tap();
  await p.locator('#menu-party-open').tap();
  await p.locator('[data-party-toggle="nyanluna"]').tap();
  await p.locator('[data-party-toggle="omsolo"]').tap();
  await p.locator('[data-party-lead="2"]').tap();
  const party={members:['tsukineko','omsolo'],lead:'omsolo'};
  assert.deepEqual(await saved(p),party);
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#equipment-panel').isVisible(),true);
  assert.equal(await p.locator('#menu-party-open').evaluate(el=>el===document.activeElement),true);
  assert.equal(await p.locator('.menu-hero[data-hero="2"] [data-party-role]').innerText(),'先頭');
  assert.equal(await p.locator('.menu-hero[data-hero="1"] [data-party-role]').innerText(),'援護');
  await p.locator('[data-menu-tab="adventure"]').tap();
  assert.equal(await p.locator('#chapter-start').getAttribute('data-mode'),'hard');
  await p.reload();
  await p.waitForSelector('#loading',{state:'detached'});
  await p.locator('#start').tap();
  assert.deepEqual(await saved(p),party);
  await p.locator('#menu-party-open').tap();
  await p.locator('[data-open-skill-loadout]').tap();
  assert.equal(await p.locator('#talent-panel').isVisible(),true);
  assert.equal(await p.locator('#modal').isVisible(),false);
  await p.locator('[data-menu-tab="adventure"]').tap();
  await p.locator('#chapter-start').tap();
  await p.locator('#story-skip').tap();
  assert.equal(await p.locator('#battle-tutorial').isVisible(),false);
  assert.equal(await p.locator('#hero-name').innerText(),'オムソロ');
  await p.locator('#pause').tap();
  await p.locator('#quit').tap();
  await p.locator('#menu-party-open').tap();
  assert.deepEqual(await saved(p),party);
  await returning.context.close();
  assert.deepEqual(errors,[]);
  console.log('PASS: party changes persist, lead/support labels update, tabs and difficulty survive editing, skill link works, selected hero deploys; zero browser errors');
}finally{await browser.close();}
