import {ANTI_KEMO_ENEMIES,antiKemoEnemyAttack,antiKemoBossAttack} from './chapter-seven-enemies.js';
import {GOLDEN_HEHE,HEHE_ENEMIES} from './chapter-six-enemies.js';
import {heheEnemyAttack,heheBossAttack} from './chapter-six-combat.js';
import {PRISM_ENEMIES} from './chapter-five-enemies.js';
import {prismBossAttack,prismEnemyAttack,prismFollowup} from './chapter-five-combat.js';
import {demonEnemyAttack,demonBossAttack,demonFollowup} from './chapter-four-combat.js';
import {BOSSES,ELITE_BOSS_MULTIPLIER} from './enemies.js';
import {GOLDEN_SLIME,fleeGoldenSlime} from './golden-slime.js';
import {extraCombatFor} from './extra-stages.js';
import {storyBossAttack} from './boss-patterns.js';
import {countryEnemyAttack} from './chapter-two-combat.js';
import {mochiEnemyAttack,mochiBossAttack,MOCHI_ARROW_ANGLES,MOCHI_FIRE_ANGLES} from './chapter-three-combat.js';
const hard=g=>g.difficulty==='hard'?1.3:1;
const telegraph=(g,duration)=>duration*(g.actConfig?.extra?extraCombatFor(g.actConfig).telegraphScale:1);
const cadence=g=>g.actConfig?.extra?extraCombatFor(g.actConfig).cooldownRate:1;
// Apply the same route multiplier to spells, beams and projectiles as body/charge damage.
const damageScale=(g,e)=>hard(g)*(g.actConfig?.extra?g.actConfig.damageScale:1)*(e.type==='boss'?(g.actConfig?.chapter>=3?2.6:g.actConfig?.chapter===2?2.1:g.actConfig?.chapter===1?1.7:1):1)*(e.type==='boss'&&e.elite?ELITE_BOSS_MULTIPLIER:1);
function circle(g,e,x,z,radius,delay,damage,color){delay=telegraph(g,delay);g.hazards.push({id:g.ids++,sourceId:e.id,kind:'sigil',x,z,radius,timer:delay,total:delay,damage:damage*damageScale(g,e),color});}
function ring(g,e,x,z,innerRadius,radius,delay,damage,color){
 delay=telegraph(g,delay);g.hazards.push({id:g.ids++,sourceId:e.id,kind:'shockwave',shape:'ring',x,z,innerRadius,radius,timer:delay,total:delay,damage:damage*damageScale(g,e),color});
}
// A volley owns a snapshot of its origin and angles, including all follow-ups.
function volley(g,e,{angle,delay=1.1,waves=1,interval=.6,turn=0,...pattern}){
 const {kind:projectileKind,...shotPattern}=pattern;
 const c={kind:pattern.count?'stars':'bossFan',projectileKind,angle,waves,interval:telegraph(g,interval),turn,origin:{id:e.id,x:e.x,z:e.z,radius:e.radius,type:e.type,elite:e.elite},...shotPattern};
 for(let wave=0;wave<waves;wave++){
  const at=delay+interval*wave,a=angle+turn*wave;
  if(pattern.offsets)for(const offset of pattern.offsets)line(g,e,a+offset,22,.6,at,0,pattern.color,'aim');
  else{
   const count=pattern.count,step=Math.PI*2/count,gapIndex=Math.floor(count/4);
   ring(g,e,e.x,e.z,e.radius+.25+wave*.65,e.radius+.75+wave*.65,at,0,pattern.color);
   Object.assign(g.hazards.at(-1),{kind:'volley',gapAngle:a+(gapIndex+.5)*step,gapWidth:step*3});
  }
 }
 lockCast(g,e,delay,c);
}
function fireBossVolley(g,e,c,round=0){
 const angle=c.angle+c.turn*round,source=c.origin??e;
 if(c.offsets){for(const offset of c.offsets)shot(g,source,angle+offset,{kind:c.projectileKind,speed:c.speed,damage:c.damage,color:c.color,radius:.3,homing:c.homing,turnRate:c.turnRate});}
 else{
  const step=Math.PI*2/c.count,gap=Math.floor(c.count/4);
  for(let i=0;i<c.count;i++){if(i===gap||i===gap+1)continue;shot(g,source,angle+i*step,{kind:c.projectileKind??(e.bossId==='tempest'?'enemyFeather':'enemyMoon'),speed:c.speed,damage:c.damage??18,color:c.color,radius:.32});}
 }
}
function line(g,e,angle,length,width,delay,damage,color,kind='beam'){
 delay=telegraph(g,delay);g.hazards.push({id:g.ids++,sourceId:e.id,kind,shape:'line',angle,x:e.x+Math.sin(angle)*length/2,z:e.z+Math.cos(angle)*length/2,length,width,radius:width/2,timer:delay,total:delay,damage:damage*damageScale(g,e),color});
}
function shot(g,e,angle,{speed=7,damage=12,kind='enemyArrow',color=0xffb36d,radius=.25,homing=0,turnRate=0}={}){
 speed*=g.actConfig?.extra?extraCombatFor(g.actConfig).projectileScale:1;g.projectiles.push({id:g.ids++,owner:'enemy',sourceId:e.id,kind,color,x:e.x+Math.sin(angle)*(e.radius+.2),z:e.z+Math.cos(angle)*(e.radius+.2),vx:Math.sin(angle)*speed,vz:Math.cos(angle)*speed,life:4,damage:damage*damageScale(g,e),radius,homing,turnRate,speed});
 g.emit('enemyShot',{x:e.x,z:e.z,color});
}
function lockCast(g,e,duration,action){duration=telegraph(g,duration);e.cast={remaining:duration,total:duration,...action};e.face=action.angle??e.face;}
function move(e,dx,dz,speed,dt){e.x+=dx*speed*dt;e.z+=dz*speed*dt;}
function charge(g,e,angle,delay,speed,duration,width,color){
 speed*=g.actConfig?.extra?extraCombatFor(g.actConfig).moveScale:1;line(g,e,angle,speed*duration+e.radius*2,Math.max(width,e.radius*2),delay,0,color,'charge');lockCast(g,e,delay,{kind:'charge',angle,speed,duration});
}
function finishCast(g,e,c){
 if(c.kind==='charge'){e.rush={angle:c.angle,speed:c.speed,remaining:c.duration};return;}
 if(c.kind==='arrow')shot(g,e,c.angle,{damage:12});
 if(c.kind==='mochiVolley'){
  shot(g,e,c.angle+MOCHI_ARROW_ANGLES[0],{speed:11,damage:31});
  e.salvo={kind:'mochiArrow',timer:.14,remaining:3,index:1,angle:c.angle};
 }
 if(c.kind==='mochiFire')for(const offset of MOCHI_FIRE_ANGLES)shot(g,e,c.angle+offset,{kind:'enemyMoon',speed:8.4,damage:35,color:0xffa16e,radius:.38});
 if(c.kind==='riceVolley'){
  shot(g,e,c.angle-.11,{kind:'enemyMusket',speed:10,damage:34,radius:.24,color:0xffb76c});
  e.salvo={timer:.18,remaining:2,index:1,angle:c.angle};
 }
 if(c.kind==='pollen')for(const offset of [-.5,-.25,0,.25,.5])shot(g,e,c.angle+offset,{kind:'enemyPollen',speed:7.2,damage:29,color:0xd6ed89,radius:.25});
 if(c.kind==='stars'||c.kind==='bossFan'){
  fireBossVolley(g,e,c);
  if(c.waves>1)e.salvo={kind:'bossVolley',timer:c.interval,round:1,pattern:c};
 }
}
function bossAttack(g,e){
 const spec=BOSSES[e.bossId],p=g.player,angle=Math.atan2(p.x-e.x,p.z-e.z),action=e.action++%3,color=spec.color;
 const empowered=Boolean(g.actConfig?.extra||e.hp<=e.maxHp*.5);
 e.special=g.actConfig?.chapter>=3?(empowered?1.4:1.95):g.actConfig?.chapter===2?(empowered?1.65:2.35):g.actConfig?.chapter===1?(empowered?2.5:3.35):(empowered?3:4.1);
 g.emit('bossAttack',{kind:['rune','stars','charge'][action],label:g.actConfig?.apex?['夢蝕の包囲陣','三重王冠の星弾','王座砕きの交差突進'][action]:spec.attacks[g.actConfig?.chapter===4?(e.action-1)%2:action],bossId:e.bossId});
 const helpers={angle,action,color,empowered,line,circle,ring,charge,lockCast,volley};
 if(g.actConfig?.chapter===6)antiKemoBossAttack(g,e,helpers);else if(g.actConfig?.chapter===5)heheBossAttack(g,e,helpers);else if(g.actConfig?.chapter===4)prismBossAttack(g,e,helpers);else if(g.actConfig?.chapter>=3)demonBossAttack(g,e,helpers);
 else if(g.actConfig?.chapter===2)mochiBossAttack(g,e,helpers);
 else storyBossAttack(g,e,helpers);
}
export function tickEnemyBehavior(g,e,dt,slow=1){
 if(e.hp<=0||g.phase!=='playing'||g.exitOpen)return;
 // Follow-up timing includes the preceding cast and recovery. Reserve the chain
 // until it ends so a new boss cycle cannot overwrite its final rush.
 if(e.demonFollowup)e.demonFollowup.due-=dt;
 if(e.prismFollowup)e.prismFollowup.due-=dt;
 if(e.type===GOLDEN_SLIME.type||e.type===GOLDEN_HEHE.type){fleeGoldenSlime(g,e,dt,slow);return;}
 const p=g.player,dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz)||.01,angle=Math.atan2(dx,dz),route=g.steerEnemy(e);
 if(e.type==='boss'&&!e.enraged&&e.hp<=e.maxHp*.5){e.enraged=true;g.emit('bossPhase',{label:g.actConfig?.chapter===6?'集団の猛攻 — 連射と突撃に注意':g.actConfig?.chapter===5?'へへへの猛攻 — 扇矢と連撃が増加':g.actConfig?.chapter===4?'虹光の暴走 — 五方向弾・三連撃、ブレスの溜めが短縮':g.actConfig?.chapter>=3?'紅霧の暴走 — 追尾弾と連撃が増加':g.actConfig?.chapter===2?'闇の猛攻 — 連撃と弾幕が激しくなる':g.actConfig?.chapter===1?'猛攻開始 — 攻撃の間隔が短くなる':'力の解放 — 連撃が増加、予告を見て回避しよう'});}
 if(e.type==='boss'&&g.actConfig?.apex&&!e.apexAwakened&&e.hp<=e.maxHp*.5){e.apexAwakened=true;g.emit('bossPhase',{label:'夢蝕覚醒 — 包囲魔法と星弾が増加'});}
 if(e.rush){const rush=e.rush;e.face=rush.angle;move(e,Math.sin(rush.angle),Math.cos(rush.angle),rush.speed*slow,Math.min(dt,rush.remaining));rush.remaining-=dt;if(rush.remaining<=0){e.rush=null;e.recovery=.8;}return;}
 if(e.cast){e.cast.remaining-=dt;if(e.cast.remaining<=0){const cast=e.cast;e.cast=null;finishCast(g,e,cast);}return;}
 if(e.salvo?.kind==='bossVolley'){
  const s=e.salvo;s.timer-=dt;
  if(s.timer<=0){fireBossVolley(g,e,s.pattern,s.round++);s.timer+=s.pattern.interval;if(s.round>=s.pattern.waves)e.salvo=null;}
  return;
 }
 if(e.salvo){
  const s=e.salvo;s.timer-=dt*cadence(g);
  if(s.timer<=0){
   if(s.kind==='mochiArrow')shot(g,e,s.angle+MOCHI_ARROW_ANGLES[s.index],{speed:11,damage:31});
   else shot(g,e,s.angle+(s.index-1)*.11,{kind:'enemyMusket',speed:10,damage:34,radius:.24,color:0xffb76c});
   s.index++;s.remaining--;s.timer+=s.kind==='mochiArrow'?.14:.18;if(s.remaining<=0)e.salvo=null;
  }
  return;
 }
 if(e.recovery>0){e.recovery=Math.max(0,e.recovery-dt*cadence(g));return;}
 e.face=angle;
 if(g.actConfig?.chapter>=3&&e.demonFollowup){demonFollowup(g,e,dt,{angle,circle,charge});return;}
 if(e.prismFollowup){prismFollowup(g,e,{angle,circle,charge});return;}
 if(e.type==='boss'){
  e.special-=dt*cadence(g);if(e.special<=0){bossAttack(g,e);return;}
  const preferred=g.actConfig?.chapter===4?9:e.bossId==='chronarch'?7:0;if(d>Math.max(preferred,e.radius+.6))move(e,route.x,route.z,e.speed*slow,dt);return;
 }
 if(ANTI_KEMO_ENEMIES[e.type]){antiKemoEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,ring,charge,lockCast,volley,cooldownRate:cadence(g)});return;}
 if(HEHE_ENEMIES[e.type]){heheEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,ring,charge,lockCast,volley,cooldownRate:cadence(g)});return;}
 if(PRISM_ENEMIES[e.type]){prismEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,ring,charge,lockCast,volley,cooldownRate:cadence(g)});return;}
 if(e.type.startsWith('demon')){demonEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,ring,charge,lockCast,volley,cooldownRate:cadence(g)});return;}
 if(e.type.startsWith('mochi')){
  mochiEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,charge,lockCast,cooldownRate:cadence(g)});return;
 }
 if(['reaper','matchlock','stormlantern','pestmoth','ironcrab','ramcart'].includes(e.type)){countryEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,charge,lockCast:(e,duration,action)=>lockCast(g,e,duration,action),cooldownRate:cadence(g)});return;}
 if(e.type==='archer'||e.type==='mage'){
  e.special-=dt*cadence(g);
  if(e.special<=0&&d<=14){
   if(e.type==='archer'){line(g,e,angle,14,.45,.95,0,0xffb36d,'aim');lockCast(g,e,.95,{kind:'arrow',angle});e.special=2.9;}
   else{circle(g,e,p.x,p.z,2.1,1.65,15,0xd389ff);lockCast(g,e,1.65,{kind:'chant',angle});e.special=4.6;}
   g.emit('enemyCast',{id:e.id,type:e.type});return;
  }
  if(d>8.3)move(e,route.x,route.z,e.speed*slow,dt);
  else if(d<5.5){if(Math.hypot(e.x,e.z)<16.2)move(e,-dx/d,-dz/d,e.speed*.65*slow,dt);else move(e,-dz/d,dx/d,e.speed*.55*slow,dt);}
  return;
 }
 if(e.type==='charger'){e.special-=dt*cadence(g);if(e.special<=0&&d<12&&d>3){charge(g,e,angle,1,11,.55,1.8,0xff9b5f);e.special=4;g.emit('enemyCast',{id:e.id,type:e.type});return;}}
 if(d>e.radius+.6)move(e,route.x,route.z,e.speed*slow,dt);
}
