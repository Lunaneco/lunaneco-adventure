import * as THREE from 'three';
import {part} from './characters.js';
export const MOCHI_PALETTES={
 'mochi-village':[0xbda5ad,0x776475,0xf2d2d9],
 'mochi-teagarden':[0xb3a3b6,0x726583,0xe4cfdd],
 'mochi-dreamtown':[0x827a99,0x4f4665,0xc9aacf],
 'mochi-palace':[0xb6a1b8,0x675478,0xf2cad8],
};
export function buildMochiLandmarks(group,kind){
 const palace=kind==='mochi-palace',night=kind==='mochi-dreamtown';
 for(let i=0;i<5;i++){
  const house=new THREE.Group();house.position.set((i-2)*13,-2,-30-Math.abs(i-2)*2);group.add(house);
  const size=palace?4.5:3,wall=night?0xaa94bd:0xf3d4d7;
  part(house,new THREE.CylinderGeometry(size,size*.94,3.4,18),wall,0,1.7,0);
  part(house,new THREE.SphereGeometry(size,18,12,0,Math.PI*2,0,Math.PI/2),0xdba9c3,0,3.4,0,[1,.8,1]);
  for(const sign of [-1,1]){const ear=part(house,new THREE.ConeGeometry(.9,2.2,5),0xe1adc4,sign*size*.68,5.2,0);ear.rotation.z=-sign*.18;part(house,new THREE.BoxGeometry(.65,.9,.1),0xffd09a,sign*1.15,2.2,size*.94,null,.2);}
  part(house,new THREE.CylinderGeometry(.7,.7,.12,16),0x71546b,0,1,size*.99).rotation.x=Math.PI/2;
  part(house,new THREE.CylinderGeometry(size*1.4,size*.6,5,10),0x817084,0,-2.5,0);
  if(i%2===0)part(house,new THREE.TorusGeometry(1.2,.15,8,28),0xf2d0b7,size+1,.6,0).rotation.y=Math.PI/2;
 }
}
