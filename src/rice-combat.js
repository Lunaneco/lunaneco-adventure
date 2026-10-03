import {hasRicePower} from './rice-awakening.js';

export const RICE_RULES=Object.freeze({duration:5,cooldown:10,radius:1.9,returnSpeed:20});
export const createRicePower=()=>({active:false,remaining:0,cooldown:0});
export const canUseRice=game=>!!game&&hasRicePower(game.progression)&&game.heroId(game.player.hero)==='omsolo'&&game.player.hp>0&&game.phase==='playing'&&!game.tutorial?.active&&!game.exitOpen&&!game.travelOpen&&!game.mount.active;
export const canActivateRice=game=>canUseRice(game)&&!game.rice.active&&game.rice.cooldown<=1e-8;
export function activateRice(game){
  if(!canActivateRice(game))return false;
  Object.assign(game.rice,{active:true,remaining:RICE_RULES.duration,cooldown:0});
  game.emit('riceStarted',{x:game.player.x,z:game.player.z});return true;
}
export function cancelRice(game){
  if(!game?.rice?.active)return false;
  Object.assign(game.rice,{active:false,remaining:0,cooldown:RICE_RULES.cooldown});
  game.emit('riceEnded');return true;
}
export function tickRice(game,dt){
  if(game.phase!=='playing'||game.tutorial?.active||game.exitOpen||game.travelOpen)return;
  const state=game.rice;
  if(state.active){
    if(!canUseRice(game)){cancelRice(game);return;}
    state.remaining=Math.max(0,state.remaining-dt);
    if(state.remaining<=1e-8)cancelRice(game);
  }else state.cooldown=Math.max(0,state.cooldown-dt);
}
export function reflectRiceBullet(game,bullet,fromX,fromZ){
  if(!game.rice.active||!canUseRice(game)||bullet.owner!=='enemy'||bullet.life<=0)return false;
  const p=game.player,dx=bullet.x-fromX,dz=bullet.z-fromZ,lengthSq=dx*dx+dz*dz;
  const t=Math.max(0,Math.min(1,((p.x-fromX)*dx+(p.z-fromZ)*dz)/(lengthSq||1)));
  const x=fromX+dx*t,z=fromZ+dz*t;
  // Swept collision keeps fast boss shots from tunnelling through the shield.
  if(Math.hypot(p.x-x,p.z-z)>RICE_RULES.radius+(bullet.radius??0))return false;
  const target=game.enemies.find(e=>e.id===bullet.sourceId&&e.hp>0)??game.nearest(x,z,Infinity);
  const tx=target?target.x-x:-bullet.vx,tz=target?target.z-z:-bullet.vz,d=Math.hypot(tx,tz)||1;
  bullet.life=0;
  // A fresh friendly projectile discards hostile homing and preserves incoming damage.
  game.projectiles.push({id:game.ids++,owner:'player',heroId:'omsolo',kind:'riceReturn',target:target?.id,
    x,z,vx:tx/d*RICE_RULES.returnSpeed,vz:tz/d*RICE_RULES.returnSpeed,speed:RICE_RULES.returnSpeed,
    damage:bullet.damage,radius:bullet.radius??.2,life:Math.max(2,target?d/RICE_RULES.returnSpeed+1:2),color:0xb9ffc2});
  game.emit('riceReflected',{x,z,sourceId:bullet.sourceId});return true;
}
