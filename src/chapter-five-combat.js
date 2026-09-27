import {PRISM_ENEMIES} from './chapter-five-enemies.js';
const crystal=0x9edfff;

// Match chapter four's tells and recovery cadence, using crystal-world attacks.
export function prismEnemyAttack(g,e,{angle,d,route,dt,slow,move,line,circle,ring,charge,lockCast,volley,cooldownRate}){
 e.special-=dt*cooldownRate;
 const ranged=PRISM_ENEMIES[e.type].ranged===true;
 if(e.special<=0&&d<(ranged?16:10)){
  e.special=e.type==='prismCrawler'?2.05:e.type==='prismHound'?3.25:2.9;
  if(e.type==='prismCrawler'){
   line(g,e,angle,4.4,2,.55,48,crystal);line(g,e,angle+.6,4.8,2,.95,52,crystal);lockCast(g,e,.98,{kind:'chant',angle});
  }else if(e.type==='prismHound'){
   charge(g,e,angle,.7,14,.38,2.1,crystal);e.prismFollowup={due:1.6,kind:'charge',left:1};
  }else if(e.type==='prismLancer'){
   line(g,e,angle,8,2.1,.65,57,crystal);line(g,e,angle+Math.PI/2,8,2.1,1.1,57,crystal);lockCast(g,e,1.12,{kind:'chant',angle});
  }else if(e.type==='prismGolem'){
   circle(g,e,e.x,e.z,3.6,.8,72,crystal);ring(g,e,e.x,e.z,3.8,6.8,1.25,62,crystal);lockCast(g,e,1.28,{kind:'chant',angle});
  }else if(e.type==='prismBloom'){
   circle(g,e,g.player.x,g.player.z,2.25,.85,44,crystal);e.prismFollowup={due:.4,kind:'sigil',left:2};lockCast(g,e,.4,{kind:'chant',angle});
  }else{
   const wisp=e.type==='prismWisp';volley(g,e,{angle,delay:.75,waves:wisp?2:1,interval:.35,turn:.2,offsets:wisp?[-.5,0,.5]:[-.2,.2],speed:7.8,damage:41,color:crystal,kind:'enemyMoon',homing:1.5,turnRate:1.35});
  }
  g.emit('enemyCast',{id:e.id,enemyType:e.type});return;
 }
 if(d>(ranged?7:e.radius+.8))move(e,route.x,route.z,e.speed*slow,dt);
 else if(ranged&&d<4.5)move(e,-route.x,-route.z,e.speed*.7*slow,dt);
}

export function prismFollowup(g,e,{angle,circle,charge}){
 const f=e.prismFollowup;
 if(!f||f.due>0)return;
 if(f.kind==='sigil'){circle(g,e,g.player.x,g.player.z,2.25,.85,44,crystal);f.due=.42;}
 else{charge(g,e,angle,.65,14,.38,2.1,crystal);f.due=1.6;}
 if(--f.left<=0)e.prismFollowup=null;
}

// Keep the reference dragon's fan/straight-breath alternation. Multi-hit chains
// give it chapter four's pressure without removing the visible escape windows.
export function prismBossAttack(g,e,{angle,color,empowered,line,lockCast,volley}){
 const turn=(e.action-1)%2;
 if(turn===0){
  volley(g,e,{angle,offsets:empowered?[-.56,-.28,0,.28,.56]:[-.4,0,.4],delay:empowered?.75:.85,waves:empowered?3:2,interval:.4,turn:.18,speed:empowered?10:8.5,damage:25,color,kind:'enemyMoon'});
 }else{
  const count=empowered?3:2,delay=empowered?.65:.9,interval=empowered?.3:.35;
  for(let i=0;i<count;i++)line(g,e,angle+(i-(count-1)/2)*.18,27,2.4,delay+i*interval,30,color);
  lockCast(g,e,delay+(count-1)*interval+.03,{kind:'chant',angle});
 }
}
