// All targets are captured at the start of the attack. Delayed strikes use the
// same geometry for their warning and damage, leaving readable escape routes.
export function storyBossAttack(g,e,{angle,action,color,empowered,line,circle,ring,charge,lockCast,volley}){
 const p=g.player,n=empowered?1:0;
 const point=(forward,side=0)=>({x:e.x+Math.sin(angle)*forward+Math.cos(angle)*side,z:e.z+Math.cos(angle)*forward-Math.sin(angle)*side});
 const beamAt=(at,a,length,width,delay,damage)=>line(g,{...e,x:at.x-Math.sin(a)*length/2,z:at.z-Math.cos(a)*length/2},a,length,width,delay,damage,color);
 const chant=t=>lockCast(g,e,t,{kind:'chant',angle});
 if(e.bossId==='treant'){
  if(action===0){
   circle(g,e,p.x,p.z,2.5,1.3,22,color);
   for(const side of [-1,1])for(let i=1;i<=2+n;i++){const q={x:p.x+Math.cos(angle)*side*i*2.8,z:p.z-Math.sin(angle)*side*i*2.8};circle(g,e,q.x,q.z,1.8,1.3+i*.4,22,color);}
   chant(1.3);
  }else if(action===1)volley(g,e,{angle,delay:1.05,offsets:[-.4,-.2,0,.2,.4],waves:2+n,turn:.1,interval:.5,speed:7,damage:17,kind:'enemySeed',color});
  else{charge(g,e,angle,1.1,10,.7,3.8,color);for(const side of [-1,1]){const q=point(6,side*3.6);circle(g,e,q.x,q.z,2,2.15,24,color);}}
 }else if(e.bossId==='chronarch'){
  if(action===0){
   // Clock marks detonate clockwise; the centre becomes unsafe on the final tick.
   for(let i=0;i<8+n*4;i++){const a=angle+i*Math.PI*2/(8+n*4);circle(g,e,p.x+Math.sin(a)*4,p.z+Math.cos(a)*4,1.35,1.2+i*.16,21,color);}
   circle(g,e,p.x,p.z,2.3,2.9,25,color);chant(1.2);
  }else if(action===1){for(let step=0;step<3+n;step++)for(let i=0;i<4;i++)line(g,e,angle+step*Math.PI/6+i*Math.PI/2,20,1.35,1.25+step*.6,24,color);chant(1.25);}
  else volley(g,e,{angle,delay:1.1,offsets:[-.6,-.3,0,.3,.6],waves:3+n,turn:-.12,interval:.4,speed:8,damage:18,kind:'enemyClock',color});
 }else if(e.bossId==='tempest'){
  if(action===0){
   for(let i=0;i<5+n;i++){const q={x:p.x+Math.cos(angle)*(i-2)*3.2,z:p.z-Math.sin(angle)*(i-2)*3.2};beamAt(q,angle,22,2.1,1.2+i*.3,24);}
   chant(1.2);
  }else if(action===1)volley(g,e,{angle,delay:1.1,count:18+n*4,waves:2+n,turn:.18,interval:.65,speed:6.4,damage:20,kind:'enemyFeather',color});
  else{charge(g,e,angle,1.2,14,.85,3.7,color);const q=point(10);ring(g,e,q.x,q.z,2.8,6.4,2.45,26,color);}
 }else if(e.bossId==='eclipse'){
  if(action===0){
   ring(g,e,e.x,e.z,4.5,10,1.25,27,color);circle(g,e,e.x,e.z,4.5,2.15,28,color);
   if(empowered)ring(g,e,e.x,e.z,5,11,3.05,29,color);chant(1.25);
  }else if(action===1)volley(g,e,{angle,delay:1.15,count:empowered?22:18,waves:empowered?3:2,turn:.26,interval:.6,speed:empowered?7.3:6.2,damage:21,kind:'enemyMoon',color});
  else{charge(g,e,angle,1.1,empowered?16:13,.75,3.8,color);for(let i=1;i<=3+n;i++){const q=point(i*3);circle(g,e,q.x,q.z,2.5,2+i*.23,27,color);}}
 }else if(e.bossId==='thornmaw'){
  if(action===0){
   // Paired claws close in from the sides, followed by the centre bite.
   for(let i=0;i<3+n;i++)for(const side of [-1,1]){const q={x:p.x+Math.cos(angle)*side*(6-i*1.5),z:p.z-Math.sin(angle)*side*(6-i*1.5)};beamAt(q,angle,11,1.7,1.15+i*.4,28);}
   circle(g,e,p.x,p.z,2.4,2.75,32,color);chant(1.15);
  }else if(action===1){circle(g,e,e.x,e.z,3.8,1.15,29,color);ring(g,e,e.x,e.z,4,7,1.85,30,color);ring(g,e,e.x,e.z,7.3,10.3+n,2.55,31,color);chant(1.15);}
  else{charge(g,e,angle,1.2,empowered?16:14,.8,4.2,color);const q=point(10);circle(g,e,q.x,q.z,3.1,2.35,33,color);ring(g,e,q.x,q.z,3.5,7,3.05,30,color);}
 }else if(e.bossId==='basalt'){
  if(action===0){
   for(let i=0;i<7+n*2;i++){const q=point(2+i*2.2,Math.sin(i*1.2)*2.6);circle(g,e,q.x,q.z,2.1,1.2+i*.2,28,color);}
   chant(1.2);
  }else if(action===1)volley(g,e,{angle,delay:1.15,offsets:[-.9,-.6,-.3,0,.3,.6,.9],waves:2+n,turn:.15,interval:.6,speed:8.2,damage:25,kind:'enemySeed',color});
  else{for(let i=0;i<5+n;i++)line(g,e,angle-.9+i*.45,15,2.4,1.25+i*.35,32,color);chant(1.25);e.recovery=.65;}
 }else if(e.bossId==='ironbell'){
  if(action===0){for(let step=0;step<2+n;step++)for(let i=0;i<4;i++)line(g,e,angle+step*Math.PI/4+i*Math.PI/2,21,1.9,1.2+step*.75,29,color);chant(1.2);}
  else{
   if(action===1){
    for(let i=0;i<3+n;i++){const radius=4+i*2.8;ring(g,e,e.x,e.z,radius-1.15,radius+1.15,1.15+i*.55,29,color);}
    circle(g,e,p.x,p.z,2.3,2.65,31,color);chant(1.15);
   }else{circle(g,e,p.x,p.z,3.8,1.5,36,color);for(const a of [angle,angle+Math.PI/2])beamAt(p,a,22,2.4,2.25,32);if(empowered)ring(g,e,p.x,p.z,4.3,7.5,3,32,color);chant(1.5);e.recovery=.8;}
  }
 }else if(e.bossId==='colossus'){
  if(action===0){
   circle(g,e,p.x,p.z,4.2,1.3,36,color);
   for(let i=0;i<3+n;i++){const q=point(3+i*4,(i%2?1:-1)*2.2);circle(g,e,q.x,q.z,3.3,1.75+i*.45,35,color);}
   ring(g,e,p.x,p.z,4.5,8,3.25,34,color);chant(1.3);e.recovery=.65;
  }else if(action===1){
   for(let i=0;i<(empowered?8:6);i++){const a=angle+i*Math.PI/4;circle(g,e,p.x+Math.sin(a)*4.6,p.z+Math.cos(a)*4.6,2.25,1.35+i*.18,30,color);}
   volley(g,e,{angle,delay:1.35,count:empowered?20:16,waves:2,turn:.2,interval:.65,speed:6.3,damage:25,kind:'enemyMoon',color});
  }else{
   for(const offset of [-.5,.5])line(g,e,angle+offset,23,3.2,1.4,38,color);
   line(g,e,angle,23,3.5,2.1,40,color);
   for(const side of [-1,1]){const q=point(10,side*6);circle(g,e,q.x,q.z,3.7,2.85,36,color);}
   chant(1.4);e.recovery=.85;
  }
 }
}
