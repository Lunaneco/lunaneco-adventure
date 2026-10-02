import {createLumiFingerLight} from './lumi-visuals.js';
import {createHeherealBow} from './hehereal-visuals.js';
import {createPrimClaw} from './prim-visuals.js';
import {createShizukuScythe} from './shizuku-weapon.js';
import * as THREE from 'three';
import {part,bakeGroup} from './characters.js';

// Every model keeps the grip at (0, 0, 0), matching the existing hand attachment.
export function createWeaponVariant(item){
 if(item.heroId==='lumi')return createLumiFingerLight(item.weapon.id,item.rarity.rank);
 if(item.heroId==='hehereal')return createHeherealBow(item.weapon.id,item.rarity.rank);
 if(item.heroId==='prim')return createPrimClaw(item.weapon.id,item.rarity.rank);
 if(item.heroId==='shizuku')return createShizukuScythe(item.weapon.id,item.rarity.rank);
 const id=item.weapon.id,weapon=new THREE.Group(),gold=0xe0bd78,silver=0xd6e8ed;
 if(item.heroId==='mochinyafe'){
  const lull=id==='mochi-lull-chime',echo=id==='mochi-echo-bell',color=lull?0xcab3ff:echo?0xffd5aa:0xffb4d0;
  part(weapon,new THREE.TorusGeometry(.16,.035,6,20),gold,0,.36,0);
  if(echo){
   part(weapon,new THREE.CylinderGeometry(.19,.39,.43,16,1,true),0xffeada,0,.02,0,null,.1,.35);
   part(weapon,new THREE.TorusGeometry(.39,.045,6,24),gold,0,-.2,0).rotation.x=Math.PI/2;
   part(weapon,new THREE.SphereGeometry(.13,12,8),color,0,-.08,0,null,1.1);
  }else{
   for(const x of (lull?[-.18,.18]:[0])){
    const scale=lull?.68:1;
    part(weapon,new THREE.SphereGeometry(.29*scale,16,12),color,x,0,0,null,.12,.4);
    for(const side of [-1,1])part(weapon,new THREE.ConeGeometry(.085*scale,.17*scale,5),color,x+side*.16*scale,.24*scale,0);
    part(weapon,new THREE.TorusGeometry(.21*scale,.028,6,20),gold,x,-.16*scale,0).rotation.x=Math.PI/2;
    part(weapon,new THREE.BoxGeometry(.17*scale,.025,.025),0x825064,x,-.08*scale,.265*scale);
   }
  }
 }else if(item.heroId==='nyanluna'){
  const far=id==='selene-staff';
  part(weapon,new THREE.CylinderGeometry(.035,.04,1.64,10),far?0x333c7d:0xe6e7f6,0,.40,0);
  for(const y of [-.37,.20,.90])part(weapon,new THREE.TorusGeometry(.043,.013,6,12),far?silver:gold,0,y,0).rotation.x=Math.PI/2;
  if(far){
   for(let i=0;i<3;i++){const ring=part(weapon,new THREE.TorusGeometry(.31,.021,6,28),silver,0,1.30,0);ring.rotation.set(i*Math.PI/3,i*Math.PI/3,.35);}
   part(weapon,new THREE.OctahedronGeometry(.18),0xb39cff,0,1.30,0,null,1.3);
   part(weapon,new THREE.TorusGeometry(.39,.035,6,24,Math.PI*1.4),0x6876b1,0,1.30,0).rotation.z=.5;
  }else{
   part(weapon,new THREE.TorusGeometry(.23,.034,6,24,Math.PI*1.6),gold,0,1.21,0).rotation.z=.63;
   const gem=part(weapon,new THREE.OctahedronGeometry(.18),0xe6b7ff,0,1.24,0,null,1.2);gem.scale.set(1,1.3,.55);
   for(const x of [-.23,.23]){part(weapon,new THREE.CylinderGeometry(.025,.025,.17,6),gold,x,1.08,0);part(weapon,new THREE.SphereGeometry(.075,10,8),gold,x,.94,0);part(weapon,new THREE.BoxGeometry(.065,.30,.025),0xe5a6ce,x*1.2,.93,-.025).rotation.z=x;}
  }
 }else if(item.heroId==='tsukineko'){
  const sniper=id==='artemis-rifle';
  part(weapon,new THREE.BoxGeometry(.24,.24,sniper?.78:.50),0x243657,0,.13,.30);
  part(weapon,new THREE.BoxGeometry(.19,.21,.32),silver,0,.16,-.15);
  part(weapon,new THREE.BoxGeometry(.13,.29,.15),0x172536,0,-.06,.05).rotation.x=-.20;
  if(sniper){
   part(weapon,new THREE.CylinderGeometry(.06,.085,1.12,12),silver,0,.15,1.17).rotation.x=Math.PI/2;
   part(weapon,new THREE.CylinderGeometry(.10,.09,.62,12),0x2b4267,0,.39,.30).rotation.x=Math.PI/2;
   part(weapon,new THREE.SphereGeometry(.089,10,8),0x76dfff,0,.39,.62,null,1.6);
   for(const z of [.73,1.28,1.69])part(weapon,new THREE.TorusGeometry(.076,.018,6,12),gold,0,.15,z);
  }else{
   for(const x of [-.10,.10]){part(weapon,new THREE.CylinderGeometry(.07,.075,.46,10),silver,x,.15,.72).rotation.x=Math.PI/2;part(weapon,new THREE.TorusGeometry(.075,.023,6,12),gold,x,.15,.94);}
   part(weapon,new THREE.BoxGeometry(.13,.30,.20),0x70dcff,0,-.09,.38,null,.7);
  }
  part(weapon,new THREE.BoxGeometry(.26,.05,.36),0x86edff,0,.28,.35,null,1.2);
  weapon.userData.muzzlePosition=new THREE.Vector3(0,.15,sniper?1.78:1.0);
 }else{
  const guard=id==='aegis-saber',color=guard?0xaaff9a:0x85eeff,length=guard?2.05:1.65;
  part(weapon,new THREE.CylinderGeometry(.09,.10,.48,12),guard?0x235545:0x253745,0,0,0);
  for(const y of [-.18,-.08,.02])part(weapon,new THREE.TorusGeometry(.099,.022,6,14),guard?gold:silver,0,y,0).rotation.x=Math.PI/2;
  part(weapon,new THREE.CylinderGeometry(.13,.105,.12,12),guard?gold:silver,0,.27,0);
  if(guard){
   const shield=part(weapon,new THREE.OctahedronGeometry(.31),gold,0,.26,0);shield.scale.set(1.35,.6,.5);
   const gem=part(weapon,new THREE.OctahedronGeometry(.11),color,0,.28,.15,null,.9);gem.scale.z=.45;
  }else for(const x of [-.14,.14])part(weapon,new THREE.ConeGeometry(.055,.30,4),silver,x,.37,0).rotation.z=-x*2;
  const blade=part(weapon,new THREE.CapsuleGeometry(guard?.095:.045,length,5,10),color,0,.36+length/2,0,null,1.8);blade.userData.dynamic=true;
  const glow=new THREE.Mesh(new THREE.CapsuleGeometry(guard?.16:.10,length+.04,5,10),new THREE.MeshBasicMaterial({color:guard?0x27ff61:0x28dfff,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));glow.position.y=blade.position.y;glow.userData.dynamic=true;weapon.add(glow);weapon.userData.blade=blade;weapon.userData.glow=glow;
 }
 bakeGroup(weapon);
 if(item.heroId==='tsukineko'){
  const flash=new THREE.Mesh(new THREE.OctahedronGeometry(.16),new THREE.MeshBasicMaterial({color:0xc7f8ff,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));flash.position.copy(weapon.userData.muzzlePosition);flash.scale.set(.65,.65,1.65);flash.visible=false;weapon.add(flash);weapon.userData.muzzle=flash;
 }
 weapon.name=item.weapon.name;weapon.userData.family=id;return weapon;
}
