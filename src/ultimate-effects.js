import * as THREE from 'three';
import {ULTIMATES} from './abilities.js';
const glow=(color,opacity)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
export function createSanctuary(effect){
  const group=new THREE.Group();group.name='月華の聖域';group.userData.disposable=true;
  const add=(geometry,opacity,y)=>{const mesh=new THREE.Mesh(geometry,glow(0xdfbaff,opacity));mesh.rotation.x=-Math.PI/2;mesh.position.y=y;group.add(mesh);return mesh;};
  add(new THREE.CircleGeometry(effect.radius,72),.055,.105);
  add(new THREE.RingGeometry(effect.radius-.11,effect.radius,96),.8,.155);
  add(new THREE.RingGeometry(effect.radius*.83-.035,effect.radius*.83,80),.5,.16);
  const rune=add(new THREE.RingGeometry(effect.radius*.55-.055,effect.radius*.55,64,1,0,Math.PI*1.6),.6,.17);rune.name='lunar-rune';
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,star=new THREE.Mesh(new THREE.OctahedronGeometry(.19),glow(0xf8e1ff,.85));star.position.set(Math.sin(a)*effect.radius*.84,.45,Math.cos(a)*effect.radius*.84);group.add(star);}
  return group;
}
export function updateSanctuary(group,effect){
  group.position.set(effect.x,0,effect.z);const age=(effect.duration??ULTIMATES.nyanluna.duration)-effect.remaining;
  group.getObjectByName('lunar-rune').rotation.z=age*.7;
  const fade=Math.min(1,effect.remaining/.35);group.children.forEach(mesh=>{if(mesh.userData.opacity===undefined)mesh.userData.opacity=mesh.material.opacity;mesh.material.opacity=mesh.userData.opacity*fade;});
}
