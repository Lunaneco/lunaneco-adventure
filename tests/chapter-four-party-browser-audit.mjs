import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.LUNARIA_URL||'http://127.0.0.1:5185/';
const engine=process.env.MOBILE_BROWSER||'chromium';
const out='audit/menu-party-retention',checks=[],errors=[];
await mkdir(out,{recursive:true});
const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const pass=name=>{checks.push(name);console.log('PASS',engine,name);};
try{
  for(const clears of [13,16,17]){
    const preferred=clears<16?{members:['tsukineko','omsolo'],lead:'omsolo'}:{members:['nyanluna','shizuku'],lead:'shizuku'};
    const chapter=clears<16?3:4;
    const context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true});
    await context.addInitScript(({clears,preferred})=>{
      if(sessionStorage.getItem('party-retention-fixture'))return;
      localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array.from({length:20},(_,i)=>i<clears)},characters:Object.fromEntries(['nyanluna','tsukineko','omsolo','mochinyafe','shizuku'].map(id=>[id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}}));
      localStorage.setItem('lunaria-party-v1',JSON.stringify(preferred));
      localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:false,music:false,voice:false}));
      sessionStorage.setItem('party-retention-fixture','1');
    },{clears,preferred});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const ready=()=>page.waitForSelector('#loading',{state:'detached',timeout:90000});
    const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-party-v1')));
    const close=()=>page.locator('#modal [data-close].primary').click();
    const quit=async()=>{await page.locator('#pause').tap();await page.locator('#quit').tap();};
    await page.goto(base);await ready();assert.deepEqual(await saved(),preferred);
    await page.locator('#start').tap();
    assert.equal(await page.locator('[data-chapter="0"]').getAttribute('aria-pressed'),'true');
    assert.deepEqual(await saved(),preferred);
    await page.locator('#menu-party-open').tap();assert.equal(await page.locator('.party-required-note').count(),0);
    assert.equal(await page.locator(`[data-party-lead="${clears<16?2:4}"]`).getAttribute('aria-pressed'),'true');await close();
    await page.locator(`[data-chapter="${chapter}"]`).tap();assert.deepEqual(await saved(),preferred);
    await page.locator(`[data-act="${clears}"]`).tap();
    assert.match(await page.locator('.brief-party-rule').innerText(),clears<16?/にゃんるな必須/:/つきねこ/);
    await page.locator('.brief-close').tap();assert.deepEqual(await saved(),preferred);
    await page.locator('#menu-party-open').tap();assert.equal(await page.locator('.party-required-note').count(),0);await close();
    // Even when reloading while chapter five is selected, opening returns to chapter one.
    await page.reload();await ready();await page.locator('#start').tap();
    assert.equal(await page.locator('[data-chapter="0"]').getAttribute('aria-pressed'),'true');assert.deepEqual(await saved(),preferred);
    pass(`${clears} clears: browsing, cancelling and reopening preserve the saved party and start on chapter one`);

    await page.locator(`[data-chapter="${chapter}"]`).tap();await page.locator(`[data-act="${clears}"]`).tap();
    await page.locator('#chapter-start').tap();await page.locator('#story-skip').tap();
    await page.waitForSelector('#hud:not(.hidden)');
    assert.equal(await page.locator('#hero-name').innerText(),clears<16?'オムソロ':'つきねこ');
    if(clears<16)assert.equal(await page.locator('#partner-name').innerText(),'にゃんるな');
    else assert.equal(await page.locator('#switch-action').isVisible(),false);
    assert.deepEqual(await saved(),preferred);
    await quit();assert.deepEqual(await saved(),preferred);
    await page.locator('[data-chapter="0"]').tap();await page.locator('[data-act="0"]').tap();
    await page.locator('#chapter-start').tap();await page.locator('#story-skip').tap();
    assert.equal(await page.locator('#hero-name').innerText(),clears<16?'オムソロ':'雫');
    assert.equal(await page.locator('#partner-name').innerText(),clears<16?'つきねこ':'にゃんるな');
    await quit();assert.deepEqual(await saved(),preferred);
    pass(`${clears} clears: required members apply only during deployment; earlier chapters use the preferred party and lead`);

    await page.locator(`[data-chapter="${chapter}"]`).tap();await page.locator('#menu-party-open').tap();
    const removed=preferred.members[0];await page.locator(`[data-party-toggle="${removed}"]`).tap();
    await page.locator('[data-party-toggle="mochinyafe"]').tap();await page.locator('[data-party-lead="3"]').tap();
    const edited={members:[preferred.lead,'mochinyafe'],lead:'mochinyafe'};
    assert.deepEqual(await saved(),edited);await close();
    await page.reload();await ready();await page.locator('#start').tap();assert.deepEqual(await saved(),edited);
    assert.equal(await page.locator('[data-chapter="0"]').getAttribute('aria-pressed'),'true');
    pass(`${clears} clears: explicit party edits remain available and survive reopening`);
    await page.screenshot({path:`${out}/${engine}-${clears}-reopened.png`});await context.close();
  }
  assert.deepEqual(errors,[]);
}finally{
  await writeFile(`${out}/${engine}-report.json`,JSON.stringify({base,checks,errors},null,2));await browser.close();
}
