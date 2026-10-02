import * as THREE from 'three';
import {part,bakeGroup} from './characters.js';

export function createHeherealBow(id='hehereal-bow',rank=1){
 const root=new THREE.Group(),gold=0xe5bb75,pink=id==='sakura-far-bow'?0xe3aaff:id==='sakura-swift-bow'?0xffb1d5:0xff87bd;
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.02,-1.25,0),new THREE.Vector3(.33,-.85,0),new THREE.Vector3(.42,-.45,0),new THREE.Vector3(.18,0,0),new THREE.Vector3(.42,.45,0),new THREE.Vector3(.33,.85,0),new THREE.Vector3(.02,1.25,0)]);
 part(root,new THREE.TubeGeometry(curve,32,.065,8,false),gold);
 const string=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.02,-1.25,0),new THREE.Vector3(-.1,0,0),new THREE.Vector3(.02,1.25,0)]),new THREE.LineBasicMaterial({color:pink}));root.add(string);
 for(const y of [-1.22,1.22]){const tip=part(root,new THREE.OctahedronGeometry(.14),pink,.02,y,0,null,.25);tip.scale.set(.7,1.5,.6);}
 const heart=new THREE.Shape();heart.moveTo(0,-.12);heart.bezierCurveTo(-.34,.08,-.26,.33,0,.14);heart.bezierCurveTo(.26,.33,.34,.08,0,-.12);
 part(root,new THREE.ExtrudeGeometry(heart,{depth:.045,bevelEnabled:true,bevelSize:.02,bevelThickness:.015,bevelSegments:1,steps:1}),gold,.22,0,.03);
 part(root,new THREE.OctahedronGeometry(.16),pink,.22,.07,.09,[1,1,.45],.2);
 // Rabbit crest and broad ribbon wings match the supplied heart/flower bow.
 part(root,new THREE.SphereGeometry(.12,12,8),0xfff5ee,.22,.32,.05);
 for(const s of [-1,1]){part(root,new THREE.SphereGeometry(.07,10,6),0xfff5ee,.22+s*.065,.49,.05,[.6,1.8,.6]);part(root,new THREE.SphereGeometry(.018,8,6),0x6c3948,.22+s*.045,.33,.16);}
 for(const y of [-.8,-.4,.65]){
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part(root,new THREE.SphereGeometry(.08,10,6),0xffe4f0,.3+Math.cos(a)*.095,y+Math.sin(a)*.095,.065,[1,.7,.35]);}
  part(root,new THREE.SphereGeometry(.04,8,6),gold,.3,y,.095);
 }
 for(const s of [-1,1]){const ribbon=part(root,new THREE.ConeGeometry(.18,.6,4),pink,.22+s*.22,-.35,-.045);ribbon.rotation.z=s*.8;}
 root.name='桜心の魔法弓 · 2743';root.userData.family=id;root.userData.variantId=`${id}-r${rank}`;bakeGroup(root);return root;
}
export function createMagicArrow(){
 const root=new THREE.Group();part(root,new THREE.CylinderGeometry(.025,.025,.7,6),0xffdae9,0,0,0,null,.35).rotation.x=Math.PI/2;
 part(root,new THREE.ConeGeometry(.12,.28,5),0xff83ba,0,0,.48,null,.8).rotation.x=Math.PI/2;
 for(const s of [-1,1])part(root,new THREE.BoxGeometry(.18,.035,.2),0xffabc9,s*.06,0,-.3).rotation.y=s*.45;
 root.userData.disposable=true;return root;
}
export function buildHeheLandmarks(group,index){
 for(const s of [-1,1])for(let i=0;i<4;i++){
  const house=new THREE.Group();house.position.set(s*(24+i%2*5),-1.5,-19+i*12);group.add(house);
  part(house,new THREE.BoxGeometry(6,5.5,5),0xf2dcce,0,2.75,0);part(house,new THREE.ConeGeometry(5,2.4,4),[0xe2a0b7,0xc9acd0,0xd6b581,0xb1c6bf][index%4],0,6.3,0).rotation.y=Math.PI/4;
  part(house,new THREE.BoxGeometry(4,.22,1.7),0x8a635c,0,3.4,3);part(house,new THREE.BoxGeometry(1.4,2.5,.1),0x62515c,0,1.25,2.55);
  for(const x of [-1.9,1.9])part(house,new THREE.BoxGeometry(1.15,1.5,.15),0xffdeaa,x,2.7,2.55,null,.14);
 }
 const statue=new THREE.Group();statue.position.set(0,-1,-31);group.add(statue);
 part(statue,new THREE.CylinderGeometry(3,3.5,1.5,16),0xbbaea1,0,.75,0);part(statue,new THREE.SphereGeometry(2.1,16,12),0xd7bc9e,0,4.1,0,[1,1.2,1]);
 for(const s of [-1,1]){part(statue,new THREE.TorusGeometry(.7,.12,4,4),0x574d4a,s*.86,4.3,1.92).rotation.z=Math.PI/4;}
 part(statue,new THREE.BoxGeometry(.45,.13,.12),0x574d4a,0,4.3,2);bakeGroup(group);
}
