import {FIELD_THEMES} from './field-themes.js';

export const NYAN_UNLOCK_LEVEL=50;
export const NYAN_QUEST_ID=32;
export const NYAN_AWAKENING_RULES=Object.freeze({duration:20,cooldown:60,attackPower:1.5,ultimatePower:2});
const stage=(name,theme,note,index)=>Object.freeze({name,theme,image:FIELD_THEMES[theme].image,note,waves:`WAVE 0${index*2+1}–0${index*2+2}`});
export const NYAN_QUEST=Object.freeze({
  id:NYAN_QUEST_ID,chapter:0,number:1,awakening:'nyanluna',soloHero:'nyanluna',recommendedLevel:NYAN_UNLOCK_LEVEL,difficulty:'normal',
  title:'月光を結ぶ — にゃんるな覚醒修行',summary:'仲間を守る魔法を、もう一歩先へ。にゃんるなは一人で月の修行場へ向かい、まっすぐ進む光と二つの導く光を同時に結ぶ覚醒修行に挑む。',
  counts:Object.freeze([8,10,12,14,16,1]),boss:'月影の試練像',bossId:'eclipse',bossHp:6000,hpScale:3,damageScale:1.8,
  stages:Object.freeze([stage('月映しの修行庭',0,'誰かと比べず、自分の光を見つめる',0),stage('双星の月光回廊',1,'まっすぐな光と二つの星を結ぶ',1),stage('覚醒の月華壇',2,'守りたい気持ちを、ひとつの魔法へ',2)]),
});
export const nyanQuestUnlocked=profile=>Number.isFinite(profile?.characters?.nyanluna?.level)&&profile.characters.nyanluna.level>=NYAN_UNLOCK_LEVEL;
export const hasNyanAwakening=profile=>profile?.awakenings?.nyanluna===true&&nyanQuestUnlocked(profile);
export const NYAN_AWAKENING_HELP=`にゃんるな操作中に「覚醒」（G）で${NYAN_AWAKENING_RULES.duration}秒間変身。覚醒中は基本攻撃力${NYAN_AWAKENING_RULES.attackPower}倍、通常攻撃が貫通弾1発＋追尾弾2発に変わり、必殺技は覚醒版・固有威力${NYAN_AWAKENING_RULES.ultimatePower}倍（攻撃力補正込みで通常時の${NYAN_AWAKENING_RULES.attackPower*NYAN_AWAKENING_RULES.ultimatePower}倍）。解除後${NYAN_AWAKENING_RULES.cooldown}秒で再使用。交代しても残り時間は進み、戦闘終了で元に戻ります。`;
export const createNyanAwakening=()=>({active:false,remaining:0,cooldown:0});
export function canAwakenNyan(game){
  return game?.phase==='playing'&&!game.exitOpen&&!game.travelOpen&&!game.tutorial?.active&&game.player.hero===0&&game.player.hp>0&&hasNyanAwakening(game.progression)&&!game.nyanAwakening.active&&game.nyanAwakening.cooldown<=1e-8&&!game.ultimateActive(0);
}
export function startNyanAwakening(game){
  if(!canAwakenNyan(game))return false;
  Object.assign(game.nyanAwakening,{active:true,remaining:NYAN_AWAKENING_RULES.duration,cooldown:0});
  game.emit('nyanAwakeningStarted');return true;
}
export function finishNyanAwakening(game,{reset=false}={}){
  const state=game.nyanAwakening,wasActive=state.active;
  Object.assign(state,{active:false,remaining:0,cooldown:reset?0:wasActive?NYAN_AWAKENING_RULES.cooldown:state.cooldown});
  if(wasActive)game.emit('nyanAwakeningEnded');return wasActive;
}
export function tickNyanAwakening(game,dt){
  if(game.exitOpen||game.travelOpen||game.tutorial?.active)return;
  const state=game.nyanAwakening;
  if(state.active){
    if(!game.isHeroAlive(0)){finishNyanAwakening(game);return;}
    state.remaining=Math.max(0,state.remaining-dt);
    if(state.remaining<=1e-8)finishNyanAwakening(game);
  }else state.cooldown=Math.max(0,state.cooldown-dt);
}
export function awakenedNyanUltimate(normal){
  return {...normal,id:'moon-awakening-sanctuary',name:'月華覚醒・双星の聖域',awakened:true,color:0xe7c9ff,baseDamage:normal.baseDamage*NYAN_AWAKENING_RULES.ultimatePower,radius:normal.radius+2,
    note:`覚醒の月華結界を展開。必殺技の固有威力は通常版の${NYAN_AWAKENING_RULES.ultimatePower}倍（覚醒中の攻撃力${NYAN_AWAKENING_RULES.attackPower}倍補正込みで通常時の${NYAN_AWAKENING_RULES.attackPower*NYAN_AWAKENING_RULES.ultimatePower}倍）。月光が脈動し、広い範囲の敵を攻撃・減速。育成した必殺技の効果も引き継ぐ。`};
}
export function fireAwakenedNyan(game,source,{enemy,angle,damage,crit,range}){
  const base={owner:'player',heroId:'nyanluna',x:source.x,z:source.z,damage,crit,awakened:true};
  const speed=28;
  game.projectiles.push({...base,id:game.ids++,kind:'moonPierce',vx:Math.sin(angle)*speed,vz:Math.cos(angle)*speed,speed,life:(range+2)/speed,radius:.25,pierce:Infinity,hitIds:[],color:0xf2deff});
  const targets=game.enemies.filter(e=>e.hp>0&&!e.riceHeld&&Math.hypot(e.x-source.x,e.z-source.z)-e.radius<=range).sort((a,b)=>Math.hypot(a.x-source.x,a.z-source.z)-Math.hypot(b.x-source.x,b.z-source.z));
  for(let i=0;i<2;i++){
    const offset=angle+(i===0?-.3:.3),guidedSpeed=17;
    game.projectiles.push({...base,id:game.ids++,kind:'magic',vx:Math.sin(offset)*guidedSpeed,vz:Math.cos(offset)*guidedSpeed,speed:guidedSpeed,life:(range+3)/guidedSpeed,radius:.28,target:(targets[i]??enemy).id,color:i===0?0xcfb2ff:0xf8d9ff});
  }
  return true;
}

const scene=(area,title,next,lines)=>Object.freeze({act:NYAN_QUEST_ID,area,kicker:'NYANLUNA · SOLO AWAKENING',title,next,lines:lines.map(([who,text,portrait])=>({who,text,voiced:false,...(portrait?{portrait}:{})}))});
export const NYAN_AWAKENING_SCENES=Object.freeze({
  opening:scene(0,'わたしの光で。','一人で修行庭へ',[
    ['narrator','仲間と冒険を重ね、にゃんるなの魔法は強くなった。それでも、目の前の一人へ杖を向けたとき、別の場所で誰かが危なくなる。その一瞬が、心に残っていた。'],
    ['nyanluna','つきねこも、みんなも、それぞれの力で道を開いている。わたしも、届かなかった場所まで月の光を届けたい。'],
    ['narrator','古い月の記録には、複数の光を同時に結ぶ修行が記されていた。にゃんるなは仲間に行き先を告げ、一人で月映しの修行庭へ向かった。'],
    ['nyanluna','強さを借りるんじゃなくて、わたしの光で守れるようになろう。まずは、あわてずに一つずつ。'],
  ]),
  ruins:scene(1,'まっすぐな光、導く二つの星。','月光回廊へ',[
    ['narrator','回廊の水鏡には、三つの月が映る。一つを追うと、ほかの二つが消える。杖を握る手に力が入り、光は何度もほどけた。'],
    ['nyanluna','全部を同じように動かそうとしていたんだ。まっすぐ道を開く光と、相手を見失わない光。それぞれに、役目がある。'],
    ['narrator','にゃんるなは呼吸を整える。杖の先から一筋の光が伸び、その両側に二つの小さな星が灯った。流れを変えても、星はもう消えない。'],
    ['nyanluna','一つで道を開いて、二つで支える。うん。わたしらしい魔法、見えてきたよ。'],
  ]),
  sanctuary:scene(2,'月影に向かう誓い。','最後の覚醒試練へ',[
    ['narrator','月華壇に、修行を見守る月影の試練像が立つ。強い月光が道を閉ざした。ここで光を結び続けられるか。最後の試練は、にゃんるな自身の手に委ねられる。'],
    ['nyanluna','怖くないわけじゃない。でも、誰かを守りたい気持ちは、もっと強い。'],
    ['nyanluna','わたしの月の光。まっすぐ進んで、二つの星と一緒に、最後まで届いて！'],
  ]),
  ending:scene(2,'月光を結ぶ、覚醒。','覚醒を習得する',[
    ['narrator','試練像を退け、最後の門をくぐる。三つの光が結ばれ、にゃんるなの姿をやさしく包んだ。長い薄紫の髪、猫耳、白と黒のメイド姿。新たな月の杖が、手の中に現れる。'],
    ['nyanluna','これが、覚醒の力……。あたたかい。わたしの気持ちと、ちゃんとつながっている。','nyanlunaAwakened'],
    ['narrator','大きな力を維持できる時間は限られている。光が静まると、姿は元に戻った。それでも、もう一度結ぶための感覚は、手と心に残っていた。'],
    ['nyanluna','必要なときに、きちんと使おう。みんなを守る、新しいわたしの魔法。帰ったら、最初につきねこに見せたいな。'],
    ['narrator',`にゃんるなは覚醒を習得した。${NYAN_AWAKENING_HELP}`],
  ]),
});
