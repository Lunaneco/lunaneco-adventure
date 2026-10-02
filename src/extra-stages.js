import {FIELD_THEMES} from './field-themes.js';

const stage=(name,theme,note,index)=>({name,theme,image:FIELD_THEMES[theme].image,note,waves:`WAVE 0${index*2+1}–0${index*2+2}`});
// Stable IDs never move existing story, EX or awakening save records.
export const HEHE_EXTRA_ID=33;
export const EXTRA_ACTS=Object.freeze([
 {id:20,chapter:0,unlockAfterAct:7,title:'月蝕の深淵',summary:'月の世界の奥に残った影へ。草原・上層回廊・深淵の祭壇を越える、Lv.50向けの最終試練。',counts:[30,34,38,42,46,1],boss:'月蝕の守護者',bossId:'eclipse',bossHp:11000,hpScale:6.5,damageScale:5,stages:[stage('深月の草原',0,'四方から迫る魔物の猛攻',0),stage('星影の上層回廊',1,'階段の先で続く連戦',1),stage('月蝕の深淵壇',2,'最初から深化した月蝕の守護者',2)]},
 {id:21,chapter:1,unlockAfterAct:7,title:'穂守りの極陣',summary:'穂むすびの国に残る強敵を討つ。棚田・城下・砦の最奥で挑む、Lv.50向けの最終試練。',counts:[32,36,40,44,48,1],boss:'蹂躙の巨神・ヴォルガント',bossId:'colossus',bossHp:13000,hpScale:2.5,damageScale:3,stages:[stage('黄金の修羅道',3,'連射と時間差の雷を突破',0),stage('穂鐘の試練塔',5,'鎧蟹と突槌車が守る上層へ',1),stage('穂守りの極陣',6,'猛攻する巨神との最終決戦',2)]},
 {id:22,chapter:2,unlockAfterAct:11,apex:true,title:'夢蝕の王座',summary:'救い出したもちにゃふぇと、国に残った最後の悪夢へ。七種の魔物の総攻撃と、夢蝕王の連続攻撃を突破する、Lv.50向けEXで最も厳しい試練。Lv.50・成長ツリー・★4武器を整えて挑もう。',counts:[40,44,48,52,56,1],boss:'ダークもちにゃふぇ・夢蝕王',bossId:'kingmochi',bossHp:22000,hpScale:2.8,damageScale:3.4,stages:[stage('夢蝕のもち街道',9,'七種の魔物が最初から総攻撃',0),stage('黒糖の螺旋回廊',8,'上下二層で続く高速弾と連撃',1),stage('夢蝕の王座',10,'HP半分からさらに激しくなる夢蝕王',2)]},
 {id:HEHE_EXTRA_ID,chapter:5,unlockAfterAct:27,endgame:true,recommendedLevel:80,title:'へへへ・無傷の極宴',summary:'へへへランドの最奥で挑むフルカンスト向けの回避試練。Lv.80・成長ツリー・必殺技強化・最高レア装備を整え、五種の包囲と大王の弾幕をかわし続けよう。WAVE 3には黄金のへへへが1体確定で出現。',counts:[44,48,52,56,60,1],boss:'へへへ大王・極宴',bossId:'heheKing',bossHp:180000,hpScale:8,damageScale:60,goldenHeheWave:3,stages:[stage('極宴の包囲街道',19,'四方から来る拳・矢・魔法をかわす',0),stage('黄金の回避回廊',20,'WAVE 3・黄金のへへへ1体確定',1),stage('へへへ・極宴の王座',22,'最大育成でも連続被弾は致命的',2)]},
].map(a=>Object.freeze({recommendedLevel:50,...a,extra:true,number:null,recruit:null})));

export const EXTRA_COMBAT=Object.freeze({cooldownRate:1.65,telegraphScale:.7,moveScale:1.25,projectileScale:1.25,spawnScale:.75,rangedLimit:6});
export const APEX_EXTRA_COMBAT=Object.freeze({cooldownRate:2.1,telegraphScale:.62,moveScale:1.4,projectileScale:1.45,spawnScale:.6,rangedLimit:8});
export const HEHE_EXTRA_COMBAT=Object.freeze({cooldownRate:2.15,telegraphScale:.78,moveScale:1.4,projectileScale:1.5,spawnScale:.6,rangedLimit:8});
export const extraCombatFor=act=>act?.endgame?HEHE_EXTRA_COMBAT:act?.apex?APEX_EXTRA_COMBAT:EXTRA_COMBAT;
export const EXTRA_FIRST_TICKETS=10;
export const EXTRA_REPEAT_TICKETS=2;
export const EXTRA_COMBAT_HINT='Lv.50向け・最高難度固定。敵の移動・弾速・攻撃頻度が上昇し、予告が短縮。ボスは最初から猛攻状態。';

export const extraCombatHint=act=>act?.endgame?'フルカンスト向け・Lv.80／全成長ツリー／必殺技強化／最高レア装備を推奨。難易度固定・自由編成・NPCなし。通常敵260体と極宴の大王。最大育成でも連続被弾は致命的。足元の予告を離れ、三連扇矢と輪の切れ目へ逃げよう。WAVE 3に黄金のへへへ1体確定（20秒で逃走・素材2倍＋★3大量）。':act?.apex?'Lv.50向けEXの最難関・難易度固定。七種の魔物240体と夢蝕王が待ち受けます。既存EXより速い攻撃・弾幕と短い予告。ボスはHP半分で夢蝕覚醒し、包囲魔法が増加し、星弾が三連射に。輪の中央と動く弾幕の切れ目を使い、突進後の交差攻撃までかわそう。':`${EXTRA_COMBAT_HINT} ${act?.chapter===0?'月蝕の輪は内側・外側と安全地帯が入れ替わる。三連星弾の切れ目を追い、突進跡の連鎖もかわそう。':'巨歩と外周の余震、流星と二連星弾が重なる。双腕の地割れは左右・中央の順に来るので、消えた帯へ切り返そう。'}`;
