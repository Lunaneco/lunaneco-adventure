import * as THREE from 'three';
import {createEnemy} from './characters.js';
import {createHeherealBow} from './hehereal-visuals.js';

export function createHeheForm(){
 const root=createEnemy('heheBrawler');root.name='hehereal-hehe-form';
 root.userData.statusRing.removeFromParent();root.userData.statusRing.visible=false;
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.95,.035,6,40),new THREE.MeshBasicMaterial({color:0xffa8d2,transparent:true,opacity:.65,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.08;root.add(ring);
 root.userData.weaponCache=new Map();root.visible=false;return root;
}
export function updateHeheForm(root,normal,state,time,dt,weapon){
 const d=root.userData,key=weapon.id;
 if(d.weapon?.userData.variantId!==key){
  d.weapon?.removeFromParent();let bow=d.weaponCache.get(key);
  if(!bow){bow=createHeherealBow(weapon.weapon.id,weapon.rarity.rank);bow.userData.variantId=key;d.weaponCache.set(key,bow);}
  d.weapon=bow;d.body.add(bow);
 }
 root.position.copy(normal.position);root.rotation.y=state.face+(state.dancing?time*9:0);
 d.body.position.y=state.moving?Math.abs(Math.sin(time*13))*.09:Math.sin(time*2.2)*.025;
 d.body.rotation.z=state.moving?Math.sin(time*13)*.045:0;
 // The bow's grip stays exactly inside the existing left hand, including bobbing.
 d.weapon.position.set(.69,.78,.23);d.weapon.rotation.set(0,0,0);
 d.attackTime=Math.max(0,(d.attackTime??0)-dt);
 root.scale.setScalar(1+(state.dash>0?.025:0));
}
