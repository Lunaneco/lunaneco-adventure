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
 const phase=g.actConfig?.kephiaPhase??0;
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
