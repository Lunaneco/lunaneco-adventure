import {distanceToHazard} from '../src/enemies.js';
// A challenge pilot uses visible telegraphs and shots, walking direction, dash,
// switching and both earned ultimates. It never changes stats or simulation time.
export function trialInput(g){
 const p=g.player;
 if(g.exitOpen)return g.directionTo(g.exitPoint);
 if(g.travelOpen)return g.directionTo(g.travelTargets.find(t=>t.id==='safe')??g.travelTargets[0]);
 if(g.hasPartner&&g.chargeFor(g.partnerHero)>=100&&p.charge<50&&p.switchCooldown<=0)g.switchHero();
 if(p.charge>=100&&(g.enemies.length>2||g.enemies.some(e=>e.type==='boss')))g.ultimate();
 const enemy=g.nearest(p.x,p.z,100);let x=0,z=0;
 if(enemy){const dx=enemy.x-p.x,dz=enemy.z-p.z,d=Math.hypot(dx,dz)||.01,desired=p.hero===2?enemy.radius+1.85:enemy.type==='boss'?8:p.hero===1?7:5.7,radial=(d-desired)*.7;x=dx/d*radial-dz/d*.9;z=dz/d*radial+dx/d*.9;}
 if(Math.hypot(p.x,p.z)>14){x-=p.x*.3;z-=p.z*.3;}
 const angle=Math.atan2(x,z),speed=5.6*(1+g.rank('stride')*.12),shots=g.projectiles.filter(b=>b.owner==='enemy');
 const score=(a,dash=false)=>{
  const vx=Math.sin(a),vz=Math.cos(a);let risk=0;
  for(const t of [.12,.28,.48,.75,1.05]){
   const travel=dash?Math.min(t,.22)*24+Math.max(0,t-.22)*speed:t*speed;
   const qx=p.x+vx*travel,qz=p.z+vz*travel;
   if(!g.canWalk(qx,qz)){risk+=80;continue;}
   const immune=t<(dash?.5:p.invincible);
   for(const h of g.hazards){
    if(h.timer<t-.2||h.timer>t+.25)continue;
    const gap=distanceToHazard(qx,qz,h);
    if(gap<1)risk+=(immune?0:gap<.55?100:12)*(h.damage||h.kind==='charge'?1:.2);
   }
   for(const b of shots){const gap=Math.hypot(qx-b.x-b.vx*t,qz-b.z-b.vz*t)-b.radius;
    if(gap<1.2)risk+=immune?0:gap<.7?100:15;
   }
   for(const e of g.enemies){
    let ex=e.x,ez=e.z;
    if(e.rush){ex+=Math.sin(e.rush.angle)*e.rush.speed*Math.min(t,e.rush.remaining);ez+=Math.cos(e.rush.angle)*e.rush.speed*Math.min(t,e.rush.remaining);}
    const gap=Math.hypot(qx-ex,qz-ez)-e.radius;
    if(gap<1.3)risk+=immune?0:gap<.85?100:15;
   }
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
