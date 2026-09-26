import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/hero-movement-v140';await mkdir(out,{recursive:true});
const errors=[],checks=[];
const profile={story:{version:2,actClears:Array(8).fill(true)},tutorial:{firstBattleCompleted:true},inventory:{weaponTicket:7,limitStone:2,starBud:85}};
for(const engine of [chromium,webkit]){
  const name=engine.name(),browser=await engine.launch(name==='chromium'?{channel:'chrome',headless:true}:{headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    await context.addInitScript(profile=>{
      if(sessionStorage.getItem('hero-balance-audit'))return;
      localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));
      localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));
      localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['omsolo','nyanluna'],lead:'omsolo'}));
      sessionStorage.setItem('hero-balance-audit','1');
    },profile);
    const page=await context.newPage();page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
    await page.goto(process.env.AUDIT_URL??'http://127.0.0.1:4187/lunaneco-adventure/');
    await page.waitForSelector('#loading',{state:'detached',timeout:120000});
    assert.match(await page.locator('.version').innerText(),/1\.41/);
    assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
    await page.locator('#chapter-menu-open').tap();await page.locator('[data-menu-tab="growth"]').tap();
    for(const [id,hp,attack,defense] of [['nyanluna',180,20,8],['tsukineko',210,26,14],['omsolo',250,42,21]]){
      assert.deepEqual(await page.locator(`#growth-${id} .growth-stats dd`).allTextContents(),[hp,attack,defense].map(String));
    }
    assert.match(await page.locator('#growth-nyanluna .hero-trait').innerText(),/必殺ゲージ獲得 \+50%/);
    assert.match(await page.locator('#growth-omsolo .hero-trait').innerText(),/必殺ゲージ獲得 \+20%/);
    assert.match(await page.locator('#growth-omsolo .hero-trait').innerText(),/通常移動速度・回避距離2倍/);
    assert.match(await page.locator('#growth-omsolo .hero-signature').innerText(),/HPを28回復/);
    for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]){
      await page.setViewportSize(size);
      assert.equal(await page.locator('#chapter-menu').evaluate(el=>el.scrollWidth>el.clientWidth),false);
      for(const id of ['nyanluna','tsukineko','omsolo'])assert.equal(await page.locator(`#growth-${id}`).evaluate(el=>el.scrollWidth>el.clientWidth),false);
      if(size.width===390)await page.locator('#growth-omsolo').screenshot({path:`${out}/${name}-growth-omsolo.png`});
    }
    const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
    const before=await saved();await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:120000});
    assert.deepEqual(await saved(),before);assert.equal(before.inventory.weaponTicket,7);assert.equal(before.inventory.starBud,85);
    checks.push(`${name}: production stats, traits, ultimate description, 3 mobile layouts and save retention`);
    await page.setViewportSize({width:390,height:844});
    await page.goto(process.env.LUNARIA_URL??'http://127.0.0.1:5177/');await page.waitForSelector('#loading',{state:'detached',timeout:120000});
    const movement=await page.evaluate(()=>{
      const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;
      const measure=hero=>{
        g.activateHero(hero);Object.assign(g.player,{x:0,z:3,dash:0,dashCooldown:0});
        t.step(.5,{x:1,z:0});const walk=g.player.x;
        Object.assign(g.player,{x:0,z:3});g.dash(1,0);t.step(.25);return {walk,dodge:g.player.x};
      };
      const nyanluna=measure(0),omsolo=measure(2);
      Object.assign(g.player,{x:0,z:3});
      g.player.hp=100;g.player.charge=100;t.step(0);
      return {nyanluna,omsolo};
    });
    assert.ok(Math.abs(movement.omsolo.walk-movement.nyanluna.walk*2)<1e-8);
    assert.ok(Math.abs(movement.omsolo.dodge-movement.nyanluna.dodge*2)<1e-8);
    checks.push(`${name}: Omsolo walking and dodge distance are both exactly doubled (${JSON.stringify(movement)})`);
    assert.match(await page.locator('#hero-name').innerText(),/オムソロ/);
    await page.locator('#ultimate').tap();await page.waitForSelector('#ultimate-cutin:not(.hidden)');
    assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.player.hp),100);
    await page.locator('#ultimate-cutin').tap({position:{x:195,y:420}});
    await page.waitForSelector('#ultimate-cutin.hidden',{state:'attached'});
    const cast=await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;return {hp:g.player.hp,charge:g.player.charge};});
    assert.deepEqual(cast,{hp:128,charge:0});
    await page.locator('#pause').tap();await page.screenshot({path:`${out}/${name}-battle.png`});
    checks.push(`${name}: touch ultimate cut-in, skip then cast once, 28 HP heal and gauge consumption`);
    await context.close();
  }finally{await browser.close();}
}
assert.deepEqual(errors,[]);await writeFile(`${out}/browser-report.json`,JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
