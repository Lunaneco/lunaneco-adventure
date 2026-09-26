import * as THREE from 'three';
const enemy=(name,hp,speed,damage,radius,role,hint,extra={})=>({name,hp,speed,damage,radius,role,hint,chapter:3,xp:42,crystals:3,buds:4,barHeight:2.6,...extra});
export const DEMON_ENEMIES=Object.freeze({
 demonImp:enemy('紅角の小悪魔',280,2.65,48,.65,'二段の爪','赤い帯を二度なぎ払う。二段目まで横へ回避しよう。'),
 demonBat:enemy('夜翼の悪魔',240,3.0,43,.65,'飛行・追尾火球','桃色の火球は1.5秒だけ追尾。引きつけて横へ回避。',{ranged:true,flying:true}),
 demonHound:enemy('獄門の魔犬',390,2.5,65,.9,'二段突進','一度止まってから再照準して突進。二本目の予告も見よう。'),
 demonWitch:enemy('紅霧の魔女',310,1.75,46,.72,'三連の追尾弾','三方向の火球がゆっくり曲がる。近づきすぎず切り返そう。',{ranged:true}),
 demonArmor:enemy('黒鉄の鎧悪魔',660,1.25,82,1.12,'連続の地響き','内側の爆発から外側の輪へ。最初の爆発後は中央が安全。'),
 demonReaper:enemy('黒薔薇の刈り手',420,2.05,62,.85,'交差する鎌','縦と横に順番に斬る。最初の帯が消えてから位置を変えよう。'),
 demonEye:enemy('魔眼の悪魔',340,1.45,51,.78,'追跡する魔法陣','三つの印を移動先へ順番に置く。予告は途中で止まるので歩き続けよう。',{ranged:true,flying:true}),
});
export const DEMON_BOSSES=Object.freeze(Object.fromEntries([
 ['demonWarden','紅角の門番','THE GARNET WARDEN',0xf595a8,1.4,2.0,['門番の連続爪','追尾する紅火','門破りの二段突進']],
 ['demonSiren','眠れぬ夢魔','THE RESTLESS SIREN',0xd4a3ff,1.55,1.8,['眠りの三重輪','夢追いの星火','夢渡りの突進']],
 ['demonKnight','黒翼の騎士長','THE BLACKWING CAPTAIN',0xadbdff,1.5,2.05,['黒翼の交差斬り','騎士の追撃火','返し刃の突進']],
 ['demonKing','悪魔大王','THE KIND DEMON KING',0xff97b1,1.2,2.55,['王冠の連続封印','紅月の追尾弾幕','王城を守る三連撃']],
].map(([id,name,subtitle,color,speed,radius,attacks])=>[id,{name,subtitle,color,speed,radius,attacks,role:'暴走した悪魔',hint:'追尾弾は曲がる時間が限られる。足元の印は発動前に止まる。連撃を最後までかわして反撃。HP半分から弾数と手数が増加。'}])));
export function buildDemonEnemy(type,bossId,root,body,{part,ball,tube},calm=false){
 const boss=type==='boss',id=boss?bossId:type,king=id==='demonKing',hound=id==='demonHound',eye=id==='demonEye',witch=id==='demonWitch'||id==='demonSiren',armored=id==='demonArmor'||id==='demonKnight'||id==='demonWarden',flying=id==='demonBat'||witch||eye;
 const scale=boss?king?1.7:1.65:1;body.scale.setScalar(scale);root.userData.demonScale=scale;
 const skin=king?0x9a6177:witch?0xb292c2:armored?0x665d82:0xa26d91,dark=0x302b43,silver=0xbdafcc,red=calm?0xffdeb0:0xff7aab;let focus=null;const wings=[];
 if(hound){ball(body,0x54465f,0,.72,0,[.66,.6,1.2]);ball(body,skin,0,.98,.88,[.55,.48,.6]);for(const s of [-1,1])for(const z of [-.65,.7])ball(body,dark,s*.48,.24,z,[.19,.33,.25]);}
 else if(eye){ball(body,skin,0,1.2,0,[.78,.75,.6]);ball(body,0xf4e4ef,0,1.2,.49,[.58,.56,.19]);ball(body,red,0,1.2,.67,[.24,.35,.08]);ball(body,0x322336,0,1.2,.72,[.06,.27,.05]);}
 else{
  ball(body,armored?dark:skin,0,.92,0,[king?.8:.54,.73,.44]);
  if(witch)part(body,new THREE.ConeGeometry(.72,1.35,10),dark,0,.66,0);
  ball(body,skin,0,1.8,0,[.56,.5,.47]);
  for(const s of [-1,1]){
   ball(body,dark,s*.3,.18,.1,[.25,.2,.34]);ball(body,skin,s*.7,.93,.08,[.24,.52,.25]);
   ball(body,calm?0xf6dec2:0xffb6c6,s*.2,1.83,.415,[.115,calm?.095:.065,.065]);ball(body,0x34283f,s*.2,1.83,.465,[.042,.065,.02]);
   const brow=part(body,new THREE.BoxGeometry(.26,.04,.07),dark,s*.2,1.97,.42);brow.rotation.z=calm?s*.12:-s*.3;
   if(armored){part(body,new THREE.DodecahedronGeometry(.4,0),silver,s*.64,1.37,0,[1,.75,.8]);part(body,new THREE.ConeGeometry(.12,.5,5),0xd2b8cf,s*.75,1.73,0);}
  }
  const mouth=new THREE.CatmullRomCurve3([new THREE.Vector3(-.13,1.59,.435),new THREE.Vector3(0,calm?1.54:1.63,.48),new THREE.Vector3(.13,1.59,.435)]);part(body,new THREE.TubeGeometry(mouth,10,.025,5,false),dark);
 }
 if(!eye)for(const s of [-1,1]){tube(body,[[s*.35,hound?1.24:2.11,0],[s*.56,hound?1.61:2.47,-.1],[s*.45,hound?1.85:2.75,0]],.115,silver);if(hound)ball(body,red,s*.21,1.05,1.37,[.1,.06,.045]);}
 if(flying||king||id==='demonKnight')for(const s of [-1,1]){
  const wing=new THREE.Group();wing.position.set(s*.4,1.32,-.25);body.add(wing);
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(s*.9,.8,s*1.45,.65);shape.lineTo(s*1.2,-.35);shape.quadraticCurveTo(s*.8,-.05,s*.63,-.49);shape.lineTo(0,-.1);shape.closePath();
  part(wing,new THREE.ExtrudeGeometry(shape,{depth:.05,bevelEnabled:false}),witch?0x69527d:dark);tube(wing,[[0,0,0],[s*.6,.53,0],[s*1.45,.65,0]],.045,silver);
 }
 if(king){part(body,new THREE.CylinderGeometry(.53,.52,.26,12),0xc6a169,0,2.19,0);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;part(body,new THREE.ConeGeometry(.15,.46,4),0xe9c58c,Math.sin(a)*.48,2.5,Math.cos(a)*.4);}part(body,new THREE.ConeGeometry(.9,1.5,12),0x6e355c,0,.83,-.2,[1,1,.55]);}
 if(id==='demonReaper'||witch){part(body,new THREE.CylinderGeometry(.04,.055,2.1,8),silver,.82,1,.1);part(body,new THREE.TorusGeometry(.36,.05,6,22,Math.PI*1.4),red,.94,2.02,.1).rotation.z=.2;}
 if(!eye){focus=part(body,new THREE.OctahedronGeometry(.17),red,0,1.15,.46,null,calm?.15:.8);focus.userData.dynamic=true;}
 return {focus,wings,rotors:[]};
}
