export const SHIZUKU_BOND=Object.freeze({hp:1.12,attack:1.12,charge:1.2,drain:.1});
export const hasShizukuBond=party=>party?.includes('nyanluna')&&party.includes('shizuku');
export const SHIZUKU_DUET=Object.freeze({id:'moon-drop-promise',name:'月雫・おかえりの約束',kind:'moonDrop',icon:'link',color:0xf6b4d8,radius:10,pulses:6,interval:.32,duration:1.92,baseDamage:65,heal:60,immunity:2.2,note:'にゃんるなと雫のゲージを両方100消費。二人の掛け声で6回の月光と鎌の連撃。二人のHPを60回復し、雫は鎌でHPを吸収。'});
export const DUET_VOICE=Object.freeze({id:'nyanluna-shizuku-duet',who:'shizuku',text:'にゃんるな「雫、一緒に！」 雫「背中、任せた。」 二人「月雫・おかえりの約束！」'});
export function canShizukuDuet(game){return hasShizukuBond(game.party)&&game.hasLivingPartner&&['nyanluna','shizuku'].every(id=>game.ultimateCharges[id]>=100&&!game.ultimateEffects.some(e=>e.heroId===id||e.heroIds?.includes(id)));}
export function healHero(game,heroId,amount,{drain=false}={}){
 const health=game.heroHealth[heroId];if(!health||health.hp<=0||!Number.isFinite(amount)||amount<=0)return 0;
 const healed=Math.min(amount,health.maxHp-health.hp);health.hp+=healed;
 if(healed>0)game.emit(drain?'lifeDrain':'heal',{heroId,hero:game.partyHeroes.find(i=>game.heroId(i)===heroId),amount:healed,...game.sourceFor(heroId)});
 return healed;
}
export function drainShizuku(game,damage){return healHero(game,'shizuku',damage*(SHIZUKU_BOND.drain+game.effectRank('shizukuDrain')*.025),{drain:true});}
