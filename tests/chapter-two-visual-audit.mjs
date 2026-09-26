import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1200,height:850}}),page=await context.newPage(),errors=[],poses=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
try{
 await page.goto('http://127.0.0.1:5174/?v=chapter-two-visual');await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.evaluate(()=>{window.__LUNARIA_TEST__.home();for(const id of ['home','wave-banner','ultimate-banner','toast'])document.getElementById(id).style.display='none';});
 for(const pose of ['front','back','walk-left','walk-right','attack','injured']){
  const data=await page.evaluate(async pose=>{
   const THREE=await import('/node_modules/three/build/three.core.js');const {animateHero,animateWoundedHero}=await import('/src/hero-assets.js');const w=window.__LUNARIA_TEST__.world,h=w.heroes[2];
   w.heroes.forEach((h,i)=>h.visible=i===2);w.scene.background=new THREE.Color('#23444b');w.terrain.root&&(w.terrain.root.visible=false);h.rotation.y=0;
   h.userData.attackTime=pose==='attack'?.32:0;const state={x:0,z:0,face:0,moving:pose.startsWith('walk'),invincible:0};
   for(let i=0;i<8;i++)(pose==='injured'?animateWoundedHero:animateHero)(h,state,pose==='walk-left'?.12:.37,1/60,true);
   w.camera.position.set(pose==='attack'?5:0,2.5,pose==='back'?-8:8);w.camera.lookAt(0,1.45,0);w.renderer.render(w.scene,w.camera);
   const bounds=new THREE.Box3().setFromObject(h.userData.model,true),hand=h.userData.bones.get('hand.R').bone.getWorldPosition(new THREE.Vector3()),socket=h.userData.weapon.getWorldPosition(new THREE.Vector3());
   return {pose,source:h.userData.source,bones:h.userData.bones.size,min:bounds.min.toArray(),max:bounds.max.toArray(),size:bounds.getSize(new THREE.Vector3()).toArray(),weaponDistance:hand.distanceTo(socket),...h.userData.metrics};
  },pose);
  await page.screenshot({path:`audit/chapter-two/omsolo-${pose}.png`});poses.push(data);assert.equal(data.bones,31);assert.ok(data.weaponDistance<.15);assert.ok([...data.min,...data.max].every(Number.isFinite));
 }
 await page.evaluate(()=>location.reload());await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 assert.deepEqual(errors,[]);await writeFile('audit/chapter-two/visual.json',JSON.stringify({poses,errors},null,2));console.log(JSON.stringify({poses,errors}));
}finally{await browser.close();}
