import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/party';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[],pass=name=>{checks.push({name});console.log('PASS',name);};
const sizes=[{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:1440,height:900}];
async function open(url='http://127.0.0.1:5174/'){
  const context=await browser.newContext({viewport:sizes[0],isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{localStorage.setItem('lunaria-record-v1',JSON.stringify({...JSON.parse(localStorage.getItem('lunaria-record-v1')||'{}'),chapterOneCleared:true}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,music:false,quality:'low',motion:false}));});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:60000});return {context,page};
}
const closeParty=async page=>{await page.locator('#modal [data-close].primary').tap();};
const openParty=async page=>{await page.locator('[data-open="party"]:visible').tap();};
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-party-v1')));
try{
  const {context,page}=await open();await openParty(page);
  assert.equal(await page.locator('[data-party-toggle]').count(),2);assert.equal(await page.locator('[data-party-blessing]').count(),12);
  await page.locator('[data-party-toggle="tsukineko"]').tap();assert.equal(await page.locator('[data-party-blessing]').count(),7);assert.equal(await page.locator('[data-party-blessing="echo"]').count(),0);assert.equal(await page.locator('[data-party-blessing="orbit"]').count(),1);assert.equal(await page.locator('[data-party-toggle="nyanluna"]').isDisabled(),true);
  await page.screenshot({path:`${out}/nyanluna-party.png`});
  await page.locator('[data-party-toggle="tsukineko"]').tap();await page.locator('[data-party-toggle="nyanluna"]').tap();
  assert.equal(await page.locator('[data-party-blessing]').count(),7);assert.equal(await page.locator('[data-party-blessing="crit"]').count(),1);assert.equal(await page.locator('[data-party-blessing="orbit"]').count(),0);
  assert.deepEqual(await saved(page),{members:['tsukineko'],lead:'tsukineko'});await closeParty(page);await page.reload();await page.waitForSelector('#loading',{state:'detached'});
  assert.equal(await page.locator('.hero-card[data-hero="0"]').isDisabled(),true);assert.equal(await page.locator('.hero-card[data-hero="1"]').getAttribute('aria-pressed'),'true');assert.match(await page.locator('[data-party-summary]').innerText(),/1\/2体/);
  pass('Both solo compositions have distinct seven-blessing previews; zero-member parties are prevented and selection survives reload');
  for(const size of sizes){
    await page.setViewportSize(size);await page.locator('#start').scrollIntoViewIfNeeded();
    for(const selector of ['#start','#home [data-open="party"]']){const box=await page.locator(selector).boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=size.width&&box.y+box.height<=size.height,`${selector} ${JSON.stringify(size)} ${JSON.stringify(box)}`);assert.ok(box.height>=44);}
    await page.screenshot({path:`${out}/home-${size.width}.png`});await openParty(page);
    assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    for(const button of await page.locator('[data-party-toggle]').all()){await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();assert.ok(box.width>=44&&box.height>=44&&box.x>=0&&box.x+box.width<=size.width);}
    await page.locator('#modal').evaluate(el=>el.scrollTop=0);await page.screenshot({path:`${out}/party-${size.width}.png`});await closeParty(page);
  }
  pass('Home, party controls and previews fit four phone and desktop layouts with 44px touch targets');
  await page.setViewportSize(sizes[0]);await page.locator('#start').tap();await page.locator('#chapter-start').tap();await page.locator('#story-skip').tap();await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.state.party),['tsukineko']);assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.world.heroes.map(h=>h.visible)),[false,true]);
  assert.equal(await page.locator('#switch-action').isVisible(),false);assert.equal(await page.locator('#switch').isDisabled(),true);assert.match(await page.locator('.partner-label').innerText(),/単独出撃/);
  await page.keyboard.press('q');assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.state.player.hero),1);
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.enemies=[];g.spawnEnemy('moss',0,5);t.step(2);});
  let profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));assert.equal(profile.characters.nyanluna.xp,0);assert.ok(profile.characters.tsukineko.xp>0);
  await page.screenshot({path:`${out}/solo-combat.png`});pass('Solo combat renders one hero, blocks all switching and awards actual kill XP only to that hero');
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.addCrystals(8);t.step(.02);});
  const pool=await page.evaluate(()=>window.__LUNARIA_TEST__.state.skillPool),offers=await page.locator('[data-skill]').evaluateAll(els=>els.map(el=>el.dataset.skill));
  assert.equal(offers.length,3);assert.ok(offers.every(id=>pool.includes(id)));assert.equal(await page.locator('.blessing-party b').innerText(),'1体編成');
  for(const size of sizes){await page.setViewportSize(size);await page.locator('#modal').evaluate(el=>el.scrollTop=0);assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth),false);for(const button of await page.locator('[data-skill]').all()){const box=await button.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=size.width&&box.y>=0&&box.y+box.height<=size.height,`All three choices visible: ${JSON.stringify(size)} ${JSON.stringify(box)}`);}await page.screenshot({path:`${out}/choices-${size.width}.png`});}
  await page.setViewportSize(sizes[0]);await page.locator('[data-skill]').first().tap();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')).characters),profile.characters);
  pass('Crystal choices show the deployed party and blessing sources; all three cards fit four layouts without changing permanent XP');
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.wave=2;g.area=0;g.exitOpen=true;g.exitDelay=0;g.player.x=0;g.player.z=-16.6;t.step(.02);});
  await page.locator('#story-skip').tap();assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.state.party),['tsukineko']);assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.state.skills),{});
  await page.locator('#pause').tap();await page.locator('#quit').tap();await openParty(page);await page.locator('[data-party-toggle="nyanluna"]').tap();assert.equal(await page.locator('[data-party-blessing]').count(),12);assert.equal(await page.locator('[data-party-blessing="power"]').count(),1);
  await page.locator('[data-party-lead="0"]').tap();await closeParty(page);await page.locator('#chapter-start').tap();await page.locator('#story-skip').tap();await page.waitForTimeout(150);
  assert.equal(await page.locator('#switch-action').isVisible(),true);assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.world.heroes.map(h=>h.visible)),[true,true]);const pairPool=await page.evaluate(()=>window.__LUNARIA_TEST__.state.skillPool);
  await page.locator('#switch-action').tap();assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.state.player.hero),1);assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.state.skillPool),pairPool);
  pass('Stage changes retain the solo party; menu reformation restores the duo, support model and lead switching without changing its pool');
  await context.close();
  const production=await open('http://127.0.0.1:4173/'),p=production.page;assert.equal(await p.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');await openParty(p);await p.locator('[data-party-toggle="tsukineko"]').tap();await closeParty(p);await p.reload();await p.waitForSelector('#loading',{state:'detached'});
  assert.deepEqual(await saved(p),{members:['nyanluna'],lead:'nyanluna'});await p.locator('#start').tap();await p.locator('#chapter-start').tap();await p.locator('#story-skip').tap();assert.equal(await p.locator('#switch-action').isVisible(),false);assert.equal(await p.locator('#hero-name').innerText(),'にゃんるな');await p.screenshot({path:`${out}/production-solo.png`});await production.context.close();
  pass('Production saves and restores the solo party and starts the matching hero without a development bridge');
  assert.deepEqual(errors,[]);pass('No JavaScript, shader or resource errors');
  await writeFile(`${out}/report.json`,JSON.stringify({checks,errors,date:new Date().toISOString()},null,2));
}finally{await browser.close();}
