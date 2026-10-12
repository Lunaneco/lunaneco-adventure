export function paresisEnemyAttack(g,e,h){
 const {angle,d,route,dt,slow,move,line,circle,ring,charge,lockCast,volley,cooldownRate}=h;
 e.special-=dt*cooldownRate;
 if(e.special<=0&&d<16){
  if(e.type==='miasmaMoth'){volley(g,e,{angle,offsets:[-.35,0,.35],delay:1,speed:11,damage:30,kind:'enemyArrow',color:0xc9b6ff});e.special=3.4;}
  else if(e.type==='darkCenser'){circle(g,e,g.player.x,g.player.z,2.15,1.45,36,0xd4b6ff);lockCast(g,e,1.45,{kind:'chant',angle});e.special=4.3;}
  else if(e.type==='miasmaBell'&&d>3){charge(g,e,angle,1,13,.6,1.8,0xff8adf);e.special=4.1;}
  else if(e.type==='lanternWarden'&&d<7.5){ring(g,e,e.x,e.z,1.3,4.6,.95,48,0xe7a0ff);lockCast(g,e,.95,{kind:'chant',angle});e.special=3.8;}
  else if(d<3.6){line(g,e,angle,3.6,1.45,.7,44,0xffb0ea);lockCast(g,e,.7,{kind:'chant',angle});e.special=2.7;}
  else{move(e,route.x,route.z,e.speed*slow,dt);return;}
  g.emit('enemyCast',{id:e.id,type:e.type});return;
 }
 const preferred=['miasmaMoth','darkCenser'].includes(e.type)?9:e.radius+.6;
 if(d>preferred)move(e,route.x,route.z,e.speed*slow,dt);
}
export function paresisBossAttack(g,e,h){
 const phase=g.actConfig?.towerExtra?3:(g.actConfig?.kephiaPhase??0);
 const {angle,action,color,empowered,line,circle,ring,charge,lockCast,volley}=h;
 if(action===0){
  ring(g,e,e.x,e.z,1.8+phase*.28,5.2+phase*.45,.95+phase*.04,42+phase*3,color);
  if(phase>=2)circle(g,e,g.player.x,g.player.z,1.7,1.05+phase*.05,36,color);
  lockCast(g,e,.95,{kind:'chant',angle});
 }else if(action===1){
  const offsets=phase>=3?[-.62,-.31,0,.31,.62]:phase>=1?[-.42,-.14,.14,.42]:[-.28,0,.28];
  volley(g,e,{angle,offsets,waves:empowered||phase>=2?3:2,interval:.38,delay:.95,speed:11+phase,damage:34+phase*3,kind:'enemyArrow',color});
 }else if(phase>=1&&!empowered){
  line(g,e,angle,7+phase,2.1,1,44,color);lockCast(g,e,1,{kind:'chant',angle});
 }else charge(g,e,angle,phase>=3?.68:1.05,14+phase,.72,2.2+phase*.35,color);
}
export const kephiaFormIndex=bossId=>{const n=Number(String(bossId??'').slice(-1));return n>=1&&n<=4?n-1:0;};
export const kephiaBand=ratio=>ratio>.66?'high':ratio>.33?'mid':'low';
// Each form keeps its own cycle. Remaining HP swaps the cycle instead of only speeding the same three moves.
export const KEPHIA_SCRIPTS=Object.freeze({
 0:{high:['curtain','fan','mark'],mid:['invert','rotating','sweep'],low:['cross','fanMark','summon','charge']},
 1:{high:['rotating','bell','sweep'],mid:['charge','mark','rotating'],low:['bell','summon','cross','charge']},
 2:{high:['mark','curtain','fan'],mid:['marks','sweep','summon'],low:['doubleRing','cross','charge','summon']},
 3:{high:['fanMark','charge','curtain'],mid:['crossRing','rotating','summon'],low:['finale','summon','charge']},
});
const KEPHIA_SUMMONS=Object.freeze([['paresisChorister'],['miasmaMoth','miasmaMoth'],['darkCenser'],['lanternWarden','paresisChorister']]);
const KEPHIA_COLORS=[0xf2b7ff,0xe7c56a,0x7a5cff,0xff6aa8];
const KEPHIA_LABEL=Object.freeze({
 0:{curtain:'開幕の幕',fan:'笑い声の三方',mark:'足元の拍手',invert:'裏返る輪',rotating:'ずれる扇',sweep:'横なぎの幕',cross:'十字の幕',fanMark:'拍手と扇',summon:'合唱を呼ぶ',charge:'開幕の突っ込み'},
 1:{rotating:'拍手で動く切れ目',bell:'鈴の安全な中央',sweep:'袖からのなぎ',charge:'幕間の突進',mark:'落ちる拍手',cross:'交差する鈴',summon:'瘴蛾を呼ぶ'},
 2:{mark:'先に爆ぜる印',curtain:'暗転の輪',fan:'闇の三方',marks:'三つの印',sweep:'落ちた照明',summon:'香炉を呼ぶ',doubleRing:'二重の灯',cross:'割れた十字',charge:'短い突進'},
 3:{fanMark:'終幕の同時攻撃',charge:'塔の突進',curtain:'割れない照明',crossRing:'輪と十字',rotating:'五方の笑い',summon:'門番を呼ぶ',finale:'間を置かない終幕'},
});
const KEPHIA_KIND=Object.freeze({curtain:'rune',invert:'rune',bell:'rune',doubleRing:'rune',mark:'rune',marks:'rune',fan:'stars',rotating:'stars',fanMark:'stars',finale:'stars',sweep:'charge',cross:'charge',crossRing:'charge',charge:'charge',summon:'rune'});
export const KEPHIA_BAND_LABEL=Object.freeze([
 {mid:'拍手が速くなる。輪が裏返り、扇がずれます。',low:'開幕が崩れる。十字の幕と、合唱が同時に出ます。'},
 {mid:'幕間。切れ目が回り、突進のあと拍手を落とします。',low:'鈴が落ちる。中央が安全になり、瘴蛾を呼びます。'},
 {mid:'暗転。足元の印が先に爆ぜ、香炉が出ます。',low:'灯が割れる。輪が二重になり、印の外へ出てください。'},
 {mid:'終幕の照明。輪と十字が重なり、門番を呼びます。',low:'塔が笑う。輪、十字、扇が間を置かず続きます。'},
]);
export function kephiaCooldown(form,band){return band==='high'?2.15-form*.08:band==='mid'?1.72-form*.06:1.28-form*.05;}
function castKephia(move,form,g,e,h){
 const {angle,line,circle,ring,charge,lockCast,volley,summon}=h,color=KEPHIA_COLORS[form],p=g.player;
 const fan=(offsets,extra={})=>volley(g,e,{angle,offsets,waves:1,interval:.34,delay:.9,speed:11+form,damage:32+form*3,kind:'enemyArrow',color,...extra});
 if(move==='curtain'){ring(g,e,e.x,e.z,2.15,6.1,.95,40+form*2,color);lockCast(g,e,.95,{kind:'chant',angle});}
 else if(move==='invert'){ring(g,e,e.x,e.z,.35,3.15,.9,44,color);lockCast(g,e,.9,{kind:'chant',angle});}
 else if(move==='bell'){ring(g,e,e.x,e.z,1.15,3.3,.85,42,color);ring(g,e,e.x,e.z,4.4,6.6,1.35,36,color);lockCast(g,e,.85,{kind:'chant',angle});}
 else if(move==='doubleRing'){ring(g,e,e.x,e.z,1.4,3.4,.8,46,color);ring(g,e,e.x,e.z,4.2,6.8,1.25,40,color);lockCast(g,e,.8,{kind:'chant',angle});}
 else if(move==='mark'){circle(g,e,p.x,p.z,2.15,1.05,38,color);lockCast(g,e,1.05,{kind:'chant',angle});}
 else if(move==='marks'){for(const [x,z] of [[2.4,0],[-1.2,2.1],[-1.2,-2.1]])circle(g,e,p.x+x,p.z+z,1.55,.85+Math.abs(x)*.08,34,color);lockCast(g,e,.85,{kind:'chant',angle});}
 else if(move==='fan')fan(form>=3?[-.5,-.25,0,.25,.5]:[-.42,0,.42]);
 else if(move==='rotating')fan(form>=1?[-.62,-.28,0,.28,.62]:[-.48,-.16,.16,.48],{waves:2,turn:.55,interval:.36});
 else if(move==='sweep'){line(g,e,angle,8+form*.4,2.05,.95,46,color);lockCast(g,e,.95,{kind:'chant',angle});}
 else if(move==='cross'){line(g,e,angle,9,1.7,.9,42,color);line(g,e,angle+Math.PI/2,9,1.7,1.15,42,color);lockCast(g,e,.9,{kind:'chant',angle});}
 else if(move==='crossRing'){ring(g,e,e.x,e.z,2,5.6,.85,44,color);line(g,e,angle,9,1.6,1.05,40,color);line(g,e,angle+Math.PI/2,9,1.6,1.2,40,color);lockCast(g,e,.85,{kind:'chant',angle});}
 else if(move==='fanMark'){fan([-0.5,0,.5]);circle(g,e,p.x,p.z,1.8,1.2,36,color);}
 else if(move==='finale'){ring(g,e,e.x,e.z,1.6,6.4,.75,48,color);line(g,e,angle,10,1.55,.95,44,color);line(g,e,angle+Math.PI/2,10,1.55,1.1,44,color);fan([-0.7,-.35,0,.35,.7],{delay:1.15});}
 else if(move==='charge'){const ahead=form>=2;if(ahead)circle(g,e,e.x+Math.sin(angle)*6,e.z+Math.cos(angle)*6,2.1,1.15,40,color);charge(g,e,angle,form>=3?.62:.9,13+form,.7,2.1+form*.15,color);}
 else{const called=summon?.(KEPHIA_SUMMONS[form])??0;if(!called)ring(g,e,e.x,e.z,1.8,4.8,.8,36,color);lockCast(g,e,.8,{kind:'chant',angle});}
}
export function kephiaBossAttack(g,e,h){
 const form=kephiaFormIndex(e.bossId),band=kephiaBand(e.hp/Math.max(1,e.maxHp)),script=KEPHIA_SCRIPTS[form][band],move=script[e.action++%script.length];
 e.special=kephiaCooldown(form,band);
 g.emit('bossAttack',{kind:KEPHIA_KIND[move]??'rune',label:KEPHIA_LABEL[form][move],bossId:e.bossId});
 castKephia(move,form,g,e,h);
 return {form,band,move};
}
