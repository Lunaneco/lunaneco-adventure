import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.LUNARIA_URL??'http://127.0.0.1:5191/',out=process.env.NEKO_ATTACK_AUDIT_OUT??'audit/nekolumi-attack-20261003';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
async function open(width,height,members=['lumi','mochinyafe']){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(members=>{
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(32).fill(true)},characters:Object.fromEntries(['nyanluna','tsukineko','omsolo','mochinyafe','shizuku','prim','hehereal','lumi'].map(id=>[id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}}));
  localStorage.setItem('lunaria-party-v1',JSON.stringify({members,lead:'lumi'}));
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,voice:false,music:false,motion:false}));
 },members);
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});await page.locator('#start').click();await page.locator('[data-act="0"]').click();await page.locator('#chapter-start').click();await page.locator('#story-skip').click();
 await page.evaluate(()=>window.__LUNARIA_TEST__.game.pause());return {page,context};
}
try{
 for(const [width,height] of [[390,844],[1280,800]]){
  const {page,context}=await open(width,height);
  const row=await page.evaluate(async()=>{
   const {tickLumiAttacks}=await import('/src/lumi-combat.js'),t=window.__LUNARIA_TEST__,g=t.game,w=t.world;
   g.enemies=[];g.projectiles=[];g.hazards=[];g.lumiBursts=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;g.rng=()=>1;
   const p=g.player;Object.assign(p,{x:0,z:3,face:Math.PI,moving:false});g.phase='playing';g.drainEvents();
   const targets=[4,7,10,13].map(d=>{const e=g.spawnEnemy('antiGuard',0,3-d);Object.assign(e,{hp:1e6,maxHp:1e6,speed:0,special:999,attack:999});return e;});
   const events=[];g.attackFrom(p,7);let batch=g.drainEvents();events.push(...batch);w.handle(batch,g);
   for(let i=0;i<2;i++){tickLumiAttacks(g,.09);batch=g.drainEvents();events.push(...batch);w.handle(batch,g);}
   g.phase='paused';w.render(g,0);
   const attackTime=w.heroes[7].userData.attackTime,life=w.rings.filter(e=>e.kind==='lumi-rail').map(e=>e.life);
   w.render(g,.25);
   const pauseSynced=attackTime===w.heroes[7].userData.attackTime&&JSON.stringify(life)===JSON.stringify(w.rings.filter(e=>e.kind==='lumi-rail').map(e=>e.life));
   const h=w.heroes[7],rays=events.filter(e=>e.type==='lumiRail');
   return {hits:targets.map(e=>events.filter(v=>v.type==='hit'&&v.id===e.id).length),damage:targets.map(e=>1e6-e.hp),expectedDamage:g.statsFor(7).attack,pulses:rays.map(e=>e.pulse),beamCount:w.rings.filter(e=>e.kind==='lumi-rail').length,ears:h.userData.ears.visible,range:g.attackProfile(7).range===Infinity,queue:g.lumiBursts.length,bodyVisible:h.visible,pauseSynced};
  });
  assert.deepEqual(row.hits,[3,3,3,0]);assert.deepEqual(row.pulses,[0,1,2]);assert.equal(row.beamCount,3);assert.equal(row.ears,true);assert.equal(row.range,true);assert.equal(row.queue,0);assert.equal(row.bodyVisible,true);assert.equal(row.pauseSynced,true);
  assert.ok(row.damage.every((v,i)=>Math.abs(v-(i<3?row.expectedDamage:0))<1e-7));
  assert.equal(await page.locator('#hero-name').innerText(),'ねこるみ');await page.screenshot({path:`${out}/nekolumi-gameplay-${width}.png`});checks.push({name:`real gameplay ${width}`, ...row});
  await context.close();
 }
 const {page,context}=await open(1000,900);
 await page.evaluate(async()=>{
  const THREE=await import('/node_modules/.vite/deps/three.js'),{Adventure,HEROES}=await import('/src/model.js'),{normalizeProgression}=await import('/src/progression.js'),{animateHero,setHeroWeapon}=await import('/src/hero-assets.js'),{tickLumiAttacks}=await import('/src/lumi-combat.js'),{NEKO_LUMI_ATTACK}=await import('/src/lumi-attack-motion.js'),{updateNekoRailVisual}=await import('/src/lumi-visuals.js'),{WEAPON_CATALOG}=await import('/src/weapons.js');
  const t=window.__LUNARIA_TEST__,w=t.world;t.home();w.render=()=>{};for(const e of document.querySelectorAll('body > :not(canvas),#app'))e.style.display='none';document.getElementById('scene').style.display='block';
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x151b30);scene.add(new THREE.HemisphereLight(0xffffff,0x938aad,2.1));const light=new THREE.DirectionalLight(0xfff3e7,2.1);light.position.set(-3,6,5);scene.add(light);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x333c53,roughness:1}));floor.rotation.x=-Math.PI/2;scene.add(floor);
  const camera=new THREE.PerspectiveCamera(38,1000/900,.1,100),hero=w.heroes[7];scene.add(hero,w.fx);hero.visible=true;hero.userData.ring.visible=false;setHeroWeapon(hero,WEAPON_CATALOG.find(v=>v.heroId==='lumi'&&v.rarity.rank===1));
  const profile=normalizeProgression({story:{version:2,actClears:Array(32).fill(true)}},HEROES),g=new Adventure({act:0,hero:7,party:['lumi','mochinyafe'],progression:profile});g.enemies=[];g.rng=()=>1;Object.assign(g.player,{x:0,z:0,face:0});g.drainEvents();
  for(const distance of [5,8,11,14]){const e=g.spawnEnemy('antiGuard',0,distance);e.hp=e.maxHp=1e6;}
  g.attackFrom(g.player,7);w.handle(g.drainEvents(),g);
  window.__nekoAttackQA={THREE,scene,camera,hero,w,g,animateHero,tickLumiAttacks,NEKO_LUMI_ATTACK,updateNekoRailVisual,time:0};
 });
 const poses=[];
 for(const now of [0,.035,.05,.09,.125,.18,.215,.24,.32,.42]){
  const row=await page.evaluate(now=>{
   const q=window.__nekoAttackQA,{THREE,hero:h,scene,camera,w,g,animateHero,NEKO_LUMI_ATTACK}=q,dt=now-q.time;
   for(const effect of w.rings.filter(e=>e.kind==='lumi-rail'))q.updateNekoRailVisual(effect,dt);
   h.userData.attackTime=Math.max(0,NEKO_LUMI_ATTACK.duration-now);q.tickLumiAttacks(g,dt);w.handle(g.drainEvents(),g);q.time=now;
   h.rotation.y=0;animateHero(h,{x:0,z:0,face:0,moving:false,invincible:0,neko:true},.2+now,0,true);h.updateMatrixWorld(true);
   camera.position.set(6,3.8,7.5);camera.lookAt(0,1.5,.8);w.renderer.render(scene,camera);
   const bones=h.userData.bones,hand=bones.get('hand.R').bone.getWorldPosition(new THREE.Vector3()),weapon=h.userData.weapon.getWorldPosition(new THREE.Vector3()),bounds=new THREE.Box3().setFromObject(h.userData.model,true);
   return {time:now,hand:hand.toArray(),socketDistance:weapon.distanceTo(hand),bounds:[...bounds.min.toArray(),...bounds.max.toArray()],arm:bones.get('upper_arm.R').bone.quaternion.toArray(),chest:bones.get('chest').bone.quaternion.toArray(),earVisible:h.userData.ears.visible,flashScale:h.userData.weapon.userData.light.scale.x};
  },now);
  assert.ok(row.bounds.every(Number.isFinite));assert.ok(row.bounds[1]>-.15);assert.ok(row.socketDistance<.22);assert.equal(row.earVisible,true);poses.push(row);
  await page.screenshot({path:`${out}/nekolumi-pose-${String(now).replace('.','_')}.png`});
 }
 assert.ok(new Set(poses.map(v=>JSON.stringify(v.arm))).size>=5);checks.push({name:'native 3D recoil, recovery and fingertip attachment',poses});await context.close();
 const normal=await open(390,844,['lumi','tsukineko']);
 const unchanged=await normal.page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];g.phase='playing';g.drainEvents();g.rng=()=>1;const e=g.spawnEnemy('moss',g.player.x,g.player.z-6);e.hp=1e6;g.attackFrom(g.player,7);g.pause();return {rays:g.drainEvents().filter(e=>e.type==='lumiRail').map(e=>e.nekoBurst),queue:g.lumiBursts.length,range:g.attackProfile(7).range};});
 assert.deepEqual(unchanged,{rays:[false],queue:0,range:14});checks.push({name:'normal Lumi unchanged',...unchanged});await normal.context.close();
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({status:'PASS',url,checks,errors},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length,errors}));
}catch(e){await writeFile(`${out}/report.json`,JSON.stringify({status:'FAIL',url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
