export const PRIM_BOND=Object.freeze({hp:1.12,attack:1.12,charge:1.2});
export const PRIM_MOUNT=Object.freeze({duration:12,cooldown:20,speed:11.2,dashSpeed:48,scale:1.85});
export const hasPrimBond=party=>party?.includes('tsukineko')&&party.includes('prim');
export const PRIM_DUET=Object.freeze({id:'prism-comet',name:'星虹・ふたりの帰り道',kind:'prismBeam',icon:'link',color:0xaeefff,range:26,width:3.2,pulses:6,interval:.25,duration:1.5,baseDamage:65,immunity:1.8,note:'二人のゲージを100ずつ使い、星銃と虹のブレスを一直線に重ねる。二人それぞれの攻撃力で6回貫通攻撃。'});
export const PRIM_DUET_VOICE=Object.freeze({id:'tsukineko-prim-duet',who:'tsukineko',text:'つきねこ「プリム、一緒に道をひらこう！」 プリム「キュ〜！」'});
export const canPrimDuet=g=>hasPrimBond(g.party)&&g.hasLivingPartner&&['tsukineko','prim'].every(id=>g.ultimateCharges[id]>=100&&!g.ultimateEffects.some(e=>e.heroId===id||e.heroIds?.includes(id)));
export function canMount(g){return g.phase==='playing'&&hasPrimBond(g.party)&&g.hasLivingPartner&&!g.exitOpen&&!g.travelOpen&&!g.mount.active&&g.mount.cooldown<=0;}
export function startMount(g){if(!canMount(g))return false;if(g.heroId(g.player.hero)!=='tsukineko')g.activateHero(g.partyHeroes.find(i=>g.heroId(i)==='tsukineko'));Object.assign(g.mount,{active:true,remaining:PRIM_MOUNT.duration});Object.assign(g.partner,{x:g.player.x,z:g.player.z,face:g.player.face,attack:0});g.emit('mountStart');return true;}
export function endMount(g){if(!g.mount.active)return false;Object.assign(g.mount,{active:false,remaining:0,cooldown:PRIM_MOUNT.cooldown});g.emit('mountEnd');return true;}
export function tickMount(g,dt){if(g.mount.active){g.mount.remaining=Math.max(0,g.mount.remaining-dt);if(!g.hasLivingPartner||g.mount.remaining<=0)endMount(g);}else g.mount.cooldown=Math.max(0,g.mount.cooldown-dt);}
export function beamContains(effect,enemy){const dx=enemy.x-effect.x,dz=enemy.z-effect.z,along=dx*Math.sin(effect.angle)+dz*Math.cos(effect.angle),across=dx*Math.cos(effect.angle)-dz*Math.sin(effect.angle);return along>=-enemy.radius&&along<=effect.spec.range+enemy.radius&&Math.abs(across)<=effect.spec.width/2+enemy.radius;}
