import * as THREE from 'three';
import {part} from './characters.js';

// Small, tangible buildings around the arena echo the distant painted capital.
export function buildDemonLandmarks(group,area){
 const stone=0x675c78,roof=0x352c48,silver=0xc5aac9,glow=0xef9eba;
 const palace=area==='demon-palace',canal=area==='demon-canal';
 for(let i=0;i<7;i++){
  const a=-Math.PI*.76+i*Math.PI*.25,r=30+(i%2)*7,x=Math.sin(a)*r,z=-Math.cos(a)*r;
  const house=new THREE.Group();house.position.set(x,-1,z);house.rotation.y=-a;group.add(house);
  const height=palace?7+i%3:4+i%3;
  part(house,new THREE.BoxGeometry(3,height,3),stone,0,height/2,0);
  part(house,new THREE.ConeGeometry(2.7,3.5,4),roof,0,height+1.6,0).rotation.y=Math.PI/4;
  for(const side of [-1,1]){
   part(house,new THREE.ConeGeometry(.28,1.6,7),silver,side*1.2,height+.5,1.2).rotation.z=-side*.35;
   for(let y=1.6;y<height;y+=2){part(house,new THREE.BoxGeometry(.48,1.1,.06),glow,side*.75,y,1.53,null,.6);part(house,new THREE.ConeGeometry(.35,.4,3),glow,side*.75,y+.72,1.54,[1,1,.12],.6);}
  }
  part(house,new THREE.BoxGeometry(.8,1.7,.08),roof,0,.85,1.55);
  part(house,new THREE.BoxGeometry(3.5,.2,3.5),silver,0,.15,0);
 }
 for(const side of [-1,1]){
  const x=side*5.5,z=-20;
  part(group,new THREE.CylinderGeometry(.2,.3,3.4,8),roof,x,1.7,z);
  part(group,new THREE.OctahedronGeometry(.45),glow,x,3.7,z,[.7,1.4,.7],.7);
  part(group,new THREE.TorusGeometry(.55,.05,6,20),silver,x,3.7,z);
  if(canal)part(group,new THREE.BoxGeometry(2,.12,17),0x8b799b,side*18,-.06,-4,null,.18);
 }
 if(palace){
  part(group,new THREE.BoxGeometry(9,8,3),stone,0,4,-34);
  part(group,new THREE.TorusGeometry(3.5,.4,8,30,Math.PI),silver,0,5,-32.4);
  part(group,new THREE.OctahedronGeometry(.65),glow,0,8.3,-32.3,null,.8);
 }
}
