// Dedicated attacks for the inhabitants corrupted by the siege of Homusubi.
// Targets are fixed when the warning appears; no hidden tracking or instant hits.
export function countryEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,charge,lockCast,cooldownRate=1}){
 const p=g.player;
 e.special-=dt*cooldownRate;
 if(e.special<=0&&d<14){
  if(e.type==='reaper'&&d<4.4){
   line(g,e,angle,4.5,3.4,.95,38,0xff8875);lockCast(e,.95,{kind:'chant',angle});e.special=1.9;e.recovery=.6;
  }else if(e.type==='matchlock'){
   for(const offset of [-.11,0,.11])line(g,e,angle+offset,16,.55,.95,0,0xffba72,'aim');
   lockCast(e,.95,{kind:'riceVolley',angle});e.special=2.15;
  }else if(e.type==='stormlantern'){
   for(let i=0;i<3;i++)circle(g,e,p.x+Math.cos(angle)*(i-1)*2.9,p.z-Math.sin(angle)*(i-1)*2.9,1.65,1.15+i*.38,37,0xc19cff);
   lockCast(e,1.15,{kind:'chant',angle});e.special=3.2;
  }else if(e.type==='pestmoth'){
   for(const offset of [-.5,-.25,0,.25,.5])line(g,e,angle+offset,12,.45,1.1,0,0xc7e875,'aim');
   lockCast(e,1.1,{kind:'pollen',angle});e.special=3.1;
  }else if(e.type==='ironcrab'&&d<9){
   for(const sign of [-1,1])line(g,{...e,x:e.x+Math.cos(angle)*2.2*sign,z:e.z-Math.sin(angle)*2.2*sign},angle,9,1.6,1.25,46,0x78dfec);
   lockCast(e,1.25,{kind:'chant',angle});e.special=2.6;e.recovery=.8;
  }else if(e.type==='ramcart'&&d>3){
   charge(g,e,angle,1.05,14,.72,2.2,0xff9375);e.special=3.2;
  }
  if(e.cast){g.emit('enemyCast',{id:e.id,type:e.type});return;}
 }
 const ranged=['matchlock','stormlantern','pestmoth'].includes(e.type);
 if(ranged&&d<5.8){move(e,-Math.sin(angle),-Math.cos(angle),e.speed*.55*slow,dt);return;}
 if(d>(ranged?8.5:e.radius+.6))move(e,route.x,route.z,e.speed*slow,dt);
}
