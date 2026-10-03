import {nyanQuestUnlocked} from './nyanluna-awakening.js';
import {FIELD_THEMES} from './field-themes.js';

export const RICE_UNLOCK_LEVEL=50;
export const RICE_QUEST_ID=23;
const stage=(name,theme,note,index)=>Object.freeze({name,theme,image:FIELD_THEMES[theme].image,note,waves:`WAVE 0${index*2+1}–0${index*2+2}`});
export const RICE_QUEST=Object.freeze({
  id:RICE_QUEST_ID,chapter:1,number:1,awakening:'rice',soloHero:'omsolo',recommendedLevel:RICE_UNLOCK_LEVEL,difficulty:'normal',
  title:'ライスの力 — 覚醒',summary:'楽な近道を求め、師匠ユーダに破門されたオムソロ。仲間の強さを目にした今、自分も守る力を身につけるため、一人で修行の道を歩き直す。',
  counts:Object.freeze([8,10,10,12,14,1]),boss:'岩鎧の修行像',bossId:'basalt',bossHp:6000,hpScale:2.4,damageScale:1.15,
  stages:Object.freeze([stage('ユーダの修行場',3,'置き去りにした一粒を見つめる',0),stage('静かな用水の庭',4,'近道を選ばず、呼吸を整える',1),stage('誓いの穂守り壇',6,'守るための力を、自分の手に',2)]),
});

export const riceQuestUnlocked=profile=>profile?.story?.omsoloUnlocked===true&&Number.isFinite(profile?.characters?.omsolo?.level)&&profile.characters.omsolo.level>=RICE_UNLOCK_LEVEL;
export const hasRicePower=profile=>profile?.awakenings?.rice===true&&riceQuestUnlocked(profile);
export const normalizeAwakenings=(raw,profile)=>({rice:raw?.rice===true&&riceQuestUnlocked(profile),nyanluna:raw?.nyanluna===true&&nyanQuestUnlocked(profile)});
export const RICE_HELP='オムソロ操作中に「ライス」ボタン（T）を押すと、5秒間、近づいた敵の遠距離攻撃を敵へ自動で跳ね返します。ボスの飛び道具も反射可能。効果終了後10秒で再使用。敵本体・近接攻撃・地面の攻撃予告は反射できません。ドラッグは移動専用です。';

const scene=(area,title,next,lines)=>Object.freeze({act:RICE_QUEST_ID,area,kicker:'OMSOLO · SOLO AWAKENING',title,next,lines:lines.map(([who,text])=>({who,text,voiced:false}))});
export const RICE_SCENES=Object.freeze({
  opening:scene(0,'置いてきた一粒。','一人で修行場へ',[
    ['narrator','仲間が強敵を退けるたび、オムソロは剣を握り直していた。その夜、荷袋の底から、一粒の米を包んだ古い布を取り出す。'],
    ['omsolo','ユーダ師匠の修行……まだ、覚えている。手を触れずに米を浮かせる。超能力みたいな「ライスの力」だった。'],
    ['narrator','昔、オムソロはユーダのもとで修行した。毎日、一粒の米を前に座り、呼吸をそろえる。米は少しも動かず、同じ修行が続いた。'],
    ['omsolo','退屈でさ。「もっと楽にできる方法はないんですか」って、聞いてしまったんだ。'],
    ['narrator','ユーダは米を布で包み、弟子の手に戻した。「修行を手放すなら、ここに置く名もない。破門だ。」オムソロはそのまま修行場を去った。'],
    ['omsolo','仲間は、怖くても自分の足で進んでいる。今度は俺も。ライスの力を身につけるまで、この修行から逃げない。'],
    ['narrator','剣と一粒の米だけを携え、オムソロは一人で、かつての修行場へ向かった。'],
  ]),
  ruins:scene(1,'近道のない庭。','用水の庭へ',[
    ['narrator','用水の音が続く庭で、オムソロは息を整えた。かつて、ここで何度も立ち上がり、修行をやめる理由を探した。'],
    ['omsolo','あのときは、米が動くところだけ欲しかった。動かせない自分と向き合うのが、嫌だったんだな。'],
    ['narrator','包みをほどく。米はまだ布の上にある。オムソロは剣を置き、一粒を見つめた。やがて、ほんの少しだけ米が揺れる。'],
    ['omsolo','……もう一度。派手な一回より、できるまで繰り返そう。仲間が手を伸ばしたとき、今度は俺も掴めるように。'],
  ]),
  sanctuary:scene(2,'守るための誓い。','最後の試練へ',[
    ['narrator','穂守り壇に、ユーダが残した岩鎧の修行像が立つ。腕が動き、道をふさぐ岩が降り始めた。オムソロは米の包みを懐へしまう。'],
    ['omsolo','師匠。楽をするためじゃない。誰かが危ないとき、剣の届かない場所にも手を伸ばしたい。'],
    ['omsolo','ライスの力を、必ず身につける。最後まで、一人でやり遂げる！'],
  ]),
  ending:scene(2,'一粒から、伸びる手。','覚醒の報酬を受け取る',[
    ['narrator','修行像を退け、最後の門をくぐる。崩れかけた岩が、オムソロの眼前で止まった。差し出した手の先に、淡い緑の光が結ばれている。'],
    ['omsolo','……止まった。力んだんじゃない。見て、呼吸して、そこへ手を伸ばしたんだ。'],
    ['narrator','懐の包みがほどけ、一粒の米が浮かぶ。何度も繰り返した呼吸が、今度は岩にも届いていた。'],
    ['omsolo','ユーダ師匠。やっと、最初の一粒です。ここからも修行は続けます。仲間を守れる俺になるために。'],
    ['narrator',`オムソロは「ライスの力」を習得した。${RICE_HELP} ひとりの修行を終え、仲間の待つ道へ戻っていく。`],
  ]),
});
