import {fireLumiRail} from './lumi-combat.js';
import {canPrimDuet,beamContains} from './prim-combat.js';
import {canShizukuDuet,SHIZUKU_DUET,healHero,drainShizuku} from './shizuku-combat.js';
import {mochiCryHit} from './mochi-combat.js';
const EPSILON=1e-8;
const PULSE_KINDS=['prismBeam','sanctuary','bladeDance','mochiLullaby','scytheDance','moonDrop','predationDance'];

function pulse(game,effect){
  if(effect.kind==='predationDance'){
    const source=game.sourceFor(effect.heroId);effect.x=source.x;effect.z=source.z;
    game.emit('predationPulse',{x:effect.x,z:effect.z,radius:effect.radius,heroId:effect.heroId});
    for(const enemy of [...game.enemies])if(enemy.hp>0&&Math.hypot(enemy.x-effect.x,enemy.z-effect.z)<=effect.radius+enemy.radius)game.hit(enemy,game.skillDamage(effect.heroId,effect.spec.baseDamage),effect.x,effect.z,true,false,effect.heroId,false);
    effect.pulsesLeft--;return;
  }
  if(effect.kind==='prismBeam'){
    const source=game.sourceFor(effect.heroId);effect.x=source.x;effect.z=source.z;source.face=effect.angle;
    game.emit('prismBeam',{x:effect.x,z:effect.z,angle:effect.angle,range:effect.spec.range,width:effect.spec.width,duet:!!effect.heroIds});
    for(const enemy of [...game.enemies])if(enemy.hp>0&&beamContains(effect,enemy)){
      for(const id of effect.heroIds??[effect.heroId])if(enemy.hp>0)game.hit(enemy,game.skillDamage(id,effect.spec.baseDamage),effect.x,effect.z,true,false,id,false);
    }
    effect.pulsesLeft--;return;
  }

  if(['bladeDance','scytheDance','moonDrop'].includes(effect.kind)){const source=game.sourceFor(effect.heroId);effect.x=source.x;effect.z=source.z;}
  game.emit(['bladeDance','scytheDance','moonDrop'].includes(effect.kind)?'saberPulse':'ultimatePulse',{x:effect.x,z:effect.z,radius:effect.radius,heroId:effect.heroId,heroIds:effect.heroIds,kind:effect.kind});
  for(const enemy of [...game.enemies])if(enemy.hp>0&&Math.hypot(enemy.x-effect.x,enemy.z-effect.z)<=effect.radius+enemy.radius){if(effect.kind==='mochiLullaby')mochiCryHit(game,enemy,{ultimate:true});const dealt=game.hit(enemy,effect.damage,effect.x,effect.z,true,false,effect.heroId,false);if(['scytheDance','moonDrop'].includes(effect.kind))drainShizuku(game,dealt);}
  effect.pulsesLeft--;
}
function shoot(game,effect){
  const spec=effect.spec,source=game.sourceFor(effect.heroId),target=game.nearest(source.x,source.z,spec.range);
  if(spec.kind==='railgunBarrage'){fireLumiRail(game,source,{range:spec.range,damage:effect.damage,color:spec.color,crit:true,ultimate:true,pierce:Infinity,width:spec.width});game.emit('ultimateShot',{x:source.x,z:source.z,angle:source.face,heroId:effect.heroId});effect.shotsLeft--;return;}
  const angle=target?Math.atan2(target.x-source.x,target.z-source.z):source.face;source.face=angle;
  game.projectiles.push({id:game.ids++,owner:'player',kind:spec.kind==='homingBarrage'?'magicArrow':'gun',target:target?.id,color:spec.color,ultimate:true,heroId:effect.heroId,x:source.x,z:source.z,vx:Math.sin(angle)*spec.speed,vz:Math.cos(angle)*spec.speed,speed:spec.speed,life:(spec.range+2)/spec.speed,damage:effect.damage,crit:true,radius:.32,pierce:spec.pierce,hitIds:[]});
  game.emit('ultimateShot',{x:source.x,z:source.z,angle,heroId:effect.heroId});effect.shotsLeft--;
}
export function canCastUltimate(game){
  return game?.phase==='playing'&&!game.exitOpen&&!game.travelOpen&&!game.tutorial?.active&&game.player.hp>0&&game.player.charge>=100&&!game.ultimateActive(game.player.hero);
}
export function castUltimate(game,{voicePresented=false}={}){
  const p=game.player,primDuet=canPrimDuet(game),duet=primDuet||canShizukuDuet(game),heroIds=primDuet?['tsukineko','prim']:['nyanluna','shizuku'],heroId=duet?(primDuet?'prim':'shizuku'):game.heroId(p.hero),spec=game.ultimateSpec(p.hero);
  if(!canCastUltimate(game))return false;
  p.charge=0;if(duet){for(const id of heroIds)game.ultimateCharges[id]=0;}p.invincible=Math.max(p.invincible,spec.immunity);
  const origin=game.sourceFor(heroId),target=game.nearest(origin.x,origin.z,spec.range??20),angle=target?Math.atan2(target.x-origin.x,target.z-origin.z):origin.face;
  const duration=spec.duration??spec.shots*spec.interval;
  const effect={id:game.ids++,kind:spec.kind,heroId,spec,duration,x:p.x,z:p.z,angle,damage:duet?heroIds.reduce((total,id)=>total+game.skillDamage(id,spec.baseDamage),0)*(primDuet?1:.7):game.skillDamage(heroId,spec.baseDamage),...(duet?{heroIds}:{}),due:spec.interval,remaining:duration,interval:spec.interval};
  game.emit('ultimate',{x:p.x,z:p.z,hero:p.hero,heroId,abilityId:spec.id,abilityName:spec.name,duet,duetKind:primDuet?'prim':duet?'shizuku':null,voicePresented});
  if(PULSE_KINDS.includes(spec.kind)){Object.assign(effect,{radius:spec.radius,pulsesLeft:spec.pulses});game.ultimateEffects.push(effect);if(duet){for(const id of heroIds)healHero(game,id,spec.heal??0);}else if(spec.heal)game.heal(spec.heal);pulse(game,effect);}
  else{effect.shotsLeft=spec.shots;game.ultimateEffects.push(effect);shoot(game,effect);}
  return true;
}
export function tickUltimates(game,dt){
  for(const effect of game.ultimateEffects){
    effect.remaining-=dt;effect.due-=dt;
    while(effect.due<=EPSILON&&(effect.pulsesLeft>0||effect.shotsLeft>0)){
      if(PULSE_KINDS.includes(effect.kind))pulse(game,effect);else shoot(game,effect);effect.due+=effect.interval;
    }
  }
  game.ultimateEffects=game.ultimateEffects.filter(effect=>effect.remaining>EPSILON&&(PULSE_KINDS.includes(effect.kind)||effect.shotsLeft>0));
}
export function enemySpeedScale(game,enemy){
  let scale=enemy.frostUntil>game.time?1-enemy.frostSlow*(enemy.type==='boss'?.5:1):1;
  for(const effect of game.ultimateEffects)if(effect.kind==='sanctuary'&&Math.hypot(enemy.x-effect.x,enemy.z-effect.z)<=effect.radius+enemy.radius){const spec=effect.spec;scale=Math.min(scale,enemy.type==='boss'?spec.bossSlow:spec.slow);}
  return scale;
}
