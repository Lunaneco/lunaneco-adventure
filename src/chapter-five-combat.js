// The reference dragon alternates a 3-way fan and a charged straight beam.
// At half HP the fan becomes 5-way and the tell shortens, while aim remains locked.
export function prismBossAttack(g,e,{angle,color,empowered,line,lockCast,volley}){
 const turn=(e.action-1)%2;
 if(turn===0){const offsets=empowered?[-.56,-.28,0,.28,.56]:[-.4,0,.4];volley(g,e,{angle,offsets,delay:empowered?.8:1.1,waves:1,speed:empowered?10:8.5,damage:25,color,kind:'enemyMoon'});}
 else{const delay=empowered?.85:1.3;line(g,e,angle,27,2.4,delay,30,color);lockCast(g,e,delay,{kind:'chant',angle});}
}
export function prismEnemyMove(g,e,{d,route,dt,slow,move}){if(d>e.radius+.6)move(e,route.x,route.z,e.speed*slow,dt);}
