import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/chapter-seven',url=process.env.LUNARIA_URL??'http://localhost:5187/';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1000,height:900}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
try{
 await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.evaluate(async()=>{
  const THREE=await import('/node_modules/.vite/deps/three.js'),{animateHero,setHeroWeapon}=await import('/src/hero-assets.js'),{WEAPON_CATALOG}=await import('/src/weapons.js'),{createEnemy}=await import('/src/characters.js');
  const t=window.__LUNARIA_TEST__,w=t.world;t.home();w.render=()=>{};for(const e of document.querySelectorAll('body > :not(canvas),#app'))e.style.display='none';document.getElementById('scene').style.display='block';
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xe8e9f3);scene.add(new THREE.HemisphereLight(0xffffff,0x9b97ad,2.1));const light=new THREE.DirectionalLight(0xfff3e7,2.1);light.position.set(-3,6,5);scene.add(light);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0xe8e9f3,roughness:1}));floor.rotation.x=-Math.PI/2;scene.add(floor);
  const camera=new THREE.PerspectiveCamera(35,1000/900,.1,100),hero=w.heroes[7];scene.add(hero);hero.visible=true;hero.userData.ring.visible=false;setHeroWeapon(hero,WEAPON_CATALOG.find(v=>v.heroId==='lumi'&&v.rarity.rank===1));window.__lumiQA={THREE,scene,camera,hero,w,animateHero,setHeroWeapon,WEAPON_CATALOG,createEnemy};
 });
 for(const view of ['front','quarter','side','back','face','walk-left','walk-right','railgun','dash','neko-front','neko-face','neko-quarter','neko-side','neko-back','neko-walk-left','neko-walk-right']){
  const row=await page.evaluate(view=>{
   const {THREE,hero:h,scene,camera,w,animateHero}=window.__lumiQA,moving=view.includes('walk')||view==='dash',neko=view.startsWith('neko'),face=view.includes('face'),time=view.endsWith('walk-left')?Math.PI*.5/13:view.endsWith('walk-right')?Math.PI*1.5/13:.2;
   h.rotation.set(0,0,0);h.userData.movement=moving?1:0;h.userData.attackTime=view==='railgun'?.17:0;animateHero(h,{x:0,z:0,face:0,moving,invincible:0,dash:view==='dash'?.2:0,neko},time,0,true);h.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(h.userData.model,true),hand=h.userData.bones.get('hand.R').bone.getWorldPosition(new THREE.Vector3()),weapon=h.userData.weapon.getWorldPosition(new THREE.Vector3());
   camera.position.set(view.endsWith('quarter')?5:view.endsWith('side')?7:0,face?2.55:2.7,view.endsWith('back')?-7:view.endsWith('side')?0:face?2.5:7);camera.lookAt(0,face?2.55:1.6,0);h.userData.weapon.visible=!face;w.renderer.render(scene,camera);
   const earBounds=new THREE.Box3().setFromObject(h.userData.ears,true),earSize=earBounds.getSize(new THREE.Vector3());return {min:bounds.min.toArray(),size:bounds.getSize(new THREE.Vector3()).toArray(),socketDistance:weapon.distanceTo(hand),ears:h.userData.ears.visible,earMinY:earBounds.min.y,earSize:earSize.toArray(),earVersion:h.userData.ears.userData.designVersion};
  },view);
  assert.ok([...row.min,...row.size].every(Number.isFinite));assert.ok(row.socketDistance<.22);assert.ok(row.min[1]>-.13);assert.equal(row.ears,view.startsWith('neko'));assert.equal(row.earVersion,'sculpted-small-pinna-v3');assert.ok(row.earMinY<2.9,'Ear bases overlap the scalp');assert.ok(row.earSize[2]>.12&&row.earSize[1]>.35&&row.earSize[1]<.5);await page.screenshot({path:`${out}/lumi-3d-${view}.png`});checks.push({view,...row});console.log('PASS Native Lumi',view,JSON.stringify(row));
 }
 const swaps=await page.evaluate(()=>{const q=window.__lumiQA;return q.WEAPON_CATALOG.filter(v=>v.heroId==='lumi').map(item=>{q.setHeroWeapon(q.hero,item);q.animateHero(q.hero,{x:0,z:0,face:0,moving:false,invincible:0,neko:false},.2,0,true);q.hero.updateMatrixWorld(true);const hand=q.hero.userData.bones.get('hand.R').bone.getWorldPosition(new q.THREE.Vector3()),weapon=q.hero.userData.weapon.getWorldPosition(new q.THREE.Vector3());return {id:item.id,family:q.hero.userData.weapon.userData.family,color:q.hero.userData.weapon.userData.color,socketDistance:hand.distanceTo(weapon)};});});
 assert.equal(swaps.length,10);assert.equal(new Set(swaps.map(s=>s.color)).size,3);assert.ok(swaps.every(s=>s.socketDistance<.22));checks.push({name:'All ten ranks and three fingertip colors',swaps});
 await page.evaluate(()=>{const q=window.__lumiQA;q.hero.visible=false;for(const [i,type] of ['antiBrawler','antiSniper','antiCaster','antiRunner','antiGuard'].entries()){const enemy=q.createEnemy(type);enemy.position.x=(i-2)*2.6;q.scene.add(enemy);}q.camera.position.set(0,5,18);q.camera.lookAt(0,1.3,0);q.w.renderer.render(q.scene,q.camera);});await page.screenshot({path:`${out}/anti-kemomimi-roster.png`});
 assert.deepEqual(errors,[]);await writeFile(`${out}/lumi-model-browser-report.json`,JSON.stringify({url,checks,errors},null,2));
}catch(e){await writeFile(`${out}/lumi-model-browser-report.json`,JSON.stringify({url,checks,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
