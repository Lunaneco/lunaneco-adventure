import {ultimateFor} from './abilities.js';
export const hasNekoLumi=party=>Array.isArray(party)&&party.includes('lumi')&&party.includes('mochinyafe');
export function lumiUltimate(character,neko=false){
 const spec=ultimateFor('lumi',character);
 return neko?{...spec,id:'nekolumi-infinite-rail',name:'ねこるみ・どこまでもいっしょ',range:Infinity,neko:true,note:`指先から射程無限のレールガンを${spec.shots}連射。直線上の敵を貫く。もちにゃふぇと編成中のみ。`}:spec;
}
// Hitscan reach is not limited by projectile TTL, terrain size, or the camera.
// VFX endpoints remain finite even when the mechanical range is Infinity.
export function fireLumiRail(game,source,{range,damage,color=0x8feaff,crit=false,ultimate=false,pierce=3,width=.45}={}){
 const target=game.nearest(source.x,source.z,range);if(!target)return false;
 const dx=target.x-source.x,dz=target.z-source.z,d=Math.hypot(dx,dz),ux=d>1e-8?dx/d:Math.sin(source.face),uz=d>1e-8?dz/d:Math.cos(source.face);
 source.face=Math.atan2(ux,uz);
 const hits=game.enemies.filter(e=>e.hp>0&&!e.riceHeld).map(e=>({e,along:(e.x-source.x)*ux+(e.z-source.z)*uz,across:Math.abs((e.x-source.x)*uz-(e.z-source.z)*ux)})).filter(({e,along,across})=>along>=-e.radius&&along-e.radius<=range&&across<=e.radius+width).sort((a,b)=>a.along-b.along).slice(0,pierce);
 const reach=Number.isFinite(range)?range:Math.max(d,...hits.map(h=>h.along),1)+2;
 for(const {e} of hits)game.hit(e,damage,source.x,source.z,crit,false,'lumi',!ultimate);
 game.emit('lumiRail',{x:source.x,z:source.z,angle:source.face,range:reach,color,ultimate,heroId:'lumi',neko:hasNekoLumi(game.party)});
 return true;
}
