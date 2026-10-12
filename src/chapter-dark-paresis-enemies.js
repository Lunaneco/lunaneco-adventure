import * as THREE from 'three';
import {DARK_BOSS_IDS,DARK_PARESIS_BOSSES} from './dark-paresis.js';

const enemy=(name,hp,speed,damage,role,hint,extra={})=>Object.freeze({name,hp,speed,damage,radius:.78,role,hint,chapter:7,barHeight:3.1,xp:46,crystals:4,buds:5,...extra});
export const PARESIS_ENEMIES=Object.freeze({
 miasmaMoth:enemy('瘴蛾',170,2.2,34,'扇状の灯火','三方向の紫の灯を横へ抜ける。空を飛ぶ。',{ranged:true,flying:true}),
 paresisChorister:enemy('笑声の合唱',250,2.15,46,'短い斬撃','橙の短い帯のあと、笑声とともに斬る。帯を横切って背後へ。'),
 lanternWarden:enemy('瘴灯の門番',500,1.15,54,'輪の衝撃','輪の内側か、輪の外へ。門番自体は遅い。',{radius:1.05}),
 miasmaBell:enemy('鳴る黒鈴',240,2.7,48,'長い突進','長い帯のあと、鈴が直線に飛ぶ。横へかわし、止まった隙に反撃。'),
 darkCenser:enemy('闇香の香炉',210,1.45,36,'時間差の香','足元に落ちる香の円から離れる。詠唱中に倒すと消える。',{ranged:true}),
});

export function buildParesisEnemy(type,bossId,root,body,{part,tube}){
 const isBoss=type==='boss';
 const index=isBoss?Math.max(0,DARK_BOSS_IDS.indexOf(bossId)):0;
 const scale=isBoss?.8+index*.022:1;
 const coat=isBoss?(DARK_PARESIS_BOSSES[bossId]?.color??0x6a3d88):({miasmaMoth:0x6d5aa8,paresisChorister:0x7a3d62,lanternWarden:0x3e3158,miasmaBell:0x5c3b78,darkCenser:0x4d3f72}[type]??0x5a3e70);
 body.scale.setScalar(scale);root.userData.demonScale=scale;
 const wings=[];
 part(body,new THREE.CylinderGeometry(.34,.48,.9,8),coat,0,1.15,0);
 part(body,new THREE.CylinderGeometry(.42,.28,.7,8),0x1a1024,0,1.85,0);
 part(body,new THREE.SphereGeometry(.32,10,8),0xf2e4ff,0,2.45,0);
 part(body,new THREE.BoxGeometry(.46,.28,.08),0xf7f1ff,0,2.48,.28);
 part(body,new THREE.SphereGeometry(.06,8,6),0x2a1840,-.1,2.5,.33);
 part(body,new THREE.BoxGeometry(.5,.08,.16),0xe7a0ff,0,2.95,0,null,.35);
 for(const s of [-1,1]){
  tube(body,[[s*.42,1.7,0],[s*.7,1.15,.1],[s*.55,.7,.15]],.09,0xf0d8ff);
  part(body,new THREE.CylinderGeometry(.12,.16,.7,6),0x241428,s*.22,.45,0);
  part(body,new THREE.SphereGeometry(.1,8,6),0xffc0ea,s*.55,1.55,.2,null,.4);
 }
 if(type==='miasmaMoth'||bossId==='nyanEcho'){
  for(const s of [-1,1]){
   const wing=new THREE.Group();wing.position.set(s*.4,1.7,0);body.add(wing);wings.push(wing);
   const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(s*1.1,.35);shape.lineTo(s*.7,-.45);shape.lineTo(0,-.2);
   part(wing,new THREE.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:false}),0xc9b6ff).userData.dynamic=true;
  }
 }
 if(type==='lanternWarden'||bossId==='paresisGate')part(body,new THREE.OctahedronGeometry(.28),0xffd0ea,0,1.5,.55,null,.45);
 if(type==='miasmaBell'||bossId==='paresisBell')part(body,new THREE.ConeGeometry(.22,.4,8),0xe7c56a,0,1.2,.5).rotation.x=Math.PI;
 if(type==='darkCenser'||bossId==='lumiEcho')part(body,new THREE.CylinderGeometry(.05,.05,1.3,6),0xd4b6ff,.7,1.3,.2);
 if(type==='paresisChorister'||bossId==='paresisChoir')tube(body,[[.2,1,.4],[.55,1.5,.55],[.3,1.9,.4]],.05,0xffe0a0);
 if(bossId==='tsukiEcho')part(body,new THREE.TorusGeometry(.28,.04,6,12),0xb8f4ff,0,2.2,.2).rotation.y=Math.PI/2;
 if(bossId==='riceEcho')part(body,new THREE.BoxGeometry(.7,.08,.16),0x9dffc0,.55,1.15,.3);
 if(bossId==='mochiEcho')part(body,new THREE.SphereGeometry(.2,8,6),0xffb6da,-.6,1.4,.2);
 if(bossId==='shizukuEcho')part(body,new THREE.BoxGeometry(.12,.9,.08),0xef99b6,-.7,1.3,.2).rotation.z=.4;
 if(bossId==='primEcho')part(body,new THREE.OctahedronGeometry(.2),0x9eead6,.65,2.1,.2,null,.3);
 if(bossId==='heheEcho')tube(body,[[.7,.8,.3],[.95,1.5,.4],[.7,2,.3]],.04,0xffd0ea);
 if(String(bossId).startsWith('kephia')){
  const phase=Number(String(bossId).slice(-1))||1;
  // The story portrait: two-pointed bell hat, ruff, harlequin diamonds and a lantern wand.
  for(const s of [-1,1]){
   tube(body,[[s*.12,2.72,0],[s*.42,3.05,-.05],[s*.62,2.95,.05],[s*.7,2.7,.1]],.1,s<0?0x5a2a86:0x2a1838);
   part(body,new THREE.SphereGeometry(.09,8,6),0xffd77a,s*.7,2.62,.1,null,.3,.6);
  }
  part(body,new THREE.TorusGeometry(.36,.09,6,14),0xfff6ff,0,2.08,0).rotation.x=Math.PI/2;
  for(const [x,y] of [[-.16,1.25],[.16,1.25],[0,1.5],[0,1.0]])part(body,new THREE.OctahedronGeometry(.11),0xd9b46a,x,y,.42,[1,1.4,.35],0,.4);
  tube(body,[[.6,1.15,.25],[.75,1.8,.3],[.8,2.3,.3]],.035,0x3a2448);
  part(body,new THREE.CylinderGeometry(.11,.13,.22,6),0xe7a0ff,.8,2.42,.3,null,.8);
  if(phase>=3)part(body,new THREE.TorusGeometry(.55,.05,6,16),0xffe08a,0,3.25,0).rotation.x=Math.PI/2;
  if(phase>=2)for(const s of [-1,1])tube(body,[[s*.3,2,0],[s*1,2.3,.2],[s*.8,1.4,.3]],.07,0xe7a0ff);
  if(phase>=3)for(let i=0;i<5;i++){const a=i/5*Math.PI*2;part(body,new THREE.OctahedronGeometry(.1),0xffd0ea,Math.sin(a)*.45,3.35,Math.cos(a)*.45,null,.5);}
  if(phase>=4)for(const s of [-1,1]){
   const curtain=new THREE.Group();curtain.position.set(s*.7,2.2,-.2);body.add(curtain);wings.push(curtain);
   const shape=new THREE.Shape();shape.moveTo(0,.4);shape.lineTo(s*1.3,.2);shape.lineTo(s*1.05,-1.3);shape.lineTo(0,-1);
   part(curtain,new THREE.ExtrudeGeometry(shape,{depth:.05,bevelEnabled:false}),0x4a2068).userData.dynamic=true;
  }
 }
 const focus=part(body,new THREE.OctahedronGeometry(.12),0xffd0ea,0,1.7,.42,null,.55);focus.userData.dynamic=true;
 return {focus,wings,rotors:[]};
}
