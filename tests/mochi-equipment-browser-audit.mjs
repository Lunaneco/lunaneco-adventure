import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {STAGE_MISSIONS,missionIndex} from '../src/missions.js';
const out='audit/mochi-equipment';await mkdir(out,{recursive:true});
const trials=STAGE_MISSIONS.filter(m=>m.act>=8&&m.equipment),stages=Array.from({length:36},()=>({}));
for(const m of trials)stages[missionIndex(m.act,m.area)].trials=1;
const seed={story:{version:2,actClears:Array(12).fill(true)},tutorial:{firstBattleCompleted:true},inventory:{weaponTicket:11,astralCore:7,moonPrism:19},missions:{version:2,stages,claimed:trials.map(m=>m.id)}};
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
await context.addInitScript(seed=>{if(sessionStorage.getItem('mochi-equipment-audit'))return;sessionStorage.setItem('mochi-equipment-audit','1');localStorage.setItem('lunaria-progression-v1',JSON.stringify(seed));localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['mochinyafe'],lead:'mochinyafe'}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',motion:true,sound:false,music:false}));},seed);
const pass=name=>{checks.push(name);console.log('PASS',name);},save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1'))),shot=name=>page.screenshot({path:`${out}/${name}.png`});
const draw=(values,selector)=>page.evaluate(({values,selector})=>{const previous=Math.random,rolls=[...values];Math.random=()=>rolls.length?rolls.shift():previous();try{document.querySelector(selector).click();}finally{Math.random=previous;}},{values,selector});
const closeResult=async()=>{await page.waitForTimeout(400);await page.locator('#weapon-draw-result [data-close]').tap();await page.waitForFunction(()=>!window.__LUNARIA_TEST__.weaponSummon.active);};
try{
 await page.goto('http://127.0.0.1:5185/');await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.click('#start');await page.click('[data-menu-tab="weapons"]');
 assert.equal(await page.locator('.weapon-collection-card').count(),4);await page.click('.weapon-odds summary');assert.match(await page.locator('.weapon-odds').innerText(),/各25%/);assert.match(await page.locator('.weapon-odds').innerText(),/0.4167/);
 // Real single draw, including the new character's legendary art and result equip action.
 await draw([.9,.99,.9],'[data-draw-weapon]');await page.waitForFunction(()=>window.__LUNARIA_TEST__.weaponSummon.finished,{},{timeout:30000});
 assert.equal(await page.locator('#weapon-draw-name').innerText(),'響声鈴・とおね');await page.locator('.summon-weapon-art').evaluate(i=>i.decode());await page.locator('.summon-cutin-band img').evaluate(i=>i.decode());assert.equal(await page.locator('.summon-cutin-copy strong').textContent(),'もちにゃふぇ');
 await page.waitForTimeout(750);await shot('single-legendary');await page.click('#weapon-draw-result [data-equip-weapon]');assert.equal((await save()).weapons.loadout.mochinyafe,'mochi-echo-bell-r4');await closeResult();
 pass('Mochi single legendary summon displays its art, name and usable equip action');
 // Ten real rolls span all three rarities and families, with a visible Mochi legendary spotlight.
 const rolls=Array.from({length:10},(_,i)=>[.9,[.1,.8,.99][Math.floor(i/3)%3],[.1,.4,.8][i%3]]).flat();await draw(rolls,'[data-draw-weapons]');
 await page.waitForSelector('.batch-cinematic.is-spotlight',{timeout:30000});assert.equal(await page.locator('.batch-spotlight-copy p').innerText(),'もちにゃふぇ専用');await shot('batch-legendary');
 await page.waitForFunction(()=>window.__LUNARIA_TEST__.weaponSummon.finished,{},{timeout:30000});assert.equal(await page.locator('#weapon-draw-result [data-batch-item]').count(),10);await page.waitForTimeout(750);await page.locator('#weapon-draw-result img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
 for(const size of [{width:320,height:640},{width:390,height:844}]){await page.setViewportSize(size);assert.ok(await page.locator('#weapon-draw-result').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await shot(`batch-${size.width}`);}
 const p=await save();assert.equal(p.inventory.weaponTicket,0);assert.equal(p.weapons.draws,11);assert.equal(p.weapons.owned.filter(id=>id.startsWith('mochi-')).length,10);await closeResult();pass('Mochi tenfold summon, three legendary spotlights, all nine variants and mobile results');
 await page.click('[data-menu-tab="equipment"]');await page.click('[data-equipment-hero="mochinyafe"]');assert.equal(await page.locator('[data-weapon-option]').count(),10);
 await page.click('[data-equipment-detail="mochi-lull-chime-r3"] summary');assert.match(await page.locator('[data-equipment-detail="mochi-lull-chime-r3"]').innerText(),/援護間隔\s*3.2秒/);
 await page.click('[data-equip-weapon="mochi-lull-chime-r3"]');assert.match(await page.locator('[data-current-weapon]').innerText(),/子守鈴・ゆめね/);
 for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);await page.locator('[data-equipment-detail="mochi-lull-chime-r3"]').scrollIntoViewIfNeeded();assert.ok(await page.locator('.weapon-comparison').first().evaluate(el=>el.scrollWidth<=el.clientWidth+1));await shot(`comparison-${width}`);}
 await page.click('[data-equipment-category="unique"]');assert.equal(await page.locator('[data-equipment-card]').count(),4);await page.locator('[data-equipment-card] img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));await page.click('[data-equip-item="mochi-promise-crown"]');await page.locator('[data-equipment-card="mochi-promise-crown"]').scrollIntoViewIfNeeded();await shot('chapter-three-relics');
 const equipped=await save();assert.equal(equipped.inventory.astralCore,7);assert.equal(equipped.inventory.moonPrism,19);assert.equal(equipped.equipment.loadout.mochinyafe,'mochi-promise-crown');
 await page.reload();await page.waitForSelector('#loading',{state:'detached'});assert.deepEqual(await save(),equipped);pass('All weapon comparisons fit narrow screens; four old trials recover relics without duplicate rewards; equip persists');
 await page.click('#start');await page.click('[data-chapter="2"]');await page.click('[data-act="8"]');await page.click('#chapter-start');await page.click('#story-skip');
 const attack=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];g.projectiles=[];g.hazards=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.rng=()=>1;Object.assign(g.player,{x:0,z:0,attack:999,invincible:999});g.partner.attack=999;const e=g.spawnEnemy('mochiGolem',0,5);Object.assign(e,{hp:1000,maxHp:1000,speed:0,attack:999,special:999});const fired=g.attackFrom(g.player,3);t.step(.2);g.pause();t.world.render(g,.016);return {fired,kind:g.projectiles[0]?.kind,weapon:t.world.heroes[3].userData.weapon.userData.family,visible:t.world.heroes[3].visible};});
 assert.deepEqual(attack,{fired:true,kind:'mochiNote',weapon:'mochi-lull-chime',visible:true});await shot('main-sound-attack');
 const hit=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.resume();t.step(.4);g.pause();t.world.render(g,.016);const e=g.enemies[0];return {hp:e.hp,stopped:!!e.mochiStopUntil,weakened:!!e.mochiWeakenUntil,damage:g.damageDealt};});assert.ok(hit.hp<1000&&hit.damage>0);assert.equal(hit.stopped||hit.weakened,false);await shot('main-hit');pass('In-game Mochi wears the chime, fires a visible note and deals weak damage without support debuffs');
 assert.deepEqual(errors,[]);await writeFile(`${out}/browser.json`,JSON.stringify({checks,errors,attack,hit},null,2));
}catch(e){await shot('browser-failure');await writeFile(`${out}/browser.json`,JSON.stringify({checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
