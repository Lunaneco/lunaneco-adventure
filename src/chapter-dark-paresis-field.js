import * as THREE from 'three';
// Rim lanterns and a floor mark. Nothing here changes the walkable polygon.
export function dressParesisTerrain(edges,layout,{part,contains,y}){
 const shape=layout.paresisShape??0;
 if(shape===2){
  const ring=part(edges,new THREE.TorusGeometry(3.6,.07,6,28),0xe7a0ff,0,y+.1,-1,null,.4);ring.rotation.x=Math.PI/2;
  for(const s of [-1,1]){
   if(!contains(layout,s*8,-10,1))continue;
   part(edges,new THREE.BoxGeometry(.4,2.8,.4),0x241428,s*8,y+1.4,-10);
   part(edges,new THREE.BoxGeometry(.18,2.2,1.6),0x5a2878,s*6.4,y+2.2,-12,null,.2);
  }
 }else if(shape===0){
  if(contains(layout,0,-8,1.2)){
   part(edges,new THREE.CylinderGeometry(.45,.62,2.4,8),0x241428,0,y+1.2,-8);
   part(edges,new THREE.OctahedronGeometry(.28),0xffd0ea,0,y+2.6,-8,null,.45);
  }
 }else{
  for(const x of [-7,0,7])if(contains(layout,x,0,1.5))part(edges,new THREE.CylinderGeometry(.16,.2,1.6,6),0x3a2048,x,y+.8,0);
 }
 for(const [x,z] of [[-6,3],[6,3],[-6,-3],[6,-3]]){
  if(!contains(layout,x,z,1.5))continue;
  part(edges,new THREE.CylinderGeometry(.07,.09,1.25,6),0x1a1024,x,y+.62,z);
  part(edges,new THREE.OctahedronGeometry(.16),0xffc0ea,x,y+1.4,z,null,.5);
 }
}
