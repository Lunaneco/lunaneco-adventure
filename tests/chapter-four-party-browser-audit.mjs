import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.LUNARIA_URL||'http://127.0.0.1:5185/';
const hosted=new URL(base).hostname.endsWith('.github.io'),out='audit/chapter-four/party-v163',checks=[],errors=[];
await mkdir(out,{recursive:true});
const pass=name=>{checks.push(name);console.log('PASS',name);};
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
  await context.addInitScript(()=>{
    if(sessionStorage.getItem('party-v163-fixture'))return;
    localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array.from({length:16},(_,i)=>i<13)},characters:Object.fromEntries(['nyanluna','tsukineko','omsolo','mochinyafe'].map(id=>[id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}}));
    localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['tsukineko','omsolo'],lead:'omsolo'}));
    localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false,voice:false}));
    sessionStorage.setItem('party-v163-fixture','1');
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const ready=()=>page.waitForSelector('#loading',{state:'detached',timeout:90000});
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-party-v1')));
  const closeParty=()=>page.locator('#modal [data-close].primary').click();
  const quit=async()=>{await page.click('#pause');await page.click('#quit');};
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await ready();assert.equal(await page.locator('.version').innerText(),'Ver. 1.63.0');
  if(hosted)assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
  await page.click('#start');assert.deepEqual(await saved(),{members:['omsolo','nyanluna'],lead:'omsolo'});
  await page.click('#menu-party-open');assert.match(await page.locator('.party-required-note').innerText(),/第4章・第2幕/);assert.equal(await page.locator('[data-party-toggle="nyanluna"]').isDisabled(),true);
  await page.locator('[data-party-toggle="nyanluna"]').evaluate(b=>{b.disabled=false;b.click();});
  assert.equal(await page.locator('[data-party-toggle="nyanluna"]').isDisabled(),true);assert.deepEqual((await saved()).members,['omsolo','nyanluna']);
  pass('Uncleared act restores Nyanluna while retaining the saved lead; removal is guarded beyond the disabled button');
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});await page.locator('#modal').evaluate(el=>el.scrollTop=0);
    assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    await page.screenshot({path:`${out}/${hosted?'hosted':'local'}-party-${width}.png`});
  }
  await page.click('[data-party-toggle="omsolo"]');await page.click('[data-party-toggle="mochinyafe"]');await page.click('[data-party-lead="3"]');await closeParty();
  await page.click('[data-act="13"]');assert.match(await page.locator('.brief-party-rule').innerText(),/にゃんるな必須/);
  await page.screenshot({path:`${out}/${hosted?'hosted':'local'}-brief.png`});
  await page.click('[data-difficulty="hard"]');assert.equal(await page.locator('.brief-party-rule').count(),1);
  await page.click('#chapter-start');await page.click('#story-skip');assert.equal(await page.locator('#hero-name').innerText(),'もちにゃふぇ');assert.equal(await page.locator('#partner-name').innerText(),'にゃんるな');
  if(!hosted)assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.game.party),['nyanluna','mochinyafe']);
  pass('Partner can change and lead; the actual challenge battle includes Nyanluna in support');
  await quit();await page.click('#menu-party-open');assert.equal(await page.locator('[data-party-toggle="nyanluna"]').isDisabled(),true);await closeParty();
  await page.click('[data-act="12"]');assert.equal(await page.locator('.brief-party-rule').count(),0);await page.click('.brief-back');await page.click('#menu-party-open');
  assert.equal(await page.locator('.party-required-note').count(),0);assert.equal(await page.locator('[data-party-toggle="nyanluna"]').isDisabled(),false);
  await page.click('[data-party-toggle="nyanluna"]');await closeParty();assert.deepEqual(await saved(),{members:['mochinyafe'],lead:'mochinyafe'});
  await page.click('[data-act="12"]');await page.click('#chapter-start');await page.click('#story-skip');assert.equal(await page.locator('#hero-name').innerText(),'もちにゃふぇ');assert.equal(await page.locator('#switch-action').isVisible(),false);assert.match(await page.locator('.partner-label').innerText(),/単独出撃/);
  if(!hosted)assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.game.party),['mochinyafe']);
  pass('Quitting keeps the requirement; selecting a cleared act releases it and allows an actual solo replay');
  await quit();await page.reload({waitUntil:'domcontentloaded',timeout:60000});await ready();await page.click('#start');
  assert.deepEqual(await saved(),{members:['mochinyafe','nyanluna'],lead:'mochinyafe'});
  await page.click('#menu-party-open');assert.equal(await page.locator('[data-party-toggle="nyanluna"]').isDisabled(),true);await closeParty();
  await page.click('[data-chapter="2"]');await page.click('#menu-party-open');assert.equal(await page.locator('.party-required-note').count(),0);assert.equal(await page.locator('[data-party-toggle="nyanluna"]').isDisabled(),false);
  pass('Reload repairs the next uncleared act and earlier chapters remain freely editable; mobile layouts fit');
  assert.deepEqual(errors,[]);
}catch(e){errors.push(e.stack);throw e;}finally{
  await writeFile(`${out}/${hosted?'hosted':'local'}-browser-report.json`,JSON.stringify({base,checks,errors},null,2));await browser.close();
}
