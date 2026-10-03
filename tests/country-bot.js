import {distanceToHazard} from '../src/enemies.js';
import {HEROES} from '../src/model.js';
import {PRIM_MOUNT} from '../src/prim-combat.js';
import {FLOOR_TYPES,floorPatchesFor,floorPhase,floorMovementScale} from '../src/special-floors.js';
// A challenge pilot uses visible telegraphs and shots, walking direction, dash,
// switching and both earned ultimates. It never changes stats or simulation time.
function trialMotion(g){
 const p=g.player;return {speed:(g.mount.active?PRIM_MOUNT.speed:HEROES[p.hero].moveSpeed??5.6)*(1+g.rank('stride')*.12)*floorMovementScale(g,p),dashSpeed:g.mount.active?PRIM_MOUNT.dashSpeed:HEROES[p.hero].dashSpeed??24};
}
export function trialPosition(g,angle,time,newDash=false,motion=trialMotion(g)){
 const p=g.player,{speed,dashSpeed}=motion;
 const duration=newDash?Math.min(time,.22):Math.min(time,p.dash??0),walk=Math.max(0,time-duration)*speed;
 // An ongoing dash keeps its actual direction and speed even if the pilot
 // proposes a new walking direction or swaps characters during the dash.
 const dashX=newDash?Math.sin(angle):p.dx,dashZ=newDash?Math.cos(angle):p.dz,travel=duration*(newDash?dashSpeed:p.dashSpeed??dashSpeed);
 return {x:p.x+Math.sin(angle)*walk+(duration>0?dashX*travel:0),z:p.z+Math.cos(angle)*walk+(duration>0?dashZ*travel:0)};
}
export function trialShotRisk(g,angle,shot,newDash=false,motion=trialMotion(g)){
 // Fast arrows can cross between the old 120 ms sampling points. Evaluate the
 // swept relative path, using the same locked dash and collision radius as play.
 const immune=newDash?.5:g.player.invincible,until=Math.min(1.05,shot.life??1.05);
 const times=[immune,...[.12,.28,.48,.75,1.05,newDash?.22:g.player.dash??0].filter(t=>t>immune&&t<until),until].sort((a,b)=>a-b);
 if(immune>=until)return 0;
 let risk=0;
 for(let i=1;i<times.length;i++){
  const from=times[i-1],to=times[i],p0=trialPosition(g,angle,from,newDash,motion),p1=trialPosition(g,angle,to,newDash,motion);
  const x=p0.x-shot.x-shot.vx*from,z=p0.z-shot.z-shot.vz*from;
  const dx=p1.x-shot.x-shot.vx*to-x,dz=p1.z-shot.z-shot.vz*to-z;
  const t=Math.max(0,Math.min(1,-(x*dx+z*dz)/(dx*dx+dz*dz||1)));
  const gap=Math.hypot(x+dx*t,z+dz*t)-shot.radius;
  if(gap<1.2)risk+=gap<.7?100:15;
 }
 return risk;
}
export function trialInput(g){
 const p=g.player;
 if(g.exitOpen)return g.directionTo(g.exitPoint);
 if(g.travelOpen)return g.directionTo(g.travelTargets.find(t=>t.id==='safe')??g.travelTargets[0]);
 if(g.hasPartner&&g.chargeFor(g.partnerHero)>=100&&p.charge<50&&p.switchCooldown<=0)g.switchHero();
 if(p.charge>=100&&(g.enemies.length>2||g.enemies.some(e=>e.type==='boss')))g.ultimate();
 const enemy=g.nearest(p.x,p.z,100);let x=0,z=0;
 if(enemy){const dx=enemy.x-p.x,dz=enemy.z-p.z,d=Math.hypot(dx,dz)||.01,desired=p.hero===2?enemy.radius+1.85:enemy.type==='boss'?8:p.hero===1?7:5.7,radial=(d-desired)*.7;x=dx/d*radial-dz/d*.9;z=dz/d*radial+dx/d*.9;}
 if(Math.hypot(p.x,p.z)>14){x-=p.x*.3;z-=p.z*.3;}
 const angle=Math.atan2(x,z),shots=g.projectiles.filter(b=>b.owner==='enemy'),motion=trialMotion(g);
 const floorWarnings=floorPatchesFor(g.layout).filter(f=>FLOOR_TYPES[f.type].kind==='damage'&&['warning','active'].includes(floorPhase(g,f).phase));
 const score=(a,dash=false)=>{
  let risk=0;
  for(const t of [.12,.28,.48,.75,1.05]){
   const {x:qx,z:qz}=trialPosition(g,a,t,dash,motion);
   if(!g.canWalk(qx,qz)){risk+=80;continue;}
   const immune=t<(dash?.5:p.invincible);
   for(const f of floorWarnings)if(Math.hypot(qx-f.x,qz-f.z)<f.radius+.65)risk+=immune?0:100;
   for(const h of g.hazards){
    if(h.timer<t-.2||h.timer>t+.25)continue;
    const gap=distanceToHazard(qx,qz,h);
    if(gap<1)risk+=(immune?0:gap<.55?100:12)*(h.damage||h.kind==='charge'?1:.2);
   }
   for(const e of g.enemies){
    let ex=e.x,ez=e.z;
    if(e.rush){ex+=Math.sin(e.rush.angle)*e.rush.speed*Math.min(t,e.rush.remaining);ez+=Math.cos(e.rush.angle)*e.rush.speed*Math.min(t,e.rush.remaining);}
    const gap=Math.hypot(qx-ex,qz-ez)-e.radius;
    if(gap<1.3)risk+=immune?0:gap<.85?100:15;
   }
  }
  for(const b of shots)risk+=trialShotRisk(g,a,b,dash,motion);
  for(const h of g.hazards)if(h.timer>=0&&h.timer<=1.05&&h.timer>=(dash?.5:p.invincible)){
   const q=trialPosition(g,a,h.timer,dash,motion),gap=distanceToHazard(q.x,q.z,h);
   if(gap<.7)risk+=100*(h.damage||h.kind==='charge'?1:.2);
  }
  return risk;
 };
 let chosen={angle,risk:Infinity,cost:Infinity};
 for(let i=0;i<24;i++){
  const a=angle+i*Math.PI/12,risk=score(a),cost=risk+(1-Math.cos(a-angle))*2;
  if(cost<chosen.cost)chosen={angle:a,risk,cost};
 }
 if(chosen.risk>=60&&p.invincible<.13){
  if(p.dashCooldown<=0){let dodge={angle:chosen.angle,cost:Infinity};for(let i=0;i<24;i++){const a=angle+i*Math.PI/12,cost=score(a,true)+(1-Math.cos(a-angle))*2;if(cost<dodge.cost)dodge={angle:a,cost};}g.dash(Math.sin(dodge.angle),Math.cos(dodge.angle));chosen.angle=dodge.angle;}
  else if(g.hasPartner&&p.switchCooldown<=0)g.switchHero();
 }
 return {x:Math.sin(chosen.angle),z:Math.cos(chosen.angle)};
}
