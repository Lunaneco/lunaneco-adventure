// Silhouettes and colours adapted from the supplied Mochinyafe Dungeon cast.
import * as THREE from 'three';
export const MOCHI_ENEMIES=Object.freeze({
 mochiSlime:{name:'スライム',hp:130,speed:1.65,damage:28,radius:.7,role:'跳ねる突進',chapter:2,hint:'青いしずくの魔物。水色の帯に向かって跳び込むので、横へ逃げよう。',xp:20,crystals:2,buds:3},
 mochiGoblin:{name:'ゴブリン',hp:170,speed:2.15,damage:34,radius:.7,role:'棍棒の二連撃',chapter:2,hint:'棍棒を二度振り下ろす。最初の一撃を避けた後も、予告帯へ戻らないように。',xp:22,crystals:2,buds:3},
 mochiSkeleton:{name:'スケルトン',hp:145,speed:1.6,damage:30,radius:.65,role:'弓の四連射',chapter:2,ranged:true,hint:'橙の照準を固定して四連射。矢が止まるまで横へ動き続けよう。',xp:23,crystals:2,buds:3},
 mochiOrc:{name:'オーク',hp:320,speed:1.25,damage:48,radius:1,role:'斧の二段衝撃',chapter:2,hint:'斧の衝撃が二段階に広がる。外側の丸まで離れ、二撃目の後に反撃。',xp:30,crystals:3,buds:4},
 mochiWolf:{name:'ワーウルフ',hp:210,speed:2.85,damage:37,radius:.8,role:'狼の突進',chapter:2,hint:'短い予告から素早く飛びかかる。赤い帯を横へかわし、止まった隙に反撃。',xp:26,crystals:2,buds:4},
 mochiGolem:{name:'ゴーレム',hp:410,speed:.95,damage:52,radius:1.12,role:'三連の地響き',chapter:2,hint:'地響きが三つの丸を順に走る。縦に逃げず、予告の列を横へ抜けよう。',xp:34,crystals:3,buds:4},
 mochiDragon:{name:'ドラゴン',hp:270,speed:1.4,damage:38,radius:.95,role:'七方向の炎',chapter:2,ranged:true,hint:'七方向へ高速の火球を放つ。橙の線の隙間か、竜の背後へ動こう。',xp:32,crystals:3,buds:4},
});
export const MOCHI_BOSSES=Object.freeze({
 darkmochi:{name:'ダークもちにゃふぇ・影爪',subtitle:'THE SHADOW PAW',role:'里を襲う黒い影',color:0xff81b2,speed:1.7,radius:1.9,attacks:["影爪・五連裂き","影縫いの挟撃","残像爪の突進"],hint:'三本の爪の間へ二本の追撃。挟撃は横・縦・斜めと順番に来る。突進をかわした後も、残像が同じ道と左右を切り裂く。'},
 dreammochi:{name:'ダークもちにゃふぇ・夢喰',subtitle:'THE DREAM EATER',role:'眠りを奪う影',color:0xc99aff,speed:1.1,radius:2,attacks:["夢の牢獄","まどろみの反転","醒めない悪夢"],hint:'夢印の輪に囲まれた後、中央が破裂。輪状魔法では内側へ入り、次は外へ。足元・周囲・足元と繰り返す悪夢にも注意。'},
 bellmochi:{name:'ダークもちにゃふぇ・黒鈴',subtitle:'THE HOLLOW BELL',role:'声を閉じる影',color:0xffc17b,speed:1.25,radius:2,attacks:["黒鈴の輪舞","往復するこだま","沈黙の花鐘"],hint:'十字が回転しながら三連撃。輪のこだまは外へ広がった後、内側へ戻る。花びら状の鐘印は一つおきに破裂し、最後に中央を攻撃。'},
 kingmochi:{name:'ダークもちにゃふぇ・闇の王',subtitle:'THE LAST ECLIPSE',role:'最後の声を奪う王',color:0xff719a,speed:1.35,radius:2.3,attacks:["夜を閉ざす王冠","螺旋王冠のふぇ〜","王座砕きの大突進"],hint:'王冠の封印から中央爆発と外周の輪が続く。星弾は二連射、HP半分から三連射。突進後も左右の斬撃と王座の波紋に注意。'},
});
export function buildMochiEnemy(type,bossId,root,body,{part,ball,tube}){
 const boss=type==='boss',wings=[],rotors=[];let focus=null;
 const rod=(c,x,y,z,r,h)=>part(body,new THREE.CylinderGeometry(r,r,h,8),c,x,y,z);
 const eyes=(y,z,x=.22,c=0x311d30)=>{for(const s of [-1,1]){ball(body,c,s*x,y,z,[.10,.14,.045]);ball(body,0xffe9df,s*x-.025,y+.04,z+.036,[.025,.03,.014]);}};
 const feet=(c,x=.34,z=.26)=>{for(const s of [-1,1])ball(body,c,s*x,.17,z,[.27,.19,.33]);};
 if(boss){
  const fur=bossId==='dreammochi'?0x38304e:bossId==='bellmochi'?0x302a40:0x242339,accent=MOCHI_BOSSES[bossId].color;
  ball(body,fur,0,1.45,0,[1.55,1.32,1.18]);
  for(const s of [-1,1]){
   const ear=part(body,new THREE.ConeGeometry(.48,1.15,5),fur,s*.98,2.75,0);ear.rotation.z=-s*.2;
   const inner=part(body,new THREE.ConeGeometry(.28,.7,5),0xc174a9,s*1.0,2.82,.21);inner.rotation.z=-s*.2;
   ball(body,accent,s*.53,1.6,1.105,[.23,.29,.085]);ball(body,0xffe7ef,s*.57,1.69,1.18,[.055,.07,.018]);
   ball(body,0xc3669c,s*.98,1.23,.94,[.24,.14,.06]);
  }
  ball(body,0xd68eb4,0,1.28,1.205,[.1,.075,.07]);
  for(const s of [-1,1])tube(body,[[0,1.26,1.22],[s*.14,1.13,1.23],[s*.32,1.23,1.2]],.043,0xd68eb4);
  if(bossId==='kingmochi'){part(body,new THREE.CylinderGeometry(.56,.48,.24,8),0xd3b875,0,2.8,0);for(let i=0;i<5;i++)part(body,new THREE.ConeGeometry(.12,.55,5),0xe2bd70,Math.sin(i*1.26)*.48,3.1,Math.cos(i*1.26)*.48);focus=part(body,new THREE.OctahedronGeometry(.2),accent,0,2.94,.55,null,.8);}
  else if(bossId==='bellmochi'){part(body,new THREE.TorusGeometry(1.12,.09,6,28),0x85705e,0,.88,.05).rotation.x=Math.PI/2;focus=part(body,new THREE.SphereGeometry(.28,10,8),0xe8ba7b,0,.84,1.12,null,.5);}
  else if(bossId==='dreammochi'){part(body,new THREE.ConeGeometry(.48,1,8),0x866ca3,0,2.95,-.1).rotation.z=-.3;focus=part(body,new THREE.OctahedronGeometry(.13),accent,-.33,3.46,-.1,null,.5);}
  // The Mochinyafe family has a single limbless body. Shadow claws are spells,
  // not physical hands. Bring the belly down to the floor after removing paws.
  for(const child of body.children)child.position.y-=.13;
 }else if(type==='goldenSlime'){
  part(body,new THREE.SphereGeometry(1,20,16),0xffc329,0,.65,0,[.86,.69,.78],.23,.65);
  part(body,new THREE.ConeGeometry(.34,.48,16),0xffd35d,0,1.19,0,null,.2,.6);
  eyes(.76,.7,.24,0x573517);ball(body,0xfff9ce,-.3,1.04,.46,[.17,.09,.05]);
  tube(body,[[-.12,.51,.76],[0,.46,.79],[.12,.51,.76]],.033,0x7b4611);
  const halo=part(root,new THREE.TorusGeometry(1.05,.035,6,36),0xffe9a6,0,.1,0,null,.7,.3);halo.rotation.x=Math.PI/2;
  focus=new THREE.Group();focus.position.y=1.15;body.add(focus);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;part(focus,new THREE.OctahedronGeometry(.1),0xfff4ba,Math.sin(a),.25+Math.sin(a)*.25,Math.cos(a),[.6,1.6,.6],.9);}
 }else if(type==='mochiSlime'){
  ball(body,0x68c8ed,0,.58,0,[.75,.62,.68]);part(body,new THREE.ConeGeometry(.32,.42,12),0x68c8ed,0,1.08,0);eyes(.66,.58);ball(body,0xbbf2ff,-.26,.94,.34,[.12,.07,.04]);
 }else if(type==='mochiGolem'){
  for(const [x,y,z,s] of [[0,1.05,0,.86],[-.93,.9,0,.44],[.93,.9,0,.44],[0,1.95,0,.55]])part(body,new THREE.DodecahedronGeometry(s),0x898994,x,y,z);
  feet(0x5e616f,.45);eyes(1.99,.46,.22,0xffbe6d);focus=part(body,new THREE.OctahedronGeometry(.18),0xffbe6d,0,1.05,.74,null,.6);
 }else if(type==='mochiDragon'){
  ball(body,0xaa3848,0,.95,0,[.75,.86,.62]);ball(body,0xd86262,0,.87,.47,[.45,.58,.18]);ball(body,0xba454f,0,1.9,.17,[.71,.62,.6]);eyes(2.04,.67,.29);feet(0xa73349,.5);
  for(const s of [-1,1]){part(body,new THREE.ConeGeometry(.16,.63,6),0xf4dca4,s*.45,2.51,0).rotation.z=-s*.28;
   const wing=new THREE.Group();wing.position.set(s*.53,1.4,-.18);root.add(wing);wings.push(wing);const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(s*.9,.65);shape.lineTo(s*1.3,-.3);shape.lineTo(s*.65,-.05);shape.lineTo(s*.38,-.5);shape.closePath();part(wing,new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false}),0x842b43);}
  tube(body,[[0,.6,-.4],[.5,.36,-1],[1,.3,-1.35]],.15,0xae3b48);
 }else if(type==='mochiSkeleton'){
  const bone=0xe8dfc5;ball(body,bone,0,1.82,0,[.44,.48,.37]);eyes(1.87,.34,.16,0x30263f);
  rod(bone,0,1.05,0,.085,1);for(const s of [-1,1]){for(let i=0;i<3;i++)tube(body,[[0,1.42-i*.17,0],[s*.3,1.32-i*.17,.03],[s*.18,1.17-i*.17,.22]],.045,bone);rod(bone,s*.2,.46,0,.07,.78);rod(bone,s*.48,1.12,0,.07,.68);}feet(bone,.2);tube(body,[[.62,.6,.1],[.94,1.2,.2],[.65,1.9,.1]],.05,0x896b4d);tube(body,[[.62,.6,.1],[.65,1.9,.1]],.012,bone);
 }else{
  const wolf=type==='mochiWolf',orc=type==='mochiOrc',skin=wolf?0x747788:orc?0x6d944d:0x97b553;
  ball(body,skin,0,.92,0,[orc?.79:.51,.7,.45]);ball(body,skin,0,1.77,.03,[orc?.66:.56,.53,.45]);feet(skin,orc?.5:.32);eyes(1.86,.44,.23);
  for(const s of [-1,1]){const ear=part(body,new THREE.ConeGeometry(.25,.6,4),skin,s*.51,2.0,0);ear.rotation.z=-s*(wolf?.3:1.1);ball(body,skin,s*(orc?.8:.57),.92,.09,[.23,.47,.25]);part(body,new THREE.ConeGeometry(.07,.2,5),0xffe8bc,s*.19,1.43,.46);}
  if(wolf){ball(body,0xa4a4b2,0,1.58,.43,[.3,.23,.29]);ball(body,0x342735,0,1.65,.68,[.13,.1,.07]);tube(body,[[0,.63,-.4],[.4,.9,-.8],[.5,1.08,-1]],.15,skin);}
  else{part(body,new THREE.CylinderGeometry(orc?.73:.48,orc?.83:.56,.43,9),0x806049,0,.45,0);const club=rod(0x8b5a3c,-(orc?.98:.78),1.15,.25,.11,1.6);club.rotation.z=.25;if(orc){const blade=part(body,new THREE.BoxGeometry(.64,.6,.12),0x989cab,-.94,1.84,.25);blade.rotation.z=.2;}else ball(body,0x9e7246,-.97,1.84,.25,[.24,.44,.25]);}
 }
 if(focus){focus.userData.dynamic=true;focus.traverse(o=>{o.userData.dynamic=true;});}
 return {focus,wings,rotors};
}
