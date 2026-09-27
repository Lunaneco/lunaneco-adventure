import * as THREE from 'three';
// PRISM BREAK references: blue crystal slime, blue bat, and the suffering Prism Dragon.
const enemy=(name,hp,speed,damage,radius,role,hint,extra={})=>({name,hp,speed,damage,radius,role,hint,chapter:4,xp:42,crystals:3,buds:4,barHeight:2.6,...extra});
export const PRISM_ENEMIES=Object.freeze({
 prismCrawler:enemy('青晶のスライム',390,2.5,65,.85,'地上を進む結晶スライム','青い体が近づいたら横へ。地形の角で囲まれないように距離を取ろう。'),
 prismBat:enemy('結晶コウモリ',240,3,43,.65,'浮遊する青い翼','素早く近づく飛行敵。スライムと重なる前に狙いを定めよう。',{flying:true}),
});
export const PRISM_BOSSES=Object.freeze(Object.fromEntries(['prismShard','prismMirror','prismWing','prismHeart'].map((id,i)=>[id,{
 name:`プリズムドラゴン・${['青晶','虹光','暴走','光の解放'][i]}`,subtitle:'PRISM DRAGON',color:[0x8fddff,0xa8c5ff,0xc5baff,0xacefff][i],speed:1.4,radius:2.3,flying:true,
 role:'あふれる光に苦しむ結晶の竜',attacks:['プリズム拡散弾','一直線のプリズムブレス','プリズム拡散弾'],
 hint:'拡散する三つの光弾の間を抜け、直線ブレスの予告から横へ。HP半分から五方向の弾と短い溜めに変化。倒すと暴走の光を浄化する。'
}])));
export function buildPrismEnemy(type,bossId,root,body,{part,ball,tube,bakeGroup}){
 const boss=type==='boss',wings=[];let focus=null;
 if(!boss&&type==='prismCrawler'){
  part(body,new THREE.IcosahedronGeometry(.85,1),0x61c8ee,0,.65,0,[1,.78,.95],.12,.25);
  for(const s of [-1,1]){ball(body,0x72dce8,s*.67,.15,.2,[.4,.16,.45]);ball(body,0x103e58,s*.3,.72,.64,[.13,.16,.07]);ball(body,0xb3fff5,s*.3,.74,.70,[.08,.11,.035]);}
  for(let i=0;i<4;i++)part(body,new THREE.OctahedronGeometry(.17),0xb3f4ff,Math.sin(i*2)*.48,1.05,Math.cos(i*2)*.35,[.6,1.1,.6],.2);
 }else if(!boss){
  part(body,new THREE.OctahedronGeometry(.5),0x449bd7,0,1.35,0,[.75,1.2,.7],.2);
  for(const s of [-1,1]){const wing=new THREE.Group();wing.position.set(s*.22,1.4,0);root.add(wing);wings.push(wing);
   const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(s*.65,.65);shape.lineTo(s*1.05,.08);shape.lineTo(s*.65,.04);shape.lineTo(s*.3,-.32);shape.closePath();part(wing,new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:false}),0x8be2ff);bakeGroup(wing);
   ball(body,0xd9ffff,s*.14,1.43,.34,[.065,.065,.03]);}
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
 return {focus,wings,rotors:[]};
}
