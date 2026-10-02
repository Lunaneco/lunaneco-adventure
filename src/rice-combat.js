import {hasRicePower} from './rice-awakening.js';
import {clearPath,moveWithin,projectInside} from './terrain.js';

export const RICE_RULES=Object.freeze({range:14,holdSeconds:4,cooldown:.45,throwSpeed:20,throwSeconds:.6});
export const canUseRice=game=>!!game&&hasRicePower(game.progression)&&game.heroId(game.player.hero)==='omsolo'&&game.player.hp>0&&game.phase==='playing'&&!game.tutorial?.active&&!game.exitOpen&&!game.travelOpen&&!game.mount.active;
const live=(game,kind,object)=>kind==='enemy'?game.enemies.includes(object)&&object.hp>0:kind==='bullet'?game.projectiles.includes(object)&&object.life>0&&object.owner==='enemy':game.hazards.includes(object)&&object.timer>0&&object.damage>0;
export function riceTargets(game){
  if(!canUseRice(game)||game.rice.held||game.rice.cooldown>0)return [];
  return [...game.enemies.filter(e=>e.hp>0&&e.type!=='boss'&&!e.riceThrown).map(object=>({kind:'enemy',object})),...game.projectiles.filter(b=>b.owner==='enemy'&&b.life>0).map(object=>({kind:'bullet',object})),...game.hazards.filter(h=>h.timer>0&&h.damage>0).map(object=>({kind:'hazard',object}))].filter(({object})=>Math.hypot(object.x-game.player.x,object.z-game.player.z)<=RICE_RULES.range);
}
export function grabRice(game,kind,id){
  if(!canUseRice(game)||game.rice.held||game.rice.cooldown>0)return false;
  const candidate=riceTargets(game).find(t=>t.kind===kind&&t.object.id===id);if(!candidate)return false;
  const object=candidate.object;
  game.rice.held={kind,object,remaining:RICE_RULES.holdSeconds,lastDirection:null};
  object.riceHeld=true;
  if(kind==='enemy'){
    // Interrupt the grabbed body's attack, including its already placed warnings.
    object.cast=null;object.rush=null;object.salvo=null;object.knockX=object.knockZ=0;object.attack=Math.max(.8,object.attack);object.special=Math.max(1,object.special);
    game.hazards=game.hazards.filter(h=>h.sourceId!==id);
  }
  game.emit('riceGrab',{kind,x:object.x,z:object.z});return true;
}
export function cancelRice(game){
  const held=game?.rice?.held;if(!held)return false;
  held.object.riceHeld=false;
  if(held.kind==='enemy')held.object.attack=Math.max(.8,held.object.attack);
  if(held.kind==='hazard'&&held.object.timer>0)held.object.timer=Math.max(.35,held.object.timer);
  else if(held.kind==='hazard')game.hazards=game.hazards.filter(h=>h!==held.object);
  if(held.kind==='bullet'&&held.object.life>0)held.object.life=Math.max(.35,held.object.life);
  game.rice.held=null;game.rice.cooldown=RICE_RULES.cooldown;game.emit('riceRelease',{cancelled:true});return true;
}
function impactDamage(game,kind,object){
  // skillDamage already applies character-level/weapon scaling exactly once.
  return kind==='enemy'?game.skillDamage('omsolo',84):Math.max(game.skillDamage('omsolo',67.2),object.damage*2);
}
function impactTarget(game,source,from,to,radius){
  const dx=to.x-from.x,dz=to.z-from.z,length=dx*dx+dz*dz;
  return game.enemies.filter(e=>e!==source&&e.hp>0).map(e=>{const t=Math.max(0,Math.min(1,((e.x-from.x)*dx+(e.z-from.z)*dz)/(length||1)));return {e,t,d:Math.hypot(e.x-from.x-dx*t,e.z-from.z-dz*t)};}).filter(hit=>hit.d<=hit.e.radius+radius).sort((a,b)=>a.t-b.t)[0]?.e;
}
function strike(game,held,target){
  const {kind,object}=held;const damage=held.damage??impactDamage(game,kind,object);
  game.hit(target,damage,object.x,object.z,false,false,'omsolo');
  game.emit('riceImpact',{kind,x:target.x,z:target.z});
  if(game.rice.held?.object===object)cancelRice(game);
  if(kind==='bullet')object.life=0;
  if(kind==='hazard'){object.timer=0;game.hazards=game.hazards.filter(h=>h!==object);}
  if(kind==='enemy'){object.riceThrown=null;object.attack=Math.max(.8,object.attack);object.knockX=object.knockZ=0;}
}
export function moveRice(game,point){
  const held=game?.rice?.held;if(!held)return false;
  if(!canUseRice(game)||!live(game,held.kind,held.object)){cancelRice(game);return false;}
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.z))return false;
  const object=held.object,from={x:object.x,z:object.z},dx=point.x-game.player.x,dz=point.z-game.player.z,d=Math.hypot(dx,dz),scale=d>RICE_RULES.range?RICE_RULES.range/d:1;
  const desired=projectInside(game.walkLayout,game.player.x+dx*scale,game.player.z+dz*scale,Math.min(.8,object.radius??.4));
  // Dragging cannot teleport bodies through a missing bridge or across a wall.
  const next=clearPath(game.walkLayout,from,desired,.35)?desired:from;
  const distance=Math.hypot(next.x-from.x,next.z-from.z);if(distance<.01)return true;
  held.lastDirection={x:(next.x-from.x)/distance,z:(next.z-from.z)/distance};
  const target=impactTarget(game,held.kind==='enemy'?object:null,from,next,held.kind==='enemy'?Math.min(1.15,object.radius*.6):.45);
  Object.assign(object,next);if(target)strike(game,held,target);return true;
}
export function releaseRice(game){
  const held=game?.rice?.held;if(!held)return false;
  if(!canUseRice(game)||!live(game,held.kind,held.object)){cancelRice(game);return false;}
  const {kind,object}=held,direction=held.lastDirection??{x:Math.sin(game.player.face),z:Math.cos(game.player.face)},damage=impactDamage(game,kind,object);
  cancelRice(game);
  if(kind==='enemy')object.riceThrown={x:direction.x*RICE_RULES.throwSpeed,z:direction.z*RICE_RULES.throwSpeed,remaining:RICE_RULES.throwSeconds,damage};
  else{
    if(kind==='bullet')object.life=0;else{object.timer=0;game.hazards=game.hazards.filter(h=>h!==object);}
    // A new ID gives the reflected attack its own friendly renderer and no hostile homing.
    game.projectiles.push({id:game.ids++,owner:'player',heroId:'omsolo',kind:'riceReturn',x:object.x,z:object.z,vx:direction.x*RICE_RULES.throwSpeed,vz:direction.z*RICE_RULES.throwSpeed,speed:RICE_RULES.throwSpeed,damage,radius:.5,life:1.2});
  }
  game.emit('riceRelease',{cancelled:false,x:object.x,z:object.z});return true;
}
export function tickRice(game,dt){
  game.rice.cooldown=Math.max(0,game.rice.cooldown-dt);
  const held=game.rice.held;
  if(held){held.remaining-=dt;if(!canUseRice(game)||!live(game,held.kind,held.object)||held.remaining<=0)cancelRice(game);}
  for(const e of game.enemies){
    const thrown=e.riceThrown;if(!thrown)continue;
    if(e.hp<=0){e.riceThrown=null;continue;}
    const from={x:e.x,z:e.z},next=moveWithin(game.walkLayout,from,e.x+thrown.x*dt,e.z+thrown.z*dt,Math.min(.8,e.radius));
    const target=impactTarget(game,e,from,next,Math.min(1.15,e.radius*.6));Object.assign(e,next);thrown.remaining-=dt;
    if(target)strike(game,{kind:'enemy',object:e,damage:thrown.damage},target);
    else if(thrown.remaining<=0||Math.hypot(next.x-from.x,next.z-from.z)<.01){e.riceThrown=null;e.attack=Math.max(.8,e.attack);}
  }
}
