import * as THREE from 'three';

// Four silhouettes with separate attack tells: quadruped, coiled snake,
// bell knight and a giant with oversized striking arms.
export function buildChapterTwoBoss(body,id,{part,ball,tube}){
 const stone=0x56646a,gold=0xbfa77c;let focus;
 if(id==='thornmaw'){
  ball(body,0x785640,0,1.45,-.2,[1.35,.98,1.9]);ball(body,0xad7850,0,1.58,1.5,[1.15,.93,1.05]);
  for(const s of [-1,1]){
   for(const z of [-1.25,1.1]){ball(body,0x5e493d,s*1.05,.55,z,[.46,.58,.62]);part(body,new THREE.ConeGeometry(.24,.8,6),0xefdfb8,s*.7,1.2,2.26).rotation.x=2.4;}
   tube(body,[[s*.65,2.03,1.5],[s*1.1,2.7,1.25],[s*.94,3.35,.98]],.18,0xd4bd84);
   ball(body,0xffdc92,s*.47,1.96,2.33,[.14,.07,.05]);
  }
  for(let i=0;i<6;i++){part(body,new THREE.ConeGeometry(.28,1.1,5),0x94b075,(i%2?1:-1)*.55,2.48,-1.5+i*.5).rotation.z=(i%2?.35:-.35);}
  tube(body,[[0,1.5,-1.85],[.5,1.65,-2.8],[1.05,2.02,-3.05]],.14,0x8eac73);
  focus=part(body,new THREE.OctahedronGeometry(.25),0xffc16b,0,2.36,2,[.8,1.4,.55],1);
 }else if(id==='basalt'){
  const points=Array.from({length:11},(_,i)=>{const a=i*.65;return [Math.cos(a)*(1.9-i*.095),.55+i*.045,Math.sin(a)*(1.9-i*.095)];});
  tube(body,points,.52,0x688c84);
  for(let i=0;i<points.length;i++){const [x,y,z]=points[i];part(body,new THREE.DodecahedronGeometry(.6),i%2?0x789b8f:0x536e70,x,y+.13,z,[1,.85,1]);}
  tube(body,[[.9,.8,0],[.65,1.55,.05],[0,2.35,.35],[0,3.05,.8]],.57,0x7ba497);
  ball(body,0xb1c5a4,0,3.1,1.08,[.84,.57,.92]);
  for(const s of [-1,1]){ball(body,0xeaffb7,s*.52,3.31,1.64,[.1,.09,.06]);part(body,new THREE.ConeGeometry(.11,.53,6),0xf4efcf,s*.36,2.67,1.75).rotation.z=Math.PI;}
  focus=part(body,new THREE.OctahedronGeometry(.28),0x91ffb7,0,3.68,1,[1,1.25,1],1);
 }else if(id==='ironbell'){
  part(body,new THREE.CylinderGeometry(.85,1.65,2.05,12),0x7d7088,0,1.8,0);
  for(const y of [.82,1.02,2.7])part(body,new THREE.TorusGeometry(y<2?1.58:.9,.12,6,32),gold,0,y,0).rotation.x=Math.PI/2;
  part(body,new THREE.CylinderGeometry(.49,.65,.78,8),stone,0,3.08,0);
  for(const s of [-1,1]){part(body,new THREE.BoxGeometry(.55,.72,.83),stone,s*.69,.4,.17);ball(body,0xffd4f5,s*.2,3.21,.56,[.12,.06,.04]);ball(body,0x93839b,s*1.35,2.37,0,[.5,.56,.52]);}
  tube(body,[[1.4,2.36,0],[1.96,1.9,.2],[2.3,1.68,.6]],.25,stone);
  part(body,new THREE.CylinderGeometry(.13,.13,2.9,8),gold,2.3,1.8,.6);
  part(body,new THREE.BoxGeometry(1.55,.86,1.05),0x87718f,2.3,3.16,.6);
  part(body,new THREE.TorusGeometry(.45,.11,7,24),gold,0,3.78,0);
  focus=part(body,new THREE.OctahedronGeometry(.42),0xd5a6ff,0,1.97,1.24,[.8,1.2,.6],1);
 }else{
  part(body,new THREE.DodecahedronGeometry(1.5),0x564956,0,3.1,0,[1.15,1.45,.86]);
  for(const s of [-1,1]){
   part(body,new THREE.DodecahedronGeometry(.92),stone,s*1.9,3.9,0,[1.2,.9,1]);
   part(body,new THREE.DodecahedronGeometry(.85),0x534855,s*2.15,2.67,.14,[.9,1.4,.9]);
   part(body,new THREE.DodecahedronGeometry(1.02),0x77616a,s*2.3,1.55,.48,[.95,.95,1.1]);
   part(body,new THREE.BoxGeometry(1.14,1.5,1.38),stone,s*.83,.85,.15);
   tube(body,[[s*.63,4.68,0],[s*1.1,5.42,-.2],[s*1.65,5.84,-.4]],.18,gold);
   ball(body,0xffb07a,s*.28,4.71,.84,[.17,.07,.045]);
   for(let i=0;i<3;i++)part(body,new THREE.ConeGeometry(.21,.73,5),0xb08c86,s*(1.6+i*.38),4.5-i*.15,0);
  }
  part(body,new THREE.DodecahedronGeometry(.78),0x796675,0,4.53,.23,[1,.8,1]);
  focus=part(body,new THREE.OctahedronGeometry(.82),0xff9578,0,3.1,1.18,[.8,1.3,.42],1.2);
  tube(body,[[0,3.9,1.18],[-.3,3.5,1.28],[.28,2.86,1.25],[0,2.23,1.03]],.055,0xffbb86);
 }
 focus.userData.dynamic=true;return focus;
}
