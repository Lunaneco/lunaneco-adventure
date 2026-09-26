import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {normalizeProgression} from '../src/progression.js';
import {HEROES} from '../src/model.js';
import {ACTS,EXTRA_ACTS} from '../src/acts.js';

const url=process.env.NAV_UI_URL??'http://127.0.0.1:5190/';
const out='audit/navigation-ui';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],checks=[];
const pass=message=>{checks.push(message);console.log('PASS',message);};
async function open(profile){
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(profile=>{
    if(!sessionStorage.getItem('navigation-audit')){
      localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));
      localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));
      sessionStorage.setItem('navigation-audit','1');
    }
  },profile);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:60000});return page;
}
async function shot(page,name){
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.checkVisibility()).map(i=>i.decode().catch(()=>{})));});
  await page.screenshot({path:`${out}/${name}.png`});
}
async function fits(page,selector){
  const result=await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth,overflow:el.scrollWidth-el.clientWidth};});
  assert.ok(result.left>=-1&&result.right<=result.width+1,`${selector} exceeds viewport: ${JSON.stringify(result)}`);
  assert.ok(result.overflow<=1,`${selector} overflows horizontally: ${result.overflow}`);
}
try{
  const page=await open(normalizeProgression({tutorial:{firstBattleCompleted:true}},HEROES));
  await expect(page.locator('#home button')).toHaveCount(1);
  await expect(page.locator('#home [data-open="party"],#chapter-menu-open')).toHaveCount(0);
  await shot(page,'title-desktop');await page.click('#start');
  await expect(page.locator('#chapter-menu')).toBeVisible();
  await expect(page.locator('#chapter-start')).toHaveCount(0);
  for(const id of [1,2,3,12])await expect(page.locator(`[data-act="${id}"]`)).toBeDisabled();
  await expect(page.locator('[data-chapter="1"]')).toBeDisabled();
  await shot(page,'stages-desktop');
  await page.click('[data-act="0"]');await expect(page.getByRole('dialog',{name:'はぐれた月の道'})).toBeVisible();
  await expect(page.locator('#stage-brief-title')).toBeFocused();await expect(page.locator('#hud')).toBeHidden();
  await page.click('[data-difficulty="hard"]');await expect(page.locator('[data-difficulty="hard"]')).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Escape');await expect(page.locator('[data-act="0"]')).toBeFocused();await expect(page.locator('#chapter-start')).toHaveCount(0);
  await page.keyboard.press('Enter');await expect(page.locator('[data-difficulty="hard"]')).toHaveAttribute('aria-pressed','true');
  await page.click('[data-difficulty="normal"]');await shot(page,'brief-desktop');
  // Jumping to optional rewards must close the modal and reveal the requested mission.
  await page.click('[data-show-mission]');await expect(page.locator('#modal')).not.toBeVisible();await expect(page.locator('[data-mission="meadow-trial"]')).toBeVisible();
  await expect(page.locator('.mission-act[open]')).toHaveCount(1);
  await page.click('[data-prepare-challenge]');await expect(page.locator('#modal')).toBeVisible();await expect(page.locator('[data-difficulty="hard"]')).toHaveAttribute('aria-pressed','true');
  await page.click('#chapter-start');await expect(page.locator('#story-dialog')).toBeVisible();await page.click('#story-skip');await expect(page.locator('#hud')).toBeVisible();
  if(await page.evaluate(()=>!!window.__LUNARIA_TEST__))assert.deepEqual(await page.evaluate(()=>({act:window.__LUNARIA_TEST__.game.act,mode:window.__LUNARIA_TEST__.game.difficulty})),{act:0,mode:'hard'});
  await page.click('#pause');await expect(page.locator('#modal')).not.toHaveAttribute('aria-labelledby','stage-brief-title');await page.click('#quit');
  pass('Title has one action; locked acts stay locked; selecting an act only opens its briefing; keyboard return, difficulty and actual start work.');
  for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]){
    await page.setViewportSize({width,height});await page.click('[data-menu-tab="adventure"]');await page.locator('#chapter-menu').evaluate(e=>e.scrollTop=0);
    await fits(page,'#chapter-menu');await fits(page,'.journey-acts');
    const tabRows=await page.locator('.menu-tabs button').evaluateAll(nodes=>new Set(nodes.map(e=>Math.round(e.getBoundingClientRect().top))).size);assert.equal(tabRows,1,'Menu tabs must remain one row');
    await page.click('[data-act="0"]');await fits(page,'#modal');await page.locator('#chapter-start').scrollIntoViewIfNeeded();
    await expect(page.locator('#chapter-start')).toBeInViewport();
    const hit=await page.locator('#chapter-start').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});assert.ok(hit,'Start button must be tappable');
    if(width===390)await shot(page,'brief-mobile');await page.keyboard.press('Escape');
    for(const tab of ['growth','talent','missions','equipment','weapons']){await page.click(`[data-menu-tab="${tab}"]`);await fits(page,'#chapter-menu');if(width===1440)await shot(page,`${tab}-desktop`);}
    await page.click('[data-menu-tab="adventure"]');await page.locator('#chapter-menu').evaluate(e=>e.scrollTop=0);
    if(width===390){await shot(page,'stages-mobile');await page.click('#menu-title');await shot(page,'title-mobile');await page.click('#start');}
  }
  pass('All six menu tabs and mission dialog fit 320px, 390px, landscape and desktop; start stays visible and tappable.');
  await page.click('#menu-party-open');await expect(page.locator('.party-blessings')).not.toHaveAttribute('open','');await shot(page,'party-desktop');await page.keyboard.press('Escape');await page.context().close();

  const profile=normalizeProgression({story:{version:2,actClears:Array(12).fill(true)},tutorial:{firstBattleCompleted:true}},HEROES);
  const unlocked=await open(profile);await unlocked.click('#start');
  for(const act of [...ACTS,...EXTRA_ACTS]){
    await unlocked.click(`[data-chapter="${act.chapter}"]`);await unlocked.click(`[data-act="${act.id}"]`);
    await expect(unlocked.locator('#stage-brief-title')).toHaveText(act.title);
    await expect(unlocked.locator('#chapter-story')).toHaveCount(act.extra?0:1);
    await expect(unlocked.locator('[data-difficulty]')).toHaveCount(act.extra?0:2);
    if(act.extra)await expect(unlocked.locator('.brief-reward')).toContainText('×10');
    await unlocked.keyboard.press('Escape');
  }
  await unlocked.click('[data-act="14"]');await shot(unlocked,'extra-desktop');await unlocked.click('#chapter-start');await expect(unlocked.locator('#hud')).toBeVisible();await expect(unlocked.locator('#story-dialog')).not.toBeVisible();
  if(await unlocked.evaluate(()=>!!window.__LUNARIA_TEST__))assert.deepEqual(await unlocked.evaluate(()=>({act:window.__LUNARIA_TEST__.game.act,mode:window.__LUNARIA_TEST__.game.difficulty})),{act:14,mode:'hard'});
  await unlocked.click('#pause');await unlocked.click('#quit');await unlocked.click('#menu-title');await unlocked.reload();await unlocked.waitForSelector('#loading',{state:'detached',timeout:60000});
  const saved=await unlocked.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));assert.deepEqual(saved.story.actClears,Array(12).fill(true));
  pass('All 12 story acts and three EX briefings retain unlock, story replay and fixed EX difficulty; saved clears survive navigation and reload.');
  assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({url,checks,errors},null,2));
}catch(error){console.error({errors});throw error;}finally{await browser.close();}
