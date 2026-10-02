export function heheEnemyAttack(g,e,h){
 const {angle,d,route,dt,slow,move,line,circle,ring,charge,lockCast,volley,cooldownRate}=h;
 e.special-=dt*cooldownRate;
 if(e.special<=0&&d<16){
  if(e.type==='heheArcher'){volley(g,e,{angle,offsets:[-.2,0,.2],delay:1.05,speed:12,damage:32,kind:'enemyArrow',color:0x8acdea});e.special=3.3;}
  else if(e.type==='heheMage'){circle(g,e,g.player.x,g.player.z,2.2,1.4,38,0xcc9bee);lockCast(g,e,1.4,{kind:'chant',angle});e.special=4.4;}
  else if(e.type==='heheRunner'&&d>3){charge(g,e,angle,.9,13,.55,1.7,0xff917d);e.special=4;}
  else if(e.type==='heheGuard'&&d<6){ring(g,e,e.x,e.z,1.4,5,.95,46,0xd4bd91);lockCast(g,e,.95,{kind:'chant',angle});e.special=3.7;}
  else if(d<3.5){line(g,e,angle,3.7,1.5,.7,42,0xffbc7d);lockCast(g,e,.7,{kind:'chant',angle});e.special=2.6;}
  else{move(e,route.x,route.z,e.speed*slow,dt);return;}
  g.emit('enemyCast',{id:e.id,type:e.type});return;
 }
 const preferred=['heheArcher','heheMage'].includes(e.type)?8:e.radius+.6;
 if(d>preferred)move(e,route.x,route.z,e.speed*slow,dt);
}
export function heheBossAttack(g,e,h){
 const {angle,action,color,empowered,line,circle,ring,charge,lockCast,volley}=h;
 if(action===0){
  if(e.bossId==='heheGuard')ring(g,e,e.x,e.z,2.8,9,1.1,43,color);
  else if(e.bossId==='heheKing')for(const offset of g.actConfig.endgame?[-4,0,4]:[-2,0,2])circle(g,e,g.player.x+offset,g.player.z,2.2,1.1+Math.abs(offset)*.16,40,color);
  else line(g,e,angle,e.bossId==='heheArcher'?20:7,2,1.1,42,color);
  lockCast(g,e,1.1,{kind:'chant',angle});
 }else if(action===1)volley(g,e,{angle,offsets:empowered?[-.48,-.24,0,.24,.48]:[-.3,0,.3],waves:empowered?3:2,turn:g.actConfig.endgame?.12:0,interval:.45,delay:1.05,speed:11,damage:34,kind:'enemyArrow',color});
 else charge(g,e,angle,empowered?.8:1.15,15,.8,3,color);
}
