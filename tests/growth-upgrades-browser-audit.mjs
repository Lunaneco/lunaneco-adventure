import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {normalizeProgression} from '../src/progression.js';
import {HEROES} from '../src/model.js';
import {TALENT_NODES} from '../src/talents.js';
import {SKILLS} from '../src/blessings.js';
const out='audit/growth-v152',name=process.env.GROWTH_BROWSER??'chromium';await mkdir(out,{recursive:true});
const browser=await(name==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true})),errors=[],checks=[];
const seed=normalizeProgression({story:{version:2,actClears:Array(12).fill(true)},tutorial:{firstBattleCompleted:true},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:35,breaks:2,tree:TALENT_NODES.map(n=>n.id)}])),inventory:{starBud:2000,moonDew:100,wardenCore:100,moonPrism:100,astralCore:100}},HEROES);
const pass=s=>{checks.push(s);console.log('PASS',s);},saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
let page;
async function open(url,profile){
 const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await c.addInitScript(profile=>{if(!sessionStorage.getItem('growth-audit')){sessionStorage.setItem('growth-audit','1');localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['nyanluna','tsukineko'],lead:'nyanluna'}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));}},profile);
 const p=await c.newPage();page=p;p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});await p.goto(url);await p.waitForSelector('#loading',{state:'detached',timeout:60000});return p;
}
try{
 const p=await open('http://127.0.0.1:4185/',seed);assert.equal(await p.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');assert.match(await p.locator('.version').innerText(),/1\.52\.0/);await p.click('#start');await p.click('[data-menu-tab="talent"]');await p.click('[data-tree-tier="3"]');
 for(const hero of HEROES){
  await p.locator(`[data-tree-hero="${hero.id}"]`).tap();const skills=SKILLS.filter(s=>s.requires?.[0]===hero.id&&s.upgrades);assert.equal(await p.locator('.blessing-options .skill-upgrade-label').count(),3);
  for(const [i,skill] of skills.entries()){await p.locator(`[data-tree-node="${skill.unlockNode}"]`).tap();assert.match(await p.locator('#talent-detail').innerText(),/上位版/);await p.locator(`[data-blessing-slot="${i}"]`).tap();await p.locator(`[data-equip-blessing="${skill.id}"]`).tap();}
  assert.deepEqual((await saved(p)).blessingLoadouts[hero.id],skills.map(s=>s.id));
 }
 let profile=await saved(p);assert.deepEqual(profile.inventory,seed.inventory);assert.deepEqual(profile.characters,seed.characters);
 for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]){
  await p.setViewportSize({width,height});await p.locator('#blessing-loadout').scrollIntoViewIfNeeded();
  const overflow=await p.locator('#blessing-loadout button').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.x< -1||r.right>innerWidth+1||e.scrollWidth>e.clientWidth+1||r.height<44);}).map(e=>e.innerText));assert.deepEqual(overflow,[]);
  if(width===390||width===320)await p.locator('#blessing-loadout').screenshot({path:`${out}/${name}-loadout-${width}.png`});
 }
 pass('Production: all 12 upper skills show their originals, equip for free and fit 320/390/844/1440 layouts');
 await p.reload();await p.waitForSelector('#loading',{state:'detached'});assert.deepEqual(await saved(p),profile);await p.click('#start');await p.click('[data-menu-tab="growth"]');assert.match(await p.locator('.growth-intro').innerText(),/100%.*50%/);assert.match(await p.locator('.growth-intro').innerText(),/0\.5/);await p.context().close();pass('Production: selected skills persist and growth explains the exact XP split');
 const b=await open('http://127.0.0.1:5185/',profile);
 await b.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.phase='upgrade';g.pendingBlessings=1;g.offers=['arcanePower','starlightHeal','moonFrost'].map(id=>g.skillPool.find(s=>s.id===id));g.emit('upgrade');t.step(0);});
 for(const [width,height] of [[320,568],[390,844],[844,390]]){await b.setViewportSize({width,height});assert.equal(await b.locator('.skill-card .skill-upgrade-label').count(),3);const overflow=await b.locator('.skill-card').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.innerText));assert.deepEqual(overflow,[]);if(width<760)assert.ok((await b.locator('.skill-card .skill-upgrade-label').first().boundingBox()).width>140);await b.screenshot({path:`${out}/${name}-choices-${width}.png`});}
 await b.setViewportSize({width:390,height:844});await b.locator('[data-skill="starlightHeal"]').tap();
 const orbit=await b.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.pause();t.world.render(g,.016);return {skills:g.skills,stars:t.world.orbit.filter(s=>s.visible).length};});assert.deepEqual(orbit.skills,{starlightHeal:1});assert.equal(orbit.stars,1);await b.screenshot({path:`${out}/${name}-inherited-orbit.png`});pass('Actual 3-choice UI shows upper skills; selecting the healing upgrade creates its inherited 3D orbit star');
 const kills=await b.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.skills={};g.enemies=[];g.projectiles=[];g.orbs=[];g.rng=()=>1;
  Object.assign(g.player,{x:0,z:0,attack:999});Object.assign(g.partner,{x:0,z:0,attack:999});g.resume();let e=g.spawnEnemy('moss',0,3);e.hp=1;e.speed=0;g.attackFrom(g.player,0);t.step(.5);g.pause();const first={...g.earnedXp};
  g.enemies=[];g.projectiles=[];g.orbs=[];Object.assign(g.partner,{x:0,z:0});g.resume();e=g.spawnEnemy('moss',0,3);e.hp=1;e.speed=0;g.attackFrom(g.partner,1,true);g.player.switchCooldown=0;g.switchHero();g.player.attack=g.partner.attack=999;t.step(.4);g.pause();t.world.render(g,.016);return {first,second:g.earnedXp};});
 assert.deepEqual(kills.first,{nyanluna:3,tsukineko:1.5,omsolo:0,mochinyafe:0});assert.deepEqual(kills.second,{nyanluna:4.5,tsukineko:4.5,omsolo:0,mochinyafe:0});profile=await saved(b);assert.equal(profile.characters.nyanluna.xp,4.5);assert.equal(profile.characters.tsukineko.xp,4.5);assert.match(await b.locator('#hero-exp').innerText(),/4\.5/);await b.screenshot({path:`${out}/${name}-shared-xp.png`});
 await b.evaluate(()=>window.__LUNARIA_TEST__.game.resume());await b.click('#pause');await b.click('#quit');await b.reload();await b.waitForSelector('#loading',{state:'detached'});assert.deepEqual(await saved(b),profile);pass('Actual main/support projectile kills grant 100%/50%, retain ownership after switching, and preserve fractional XP after retreat/reload');
 assert.deepEqual(errors,[]);await writeFile(`${out}/${name}-browser.json`,JSON.stringify({checks,errors},null,2));
}catch(e){if(page&&!page.isClosed())await page.screenshot({path:`${out}/${name}-failure.png`});await writeFile(`${out}/${name}-browser.json`,JSON.stringify({checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
