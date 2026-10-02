import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.LUNARIA_URL??'http://localhost:5187/',out='audit/chapter-six';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
await page.addInitScript(()=>{
 localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(28).fill(true)},characters:{omsolo:{level:80,breaks:6},hehereal:{level:60,breaks:4}},tutorial:{firstBattleCompleted:true}}));
 localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['omsolo','hehereal'],lead:'omsolo'}));
 localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,voice:false,music:false,motion:false}));
});
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#loading',{state:'detached',timeout:90000});
 await page.locator('#start').click();await page.locator('[data-chapter="5"]').click();await page.locator('[data-act="25"]').click();await page.locator('#chapter-start').click();await page.locator('#story-skip').click();
 const before=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];g.projectiles=[];g.hazards=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;t.step(0);return {own:g.statsFor(6),om:g.statsFor(2).attack,health:structuredClone(g.heroHealth),party:localStorage.getItem('lunaria-party-v1')};});
 await page.locator('#predation').click();
 const captured=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;return {stats:g.statsFor(6),base:g.predation.baseAttack,bonus:g.predation.attackBonus,health:structuredClone(g.heroHealth),hits:g.runHits,party:g.party,form:t.world.heheForm.visible};});
 assert.deepEqual(captured.stats,before.own);assert.equal(captured.base,before.own.attack);assert.equal(captured.bonus,0);assert.deepEqual(captured.health,before.health);assert.equal(captured.hits,0);assert.deepEqual(captured.party,['hehereal']);assert.equal(captured.form,true);
 assert.equal(await page.locator('#hero-name').innerText(),'へへへ');assert.match(await page.locator('#toast').innerText(),/攻撃力はそのまま/);assert.match(await page.locator('.partner-label').innerText(),/攻撃 \+0$/);assert.equal(await page.locator('#predation').isEnabled(),false);pass('Capture keeps Hehereal attack unchanged and shows no Omsolo attack bonus',{own:before.own.attack,om:before.om,after:captured.stats.attack});
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.player.attack=999;g.projectiles=[];g.player.charge=100;for(const x of [-1,1]){const e=g.spawnEnemy('moss',g.player.x+x,g.player.z+2);e.hp=1;e.speed=0;e.special=e.attack=999;}t.step(0);});
 await page.locator('#ultimate').click();await page.waitForSelector('#ultimate-cutin[data-hero="hehehe"]:not(.hidden)');await page.locator('#cutin-skip').click();await page.waitForFunction(()=>window.__LUNARIA_TEST__.state.predation.danceKills===2);
 const dance=await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;return {attack:g.statsFor(6).attack,base:g.predation.baseAttack,bonus:g.predation.attackBonus,kills:g.predation.danceKills,hits:g.runHits};});
 assert.equal(dance.base,before.own.attack);assert.ok(Math.abs(dance.bonus-before.own.attack*.2)<1e-7);assert.ok(Math.abs(dance.attack-before.own.attack*1.2)<1e-7);assert.equal(dance.hits,0);assert.match(await page.locator('.partner-label').innerText(),/捕食の舞 2体/);assert.equal(await page.evaluate(()=>localStorage.getItem('lunaria-party-v1')),before.party);pass('Predation Dance retains +10% of Hehereal own attack per kill',dance);
 await page.locator('#pause').click();await page.screenshot({path:`${out}/predation-own-attack.png`});
 assert.deepEqual(errors,[]);await writeFile(`${out}/predation-own-attack-browser-report.json`,JSON.stringify({url,checks,errors},null,2));
}catch(e){const state=await page.evaluate(()=>window.__LUNARIA_TEST__?.state).catch(()=>null);await writeFile(`${out}/predation-own-attack-browser-report.json`,JSON.stringify({url,checks,errors,state,failure:e.stack},null,2));throw e;}finally{await browser.close();}
