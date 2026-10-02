import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createLumiEars,updateLumiEars} from '../src/lumi-visuals.js';

test('Neko Lumi ears are two closed, curved, opaque pinnae with recessed colored bowls',()=>{
 const ears=createLumiEars();assert.equal(ears.children.length,2);assert.equal(ears.userData.designVersion,'sculpted-small-pinna-v3');
 for(const ear of ears.children){
  const g=ear.geometry,p=g.attributes.position,n=g.attributes.normal,c=g.attributes.color;
  assert.equal(ear.material.transparent,false);assert.equal(ear.material.opacity,1);assert.equal(ear.material.vertexColors,true);assert.equal(ear.material.map,null);
  assert.ok(g.index.count/3>2000&&g.index.count/3<4000);assert.ok(g.boundingBox.max.z-g.boundingBox.min.z>.22);assert.ok(g.boundingBox.max.y-g.boundingBox.min.y>.65);
  let pink=0,cream=0;for(let i=0;i<p.count;i++){for(const value of [p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i)])assert.ok(Number.isFinite(value));assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<.001);pink+=Number(c.getX(i)>c.getY(i)*1.5);cream+=Number(Math.abs(c.getX(i)-c.getY(i))<.15);}
  assert.ok(pink>100&&cream>100);
  const edges=new Map();for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)];for(let j=0;j<3;j++){const [a,b]=[ids[j],ids[(j+1)%3]].sort((a,b)=>a-b),key=`${a}:${b}`;edges.set(key,(edges.get(key)??0)+1);}}
  assert.ok([...edges.values()].every(count=>count===2),'Watertight shell, including its rounded rim');
 }
 assert.equal(ears.children[0].scale.x,-ears.children[1].scale.x);
 const size=new THREE.Box3().setFromObject(ears).getSize(new THREE.Vector3());assert.ok(size.x<1.3&&size.y<.45&&size.z<.25,'Subtle ears stay within the hair silhouette and mobile size budget');
});

test('Ears seat inside the scalp and follow head pose delta, not its reversed bind orientation',()=>{
 const root=new THREE.Group(),rig=new THREE.Group(),head=new THREE.Bone(),ears=createLumiEars();root.add(rig);rig.add(head,ears);head.position.y=2.3;head.rotation.y=Math.PI;root.userData={rig,ears,bones:new Map([['head',{bone:head}]])};
 updateLumiEars(root,false);assert.equal(ears.visible,false);assert.ok(ears.quaternion.angleTo(new THREE.Quaternion())<1e-7);
 head.rotation.y+=.2;head.rotation.z=.1;root.rotation.y=.7;root.position.set(5,.5,-3);updateLumiEars(root,true);assert.equal(ears.visible,true);assert.ok(ears.quaternion.angleTo(new THREE.Quaternion())>.1);assert.ok(ears.position.y>2.65&&ears.position.y<2.8);
 updateLumiEars(root,false);assert.equal(ears.visible,false);
});
