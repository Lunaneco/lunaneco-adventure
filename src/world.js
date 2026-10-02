import {prismBeamVisual} from './prim-visuals.js';
import {publicUrl} from './public-url.js';
import {TerrainWorld} from './terrain-world.js';
import {createSwordSlash,updateSwordSlash} from './attack-effects.js';
import {heightAt} from './terrain.js';
import {riceTargets} from './rice-combat.js';
import {distanceToHazard} from './enemies.js';
import {createHostileProjectile,updateHostileProjectile,createTelegraph,updateTelegraph} from './enemy-effects.js';
import {createSanctuary,updateSanctuary} from './ultimate-effects.js';
import * as THREE from 'three';
import {createHeheForm,updateHeheForm} from './hehe-form-visuals.js';
import {createMagicArrow} from './hehereal-visuals.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { material,part,bakeGroup,createEnemy,animateEnemy } from './characters.js';
import {equippedWeapon} from './weapons.js';
import { loadHeroes,animateHero,animateWoundedHero,setHeroWeapon } from './hero-assets.js';
import { seededRandom,AREAS,ATTACK_DURATION,HEROES } from './model.js';
import { FieldEnvironment } from './field-environment.js';
import {StageGate} from './stage-gate.js';
import {FIELD_CAMERA,resizeFieldCamera} from './field-camera.js';
const rng=seededRandom(9017);
const rand=(a,b)=>a+rng()*(b-a);
function groundTexture(){
  const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');ctx.fillStyle='#52794b';ctx.fillRect(0,0,1024,1024);
  for(let i=0;i<24000;i++){const x=rng()*1024,y=rng()*1024,r=rand(1,11);ctx.fillStyle=['#74944e','#869e55','#335d43','#578649','#a4b273'][Math.floor(rng()*5)];ctx.globalAlpha=rand(.04,.19);ctx.beginPath();ctx.ellipse(x,y,r,r*.65,0,0,7);ctx.fill();}
  ctx.globalAlpha=1;const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
}
function stoneTexture(){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#b4b5a1';ctx.fillRect(0,0,512,512);
  for(let i=0;i<12000;i++){ctx.fillStyle=rng()>.5?'rgba(255,250,225,.07)':'rgba(48,70,62,.06)';ctx.fillRect(rng()*512,rng()*512,rand(1,6),rand(1,6));}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(5,5);return tex;
}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const a=g.createRadialGradient(32,32,0,32,32,32);a.addColorStop(0,'rgba(255,255,255,1)');a.addColorStop(.18,'rgba(255,255,255,.8)');a.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=a;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
export class World {
  constructor(canvas,settings={}){
    this.canvas=canvas;this.settings=settings;this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xbcd8d6);this.scene.fog=new THREE.FogExp2(0xbcd8d6,.005);this.time=0;this.cameraTarget=new THREE.Vector3(0,0,0);this.shake=0;this.entities=new Map();this.bullets=new Map();this.orbMeshes=new Map();this.hazardMeshes=new Map();this.ultimateMeshes=new Map();this.rings=[];this.numbers=[];this.area=0;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,settings.quality==='low'?1:1.65));this.renderer.shadowMap.enabled=settings.quality!=='low';this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.92;this.renderer.info.autoReset=false;
    this.camera=new THREE.PerspectiveCamera(42,1,.1,230);this.camera.position.set(12,19,16);this.camera.lookAt(0,0,0);
    this.hemisphere=new THREE.HemisphereLight(0xdcefff,0x3d6741,1.05);this.scene.add(this.hemisphere);
    this.sun=new THREE.DirectionalLight(0xffe9cb,2.1);this.sun.position.set(-18,32,12);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:.1,far:90});this.sun.shadow.bias=-.0004;this.sun.shadow.normalBias=.035;this.sun.shadow.radius=3;this.scene.add(this.sun);
    this.fill=new THREE.DirectionalLight(0xb3cdff,.45);this.fill.position.set(15,12,-12);this.scene.add(this.fill);
    const previous=new Set(this.scene.children);this.environment();this.legacyArena=[...this.scene.children].filter(o=>!previous.has(o)&&o!==this.portal&&o!==this.motes);this.legacyArena.forEach(o=>o.visible=false);this.terrain=new TerrainWorld(this);this.fields=new FieldEnvironment(this);this.stageGate=new StageGate(this);this.heroes=[];this.rescueDome=new THREE.Mesh(new THREE.SphereGeometry(2.2,24,16),new THREE.MeshBasicMaterial({color:0xddc8ff,transparent:true,opacity:.14,depthWrite:false}));this.rescueDome.scale.set(1,.8,1);this.rescueDome.visible=false;this.scene.add(this.rescueDome);this.assetsReady=false;this.ready=Promise.all([loadHeroes(),this.fields.ready,this.terrain.ready]).then(([heroes])=>{this.heroes=heroes;heroes.forEach(h=>this.scene.add(h));this.assetsReady=true;});
    this.heheForm=createHeheForm();this.scene.add(this.heheForm);
    this.fx=new THREE.Group();this.scene.add(this.fx);this.makeParticles();this.orbit=[];
    this.riceRing=new THREE.Mesh(new THREE.TorusGeometry(1,.045,6,40),new THREE.MeshBasicMaterial({color:0xaaffba,transparent:true,opacity:.9,depthWrite:false}));this.riceRing.rotation.x=-Math.PI/2;this.riceRing.visible=false;this.scene.add(this.riceRing);
    for(let i=0;i<3;i++){const s=new THREE.Mesh(new THREE.OctahedronGeometry(.16),material(0xe9cfff,1));this.scene.add(s);s.visible=false;this.orbit.push(s);}
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.36,.48,.9);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());this.resize();
  }
  environment(){
    const statics=new THREE.Group();this.scene.add(statics);this.statics=statics;
    const ground=new THREE.Mesh(new THREE.CircleGeometry(24,96),new THREE.MeshStandardMaterial({map:groundTexture(),roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;this.scene.add(ground);this.ground=ground;
    new THREE.TextureLoader().load(publicUrl('assets/meadow.png'),tex=>{tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(5,5);tex.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());ground.material.map.dispose();ground.material.map=tex;ground.material.needsUpdate=true;});
    // Irregular floating-island cliff, with a grassy lip and layered stone faces.
    const cliff=new THREE.CylinderGeometry(23.9,13,8,56,4);const p=cliff.attributes.position;
    for(let i=0;i<p.count;i++){const y=p.getY(i),x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x);const n=1+Math.sin(a*7+y*2)*.033+Math.cos(a*11)*.026;p.setXYZ(i,x*n,y,z*n);}cliff.computeVertexNormals();part(statics,cliff,0x718584,0,-4.12,0);
    part(statics,new THREE.CylinderGeometry(24.02,23.8,.32,80),0x668667,0,-.19,0);
    for(let i=0;i<46;i++){const a=i/46*Math.PI*2;part(statics,new THREE.DodecahedronGeometry(rand(1,2)),[0x759087,0x80968c,0x6c837f][i%3],Math.cos(a)*23,-rand(1.3,5),Math.sin(a)*23,[rand(.5,1),rand(1,2),rand(.5,1)]);}
    const stone=stoneTexture();const floor=new THREE.Mesh(new THREE.CylinderGeometry(6.1,6.2,.15,64),new THREE.MeshStandardMaterial({map:stone,roughness:1,color:0xd3d2bd}));floor.position.y=.02;floor.receiveShadow=true;this.scene.add(floor);this.floor=floor;
    const lineMat=new THREE.MeshStandardMaterial({color:0x7b9890,roughness:1});
    for(const r of [2.35,5.35,5.85]){const ring=new THREE.Mesh(new THREE.RingGeometry(r,r+.045,96),lineMat);ring.rotation.x=-Math.PI/2;ring.position.y=.10;this.scene.add(ring);}
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const seam=part(statics,new THREE.BoxGeometry(.035,.012,3.5),0x899c91,Math.sin(a)*4.2,.102,Math.cos(a)*4.2);seam.rotation.y=a;seam.castShadow=false;}
    const star=new THREE.Shape();for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=i%2?1.1:2;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)star.moveTo(x,y);else star.lineTo(x,y);}star.closePath();const starMesh=part(statics,new THREE.ShapeGeometry(star),0x9db4a0,0,.108,0);starMesh.rotation.x=-Math.PI/2;starMesh.castShadow=false;
    // Broken stone road, bordered by low grass rather than invisible obstacles.
    for(let z=-18;z<=18;z+=1.65){if(Math.abs(z)<6)continue;for(let k=-1;k<=1;k++){const tile=part(statics,new THREE.BoxGeometry(1.18,.09,1.35),[0xc0c2ac,0xacb4a0,0xb6bdac][Math.floor(rng()*3)],k*1.3+rand(-.08,.08),.035,z+rand(-.1,.1));tile.rotation.y=rand(-.06,.06);}}
    for(let i=0;i<22;i++){const a=i/22*Math.PI*2;const r=rand(19.6,22.5);const rock=part(statics,new THREE.DodecahedronGeometry(rand(.45,1.05)),0x929f92,Math.cos(a)*r,.25,Math.sin(a)*r,[1,.7,1.3]);rock.rotation.y=rand(0,7);}
    // Portal is a real landmark visible from the battlefield.
    this.portal=new THREE.Group();this.portal.position.set(0,0,-20.4);this.scene.add(this.portal);
    for(let i=0;i<4;i++)part(this.portal,new THREE.BoxGeometry(7-i*.45,.24,3.4-i*.35),0xc9c8b5,0,.12+i*.23,.8-i*.22);
    for(const s of [-1,1]){
      part(this.portal,new THREE.CylinderGeometry(.42,.56,4.4,8),0xb8c3b4,s*2.6,3,0);
      part(this.portal,new THREE.BoxGeometry(1.2,.32,1.2),0xd0ccae,s*2.6,1.1,0);part(this.portal,new THREE.BoxGeometry(1.14,.25,1.14),0xd0ccae,s*2.6,5.15,0);
      for(let j=0;j<3;j++)part(this.portal,new THREE.TorusGeometry(.46,.025,5,16),0xb4a173,s*2.6,1.7+j*1.4,0).rotation.x=Math.PI/2;
      part(this.portal,new THREE.OctahedronGeometry(.42),0xb6f3eb,s*2.6,5.75,0,[.6,1.8,.6],.55,.2);
    }
    part(this.portal,new THREE.TorusGeometry(2.65,.30,10,64,Math.PI),0xc4c8b7,0,5.05,0);
    part(this.portal,new THREE.TorusGeometry(2.65,.045,6,64,Math.PI),0xe8d6a1,0,5.05,.32,null,.3);
    this.portalGlow=part(this.portal,new THREE.TorusGeometry(1.95,.038,8,64),0xa7f6ef,0,3.45,.03,null,1.7);this.portalCore=part(this.portal,new THREE.OctahedronGeometry(.52),0xbbfaff,0,3.45,.1,[.7,1.6,.7],1.1,.3);
    // Tall silhouettes frame the far rim; low shrubs preserve the camera-side sightline.
    for(let i=0;i<17;i++){const a=i/17*Math.PI*2+.1;if(Math.abs(a-Math.PI*1.5)<.24)continue;const r=rand(21,23),x=Math.cos(a)*r,z=Math.sin(a)*r,s=rand(.8,1.35);const nearCamera=x*.53+z*.74>-3;this.tree(statics,x,z,s*(nearCamera?.27:1),i);}
    for(let i=0;i<9;i++){const a=(i/9)*Math.PI*2;const x=Math.cos(a)*20.3,z=Math.sin(a)*20.3;if(z<-18)continue;const h=rand(1.3,3.6)*(x*.53+z*.74>-3?.3:1);part(statics,new THREE.CylinderGeometry(.43,.54,h,7),0xb5beaf,x,h*.5,z);part(statics,new THREE.BoxGeometry(1.25,.23,1.25),0xd1d2bd,x,.23,z);}
    bakeGroup(statics);this.grass();this.flowers();
    const border=new THREE.Mesh(new THREE.RingGeometry(18.52,18.56,160),new THREE.MeshBasicMaterial({color:0xe1eaba,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));border.rotation.x=-Math.PI/2;border.position.y=.03;this.scene.add(border);
    const ambientGeo=new THREE.BufferGeometry(),positions=new Float32Array(150*3);for(let i=0;i<150;i++){positions[i*3]=rand(-24,24);positions[i*3+1]=rand(.5,7);positions[i*3+2]=rand(-24,24);}ambientGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));this.motes=new THREE.Points(ambientGeo,new THREE.PointsMaterial({map:glowTexture(),color:0xf1e5b1,size:.15,transparent:true,depthWrite:false,opacity:.6,blending:THREE.AdditiveBlending}));this.scene.add(this.motes);
  }
  tree(group,x,z,s,i){
    const trunk=part(group,new THREE.CylinderGeometry(.15*s,.29*s,3.1*s,7),0x686c59,x,1.5*s,z);trunk.rotation.z=rand(-.1,.1);
    for(let j=0;j<3;j++){const a=j*2.1;const branch=part(group,new THREE.CylinderGeometry(.07,.14,1.8*s,6),0x6e725e,x+Math.cos(a)*.5*s,2.5*s,z+Math.sin(a)*.5*s);branch.rotation.z=Math.sin(a)*.7;branch.rotation.x=Math.cos(a)*.7;}
    for(let j=0;j<5;j++){const a=j/5*7;const color=i%4===0?[0xb8bb95,0xc7c79e,0xd0d2aa][j%3]:[0x628e78,0x7ba18a,0x91b199][j%3];const crown=part(group,new THREE.DodecahedronGeometry(1.6*s,1),color,x+Math.sin(a)*.95*s,(3.5+(j%2)*.7)*s,z+Math.cos(a)*.85*s,[1,.85,1]);crown.rotation.y=rng()*7;}
  }
  grass(){
    const count=7200,geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.045,0,0,.045,0,0,.055,.19,.02,-.045,0,0,.055,.19,.02,.012,.18,.02,.012,.18,.02,.055,.19,.02,.065,.34,.045, -.12,0,-.08,-.06,0,-.08,-.14,.26,-.06, .07,0,.06,.13,0,.06,.19,.23,.04],3));geometry.computeVertexNormals();
    const mat=new THREE.MeshStandardMaterial({color:0xffffff,side:THREE.DoubleSide,roughness:1});mat.onBeforeCompile=shader=>{shader.uniforms.uTime={value:0};this.grassShader=shader;shader.vertexShader='uniform float uTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x += sin(uTime*1.6 + instanceMatrix[3].x*.6 + instanceMatrix[3].z*.35) * .13 * position.y;');};
    const mesh=new THREE.InstancedMesh(geometry,mat,count);mesh.receiveShadow=true;const dummy=new THREE.Object3D(),color=new THREE.Color();
    for(let i=0;i<count;i++){let x,z;do{x=rand(-23,23);z=rand(-23,23);}while(Math.hypot(x,z)>23||Math.hypot(x,z)<6.4||(Math.abs(x)<2.25));dummy.position.set(x,.02,z);dummy.rotation.y=rng()*7;dummy.scale.setScalar(rand(.55,1.6));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);color.setHSL(rand(.20,.27),rand(.35,.53),rand(.28,.45));mesh.setColorAt(i,color);}mesh.instanceMatrix.needsUpdate=true;this.scene.add(mesh);this.grassMesh=mesh;
  }
  flowers(){
    const geo=new THREE.IcosahedronGeometry(.08,0),mesh=new THREE.InstancedMesh(geo,material(0xf6e7b9),650),dummy=new THREE.Object3D();
    for(let i=0;i<650;i++){let x,z;do{x=rand(-23,23);z=rand(-23,23);}while(Math.hypot(x,z)>23||Math.hypot(x,z)<7||Math.abs(x)<2.5);dummy.position.set(x,rand(.16,.38),z);dummy.scale.set(1,.5,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new THREE.Color([0xefe3b6,0xc4b9df,0xf3d3cd][i%3]));}mesh.receiveShadow=true;this.scene.add(mesh);
  }
  distantIslands(){
    const group=new THREE.Group();this.scene.add(group);this.clouds=[];
    for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=rand(48,100),x=Math.cos(a)*r,z=Math.sin(a)*r,y=rand(-8,3),s=rand(3,8);part(group,new THREE.CylinderGeometry(s,s*.13,s*1.8,7),0x8da5a1,x,y-s*.9,z);part(group,new THREE.CylinderGeometry(s*.99,s,.24,24),0x91b0a0,x,y+.05,z);for(let j=0;j<3;j++)part(group,new THREE.ConeGeometry(s*.23,s*.6,6),0x749b8a,x+rand(-s*.7,s*.7),y+s*.3,z+rand(-s*.7,s*.7));
      if(i%3===0)part(group,new THREE.CylinderGeometry(.27,.4,s*1.2,7),0xc6cec0,x,y+s*.6,z);
      // Luminous water curtains below several far islands.
      if(i%2===0)part(group,new THREE.CylinderGeometry(.18,.5,10,8,1,true),0xcee9e5,x+s*.7,y-5,z+s*.6,[1,1,.5],.25);
    }
    for(let i=0;i<25;i++){const a=rng()*Math.PI*2,r=rand(34,115),x=Math.cos(a)*r,z=Math.sin(a)*r,y=rand(-10,-4);for(let j=0;j<3;j++)part(group,new THREE.SphereGeometry(rand(3,7),12,8),0xd4e6df,x+j*3,y+rand(-1,1),z,[1,.35,.7]);}
    bakeGroup(group);
  }
  makeParticles(){
    this.capacity=1100;this.particleIndex=0;this.particleData=Array.from({length:this.capacity},()=>({life:0,max:1,x:0,y:-100,z:0,vx:0,vy:0,vz:0}));this.particlePositions=new Float32Array(this.capacity*3);this.particleColors=new Float32Array(this.capacity*3);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.particlePositions,3));geo.setAttribute('color',new THREE.BufferAttribute(this.particleColors,3));this.particleMesh=new THREE.Points(geo,new THREE.PointsMaterial({size:.29,map:glowTexture(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));this.particleMesh.frustumCulled=false;this.scene.add(this.particleMesh);
  }
  burst(x,z,color,count=24,force=4){const c=new THREE.Color(color);for(let i=0;i<count;i++){const p=this.particleData[this.particleIndex++%this.capacity],a=rng()*7,r=rand(.4,force);Object.assign(p,{x,y:(this.surface?.height??0)+rand(.25,1.3),z,vx:Math.sin(a)*r,vy:rand(1,4),vz:Math.cos(a)*r,life:rand(.35,.85),max:.85});const k=(this.particleIndex-1)%this.capacity*3;this.particleColors[k]=c.r;this.particleColors[k+1]=c.g;this.particleColors[k+2]=c.b;}}
  ring(x,z,color,size=3,duration=.5,arc=Math.PI*2,angle=0){const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});const mesh=new THREE.Mesh(new THREE.RingGeometry(size*.75,size,64,1,0,arc),mat);mesh.rotation.set(-Math.PI/2,0,-angle+(arc<6?-Math.PI*.75:0));mesh.position.set(x,(this.surface?.height??0)+.18,z);this.fx.add(mesh);this.rings.push({mesh,life:duration,max:duration});}
  handle(events,game){
    if(game){this.surface=game.layout;this.terrain.update(game,this.time);}
    for(const e of events){
      if(e.type==='riceGrab'||e.type==='riceImpact'){this.ring(e.x,e.z,0xaaffba,e.type==='riceImpact'?2.1:1.2,.35);this.burst(e.x,e.z,0xcaffb9,12,2);}
      if(e.type==='attack'){const hero=this.heroes[e.hero];hero.userData.attackTime=ATTACK_DURATION;if(e.hero===1)this.burst(e.x+Math.sin(e.angle)*1.05,e.z+Math.cos(e.angle)*1.05,0xb8f4ff,7,2);if(e.hero===2||e.hero===4||e.hero===5){const slash=createSwordSlash({...e,color:e.color??(e.hero===4?0xf2a6c7:0x85ffae),name:e.hero===4?'shizuku-scythe-slash':'omsolo-saber-slash'});slash.mesh.position.y+=game.layout.height;this.fx.add(slash.mesh);this.rings.push(slash);}}
      if(e.type==='hit'){this.burst(e.x,e.z,e.crit?0xffdd99:0xc8eef5,e.crit?12:5,2.4);this.numbers.push({x:e.x,y:(this.surface?.height??0)+2.25,z:e.z,text:e.damage,crit:e.crit,life:.7,max:.7});if(this.numbers.length>40)this.numbers.shift();}
      if(e.type==='death'){this.burst(e.x,e.z,e.enemyType==='boss'||e.enemyType==='goldenSlime'?0xffe3a8:0xb6ead3,e.enemyType==='boss'?150:23,4);this.ring(e.x,e.z,0xc8f5d3,1.1,.35);}
      if(e.type==='dash'){this.burst(e.x,e.z,0xcde7ff,24,1.8);this.ring(e.x,e.z,0xcdeaff,1.4,.3);}
      if(e.type==='switch'){this.ring(e.x,e.z,0xe2c6ff,2.1,.55);this.burst(e.x,e.z,0xdeccff,30,2);}
      if(e.type==='prismBeam'){const dragon=this.heroes[5];dragon.rotation.y=e.angle;dragon.updateMatrixWorld(true);const mouth=new THREE.Vector3();dragon.userData.bones.get('head').bone.getWorldPosition(mouth);mouth.add(new THREE.Vector3(0,-.18,.65).multiplyScalar(dragon.scale.x).applyAxisAngle(new THREE.Vector3(0,1,0),e.angle));const beam=prismBeamVisual({...e,mouth},game.layout.height);this.fx.add(beam.mesh);this.rings.push(beam);this.heroes[5].userData.attackTime=ATTACK_DURATION;}
      if(e.type==='predationPulse'){this.ring(e.x,e.z,0xffafd4,e.radius,.3);this.burst(e.x,e.z,0xffd47f,28,4);}
      if(e.type==='predationPower'){this.burst(game.player.x,game.player.z,0xffdf83,12,2);this.numbers.push({x:game.player.x,y:game.layout.height+3.2,z:game.player.z,text:`攻撃↑ ${e.kills}`,crit:false,life:.8,max:.8});}
      if(e.type==='predationStart'||e.type==='predationEnd')this.burst(game.player.x,game.player.z,0xffafd4,65,4);
      if(e.type==='mountStart'||e.type==='mountEnd')this.burst(game.player.x,game.player.z,0xbceaff,35,3);
      if(e.type==='ultimate'){this.shake=this.settings.motion===false?0:(e.hero===0?.38:.22);const color=e.duet?0xe6b9ff:e.heroId==='shizuku'?0xf2a6c7:e.hero===0?0xe8c3ff:e.hero===2?0x9dffb8:0x95f2ff;this.burst(e.x,e.z,color,65,e.hero===0?7:3);this.ring(e.x,e.z,color,e.hero===0?3:1.8,.55);}
      if(e.type==='saberPulse'){
        for(const id of e.heroIds??[e.heroId??'omsolo']){const hero=this.heroes[HEROES.findIndex(h=>h.id===id)];if(hero)hero.userData.attackTime=ATTACK_DURATION;}
        const color=e.heroId==='shizuku'?0xf2a6c7:0x85ffae;this.ring(e.x,e.z,color,e.radius,.3);this.burst(e.x,e.z,color,36,4);
        if(e.kind==='moonDrop'){this.ring(e.x,e.z,0xd7b6ff,e.radius*.78,.45);this.burst(e.x,e.z,0xe6cfff,32,5);}
      }
      if(e.type==='rareSpawn'){this.burst(e.x,e.z,0xffdb70,36,3);this.ring(e.x,e.z,0xffd56b,2,.8);}
      if(e.type==='rareEscape'){this.burst(e.x,e.z,0xffe7ae,24,2);this.ring(e.x,e.z,0xffe7ae,1.2,.6);}
      if(e.type==='rareDefeated'){this.burst(e.x,e.z,0xffd467,90,5);this.ring(e.x,e.z,0xffe4a3,3,.8);}
      if(e.type==='lifeDrain'){this.ring(e.x,e.z,0xef99b6,.8,.35);this.numbers.push({x:e.x,y:(this.surface?.height??0)+2.5,z:e.z,text:`吸収 +${Math.round(e.amount)}`,crit:false,life:.75,max:.75});}
      if(e.type==='mochiCryHit'){this.ring(e.x,e.z,0xffbddb,e.boss?2:1,.6);this.numbers.push({x:e.x,y:(this.surface?.height??0)+2.7,z:e.z,text:e.boss?'攻↓ 防↓':'すやぁ…',crit:false,life:.85,max:.85});}
      if(e.type==='ultimatePulse'){this.ring(e.x,e.z,e.heroId==='shizuku'?0xf2a6c7:e.heroId==='mochinyafe'?0xffb8d4:0xe8c3ff,e.radius,.5);this.burst(e.x,e.z,0xe3c5ff,44,6);}
      if(e.type==='ultimateShot'){this.heroes[1].userData.attackTime=ATTACK_DURATION;this.burst(e.x+Math.sin(e.angle)*1.05,e.z+Math.cos(e.angle)*1.05,0xb8f4ff,14,3);}
      if(e.type==='hurt')this.shake=this.settings.motion===false?0:.18;
      if(e.type==='nova')this.ring(e.x,e.z,0xffdda3,e.radius??3.8,.4);
      if(e.type==='hazard'){
        if(e.shape==='line'){for(let z=-e.length/2;z<=e.length/2;z+=2)this.burst(e.x+Math.sin(e.angle)*z,e.z+Math.cos(e.angle)*z,e.color??0xffbcd4,5,2);}
        else if(e.shape==='ring'){
          // Keep the safe centre empty when the annular hit resolves, too.
          const mesh=createTelegraph({...e,kind:'shockwave',timer:0,total:1});mesh.position.set(e.x,(this.surface?.height??0),e.z);this.fx.add(mesh);this.rings.push({mesh,kind:'shockwave',life:.4,max:.4});
        }
        else{this.ring(e.x,e.z,e.color??0xffa3b4,e.radius,.4);this.burst(e.x,e.z,e.color??0xffbcd4,18,3);}
      }
      if(e.type==='enemyShot')this.burst(e.x,e.z,e.color,5,1.5);
      if(e.type==='passageEntered'){this.particleData.forEach(p=>p.life=0);for(const r of this.rings){r.mesh.removeFromParent();r.mesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}this.rings=[];this.numbers=[];}
      if(e.type==='stageEntered')this.cameraTarget.set(game.player.x*FIELD_CAMERA.follow,game.layout.height,game.player.z*FIELD_CAMERA.follow);
      if(e.type==='wave'&&this.area!==(e.theme??e.area)){this.area=e.theme??e.area;this.fields.setArea(this.area,{immediate:this.settings.motion===false||e.wave===1});}
    }
  }
  syncMap(map,list,create,update){const ids=new Set();for(const data of list){ids.add(data.id);let mesh=map.get(data.id);if(!mesh){mesh=create(data);map.set(data.id,mesh);this.scene.add(mesh);}update(mesh,data);}for(const [id,mesh] of map)if(!ids.has(id)){mesh.removeFromParent();if(mesh.userData.disposable){mesh.traverse(o=>{o.geometry?.dispose();if(o.material&&!materialsShared(o.material))o.material.dispose();});}map.delete(id);}}
  render(game,dt){
    this.renderer.info.reset();this.terrain.update(game,this.time);if(game)this.surface=game.layout;this.time+=dt;const t=this.time;this.shake=Math.max(0,this.shake-dt);
    if(game){
      const p=game.player;this.heroes.forEach((h,i)=>{h.visible=game.isHeroAlive(i);if(h.visible){setHeroWeapon(h,equippedWeapon(game.progression,game.heroId(i)));animateHero(h,{...(i===p.hero?p:game.partner),moving:game.phase==='playing'&&(i===p.hero?p:game.partner).moving,riding:game.mount.active&&i===1,mounted:game.mount.active&&i===5,...(i===5&&game.ultimateEffects.some(e=>e.kind==='prismBeam')?{face:game.ultimateEffects.find(e=>e.kind==='prismBeam').angle}:{})},t,dt,i===p.hero||game.mount.active);const source=i===p.hero?p:game.partner;h.position.y=heightAt(game.layout,source.x,source.z);}});
      this.heheForm.visible=!!game.predation.active&&game.isHeroAlive(6);if(this.heheForm.visible){this.heroes[6].visible=false;updateHeheForm(this.heheForm,this.heroes[6],{...p,dancing:game.ultimateEffects.some(e=>e.kind==='predationDance')},t,dt,equippedWeapon(game.progression,'hehereal'));}
      if(game.mount.active){
        const dragon=this.heroes[5],rider=this.heroes[1];const facing=game.ultimateEffects.find(e=>e.kind==='prismBeam')?.angle??p.face;dragon.rotation.y=facing;rider.rotation.y=facing;dragon.updateMatrixWorld(true);
        const seat=new THREE.Vector3();dragon.userData.bones.get('chest').bone.getWorldPosition(seat);seat.add(new THREE.Vector3(0,.68,-.9).applyAxisAngle(new THREE.Vector3(0,1,0),facing));
        rider.updateMatrixWorld(true);const hips=new THREE.Vector3(),rightHip=new THREE.Vector3();rider.userData.bones.get('thigh.L').bone.getWorldPosition(hips);rider.userData.bones.get('thigh.R').bone.getWorldPosition(rightHip);hips.add(rightHip).multiplyScalar(.5);rider.position.add(seat.sub(hips));rider.userData.ring.visible=false;
      }else this.heroes[1].userData.ring.visible=true;
      if(game.rescue&&!game.partyHeroes.includes(2)&&game.phase!=='victory'){
        const injured=this.heroes[2];injured.visible=true;animateWoundedHero(injured,game.rescue,t,dt);injured.position.y=game.layout.height;
      }
      if(this.rescueDome){this.rescueDome.visible=!!game.rescue&&game.phase!=='victory';if(game.rescue){this.rescueDome.position.set(game.rescue.x,game.layout.height+.7,game.rescue.z);this.rescueDome.material.opacity=game.rescue.saved?.13:.12+Math.sin(t*3)*.025;}}
      if(game.act===11&&game.area===2&&!game.partyHeroes.includes(3)&&game.phase!=='victory'){const mochi=this.heroes[3],saved=game.exitOpen;mochi.visible=true;animateHero(mochi,{x:-4,z:-7,face:.5,moving:false,invincible:0},t,dt,false);mochi.position.y=game.layout.height;mochi.userData.slimeBody.rotation.y+=saved?Math.sin(t*4)*.05:Math.sin(t*20)*.025;this.rescueDome.visible=!saved;this.rescueDome.position.set(-4,game.layout.height+.6,-7);this.rescueDome.material.opacity=.2;}
      const target=new THREE.Vector3(p.x*FIELD_CAMERA.follow,heightAt(game.layout,p.x,p.z),p.z*FIELD_CAMERA.follow);if(game.mount.active){const facing=this.heroes[5].rotation.y;target.add(new THREE.Vector3(Math.sin(facing)*1.6,1.1,Math.cos(facing)*1.6));}this.cameraTarget.lerp(target,1-Math.exp(-dt*FIELD_CAMERA.followSpeed));
      this.syncMap(this.entities,game.enemies,e=>{const g=createEnemy(e.type,e.bossId);g.userData.disposable=true;if(e.elite){g.scale.setScalar(1.12);const halo=new THREE.Mesh(new THREE.TorusGeometry(1.95,.08,6,48),material(0xff6688,1));halo.rotation.x=-Math.PI/2;halo.position.y=.18;g.add(halo);}return g;},(mesh,e)=>{animateEnemy(mesh,e,t);mesh.position.y=game.layout.height;});
      this.syncMap(this.bullets,game.projectiles,b=>{if(b.owner==='enemy')return createHostileProjectile(b);if(b.kind==='magicArrow')return createMagicArrow();const g=new THREE.Mesh(b.kind==='mochiCry'?new THREE.TorusGeometry(.72,.065,6,24):b.kind==='gun'?new THREE.CylinderGeometry(b.ultimate?.1:.065,b.ultimate?.1:.065,b.ultimate?1.7:.78,8):new THREE.SphereGeometry(b.kind==='mochiNote'?.24:b.owner==='player'?.16:.27,12,8),material(b.kind==='mochiCry'?0xffbad8:b.kind==='mochiNote'?(b.color??0xffbad8):b.kind==='gun'?(b.ultimate?0xe1fbff:0x99efff):b.owner==='player'?0xe2c3ff:0xffa8c7,1.4));if(b.kind==='gun')g.rotation.x=Math.PI/2;g.userData.disposable=true;return g;},(m,b)=>{if(b.owner==='enemy'){updateHostileProjectile(m,b,t);m.position.y+=game.layout.height;return;}m.position.set(b.x,game.layout.height+(['gun','magicArrow'].includes(b.kind)?1.45:.9),b.z);if(b.kind==='magicArrow')m.rotation.y=Math.atan2(b.vx,b.vz);if(b.kind==='gun')m.rotation.set(Math.PI/2,0,-Math.atan2(b.vx,b.vz));m.scale.setScalar(1+Math.sin(t*18)*.15);});
      this.syncMap(this.orbMeshes,game.orbs,o=>{const m=new THREE.Mesh(new THREE.OctahedronGeometry(o.value>1?.18:.13),material(0xc7f3ce,.7));m.userData.disposable=true;return m;},(m,o)=>{m.position.set(o.x,game.layout.height+.3+Math.sin(t*4+o.id)*.1,o.z);m.rotation.y=t;});
      this.syncMap(this.hazardMeshes,game.hazards,createTelegraph,(m,h)=>{updateTelegraph(m,h);m.position.y=game.layout.height;});
      this.syncMap(this.ultimateMeshes,game.ultimateEffects.filter(e=>e.kind==='sanctuary'),createSanctuary,(m,e)=>{updateSanctuary(m,e);m.position.y+=game.layout.height;});
      this.orbit.forEach((s,i)=>{s.visible=i<game.effectRank('orbit');const a=game.time*2.3+i/Math.max(1,game.effectRank('orbit'))*Math.PI*2;s.position.set(p.x+Math.cos(a)*2.5,game.layout.height+1.0+Math.sin(t*3)*.15,p.z+Math.sin(a)*2.5);s.rotation.y=t*2;});
    }else{this.heheForm.visible=false;if(this.rescueDome)this.rescueDome.visible=false;this.heroes.forEach((h,i)=>{h.visible=i<2;animateHero(h,{x:i===0?-1.1:1.1,z:i===0?0:.3,face:.35,moving:false,invincible:0},t,dt,i===0);});}
    this.camera.position.copy(this.cameraTarget).add(FIELD_CAMERA.offset);if(this.shake>0){this.camera.position.x+=Math.sin(t*72)*this.shake*.4;this.camera.position.y+=Math.cos(t*88)*this.shake*.3;}
    this.camera.lookAt(this.cameraTarget.x,this.cameraTarget.y+FIELD_CAMERA.lookHeight,this.cameraTarget.z);
    if(this.tutorialFraming!==!!game?.tutorial?.active){
      this.tutorialFraming=!!game?.tutorial?.active;
      resizeFieldCamera(this.camera,this.canvas.clientWidth,this.canvas.clientHeight,this.tutorialFraming);
    }
    this.fields.update(dt,this.cameraTarget,this.settings.motion!==false);this.stageGate.update(game,t);
    const held=game?.rice?.held;this.riceRing.visible=!!held;
    if(held){const object=held.object;this.riceRing.position.set(object.x,heightAt(game.layout,object.x,object.z)+.25,object.z);this.riceRing.scale.setScalar(Math.max(.65,object.radius??.65)+.3);if(held.kind==='enemy'){const mesh=this.entities.get(object.id);if(mesh)mesh.position.y+=.4;}}
    if(this.grassShader)this.grassShader.uniforms.uTime.value=t;this.portalCore.rotation.y=t*.7;this.portalCore.position.y=3.45+Math.sin(t*1.5)*.18;this.portalGlow.rotation.z=t*.1;this.motes.rotation.y=t*.008;
    for(let i=this.rings.length-1;i>=0;i--){const r=this.rings[i];if(r.kind==='sword-slash')updateSwordSlash(r,dt);else if(r.prism){const dragon=this.heroes[5];dragon.updateMatrixWorld(true);dragon.userData.bones.get('head').bone.getWorldPosition(r.mesh.position);r.mesh.position.add(new THREE.Vector3(0,-.18,.65).multiplyScalar(dragon.scale.x).applyAxisAngle(new THREE.Vector3(0,1,0),r.mesh.rotation.y));r.life-=dt;r.mesh.traverse(o=>{if(o.material)o.material.opacity=Math.max(0,r.life/r.max)*.65;});}else if(r.kind==='shockwave'){r.life-=dt;r.mesh.traverse(o=>{if(o.material)o.material.opacity=Math.max(0,r.life/r.max)*.7;});}else{r.life-=dt;r.mesh.material.opacity=Math.max(0,r.life/r.max)*.8;r.mesh.scale.setScalar(.7+(1-r.life/r.max)*.65);}if(r.life<=0){r.mesh.removeFromParent();r.mesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.rings.splice(i,1);}}
    for(let i=0;i<this.capacity;i++){const p=this.particleData[i];p.life-=dt;if(p.life>0){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=5*dt;this.particlePositions[i*3]=p.x;this.particlePositions[i*3+1]=p.y;this.particlePositions[i*3+2]=p.z;}else this.particlePositions[i*3+1]=-100;}
    this.particleMesh.geometry.attributes.position.needsUpdate=true;this.particleMesh.geometry.attributes.color.needsUpdate=true;
    this.numbers=this.numbers.filter(n=>{n.life-=dt;n.y+=dt*1.4;return n.life>0;});
    if(this.settings.quality==='low')this.renderer.render(this.scene,this.camera);else this.composer.render();
  }
  project(x,y,z){const v=new THREE.Vector3(x,y,z).project(this.camera);return {x:(v.x*.5+.5)*this.canvas.clientWidth,y:(-v.y*.5+.5)*this.canvas.clientHeight,visible:v.z<1};}
  stagePoint(clientX,clientY,game,lift=1.3){
    const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;
    const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),this.camera);
    const point=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-(game.layout.height+lift)),new THREE.Vector3());
    return point?{x:point.x,z:point.z}:null;
  }
  pickRice(clientX,clientY,game){
    const rect=this.canvas.getBoundingClientRect(),x=clientX-rect.left,y=clientY-rect.top,ground=this.stagePoint(clientX,clientY,game,0),candidates=[];
    for(const target of riceTargets(game)){
      const {kind,object}=target,centre=this.project(object.x,game.layout.height+(kind==='enemy'?(object.type==='boss'?2:1.2):kind==='bullet'?.9:.12),object.z);
      if(!centre.visible)continue;
      const edge=this.project(object.x+(object.radius??.4),game.layout.height+1.2,object.z),radius=kind==='enemy'?Math.max(26,Math.abs(edge.x-centre.x)*1.15):23,distance=Math.hypot(x-centre.x,y-centre.y);
      if(kind==='hazard'){if(ground&&distanceToHazard(ground.x,ground.z,object)<.25)candidates.push({...target,score:2+distance/1000});}
      else if(distance<=radius)candidates.push({...target,score:distance/radius+(kind==='enemy'?.1:0)});
    }
    return candidates.sort((a,b)=>a.score-b.score)[0]??null;
  }
  resize(){const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight);this.renderer.setSize(w,h,false);resizeFieldCamera(this.camera,w,h,this.tutorialFraming);this.composer?.setSize(w,h);}
  setQuality(quality){this.settings.quality=quality;this.renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.65));this.renderer.shadowMap.enabled=quality!=='low';this.resize();}
  reset(){this.heheForm.visible=false;this.riceRing.visible=false;this.rescueDome.visible=false;this.terrain.update(null,0);for(const map of [this.entities,this.bullets,this.orbMeshes,this.hazardMeshes,this.ultimateMeshes])this.syncMap(map,[],()=>{},()=>{});for(const r of this.rings){r.mesh.removeFromParent();r.mesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}this.rings=[];this.numbers=[];this.particleData.forEach(p=>p.life=0);this.cameraTarget.set(0,0,0);this.area=-1;this.fields.setArea(0,{immediate:true});this.stageGate.update(null,0);this.orbit.forEach(o=>o.visible=false);this.heroes.forEach(h=>{h.visible=true;h.scale.setScalar(1);h.userData.rig.visible=true;h.userData.attackTime=0;h.userData.movement=0;});}
  stats(){return {calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures};}
}
function materialsShared(mat){return mat instanceof THREE.MeshStandardMaterial;}
