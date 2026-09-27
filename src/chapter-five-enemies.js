import * as THREE from 'three';
// PRISM BREAK references: blue crystal slime, blue bat, and the suffering Prism Dragon.
const enemy=(name,hp,speed,damage,radius,role,hint,extra={})=>({name,hp,speed,damage,radius,role,hint,chapter:4,xp:42,crystals:3,buds:4,barHeight:2.6,...extra});
export const PRISM_ENEMIES=Object.freeze({
 prismCrawler:enemy('青晶のスライム',390,2.5,65,.85,'二段の晶爪','水色の帯へ二度飛びかかる。二段目が消えるまで横へ避けよう。'),
 prismBat:enemy('結晶コウモリ',240,3,43,.65,'飛行・追尾する晶弾','二つの晶弾が1.5秒だけ曲がる。引きつけて横へ回避。',{ranged:true,flying:true}),
 prismHound:enemy('虹晶の走竜',350,2.5,65,.9,'二段の跳躍突進','青い帯へ走り、止まってからもう一度狙う。二度目の予告も見よう。'),
 prismLancer:enemy('氷晶の槍兵',360,2.05,62,.85,'交差する氷槍','縦と横の帯を順番に貫く。消えた帯へ切り返そう。'),
 prismGolem:enemy('青晶の重衛',500,1.25,78,1.12,'内外の晶震','中央の爆発、続いて外側の輪。最初の爆発後は内側へ。'),
 prismWisp:enemy('極光の灯霊',270,1.75,46,.72,'三方向の連続晶弾','三方向の晶弾を二度放つ。曲がる時間は短いので、予告の隙間を抜けよう。',{ranged:true,flying:true}),
 prismBloom:enemy('七彩の晶花',300,1.45,51,.78,'追いかける開花印','足元を狙う三つの花印が順に開く。印が止まったら離れよう。',{ranged:true}),
});
export const PRISM_BOSSES=Object.freeze(Object.fromEntries(['prismShard','prismMirror','prismWing','prismHeart'].map((id,i)=>[id,{
 name:`プリズムドラゴン・${['青晶','虹光','暴走','光の解放'][i]}`,subtitle:'PRISM DRAGON',color:[0x8fddff,0xa8c5ff,0xc5baff,0xacefff][i],speed:1.4,radius:2.3,flying:true,
 role:'あふれる光に苦しむ結晶の竜',attacks:['プリズム拡散弾','一直線のプリズムブレス','プリズム拡散弾'],
 hint:'三方向の拡散弾と直線ブレスを二連続で放つ。予告から横へ避け、二撃目まで見よう。HP半分から五方向弾・三連撃へ強化。倒すと暴走の光を浄化する。'
}])));
export function buildPrismEnemy(type,bossId,root,body,{part,ball,tube,bakeGroup}){
 const boss=type==='boss',wings=[],rotors=[];let focus=null;
 if(!boss&&type==='prismCrawler'){
  part(body,new THREE.IcosahedronGeometry(.85,1),0x61c8ee,0,.65,0,[1,.78,.95],.12,.25);
  for(const s of [-1,1]){ball(body,0x72dce8,s*.67,.15,.2,[.4,.16,.45]);ball(body,0x103e58,s*.3,.72,.64,[.13,.16,.07]);ball(body,0xb3fff5,s*.3,.74,.70,[.08,.11,.035]);}
  for(let i=0;i<4;i++)part(body,new THREE.OctahedronGeometry(.17),0xb3f4ff,Math.sin(i*2)*.48,1.05,Math.cos(i*2)*.35,[.6,1.1,.6],.2);
 }else if(type==='prismBat'){
  part(body,new THREE.OctahedronGeometry(.5),0x449bd7,0,1.35,0,[.75,1.2,.7],.2);
  for(const s of [-1,1]){const wing=new THREE.Group();wing.position.set(s*.22,1.4,0);root.add(wing);wings.push(wing);
   const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(s*.65,.65);shape.lineTo(s*1.05,.08);shape.lineTo(s*.65,.04);shape.lineTo(s*.3,-.32);shape.closePath();part(wing,new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:false}),0x8be2ff);bakeGroup(wing);
   ball(body,0xd9ffff,s*.14,1.43,.34,[.065,.065,.03]);}
 }else if(type==='prismHound'){
  part(body,new THREE.IcosahedronGeometry(.75,1),0x78cce8,0,.75,0,[.75,.75,1.45]);
  part(body,new THREE.IcosahedronGeometry(.43,1),0xa0e0f4,0,1.05,.95,[.85,.8,1.25]);
  for(const s of [-1,1]){
   for(const z of [-.6,.6])part(body,new THREE.CylinderGeometry(.16,.23,.64,5),0x6896c5,s*.5,.34,z);
   part(body,new THREE.ConeGeometry(.12,.55,5),0xe1c2ff,s*.28,1.56,.8).rotation.z=-s*.28;
   ball(body,0xeaffff,s*.27,1.13,1.27,[.08,.07,.04]);
  }
  for(let n=0;n<4;n++)part(body,new THREE.OctahedronGeometry(.2),[0x90ffd8,0xb5caff,0xe5b9ff,0xa6ecff][n],0,1.43-n*.07,.35-n*.35,[.55,1.3,.6],.2);
  tube(body,[[0,.75,-.95],[.2,.85,-1.45],[.35,1.05,-1.8]],.13,0x8ebce7);
 }else if(type==='prismLancer'){
  part(body,new THREE.OctahedronGeometry(.6),0x91bde1,0,1.15,0,[.8,1.4,.65]);
  part(body,new THREE.IcosahedronGeometry(.35,0),0xc9e8fb,0,2.03,0,[.85,1.1,.8]);
  for(const s of [-1,1]){
   part(body,new THREE.CylinderGeometry(.14,.19,.75,5),0x668bad,s*.27,.4,0);
   part(body,new THREE.OctahedronGeometry(.3),0xbbe6ff,s*.54,1.58,0,[1,.8,.8]);
   tube(body,[[s*.53,1.48,0],[s*.69,1.08,.14],[s*.82,1.12,.4]],.13,0x81a6ce);
   ball(body,0xafffff,s*.12,2.06,.25,[.07,.035,.04]);
  }
  part(body,new THREE.CylinderGeometry(.045,.06,2.5,6),0xcedcf8,.83,1.27,.4);
  part(body,new THREE.OctahedronGeometry(.24),0xa1f8ff,.83,2.7,.4,[.7,1.8,.55],.35);
  focus=part(body,new THREE.OctahedronGeometry(.16),0xd9c2ff,0,1.43,.3,null,.6);focus.userData.dynamic=true;
 }else if(type==='prismGolem'){
  part(body,new THREE.DodecahedronGeometry(.92,0),0x7fa9cf,0,1.2,0,[1,1.05,.72]);
  part(body,new THREE.IcosahedronGeometry(.48,0),0xb2d6f0,0,2.16,0,[1,.8,.8]);
  for(const s of [-1,1]){
   part(body,new THREE.DodecahedronGeometry(.49,0),0x6790b4,s*1.02,1.3,0,[.8,1.5,.85]);
   part(body,new THREE.DodecahedronGeometry(.4,0),0x85bada,s*.46,.29,.08,[.8,1,.95]);
   part(body,new THREE.ConeGeometry(.2,.72,5),0xc3f3ff,s*.97,2.12,0);
   ball(body,0xe1ffff,s*.19,2.2,.36,[.12,.045,.035]);
  }
  focus=part(body,new THREE.OctahedronGeometry(.3),0xa6ffe5,0,1.36,.62,[1,1.25,.6],.65);focus.userData.dynamic=true;
 }else if(type==='prismWisp'){
  focus=part(body,new THREE.OctahedronGeometry(.38),0xeddbff,0,1.55,0,[.8,1.3,.8],.65);focus.userData.dynamic=true;
  const halo=new THREE.Group();halo.position.y=1.55;root.add(halo);rotors.push(halo);
  for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3;part(halo,new THREE.OctahedronGeometry(.24),[0xa4ffe2,0xb3c4ff,0xf0c3f9][i],Math.sin(a)*.76,Math.cos(a)*.55,0,[.5,1.45,.6],.3);
  }
  part(halo,new THREE.TorusGeometry(.64,.035,5,24),0xabc7ef).rotation.x=.38;bakeGroup(halo);
  for(const s of [-1,1])ball(body,0x395582,s*.11,1.58,.28,[.045,.065,.035]);
 }else if(type==='prismBloom'){
  tube(body,[[0,.1,0],[.1,.55,0],[0,1.1,0]],.16,0x68a9b6);
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3,petal=part(body,new THREE.OctahedronGeometry(.43),[0x95dfff,0xb0ccff,0xdcc0ff,0xf5d2ef,0xacecdb,0xb2f3ff][i],Math.sin(a)*.64,1.25,Math.cos(a)*.64,[.55,.45,1.2],.16);petal.rotation.y=a;
  }
  for(const s of [-1,1])part(body,new THREE.OctahedronGeometry(.48),0x779bbd,s*.42,.23,.04,[1,.35,.5]);
  focus=part(body,new THREE.IcosahedronGeometry(.37,1),0xf1e5ab,0,1.43,0,[1,.75,1],.55);focus.userData.dynamic=true;
 }else{
  const i=Object.keys(PRISM_BOSSES).indexOf(bossId),scale=1.45+i*.05;body.scale.setScalar(scale);root.userData.demonScale=scale;
  part(body,new THREE.IcosahedronGeometry(.92,1),0x6fbbef,0,1.45,0,[.8,1.1,1.35],.08,.35);
  ball(body,0xb4edf5,0,1.45,.67,[.56,.8,.47]);
  tube(body,[[0,1.5,.7],[0,2.1,1.0],[0,2.4,1.45]],.36,0x8ac9f5);
  part(body,new THREE.IcosahedronGeometry(.52,1),0x76c9fa,0,2.4,1.5,[.9,.8,1.4],.1,.4);
  part(body,new THREE.BoxGeometry(.55,.19,.53),0x345377,0,2.13,1.95);
  for(const s of [-1,1]){
   ball(body,0xc9ffff,s*.31,2.55,1.84,[.11,.07,.05]);
   part(body,new THREE.ConeGeometry(.17,.94,5),0xaba8ff,s*.34,3.08,1.26).rotation.z=-s*.27;
   tube(body,[[s*.58,1.65,.55],[s*.92,1.2,.85],[s*.88,.97,1.3]],.18,0x83c8f5);
   tube(body,[[s*.51,.95,-.4],[s*.8,.52,-.3],[s*.82,.35,.35]],.25,0x66ade2);
   for(let n=0;n<3;n++)for(const y of [.35,.97])part(body,new THREE.ConeGeometry(.055,.25,5),0xd4faff,s*(.72+n*.1),y,(y===.35?.63:1.54)).rotation.x=Math.PI/2;
   const wing=new THREE.Group();wing.position.set(s*.65*scale,2.05*scale,-.28);root.add(wing);wings.push(wing);wing.scale.setScalar(scale);
   const verts=[[0,0,0],[s*1.25,1.45,0],[s*2.65,1.95,-.15],[s*2.05,-.45,.05],[s*1.25,-.1,.05],[s*.62,-.68,.05]];
   for(let n=1;n<5;n++){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([...verts[0],...verts[n],...verts[n+1],...verts[n+1],...verts[n],...verts[0]],3));geo.computeVertexNormals();part(wing,geo,[0xb0d8ff,0xa8f1e5,0xe0c5ff,0xffe5bc][(n+i)%4],0,0,0,null,.18,.2);}
   tube(wing,[verts[0],verts[1],verts[2]],.11,0x8edbff);for(let n=3;n<6;n++)tube(wing,[verts[0],verts[n]],.055,0x9fd8ff);bakeGroup(wing);
  }
  tube(body,[[0,1.1,-.9],[.3,1.0,-1.6],[.55,1.25,-2.2],[.8,1.8,-2.75]],.22,0x72b9f3);
  for(let n=0;n<6;n++)part(body,new THREE.ConeGeometry(.16,.5,5),0xbdc9ff,0,2.35-n*.1,.35-n*.35);
  focus=part(body,new THREE.OctahedronGeometry(.28),0xd2faff,0,1.8,.98,[.8,1.1,.65],.75);focus.userData.dynamic=true;
 }
 return {focus,wings,rotors};
}
