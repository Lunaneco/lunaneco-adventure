import * as THREE from 'three';
import {part,bakeGroup} from './characters.js';
import {shizukuScytheName} from './shizuku-weapons.js';

// Every variant preserves the same straight shaft and grip origin used by the rig.
export function createShizukuScythe(id='crimson-scythe',rarity=1){
 const rank=Math.max(1,Math.min(4,Math.floor(rarity)||1)),swift=id==='twilight-scythe',wide=id==='garnet-scythe';
 const root=new THREE.Group(),ruby=swift?0xa886ea:wide?0xee637c:0xc63867,black=0x282331;
 const silver=0xdcd4e5,trim=rank===4?0xe9bd76:rank===3?0xba9cd8:rank===2?0x9fcfe9:silver;
 const mesh=(geometry,color,x=0,y=0,z=0,scale=null,glow=0,metal=.6)=>part(root,geometry,color,x,y,z,scale,glow,metal);
 const ring=(x,y,r=.10,color=trim,z=.12)=>mesh(new THREE.TorusGeometry(r,.017,5,20),color,x,y,z);
 const gem=(x,y,size=.13,color=ruby)=>mesh(new THREE.OctahedronGeometry(size),color,x,y,.08,[.7,1.45,.55],rank*.09,.4);
 const length=swift?1.72:wide?2.25:2.02,depth=wide?.12:.055,tip=swift?1.44:wide?1.05:1.18;
 mesh(new THREE.CylinderGeometry(.044,.06,4,12),black,0,.7);
 for(const y of [-1.28,-.8,-.2,.5,1.9,2.45]){const r=ring(0,y,.064,trim,0);r.rotation.x=Math.PI/2;}
 const blade=new THREE.Shape();blade.moveTo(-.2,2.08);blade.bezierCurveTo(.5,swift?2.45:2.57,length*.8,2.25,length,tip);blade.bezierCurveTo(length*.63,wide?1.74:1.93,.69,1.91,.02,1.82);blade.closePath();
 mesh(new THREE.ExtrudeGeometry(blade,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:2,steps:1}),silver,0,.5,-depth/2);
 const inset=new THREE.Shape();inset.moveTo(.08,2.08);inset.bezierCurveTo(.6,2.31,length*.64,2.12,length*.82,1.65);inset.bezierCurveTo(length*.56,2,.59,2.01,.08,1.95);inset.closePath();
 mesh(new THREE.ExtrudeGeometry(inset,{depth:depth+.064,bevelEnabled:false}),black,0,.5,-(depth+.064)/2);
 gem(0,2.35);gem(0,-1.35,.11);
 const chain=(x,y,count)=>{for(let i=0;i<count;i++){const r=ring(x-i*.027,y-i*.09,.067,silver);r.rotation.y=i%2?Math.PI/2:0;}mesh(new THREE.BoxGeometry(.055,.32,.06),trim,x-(count-1)*.027,y-count*.09-.07);mesh(new THREE.BoxGeometry(.23,.055,.06),trim,x-(count-1)*.027,y-count*.09);};
 chain(-.17,2.3,rank===1?6:8);
 for(const side of [-1,1]){const ribbon=mesh(new THREE.BoxGeometry(.09,.54+rank*.055,.035),black,side*.17,1.93,-.05);ribbon.rotation.z=side*.21;}
 if(rank>=2){
  ring(0,2.42,.22);gem(0,2.43,.16);
  if(swift){for(const side of [-1,1]){const crescent=mesh(new THREE.TorusGeometry(.27,.035,6,24,Math.PI*1.4),trim,side*.22,2.32,-.03);crescent.rotation.z=side>0?-.6:2.4;}}
  else if(wide){for(const side of [-1,1]){const horn=mesh(new THREE.ConeGeometry(.11,.48,5),trim,side*.23,2.52);horn.rotation.z=-side*.65;}}
  else{for(let i=0;i<5;i++){const a=i*Math.PI*2/5;mesh(new THREE.SphereGeometry(.10,8,6),ruby,Math.sin(a)*.16,2.43+Math.cos(a)*.16,.04,[1,.7,.5]);}}
 }
 if(rank>=3){
  for(let i=0;i<rank;i++){const x=.35+i*.23,y=2.63-i*.05;ring(x,y,.075);gem(x,y,.055);}
  if(swift){for(const side of [-1,1])for(let i=0;i<3;i++){const feather=mesh(new THREE.ConeGeometry(.07,.48-i*.07,4),silver,side*(.25+i*.13),2.38-i*.10,-.03);feather.rotation.z=side*(.65+i*.2);}}
  else if(wide){gem(.34,2.24,.22);gem(.65,2.20,.18);chain(-.34,2.18,6);}
  else{ring(0,2.42,.33);for(const x of [-.32,.32])gem(x,2.42,.09);}
  for(const side of [-1,1]){const guard=mesh(new THREE.TorusGeometry(.15,.024,5,20,Math.PI*1.4),trim,side*.13,1.75);guard.rotation.z=side*1.4;}
 }
 if(rank===4){
  // A rank-four crown and a second pendant make the legendary silhouette readable.
  for(let i=-1;i<=1;i++){const crown=mesh(new THREE.ConeGeometry(.065,.25+(i===0?.12:0),4),trim,i*.12,2.81);crown.rotation.z=-i*.22;}
  chain(swift?-.5:-.36,2.44,5);gem(swift?-.60:-.48,1.91,.10);
  for(let i=0;i<3;i++){const a=i*1.35;ring(Math.sin(a)*.21,-1.15+Math.cos(a)*.18,.095);}
  gem(0,-1.36,.18);
  if(swift){const moon=mesh(new THREE.TorusGeometry(.39,.029,6,30,Math.PI*1.5),trim,0,2.42,-.08);moon.rotation.z=.75;}
  else if(wide){for(const side of [-1,1]){const wing=mesh(new THREE.ConeGeometry(.15,.55,4),black,side*.42,2.54,-.08);wing.rotation.z=side*1.05;}}
 }
 bakeGroup(root);root.name=shizukuScytheName(id,rank);Object.assign(root.userData,{family:id,variantId:`${id}-r${rank}`,rarity:rank});return root;
}
