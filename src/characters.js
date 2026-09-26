import * as THREE from 'three';
import {buildDemonEnemy,DEMON_ENEMIES,DEMON_BOSSES} from './chapter-four-enemies.js';
import {buildMochiEnemy,MOCHI_ENEMIES,MOCHI_BOSSES} from './chapter-three-enemies.js';
import {buildChapterTwoBoss} from './chapter-two-bosses.js';
import {buildCountryEnemy} from './chapter-two-enemies.js';
import {CHAPTER_TWO_ENEMIES,ENEMY_TYPES} from './enemies.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {mochiSlimePose} from './mochi-motion.js';
const materials=new Map();
export function material(color,emissive=0,metal=0){const key=`${color}-${emissive}-${metal}`;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:metal?.38:.88,metalness:metal,emissive:color,emissiveIntensity:emissive}));return materials.get(key);}
export function part(parent,geometry,color,x=0,y=0,z=0,scale=null,emissive=0,metal=0){const m=new THREE.Mesh(geometry,material(color,emissive,metal));m.position.set(x,y,z);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const sphere=(r=1)=>new THREE.SphereGeometry(r,16,12);
const cylinder=(r1,r2,h,n=16)=>new THREE.CylinderGeometry(r1,r2,h,n);
function ball(parent,c,x,y,z,s){return part(parent,sphere(),c,x,y,z,s);}
function tube(parent,points,r,color){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return part(parent,new THREE.TubeGeometry(curve,12,r,6,false),color);}
export function bakeGroup(group){
  const byMaterial=new Map();group.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(group.matrixWorld).invert();
  group.traverse(o=>{if(o.isMesh&&!o.userData.dynamic){const key=o.material.uuid+'-'+o.castShadow;if(!byMaterial.has(key))byMaterial.set(key,{mat:o.material,castShadow:o.castShadow,geos:[],meshes:[]});const data=byMaterial.get(key);let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.deleteAttribute('uv');geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));data.geos.push(geo);data.meshes.push(o);}});
  for(const {mat,castShadow,geos,meshes} of byMaterial.values()){if(geos.length<2){geos.forEach(g=>g.dispose());continue;}const geo=mergeGeometries(geos);geos.forEach(g=>g.dispose());if(!geo)continue;meshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();});const m=new THREE.Mesh(geo,mat);m.castShadow=castShadow;m.receiveShadow=true;group.add(m);}
}
export function createEnemy(type,bossId='eclipse'){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);let wings=[],rotors=[],focus=null;
  if(DEMON_ENEMIES[type]||type==='boss'&&DEMON_BOSSES[bossId]){({focus,wings,rotors}=buildDemonEnemy(type,bossId,root,body,{part,ball,tube}));
  }else if(type==='goldenSlime'||MOCHI_ENEMIES[type]||type==='boss'&&MOCHI_BOSSES[bossId]){({focus,wings,rotors}=buildMochiEnemy(type,bossId,root,body,{part,ball,tube}));
  }else if(CHAPTER_TWO_ENEMIES.includes(type)){
    ({focus,wings,rotors}=buildCountryEnemy(type,root,body,{part,ball,tube,bakeGroup}));
  }else if(type==='moss'){
    ball(body,0x4d9d87,0,.58,0,[.61,.58,.55]);ball(body,0x9dd69a,0,.44,.28,[.47,.32,.34]);
    for(const s of [-1,1]){ball(body,0x247564,s*.40,.12,.21,[.26,.13,.29]);ball(body,0x173d3b,s*.21,.68,.48,[.075,.10,.045]);ball(body,0xe1ffcc,s*.23,.71,.515,[.024,.027,.015]);}
    part(body,new THREE.OctahedronGeometry(.2),0xa9e388,0,1.17,0,[.5,1.35,.5]);
    for(const s of [-1,1]){const leaf=ball(body,0x78bd83,s*.16,1.1,0,[.27,.07,.12]);leaf.rotation.z=s*.5;}
  }else if(type==='bat'){
    ball(body,0x795b9f,0,1.12,0,[.42,.45,.4]);
    for(const s of [-1,1]){part(body,new THREE.ConeGeometry(.15,.35,3),0xa985ca,s*.23,1.55,0);ball(body,0xf9cc89,s*.16,1.18,.36,[.072,.09,.038]);
      const wing=new THREE.Group();wing.position.set(s*.33,1.23,0);root.add(wing);wings.push(wing);
      const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(s*.9,.4);shape.lineTo(s*.82,-.25);shape.quadraticCurveTo(s*.55,-.05,s*.42,-.4);shape.quadraticCurveTo(s*.2,-.16,0,-.27);
      const m=part(wing,new THREE.ExtrudeGeometry(shape,{depth:.05,bevelEnabled:false}),0x8e75b0);m.rotation.y=s*.3;bakeGroup(wing);
    }
  }else if(type==='golem'){
    part(body,new THREE.DodecahedronGeometry(.80),0x697b7f,0,.84,0,[1,1.16,.78]);
    part(body,new THREE.OctahedronGeometry(.29),0xffc77d,0,1.05,.63,[1,1.15,.35],.8);
    for(const s of [-1,1]){part(body,new THREE.DodecahedronGeometry(.38),0x809494,s*.83,.75,.04,[.85,1.3,1]);part(body,new THREE.DodecahedronGeometry(.33),0x536768,s*.4,.24,.13);ball(body,0xeeeac0,s*.24,1.47,.49,[.13,.04,.025]);}
    part(body,new THREE.DodecahedronGeometry(.3),0x86aa87,.25,1.57,-.08,[1,.5,1]);
  }else if(type==='archer'){
    // A hood, tall quiver and curved bow read clearly above the arena floor.
    part(body,cylinder(.27,.5,.75,9),0x284b43,0,.72,0);
    ball(body,0x416454,0,1.33,0,[.42,.47,.36]);ball(body,0x102c31,0,1.3,.27,[.3,.27,.16]);
    for(const sign of [-1,1]){ball(body,0xffcd80,sign*.12,1.34,.408,[.065,.04,.04]);ball(body,0x594b40,sign*.23,.16,.1,[.19,.17,.29]);part(body,cylinder(.12,.12,.52,8),0x72856b,sign*.45,.93,.12);}
    part(body,cylinder(.19,.22,.78,8),0x735038,-.22,1.05,-.36).rotation.z=-.2;
    for(let i=0;i<3;i++){part(body,cylinder(.024,.024,.9,5),0xdcc497,-.36+i*.13,1.35,-.37);part(body,new THREE.ConeGeometry(.07,.18,4),0xecae5a,-.36+i*.13,1.82,-.37);}
    tube(body,[[.64,.35,.33],[.93,.85,.42],[.88,1.25,.43],[.65,1.67,.32]],.07,0xbe995d);
    tube(body,[[.65,.35,.32],[.52,1,.28],[.65,1.67,.32]],.012,0xf8ddb1);
    part(body,new THREE.ConeGeometry(.1,.28,4),0xffbd75,.68,1.04,.67).rotation.x=Math.PI/2;
    focus=part(body,new THREE.OctahedronGeometry(.12),0xffc17d,.67,1.04,.64,null,.8);focus.userData.dynamic=true;
  }else if(type==='mage'){
    part(body,new THREE.ConeGeometry(.57,1.22,10),0x684d8d,0,.72,0);
    part(body,new THREE.TorusGeometry(.4,.05,5,18),0xd7b575,0,.38,0).rotation.x=Math.PI/2;
    ball(body,0x232a49,0,1.26,.07,[.32,.3,.3]);
    for(const sign of [-1,1]){ball(body,0xf6bfff,sign*.12,1.28,.347,[.055,.055,.035]);part(body,new THREE.ConeGeometry(.2,.53,7),0x8460a7,sign*.43,.89,.03).rotation.z=sign*.7;}
    part(body,cylinder(.57,.57,.085,18),0x9675b8,0,1.48,0);
    const hat=part(body,new THREE.ConeGeometry(.42,.95,9),0x79509a,-.09,1.94,-.02);hat.rotation.z=.25;
    part(body,new THREE.TorusGeometry(.34,.04,5,16),0xe8c185,0,1.56,0).rotation.x=Math.PI/2;
    part(body,cylinder(.045,.055,1.62,7),0xc29b6c,.62,.9,.12);
    part(body,new THREE.TorusGeometry(.23,.035,5,16),0xe7c885,.62,1.86,.12);
    focus=part(body,new THREE.OctahedronGeometry(.18),0xd7a0ff,.62,1.85,.12,[.8,1.25,.8],1);focus.userData.dynamic=true;
    part(body,new THREE.BoxGeometry(.38,.12,.31),0xd8c8a9,-.5,1.01,.33).rotation.z=-.3;
  }else if(type==='charger'){
    ball(body,0x885a43,0,.57,0,[.71,.43,.98]);ball(body,0xca8757,0,.6,.68,[.54,.36,.52]);
    part(body,new THREE.DodecahedronGeometry(.65),0x765b55,0,.83,-.19,[1.1,.56,1.3]);
    for(const sign of [-1,1]){for(const z of [-.57,.5])ball(body,0x584a4b,sign*.52,.2,z,[.2,.24,.3]);ball(body,0xffd091,sign*.3,.77,.97,[.075,.07,.04]);part(body,new THREE.ConeGeometry(.13,.45,7),0xf0d2a2,sign*.4,.64,1.02).rotation.x=.75;}
    part(body,new THREE.ConeGeometry(.2,.66,7),0xf2d6a8,0,.83,1.13).rotation.x=.85;
    for(let i=0;i<3;i++)part(body,new THREE.ConeGeometry(.14,.42,5),0xd99b69,0,1.12,-.65+i*.35);
    tube(body,[[0,.63,-.87],[.1,.9,-1.22],[.22,.86,-1.4]],.08,0x8b6553);
  }else if(['thornmaw','basalt','ironbell','colossus'].includes(bossId)){
    focus=buildChapterTwoBoss(body,bossId,{part,ball,tube});
  }else if(bossId==='treant'){
    part(body,cylinder(.8,1.05,2.35,9),0x655345,0,1.5,0);
    ball(body,0x547b55,0,2.86,-.22,[1.24,.62,.92]);
    part(body,new THREE.DodecahedronGeometry(.66),0x917459,0,2.39,.35,[1,.9,.7]);
    for(const sign of [-1,1]){
      tube(body,[[sign*.74,1.95,0],[sign*1.45,1.58,.04],[sign*1.67,.66,.46]],.29,0x796149);
      tube(body,[[sign*.44,2.82,0],[sign*.85,3.48,-.09],[sign*1.38,3.95,-.14]],.12,0xab9764);
      tube(body,[[sign*.85,3.48,-.09],[sign*.52,3.86,.04]],.075,0xab9764);
      ball(body,0xf8d991,sign*.22,2.62,.84,[.13,.05,.04]);
      tube(body,[[sign*.54,.74,0],[sign*.98,.18,.61],[sign*1.56,.12,1.02]],.24,0x6c5844);
      for(let i=0;i<2;i++)ball(body,0x7caa66,sign*(1.14+i*.24),3.4+i*.2,-.06,[.5,.23,.35]);
    }
    part(body,new THREE.TorusGeometry(.46,.085,6,20),0xe8c887,0,1.79,.91);
    focus=part(body,new THREE.OctahedronGeometry(.36),0xadf0a4,0,1.78,.99,[.85,1.3,.6],.8);focus.userData.dynamic=true;
    part(body,new THREE.BoxGeometry(.1,.58,.1),0xf2d08a,0,1.1,1.02);
    part(body,new THREE.BoxGeometry(.34,.11,.1),0xf2d08a,.11,.9,1.02);
  }else if(bossId==='chronarch'){
    // Floating clockwork instead of the stone humanoid silhouette.
    const clock=new THREE.Group();clock.position.y=2.35;body.add(clock);
    part(clock,new THREE.TorusGeometry(1.25,.17,8,40),0xc79951);
    part(clock,new THREE.TorusGeometry(.98,.055,6,36),0xffde9b,0,0,0,null,.25);
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const tooth=part(clock,new THREE.BoxGeometry(.24,.32,.25),0xe3bf73,Math.sin(a)*1.4,Math.cos(a)*1.4,0);tooth.rotation.z=-a;}
    part(clock,new THREE.CylinderGeometry(.3,.56,.62,8),0x87dfe3,0,.4,0).rotation.z=Math.PI;
    part(clock,new THREE.CylinderGeometry(.3,.56,.62,8),0x87dfe3,0,-.4,0);
    for(const y of [-.79,.79])part(clock,new THREE.BoxGeometry(1.25,.14,.46),0xb99b65,0,y,0);
    for(const x of [-.56,.56])part(clock,cylinder(.055,.055,1.58,6),0xe0c68e,x,0,0);
    const hands=new THREE.Group();hands.position.z=.35;clock.add(hands);rotors.push(hands);
    part(hands,new THREE.BoxGeometry(.09,.97,.08),0xffe1a1,0,.4,0).userData.dynamic=true;
    part(hands,new THREE.BoxGeometry(.7,.07,.08),0xffe1a1,.29,0,.03).userData.dynamic=true;
    for(const sign of [-1,1]){tube(body,[[sign*1.25,2.2,0],[sign*1.72,1.8,.1],[sign*1.75,1.22,.2]],.09,0xab874b);part(body,new THREE.OctahedronGeometry(.3),0x89e2e3,sign*1.75,1.05,.2,[.8,1.6,.8],.6);}
    focus=part(body,new THREE.OctahedronGeometry(.3),0xffd478,0,.51,0,[.8,1.4,.8],.9);focus.userData.dynamic=true;
    part(body,new THREE.ConeGeometry(.45,.65,8),0xdab776,0,4.16,0);
  }else if(bossId==='tempest'){
    ball(body,0x86acbb,0,1.37,0,[.76,.62,1.23]);ball(body,0xb1d5d6,0,1.5,.82,[.52,.48,.78]);
    ball(body,0x65869c,0,1.62,1.39,[.35,.28,.5]);
    for(const sign of [-1,1]){
      ball(body,0xffcc84,sign*.28,1.72,1.38,[.075,.07,.08]);
      part(body,new THREE.ConeGeometry(.14,.64,7),0xf4dfb3,sign*.3,2.02,.9).rotation.z=-sign*.3;
      tube(body,[[sign*.48,1.35,.2],[sign*.7,.79,.59],[sign*.94,.64,.98]],.13,0x6a8b9e);
      const wing=new THREE.Group();wing.position.set(sign*.58,1.68,-.18);root.add(wing);wings.push(wing);
      const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(sign*2.35,.82);shape.lineTo(sign*2.05,-.46);shape.lineTo(sign*1.23,-.08);shape.lineTo(sign*.67,-.69);shape.lineTo(0,-.27);shape.closePath();
      part(wing,new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:false}),0xa9d7dd);
      tube(wing,[[0,0,0],[sign*1.18,.6,0],[sign*2.35,.82,0]],.065,0xe1e0ba);
      for(let i=0;i<3;i++)part(wing,new THREE.ConeGeometry(.1,.55,4),0xecdfb9,sign*(.8+i*.53),-.23-i*.03,0).rotation.z=sign*.65;
      bakeGroup(wing);
    }
    tube(body,[[0,1.37,-.8],[0,1.34,-1.64],[.36,1.76,-2.05],[.7,1.96,-2.35]],.15,0x779fae);
    for(let i=0;i<4;i++)part(body,new THREE.ConeGeometry(.14,.44,5),0xf0d2a3,0,2.02,-.82+i*.4);
    focus=part(body,new THREE.OctahedronGeometry(.25),0xffd794,0,1.77,1.87,[.8,.8,1.3],.7);focus.userData.dynamic=true;
  }else{
    part(body,new THREE.DodecahedronGeometry(1.26),0x4e697b,0,1.78,0,[1,1.25,.86]);
    focus=part(body,new THREE.OctahedronGeometry(.73),0x91dfea,0,1.9,1,[.77,1.2,.38],.7,.3);focus.userData.dynamic=true;
    for(const s of [-1,1]){
      part(body,new THREE.DodecahedronGeometry(.73),0x7f9ea5,s*1.39,2.07,0,[.9,1.1,1]);part(body,new THREE.DodecahedronGeometry(.62),0x466270,s*1.55,1.18,.1,[.75,1.3,.8]);
      part(body,new THREE.DodecahedronGeometry(.57),0x485e6d,s*.67,.43,.12,[.82,.88,1.1]);
      tube(body,[[s*.54,2.8,0],[s*.83,3.48,-.1],[s*1.35,3.87,-.23]],.105,0xdbcb9c);
      tube(body,[[s*.89,3.5,-.1],[s*.74,3.83,-.1],[s*.78,4.09,-.1]],.07,0xdbcb9c);
      ball(body,0xf1dfac,s*.24,2.97,.63,[.19,.045,.04]);part(body,new THREE.OctahedronGeometry(.25),0xb2eff7,s*1.6,2.7,0,[.7,1.6,.7],.65);
    }
    part(body,new THREE.DodecahedronGeometry(.63),0x688d9b,0,2.76,.1,[1,.8,1]);
    part(body,new THREE.TorusGeometry(1.14,.05,6,40),0xe4d8a8,0,2.7,0,null,.2).rotation.x=Math.PI/2;
  }
  const statusRing=new THREE.Mesh(new THREE.RingGeometry(.85,.93,32),new THREE.MeshBasicMaterial({color:0xffb8db,transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));statusRing.rotation.x=-Math.PI/2;statusRing.position.y=.13;statusRing.visible=false;root.add(statusRing);
  if(focus)focus.userData.baseScale=focus.scale.clone();bakeGroup(body);root.userData={demonScale:root.userData.demonScale,body,wings,rotors,focus,statusRing,type,bossId:type==='boss'?bossId:null};return root;
}
export function animateEnemy(root,e,time){
  const d=root.userData,flying=e.type==='bat'||ENEMY_TYPES[e.type]?.flying||e.bossId==='chronarch'||e.bossId==='tempest';
  root.position.set(e.x,0,e.z);root.rotation.y=e.face;
  d.statusRing.scale.setScalar(e.type==='boss'?e.radius*1.15:1);d.statusRing.visible=!!e.mochiFrozen||e.mochiAttackDown>0;d.statusRing.material.opacity=.45+Math.sin(time*4)*.18;
  if(e.mochiFrozen)return;
  d.body.position.y=flying?Math.sin(time*3+e.id)*.16:Math.abs(Math.sin(time*e.speed*5+e.id))*.08;
  d.body.rotation.z=e.type==='boss'?Math.sin(time*2)*.025:Math.sin(time*5+e.id)*.045;
  d.body.rotation.x=e.rush?-.12:e.cast?.kind==='charge'?.1:0;
  d.wings.forEach((w,i)=>{if(e.type==='pestmoth'){w.rotation.z=Math.sin(time*12)*(i===0?1:-1)*.38;w.position.y=1.38+d.body.position.y;}else w.rotation.y=Math.sin(time*(e.type==='bat'?16:5))*(i===0?1:-1)*(e.type==='bat'?.55:.25);if(e.bossId==='tempest')w.position.y=1.68+d.body.position.y;});
  d.rotors.forEach(r=>{if(e.type==='ramcart')r.rotation.x=-time*(e.rush?18:e.cast?0:3);else r.rotation.z=-time*(e.cast?2:.5);});
  if(d.focus){d.focus.rotation.y=time*2;const pulse=e.cast?1.25+Math.sin(time*15)*.18:1;d.focus.scale.copy(d.focus.userData.baseScale).multiplyScalar(pulse);}
  if(e.enraged&&d.focus)d.focus.scale.multiplyScalar(1.2+Math.sin(time*9)*.1);
  if(e.type==='boss'&&MOCHI_BOSSES[e.bossId]){
    const pose=mochiSlimePose(time+e.id,{movement:e.cast||e.salvo||e.recovery>0?0:1,cry:e.cast?.kind==='chant'?.6:0,dash:e.rush?1:0,hit:Math.min(1,e.hit*5)});
    d.body.position.y=.015+pose.hop;d.body.rotation.set(0,pose.sway,0);d.body.scale.set(pose.x,pose.y,pose.z);
  }else{const scale=e.hit>0?1+e.hit*.45:1;d.body.scale.set(scale,2-scale,scale).multiplyScalar(d.demonScale??1);}
}
