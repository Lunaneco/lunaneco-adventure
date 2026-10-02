import * as THREE from 'three';
const enemy=(name,hp,speed,damage,role,hint,extra={})=>Object.freeze({name,hp,speed,damage,radius:.78,chapter:6,barHeight:3.1,xp:38,crystals:3,buds:4,role,hint,...extra});
export const ANTI_KEMO_ENEMIES=Object.freeze({
 antiBrawler:enemy('アンチケモみみ・排斥兵',290,2.5,42,'警棒の近接','短い帯の警棒攻撃。後ろへ回り込もう。'),
 antiSniper:enemy('アンチケモみみ・封鎖射手',240,1.8,32,'遠距離封鎖','三本の照準線の後に射撃。横へ動いて避ける。',{ranged:true}),
 antiCaster:enemy('アンチケモみみ・制圧術師',260,1.5,32,'時間差の魔法','足元の魔法陣から離れ、詠唱中に止めよう。',{ranged:true}),
 antiRunner:enemy('アンチケモみみ・追放突撃兵',280,3,44,'高速突進','長い赤い帯を横へかわし、止まった後に反撃。'),
 antiGuard:enemy('アンチケモみみ・装甲兵',560,1.2,52,'盾と衝撃波','頑丈な盾兵。衝撃波の中央か外へ逃げよう。',{radius:1}),
});
const boss=(name,color,role)=>Object.freeze({name,color,role,subtitle:'ANTI-KEMOMIMI',speed:1.4,radius:2.2,attacks:['封鎖の一撃','制圧の散弾','包囲突破'],hint:'橙の照準と赤い突進の帯を順にかわす。飛ぶ弾はライスの力で掴める。ボス自身は掴めない。'});
export const ANTI_KEMO_BOSSES=Object.freeze({antiGate:boss('アンチケモみみ・門封じ隊長',0xdaac75,'村門を塞ぐ隊長'),antiSniper:boss('アンチケモみみ・封鎖射撃隊長',0x98d9ef,'避難路の射撃隊長'),antiGuard:boss('アンチケモみみ・装甲包囲長',0xb6b9d9,'避難所を囲む装甲長'),antiLeader:boss('アンチケモみみ集団・首領',0xf2bc83,'村を占拠した首領')});
// Original helmeted, masked humanoids: no bald Hehe skin or cat-ear anatomy.
export function buildAntiKemoEnemy(type,bossId,root,body,{part,ball,tube}){
 const role=type==='boss'?bossId:type,boss=type==='boss',color=boss?ANTI_KEMO_BOSSES[bossId].color:({antiSniper:0x567787,antiCaster:0x76638d,antiRunner:0x925b60,antiGuard:0x757c87}[role]??0x6c6873);
 if(boss){body.scale.setScalar(1.65);root.userData.demonScale=1.65;}
 ball(body,0x313643,0,1.5,0,[.57,.67,.32]);part(body,new THREE.BoxGeometry(.85,.9,.17),color,0,1.6,.26);
 ball(body,0xc5a7a1,0,2.55,0,[.34,.4,.29]);ball(body,0x343746,0,2.74,-.02,[.42,.36,.35]);
 part(body,new THREE.BoxGeometry(.69,.16,.06),0x8dcedc,0,2.57,.29);part(body,new THREE.BoxGeometry(.57,.2,.07),0x292b38,0,2.37,.27);
 for(const s of [-1,1]){ball(body,color,s*.59,1.87,0,[.23,.28,.23]);tube(body,[[s*.62,1.73,0],[s*.72,1.16,.08],[s*.67,.9,.24]],.14,0x373d4b);ball(body,0x363745,s*.67,.86,.25,[.17,.18,.16]);part(body,new THREE.CylinderGeometry(.21,.17,1.02,8),0x343742,s*.25,.68,0);ball(body,0x292d37,s*.26,.14,.14,[.21,.14,.29]);}
 // A crossed-out ear emblem communicates the faction without labels or slogans.
 for(const s of [-1,1])part(body,new THREE.ConeGeometry(.09,.16,3),0xbabaca,s*.12,1.85,.36);
 const slash=part(body,new THREE.BoxGeometry(.06,.51,.025),0xe28c91,0,1.7,.4);slash.rotation.z=-.72;
 if(role==='antiGuard'){part(body,new THREE.BoxGeometry(.73,1.05,.18),color,.78,1.36,.44);part(body,new THREE.BoxGeometry(.1,.9,.02),0xd6d7e4,.78,1.36,.54);}
 else if(role==='antiSniper'){part(body,new THREE.BoxGeometry(.18,.22,.88),0x333744,.72,1.04,.59);part(body,new THREE.CylinderGeometry(.045,.05,.53,8),color,.72,1.08,1.11).rotation.x=Math.PI/2;}
 else if(role==='antiCaster'){part(body,new THREE.CylinderGeometry(.05,.05,1.5,8),0x514666,.74,1.49,.28);part(body,new THREE.OctahedronGeometry(.18),0xc4a1ef,.74,2.34,.28,null,.4);}
 else part(body,new THREE.CylinderGeometry(.075,.075,.85,8),0xa4aab8,.7,1.24,.37).rotation.x=-.3;
 if(boss)part(body,new THREE.BoxGeometry(.77,.17,.66),color,0,3.01,0);
 if(boss&&bossId==='antiLeader'){part(body,new THREE.BoxGeometry(1.7,1.9,.16),0x4e455d,0,1.45,-.38);part(body,new THREE.ConeGeometry(.18,.4,4),0xe8c58d,0,3.27,0);}
 return {focus:null,wings:[],rotors:[]};
}
export function antiKemoEnemyAttack(g,e,h){
 const {angle,d,route,dt,slow,move,line,circle,ring,charge,lockCast,volley,cooldownRate}=h;e.special-=dt*cooldownRate;
 if(e.special<=0&&d<16){
  if(e.type==='antiSniper'){volley(g,e,{angle,offsets:[-.2,0,.2],delay:1.05,speed:12,damage:32,kind:'enemyArrow',color:0x9bcfe2});e.special=3.3;}
  else if(e.type==='antiCaster'){circle(g,e,g.player.x,g.player.z,2.2,1.4,38,0xc2a7e5);lockCast(g,e,1.4,{kind:'chant',angle});e.special=4.4;}
  else if(e.type==='antiRunner'&&d>3){charge(g,e,angle,.9,13,.55,1.7,0xe79ba2);e.special=4;}
  else if(e.type==='antiGuard'&&d<6){ring(g,e,e.x,e.z,1.4,5,.95,46,0xbcc3dd);lockCast(g,e,.95,{kind:'chant',angle});e.special=3.7;}
  else if(d<3.5){line(g,e,angle,3.7,1.5,.7,42,0xe7c39f);lockCast(g,e,.7,{kind:'chant',angle});e.special=2.6;}
  else{move(e,route.x,route.z,e.speed*slow,dt);return;}
  g.emit('enemyCast',{id:e.id,type:e.type});return;
 }
 if(d>(['antiSniper','antiCaster'].includes(e.type)?8:e.radius+.6))move(e,route.x,route.z,e.speed*slow,dt);
}
export function antiKemoBossAttack(g,e,h){
 const {angle,action,color,empowered,line,circle,ring,charge,lockCast,volley}=h;
 if(action===0){if(e.bossId==='antiGuard')ring(g,e,e.x,e.z,2.8,9,1.1,43,color);else if(e.bossId==='antiLeader')for(const offset of [-2,0,2])circle(g,e,g.player.x+offset,g.player.z,2.2,1.1+Math.abs(offset)*.16,40,color);else line(g,e,angle,e.bossId==='antiSniper'?20:7,2,1.1,42,color);lockCast(g,e,1.1,{kind:'chant',angle});}
 else if(action===1)volley(g,e,{angle,offsets:empowered?[-.48,-.24,0,.24,.48]:[-.3,0,.3],waves:empowered?3:2,interval:.45,delay:1.05,speed:11,damage:34,kind:'enemyArrow',color});
 else charge(g,e,angle,empowered?.8:1.15,15,.8,3,color);
}
