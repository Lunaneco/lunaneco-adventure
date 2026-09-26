import {canShizukuDuet,SHIZUKU_DUET,healHero,drainShizuku} from './shizuku-combat.js';
import {mochiCryHit} from './mochi-combat.js';
const EPSILON=1e-8;

function pulse(game,effect){
  if(['bladeDance','scytheDance','moonDrop'].includes(effect.kind)){const source=game.sourceFor(effect.heroId);effect.x=source.x;effect.z=source.z;}
  game.emit(['bladeDance','scytheDance','moonDrop'].includes(effect.kind)?'saberPulse':'ultimatePulse',{x:effect.x,z:effect.z,radius:effect.radius,heroId:effect.heroId,heroIds:effect.heroIds,kind:effect.kind});
  for(const enemy of [...game.enemies])if(enemy.hp>0&&Math.hypot(enemy.x-effect.x,enemy.z-effect.z)<=effect.radius+enemy.radius){if(effect.kind==='mochiLullaby')mochiCryHit(game,enemy,{ultimate:true});const dealt=game.hit(enemy,effect.damage,effect.x,effect.z,true,false,effect.heroId,false);if(['scytheDance','moonDrop'].includes(effect.kind))drainShizuku(game,dealt);}
  effect.pulsesLeft--;
}
function shoot(game,effect){
  const spec=effect.spec,source=game.sourceFor(effect.heroId),target=game.nearest(source.x,source.z,spec.range);
  const angle=target?Math.atan2(target.x-source.x,target.z-source.z):source.face;source.face=angle;
  game.projectiles.push({id:game.ids++,owner:'player',kind:'gun',ultimate:true,heroId:effect.heroId,x:source.x,z:source.z,vx:Math.sin(angle)*spec.speed,vz:Math.cos(angle)*spec.speed,speed:spec.speed,life:(spec.range+2)/spec.speed,damage:effect.damage,crit:true,radius:.32,pierce:spec.pierce,hitIds:[]});
  game.emit('ultimateShot',{x:source.x,z:source.z,angle,heroId:effect.heroId});effect.shotsLeft--;
}
export function canCastUltimate(game){
  return game?.phase==='playing'&&!game.exitOpen&&!game.travelOpen&&!game.tutorial?.active&&game.player.hp>0&&game.player.charge>=100&&!game.ultimateActive(game.player.hero);
}
export function castUltimate(game,{voicePresented=false}={}){
  const p=game.player,duet=canShizukuDuet(game),heroId=duet?'shizuku':game.heroId(p.hero),spec=game.ultimateSpec(p.hero);
  if(!canCastUltimate(game))return false;
  p.charge=0;if(duet){game.ultimateCharges.nyanluna=0;game.ultimateCharges.shizuku=0;}p.invincible=Math.max(p.invincible,spec.immunity);
  const duration=spec.duration??spec.shots*spec.interval;
  const effect={id:game.ids++,kind:spec.kind,heroId,spec,duration,x:p.x,z:p.z,damage:duet?(game.skillDamage('nyanluna',spec.baseDamage)+game.skillDamage('shizuku',spec.baseDamage))*.7:game.skillDamage(heroId,spec.baseDamage),...(duet?{heroIds:['nyanluna','shizuku']}:{}),due:spec.interval,remaining:duration,interval:spec.interval};
  game.emit('ultimate',{x:p.x,z:p.z,hero:p.hero,heroId,abilityId:spec.id,abilityName:spec.name,duet,voicePresented});
  if(['sanctuary','bladeDance','mochiLullaby','scytheDance','moonDrop'].includes(spec.kind)){Object.assign(effect,{radius:spec.radius,pulsesLeft:spec.pulses});game.ultimateEffects.push(effect);if(duet){healHero(game,'nyanluna',spec.heal);healHero(game,'shizuku',spec.heal);}else game.heal(spec.heal);pulse(game,effect);}
  else{effect.shotsLeft=spec.shots;game.ultimateEffects.push(effect);shoot(game,effect);}
  return true;
}
export function tickUltimates(game,dt){
  for(const effect of game.ultimateEffects){
    effect.remaining-=dt;effect.due-=dt;
    while(effect.due<=EPSILON&&(effect.pulsesLeft>0||effect.shotsLeft>0)){
      if(['sanctuary','bladeDance','mochiLullaby','scytheDance','moonDrop'].includes(effect.kind))pulse(game,effect);else shoot(game,effect);effect.due+=effect.interval;
    }
  }
  game.ultimateEffects=game.ultimateEffects.filter(effect=>effect.remaining>EPSILON&&(['sanctuary','bladeDance','mochiLullaby','scytheDance','moonDrop'].includes(effect.kind)||effect.shotsLeft>0));
}
export function enemySpeedScale(game,enemy){
  let scale=enemy.frostUntil>game.time?1-enemy.frostSlow*(enemy.type==='boss'?.5:1):1;
  for(const effect of game.ultimateEffects)if(effect.kind==='sanctuary'&&Math.hypot(enemy.x-effect.x,enemy.z-effect.z)<=effect.radius+enemy.radius){const spec=effect.spec;scale=Math.min(scale,enemy.type==='boss'?spec.bossSlow:spec.slow);}
  return scale;
}
