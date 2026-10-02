import {publicUrl} from './public-url.js';

export const ULTIMATE_ART=Object.freeze({
  hehehe:Object.freeze({file:'assets/ultimates/hehe-predation-dance-v1.png',accent:'#ff9dc9',label:'PREDATION DANCE',alt:'スキンヘッドと黒い眼鏡のへへへに変身したへへりある'}),
  hehereal:Object.freeze({file:'assets/ultimates/hehereal-sakura-promise-v1.png',accent:'#ff9dc9',label:'SAKURA PROMISE',alt:'桜の魔法弓を構えるへへりある'}),
  prim:Object.freeze({file:'assets/ultimates/prim-prism-breath-v1.webp',accent:'#bceaff',label:'PRISM BREATH',alt:'プリムが口から一直線に七色のブレスを吐く'}),
  primDuet:Object.freeze({file:'assets/ultimates/tsukineko-prim-duet-v1.webp',accent:'#ccefff',label:'PRISM & COMET · OUR WAY HOME',alt:'大きくなったプリムの背中につきねこが乗り、銃とブレスを合わせる'}),
  shizuku:Object.freeze({file:'assets/ultimates/shizuku-crimson-mercy-v2.webp',accent:'#e7a3c2',label:'CRIMSON MERCY',alt:'雫が黒銀の大鎌を振るい、紅い光を吸収する'}),
  shizukuDuet:Object.freeze({file:'assets/ultimates/nyanluna-shizuku-duet-v1.webp',accent:'#e6b9ff',label:'MOONLIGHT & DROPS · OUR PROMISE',alt:'雫とにゃんるなが並び、紅い鎌と月光の魔法を重ねる'}),
  mochinyafe:Object.freeze({file:'assets/story/mochinyafe.png',accent:'#ffb8d4',label:'A LITTLE VOICE, A GENTLE WORLD',alt:'ふぇ〜と声を届ける、もちにゃふぇ'}),
  nyanluna:Object.freeze({file:'assets/ultimates/nyanluna-sanctuary-v1.webp',accent:'#e0b5ff',label:'LUNAR SANCTUARY',alt:'にゃんるなが月の杖を突き出し、月華の結界と光の魔法陣を展開する'}),
  tsukineko:Object.freeze({file:'assets/ultimates/tsukineko-comet-v1.webp',accent:'#83eaff',label:'COMET BARRAGE',alt:'つきねこが星の銃を構え、銃口から青い彗星の連射を放つ'}),
  omsolo:Object.freeze({file:'assets/ultimates/omsolo-vow-v1.webp',accent:'#b1ffad',label:'EMERALD VOW',alt:'オムソロが緑の光剣を握り、円を描く翠光の斬撃を繰り出す'}),
});
export const ultimateArtUrl=heroId=>publicUrl(ULTIMATE_ART[heroId].file);
export function preloadUltimateArt(heroIds){
  for(const id of heroIds){if(!ULTIMATE_ART[id])continue;const image=new Image();image.src=ultimateArtUrl(id);image.decode().catch(()=>{});}
}
