import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out='audit/mochi-slime',name=process.env.MOCHI_BROWSER??'chromium';await mkdir(out,{recursive:true});
const browser=await(name==='webkit'?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const errors=[],checks=[],poses=[];
const profile={story:{version:2,actClears:Array(12).fill(true)},tutorial:{firstBattleCompleted:true},characters:{mochinyafe:{level:40,breaks:2},nyanluna:{level:40,breaks:2}}};
async function open(url){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addInitScript(profile=>{if(!sessionStorage.getItem('mochi-motion')){sessionStorage.setItem('mochi-motion','1');localStorage.setItem('lunaria-progression-v1',JSON.stringify(profile));localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['mochinyafe','nyanluna'],lead:'mochinyafe'}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:true}));}},profile);
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await p.goto(url);await p.waitForSelector('#loading',{state:'detached',timeout:60000});return p;
}
const pass=s=>{checks.push(s);console.log('PASS',name,s);};
let page;
try{
 page=await open('http://127.0.0.1:5185/');
 await page.click('#start');await page.click('[data-chapter="2"]');await page.click('[data-act="8"]');
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.enemies=[];g.projectiles=[];g.hazards=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;Object.assign(g.player,{x:0,z:0,attack:999,invincible:999});g.partner.attack=999;g.pause();t.step(0);t.world.render(g,.016);});
 const metrics=await page.evaluate(()=>window.__LUNARIA_TEST__.world.heroes[3].userData.metrics);assert.equal(metrics.triangles,10848);assert.equal(metrics.meshes,4);assert.equal(metrics.skinnedMeshes,0);
 const motion=await page.evaluate(async()=>{
  const {animateHero}=await import('/src/hero-assets.js'),{Box3,Vector3}=await import('/node_modules/.vite/deps/three.js');
  const t=window.__LUNARIA_TEST__,root=t.world.heroes[3],d=root.userData,results=[];
  for(const hz of [30,60,120]){
   d.movement=0;let minY=Infinity,maxY=-Infinity,minScale=Infinity,maxScale=0;
   const weaponScale=d.weapon.getWorldScale(new Vector3()).toArray();
   for(let i=0;i<hz*2;i++){
    animateHero(root,{x:0,z:0,face:0,moving:true,invincible:0},i/hz,1/hz,true);root.updateMatrixWorld(true);
    const b=new Box3().setFromObject(d.model,true);minY=Math.min(minY,b.min.y);maxY=Math.max(maxY,b.min.y);minScale=Math.min(minScale,d.slimeBody.scale.y);maxScale=Math.max(maxScale,d.slimeBody.scale.y);
    if(d.weapon.getWorldScale(new Vector3()).toArray().some((n,j)=>Math.abs(n-weaponScale[j])>1e-7))throw Error('Weapon deformed with the body');
   }
   for(let i=0;i<hz;i++)animateHero(root,{x:0,z:0,face:0,moving:false,invincible:0},2+i/hz,1/hz,true);
   root.updateMatrixWorld(true);results.push({hz,minY,maxY,minScale,maxScale,stoppedHeight:new Box3().setFromObject(d.model,true).min.y});
  }
  return results;
 });
 for(const r of motion){assert.ok(r.minY>=.014&&r.maxY>.29);assert.ok(r.minScale<.79&&r.maxScale>1.13);assert.ok(Math.abs(r.stoppedHeight-.015)<.001);}
 pass('Actual GLB has no paws; 30/60/120 Hz movement compresses, hops and settles on the floor; chime scale stays rigid');
 const gameplay=await page.evaluate(()=>{
  const t=window.__LUNARIA_TEST__,g=t.game;g.resume();for(let i=0;i<45;i++){t.step(1/60,{x:1,z:0});t.world.render(g,1/60);}const moved=g.player.x;g.player.switchCooldown=0;g.switchHero();
  g.enemies=[];g.projectiles=[];Object.assign(g.partner,{x:0,z:0,attack:999});Object.assign(g.player,{x:0,z:0,attack:999});const e=g.spawnEnemy('mochiGoblin',0,4);Object.assign(e,{hp:10000,maxHp:10000,speed:0,special:999,attack:999});
  const fired=g.attackFrom(g.partner,3,true);for(let i=0;i<50;i++){t.step(1/60);t.world.render(g,1/60);}const stopped=e.mochiStopUntil>g.time;
  g.player.switchCooldown=0;g.switchHero();g.player.charge=100;const ultimate=g.ultimate();t.step(.1);g.pause();t.world.render(g,.016);
  return {moved,fired,stopped,ultimate,hero:g.player.hero,model:!!t.world.heroes[3].userData.slimeBody};
 });
 assert.ok(gameplay.moved>3&&gameplay.fired&&gameplay.stopped&&gameplay.ultimate&&gameplay.model);assert.equal(gameplay.hero,3);await page.screenshot({path:`${out}/${name}-game-mobile.png`});
 pass('Real movement, partner swap, support freeze and Mochi ultimate still work');
 const rescue=await page.evaluate(async()=>{
  const {Adventure}=await import('/src/model.js'),{Box3}=await import('/node_modules/.vite/deps/three.js'),t=window.__LUNARIA_TEST__,w=t.world;
  t.ultimatePresentation.cancel();const g=new Adventure({act:11,hero:0,progression:t.game.progression,party:['nyanluna','tsukineko']});g.wave=5;g.startWave();g.pause();w.reset();w.handle(g.drainEvents(),g);
  let min=Infinity;for(const saved of [false,true]){g.exitOpen=saved;for(let i=0;i<60;i++){w.render(g,1/60);min=Math.min(min,new Box3().setFromObject(w.heroes[3].userData.model,true).min.y-g.layout.height);}}
  return {visible:w.heroes[3].visible,min};
 });assert.ok(rescue.visible&&rescue.min>=.014);pass('Rescue trembling and saved idle remain grounded after removing the paws');
 // Fixed camera views of the actual runtime model, isolated from the game's RAF.
 await page.setViewportSize({width:768,height:768});
 await page.evaluate(async()=>{
  const THREE=await import('/node_modules/.vite/deps/three.js'),t=window.__LUNARIA_TEST__,w=t.world,hero=w.heroes[3];t.ultimatePresentation.cancel();w.render=()=>{};
  for(const el of document.querySelectorAll('#home,#hud,#chapter-menu,#wave-banner,#ultimate-banner,#toast,#numbers'))el.style.display='none';
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xf4dfe9);scene.add(hero);scene.add(new THREE.HemisphereLight(0xffffff,0x9f7894,2));
  const light=new THREE.DirectionalLight(0xfff1e4,2.5);light.position.set(-3,5,5);scene.add(light);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0xf4dfe9,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);window.__mochiQA={scene,camera,hero};
 });
 for(const pose of ['front','side','back','squash','hop','dash','cry']){
  const data=await page.evaluate(async pose=>{
   const {animateHero}=await import('/src/hero-assets.js'),{Box3,Vector3}=await import('/node_modules/.vite/deps/three.js');
   const w=window.__LUNARIA_TEST__.world,{scene,camera,hero}=window.__mochiQA,d=hero.userData,moving=['squash','hop','dash'].includes(pose),time=pose==='squash'?Math.PI*1.5/11.5:Math.PI*.5/11.5;
   hero.rotation.set(0,0,0);hero.visible=true;d.movement=moving?1:0;d.attackTime=pose==='cry'?.17:0;
   animateHero(hero,{x:0,z:0,face:0,moving,invincible:0,dash:pose==='dash'?.2:0},time,0,true);
   camera.position.set(pose==='side'?5.5:0,1.35,pose==='back'?-5.5:pose==='side'?0:5.5);camera.lookAt(0,.85,0);w.renderer.render(scene,camera);
   const b=new Box3().setFromObject(d.model,true);return {pose,min:b.min.toArray(),max:b.max.toArray(),bodyScale:d.slimeBody.scale.toArray()};
  },pose);poses.push(data);assert.ok(data.min[1]>=.014);await page.screenshot({path:`${out}/${name}-${pose}-runtime.png`});
 }
 pass('Fixed front/side/back and squash/hop/dash/cry poses render without ground penetration');
 for(const bossId of ['darkmochi','dreammochi','bellmochi','kingmochi']){
  const min=await page.evaluate(async bossId=>{
   const {createEnemy,animateEnemy}=await import('/src/characters.js'),{Box3}=await import('/node_modules/.vite/deps/three.js'),{scene,camera,hero}=window.__mochiQA,w=window.__LUNARIA_TEST__.world;
   hero.visible=false;window.__mochiQA.boss?.removeFromParent();const boss=createEnemy('boss',bossId);window.__mochiQA.boss=boss;scene.add(boss);
   animateEnemy(boss,{type:'boss',bossId,id:1,x:0,z:0,face:0,radius:2,speed:1,hit:0,cast:{kind:'chant'}},0);
   camera.position.set(0,2.1,8.5);camera.lookAt(0,1.6,0);w.renderer.render(scene,camera);return new Box3().setFromObject(boss.userData.body).min.y;
  },bossId);assert.ok(min>=.014);await page.screenshot({path:`${out}/${name}-${bossId}.png`});
 }
 pass('All four dark Mochi models render with grounded, limbless silhouettes');await page.context().close();
 if(name==='chromium'){
  page=await open('http://127.0.0.1:4185/?v=1.55.0');assert.match(await page.locator('.version').innerText(),/1\.55\.0/);assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
  const hash=await page.evaluate(async()=>{const b=await(await fetch('/assets/models/mochinyafe.glb')).arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('');});
  assert.equal(hash,createHash('sha256').update(await readFile('public/assets/models/mochinyafe.glb')).digest('hex'));
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await page.reload();await page.waitForSelector('#loading',{state:'detached'});await page.context().setOffline(true);await page.reload();await page.waitForSelector('#loading',{state:'detached'});
  await page.click('#start');await page.click('[data-chapter="2"]');await page.click('[data-act="8"]');await page.click('#chapter-start');await page.click('#story-skip');await page.waitForSelector('#hud:not(.hidden)');assert.equal(await page.locator('#hero-name').innerText(),'もちにゃふぇ');await page.screenshot({path:`${out}/production-offline.png`});
  pass('v1.55 production serves the new GLB byte-for-byte and Mochi gameplay starts offline');
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/${name}-browser.json`,JSON.stringify({checks,metrics,motion,gameplay,rescue,poses,errors},null,2));
}catch(e){if(page&&!page.isClosed())await page.screenshot({path:`${out}/${name}-failure.png`});await writeFile(`${out}/${name}-browser.json`,JSON.stringify({checks,poses,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
