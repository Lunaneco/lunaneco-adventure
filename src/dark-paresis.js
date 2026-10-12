import {FIELD_THEMES} from './field-themes.js';

// Story acts start at 34. IDs 32 and 33 stay with Nyanluna's awakening and the Hehe extra.
export const PARESIS_ACT_START=34;
export const PARESIS_ACT_END=49;
export const STORY_ACT_SLOTS=50;
export const isParesisAct=id=>id>=PARESIS_ACT_START&&id<=PARESIS_ACT_END;

export const ENDING_CREDITS=Object.freeze([
  Object.freeze({id:'nyanluna',name:'にゃんるな',handle:'@nyanlunaAI'}),
  Object.freeze({id:'mochinyafe',name:'もちにゃふぇ',handle:'@nyanlunaAI'}),
  Object.freeze({id:'tsukineko',name:'つきねこ',handle:'@nyanlunaAI'}),
  Object.freeze({id:'prim',name:'プリム',handle:'@nyanlunaAI'}),
  Object.freeze({id:'omsolo',name:'オムソロ',handle:'@omusbi2580'}),
  Object.freeze({id:'shizuku',name:'雫',handle:'@yuno_yuu_AIart'}),
  Object.freeze({id:'hehereal',name:'へへりある',handle:'@hehehehehe035'}),
  Object.freeze({id:'lumi',name:'るみ',handle:'@Project_Luminus'}),
]);
export const KEPHIA_HERO_NAMES=Object.freeze(Object.fromEntries(ENDING_CREDITS.map(hero=>[hero.id,hero.name])));
export const KEPHIA_PHASE_LABELS=Object.freeze(['1段階','2段階','3段階','最終形態']);
export const KEPHIA_BATTLE_LINES=Object.freeze({
  form:Object.freeze([
    {id:'kephia-form-1',who:'kephia',text:'さあ、開幕だよォ！ たっぷり笑わせてね！',kind:'battle',event:'form'},
    {id:'kephia-form-2',who:'kephia',text:'交代？ いいよいいよ、つぎの顔を見せて！',kind:'battle',event:'form'},
    {id:'kephia-form-3',who:'kephia',text:'照明、落とすよ。暗闇で踊ってごらん！',kind:'battle',event:'form'},
    {id:'kephia-form-4',who:'kephia',text:'あーっはっはっは！ この舞台では、ボクが神さまだァ！',kind:'battle',event:'form'},
  ].map(Object.freeze)),
  enrage:Object.freeze({id:'kephia-enrage-1',who:'kephia',text:'あはははっ！ もっともっと、壊れちゃえ！',kind:'battle',event:'enrage'}),
});

export const DARK_HEHE_CHANCE=.2;
export const DARK_HEHE_NAME='瘴金のへへへ';
export const DARK_HEHE_LIFETIME=20;
export const DARK_HEHE_MATERIALS=Object.freeze({starBud:300,moonDew:60,wardenCore:30,moonPrism:45,astralCore:15,bloodCrystal:60,demonHeart:30,miasmaShard:36,paresisCore:12});
export function darkHeheWave(act,rng){
  if(act?.extra&&Number.isInteger(act.darkHeheWave))return act.darkHeheWave;
  if(act?.chapter!==9||act?.extra)return null;
  const roll=rng();
  return Number.isFinite(roll)&&roll>=0&&roll<DARK_HEHE_CHANCE?1+Math.min(4,Math.floor(rng()*5)):null;
}
export function darkHeheHud(game){
  const e=game.darkHehe;if(!e)return '';
  if(e.status==='active'){const seconds=Math.ceil(Math.max(0,e.expiresAt-game.time));return `<div class="rare-heading"><span>RARE · ${DARK_HEHE_NAME}</span><strong>逃走まで ${seconds}秒</strong></div><div class="rare-timer" role="progressbar" aria-label="瘴金のへへへの逃走まで" aria-valuemin="0" aria-valuemax="${DARK_HEHE_LIFETIME}" aria-valuenow="${seconds}"><i style="width:${seconds/DARK_HEHE_LIFETIME*100}%"></i></div><p>黄金のへへへの上位。★4素材「瘴灯の欠片」「パレシスの核」を持っている。</p>`;}
  if(game.time-e.resolvedAt>6)return '';
  return `<div class="rare-heading"><strong>${DARK_HEHE_NAME} ${e.status==='defeated'?'討伐！':'は逃げていった…'}</strong></div><p>${e.status==='defeated'?'★4素材を含む、黄金のへへへを上回る素材を獲得':'各幕で一度だけ20%抽選。再挑戦でも出会えることがあります。'}</p>`;
}

const boss=(name,color,hint,jester=false)=>Object.freeze({name,subtitle:jester?'THE LAUGHING JESTER':'DARK PARESIS',role:jester?'塔を笑い声で塗った道化の魔導師':'瘴気に染まった影',color,speed:1.05,radius:2.15,attacks:['瘴気の輪','笑い声の弾幕','闇灯の突進'],hint});
const DARK_BOSS_LIST=Object.freeze([
  ['nyanEcho','月蝕の残響',0xc9b6ff,'輪の中央へ入り、次の破裂では外へ。笑い声の弾は切れ目を追う。'],
  ['tsukiEcho','止まった星時計',0x9fd8ff,'時計回りの刻印を先に消えた線へ。突進の後に針が回る。'],
  ['riceEcho','穂を覆う影',0x9ee6b8,'地割れを横へ抜け、扇状の薙ぎは消えた帯へ切り返す。'],
  ['mochiEcho','ひとりの鈴',0xffb7d5,'輪の内側か外側。鈴の連射が止まってから反撃。'],
  ['shizukuEcho','紅月の門影',0xff9eb8,'十字の帯を斜めへ。中央の爆発の前に輪の外へ出る。'],
  ['primEcho','虹の欠けら',0xb7ecff,'動く切れ目を抜ける。急降下の着地点を囲む風圧に注意。'],
  ['heheEcho','冷えた食卓の影',0xffc27a,'拳の帯をかわし、飛んでくる弾は横へ。HP半分で連射が増える。'],
  ['lumiEcho','閉ざした村門',0xd7d3ff,'照準線を横へ抜け、衝撃波は中央か外側。'],
  ['paresisGate','瘴気の門',0x8d7cff,'塔の門は輪と突進を重ねる。帯を横切ってから反撃。'],
  ['paresisBell','笑い声の鐘',0xb9a6ff,'鐘の波紋には安全な中央がある。落鐘の後は斜めへ。'],
  ['paresisChoir','闇灯の回廊',0x7f8cff,'三方向の弾幕。消えた線へ移り、連射が止まってから前へ。'],
  ['paresisDoor','ライトパレシスの殻',0xd8c6ff,'古い光の殻が砕ける。内側の爆発と外側の衝撃を分けてかわす。'],
  ['kephia1','ケフィア・開幕',0xf2b7ff,'舞台の幕が輪になる。中央と外側を行き来し、笑い声の弾は切れ目を見る。'],
  ['kephia2','ケフィア・幕間',0xe7a0ff,'拍手のたびに弾幕の切れ目が動く。突進が止まってから反撃。'],
  ['kephia3','ケフィア・暗転',0xc58cff,'照明が落ち、足元の印が先に爆ぜる。印の外へ出てから次の輪へ。'],
  ['kephia4','ケフィア・終幕',0xff8adf,'最終形態。輪、弾幕、突進が間を置かず続く。HP半分で三連になる。倒すとエンディング。'],
  ['paresisApex','瘴核の門',0xe7a0ff,'核の輪と突進が重なる。帯を横切ってから反撃。'],
]);
export const DARK_BOSS_IDS=Object.freeze(DARK_BOSS_LIST.map(([id])=>id));
export const DARK_PARESIS_BOSSES=Object.freeze(Object.fromEntries(DARK_BOSS_LIST.map(([id,name,color,hint])=>[id,boss(name,color,hint,id.startsWith('kephia'))])));

const paresisTheme=FIELD_THEMES.findIndex(theme=>theme.paresis);
const stage=(name,_theme,note,index)=>({name,theme:paresisTheme+Math.min(index,2),image:FIELD_THEMES[paresisTheme+Math.min(index,2)].image,note,waves:`WAVE 0${index*2+1}–0${index*2+2}`});
// Attack pressure for the tower: hazards, shots and contact all scale, so the recommended level stays meaningful.
export const PARESIS_MENACE=Object.freeze([2,2.1,2.2,2.3,2.4,2.5,2.6,2.7,3.6,3.8,4,4.2,3,3.1,3.2,3.4]);
const makeAct=(spec,index)=>Object.freeze({
  ...spec,
  roster:'paresis',
  ...(Number.isInteger(spec.kephiaPhase)?{kephiaRush:true,counts:[1,1,1,1,1,1],stages:spec.stages.map(row=>({...row,waves:'ボス戦'}))}:{}),
  id:PARESIS_ACT_START+index,
  number:index%4+1,
  chapter:7+Math.floor(index/4),
  recommendedLevel:index<8?80:90,
  menace:PARESIS_MENACE[index],
  recruit:null,
  bossId:DARK_BOSS_IDS[index],
});
export const DARK_PARESIS_ACTS=Object.freeze([
  makeAct({title:'散らされた月光',summary:'塔の中で聞こえた笑い声のあと、にゃんるなは月の草原へひとり戻されていた。隣にいたはずの手を探しながら、残った光で道をひらく。',boss:'月蝕の残響',bossHp:20000,counts:[40,42,44,46,48,1],roster:'one',soloHero:'nyanluna',soloName:'にゃんるな',stages:[stage('星詠みの草原',0,'一人でほどけた光を拾う',0),stage('月影の遺跡',1,'空いた隣の席を残したまま進む',1),stage('暁の聖域',2,'残響をほどき、次の居場所へ',2)]},0),
  makeAct({title:'止まった針の向こう',summary:'つきねこは時計塔の前に立っていた。笑い声は、一人で針を戻す顔が見たいだけだ。席は空けたまま、先に針を動かす。',boss:'止まった星時計',bossHp:22000,counts:[42,44,46,48,50,1],roster:'one',soloHero:'tsukineko',soloName:'つきねこ',stages:[stage('忘却の回廊',1,'止まった夜を一人で歩く',0),stage('星時計の庭',3,'空いた隣を残して針を合わせる',1),stage('時計塔の頂',4,'五つの刻印をかわし、塔を見上げる',2)]},1),
  makeAct({title:'半分の顔でも、穂は守る',summary:'オムソロは穂むすびの国へ戻されていた。笑い声は、分けた顔では国は守れないと言う。棚田の水は、それでも止まらない。',boss:'穂を覆う影',bossHp:24000,counts:[44,46,48,50,52,1],roster:'two',soloHero:'omsolo',soloName:'オムソロ',stages:[stage('稲穂の里道',3,'瘴気の乗った風を棚田から払う',0),stage('翡翠の用水峡',4,'せき止められた水を通す',1),stage('穂守りの大広場',6,'一人でも、砦の灯を戻す',2)]},2),
  makeAct({title:'ふぇ〜は、まだ届く',summary:'もちにゃふぇは空っぽの国に立っていた。笑い声は、最後の一匹をもう一度ひとりにしたがっている。鈴は、小さくても鳴る。',boss:'ひとりの鈴',bossHp:26000,counts:[46,48,50,52,54,1],roster:'three',soloHero:'mochinyafe',soloName:'もちにゃふぇ',stages:[stage('さくらもちの里',7,'返事のない家の前で鈴を鳴らす',0),stage('ミルクティーの渓谷',8,'小さな声のまま影を追う',1),stage('ふぇ〜の約束の広場',10,'一人でも、国の灯を守る',2)]},3),
  makeAct({title:'紅月は、まだここにある',summary:'雫は悪魔の国の街道に立っていた。王は穏やかなままで、空だけが瘴気に濁っている。街を守る理由は、笑われるためではない。',boss:'紅月の門影',bossHp:22000,counts:[44,46,48,50,52,1],roster:'four',soloHero:'shizuku',soloName:'雫',stages:[stage('紅灯りの街道',11,'濁った空の下で門を守る',0),stage('紅霧の水路',12,'戻らない霧を水路から払う',1),stage('おかえりの王座',14,'王の隣は空けたまま、街の灯を残す',2)]},4),
  makeAct({title:'届かない名前でも、翼は開く',summary:'プリムはプリズムの国で小さくなっていた。呼びたい名前はここにはいない。それでも欠けた虹の上を、一匹で渡る。',boss:'虹の欠けら',bossHp:24000,counts:[46,48,50,52,54,1],roster:'five',soloHero:'prim',soloName:'プリム',stages:[stage('青晶の入り江',15,'一匹で結晶の門をくぐる',0),stage('オーロラの峡谷',16,'届かない鳴き声のまま進む',1),stage('プリズムの心臓',18,'虹の芯を、一人でつなぐ',2)]},5),
  makeAct({title:'冷えた食卓で、先に弓を引く',summary:'へへりあるは食卓の前に戻されていた。料理は並んでいるのに温かくない。おなかより先に、街を塞ぐ影へ弓を向ける。',boss:'冷えた食卓の影',bossHp:26000,counts:[48,50,52,54,56,1],roster:'six',soloHero:'hehereal',soloName:'へへりある',stages:[stage('へへへランドの入口',19,'温もりの消えた街門を開ける',0),stage('花灯りの架け橋',21,'空腹のまま、橋の影を払う',1),stage('いただきますの大広場',22,'食卓を塞ぐ影を退ける',2)]},6),
  makeAct({title:'指先は、塔のほうを向く',summary:'るみはねこみみの村に立っていた。毛嫌いされた耳が、いまは帰り道の目印になる。指先の光を、塔の方角へ向ける。',boss:'閉ざした村門',bossHp:28000,counts:[50,52,54,56,58,1],roster:'seven',soloHero:'lumi',soloName:'るみ',stages:[stage('壊れた村の門',23,'静まり返った村の門を開ける',0),stage('小さな避難所の庭',25,'安心して戻れる場所を残す',1),stage('みんなの村の広場',26,'指先の光で、塔までの方角を切る',2)]},7),
  makeAct({title:'八つの足音',summary:'散らされた八人が、ダークパレシスの麓で顔を合わせる。塔へ入る。戦うのは、この階に選んだ二人。残りは下の階段を守る。',boss:'瘴気の門',bossHp:30000,counts:[48,50,52,54,56,1],roster:'six',stages:[stage('ダークパレシスの麓',11,'八人の足音が、もう一度そろう',0),stage('瘴気の門前',12,'選んだ二人が門をひらく',1),stage('塔の一階',13,'門の奥で、笑い声が近づく',2)]},8),
  makeAct({title:'笑い声の階段',summary:'塔の中段。過去に富を運んだ光の跡が、黒い鈴のように鳴っている。この階も、選んだ二人が進む。',boss:'笑い声の鐘',bossHp:33000,counts:[50,52,54,56,58,1],roster:'six',stages:[stage('光の跡の回廊',12,'富を運んだ光の、黒い残り香',0),stage('笑い声の階段',13,'鈴の鳴る段を二人で上る',1),stage('中段の鐘楼',14,'鐘を止め、上の階への道を残す',2)]},9),
  makeAct({title:'闇灯の回廊',summary:'瘴気が灯りの形をしている。避ける光と、追う光を間違えない。各幕で一度、20%の確率で瘴金のへへへが現れる。',boss:'闇灯の回廊',bossHp:36000,counts:[52,54,56,58,60,1],roster:'six',stages:[stage('闇灯の回廊',13,'黒い灯りの切れ目を抜ける',0),stage('瘴気の分かれ路',11,'通常の道と、濃い瘴気の道',1),stage('上位の影が通る広間',14,'黄金のへへへより重い影を退ける',2)]},10),
  makeAct({title:'ライトパレシスの殻',summary:'塔の芯に、昔のライトパレシスが残っていた。富を生んだ光は、いまは殻の内側で濁っている。この扉の向こうに、笑い声の主がいる。',boss:'ライトパレシスの殻',bossHp:40000,counts:[54,56,58,60,62,1],roster:'six',stages:[stage('白い塔の残骸',14,'光を生んでいた壁の、黒い内側',0),stage('殻の螺旋',13,'濁った光を避けて芯へ',1),stage('笑い声の扉',11,'ケフィアの舞台への扉を開ける',2)]},11),
  makeAct({title:'開幕',summary:'ケフィアとの戦い。ボスだけが現れる。第一形態から最終形態まで、決めた二人ずつが続けて舞台に立つ。途中で倒れると、記録は第1幕のまま。',boss:'ケフィア・開幕',bossHp:100000,counts:[1,1,1,1,1,1],roster:'paresis',kephiaPhase:0,finale:true,stages:[stage('開幕の舞台',11,'一段階目の二人が幕を上げる',0),stage('拍手の回廊',12,'笑い声が、二人の並びを見ている',1),stage('開幕の幕切れ',13,'この段階を退け、次の二人へ渡す',2)]},12),
  makeAct({title:'幕間',summary:'2段階。開幕を退けたその場で、次の二人が舞台に入る。メニューには戻らない。',boss:'ケフィア・幕間',bossHp:110000,counts:[1,1,1,1,1,1],roster:'paresis',kephiaPhase:1,finale:true,stages:[stage('幕間の袖',12,'次の二人が袖から出る',0),stage('動く切れ目',13,'拍手のたびに弾幕がずれる',1),stage('幕間の終わり',14,'舞台を、三段階目へ渡す',2)]},13),
  makeAct({title:'暗転',summary:'3段階。照明が落ち、瘴気がケフィアの形を取りはじめる。この二人のあとに、最終形態が続く。',boss:'ケフィア・暗転',bossHp:120000,counts:[1,1,1,1,1,1],roster:'paresis',kephiaPhase:2,finale:true,stages:[stage('暗転の舞台',13,'灯りの落ちた床を二人で渡る',0),stage('足元の印',14,'先に爆ぜる印の外へ',1),stage('最終形態の前',11,'最後の二人へ、舞台を開ける',2)]},14),
  makeAct({title:'終幕',summary:'最終形態。最後の二人がケフィアを倒すと、四つの幕がまとめてクリアになり、エンディングが始まる。過去を知ったことは、塔を許したことにはならない。',boss:'ケフィア・終幕',bossHp:150000,counts:[1,1,1,1,1,1],roster:'paresis',kephiaPhase:3,finale:true,stages:[stage('終幕の舞台',14,'最後の二人が、笑い声の前に立つ',0),stage('割れない照明',13,'三連の攻撃を、二人で分ける',1),stage('塔を出ない笑い',11,'最終形態を倒し、出口の光を戻す',2)]},15),
]);

const FINAL={portrait:'kephiaFinal'};
const line=(who,text,extra={})=>({who,text,voiced:true,...extra});
const scene=(id,area,title,kicker,rows)=>({act:id,area,kicker,title,next:area===2?'先へ進む':'塔の奥へ',lines:rows.map(([who,text,extra])=>line(who,text,extra))});
const pack=(id,chapterLabel,beats)=>{
  const ending=scene(id,2,beats.ending[0],chapterLabel,beats.ending[1]);
  if(id===49)ending.next='エンドロールへ';
  return Object.freeze({
    opening:scene(id,0,beats.opening[0],chapterLabel,beats.opening[1]),
    ruins:scene(id,1,beats.ruins[0],chapterLabel,beats.ruins[1]),
    sanctuary:scene(id,2,beats.sanctuary[0],chapterLabel,beats.sanctuary[1]),
    ending,
  });
};
export const DARK_PARESIS_SCENES=Object.freeze([
  pack(34,'第8章 · 第1幕',{
    opening:['散らされた月光',[
      ['narrator','塔の扉が閉まる音と、甲高い笑い声。気がつくと、にゃんるなは月の草原にひとりで立っていた。'],
      ['kephia','あはははっ！ 散った散った！ 八つの光が、花火みたいにパーンって！ ねえ見た？ いまの顔、最高だったよォ！'],
      ['nyanluna','……みんな、どこ？ つきねこの手、さっきまで握ってたのに。'],
      ['kephia','探して探して。ひとりで走り回る姿、ボクの特等席からよーく見えるからさ！'],
      ['nyanluna','見たいなら、見てて。わたしは月の光で、もう一度みんなまでの道を照らすから。'],
    ]],
    ruins:['空いた隣',[
      ['narrator','月影の遺跡には、旅のはじめに二人で腰かけた石段が残っていた。'],
      ['nyanluna','隣、空けておくね。戻ってきたとき、すぐに座れるように。'],
      ['kephia','律儀だねえ。空っぽの席に話しかけるの、ボク大好き。泣きそうな声、もっとちょうだい？'],
      ['nyanluna','泣くのは、会えたときに取っておく。いまは前を見る番。'],
    ]],
    sanctuary:['残響をほどく',[
      ['narrator','聖域の中央で、にゃんるなの光をまねた影が、笑いながら月を欠けさせていく。'],
      ['kephia','ほらほら、キミの光のニセモノ！ 本物とニセモノ、どっちが先に消えるかな？'],
      ['nyanluna','わたしの光は、みんなが帰る場所を照らすための光。……月の光よ、残響をほどいて！'],
    ]],
    ending:['月は、まだ道になる',[
      ['narrator','残響がほどけると、草原の向こうに黒い塔の影が浮かんだ。月の光が、その方角へまっすぐ伸びている。'],
      ['kephia','ちぇっ。もう少し迷ってくれたら楽しかったのに。……まあいいや、次の子はどんな顔するかなァ。'],
      ['nyanluna','待ってて、みんな。この道の先で、また同じ場所に立とう。'],
    ]],
  }),
  pack(35,'第8章 · 第2幕',{
    opening:['止まった針',[
      ['narrator','つきねこが目を開けると、星時計の塔の前だった。大きな針は、八人がはぐれた瞬間で止まっている。'],
      ['kephia','チクタク、チクタク……あれぇ、止まっちゃった！ キミの時間、ボクが止めておいてあげたよ。感謝してね？'],
      ['tsukineko','余計なお世話。止まったなら、わたしが撃って動かす。'],
    ]],
    ruins:['席は空けたまま',[
      ['tsukineko','ここ、にゃんるなの席。踏まないで進む。次に会ったとき、すぐ隣に戻れるように。'],
      ['narrator','星時計の庭で、つきねこは空いた場所をよけ、刻印の影だけを撃ち抜いていく。'],
      ['kephia','強がりだねえ。ほんとは寂しいんでしょ？ ほら、言ってごらんよ。さびしいって！'],
      ['tsukineko','さびしいよ。だから急いでる。それだけ。'],
    ]],
    sanctuary:['五つの刻印',[
      ['kephia','さあ、ボクのリズムで踊って！ ワン、ツー、スリー……あはははっ、ズレてるズレてる！'],
      ['tsukineko','わたしは、自分で数えた秒で撃つ。狙いは、もう決まってる。'],
    ]],
    ending:['塔を、上に見る',[
      ['narrator','五つ目の刻印が砕けると、針が一晩ぶんだけ進んだ。夜空の高いところに、黒い塔の輪郭が見える。'],
      ['tsukineko','見つけた。次は、みんなのいる高さまで行く。'],
      ['kephia','いいねいいね、上っておいでよ。高いところから落ちる顔って、いちばん面白いんだから！'],
    ]],
  }),
  pack(36,'第8章 · 第3幕',{
    opening:['棚田に乗った瘴気',[
      ['narrator','穂むすびの国の棚田に、黒い露が降りていた。稲は重く頭を垂れ、水だけが細く流れている。'],
      ['kephia','やあやあ、半分の顔の守り手さん！ 顔を分けて配っちゃうなんて、ボク笑いすぎてお腹いたーい！'],
      ['omsolo','笑いたければ笑え。分けた顔は、この国の誰かの力になっている。それで十分だ。'],
    ]],
    ruins:['水を、通す',[
      ['omsolo','せき止めているのは影のほうだ。水は、里へ返す。'],
      ['narrator','オムソロが用水の水門に手をかける。重い扉が、一人分の力で一段だけ持ち上がった。'],
      ['kephia','がんばるねえ。でも一人でしょ？ ほら、腕が震えてる。その震え、もっと見せてよォ！'],
      ['omsolo','震えているなら、まだ力が残っている証拠だ。もう一段、上げる。'],
    ]],
    sanctuary:['砦の灯',[
      ['kephia','灯台なんてさ、消えるためにあるんだよ。パッと点いて、フッと消える。それがいちばん美しいの！'],
      ['omsolo','灯は、帰る者のためにある。帰り道を照らすために、私はもう一度灯す。'],
      ['narrator','大広場の奥で、穂守りの灯台が一度だけ暗くなり、それから小さく点った。'],
    ]],
    ending:['一人でも、灯は消えない',[
      ['narrator','棚田の端まで風が通り抜けた。黒い露が乾き、稲がゆっくり顔を上げていく。'],
      ['omsolo','ここは守った。次は、散らされた仲間のところへ行く。'],
      ['kephia','ふーん、つまんないの。……でも塔の上は、もっと暗いよ。楽しみにしててね！'],
    ]],
  }),
  pack(37,'第8章 · 第4幕',{
    opening:['返事のない家',[
      ['narrator','もちにゃふぇの国は、また静まり返っていた。最後の一匹になった日と同じ、返事のない家が並んでいる。'],
      ['kephia','おかえり、最後の一匹ちゃん！ また一人ぼっちだねえ。その顔が見たくて、ボクここに送ってあげたんだよ！'],
      ['mochinyafe','ふぇ〜……'],
      ['kephia','あはははっ！ ちっちゃい声！ その声、どこまで届くか試してごらんよォ！'],
    ]],
    ruins:['鈴は鳴る',[
      ['narrator','渓谷の古い鈴を、もちにゃふぇが前足でそっと押した。音は短い。それでも谷の向こうまで転がっていった。'],
      ['mochinyafe','ふぇ〜！'],
      ['narrator','遠くで、もうひとつ鈴が鳴った。誰かが、いまも返事をしている。'],
    ]],
    sanctuary:['一人でも、灯す',[
      ['kephia','しつこいなあ！ 小さい光が、なんでそんなに消えないのさ！'],
      ['mochinyafe','ふぇ〜っ！'],
      ['narrator','広場の灯は、小さなふぇ〜に合わせて、ひとつずつ芯が赤くなっていく。'],
    ]],
    ending:['届くほうへ',[
      ['mochinyafe','ふぇ〜？'],
      ['narrator','言葉にはならない。けれど向きだけは、はっきりしていた。もちにゃふぇは鈴を首に下げ、塔のほうへ歩き出す。'],
      ['kephia','……なにさ、その目。こっちを見るなら、ちゃんと怖がってよ。'],
    ]],
  }),
  pack(38,'第9章 · 第1幕',{
    opening:['濁った空、穏やかな王',[
      ['narrator','悪魔の国の王は、穏やかな心のまま城にいた。濁っているのは空のほうだ。雫は街道の真ん中で鎌を構える。'],
      ['kephia','やっほー、紅月ちゃん！ この国、前はもっと真っ赤だったんでしょ？ ボクがまた塗ってあげよっか？'],
      ['shizuku','やめろ。この街は、やっとおかえりを言えるようになったんだ。……おまえの絵の具は、ここで止める。'],
    ]],
    ruins:['戻らない霧',[
      ['shizuku','この霧、塔から流れてきてる。なら、切る場所はここだ。'],
      ['narrator','雫の鎌が水路をなぞると、赤い霧がその軌跡のぶんだけ薄くなった。'],
      ['kephia','怒ってる？ 怒ってるよね！ その顔、その顔！ 怒った顔って、笑った顔のつぎに好きなんだ！'],
      ['shizuku','うるさい。……コーラ飲みたい。早く終わらせる。'],
    ]],
    sanctuary:['空けておく隣',[
      ['shizuku','にゃんるなの隣は、わたしの場所だ。戻ったときに、そのまま並べるようにしとく。'],
      ['narrator','王座の間の段に、月の粉がひと筋残っていた。雫はそれを袖で払わず、門のほうへ向き直る。'],
      ['kephia','友情ってやつ？ うえー、甘ったるい！ そういうの、塔の上で粉々にするのが楽しみだよォ！'],
    ]],
    ending:['街の灯は残った',[
      ['narrator','門影が崩れると、街道の窓がひとつ、またひとつと開いた。灯りが戻ってくる。'],
      ['shizuku','それでいい。……次は塔の中だ。待ってろ、にゃんるな。'],
    ]],
  }),
  pack(39,'第9章 · 第2幕',{
    opening:['届かない名前',[
      ['narrator','プリムは青晶の入り江で、ひとりで空を見上げていた。いつも一緒に飛んでいた背中が、どこにも見えない。'],
      ['prim','キュ〜……'],
      ['kephia','呼んでも呼んでも、だーれも来ない！ ちっちゃな竜が鳴いてる顔、かわいそうで、かわいくて、たまんないねえ！'],
    ]],
    ruins:['それでも渡る',[
      ['narrator','峡谷の虹は、途中でぷつりと切れていた。プリムは切れ端にいちど降り、次の光まで翼を広げる。'],
      ['prim','キュ〜！'],
      ['kephia','落ちる？ 落ちる？ ……ちぇっ、飛んだ。'],
    ]],
    sanctuary:['虹の芯',[
      ['narrator','プリズムの心臓で、七色の光が一本に戻ろうとしていた。プリムはまっすぐにブレスを吐き、欠けたところへ自分の光を足していく。'],
      ['kephia','一匹でつなぐの？ 壊れかけの虹なんて、ボクがちょっと笑えば、また割れちゃうのに！'],
      ['prim','キュ〜っ！'],
    ]],
    ending:['呼ぶ方向は決まった',[
      ['prim','キュ〜。'],
      ['narrator','鳴き声は短く、落ち着いていた。向かう先は塔。プリムは小さな翼のまま、その方角へ飛び立つ。'],
    ]],
  }),
  pack(40,'第9章 · 第3幕',{
    opening:['冷めた食卓',[
      ['narrator','へへへランドの食卓には、ごちそうが並んでいた。湯気だけが、どこにも立っていない。'],
      ['kephia','いらっしゃーい！ 冷めたごはんの国へようこそ！ ほら食べなよ。冷たくて、味がしなくて、さみしいよォ？'],
      ['hehereal','おなかは空いてるよ。このごはんは後回し。先に、食卓をふさいでる影をどかすね。'],
    ]],
    ruins:['橋の上で引く',[
      ['hehereal','みんなに分けてもらった元気は、ちゃんとここに残ってる。だから今は、街のほうが先！'],
      ['narrator','花灯りの橋で、桜の矢が一本、瘴気のいちばん厚いところを貫いた。穴の向こうに、いつもの通りが見える。'],
      ['kephia','わぁ、まじめ！ 空腹を我慢してる顔も、なかなかいい味してるねえ。'],
    ]],
    sanctuary:['いただきますの前に',[
      ['hehereal','影が食卓を占領したままだと、だれもいただきますって言えないもん。席につく前に、片づけるよ。'],
      ['kephia','あははっ、いただきます、だってさ！ ボクはね、みんなのごちそうさまの顔を、ぜーんぶ食べちゃいたいの！'],
      ['hehereal','それは、あげない。みんなの分は、みんなのものだよ。'],
    ]],
    ending:['湯気は、あとでいい',[
      ['narrator','影が引くと、鍋の表面が小さく揺れ、ほんの少し湯気が立った。へへりあるは一口もつけずに、弓を背負い直す。'],
      ['hehereal','ごはんは、みんなで食べる。塔の出口で、待っててね。'],
    ]],
  }),
  pack(41,'第9章 · 第4幕',{
    opening:['静かな村門',[
      ['narrator','ねこみみの村は静かだった。追い払う声のかわりに、塔から降りた瘴気が門の金具を黒く染めている。'],
      ['kephia','やあ、指先の子！ この村、キミの耳を嫌った人たちがいた村でしょ？ 守る意味、あるのかなァ？'],
      ['lumi','耳のことは、もうだれにも決めさせません。この光は村のほうを向きます。それから、塔のほうも。'],
    ]],
    ruins:['戻れる場所を残す',[
      ['lumi','避難所の庭は、よけて進みます。ここに帰ってくる人がいるから。'],
      ['narrator','るみは庭の端を歩き、門の錆だけを指先の光で焼き切っていく。'],
      ['kephia','やさしいねえ。やさしい子が裏切られる瞬間って、ボク大好物なんだ。'],
      ['lumi','裏切られたことは、覚えています。覚えたまま、いまは守ると決めたんです。'],
    ]],
    sanctuary:['方角を切る',[
      ['lumi','嫌いだったものも、帰り道のしるしにします。許すかどうかは、わたしがあとで決めます。'],
      ['narrator','指先の光が村の空で一度折れ、黒い塔の輪郭をくっきりと照らした。'],
    ]],
    ending:['八人の、同じ高さ',[
      ['lumi','もう散らされません。塔の麓で、みんなと合流します。'],
      ['narrator','広場の鐘が、るみの光に応えて一回だけ鳴った。その音は、塔の麓まで届いている。'],
      ['kephia','ふーん……八人そろうんだ。いいよ、いいよォ。観客がそろったら、いよいよ開演だね！'],
    ]],
  }),
  pack(42,'第10章 · 第1幕',{
    opening:['八つの足音',[
      ['narrator','ダークパレシスの麓に、八人の影がばらばらに落ち、それから同じ地面で重なった。'],
      ['nyanluna','みんな……！ よかった。けがはない？ 同じ場所にいられるなら、それで十分。'],
      ['tsukineko','針は戻した。にゃんるなの席も、ちゃんと空けてあるよ。'],
      ['omsolo','棚田は守った。塔の門は、ここからだ。'],
      ['mochinyafe','ふぇ〜！'],
      ['shizuku','街の灯は残した。……にゃんるな、隣、戻るぞ。'],
      ['prim','キュ〜！'],
      ['hehereal','ごはんは、出口までとってあるよ。みんなで食べようね。'],
      ['lumi','村の方角も、ここからよく見えます。行きましょう。'],
    ]],
    ruins:['この塔の名前',[
      ['narrator','塔の壁には、古い文字が刻まれていた。この塔は昔ライトパレシスと呼ばれ、世界じゅうへ富の光を送っていたという。'],
      ['kephia','ようこそ、ボクの劇場へ！ 階段はせまいから、二人ずつ上っておいで。残りは下で、出口を守ってなよ。あははっ！'],
      ['omsolo','罠かもしれん。それでも、狭い階段なら二人ずつ上るのが最善だ。'],
    ]],
    sanctuary:['瘴気の門',[
      ['narrator','門の向こうで、負のエネルギーが灯りの形をして揺れていた。富を運んでいた光の、裏返しだ。'],
      ['kephia','きれいでしょ？ 光ってのはね、ひっくり返すと、こんなに楽しい色になるんだよ！'],
    ]],
    ending:['上の笑い声',[
      ['narrator','瘴気の門が割れると、上の階でぱちぱちと拍手が鳴った。次の階も、二人ずつ上る。'],
    ]],
  }),
  pack(43,'第10章 · 第2幕',{
    opening:['黒い残り香',[
      ['narrator','中段の壁には、光が富を運んでいたころの溝が残っている。溝の中は、いまは黒い。'],
      ['kephia','みんな、この光で豊かになったんだよねえ。毎日毎日、塔を見上げて、ありがたやーって。……あははっ、その顔がさ、ずっと退屈だったんだ！'],
    ]],
    ruins:['階段を、二人で',[
      ['narrator','選んだ二人が段を上る。下では六人が、崩れかけた段に光を置き、帰り道を保っている。'],
      ['tsukineko','下は任せて。上で何かあったら、すぐに撃てる位置にいるから。'],
      ['kephia','二人だけ？ いいよ。少ないほうが、ひとりひとりの顔がよーく見えるもん。'],
    ]],
    sanctuary:['鐘を止める',[
      ['narrator','弾幕の切れ目へ入り、落ちてくる鐘のあとで斜めへ跳んだ二人が、鐘楼の芯を断ち切る。'],
      ['kephia','いったぁい！ ボクの鐘、壊したなー！ ……なーんてね。もっと壊していいよ、どうせ全部、最後は壊れるんだから！'],
    ]],
    ending:['まだ上がある',[
      ['narrator','鐘が沈黙すると、さらに上の階で、甲高い笑い声が響いた。'],
    ]],
  }),
  pack(44,'第10章 · 第3幕',{
    opening:['間違えない光',[
      ['narrator','回廊の灯りが、すべてこちらを見ていた。避ける光と、追う光が、同じ色をしている。'],
      ['kephia','特別ゲストも呼んでおいたよ！ 黄金のへへへより、ちょっと重たい子。会えるかどうかは、運しだい！'],
      ['hehereal','瘴金のへへへ……！ 見つけたら、逃がさないよ。'],
    ]],
    ruins:['濃いほうの道',[
      ['narrator','分かれ路の右は、瘴気が厚い。下の階から、雫の声が階段を上ってくる。'],
      ['shizuku','濃いほうに、強いのがいる。……行けるなら、行け。'],
    ]],
    sanctuary:['道化の昔話',[
      ['kephia','昔話、してあげよっか。この塔にはね、光を見に来る人のための道化がいたんだ。毎日おどけて、転んで、笑わせようとしてた。'],
      ['kephia','でもさ、みんな光ばっかり見上げてるの。舞台から落ちた日も、拍手ひとつ鳴らなかったよ。'],
      ['nyanluna','……それが、あなた？'],
      ['kephia','さあね！ あはははっ！'],
    ]],
    ending:['殻が見えた',[
      ['narrator','回廊の突き当たりに、白い塔の残骸が埋まっていた。ライトパレシスの殻だ。'],
    ]],
  }),
  pack(45,'第10章 · 第4幕',{
    opening:['富を生んだ壁',[
      ['narrator','殻の内側は、昔の光の色をしていた。世界を潤した塔と、世界を瘴気で包んだ塔は、同じひとつの建物だった。'],
      ['kephia','わかった？ わかっちゃった？ かわいそうな道化のお話。……で、許してくれるの？'],
      ['lumi','わかることと、許すことは、べつです。わたしは村で、それを知りました。'],
      ['kephia','あはははっ！ いいね、その答え！ 許されたら、つまんないもん！'],
    ]],
    ruins:['濁った芯',[
      ['narrator','螺旋の芯で、光が金貨の形に見えかけ、また黒い煙に戻る。二人はそれを拾わずに進む。'],
      ['omsolo','富の光か。拾えば、あの道化と同じものを見上げることになる。'],
    ]],
    sanctuary:['扉の前',[
      ['kephia','舞台は四つ。役者は二人ずつ。開幕、幕間、暗転、そして終幕！ だれと立つかは、もう決めたんでしょ？'],
      ['kephia','途中で倒れたら、また開幕からやり直し。ボク、何度でも見てあげる。キミたちが壊れるまで、何度でもね！'],
      ['narrator','扉の向こうで、幕を上げる綱がきしむ音がした。'],
    ]],
    ending:['配役のまま、舞台へ',[
      ['narrator','殻が崩れ落ち、終章の舞台が口を開けた。八人は四組のまま、決めた順番で舞台袖に並ぶ。'],
      ['nyanluna','四つの舞台、全部つないで勝とう。最後に、同じ出口で会えるように。'],
    ]],
  }),
  pack(46,'終章 · 開幕',{
    opening:['開幕',[
      ['narrator','開幕のベルが鳴った。一組目の二人が袖から出る。残る六人は、舞台の外で出口の光を守っている。'],
      ['kephia','レディース・アンド・ジェントルメン！ 道化の魔導師、ケフィアの舞台へようこそ！ 今夜の演目は、光の終わりだよォ！'],
      ['kephia','富だの光だの、みーんな同じ顔で見上げてさ。だからボクが塗りつぶしてあげたの。ねえ、笑える？ 笑えるよねえ！'],
    ]],
    ruins:['幕が輪になる',[
      ['kephia','ほらほら、踊って踊って！ 真ん中？ 外側？ どっちに逃げても、ボクの幕の中だよォ！'],
      ['narrator','緞帳そのものが輪になり、中央と外側を交互に焼いていく。二人は並び方を変えずに、切れ目を探す。'],
    ]],
    sanctuary:['笑い声の弾幕',[
      ['kephia','あはははっ！ もっと必死な顔して！ まだ開幕だよ、最後まで付き合ってもらうからね！'],
    ]],
    ending:['次の二人へ',[
      ['kephia','いったぁい！ ……ずるいずるい、二人がかりなんて！ いいもん、まだ幕は三つ残ってるんだから！'],
      ['narrator','開幕のケフィアが膝をつく。拍手のかわりに、袖から次の二人の足音が近づいてくる。'],
    ]],
  }),
  pack(47,'終章 · 幕間',{
    opening:['幕間',[
      ['narrator','二組目の二人が、休む間もなく舞台へ出た。開幕を戦った二人は袖で息を整え、出口の光を守っている。'],
      ['kephia','交代？ 交代なの？ あははっ、なにそれ新しい！ 二人で分けて背負うなんて、ボクの台本にはなかったよ！'],
    ]],
    ruins:['動く切れ目',[
      ['kephia','拍手に合わせて、弾が動くんだ。ボクのリズムに乗ったら、切れ目はぱたんと閉じちゃうよ？'],
      ['narrator','二人は自分たちの歩幅を守り、切れた側へ入っていく。'],
    ]],
    sanctuary:['止まってから',[
      ['narrator','ケフィアの突進が壁を叩いて止まる。その一瞬だけ、反撃の隙が生まれる。'],
      ['kephia','まじめだねえ！ 開幕の二人にも、おんなじこと言ったんだけどなあ！'],
    ]],
    ending:['照明を落とす',[
      ['kephia','あーあ、もういいや。明るいと、キミたちの顔がよく見えすぎて飽きちゃった。……照明、落とそっか。'],
      ['narrator','ケフィアが指を鳴らすと、舞台の照明がひとつ残らず消えた。次は暗転だ。'],
    ]],
  }),
  pack(48,'終章 · 暗転',{
    opening:['暗転',[
      ['narrator','三組目。真っ暗な床に、足元の印だけが光っている。この二人が、最終形態の前の闇を割る。'],
      ['kephia','見えないでしょ？ 怖いでしょ？ 暗闇のなかでも、隣にいるって信じられるかなァ？'],
    ]],
    ruins:['印の外',[
      ['narrator','印は、さっきまで立っていた場所から爆ぜる。二人は印の外で、いちど呼吸を合わせた。'],
      ['kephia','ちぇっ、よけるなよォ！ ボクの演出が台無しじゃないか！'],
    ]],
    sanctuary:['形を取る瘴気',[
      ['kephia','見て見て！ 笑い声が、ボクの形になっていく！ 腕が増えて、幕が翼になって……ああ、気持ちいい！'],
      ['narrator','瘴気が何本もの腕の形をとり、舞台の両端をふさいだ。中央に、最後の幕のための隙間だけが残る。'],
    ]],
    ending:['最後の二人へ',[
      ['kephia','もういい、もういいよ！ 遊びはおしまい！ 最後は、ボクがこの舞台そのものになってあげる！'],
      ['narrator','暗転が崩れた。袖で待っていた最後の二人が、名前を呼ばれる前に一歩、前へ出る。'],
    ]],
  }),
  pack(49,'終章 · 終幕',{
    opening:['終幕',[
      ['narrator','舞台が裂け、緞帳と仮面の柱がせり上がった。その頂で、六本の腕を広げたケフィアが笑っている。'],
      ['kephia','あーっはっはっは！ 見て、見て、見てェ！ これがボク！ この舞台では、ボクが神さまだァ！',FINAL],
      ['kephia','富も光も、拍手と同じ。鳴りやんだら、なんにも残らない。だったら最後に残るのは、ボクの笑い声だけでいいでしょ？',FINAL],
    ]],
    ruins:['三連',[
      ['narrator','輪、弾幕、突進が、間を置かずに続く。最後の二人は役割を入れかえず、決めた並びのまま三連を受けとめる。'],
      ['kephia','どうしてさ！ どうして壊れないの！ 一人ずつにしたのに、四つに分けたのに、どうして並んで立ってるのさ！',FINAL],
    ]],
    sanctuary:['白い光',[
      ['narrator','二人の一撃が、緞帳の柱を割った。中からこぼれた白い光が、出口までの床を静かに照らしている。'],
      ['kephia','……なに、その光。拍手にならない光なんて、ボク、知らない……。',FINAL],
    ]],
    ending:['笑いは、塔の中に残る',[
      ['kephia','あは……あはは……まだ笑ってるよ。ボク、まだ笑えてる。……でもさ、この声、塔の外までは、届かないみたい。'],
      ['narrator','ケフィアの体はほどけ、白い半仮面がひとつ、からっぽの舞台に落ちた。仮面は小さく笑い続けている。'],
      ['nyanluna','あなたの昔のことは、覚えておく。塔を塗りつぶしたことも、みんなを散らしたことも、いっしょに覚えておく。'],
      ['narrator','八人は仮面に拍手を送らずに、舞台を下りた。塔の出口の前で、八つの顔がそろう。'],
      ['hehereal','さあ、約束のごはん！ みんなで、いただきます！'],
      ['lumi','あしたは、村の門の金具をみんなで磨きます。……手伝ってくれますか？'],
      ['shizuku','コーラ一本でな。'],
      ['narrator','塔の光は、細く、ゆっくりと世界へ戻りはじめた。見上げる人は少ない。みんな、隣にいる誰かの顔を見ていた。'],
    ]],
  }),
]);

export const DARK_CHAPTERS=Object.freeze([
  Object.freeze({id:7,title:'散らされた光',summary:'ダークパレシスの笑い声で、八人はそれぞれの場所へ飛ばされた。第8章はにゃんるな、つきねこ、オムソロ、もちにゃふぇのソロクエスト。推奨Lv.80。クリアしても一人のまま。★4素材とLv.100への道が開く。',start:34,end:37}),
  Object.freeze({id:8,title:'それぞれの帰り道',summary:'雫、プリム、へへりある、るみが、飛ばされた場所で一人ずつ道をひらく。推奨Lv.80。この章もソロのまま。',start:38,end:41}),
  Object.freeze({id:9,title:'ダークパレシス',summary:'八人が麓で揃い、笑い声の主のもとへ塔を上る。出撃は二人。推奨Lv.90。各幕20%で、黄金のへへへの上位・瘴金のへへへが出現。',start:42,end:45}),
  Object.freeze({id:10,title:'終章・ケフィア',summary:'ケフィアとの四段階。先に、各段階へ立つ二人を決める。その順で開幕、幕間、暗転、最終形態を攻略する。最終形態を倒すとエンディング。',start:46,end:49}),
]);

export function emptyKephiaPairs(){return [[],[],[],[]];}
export function normalizeKephiaPairs(raw){
  const pairs=emptyKephiaPairs(),used=new Set();
  if(!Array.isArray(raw))return pairs;
  for(let phase=0;phase<4;phase++){
    const row=Array.isArray(raw[phase])?raw[phase]:[];
    for(const id of row){
      if(pairs[phase].length>=2||used.has(id)||!KEPHIA_HERO_NAMES[id])continue;
      used.add(id);pairs[phase].push(id);
    }
  }
  return pairs;
}
export function kephiaPairsReady(pairs){
  if(!Array.isArray(pairs)||pairs.length!==4)return false;
  const flat=pairs.flat();
  return pairs.every(row=>Array.isArray(row)&&row.length===2)&&new Set(flat).size===8&&flat.every(id=>KEPHIA_HERO_NAMES[id]);
}
export function kephiaPairForPhase(pairs,phase){
  const row=Array.isArray(pairs)?pairs[phase]:null;
  return Array.isArray(row)&&row.length===2&&row.every(id=>KEPHIA_HERO_NAMES[id])&&new Set(row).size===2?[...row]:[];
}
export function toggleKephiaHero(pairs,phase,heroId,{lockedPhases=new Set()}={}){
  const next=normalizeKephiaPairs(pairs).map(row=>[...row]);
  if(!Number.isInteger(phase)||phase<0||phase>3||!KEPHIA_HERO_NAMES[heroId]||lockedPhases.has(phase))return next;
  const from=next.findIndex(row=>row.includes(heroId));
  if(from>=0&&lockedPhases.has(from))return next;
  if(from===phase){next[phase]=next[phase].filter(id=>id!==heroId);return next;}
  if(next[phase].length>=2)return next;
  if(from>=0)next[from]=next[from].filter(id=>id!==heroId);
  next[phase].push(heroId);
  return next;
}
export function kephiaBoard(profile){
  const pairs=normalizeKephiaPairs(profile?.story?.kephiaPairs),ready=kephiaPairsReady(pairs);
  const locked=index=>profile?.story?.actClears?.[46+index]===true;
  const button=(phase,hero)=>{
    const owner=pairs.findIndex(row=>row.includes(hero.id));
    const disabled=locked(phase)||(owner>=0&&locked(owner));
    return `<button type="button" data-kephia-phase="${phase}" data-kephia-hero="${hero.id}" aria-pressed="${pairs[phase].includes(hero.id)}" ${disabled?'disabled':''}>${hero.name}</button>`;
  };
  return `<section class="kephia-board" aria-label="終章の配役"><header><h3>終章の配役</h3><p>${ready?'四組そろいました。この順で舞台へ出ます。':'八人を、二人ずつ四つの段階へ。クリアした段階の二人は固定されます。'}</p></header>${KEPHIA_PHASE_LABELS.map((label,phase)=>`<div class="kephia-pair"><strong>${label}</strong><span>${pairs[phase].map(id=>KEPHIA_HERO_NAMES[id]).join('・')||'未定'}</span><div>${ENDING_CREDITS.map(hero=>button(phase,hero)).join('')}</div></div>`).join('')}</section>`;
}
export function finaleMemberDialog(profile){
  return `<div class="modal-heading"><span class="eyebrow">FINAL CAST</span><h2>終章のメンバー</h2><p>八人を、二人ずつ四つの段階へ。第1幕から、この順で舞台に出ます。</p></div>${kephiaBoard(profile)}`;
}
