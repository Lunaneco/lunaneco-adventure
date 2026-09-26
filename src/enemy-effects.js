import * as THREE from 'three';
import {material,bakeGroup} from './characters.js';
export function createHostileProjectile(b){
 const color=b.color??0xffa8c7,g=new THREE.Group();g.userData.disposable=true;
 if(b.kind==='enemyMusket'){
  const shot=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.48,3,6),material(color,1.25));shot.rotation.x=Math.PI/2;g.add(shot);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),material(0xffefcc,1.6));core.position.z=.3;g.add(core);
 }else if(b.kind==='enemyPollen'){
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(.22),material(color,.8));g.add(core);
  for(const side of [-1,1]){const dust=new THREE.Mesh(new THREE.SphereGeometry(.075,6,4),material(0xe9f7aa,.6));dust.position.set(side*.18,.1,-.2);g.add(dust);}
 }else if(b.kind==='enemyArrow'){
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.82,6),material(color,1));shaft.rotation.x=Math.PI/2;g.add(shaft);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.18,.32,4),material(0xffedd3,1.2));tip.rotation.x=Math.PI/2;tip.position.z=.46;g.add(tip);
 }else{
  const mesh=new THREE.Mesh(b.kind==='enemyFeather'?new THREE.OctahedronGeometry(.29):new THREE.IcosahedronGeometry(b.radius??.28,0),material(color,1.1));if(b.kind==='enemyFeather')mesh.scale.set(.6,.45,1.75);g.add(mesh);
  const rim=new THREE.Mesh(new THREE.TorusGeometry((b.radius??.28)+.09,.026,4,12),material(0xfff1d4,.7));rim.rotation.x=Math.PI/2;g.add(rim);
 }
 return g;
}
export function updateHostileProjectile(m,b,time){m.position.set(b.x,.95,b.z);m.rotation.y=Math.atan2(b.vx,b.vz);if(!['enemyArrow','enemyMusket'].includes(b.kind))m.children[0].rotation.z=time*4;m.scale.setScalar(1+Math.sin(time*12)*.06);}
export function createTelegraph(h){
 const g=new THREE.Group(),color=h.color??0xef638e,line=h.shape==='line',annular=h.shape==='ring',width=h.width??1,length=h.length??1;
 const arc=Math.PI*2-(h.gapWidth??0),start=h.gapAngle===undefined?0:h.gapAngle-Math.PI/2+(h.gapWidth??0)/2;
 const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false});
 const fill=new THREE.Mesh(line?new THREE.PlaneGeometry(width,length):annular?new THREE.RingGeometry(h.innerRadius,h.radius,64,1,start,arc):new THREE.CircleGeometry(h.radius,40),mat);fill.rotation.x=-Math.PI/2;fill.position.y=.13;g.add(fill);
 const outlineMat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false});
 if(line){
  for(const x of [-width/2,width/2]){const rail=new THREE.Mesh(new THREE.PlaneGeometry(.085,length),outlineMat);rail.rotation.x=-Math.PI/2;rail.position.set(x,.145,0);g.add(rail);}
  for(const z of [-length/2,length/2]){const end=new THREE.Mesh(new THREE.PlaneGeometry(width,.085),outlineMat);end.rotation.x=-Math.PI/2;end.position.set(0,.145,z);g.add(end);}
  // Repeated chevrons indicate the locked firing/charge direction without text.
  for(let z=-length/2+1;z<length/2;z+=2){const shape=new THREE.Shape();shape.moveTo(-Math.min(.4,width*.4),-.35);shape.lineTo(0,.22);shape.lineTo(Math.min(.4,width*.4),-.35);shape.lineTo(0,-.12);shape.closePath();const arrow=new THREE.Mesh(new THREE.ShapeGeometry(shape),outlineMat);arrow.rotation.x=Math.PI/2;arrow.position.set(0,.16,z);g.add(arrow);}
 }else if(annular){
  for(const radius of [h.innerRadius,h.radius]){const ring=new THREE.Mesh(new THREE.RingGeometry(Math.max(0,radius-.075),radius,64,1,start,arc),outlineMat);ring.rotation.x=-Math.PI/2;ring.position.y=.145;g.add(ring);}
 }else{
  for(const radius of [h.radius,h.radius*.7]){const ring=new THREE.Mesh(new THREE.RingGeometry(Math.max(0,radius-.075),radius,40),outlineMat);ring.rotation.x=-Math.PI/2;ring.position.y=.145;g.add(ring);}
  const shape=new THREE.Shape();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=i%2?h.radius*.2:h.radius*.5;if(i===0)shape.moveTo(Math.sin(a)*r,Math.cos(a)*r);else shape.lineTo(Math.sin(a)*r,Math.cos(a)*r);}shape.closePath();const star=new THREE.Mesh(new THREE.ShapeGeometry(shape),outlineMat);star.rotation.x=-Math.PI/2;star.position.y=.15;g.add(star);
 }
 // Keep the animated fill separate; all static rails, chevrons and rings share
 // one outline mesh, including when several fan attacks overlap on mobile.
 bakeGroup(g);g.userData.disposable=true;return g;
}
export function updateTelegraph(m,h){
 m.position.set(h.x,0,h.z);m.rotation.y=h.angle??0;
 // Later steps remain as faint outlines, so overlapping sequences don't hide
 // the safe centre of an imminent ring or the next opening in rotating beams.
 const imminent=h.timer<=1.35,progress=1-Math.min(1,Math.max(0,h.timer)/Math.min(h.total,1.35));
 m.children[0].material.opacity=imminent?.12+progress*.4:.025;
 m.children[1].material.opacity=imminent?.8:.28;
}
