import * as THREE from 'three';
import {GOLDEN_SLIME} from './golden-slime.js';

export const GOLDEN_HEHE=Object.freeze({type:'goldenHehe',name:'黄金のへへへ',chance:.2,lifetime:20,hp:2200,speed:4.6,damage:0,radius:.8,role:'黄金のレア敵',chapter:5,rare:true,barHeight:3.3,xp:3000,crystals:0,buds:200,tickets:10,stones:1,hint:'各幕で一度だけ20%抽選。20秒で逃走。素材はレアスライムの2倍＋★3の紅月の結晶40個・魔心の宝珠20個！',materials:Object.freeze({...Object.fromEntries(Object.entries(GOLDEN_SLIME.materials).map(([id,n])=>[id,n*2])),bloodCrystal:40,demonHeart:20})});
export function goldenHeheWave(act,rng){if(act?.chapter!==5)return null;if(act.extra&&act.goldenHeheWave===3)return 3;const roll=rng();return Number.isFinite(roll)&&roll>=0&&roll<GOLDEN_HEHE.chance?1+Math.min(4,Math.floor(rng()*5)):null;}
const enemy=(name,hp,speed,damage,role,hint,extra={})=>Object.freeze({name,hp,speed,damage,radius:.78,role,hint,chapter:5,barHeight:3.2,xp:38,crystals:3,buds:4,...extra});
export const HEHE_ENEMIES=Object.freeze({
 heheBrawler:enemy('へへへ・拳闘士',290,2.5,42,'拳の近接','短い橙の帯の後に拳を振るう。背後へ回り込もう。'),
 heheArcher:enemy('へへへ・弓兵',240,1.8,32,'三方向の弓矢','三本の照準線を横へ抜けよう。飛んでいる矢はライスの力で掴める。',{ranged:true}),
 heheMage:enemy('へへへ・魔導士',260,1.5,32,'時間差の魔法','足元の魔法陣から離れよう。詠唱中に倒すと解除できる。',{ranged:true}),
 heheRunner:enemy('へへへ・突撃隊',280,3,44,'高速突進','長い赤い帯のあとに突進。横にかわし、止まった後に反撃。'),
 heheGuard:enemy('へへへ・鉄腕兵',560,1.2,52,'重装・衝撃波','頑丈な盾と輪の衝撃波。輪の内側か外側へ逃げよう。',{radius:1}),
});
const boss=(name,color,role,attacks,hint)=>Object.freeze({name,subtitle:'HEHEHE LAND',role,color,speed:1.4,radius:2.2,attacks,hint});
export const HEHE_BOSSES=Object.freeze({
 heheGate:boss('へへへ・門番長',0xd7aa69,'門前の拳闘王',['門を塞ぐ拳','門番の散弾','門前突破'],'巨大な拳の帯をかわそう。ボス自身は掴めないが、飛ぶ弾はライスの力で掴める。'),
 heheArcher:boss('へへへ・射撃隊長',0x82c9ea,'追撃する大弓',['狙い撃ち','連続扇矢','射線の突撃'],'五方向の矢と時間差の連射。固定された照準線から横へ離れよう。'),
 heheGuard:boss('へへへ・鉄腕将軍',0xabb5c5,'街路を砕く鉄腕',['鉄腕の衝撃','鉄片の散弾','鉄腕突進'],'輪の衝撃波は中央か外側が安全。重い突進が止まった後に反撃しよう。'),
 heheKing:boss('へへへ大王',0xffcd68,'へへへランドの大王',['大王の号令','王冠の弾幕','大王の大進撃'],'足元の印と弾幕を順番に回避。HP半分で連射が増加する。遠距離の弾は掴んで投げ返せる。'),
});

// The supplied bald, bespectacled silhouette is shared by all classes; equipment
// and shirt colours communicate their attack role without covering the scalp.
export function buildHeheEnemy(type,bossId,root,body,{part,ball,tube}){
 const isBoss=type==='boss',gold=type===GOLDEN_HEHE.type,role=isBoss?bossId:type;
 const skin=gold?0xffcc58:0xd99565,pants=gold?0xd39b27:0x252a2b;
 const shirt=gold?0xffdb72:({heheArcher:0x416c87,heheMage:0x785e95,heheRunner:0x974d46,heheGuard:0x64717b}[role]??0x626241);
 if(isBoss){const scale=1.55+Object.keys(HEHE_BOSSES).indexOf(bossId)*.12;body.scale.setScalar(scale);root.userData.demonScale=scale;}
 ball(body,shirt,0,1.5,0,[.61,.68,.34]);ball(body,skin,0,2.6,.02,[.39,.49,.34]);
 part(body,new THREE.CylinderGeometry(.17,.22,.3,10),skin,0,2.12,0);
 for(const s of [-1,1]){
  ball(body,skin,s*.39,2.57,.01,[.09,.15,.08]);ball(body,shirt,s*.62,1.82,0,[.25,.3,.27]);
  tube(body,[[s*.67,1.65,0],[s*.76,1.12,.13],[s*.69,.83,.23]],.16,skin);ball(body,skin,s*.69,.78,.23,[.18,.22,.17]);
  part(body,new THREE.CylinderGeometry(.22,.18,.95,10),pants,s*.26,.66,0);
  ball(body,pants,s*.27,.13,.18,[.23,.16,.37]);
  // Four straight frame segments, clear lenses, eyebrows and visible eyes.
  for(const y of [2.5,2.68])part(body,new THREE.BoxGeometry(.29,.035,.035),0x242526,s*.19,y,.34);
  for(const x of [.055,.325])part(body,new THREE.BoxGeometry(.035,.18,.035),0x242526,s*x,2.59,.34);
  ball(body,0xf5f1df,s*.19,2.59,.33,[.11,.05,.018]);ball(body,0x493121,s*.19,2.59,.35,[.04,.045,.02]);
  part(body,new THREE.BoxGeometry(.24,.035,.025),0x4c3022,s*.19,2.72,.31).rotation.z=-s*.12;
 }
 part(body,new THREE.BoxGeometry(.14,.03,.045),0x242526,0,2.61,.37);ball(body,skin,0,2.5,.38,[.08,.12,.1]);
 part(body,new THREE.BoxGeometry(.15,.025,.03),0x754634,0,2.35,.33);
 part(body,new THREE.BoxGeometry(.13,.13,.09),0x202226,-.75,1.04,.17);
 part(body,new THREE.BoxGeometry(1,.09,.67),pants,0,1.06,0);
 if(role==='heheArcher'){tube(body,[[.9,.7,.35],[1.15,1.4,.42],[.9,2.1,.35]],.065,0xd5b274);tube(body,[[.9,.7,.35],[.9,2.1,.35]],.012,0xf4e7c7);}
 if(role==='heheMage'){part(body,new THREE.CylinderGeometry(.05,.05,1.9,8),0x8f719f,.9,1.2,.2);part(body,new THREE.OctahedronGeometry(.22),0xd7a7ff,.9,2.25,.2,null,.35);}
 if(role==='heheGuard'){part(body,new THREE.BoxGeometry(.7,.95,.16),0x8e9ca9,.78,1.4,.45);part(body,new THREE.BoxGeometry(.08,.8,.02),0xffdaa0,.78,1.4,.54);}
 if(role==='heheRunner')for(const s of [-1,1])part(body,new THREE.BoxGeometry(.2,.32,.25),0xbf8860,s*.7,.86,.28);
 if(isBoss){part(body,new THREE.TorusGeometry(.33,.06,6,16),0xf7c56e,0,3.03,0).rotation.x=Math.PI/2;for(const s of [-1,0,1])part(body,new THREE.ConeGeometry(.08,.26,5),0xf7c56e,s*.23,3.17,.03);}
 if(role==='heheGate'||role==='heheKing')for(const s of [-1,1])ball(body,0xd6ab68,s*.7,.83,.27,[.28,.26,.27]);
 const focus=gold?part(body,new THREE.OctahedronGeometry(.16),0xffedb2,0,1.72,.36,null,.55):null;if(focus)focus.userData.dynamic=true;
 return {focus,wings:[],rotors:[]};
}
