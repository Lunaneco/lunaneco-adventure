import {FIELD_THEMES} from './field-themes.js';
import {SIXTH_CHAPTER_ACTS} from './chapter-six.js';
import {RICE_QUEST,riceQuestUnlocked,hasRicePower} from './rice-awakening.js';
import {EXTRA_ACTS,EXTRA_FIRST_TICKETS,EXTRA_REPEAT_TICKETS} from './extra-stages.js';
export {EXTRA_ACTS} from './extra-stages.js';
const stage=(name,theme,note,index)=>({name,theme,image:FIELD_THEMES[theme].image,note,waves:`WAVE 0${index*2+1}–0${index*2+2}`});
const acts=[
  {id:0,title:'はぐれた月の道',summary:'一緒に迷い込んだはずの親友を探し、最初の月の門を開く。',counts:[10,14,18,22,26,1],boss:'封印の番人',bossId:'treant',bossHp:1500,stages:[stage('星詠みの草原',0,'ほどけた光を道しるべに',0),stage('月影の遺跡',1,'離れた手と、残された記憶',1),stage('暁の聖域',2,'封印の向こうに続く道',2)]},
  {id:1,title:'時計塔の道しるべ',summary:'止まった時計が映す、二人で迷い込んだ夜。塔の封印を解いて先へ。',counts:[14,18,20,22,24,1],boss:'時守の残響',bossId:'chronarch',bossHp:1650,stages:[stage('忘却の回廊',1,'記憶を映す水鏡',0),stage('星時計の庭',0,'止まった針へ光を集める',1),stage('時計塔の頂',1,'五つの刻印をかわす戦い',2)]},
  {id:2,title:'雲海を渡る約束',summary:'雲海に消えた足跡。離れていても同じ空を見上げていると信じて。',counts:[16,20,24,24,28,1],boss:'雲海の番人',bossId:'tempest',bossHp:1850,stages:[stage('風待ちの丘',0,'失われた橋の光をともす',0),stage('雲影の浮島',1,'雲の底に眠る道',1),stage('星渡りの橋',0,'広がる星弾をくぐり抜ける',2)]},
  {id:3,title:'暁の再会',summary:'同じ出口を目指していた二人。聖域の奥で響く銃声が、思いがけない再会を導く。',counts:[18,22,24,28,30,1],boss:'月蝕の守護者',bossId:'eclipse',bossHp:2300,stages:[stage('月落ちの参道',1,'最後の聖域へ',0),stage('暁を待つ庭',2,'閉ざされた月の真実',1),stage('月還りの聖域',2,'親友と、ふたたび隣り合う',2)]},
  {id:4,title:'小さな泣き声',summary:'おむすびたちの故郷、穂むすびの国。棚田の里で出会ったこむすびの涙が、救出の旅へ導く。',counts:[20,24,26,28,30,1],boss:'茨牙の獣王',bossId:'thornmaw',bossHp:4200,stages:[stage('稲穂の里道',3,'穂むすびの国に響く泣き声',0),stage('こむすびの木橋',3,'棚田をつなぐ二階の橋へ',1),stage('里はずれの竹林',3,'里を荒らす獣王を退ける',2)]},
  {id:5,title:'消えない緑の光',summary:'岩壁に残る光刃の跡。オムソロが守った道を抜け、谷の奥へ急ぐ。',counts:[22,24,28,30,32,1],boss:'岩鎧の大蛇',bossId:'basalt',bossHp:4550,stages:[stage('翡翠の用水峡',4,'里へ水を運ぶ峡谷',0),stage('水車の大水門',4,'上層の用水路から迂回する',1),stage('蛇骨の渡し',4,'棚田の水をせき止める大蛇',2)]},
  {id:6,title:'穂守り砦への抜け道',summary:'のり屋根の城下町を抜け、穂守り砦へ。国を守るはずの鐘を取り戻し、救出への道をひらく。',counts:[24,28,28,32,34,1],boss:'鉄鐘の門衛',bossId:'ironbell',bossHp:4900,stages:[stage('のり屋根の市庭',5,'静まり返ったお米の市場',0),stage('城下の分かれ路',5,'水路の中庭か、封鎖された米蔵か',1),stage('穂鐘の見張り台',5,'里の鐘を取り戻す',2)]},
  {id:7,title:'間に合った光',summary:'瀕死のオムソロに巨腕が迫る。間一髪で駆けつけたルナネコが、最後の救出戦に挑む。',counts:[26,28,32,34,36,1],boss:'蹂躙の巨神・ヴォルガント',bossId:'colossus',bossHp:5400,stages:[stage('砕けた穂守り砦',6,'国の米蔵を守る最後の砦',0),stage('命灯りの石段',6,'穂守りの紋章に残る緑の光',1),stage('穂守りの大広場',6,'故郷を守ったオムソロを救出',2)]},
  {id:8,title:'返事のないもちの里',summary:'もちにゃふぇの国を襲った、正体不明の魔物たち。空っぽの家々の奥から、たった一つの「ふぇ〜」が聞こえる。',counts:[24,28,30,32,34,1],boss:'ダークもちにゃふぇ・影爪',bossId:'darkmochi',bossHp:6400,stages:[stage('さくらもちの里',7,'返事の消えた、まあるい家々',0),stage('こぼれ茶の小径',7,'最後の一匹が残した足跡',1),stage('影爪の茶屋',7,'ダークもちにゃふぇの追手',2)]},
  {id:9,title:'ふるえる小さな声',summary:'壊れたティーカップの陰で、最後のもちにゃふぇを見つけた。言葉にならない声と仕草を受け止め、国を覆う影の源へ。',counts:[26,28,32,34,36,1],boss:'ダークもちにゃふぇ・夢喰',bossId:'dreammochi',bossHp:7000,stages:[stage('ミルクティーの渓谷',8,'ふるえる声が頼ったぬくもり',0),stage('ゆめ砂糖の架け橋',8,'小さな手が指す、影の城',1),stage('夢喰の寝床',8,'眠りを奪う黒いもちの影',2)]},
  {id:10,title:'最後の一匹を守って',summary:'仲間を守ろうと叫んだもちにゃふぇが、ダークもちにゃふぇたちにさらわれた。壊れた鈴の道を追い、必ず連れ戻す。',counts:[28,30,34,36,38,1],boss:'ダークもちにゃふぇ・黒鈴',bossId:'bellmochi',bossHp:7700,stages:[stage('しずかな夢見の街',9,'置き去りのクッションと黒い霧',0),stage('黒鈴の分かれ道',9,'小さな鈴の音を追って',1),stage('こだまの鐘楼',9,'最後の一匹へ続く封印',2)]},
  {id:11,title:'ひとりぼっちにしない',summary:'空になった国の、最後の命。闇の王が閉じた結界を破り、もちにゃふぇを光の中へ迎えに行く。',counts:[30,32,36,38,40,1],boss:'ダークもちにゃふぇ・闇の王',bossId:'kingmochi',bossHp:8600,stages:[stage('うす桃の王宮跡',10,'守れなかった故郷の先へ',0),stage('最後の灯りの階段',10,'小さな声は、まだ聞こえる',1),stage('ふぇ〜の約束の広場',10,'ダークもちにゃふぇの王から救出',2)]},
  {id:12,title:'眠らない悪魔の街',summary:'再会した雫は、暴走する悪魔たちから街を一人で守っていた。親友と力を合わせ、住民を正気に戻そう。',counts:[28,30,32,34,36,1],boss:'紅角の門番',bossId:'demonWarden',bossHp:11500,stages:[stage('紅灯りの街道',11,'暴走を止めて、帰る場所を守る',0),stage('黒鐘楼の避難路',11,'暴走を止めて、帰る場所を守る',1),stage('真紅の城門',11,'暴走を止めて、帰る場所を守る',2)]},
  {id:13,title:'紅霧をたどる水路',summary:'優しかった悪魔たちを取り戻すため、王城から流れる暴走の霧を追う。追尾する火球を見極めて進もう。',counts:[30,32,34,36,38,1],boss:'眠れぬ夢魔',bossId:'demonSiren',bossHp:12500,stages:[stage('紅霧の水路',12,'暴走を止めて、帰る場所を守る',0),stage('影火の上層回廊',12,'暴走を止めて、帰る場所を守る',1),stage('夢魔の眠り庭',12,'暴走を止めて、帰る場所を守る',2)]},
  {id:14,title:'黒薔薇の約束',summary:'国を守るため暴走を引き受けた悪魔大王。大の仲良しの雫とにゃんるなが交わす合図が、閉じた城門への道をひらく。',counts:[32,34,36,38,40,1],boss:'黒翼の騎士長',bossId:'demonKnight',bossHp:14000,stages:[stage('黒薔薇の城下',13,'暴走を止めて、帰る場所を守る',0),stage('騎士団の分かれ路',13,'暴走を止めて、帰る場所を守る',1),stage('黒翼の見張り台',13,'暴走を止めて、帰る場所を守る',2)]},
  {id:15,title:'おかえり、悪魔大王',summary:'暴走しただけで、本当は心優しい悪魔大王。雫とともに紅霧を払い、穏やかな国を取り戻そう。',counts:[34,36,38,40,42,1],boss:'悪魔大王',bossId:'demonKing',bossHp:17000,stages:[stage('静寂の王城',14,'暴走を止めて、帰る場所を守る',0),stage('王を守る大階段',14,'暴走を止めて、帰る場所を守る',1),stage('おかえりの王座',14,'暴走を止めて、帰る場所を守る',2)]},
{id:16,title:"ひとり、虹の向こうへ",summary:"結晶の門をくぐったつきねこが、青い異世界で小さな鳴き声に出会う。",counts:[28, 30, 32, 34, 36, 1],boss:"プリズムドラゴン・青晶",bossId:"prismShard",bossHp:11500,stages:[stage("青晶の入り江",15,'苦しむプリズムドラゴンを追う',0),stage("星映しの結晶段",15,'苦しむプリズムドラゴンを追う',1),stage("虹欠片の広場",15,'苦しむプリズムドラゴンを追う',2)]},
{id:17,title:"キュ〜の道しるべ",summary:"苦しそうな鳴き声を追い、暴走するドラゴンの光を少しずつほどく。",counts:[30, 32, 34, 36, 38, 1],boss:"プリズムドラゴン・虹光",bossId:"prismMirror",bossHp:12500,stages:[stage("オーロラの峡谷",16,'苦しむプリズムドラゴンを追う',0),stage("響きの上層路",16,'苦しむプリズムドラゴンを追う',1),stage("氷鏡の湖畔",16,'苦しむプリズムドラゴンを追う',2)]},
{id:18,title:"割れた空をつないで",summary:"七色に輝き始めた竜の翼。攻撃の合間に届く鳴き声が、つきねこの道しるべになる。",counts:[32, 34, 36, 38, 40, 1],boss:"プリズムドラゴン・暴走",bossId:"prismWing",bossHp:14000,stages:[stage("七彩の分かれ道",17,'苦しむプリズムドラゴンを追う',0),stage("星屑の架け橋",17,'苦しむプリズムドラゴンを追う',1),stage("空割れの尖塔",17,'苦しむプリズムドラゴンを追う',2)]},
{id:19,title:"同じ光を見ていた",summary:"苦しむプリズムドラゴンを浄化し、小さくなったプリムを仲間に迎える。",counts:[34, 36, 38, 40, 42, 1],boss:"プリズムドラゴン・光の解放",bossId:"prismHeart",bossHp:17000,stages:[stage("虹還りの道",18,'苦しむプリズムドラゴンを追う',0),stage("光をつなぐ階段",18,'苦しむプリズムドラゴンを追う',1),stage("プリズムの心臓",18,'苦しむプリズムドラゴンを追う',2)]},
];
export const CHAPTERS=Object.freeze([
 {id:0,title:'迷子の月と、ふたりの約束',summary:'大の仲良しの二人が、一緒に迷い込んだ月の世界。はぐれた親友を探す、全4幕の物語。',start:0,end:3},
 {id:1,title:'小さな願いと、消えない光',summary:'おむすびたちが暮らす穂むすびの国。黄金の棚田から城下町、襲撃された砦へ。こむすびの願いを胸に、故郷を守ったオムソロを救いに行く。',start:4,end:7},
 {id:2,title:'もちにゃふぇの国と、最後のふぇ〜',summary:'謎の敵に襲われ、もちにゃふぇは最後の一匹になってしまった。言葉は「ふぇ〜」だけ。それでも届いた助けを求める声を、今度は仲間たちが守り抜く。',start:8,end:11},
 {id:3,title:'悪魔の国',summary:'優しい悪魔たちが突然暴走した国。必死に街を守る雫と再会し、悪魔大王を正気に戻す、全4幕の物語。適正Lv.60。★3素材とLv.80への育成が開く。',start:12,end:15},
 {id:4,title:'プリズムの国',summary:'青い結晶とオーロラの異世界。つきねことプリムだけの全4幕。適正Lv.60・第4章と同等の難易度。各幕の初回はつきねこ単独。',start:16,end:19},
 {id:5,title:'へへへランド',summary:'オムソロのソロクエスト・全4幕。空腹のへへりあるに自分の顔のおむすびを分け、魔法の弓と共闘。推奨Lv.60。各幕20%で黄金のへへへが出現。',start:24,end:27},
]);
export const ACTS=Object.freeze([...acts.map(a=>Object.freeze({...a,recommendedLevel:a.id>=12?60:a.id>=8?40:a.id>=4?30:null,chapter:Math.floor(a.id/4),number:a.id%4+1,recruit:a.id===19?'prim':a.id===3?'tsukineko':a.id===7?'omsolo':a.id===11?'mochinyafe':a.id===15?'shizuku':null})),...SIXTH_CHAPTER_ACTS]);
export const PLAYABLE_ACTS=Object.freeze([...ACTS.slice(0,20),...EXTRA_ACTS,RICE_QUEST,...ACTS.slice(20)]);
const ACT_BY_ID=new Map(PLAYABLE_ACTS.map(act=>[act.id,act]));
export const actFor=act=>ACT_BY_ID.get(act);
export const chapterForAct=act=>CHAPTERS[actFor(act)?.chapter??0];
export const actLabel=act=>actFor(act)?.awakening?'オムソロ・ソロ覚醒':`第${chapterForAct(act).id+1}章・${actFor(act)?.extra?'エクストラ':`第${actFor(act)?.number??1}幕`}`;
export const isActCleared=(profile,act)=>actFor(act)?.awakening?hasRicePower(profile):actFor(act)?.extra?profile?.story?.extraClears?.[actFor(act).chapter]===true:profile?.story?.actClears?.[act]===true;
export const clearTicketReward=(profile,act)=>actFor(act)?.extra?(isActCleared(profile,act)?EXTRA_REPEAT_TICKETS:EXTRA_FIRST_TICKETS):1;
export function normalizeStory(raw,legacy={}){
 const oldClear=raw?.chapterOneCleared===true||legacy?.chapterOneCleared===true;
 const actClears=Array(28).fill(false);let previous=true;
 for(const act of ACTS){actClears[act.id]=previous&&(raw?.version===2?raw?.actClears?.[act.id]===true:act.id===0&&oldClear);previous=actClears[act.id];}
 return {version:2,actClears,extraClears:EXTRA_ACTS.map(a=>actClears.slice(0,a.unlockAfterAct+1).every(Boolean)&&raw?.extraClears?.[a.chapter]===true),chapterOneCleared:actClears.slice(0,4).every(Boolean),chapterTwoCleared:actClears.slice(4,8).every(Boolean),tsukinekoUnlocked:raw?.version===2?raw.tsukinekoUnlocked===true||actClears[3]:oldClear,omsoloUnlocked:actClears[7],chapterThreeCleared:actClears.slice(8,12).every(Boolean),mochinyafeUnlocked:actClears[11],chapterFourCleared:actClears.slice(12,16).every(Boolean),shizukuUnlocked:actClears[15],chapterFiveCleared:actClears.slice(16,20).every(Boolean),primUnlocked:actClears[19],chapterSixCleared:actClears.slice(24,28).every(Boolean),heherealUnlocked:actClears[27],demonKingCalm:actClears[15]};
}
export const isActUnlocked=(profile,act)=>Number.isInteger(act)&&ACT_BY_ID.has(act)&&(actFor(act).awakening?riceQuestUnlocked(profile):actFor(act).extra?ACTS.filter(a=>a.id<=actFor(act).unlockAfterAct).every(a=>profile?.story?.actClears?.[a.id]===true):act===0||profile?.story?.actClears?.[ACTS[ACTS.findIndex(a=>a.id===act)-1]?.id]===true);
export const nextAct=profile=>ACTS.find(a=>!profile.story.actClears[a.id])?.id??ACTS.at(-1).id;
export const nextStoryAct=id=>ACTS[ACTS.findIndex(a=>a.id===id)+1]?.id??id;
export function completeAct(profile,act){
 if(!isActUnlocked(profile,act))return false;
 if(actFor(act).awakening){profile.awakenings??={rice:false};profile.awakenings.rice=true;return false;}
 if(actFor(act).extra){profile.story.extraClears[actFor(act).chapter]=true;return false;}
 const hero=actFor(act).recruit,recruited=hero&&!profile.story[`${hero}Unlocked`];
 profile.story.actClears[act]=true;profile.story.chapterOneCleared=profile.story.actClears.slice(0,4).every(Boolean);profile.story.chapterTwoCleared=profile.story.actClears.slice(4,8).every(Boolean);profile.story.chapterThreeCleared=profile.story.actClears.slice(8,12).every(Boolean);
 profile.story.chapterFourCleared=profile.story.actClears.slice(12,16).length===4&&profile.story.actClears.slice(12,16).every(Boolean);profile.story.demonKingCalm=profile.story.chapterFourCleared;
 profile.story.chapterFiveCleared=profile.story.actClears.slice(16,20).length===4&&profile.story.actClears.slice(16,20).every(Boolean);
 profile.story.chapterSixCleared=profile.story.actClears.slice(24,28).length===4&&profile.story.actClears.slice(24,28).every(Boolean);
 if(hero==='hehereal')profile.story.heherealUnlocked=profile.story.chapterSixCleared;
 else if(hero)profile.story[`${hero}Unlocked`]=true;
 return !!recruited;
}
