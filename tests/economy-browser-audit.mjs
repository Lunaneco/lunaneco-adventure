import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {normalizeProgression} from '../src/progression.js';
import {HEROES} from '../src/model.js';
const out='audit/economy-v141';await mkdir(out,{recursive:true});
const errors=[],checks=[];
const profile=normalizeProgression({story:{version:2,actClears:Array(8).fill(true)},tutorial:{firstBattleCompleted:true},weapons:{version:2,owned:['luna-staff-r4'],lastDraw:{weaponId:'luna-staff-r4',duplicate:true}},characters:{nyanluna:{level:20,xp:400},tsukineko:{level:5,xp:20}},inventory:{weaponTicket:4,limitStone:3,starBud:500,moonDew:100,wardenCore:20,moonPrism:20,astralCore:6}},HEROES);
for(const engine of [chromium,webkit]){
  const name=engine.name(),browser=await engine.launch(name==='chromium'?{channel:'chrome',headless:true}:{headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    await context.addInitScript(profile=>{
      if(sessionStorage.getItem('economy-audit'))return;
      localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));
      localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));
      localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['omsolo','nyanluna'],lead:'omsolo'}));
      sessionStorage.setItem('economy-audit','1');
    },profile);
    const page=await context.newPage();page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
    const load=async url=>{await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});};
    const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
    await load(process.env.AUDIT_URL??'http://127.0.0.1:4187/lunaneco-adventure/');
    assert.match(await page.locator('.version').innerText(),/1\.41/);assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
    await page.locator('#chapter-menu-open').tap();await page.locator('[data-menu-tab="growth"]').tap();
    assert.deepEqual(await saved(),profile);assert.match(await page.locator('#growth-omsolo .growth-exp').innerText(),/EXP 0 \/ 72/);
    await page.locator('#growth-nyanluna [data-tree-target="limit30"]').tap();
    assert.match(await page.locator('#limit-next-level').innerText(),/20.*20/);
    await page.locator('[data-unlock-node="limit30"]').tap();
    let p=await saved();assert.equal(p.characters.nyanluna.level,20);assert.equal(p.characters.nyanluna.xp,400);assert.equal(p.characters.nyanluna.breaks,1);
    await page.locator('[data-menu-tab="growth"]').tap();assert.match(await page.locator('#growth-nyanluna .growth-exp').innerText(),/EXP 400 \/ 528/);
    await page.locator('#growth-nyanluna').screenshot({path:`${out}/${name}-growth.png`});
    await page.locator('[data-menu-tab="weapons"]').tap();assert.match(await page.locator('.last-weapon-draw').innerText(),/重複 → 星の芽 ×100/);await page.locator('.weapon-odds summary').tap();assert.match(await page.locator('.weapon-odds').innerText(),/50/);
    await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:120000});assert.deepEqual(await saved(),p);
    checks.push(`${name}: production XP requirements, existing save preservation, awakening with banked XP and reload`);
    await load(process.env.LUNARIA_URL??'http://127.0.0.1:5177/');
    const rewards=await page.evaluate(()=>{
      const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;
      let rolls=0;g.materialRng=()=>rolls++%2?1:0;g.lootRng=()=>1;
      for(let i=0;i<24;i++)g.hit(g.spawnEnemy('moss',10,10),999999,0,0);
      g.hit(g.spawnEnemy('boss',10,10),999999,0,0);g.pause();t.step(0);
      return {level:g.progressFor(2).level,xp:g.progressFor(2).xp,materials:g.earnedMaterials,crystals:g.orbs.reduce((sum,o)=>sum+o.value,0)};
    });
    assert.equal(rewards.level,2);assert.equal(rewards.xp,60);assert.equal(rewards.materials.starBud,15);assert.equal(rewards.materials.wardenCore,1);assert.equal(rewards.crystals,24);
    p=await saved();assert.equal(p.inventory.starBud,profile.inventory.starBud+15);assert.equal(p.inventory.weaponTicket,4);assert.deepEqual(p.characters.nyanluna,profile.characters.nyanluna);
    await page.evaluate(()=>window.__LUNARIA_TEST__.home());await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:120000});assert.deepEqual(await saved(),p);
    checks.push(`${name}: hit/miss drops, guaranteed boss core, separate crystal/XP awards and persistent earned inventory`);
    await context.close();
  }finally{await browser.close();}
}
assert.deepEqual(errors,[]);await writeFile(`${out}/browser-report.json`,JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
