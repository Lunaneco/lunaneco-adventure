import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {maxedHeheProfile} from './chapter-six-extra-fixtures.js';
const url=process.env.LUNARIA_URL??'http://localhost:5187/',out='audit/chapter-six-extra';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'}),errors=[],checks=[];
await context.addInitScript(profile=>{
 const override=localStorage.getItem('hehe-extra-full-audit');if(override)profile=JSON.parse(override);
 if(sessionStorage.getItem('hehe-extra-audit'))return;
 localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));
 localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['nyanluna','tsukineko'],lead:'nyanluna'}));
 localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:false,sound:true,music:false,voice:false}));sessionStorage.setItem('hehe-extra-audit','1');
},maxedHeheProfile(27));
let page=await context.newPage();const monitor=()=>{page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});};monitor();
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
try{
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});await page.locator('#start').click();await page.locator('[data-chapter="5"]').click();assert.ok(await page.locator('[data-act="33"]').isDisabled());assert.match(await page.locator('[data-act="33"]').innerText(),/第6章クリアで解放/);pass('EX locked until chapter-six final clear');
 await page.evaluate(p=>localStorage.setItem('hehe-extra-full-audit',JSON.stringify(p)),maxedHeheProfile());await page.close();page=await context.newPage();monitor();await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});await page.locator('#start').click();await page.locator('[data-chapter="5"]').click();await page.locator('[data-act="33"]').scrollIntoViewIfNeeded();assert.ok(await page.locator('[data-act="33"]').isEnabled());await page.screenshot({path:`${out}/menu-mobile.png`});
 await page.locator('[data-act="33"]').click();const brief=await page.locator('.stage-briefing').innerText();for(const text of ['Lv.80','フルカンスト','NPCなし','WAVE 3','1体確定'])assert.ok(brief.includes(text),text);assert.equal(await page.locator('[data-difficulty]').count(),0);await page.screenshot({path:`${out}/briefing-mobile.png`});pass('Phone briefing shows free party, Lv.80 fixed challenge and WAVE 3 guaranteed rare');
 await page.locator('#chapter-start').click();await page.waitForFunction(()=>window.__LUNARIA_TEST__.game?.act===33&&window.__LUNARIA_TEST__.game.phase==='playing');
 const audioChecks=await page.evaluate(()=>{
  const t=window.__LUNARIA_TEST__,g=t.game,a=t.audio;g.enemies=[];g.projectiles=[];g.hazards=[];g.orbs=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.player.x=g.player.z=0;
  const e=g.spawnEnemy('heheBrawler',0,-4);e.hp=1e7;e.speed=0;e.special=e.attack=999;g.drainEvents();a.tone=(...args)=>a.auditTones.push(args);a.auditTones=[];
  g.attackFrom(g.player,0);g.hit(e,1,0,0,false,false,'nyanluna');t.step(0);const normal=a.auditTones.length;
  g.awakenNyan();t.step(0);a.auditTones=[];g.attackFrom(g.player,0);g.hit(e,1,0,0,false,false,'nyanluna');t.step(0);const awakened=a.auditTones.length;
  a.auditTones=[];g.attackFrom(g.partner,1);t.step(0);const gun=a.auditTones.length;
  return {normal,awakened,gun,party:g.party,guest:g.guestHeroId,terrain:g.layout.id};
 });assert.equal(audioChecks.normal,0);assert.equal(audioChecks.awakened,0);assert.equal(audioChecks.gun,2);assert.deepEqual(audioChecks.party,['nyanluna','tsukineko']);assert.equal(audioChecks.guest,null);assert.match(audioChecks.terrain,/extra-hehe/);pass('Real normal/awakened attack handlers omit Nyan thumps and preserve Tsukineko gun sound',audioChecks);
 const rare=await page.evaluate(()=>{
  const t=window.__LUNARIA_TEST__,g=t.game;g.wave=2;g.phase='playing';g.startWave();g.player.attack=g.partner.attack=999;g.player.invincible=999;for(let i=0;i<3;i++)g.spawn();t.step(0);g.phase='paused';
  return {wave:g.wave,scheduled:g.goldenHeheWave,count:g.enemies.filter(e=>e.type==='goldenHehe').length,guest:g.guestHeroId,terrain:g.layout.id};
 });assert.equal(rare.wave,3);assert.equal(rare.scheduled,3);assert.equal(rare.count,1);assert.equal(rare.guest,null);await page.waitForFunction(()=>!document.querySelector('#rare-encounter').classList.contains('hidden'));assert.match(await page.locator('#rare-encounter').innerText(),/黄金のへへへ/);await page.screenshot({path:`${out}/wave-three-mobile.png`});pass('Actual WAVE 3 spawns one golden Hehe with its visible HUD',rare);
 for(const [width,height]of [[320,568],[844,390]]){await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);await page.screenshot({path:`${out}/wave-three-${width}.png`});}pass('Narrow phone and landscape HUD fit the screen');
 const clear=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.phase='playing';g.wave=6;g.area=2;g.enemies=[];g.projectiles=[];g.hazards=[];g.pendingBlessings=0;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);g.crossExit();t.step(0);return {reward:g.clearRewardTickets,clears:g.progression.story.extraClears};});assert.equal(clear.reward,10);assert.equal(clear.clears[5],true);await page.waitForSelector('.chapter-reward');const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')).story.extraClears[5]);assert.equal(saved,true);pass('Final gate saves the independent chapter-six EX clear and first reward',clear);
 assert.deepEqual(errors,[]);await writeFile(`${out}/browser-report.json`,JSON.stringify({url,checks,errors},null,2));
}catch(e){await writeFile(`${out}/browser-report.json`,JSON.stringify({url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
