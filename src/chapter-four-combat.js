const pink=0xf398bb;
export function demonEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,ring,charge,lockCast,volley,cooldownRate}){
 e.special-=dt*cooldownRate;
 const ranged=['demonBat','demonWitch','demonEye'].includes(e.type),ready=e.special<=0&&d<(ranged?16:10);
 if(ready){
  e.special=e.type==='demonImp'?2.05:e.type==='demonHound'?3.25:2.9;
  if(e.type==='demonImp'){line(g,e,angle,4.4,2,.55,50,pink);line(g,e,angle+.6,4.8,2,.95,54,pink);lockCast(g,e,.98,{kind:'chant',angle});}
  else if(e.type==='demonHound'){charge(g,e,angle,.7,14,.38,2.1,pink);e.demonFollowup={due:1.6,kind:'charge',left:1};}
  else if(e.type==='demonArmor'){circle(g,e,e.x,e.z,3.6,.8,76,pink);ring(g,e,e.x,e.z,3.8,6.8,1.25,65,pink);lockCast(g,e,1.28,{kind:'chant',angle});}
  else if(e.type==='demonReaper'){line(g,e,angle,8,2.1,.65,59,pink);line(g,e,angle+Math.PI/2,8,2.1,1.1,59,pink);lockCast(g,e,1.12,{kind:'chant',angle});}
  else if(e.type==='demonEye'){circle(g,e,g.player.x,g.player.z,2.25,.85,46,pink);e.demonFollowup={due:.4,kind:'sigil',left:2};lockCast(g,e,.4,{kind:'chant',angle});}
  else volley(g,e,{angle,delay:.75,waves:e.type==='demonWitch'?2:1,interval:.35,turn:.2,offsets:e.type==='demonWitch'?[-.5,0,.5]:[-.2,.2],speed:7.8,damage:43,color:pink,kind:'enemyDemonFire',homing:1.5,turnRate:1.35});
  g.emit('enemyCast',{id:e.id,type:e.type});return;
 }
 if(d>(ranged?7:e.radius+.8))move(e,route.x,route.z,e.speed*slow,dt);
 else if(ranged&&d<4.5)move(e,-route.x,-route.z,e.speed*.7*slow,dt);
}
export function demonFollowup(g,e,dt,{angle,circle,charge}){
 const f=e.demonFollowup;if(!f)return false;if(f.due>0||e.cast||e.rush||e.recovery>0)return false;
 if(f.kind==='sigil'){circle(g,e,g.player.x,g.player.z,2.25,.85,46,pink);f.due=.42;}
 else{charge(g,e,angle,.65,14,.38,2.1,pink);f.due=1.6;}
 if(--f.left<=0)e.demonFollowup=null;return true;
}
export function demonBossAttack(g,e,{angle,action,color,empowered,line,circle,ring,charge,lockCast,volley}){
 const king=e.bossId==='demonKing',siren=e.bossId==='demonSiren',knight=e.bossId==='demonKnight';
 if(action===0){
  if(siren){circle(g,e,e.x,e.z,4,.9,30,color);ring(g,e,e.x,e.z,4.2,8,1.35,31,color);circle(g,e,e.x,e.z,4,1.8,32,color);}
  else if(knight){for(let i=0;i<(empowered?4:3);i++)line(g,e,angle+i*Math.PI/3,19,2.4,.8+i*.35,31,color);}
  else {for(let i=0;i<(empowered?5:3);i++){const a=angle+(i-1)*.5;circle(g,e,g.player.x+Math.sin(a)*i*1.5,g.player.z+Math.cos(a)*i*1.5,2.5,.8+i*.27,30,color);}e.demonFollowup={due:.45,kind:'sigil',left:king?3:2};}
  lockCast(g,e,1.7,{kind:'chant',angle});
 }else if(action===1){
  volley(g,e,{angle,delay:.85,waves:empowered?3:2,interval:.4,turn:.22,offsets:empowered?[-.85,-.42,0,.42,.85]:[-.65,0,.65],speed:8.1,damage:27,color,kind:'enemyDemonFire',homing:1.65,turnRate:1.2});
  if(king||siren)ring(g,e,e.x,e.z,4.5,8.5,1.4,25,color);
 }else{
  charge(g,e,angle,.85,16,.45,3.2,color);e.demonFollowup={due:1.6,kind:'charge',left:king&&empowered?2:1};
 }
}
