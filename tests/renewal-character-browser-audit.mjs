import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const out='audit/renewal-20261001',url=process.env.RENEWAL_URL??'http://127.0.0.1:5187/';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1200,height:850}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
await page.addInitScript(()=>{
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(20).fill(true)},tutorial:{firstBattleCompleted:true}}));
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false}));
});
try{
  await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});
  const metrics=await page.evaluate(()=>window.__LUNARIA_TEST__.world.heroes.map(h=>({name:h.name,renewal:h.userData.renewal,bones:h.userData.bones.size,...h.userData.metrics})));
  for(const id of ['nyanluna','tsukineko','mochinyafe']){
    const h=metrics.find(h=>h.name===id);assert.ok(h.renewal&&h.skinnedMeshes>0);assert.ok(h.triangles<(id==='mochinyafe'?40000:180000));
  }
  checks.push({check:'All renewal models load with portable skins and geometry budgets',metrics});
  await page.evaluate(async()=>{
    const THREE=await import('/node_modules/.vite/deps/three.js');
    const {animateHero,setHeroWeapon}=await import('/src/hero-assets.js');
    const {WEAPON_CATALOG}=await import('/src/weapons.js');
    const t=window.__LUNARIA_TEST__,w=t.world;t.home();w.render=()=>{};
    for(const e of document.querySelectorAll('body > :not(canvas),#app'))e.style.display='none';
    // The renderer's canvas stays visible while UI overlays are hidden.
    document.getElementById('scene').style.display='block';
    const scene=new THREE.Scene();scene.background=new THREE.Color(0xe8e9f3);
    scene.add(new THREE.HemisphereLight(0xffffff,0x9b97ad,2.1));
    const light=new THREE.DirectionalLight(0xfff3e7,2.1);light.position.set(-3,6,5);scene.add(light);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0xe8e9f3,roughness:1}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
    const camera=new THREE.PerspectiveCamera(35,1200/850,.1,100);
    const heroes=[w.heroes[0],w.heroes[1],w.heroes[3]];
    for(const h of heroes){scene.add(h);h.visible=true;setHeroWeapon(h,WEAPON_CATALOG.find(v=>v.heroId===h.name&&v.rarity.rank===1));}
    window.__renewalQA={THREE,scene,camera,heroes,animateHero,setHeroWeapon,WEAPON_CATALOG,w};
  });
  for(const view of ['front','quarter','side','back','walk-left','walk-right','attack','dash','riding','gameplay']){
    const data=await page.evaluate(view=>{
      const q=window.__renewalQA,{THREE,heroes,animateHero,camera,scene,w}=q;
      const moving=view.startsWith('walk')||view==='dash',time=view==='walk-left'?Math.PI*.5/13:view==='walk-right'?Math.PI*1.5/13:.2;
      const rows=[];
      for(const [i,h] of heroes.entries()){
        h.rotation.set(0,0,0);h.scale.setScalar(1);h.userData.movement=moving?1:0;h.userData.attackTime=view==='attack'?.17:0;
        animateHero(h,{x:[-3.1,0,3.1][i],z:0,face:0,moving,invincible:0,dash:view==='dash'?.2:0,riding:view==='riding'&&i===1},time,0,i===0);
        h.updateMatrixWorld(true);
        const box=new THREE.Box3().setFromObject(h.userData.model,true);
        const hand=h.userData.bones.get('hand.R')?.bone.getWorldPosition(new THREE.Vector3());
        const weapon=h.userData.weapon.getWorldPosition(new THREE.Vector3());
        rows.push({name:h.name,min:box.min.toArray(),size:box.getSize(new THREE.Vector3()).toArray(),hand:hand?.toArray(),weapon:weapon.toArray(),weaponDistance:hand?weapon.distanceTo(hand):null});
      }
      camera.position.set(view==='quarter'?7:view==='side'?12:0,view==='gameplay'?13:3.7,view==='back'?-11:view==='side'?0:view==='gameplay'?12:11);
      camera.lookAt(0,1.5,0);w.renderer.render(scene,camera);return rows;
    },view);
    for(const row of data){assert.ok([...row.min,...row.size].every(Number.isFinite));if(row.weaponDistance!==null)assert.ok(row.weaponDistance<.19,`${view} ${row.name} grip follows hand`);if(view!=='riding')assert.ok(row.min[1]>-.12,`${view} ${row.name} ground contact`);}
    checks.push({view,data});await page.screenshot({path:`${out}/${view}.png`});
  }
  const swaps=await page.evaluate(()=>{
    const q=window.__renewalQA,results=[];
    for(const h of q.heroes)for(const item of q.WEAPON_CATALOG.filter(v=>v.heroId===h.name)){
      q.setHeroWeapon(h,item);q.animateHero(h,{x:0,z:0,face:1.2,moving:true,invincible:0},.1,1/60,true);h.updateMatrixWorld(true);
      const hand=h.userData.bones.get('hand.R')?.bone.getWorldPosition(new q.THREE.Vector3()),weapon=h.userData.weapon.getWorldPosition(new q.THREE.Vector3());
      results.push({hero:h.name,id:item.id,family:h.userData.weapon.userData.family,distance:hand?weapon.distanceTo(hand):0,scale:h.userData.weapon.scale.toArray()});
    }
    return results;
  });
  assert.equal(swaps.length,30);for(const s of swaps)assert.ok(s.distance<.19&&s.family,`${s.id} weapon swap`);
  checks.push({check:'All 30 existing weapons across nine families equip and follow the renewed character',swaps});
  // Native 3D reference renders stay in the private audit, not the adopted UI artwork.
  await mkdir(`${out}/ui-candidates`,{recursive:true});
  for(const name of ['nyanluna','tsukineko','mochinyafe'])for(const portrait of [false,true]){
    const png=await page.evaluate(({name,portrait})=>{
      const q=window.__renewalQA,{THREE,scene,heroes,animateHero,setHeroWeapon,WEAPON_CATALOG}=q;
      const h=heroes.find(h=>h.name===name);
      for(const other of heroes)other.visible=other===h;
      setHeroWeapon(h,WEAPON_CATALOG.find(v=>v.heroId===name&&v.rarity.rank===1));
      h.rotation.set(0,0,0);h.userData.movement=0;h.userData.attackTime=0;
      animateHero(h,{x:0,z:0,face:0,moving:false,invincible:0},0,0,true);
      h.userData.ring.visible=false;scene.background=null;
      const floor=scene.children.find(o=>o.isMesh);floor.visible=false;
      h.userData.weapon.visible=!portrait;
      const size=portrait?512:1024,renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
      renderer.setSize(size,size);renderer.setClearColor(0,0);renderer.outputColorSpace=q.w.renderer.outputColorSpace;
      const half=portrait?(name==='mochinyafe'?.78:.70):(name==='mochinyafe'?1.13:1.85);
      const camera=new THREE.OrthographicCamera(-half,half,half,-half,.1,100),center=portrait?(name==='mochinyafe'?.88:2.56):(name==='mochinyafe'?.82:1.62);
      camera.position.set(0,center,12);camera.lookAt(0,center,0);renderer.render(scene,camera);
      const png=renderer.domElement.toDataURL('image/png');renderer.dispose();
      floor.visible=true;h.userData.ring.visible=true;h.userData.weapon.visible=true;scene.background=new THREE.Color(0xe8e9f3);return png;
    },{name,portrait});
    await writeFile(`${out}/ui-candidates/${name}-${portrait?'portrait':'renewal'}-v1.png`,Buffer.from(png.split(',')[1],'base64'));
  }
  await page.setViewportSize({width:390,height:844});
  await page.reload();await page.waitForSelector('#loading',{state:'detached',timeout:120000});
  await page.click('#start');await page.click('[data-chapter="0"]');await page.click('[data-act="0"]');await page.click('#chapter-start');await page.click('#story-skip');
  await page.waitForSelector('#hud:not(.hidden)');await page.screenshot({path:`${out}/mobile-game.png`});
  const play=await page.evaluate(()=>{
    const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];g.projectiles=[];g.hazards=[];
    const x=g.player.x;for(let i=0;i<30;i++)t.step(1/60,{x:1,z:0});const moved=g.player.x-x;
    const enemy=g.spawnEnemy('moss',g.player.x,g.player.z+4);enemy.hp=10000;enemy.maxHp=10000;
    const fired=g.attackFrom(g.player,g.player.hero);g.player.switchCooldown=0;const switched=g.switchHero();
    return {moved,fired,switched,hero:g.player.hero};
  });
  assert.ok(play.moved>1&&play.fired&&play.switched);checks.push({check:'Actual mobile movement, attack and partner swap',play});
  assert.deepEqual(errors,[]);await writeFile(`${out}/runtime-report.json`,JSON.stringify({checks,errors},null,2));
  console.log('PASS renewal models, fixed views, motion, hand grips, all 30 existing weapons and mobile gameplay');
}catch(e){await page.screenshot({path:`${out}/failure.png`});await writeFile(`${out}/runtime-report.json`,JSON.stringify({checks,errors,failure:e.stack},null,2));throw e;}
finally{await browser.close();}
