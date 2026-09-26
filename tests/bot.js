export const priority=['orbit','power','haste','nova','crit','vitality','ward','echo','focus','leech','reach','stride','saberPower','saberReach','saberGuard','moonGuard','starBlade'];
export function chooseOffer(game){return [...game.offers].sort((a,b)=>priority.indexOf(a.id)-priority.indexOf(b.id))[0]?.id;}
export function botInput(game){
  const p=game.player;if(game.exitOpen)return game.directionTo(game.exitPoint);
  if(game.travelOpen){const target=game.travelTargets.find(t=>t.id===(game.auditRoute??'safe'))??game.travelTargets[0];return game.directionTo(target);}
  const enemy=game.nearest(p.x,p.z,100);let x=0,z=0;
  if(enemy){const dx=enemy.x-p.x,dz=enemy.z-p.z,d=Math.hypot(dx,dz)||.01,desired=p.hero===2?enemy.radius+1.85:enemy.type==='boss'?8:p.hero===1?7:5.7,radial=(d-desired)*.7;x=dx/d*radial-dz/d*.9;z=dz/d*radial+dx/d*.9;}
  if(Math.hypot(p.x,p.z)>14){x-=p.x*.3;z-=p.z*.3;}
  for(const h of game.hazards){
    const dx=p.x-h.x,dz=p.z-h.z;
    if(h.shape==='ring'){
      const d=Math.hypot(dx,dz)||.001;
      // The new ring mechanic has an empty, safe centre; don't flee through its band.
      if(h.damage&&d>h.innerRadius-1&&d<h.radius+1){const sign=d<(h.innerRadius+h.radius)/2?-1:1;x+=dx/d*sign*4;z+=dz/d*sign*4;if(h.timer<.8)game.dash(x,z);}
    }else if(h.shape==='line'){
      const along=dx*Math.sin(h.angle)+dz*Math.cos(h.angle),across=dx*Math.cos(h.angle)-dz*Math.sin(h.angle);
      if(Math.abs(along)<h.length/2+1&&Math.abs(across)<h.width/2+1){const sign=across>=0?1:-1;x+=Math.cos(h.angle)*sign*4;z-=Math.sin(h.angle)*sign*4;game.dash(x,z);}
    }else{const d=Math.hypot(dx,dz)||.001;if(d<h.radius+1){x+=dx/d*3;z+=dz/d*3;game.dash(x,z);}}
  }
  for(const b of game.projectiles){if(b.owner!=='enemy')continue;const dx=p.x-b.x,dz=p.z-b.z,speed=Math.hypot(b.vx,b.vz)||1,along=(dx*b.vx+dz*b.vz)/speed,across=(dx*b.vz-dz*b.vx)/speed;
    if(along>0&&along<3.5&&Math.abs(across)<.85){const sign=across>=0?1:-1;x+=b.vz/speed*sign*3;z-=b.vx/speed*sign*3;game.dash(x,z);}
  }
  if(p.charge>=100&&(game.enemies.length>2||game.enemies.some(e=>e.type==='boss')))game.ultimate();
  const length=Math.hypot(x,z)||1,angle=Math.atan2(x,z);if(!game.canWalk(p.x+x/length*1.4,p.z+z/length*1.4)){for(const turn of [.6,-.6,1.2,-1.2,2,-2,Math.PI]){const a=angle+turn;if(game.canWalk(p.x+Math.sin(a)*1.4,p.z+Math.cos(a)*1.4))return {x:Math.sin(a),z:Math.cos(a)};}return game.directionTo(enemy??game.layout.entrance);}
  return {x,z};
}
