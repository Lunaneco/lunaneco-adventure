import {ultimateFor} from './abilities.js';
import {NEKO_LUMI_ATTACK} from './lumi-attack-motion.js';
export const hasNekoLumi=party=>Array.isArray(party)&&party.includes('lumi')&&party.includes('mochinyafe');
export function lumiUltimate(character,neko=false){
 const spec=ultimateFor('lumi',character);
 return neko?{...spec,id:'nekolumi-infinite-rail',name:'ねこるみ・どこまでもいっしょ',range:Infinity,neko:true,note:`指先から射程無限のレールガンを${spec.shots}連射。直線上の敵を貫く。もちにゃふぇと編成中のみ。`}:spec;
}
// Hitscan reach is not limited by projectile TTL, terrain size, or the camera.
// VFX endpoints remain finite even when the mechanical range is Infinity.
export function fireLumiRail(game,source,{range,damage,color=0x8feaff,crit=false,ultimate=false,pierce=3,width=.45,angle,nekoBurst=false,pulse=0,chargeScale=1}={}){
 const target=game.nearest(source.x,source.z,range);if(!target&&!Number.isFinite(angle))return false;
 const dx=target?target.x-source.x:0,dz=target?target.z-source.z:0,d=Math.hypot(dx,dz);
 const ux=Number.isFinite(angle)?Math.sin(angle):d>1e-8?dx/d:Math.sin(source.face),uz=Number.isFinite(angle)?Math.cos(angle):d>1e-8?dz/d:Math.cos(source.face);
 source.face=Math.atan2(ux,uz);
 const hits=game.enemies.filter(e=>e.hp>0&&!e.riceHeld).map(e=>({e,along:(e.x-source.x)*ux+(e.z-source.z)*uz,across:Math.abs((e.x-source.x)*uz-(e.z-source.z)*ux)})).filter(({e,along,across})=>along>=-e.radius&&along-e.radius<=range&&across<=e.radius+width).sort((a,b)=>a.along-b.along).slice(0,pierce);
 const reach=Number.isFinite(range)?range:Math.max(d,...hits.map(h=>h.along),1)+2;
 for(const {e} of hits)game.hit(e,damage,source.x,source.z,crit,false,'lumi',!ultimate,chargeScale);
 game.emit('lumiRail',{x:source.x,z:source.z,angle:source.face,range:reach,color,ultimate,heroId:'lumi',neko:hasNekoLumi(game.party),nekoBurst,pulse});
 return true;
}

// A normal attack is one three-hit burst, not three separate auto-attacks.
// Split its original damage/charge budget and retain the weapon's piercing count.
export function fireNekoLumiAttack(game,source,options){
 const burst={...options,angle:source.face,width:NEKO_LUMI_ATTACK.width,nekoBurst:true};
 if(!fireLumiRail(game,source,{...burst,damage:options.damage*NEKO_LUMI_ATTACK.weights[0],chargeScale:NEKO_LUMI_ATTACK.weights[0]}))return false;
 game.lumiBursts.push({...burst,pulse:1,due:NEKO_LUMI_ATTACK.interval});return true;
}
export function tickLumiAttacks(game,dt){
 if(game.phase!=='playing')return;
 if(game.exitOpen||game.travelOpen||!game.isHeroAlive(7)||!hasNekoLumi(game.party)){game.lumiBursts=[];return;}
 for(const burst of game.lumiBursts){
  burst.due-=dt;
  while(burst.due<=1e-8&&burst.pulse<NEKO_LUMI_ATTACK.weights.length){
   const weight=NEKO_LUMI_ATTACK.weights[burst.pulse];
   fireLumiRail(game,game.sourceFor('lumi'),{...burst,damage:burst.damage*weight,chargeScale:weight});
   burst.pulse++;burst.due+=NEKO_LUMI_ATTACK.interval;
  }
 }
 game.lumiBursts=game.lumiBursts.filter(b=>b.pulse<NEKO_LUMI_ATTACK.weights.length);
}
