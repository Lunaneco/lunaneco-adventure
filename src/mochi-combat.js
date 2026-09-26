// One refreshable status per target: repeated cries never stack multipliers.
export const MOCHI_SUPPORT=Object.freeze({interval:4,range:13,speed:12,pierce:4,stop:1.8,duration:5,attackDown:.30,defenseDown:.30});
export function mochiCryHit(game,enemy,{ultimate=false}={}){
 if(enemy.hp<=0)return;
 if(enemy.type==='boss'){
  if(!(enemy.mochiWeakenUntil>game.time)){enemy.mochiAttackDown=0;enemy.mochiDefenseDown=0;}
  enemy.mochiWeakenUntil=game.time+MOCHI_SUPPORT.duration+(ultimate?2:0);
  enemy.mochiAttackDown=Math.max(enemy.mochiAttackDown??0,(ultimate?.4:MOCHI_SUPPORT.attackDown)+game.rank('mochiWeaken')*.05);
  enemy.mochiDefenseDown=Math.max(enemy.mochiDefenseDown??0,(ultimate?.4:MOCHI_SUPPORT.defenseDown)+game.rank('mochiWeaken')*.05);
 }else{
  enemy.mochiStopUntil=game.time+(ultimate?3:MOCHI_SUPPORT.stop)+game.effectRank('mochiLull')*.3+game.rank('mochiWeaken')*.2;
  enemy.cast=null;enemy.rush=null;enemy.salvo=null;enemy.demonFollowup=null;enemy.knockX=0;enemy.knockZ=0;
  game.hazards=game.hazards.filter(h=>h.sourceId!==enemy.id);
 }
 game.emit('mochiCryHit',{id:enemy.id,x:enemy.x,z:enemy.z,boss:enemy.type==='boss'});
}
export const mochiFrozen=(game,enemy)=>enemy.type!=='boss'&&enemy.mochiStopUntil>game.time;
export function mochiIncomingDamage(game,damage,sourceId){const e=game.enemies.find(e=>e.id===sourceId);return damage*(e?.mochiWeakenUntil>game.time?1-e.mochiAttackDown:1);}
export function mochiDefenseMultiplier(game,enemy){return enemy.mochiWeakenUntil>game.time?1/(1-enemy.mochiDefenseDown):1;}
