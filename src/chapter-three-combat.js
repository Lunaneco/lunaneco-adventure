// Chapter-three enemies commit to their warnings; follow-ups never retarget.
export const MOCHI_ARROW_ANGLES=Object.freeze([-.18,-.06,.06,.18]);
export const MOCHI_FIRE_ANGLES=Object.freeze([-.6,-.4,-.2,0,.2,.4,.6]);

export function mochiEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,charge,lockCast,cooldownRate=1}){
 e.special-=dt*cooldownRate;
 if(e.special<=0&&d<14){
  if(e.type==='mochiSlime'&&d>2.5&&d<10){
   charge(g,e,angle,1,9,.45,1.6,0x8bdcff);e.special=2.7;
  }else if(e.type==='mochiGoblin'&&d<4.8){
   for(const delay of [.9,1.4])line(g,e,angle,4.4,2.1,delay,31,0xffb477);
   lockCast(g,e,1.4,{kind:'chant',angle});e.special=1.3;e.recovery=.35;
  }else if(e.type==='mochiSkeleton'){
   for(const offset of MOCHI_ARROW_ANGLES)line(g,e,angle+offset,16,.5,.9,0,0xffb477,'aim');
   lockCast(g,e,.9,{kind:'mochiVolley',angle});e.special=1.6;
  }else if(e.type==='mochiDragon'){
   for(const offset of MOCHI_FIRE_ANGLES)line(g,e,angle+offset,14,.76,1.1,0,0xff896f,'aim');
   lockCast(g,e,1.1,{kind:'mochiFire',angle});e.special=2.2;
  }else if(e.type==='mochiWolf'&&d>3){
   charge(g,e,angle,.9,15,.65,2.1,0xff8b99);e.special=2.4;
  }else if(e.type==='mochiOrc'&&d<5){
   circle(g,e,e.x,e.z,3.4,1.1,44,0xffb589);circle(g,e,e.x,e.z,4.5,1.75,44,0xffb589);
   lockCast(g,e,1.75,{kind:'chant',angle});e.special=2;e.recovery=.55;
  }else if(e.type==='mochiGolem'&&d<10){
   for(let i=0;i<3;i++)circle(g,e,e.x+Math.sin(angle)*i*4,e.z+Math.cos(angle)*i*4,2.8,1.25+i*.4,44,0xffb589);
   lockCast(g,e,1.25,{kind:'chant',angle});e.special=2.5;e.recovery=.55;
  }
  if(e.cast){g.emit('enemyCast',{id:e.id,type:e.type});return;}
 }
 const ranged=e.type==='mochiSkeleton'||e.type==='mochiDragon';
 if(d>(ranged?7:e.radius+.6))move(e,route.x,route.z,e.speed*slow,dt);
}

export function mochiBossAttack(g,e,{angle,action,color,empowered,line,circle,ring,charge,lockCast,volley}){
 const p=g.player,n=empowered?1:0;
 if(g.actConfig?.apex){mochiExtraBossAttack(g,e,{angle,action,color,line,circle,ring,charge,lockCast,volley});return;}
 const chant=t=>lockCast(g,e,t,{kind:'chant',angle});
 const across=(side,delay,width=1.7)=>{
  const a=angle+side*Math.PI/2,origin={...e,x:p.x-Math.sin(a)*10,z:p.z-Math.cos(a)*10};
  line(g,origin,a,20,width,delay,29,color);
 };
 if(e.bossId==='darkmochi'){
  if(action===0){
   for(const offset of [-.5,0,.5])line(g,e,angle+offset,16,1.5,1.05,28,color);
   for(const offset of [-.25,.25])line(g,e,angle+offset,16,1.7,1.7,30,color);
   if(empowered)line(g,e,angle,18,2.1,2.35,32,color);chant(1.05);
  }else if(action===1){
   across(1,1.1);across(0,1.75);
   for(const side of [-1,1]){const a=angle+side*Math.PI/4,origin={...e,x:p.x-Math.sin(a)*10,z:p.z-Math.cos(a)*10};line(g,origin,a,20,1.5,2.4,30,color);}
   if(empowered)circle(g,e,p.x,p.z,3,3.05,34,color);chant(1.1);
  }else{
   charge(g,e,angle,1.05,empowered?18:16,.7,3.8,color);
   line(g,e,angle,18,2.2,2.2,32,color);
   for(const side of [-1,1])line(g,e,angle+side*.4,18,1.6,2.8,30,color);
  }
 }else if(e.bossId==='dreammochi'){
  if(action===0){
   for(let i=0;i<6+n*2;i++){const a=angle+i*Math.PI*2/(6+n*2);circle(g,e,p.x+Math.sin(a)*5,p.z+Math.cos(a)*5,1.8,1.15+i*.14,27,color);}
   circle(g,e,p.x,p.z,3,2.55,33,color);chant(1.15);
  }else{
   if(action===1){
    ring(g,e,p.x,p.z,3.7,8.2,1.1,30,color);circle(g,e,p.x,p.z,3.7,1.95,32,color);
    if(empowered)ring(g,e,p.x,p.z,4.1,9,2.8,33,color);chant(1.1);
   }else{
    // A false awakening: the centre explodes, then the petals, then the centre again.
    circle(g,e,p.x,p.z,2.7,1.1,32,color);
    for(let i=0;i<5+n;i++){const a=angle+i*Math.PI*2/(5+n);circle(g,e,p.x+Math.sin(a)*4.2,p.z+Math.cos(a)*4.2,2,1.8,30,color);}
    circle(g,e,p.x,p.z,3.2,2.6,35,color);chant(1.1);
   }
  }
 }else if(e.bossId==='bellmochi'){
  if(action===0){
   for(let step=0;step<3+n;step++)for(let i=0;i<4;i++)line(g,e,angle+step*Math.PI/4+i*Math.PI/2,21,1.55,1.1+step*.6,28,color);chant(1.1);
  }else if(action===1){
   for(let i=0;i<3+n;i++)ring(g,e,e.x,e.z,3+i*2.5,5+i*2.5,1.1+i*.5,31,color);
   // The returning chime catches anyone who only retreats outward.
   ring(g,e,e.x,e.z,5.5,7.5,2.95+n*.5,33,color);chant(1.1);
  }else{
   for(let i=0;i<8+n*2;i++){const a=angle+i*Math.PI*2/(8+n*2);circle(g,e,e.x+Math.sin(a)*6,e.z+Math.cos(a)*6,1.85,1.15+(i%2)*.65,29,color);}
   circle(g,e,e.x,e.z,4,2.45,34,color);chant(1.15);
  }
 }else{
  if(action===0){
   const count=empowered?8:6;
   for(let i=0;i<count;i++){const a=angle+i/count*Math.PI*2;circle(g,e,p.x+Math.sin(a)*4.8,p.z+Math.cos(a)*4.8,2.05,1.1+i*.18,30,color);}
   circle(g,e,p.x,p.z,2.6,2.65,35,color);ring(g,e,p.x,p.z,5.5,9,3.25,32,color);chant(1.1);
  }else if(action===1)volley(g,e,{angle,delay:1.1,count:empowered?30:26,waves:2+n,turn:.22,interval:.6,speed:empowered?8:7.3,damage:26,kind:'enemyMoon',color});
  else{
   charge(g,e,angle,1.15,empowered?19:17,.75,4.6,color);
   for(const offset of [-Math.PI/3,Math.PI/3])line(g,e,angle+offset,19,2.2,2.15,34,color);
   ring(g,e,e.x,e.z,4,9,2.85,35,color);
  }
 }
}

function mochiExtraBossAttack(g,e,{angle,action,color,line,circle,ring,charge,lockCast,volley}){
 const awakened=e.hp<=e.maxHp*.5,p=g.player;
 e.special=awakened?1.5:1.9;
 if(action===0){
  const count=awakened?10:8;
  for(let i=0;i<count;i++){const a=angle+i/count*Math.PI*2;circle(g,e,p.x+Math.sin(a)*4.8,p.z+Math.cos(a)*4.8,2.05,1.05+i*.18,30,color);}
  circle(g,e,p.x,p.z,2.5,2.9,34,0xffcf91);
  ring(g,e,p.x,p.z,5.7,10.5,3.55,35,color);
  lockCast(g,e,1.05,{kind:'chant',angle});
 }else if(action===1){
  volley(g,e,{angle,delay:1.1,count:awakened?38:32,waves:awakened?3:2,turn:.2,interval:.7,speed:awakened?9.2:8.4,damage:24,kind:'enemyMoon',color});
 }else{
  charge(g,e,angle,1.1,awakened?21:19,.75,4.6,color);
  for(const offset of [-Math.PI/2,Math.PI/2])line(g,e,angle+offset,19,1.8,2.05,34,0xffcf91);
  if(awakened)for(const offset of [-Math.PI/4,Math.PI/4])line(g,e,angle+offset,19,1.8,2.65,34,0xffcf91);
  ring(g,e,e.x,e.z,4.5,10,3.3,36,color);
 }
}
