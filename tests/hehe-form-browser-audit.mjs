import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/chapter-six',url=process.env.LUNARIA_URL??'http://localhost:5187/';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
const page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
await page.addInitScript(()=>{
 localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(28).fill(true)},characters:Object.fromEntries(['nyanluna','tsukineko','omsolo','mochinyafe','shizuku','prim','hehereal'].map(id=>[id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}}));
 localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['omsolo','hehereal'],lead:'omsolo'}));
 localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:true,music:false,voice:true,motion:false}));
});
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
try{
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.player.invincible=0;t.step(0);});
 assert.equal(await page.locator('#predation').isVisible(),true);assert.equal(await page.locator('#predation').isEnabled(),true);
 const before=await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;return {health:structuredClone(g.heroHealth),hits:g.runHits,stageHits:g.stageTrial.hits,attack:g.statsFor(6).attack,weapon:g.attackProfile(6),party:localStorage.getItem('lunaria-party-v1')};});
 await page.locator('#predation').click();await page.waitForFunction(()=>window.__LUNARIA_TEST__.state.predation.active);
 const after=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;return {health:structuredClone(g.heroHealth),hits:g.runHits,stageHits:g.stageTrial.hits,attack:g.statsFor(6).attack,weapon:g.attackProfile(6),party:g.party,hero:g.player.hero,omVisible:t.world.heroes[2].visible,femaleVisible:t.world.heroes[6].visible,formVisible:t.world.heheForm.visible,voice:t.voice.current?.id};});
 assert.deepEqual(after.health,before.health);assert.equal(after.hits,before.hits);assert.equal(after.stageHits,before.stageHits);assert.equal(after.attack,before.attack);assert.deepEqual(after.weapon,before.weapon);assert.deepEqual(after.party,['hehereal']);assert.equal(after.hero,6);assert.equal(after.omVisible,false);assert.equal(after.femaleVisible,false);assert.equal(after.formVisible,true);
 assert.equal(await page.locator('#hero-name').innerText(),'へへへ');assert.equal(await page.locator('#switch-action').isVisible(),false);assert.equal(await page.locator('#predation').isEnabled(),false);assert.equal(await page.locator('#predation-status').innerText(),'解除不可');assert.equal(await page.locator('#damage-flash').evaluate(e=>e.classList.contains('flash')),false);
 await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.id==='hehereal-hehe-laugh');pass('Touch capture is solo, damage-free, irreversible and uses supplied laughter',{...after,health:undefined});
 await page.keyboard.press('KeyF');assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.state.predation.active),true);
 for(const [width,height] of [[390,844],[320,568],[844,390]]){await page.setViewportSize({width,height});const box=await page.locator('#predation').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,JSON.stringify(box));await page.screenshot({path:`${out}/predation-${width}.png`});}
 pass('Capture control fits three phone sizes and cannot be released with F');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;t.voice.stop();g.enemies=[];g.projectiles=[];g.player.attack=999;const e=g.spawnEnemy('moss',g.player.x,g.player.z-6);e.hp=1e9;e.speed=0;e.special=e.attack=999;g.attackFrom(g.player,6);t.step(0);});
 await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.id==='hehereal-hehe-attack');pass('Bow attacks play the supplied orya clip');
 await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;g.player.charge=100;g.player.attack=999;for(const x of [-1,1]){const e=g.spawnEnemy('moss',g.player.x+x,g.player.z+2);e.hp=1;e.speed=0;e.special=e.attack=999;}});await page.locator('#ultimate').click();await page.waitForSelector('#ultimate-cutin[data-hero="hehehe"]:not(.hidden)');
 await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.id==='hehereal-hehe-power');assert.equal(await page.locator('.cutin-ability').innerText(),'捕食の舞');assert.match(await page.locator('.cutin-face').getAttribute('src'),/hehe-predation-dance-v1.png/);await page.screenshot({path:`${out}/predation-ultimate.png`});await page.locator('#cutin-skip').click();await page.waitForFunction(()=>window.__LUNARIA_TEST__.state.predation.danceKills===2);const dance=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;return {kills:g.predation.danceKills,bonus:g.predation.attackBonus,base:g.predation.baseAttack,attack:g.statsFor(6).attack,weapon:t.world.heheForm.userData.weapon.userData.family,kind:g.ultimateEffects[0]?.kind,hits:g.runHits};});assert.equal(dance.bonus,2);assert.ok(Math.abs(dance.attack-(dance.base+2))<1e-6);assert.equal(dance.kind,'predationDance');assert.equal(dance.hits,0);await page.screenshot({path:`${out}/predation-dance-gameplay.png`});pass('Predation Dance uses generated cut-in, supplied power voice and fixed +1 attack per kill',dance);
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];g.projectiles=[];g.ultimateEffects=[];g.pendingBlessings=0;g.wave=6;g.area=2;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);g.crossExit();t.step(0);});
 assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.state.predation.active),false);assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.state.party),['omsolo','hehereal']);assert.equal(await page.evaluate(()=>localStorage.getItem('lunaria-party-v1')),before.party);pass('Battle completion restores the original duo without changing the saved party');
 await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.locator('#start').click();await page.locator('[data-chapter="5"]').click();await page.locator('[data-act="25"]').click();await page.locator('#chapter-start').click();await page.locator('#story-skip').click();await page.locator('#predation').click();
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.wave=2;g.area=0;g.enemies=[];g.pendingBlessings=0;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);g.crossExit();t.step(0);});await page.waitForSelector('#story-dialog[open]');
 while(await page.locator('#story-dialog').getAttribute('data-speaker')!=='hehereal')await page.locator('#story-next').click();assert.match(await page.locator('.story-character-image').getAttribute('src'),/hehe-form-v1.png/);await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.id==='hehereal-hehe-laugh');assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.state.predation.active),true);await page.locator('#story-skip').click();assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.state.party),['hehereal']);pass('Mid-battle story keeps the transformed appearance and supplied voice, without returning Omsolo');
 // Native in-engine renders are distributable runtime portraits, not original source sheets.
 await page.setViewportSize({width:1024,height:1024});
 await page.evaluate(async()=>{
  const THREE=await import('/node_modules/.vite/deps/three.js'),{updateHeheForm}=await import('/src/hehe-form-visuals.js'),{WEAPON_CATALOG}=await import('/src/weapons.js');const w=window.__LUNARIA_TEST__.world;w.render=()=>{};
  for(const e of document.querySelectorAll('body > :not(canvas),#app'))e.style.display='none';document.getElementById('scene').style.display='block';
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xe8e7eb);scene.add(new THREE.HemisphereLight(0xffffff,0x837082,2));const light=new THREE.DirectionalLight(0xfff0dd,2.5);light.position.set(-4,7,6);scene.add(light);
  const form=w.heheForm;scene.add(form);form.visible=true;form.userData.body.position.y=0;updateHeheForm(form,new THREE.Group(),{face:0,moving:false,dash:0},0,0,WEAPON_CATALOG.find(v=>v.heroId==='hehereal'&&v.rarity.rank===1));
  const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(4,3.2,6.8);camera.lookAt(0,1.55,0);w.renderer.render(scene,camera);window.__formArt={scene,camera,form,w};
 });
 await page.screenshot({path:'public/assets/portraits/hehe-form-v1.png'});
 await page.evaluate(()=>{const q=window.__formArt;q.form.userData.weapon.visible=false;q.camera.position.set(.1,2.7,1.9);q.camera.lookAt(0,2.58,0);q.w.renderer.render(q.scene,q.camera);});await page.screenshot({path:'public/assets/portraits/hehe-form-face-v1.png'});
 pass('Form portraits rendered from the native 3D game character');assert.deepEqual(errors,[]);await writeFile(`${out}/predation-browser-report.json`,JSON.stringify({url,checks,errors},null,2));
}catch(e){await writeFile(`${out}/predation-browser-report.json`,JSON.stringify({checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
