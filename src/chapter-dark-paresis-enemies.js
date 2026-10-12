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

function wingShape(side,reach,drop){const shape=new THREE.Shape();shape.moveTo(0,.2);shape.lineTo(side*reach,.45);shape.lineTo(side*reach*.72,-drop);shape.lineTo(0,-drop*.35);return shape;}
function buildKephiaForm(bossId,root,body,{part,tube}){
 const phase=Number(String(bossId).slice(-1))||1,scale=phase===1?1.02:phase===2?1.24:phase===3?1.34:1.68;
 body.scale.setScalar(scale);root.userData.demonScale=scale;const wings=[];
 if(phase===1){
  part(body,new THREE.CylinderGeometry(.28,.4,.95,8),0x5a2a78,0,1.15,0);
  part(body,new THREE.CylinderGeometry(.16,.28,.55,8),0x2a1438,0,1.85,0);
  part(body,new THREE.SphereGeometry(.22,10,8),0xffd77a,0,2.35,0,null,.7);
  for(const s of [-1,1])tube(body,[[s*.08,2.55,0],[s*.38,3.15,0],[s*.5,2.85,.05]],.08,s<0?0xf2b7ff:0x3a1848);
  part(body,new THREE.TorusGeometry(.3,.07,6,14),0xfff1c4,0,1.95,0).rotation.x=Math.PI/2;
  tube(body,[[.35,1.2,.2],[.7,1.7,.25],[.85,2.15,.2]],.04,0x3a2448);
  part(body,new THREE.CylinderGeometry(.1,.12,.2,6),0xffd77a,.88,2.25,.2,null,.8);
 }
 else if(phase===2){
  part(body,new THREE.CylinderGeometry(.55,.7,.7,8),0x3a1848,0,.85,0);
  part(body,new THREE.CylinderGeometry(.34,.48,.8,8),0x6a1840,0,1.5,0);
  part(body,new THREE.SphereGeometry(.2,10,8),0xe7c56a,0,2.15,0,null,.65);
  part(body,new THREE.OctahedronGeometry(.16),0xffd77a,0,1.35,.42,null,.8);
  for(const s of [-1,1]){
   tube(body,[[s*.1,2.4,0],[s*.55,3.25,.05],[s*.75,2.9,.1]],.09,0xe7c56a);
   tube(body,[[s*.4,1.45,0],[s*1.15,1.7,.15],[s*1.25,1.2,.2]],.07,0xf2b7ff);
   tube(body,[[s*.25,1.35,.1],[s*.7,1.05,.25],[s*.85,.7,.3]],.06,0xfff1c4);
   part(body,new THREE.ConeGeometry(.16,.28,8),0xe7c56a,s*1.25,1.15,.2).rotation.x=Math.PI;
   part(body,new THREE.SphereGeometry(.08,8,6),0xffd77a,s*.85,.62,.3,null,.7);
  }
 }
 else if(phase===3){
  part(body,new THREE.CylinderGeometry(.3,.42,1.1,8),0x140818,0,1.2,0);
  part(body,new THREE.TorusGeometry(.34,.1,8,16),0x7a5cff,0,2.15,0,null,.55);
  part(body,new THREE.SphereGeometry(.16,10,8),0x1a1028,0,2.15,0);
  part(body,new THREE.SphereGeometry(.07,8,6),0xc9b6ff,0,2.15,.22,null,.9);
  for(const s of [-1,1]){
   const wing=new THREE.Group();wing.position.set(s*.35,1.7,0);body.add(wing);wings.push(wing);
   part(wing,new THREE.ExtrudeGeometry(wingShape(s,1.7,1.15),{depth:.05,bevelEnabled:false}),0x3a2468).userData.dynamic=true;
   part(body,new THREE.OctahedronGeometry(.1),0xc9b6ff,s*.9,2.7,.1,null,.6);
  }
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2;part(body,new THREE.OctahedronGeometry(.09),0x7a5cff,Math.sin(a)*1.1,.35,Math.cos(a)*1.1,null,.7);}
 }
 else{
  part(body,new THREE.CylinderGeometry(.48,.7,1.3,8),0x2a1030,0,.8,0);
  part(body,new THREE.CylinderGeometry(.34,.46,1,8),0x4a1848,0,1.85,0);
  part(body,new THREE.CylinderGeometry(.22,.3,.7,8),0x6a1840,0,2.6,0);
  part(body,new THREE.TorusGeometry(.7,.06,6,18),0xffe08a,0,3.35,0,null,.8).rotation.x=Math.PI/2;
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;part(body,new THREE.OctahedronGeometry(.12),i%2?0xff6aa8:0xffe08a,Math.sin(a)*.62,3.35,Math.cos(a)*.62,null,.75);}
  for(const s of [-1,1]){
   const curtain=new THREE.Group();curtain.position.set(s*.85,2.3,-.15);body.add(curtain);wings.push(curtain);
   part(curtain,new THREE.ExtrudeGeometry(wingShape(s,1.45,1.7),{depth:.06,bevelEnabled:false}),0x4a1840).userData.dynamic=true;
   const back=new THREE.Group();back.position.set(s*.55,2.1,.35);body.add(back);wings.push(back);
   part(back,new THREE.ExtrudeGeometry(wingShape(s,.9,1.2),{depth:.04,bevelEnabled:false}),0xff6aa8).userData.dynamic=true;
   part(body,new THREE.ConeGeometry(.14,.32,8),0xe7c56a,s*.95,.55,.15).rotation.x=Math.PI;
  }
 }
 const focus=part(body,new THREE.OctahedronGeometry(.12),phase>=3?0xc9b6ff:0xffd0ea,0,phase===4?2.2:1.55,.4,null,.7);focus.userData.dynamic=true;
 return {focus,wings,rotors:[]};
}
export function buildParesisEnemy(type,bossId,root,body,{part,tube}){
 if(String(bossId).startsWith('kephia'))return buildKephiaForm(bossId,root,body,{part,tube});
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
 const focus=part(body,new THREE.OctahedronGeometry(.12),0xffd0ea,0,1.7,.42,null,.55);focus.userData.dynamic=true;
 return {focus,wings,rotors:[]};
}
