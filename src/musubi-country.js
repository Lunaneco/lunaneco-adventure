import * as THREE from 'three';
import {part} from './characters.js';
import {contains} from './terrain.js';

export const COUNTRY_PALETTES={
 village:[0xe3ddc4,0x79765b,0xcdb484],
 valley:[0xc7d4bf,0x526e69,0xb8bca0],
 town:[0xe1d8c4,0x726f62,0xd2bc95],
 fortress:[0xc7cdca,0x5e6668,0xbfb8a0],
};
const C={wood:0x876747,ivory:0xe8dbc1,roof:0x314e42,gold:0xdcb369,stone:0x8b9183,water:0x70acaa};
const box=(g,w,h,d,c,x=0,y=0,z=0)=>part(g,new THREE.BoxGeometry(w,h,d),c,x,y,z);
function gable(g,width,depth,y){
 const profile=new THREE.Shape();profile.moveTo(-width/2,0);profile.quadraticCurveTo(-width*.38,.4,0,width*.52);profile.quadraticCurveTo(width*.38,.4,width/2,0);profile.closePath();
 const geo=new THREE.ExtrudeGeometry(profile,{depth,bevelEnabled:true,bevelSize:.07,bevelThickness:.05,bevelSegments:1,steps:1});
 part(g,geo,C.roof,0,y,-depth/2);
 box(g,width+.25,.13,depth+.18,C.wood,0,y,0);
}
function riceCrest(g,x,y,z,scale=1){
 const emblem=new THREE.Group();emblem.position.set(x,y,z);emblem.scale.setScalar(scale);g.add(emblem);
 part(emblem,new THREE.CylinderGeometry(.025,.025,1.1,5),C.gold,0,0,0);
 for(let i=0;i<4;i++)for(const sign of [-1,1]){const seed=part(emblem,new THREE.SphereGeometry(.1,6,4),C.gold,sign*.13,-.33+i*.22,.01,[1,1.6,.6]);seed.rotation.z=-sign*.55;}
}
function house(g,{tower=false,ruined=false}={}){
 const h=tower?4:2.1,w=tower?2.6:3.2;
 box(g,w+.35,.3,2.9,C.stone,0,.15,0);
 box(g,w,h,2.6,C.ivory,0,h/2+.25,0);
 for(const x of [-w/2,w/2])box(g,.15,h+.1,2.7,C.wood,x,h/2+.25,0);
 box(g,.84,1.45,.08,C.roof,0,.95,1.34);
 for(const x of [-.96,.96]){box(g,.5,.65,.08,C.gold,x,1.48,1.34);box(g,.055,.66,.1,C.wood,x,1.48,1.4);}
 if(tower){box(g,w+.7,.2,3.4,C.wood,0,2.45,0);riceCrest(g,0,3.25,1.35,.85);}
 gable(g,w+.65,3.25,h+.27);
 if(ruined){const beam=box(g,.22,2.6,.22,C.wood,w*.55,1.3,.6);beam.rotation.z=-.45;}
}
function lantern(g){
 part(g,new THREE.CylinderGeometry(.11,.17,1.55,7),C.wood,0,.77,0);
 part(g,new THREE.SphereGeometry(.32,8,6),0xffdfa0,0,1.7,0,[1,1.3,1],.22);
 for(const y of [1.35,2.05])box(g,.55,.09,.55,C.roof,0,y,0);
}
function bamboo(g){
 for(let i=0;i<4;i++){
  const x=(i%2)*.45-.2,z=Math.floor(i/2)*.4-.2,h=2.6+i*.25;
  part(g,new THREE.CylinderGeometry(.07,.11,h,6),0x75916b,x,h/2,z);
  for(let j=1;j<4;j++)part(g,new THREE.CylinderGeometry(.1,.1,.055,6),0xb1bc83,x,h*j/4,z);
  for(let j=0;j<3;j++){const leaf=part(g,new THREE.SphereGeometry(.4,6,4),0x739565,x+(j-1)*.3,h-.4+j*.2,z,[1,.18,.4]);leaf.rotation.z=(j-1)*.4;}
 }
}
function paddy(g){
 box(g,4.3,.18,2.7,C.wood,0,0,0);box(g,3.98,.05,2.38,C.water,0,.12,0);
 for(let i=0;i<24;i++){
  const x=(i%8-3.5)*.47,z=(Math.floor(i/8)-1)*.73,h=.52+(i%3)*.08;
  part(g,new THREE.CylinderGeometry(.02,.032,h,4),0x9b9b58,x,h/2+.16,z);
  const head=part(g,new THREE.SphereGeometry(.10,5,4),0xddc36a,x+.07,h+.12,z,[.7,2.2,.65]);head.rotation.z=-.32;
 }
}
function wheel(g){
 for(const z of [-.7,.7])box(g,.27,2.8,.27,C.wood,0,1.4,z);
 const axis=part(g,new THREE.CylinderGeometry(.12,.12,2,8),C.gold,0,1.75,0);axis.rotation.x=Math.PI/2;
 for(const z of [-.42,.42]){
  part(g,new THREE.TorusGeometry(1.4,.11,6,24),C.wood,0,1.75,z);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,spoke=box(g,.10,2.7,.1,C.wood,0,1.75,z);spoke.rotation.z=a;}
 }
 for(let i=0;i<12;i++){const a=i*Math.PI/6,paddle=box(g,.48,.19,1.2,C.wood,Math.sin(a)*1.4,1.75+Math.cos(a)*1.4,0);paddle.rotation.z=-a;}
 box(g,3.2,.12,2.7,C.water,0,.08,0);
}
function bellGate(g,broken=false){
 for(const sign of [-1,1]){box(g,.48,3.2,.55,C.wood,sign*1.8,1.6,0);box(g,.9,.35,1,C.stone,sign*1.8,.18,0);}
 box(g,4.5,.3,.75,C.wood,0,3.1,0);gable(g,4.8,1.8,3.25);
 part(g,new THREE.CylinderGeometry(.4,.62,.9,12),0x9e9160,0,2.45,0,null,0,.35);
 part(g,new THREE.CylinderGeometry(.035,.035,1.1,5),C.gold,0,1.45,0);
 if(broken){const fragment=box(g,.5,2.3,.5,C.stone,2.5,.7,.6);fragment.rotation.z=.8;}
}
function sack(g){
 for(let i=0;i<3;i++){
  const bag=part(g,new THREE.CylinderGeometry(.44,.44,1.1,8),0xb9a076,(i%2-.5)*.9,.45+Math.floor(i/2)*.7,0);bag.rotation.z=Math.PI/2;
  for(const x of [-.35,.35]){const rope=part(g,new THREE.TorusGeometry(.45,.035,4,12),C.wood,(i%2-.5)*.9+x,.45+Math.floor(i/2)*.7,0);rope.rotation.y=Math.PI/2;}
 }
}
const builders={house,granary:g=>house(g,{tower:true}),ruin:g=>house(g,{tower:true,ruined:true}),lantern,bamboo,paddy,wheel,bell:g=>bellGate(g),gate:g=>bellGate(g,true),sack};
function place(parent,type,x,y,z,rotation=0,scale=1){
 const g=new THREE.Group();g.name=`Homusubi ${type}`;g.position.set(x,y,z);g.rotation.y=rotation;g.scale.setScalar(scale);parent.add(g);builders[type](g);return g;
}

// Compact foreground props remain wholly outside the playable polygon. Large
// architecture is on the far rim, where it cannot hide the heroes or warnings.
export function dressCountryTerrain(parent,layout){
 const country=layout.country;if(!country)return;
 const choices=country==='village'?(layout.district===2?['bamboo','paddy','lantern']:['paddy','house','lantern']):country==='valley'?['wheel','bamboo','lantern']:country==='town'?['house',layout.district===2?'bell':'sack','lantern']:['ruin','gate','lantern'];
 const placements=[];
 for(let i=0;i<layout.points.length;i+=2){
  const [vx,vz]=layout.points[i],length=Math.hypot(vx,vz),nx=vx/length,nz=vz/length;
  if(vx*.53+vz*.74>8)continue;
  let x=vx+nx*4,z=vz+nz*4;
  const clear=()=>Array.from({length:12},(_,k)=>k*Math.PI/6).every(a=>!contains(layout,x+Math.sin(a)*3,z+Math.cos(a)*3))&&!contains(layout,x,z);
  for(let tries=0;!clear()&&tries<12;tries++){x+=nx;z+=nz;}
  if(!clear())continue;
  const type=choices[(i/2)%choices.length];
  // A lower bank joins each house or paddy to the field instead of floating.
  const distance=Math.hypot(x-vx,z-vz),bank=box(parent,5.2,4.2,distance+4.4,COUNTRY_PALETTES[country][1],(x+vx)/2,layout.height-4.1,(z+vz)/2);bank.rotation.y=Math.atan2(x-vx,z-vz);
  place(parent,type,x,layout.height-1.95,z,.35,1);
  placements.push({type,x,z,radius:3});
 }
 parent.userData.countryProps=placements;
 if(layout.surface==='wood'){
  // The entire existing footprint remains walkable; plank strips follow it.
  for(let z=-25;z<=22;z+=.75)for(let x=-14;x<=14;x+=2.1){
   if(![-.99,.99].every(dx=>[-.3,.3].every(dz=>contains(layout,x+dx,z+dz,.2))))continue;
   if(layout.stairs&&z<-6.5)continue;
   box(parent,2,.065,.68,(Math.round(z/.75)%3===0)?0xb79969:0xa78960,x,layout.height+.065,z);
  }
 }
 if(country==='town'&&layout.district===0){
  // Low market paving is decorative, never a new collision obstacle.
  for(let z=-15;z<=15;z+=2)for(const x of [-4,4])if(contains(layout,x,z,.6))box(parent,.3,.025,1.4,C.wood,x,layout.height+.12,z);
 }
}

export function buildCountryLandmarks(parent,country){
 // The generated landscape already supplies distant houses and towers. Keeping
 // that silhouette clear avoids a second row of disconnected miniature forts.
 parent.name=`Homusubi ${country} distant landscape`;
}
