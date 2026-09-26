import {CHAPTER_FOUR_VOICE_MANIFEST} from './chapter-four-voice-manifest.js';
import {MOCHI_VOICE_MANIFEST} from './mochi-voice-manifest.js';
// Irodori-TTS v4-Small audio; openings and selected key scenes.
// v1.33: Nyanluna ribbon-promise dialogue retake using original and accepted references.
// v1.43: Tsukineko story/battle retakes from the same irodori-TTS reference, selected with local ASR and acoustic checks.
// v1.44: Tsukineko retakes use the user-approved blessing voice with scene-specific, warm conversational delivery.
// v1.45: All 35 Tsukineko clips use a new Irodori voice design with soft, bright and expressive delivery.
// v1.46: Measured battle loudness supports per-clip normalization before 50% playback. Removed Tsukineko damage grunt.
// v1.47: Tsukineko damage reaction retaken as a soft, cute ita; calibrated to the existing battle level.
export const VOICE_MANIFEST={...CHAPTER_FOUR_VOICE_MANIFEST,...MOCHI_VOICE_MANIFEST,
  "nyanluna-a4069723": {
    "file": "assets/voices/nyanluna/nyanluna-a4069723-47459080630d.mp3",
    "who": "nyanluna",
    "text": "わたしも！ もう、すごく心配したんだから。……お話は、こいつを止めてからね。",
    "duration": 7.58,
    "kind": "story"
  },
  "omsolo-dash-2": {
    "file": "assets/voices/omsolo/omsolo-dash-2-14d23c05923c.mp3",
    "who": "omsolo",
    "text": "甘い！",
    "duration": 0.79,
    "kind": "battle",
    "normalizationDb": -0.08
  },
  "narrator-6aa4c9b4": {
    "file": "assets/voices/narrator/narrator-6aa4c9b4.mp3",
    "who": "narrator",
    "text": "鉄鐘が砕け、穂守り砦の奥へ続く門が開いた。静けさの中、かすれた声が一度だけ聞こえた。",
    "duration": 10.53,
    "kind": "story"
  },
  "nyanluna-hurt-1": {
    "file": "assets/voices/nyanluna/nyanluna-hurt-1-9ebcbe8713e7.mp3",
    "who": "nyanluna",
    "text": "いたっ！",
    "duration": 1.44,
    "kind": "battle",
    "normalizationDb": 1.19
  },
  "narrator-465249cc": {
    "file": "assets/voices/narrator/narrator-465249cc.mp3",
    "who": "narrator",
    "text": "月の道の先は、おむすびたちが暮らす「穂むすびの国」。金色の棚田を歩く二人の前に、青いかばんの小さな猫が泣きながら走ってきた。",
    "duration": 13.23,
    "kind": "story"
  },
  "narrator-ef65a25": {
    "file": "assets/voices/narrator/narrator-ef65a25.mp3",
    "who": "narrator",
    "text": "二人は、もう一度しっかりと手をつないだ。つきねこと自由に編成できるようになった。元の世界への旅は、ここから二人で。――第1章、おわり。",
    "duration": 14.08,
    "kind": "story"
  },
  "nyanluna-lowhp-1": {
    "file": "assets/voices/nyanluna/nyanluna-lowhp-1-630f36f9b6db.mp3",
    "who": "nyanluna",
    "text": "少し、距離をとろう……！",
    "duration": 2.23,
    "kind": "battle",
    "normalizationDb": -0.06
  },
  "tsukineko-heal-1": {
    "file": "assets/voices/tsukineko/tsukineko-heal-1-7f64150a65b2.mp3",
    "who": "tsukineko",
    "text": "助かった。まだまだ行けるよ！",
    "duration": 3.72,
    "kind": "battle",
    "normalizationDb": 0.41
  },
  "tsukineko-3e85bbd1": {
    "file": "assets/voices/tsukineko/tsukineko-3e85bbd1-9ffc05904b13.mp3",
    "who": "tsukineko",
    "text": "うん。だから今は動かないで。にゃんるな、結界は持ちそう？",
    "duration": 6.46,
    "kind": "story"
  },
  "omsolo-attack-2": {
    "file": "assets/voices/omsolo/omsolo-attack-2-ffebecf53a12.mp3",
    "who": "omsolo",
    "text": "そこだ！",
    "duration": 0.8,
    "kind": "battle",
    "normalizationDb": -0.05
  },
  "nyanluna-levelup-1": {
    "file": "assets/voices/nyanluna/nyanluna-levelup-1-00e472b71119.mp3",
    "who": "nyanluna",
    "text": "また一つ、強くなれたね！",
    "duration": 2.56,
    "kind": "battle",
    "normalizationDb": -0.06
  },
  "omsolo-lowhp-1": {
    "file": "assets/voices/omsolo/omsolo-lowhp-1.mp3",
    "who": "omsolo",
    "text": "少し、息を整えよう……。",
    "duration": 3.48,
    "kind": "battle",
    "normalizationDb": -1.12
  },
  "omsolo-switch-2": {
    "file": "assets/voices/omsolo/omsolo-switch-2-53b060f4333d.mp3",
    "who": "omsolo",
    "text": "あとは、任せてくれ！",
    "duration": 1.7,
    "kind": "battle",
    "normalizationDb": -0.05
  },
  "tsukineko-levelup-2": {
    "file": "assets/voices/tsukineko/tsukineko-levelup-2-0956c91e621e.mp3",
    "who": "tsukineko",
    "text": "また強くなったよ。頼りにしてね！",
    "duration": 3.76,
    "kind": "battle",
    "normalizationDb": 0.41
  },
  "nyanluna-dash-1": {
    "file": "assets/voices/nyanluna/nyanluna-dash-1-3dc078018f42.mp3",
    "who": "nyanluna",
    "text": "こっちだよ！",
    "duration": 0.72,
    "kind": "battle",
    "normalizationDb": -0.08
  },
  "tsukineko-wave-1": {
    "file": "assets/voices/tsukineko/tsukineko-wave-1-a0698d8480fe.mp3",
    "who": "tsukineko",
    "text": "次が来る。周りも見てね！",
    "duration": 3.44,
    "kind": "battle",
    "normalizationDb": 0.4
  },
  "nyanluna-equip-1": {
    "file": "assets/voices/nyanluna/nyanluna-equip-1-26b2caca2554.mp3",
    "who": "nyanluna",
    "text": "新しい相棒だね。よろしく！",
    "duration": 2.92,
    "kind": "battle",
    "normalizationDb": -0.05
  },
  "tsukineko-ultimate-1": {
    "file": "assets/voices/tsukineko/tsukineko-ultimate-1-d5821d60ada6.mp3",
    "who": "tsukineko",
    "text": "この一撃で、道をひらく！ 星銃、彗星連射！",
    "duration": 6.56,
    "kind": "battle",
    "normalizationDb": 0.41
  },
  "omsolo-attack-3": {
    "file": "assets/voices/omsolo/omsolo-attack-3-4e8bf40e6f55.mp3",
    "who": "omsolo",
    "text": "退けっ！",
    "duration": 0.8,
    "kind": "battle",
    "normalizationDb": 0.26
  },
  "nyanluna-start-1": {
    "file": "assets/voices/nyanluna/nyanluna-start-1-e1b6029d3873.mp3",
    "who": "nyanluna",
    "text": "月の灯りを探しに、出発！",
    "duration": 3.21,
    "kind": "battle",
    "normalizationDb": -1.33
  },
  "omsolo-levelup-1": {
    "file": "assets/voices/omsolo/omsolo-levelup-1.mp3",
    "who": "omsolo",
    "text": "腕が戻ってきたな。まだ、強くなれる。",
    "duration": 3.68,
    "kind": "battle",
    "normalizationDb": -1.37
  },
  "nyanluna-df12363a": {
    "file": "assets/voices/nyanluna/nyanluna-df12363a-8079bf08b49f.mp3",
    "who": "nyanluna",
    "text": "つきねこ……？ さっきまで、手をつないでいたのに。",
    "duration": 4.82,
    "kind": "story"
  },
  "omsolo-equip-1": {
    "file": "assets/voices/omsolo/omsolo-equip-1.mp3",
    "who": "omsolo",
    "text": "よし。手によく馴染む。",
    "duration": 3.28,
    "kind": "battle",
    "normalizationDb": -2.48
  },
  "tsukineko-boss-1": {
    "file": "assets/voices/tsukineko/tsukineko-boss-1-cf6588a5c207.mp3",
    "who": "tsukineko",
    "text": "大物だね。弱点を見つけよう！",
    "duration": 3.78,
    "kind": "battle",
    "normalizationDb": 0.41
  },
  "omsolo-start-1": {
    "file": "assets/voices/omsolo/omsolo-start-1.mp3",
    "who": "omsolo",
    "text": "道は私が切りひらこう。出発だ！",
    "duration": 3.8,
    "kind": "battle",
    "normalizationDb": -1.08
  },
  "omsolo-hurt-2": {
    "file": "assets/voices/omsolo/omsolo-hurt-2-9c75fd56d4e3.mp3",
    "who": "omsolo",
    "text": "まだだ！",
    "duration": 0.8,
    "kind": "battle",
    "normalizationDb": -0.03
  },
  "tsukineko-down-1": {
    "file": "assets/voices/tsukineko/tsukineko-down-1-31a1df5784e3.mp3",
    "who": "tsukineko",
    "text": "ごめん……先に、行って……。",
    "duration": 3.48,
    "kind": "battle",
    "normalizationDb": -0.0106
  },
  "nyanluna-switch-1": {
    "file": "assets/voices/nyanluna/nyanluna-switch-1-f90cae724632.mp3",
    "who": "nyanluna",
    "text": "わたしに任せて！",
    "duration": 1.18,
    "kind": "battle",
    "normalizationDb": -0.04
  },
  "omsolo-exit-1": {
    "file": "assets/voices/omsolo/omsolo-exit-1.mp3",
    "who": "omsolo",
    "text": "道がひらけた。進もう。",
    "duration": 3.76,
    "kind": "battle",
    "normalizationDb": -1.48
  },
  "nyanluna-attack-1": {
    "file": "assets/voices/nyanluna/nyanluna-attack-1-b40d26569bb1.mp3",
    "who": "nyanluna",
    "text": "それっ！",
    "duration": 0.69,
    "kind": "battle",
    "normalizationDb": -0.103
  },
  "tsukineko-support-1": {
    "file": "assets/voices/tsukineko/tsukineko-support-1-0a775ebf7bd1.mp3",
    "who": "tsukineko",
    "text": "背中は、わたしが守る！",
    "duration": 3.6,
    "kind": "battle",
    "normalizationDb": 0.1094
  },
  "nyanluna-d6d6edc9": {
    "file": "assets/voices/nyanluna/nyanluna-d6d6edc9-fec2ca0c40ff.mp3",
    "who": "nyanluna",
    "text": "わたしはにゃんるな。月の灯りを探しに行く前に、一緒に動いてみよう！ ここではダメージを受けないから、ゆっくりで大丈夫。",
    "duration": 9.54,
    "kind": "tutorial"
  },
  "nyanluna-treasure-1": {
    "file": "assets/voices/nyanluna/nyanluna-treasure-1-1d1d23e929ce.mp3",
    "who": "nyanluna",
    "text": "見て！ 特別な宝物だよ！",
    "duration": 2.87,
    "kind": "battle",
    "normalizationDb": -0.05
  },
  "nyanluna-blessing-1": {
    "file": "assets/voices/nyanluna/nyanluna-blessing-1-8c4274e8b166.mp3",
    "who": "nyanluna",
    "text": "この光、力を貸してね！",
    "duration": 2.78,
    "kind": "battle",
    "normalizationDb": -0.07
  },
  "nyanluna-recruit-1": {
    "file": "assets/voices/nyanluna/nyanluna-recruit-1-673e63b89f53.mp3",
    "who": "nyanluna",
    "text": "一緒に行こう！ きっと楽しい旅になるよ。",
    "duration": 3.57,
    "kind": "battle",
    "normalizationDb": -0.06
  },
  "komusubi-2af428d": {
    "file": "assets/voices/komusubi/komusubi-2af428d.mp3",
    "who": "komusubi",
    "text": "お父さん！ お父さん……っ！ ぼく、ちゃんと助けを呼べたよ……！",
    "duration": 6.51,
    "kind": "story"
  },
  "omsolo-victory-1": {
    "file": "assets/voices/omsolo/omsolo-victory-1-56fe8d9eca56.mp3",
    "who": "omsolo",
    "text": "よくやった。皆、無事か？",
    "duration": 3.28,
    "kind": "battle",
    "normalizationDb": -0.06
  },
  "nyanluna-defeat-1": {
    "file": "assets/voices/nyanluna/nyanluna-defeat-1-862516f90e52.mp3",
    "who": "nyanluna",
    "text": "まだ、あきらめない。また、挑戦しよう。",
    "duration": 3.69,
    "kind": "battle",
    "normalizationDb": -0.92
  },
  "narrator-585bc08": {
    "file": "assets/voices/narrator/narrator-585bc08.mp3",
    "who": "narrator",
    "text": "その頭上で、蹂躙の巨神ヴォルガントが腕を持ち上げる。二人は残る魔物を退け、最後の距離を駆け抜けた。",
    "duration": 11.61,
    "kind": "story"
  },
  "tsukineko-d60b3e1": {
    "file": "assets/voices/tsukineko/tsukineko-d60b3e1-c9d30bc063bb.mp3",
    "who": "tsukineko",
    "text": "二人とも、よかった……。もう、離れなくていいね。",
    "duration": 5,
    "kind": "story"
  },
  "nyanluna-heal-1": {
    "file": "assets/voices/nyanluna/nyanluna-heal-1-88ff53dfb3c7.mp3",
    "who": "nyanluna",
    "text": "ほっとした。もう大丈夫！",
    "duration": 2.83,
    "kind": "battle",
    "normalizationDb": -0.08
  },
  "nyanluna-80e6eae7": {
    "file": "assets/voices/nyanluna/nyanluna-80e6eae7-08e56b1ba56c.mp3",
    "who": "nyanluna",
    "text": "上手！ 次は右下の「回避」を押してみよう。赤い攻撃予告が見えたら、すっと外へ逃げるの。",
    "duration": 8.14,
    "kind": "tutorial"
  },
  "omsolo-5fa87c23": {
    "file": "assets/voices/omsolo/omsolo-5fa87c23.mp3",
    "who": "omsolo",
    "text": "ああ。よくがんばったな、こむすび。お前の声が、私をここまで連れ戻してくれた。",
    "duration": 7.24,
    "kind": "story"
  },
  "tsukineko-attack-2": {
    "file": "assets/voices/tsukineko/tsukineko-attack-2-f348d9bbb08a.mp3",
    "who": "tsukineko",
    "text": "狙い通り！",
    "duration": 1.23,
    "kind": "battle",
    "normalizationDb": 0.37
  },
  "tsukineko-58b9bfe9": {
    "file": "assets/voices/tsukineko/tsukineko-58b9bfe9-28c6fa3e7e2b.mp3",
    "who": "tsukineko",
    "text": "うん。道がなかったら、一緒に探そう。約束ね。",
    "duration": 5.46,
    "kind": "story"
  },
  "tsukineko-switch-2": {
    "file": "assets/voices/tsukineko/tsukineko-switch-2-4708a15ad484.mp3",
    "who": "tsukineko",
    "text": "任せて。前に出るよ！",
    "duration": 3.44,
    "kind": "battle",
    "normalizationDb": 0.12
  },
  "narrator-b7b3e182": {
    "file": "assets/voices/narrator/narrator-b7b3e182.mp3",
    "who": "narrator",
    "text": "穂守りの大広場。倒れた米蔵の柱にもたれ、オムソロがかすかに息をしていた。光刃はもう消え、剣を握る手にも力がない。",
    "duration": 13.74,
    "kind": "story"
  },
  "tsukineko-dash-1": {
    "file": "assets/voices/tsukineko/tsukineko-dash-1-9d2f10c2ed9a.mp3",
    "who": "tsukineko",
    "text": "遅いよ！",
    "duration": 0.99,
    "kind": "battle",
    "normalizationDb": 0.42
  },
  "nyanluna-wave-1": {
    "file": "assets/voices/nyanluna/nyanluna-wave-1-9ef5c7e72537.mp3",
    "who": "nyanluna",
    "text": "次の魔物が来るよ。気をつけて！",
    "duration": 2.88,
    "kind": "battle",
    "normalizationDb": -0.05
  },
  "tsukineko-241cff32": {
    "file": "assets/voices/tsukineko/tsukineko-241cff32-63312e44afc0.mp3",
    "who": "tsukineko",
    "text": "置いてきたんじゃない。助けを呼びに来てくれたんだよ。にゃんるな、行こう。",
    "duration": 6.19,
    "kind": "story"
  },
  "tsukineko-attack-3": {
    "file": "assets/voices/tsukineko/tsukineko-attack-3-814b02a5a02d.mp3",
    "who": "tsukineko",
    "text": "当てるよ！",
    "duration": 0.68,
    "kind": "battle",
    "normalizationDb": -0.55
  },
  "komusubi-f59f414f": {
    "file": "assets/voices/komusubi/komusubi-f59f414f.mp3",
    "who": "komusubi",
    "text": "お父さん、もう立てなかったのに、ぼくだけ道の向こうに逃がしてくれた。「振り向かずに走れ」って……。ぼく、置いてきちゃった……！",
    "duration": 11.65,
    "kind": "story"
  },
  "komusubi-85ab1227": {
    "file": "assets/voices/komusubi/komusubi-85ab1227.mp3",
    "who": "komusubi",
    "text": "大きな敵に追いかけられて……お父さんが光る剣で助けてくれたんだ。でも、後ろからもっと大きな腕が来て……。",
    "duration": 9.83,
    "kind": "story"
  },
  "nyanluna-d1c8fd1b": {
    "file": "assets/voices/nyanluna/nyanluna-d1c8fd1b-643c39510050.mp3",
    "who": "nyanluna",
    "text": "画面の空いている所を指でドラッグしてみて。指を動かした方向へ歩けるよ！",
    "duration": 6.4,
    "kind": "tutorial"
  },
  "nyanluna-boss-1": {
    "file": "assets/voices/nyanluna/nyanluna-boss-1-aef122d5d87a.mp3",
    "who": "nyanluna",
    "text": "強い気配……。落ち着いて、動きを見よう！",
    "duration": 4.11,
    "kind": "battle",
    "normalizationDb": -4.37
  },
  "omsolo-recruit-1": {
    "file": "assets/voices/omsolo/omsolo-recruit-1.mp3",
    "who": "omsolo",
    "text": "この恩は、旅で返そう。よろしく頼む。",
    "duration": 3.68,
    "kind": "battle",
    "normalizationDb": -1.58
  },
  "nyanluna-7438262c": {
    "file": "assets/voices/nyanluna/nyanluna-7438262c-5965ac81d1db.mp3",
    "who": "nyanluna",
    "text": "あわてない。つきねこなら、きっと大丈夫。二人で帰るって決めたんだから。まずは、あの門まで行ってみよう。",
    "duration": 9.42,
    "kind": "story"
  },
  "nyanluna-down-1": {
    "file": "assets/voices/nyanluna/nyanluna-down-1-d8c32e665638.mp3",
    "who": "nyanluna",
    "text": "ごめん……あとは、お願い……。",
    "duration": 3.22,
    "kind": "battle",
    "normalizationDb": -0.8
  },
  "tsukineko-34c8da3e": {
    "file": "assets/voices/tsukineko/tsukineko-34c8da3e-492be5939bcb.mp3",
    "who": "tsukineko",
    "text": "間に合う。絶対に、間に合わせる！",
    "duration": 4.27,
    "kind": "story"
  },
  "nyanluna-427f9300": {
    "file": "assets/voices/nyanluna/nyanluna-427f9300-39658f7d7f02.mp3",
    "who": "nyanluna",
    "text": "月のボタンが100%になったら、わたしの必殺技「月華の聖域」！ 魔物をすべて倒したら、光る月の門へ進もう。準備はできた？ 一緒に月明かりを取り戻そう！",
    "duration": 14.24,
    "kind": "tutorial"
  },
  "omsolo-blessing-1": {
    "file": "assets/voices/omsolo/omsolo-blessing-1-3247167157ba.mp3",
    "who": "omsolo",
    "text": "温かな光だ。ありがたく借りるぞ。",
    "duration": 3.36,
    "kind": "battle",
    "normalizationDb": -0.06
  },
  "nyanluna-victory-1": {
    "file": "assets/voices/nyanluna/nyanluna-victory-1-98dd6941e7a4.mp3",
    "who": "nyanluna",
    "text": "やったね！ みんな、ありがとう！",
    "duration": 3.25,
    "kind": "battle",
    "normalizationDb": -0.05
  },
  "narrator-3e075149": {
    "file": "assets/voices/narrator/narrator-3e075149.mp3",
    "who": "narrator",
    "text": "巨腕が振り下ろされる、その瞬間。にゃんるなの月の結界が間に入り、つきねこの弾が拳をはじいた。崩れ落ちる石の向こうに、二人が立つ。",
    "duration": 14.47,
    "kind": "story"
  },
  "omsolo-treasure-1": {
    "file": "assets/voices/omsolo/omsolo-treasure-1.mp3",
    "who": "omsolo",
    "text": "旅の役に立ちそうだな。",
    "duration": 3.2,
    "kind": "battle",
    "normalizationDb": -1.65
  },
  "tsukineko-victory-2": {
    "file": "assets/voices/tsukineko/tsukineko-victory-2-880ba4ed78ca.mp3",
    "who": "tsukineko",
    "text": "二人なら、ちゃんと越えられるね！",
    "duration": 3.44,
    "kind": "battle",
    "normalizationDb": 0.4
  },
  "tsukineko-lowhp-1": {
    "file": "assets/voices/tsukineko/tsukineko-lowhp-1-f0ae2b5c70d6.mp3",
    "who": "tsukineko",
    "text": "ちょっと、立て直そう……！",
    "duration": 3.15,
    "kind": "battle",
    "normalizationDb": 0.39
  },
  "omsolo-heal-1": {
    "file": "assets/voices/omsolo/omsolo-heal-1.mp3",
    "who": "omsolo",
    "text": "ありがとう。力が戻ってきた。",
    "duration": 3.96,
    "kind": "battle",
    "normalizationDb": -2.74
  },
  "tsukineko-blessing-1": {
    "file": "assets/voices/tsukineko/tsukineko-blessing-1-2fff0fbff2eb.mp3",
    "who": "tsukineko",
    "text": "この力、使いこなしてみせる！",
    "duration": 3.64,
    "kind": "battle",
    "normalizationDb": 0.16
  },
  "nyanluna-victory-2": {
    "file": "assets/voices/nyanluna/nyanluna-victory-2-228f7e7b4b36.mp3",
    "who": "nyanluna",
    "text": "この先へ、一緒に進もう！",
    "duration": 2.69,
    "kind": "battle",
    "normalizationDb": -0.04
  },
  "tsukineko-treasure-1": {
    "file": "assets/voices/tsukineko/tsukineko-treasure-1-a4b3be9d6138.mp3",
    "who": "tsukineko",
    "text": "いいもの見つけた。持って帰ろう！",
    "duration": 3.55,
    "kind": "battle",
    "normalizationDb": 0.4
  },
  "nyanluna-b317d4f2": {
    "file": "assets/voices/nyanluna/nyanluna-b317d4f2-3a95af172181.mp3",
    "who": "nyanluna",
    "text": "わたしも。帰り道はまだ先みたいだけど、二人なら大丈夫。いつも、そうだったでしょ？",
    "duration": 7.84,
    "kind": "story"
  },
  "tsukineko-victory-1": {
    "file": "assets/voices/tsukineko/tsukineko-victory-1-26f29d5e57f1.mp3",
    "who": "tsukineko",
    "text": "やった！ わたしたちの勝ちだね。",
    "duration": 3.73,
    "kind": "battle",
    "normalizationDb": 0.4
  },
  "tsukineko-55b9f93b": {
    "file": "assets/voices/tsukineko/tsukineko-55b9f93b-3f71f03fb9ee.mp3",
    "who": "tsukineko",
    "text": "やっと隣に戻れた。……もう、はぐれたくない。",
    "duration": 4.94,
    "kind": "story"
  },
  "omsolo-defeat-1": {
    "file": "assets/voices/omsolo/omsolo-defeat-1.mp3",
    "who": "omsolo",
    "text": "生きていれば、やり直せる。次は、必ず。",
    "duration": 4.24,
    "kind": "battle",
    "normalizationDb": -1.01
  },
  "narrator-ecdb6400": {
    "file": "assets/voices/narrator/narrator-ecdb6400.mp3",
    "who": "narrator",
    "text": "守護者の影の前で、銃を構えたつきねこが膝をついていた。出口を探し、たどり着いた同じ場所。二人はようやく顔を見合わせた。",
    "duration": 13.9,
    "kind": "story"
  },
  "tsukineko-62307a56": {
    "file": "assets/voices/tsukineko/tsukineko-62307a56-2f8c9675ffce.mp3",
    "who": "tsukineko",
    "text": "うん。いつもどおり、にゃんるなが光でひらいて、わたしが狙う。背中、任せて！",
    "duration": 8.6,
    "kind": "story"
  },
  "tsukineko-dash-2": {
    "file": "assets/voices/tsukineko/tsukineko-dash-2-ac00f98831ee.mp3",
    "who": "tsukineko",
    "text": "かわす！",
    "duration": 0.85,
    "kind": "battle",
    "normalizationDb": 0.39
  },
  "narrator-e2da479b": {
    "file": "assets/voices/narrator/narrator-e2da479b.mp3",
    "who": "narrator",
    "text": "最後の光を門へ届けると、守護者の腕がほどけた。月が空へ昇り、島々をつなぐ銀色の道が戻ってくる。",
    "duration": 12.08,
    "kind": "story"
  },
  "omsolo_hurt-cef2544d": {
    "file": "assets/voices/omsolo_hurt/omsolo_hurt-cef2544d.mp3",
    "who": "omsolo_hurt",
    "text": "こむすび……どうか、遠くへ……。",
    "duration": 3.56,
    "kind": "story"
  },
  "nyanluna-bc4aa11b": {
    "file": "assets/voices/nyanluna/nyanluna-bc4aa11b-04c9625f6297.mp3",
    "who": "nyanluna",
    "text": "つきねこっ！ 伏せて！",
    "duration": 2.08,
    "kind": "story"
  },
  "omsolo-down-1": {
    "file": "assets/voices/omsolo/omsolo-down-1-c2d5f0a80c2b.mp3",
    "who": "omsolo",
    "text": "すまない……守りきれなかった……。",
    "duration": 4.16,
    "kind": "battle",
    "normalizationDb": -0.17
  },
  "omsolo_hurt-f5f32848": {
    "file": "assets/voices/omsolo_hurt/omsolo_hurt-f5f32848-886380ca779a.mp3",
    "who": "omsolo_hurt",
    "text": "あの子が……無事、なのか……。",
    "duration": 4.8,
    "kind": "story"
  },
  "tsukineko-exit-1": {
    "file": "assets/voices/tsukineko/tsukineko-exit-1-4973d63c3864.mp3",
    "who": "tsukineko",
    "text": "出口が開いたよ。先へ進もう！",
    "duration": 3.62,
    "kind": "battle",
    "normalizationDb": 0.38
  },
  "tsukineko-55e7d668": {
    "file": "assets/voices/tsukineko/tsukineko-55e7d668-15ac5186a932.mp3",
    "who": "tsukineko",
    "text": "にゃんるな……！ ずっと探してた！ 出口に行けば会えるかもって……でも、こいつが強くて。",
    "duration": 9.48,
    "kind": "story"
  },
  "nyanluna-18e6bf0f": {
    "file": "assets/voices/nyanluna/nyanluna-18e6bf0f-511ba1882150.mp3",
    "who": "nyanluna",
    "text": "つきねこが結んでくれたリボン……。なくしたと思ってた。",
    "duration": 4.42,
    "kind": "story"
  },
  "tsukineko-attack-1": {
    "file": "assets/voices/tsukineko/tsukineko-attack-1-90966afb20ea.mp3",
    "who": "tsukineko",
    "text": "そこっ！",
    "duration": 0.85,
    "kind": "battle",
    "normalizationDb": 0.41
  },
  "narrator-ba772d7c": {
    "file": "assets/voices/narrator/narrator-ba772d7c.mp3",
    "who": "narrator",
    "text": "途切れた橋の根元に、細い糸が引っかかっていた。落ちるときに切れた、にゃんるなのリボンだった。",
    "duration": 8.95,
    "kind": "story"
  },
  "omsolo-680db707": {
    "file": "assets/voices/omsolo/omsolo-680db707.mp3",
    "who": "omsolo",
    "text": "この恩は、これからの旅で返させてくれ。遠くからの攻撃は君たちに任せる。近づく敵は、私の光刃で食い止めよう。",
    "duration": 10.44,
    "kind": "story"
  },
  "narrator-950ab34": {
    "file": "assets/voices/narrator/narrator-950ab34.mp3",
    "who": "narrator",
    "text": "月光の一撃が迫る影をはじく。つきねこは目を見開き、それから、泣きそうな顔で笑った。",
    "duration": 10.05,
    "kind": "story"
  },
  "narrator-89af3168": {
    "file": "assets/voices/narrator/narrator-89af3168.mp3",
    "who": "narrator",
    "text": "月の結界がオムソロを包む。残された時間は180秒。巨腕と衝撃波をかわし、命の灯りが消える前に決着をつけよう。",
    "duration": 14.18,
    "kind": "story"
  },
  "nyanluna-e603140e": {
    "file": "assets/voices/nyanluna/nyanluna-e603140e-3c8967b7532d.mp3",
    "who": "nyanluna",
    "text": "もちろん。二人で迷い込んだんだもん。帰るときも、絶対に一緒だよ！",
    "duration": 6.51,
    "kind": "story"
  },
  "tsukineko-switch-1": {
    "file": "assets/voices/tsukineko/tsukineko-switch-1-b73ced0d1d09.mp3",
    "who": "tsukineko",
    "text": "ここからは、わたしの番！",
    "duration": 3.75,
    "kind": "battle",
    "normalizationDb": 0.22
  },
  "nyanluna-9e40c289": {
    "file": "assets/voices/nyanluna/nyanluna-9e40c289-8f89f597f67a.mp3",
    "who": "nyanluna",
    "text": "あの魔法の的を見て。近くの敵には自動で攻撃するよ。攻撃ボタンはなくて大丈夫、移動と回避に集中してね！",
    "duration": 9.73,
    "kind": "tutorial"
  },
  "omsolo-wave-1": {
    "file": "assets/voices/omsolo/omsolo-wave-1.mp3",
    "who": "omsolo",
    "text": "来るぞ。構えを崩すな！",
    "duration": 3.6,
    "kind": "battle",
    "normalizationDb": -3.42
  },
  "tsukineko-start-1": {
    "file": "assets/voices/tsukineko/tsukineko-start-1-e1f117605f0f.mp3",
    "who": "tsukineko",
    "text": "準備できたよ。さあ、行こう！",
    "duration": 3.7,
    "kind": "battle",
    "normalizationDb": 0.4
  },
  "tsukineko-equip-1": {
    "file": "assets/voices/tsukineko/tsukineko-equip-1-1c2b6e8e91e5.mp3",
    "who": "tsukineko",
    "text": "いい重さ。狙いが定まりそう！",
    "duration": 3.7,
    "kind": "battle",
    "normalizationDb": 0.29
  },
  "tsukineko-recruit-1": {
    "file": "assets/voices/tsukineko/tsukineko-recruit-1-72fb7c67cb2d.mp3",
    "who": "tsukineko",
    "text": "これからは一緒だよ。よろしくね！",
    "duration": 3.66,
    "kind": "battle",
    "normalizationDb": 0.38
  },
  "omsolo-boss-1": {
    "file": "assets/voices/omsolo/omsolo-boss-1.mp3",
    "who": "omsolo",
    "text": "大きいだけでは、私たちは止められん！",
    "duration": 3.48,
    "kind": "battle",
    "normalizationDb": -1.71
  },
  "omsolo-victory-2": {
    "file": "assets/voices/omsolo/omsolo-victory-2.mp3",
    "who": "omsolo",
    "text": "これで、安心して帰れるな。",
    "duration": 3.12,
    "kind": "battle",
    "normalizationDb": -1.72
  },
  "omsolo-2f3a0270": {
    "file": "assets/voices/omsolo/omsolo-2f3a0270.mp3",
    "who": "omsolo",
    "text": "……あたたかいな。君たちが、あの子と、この国を守ってくれたのか。ありがとう。",
    "duration": 8,
    "kind": "story"
  },
  "guardian-80a34dc": {
    "file": "assets/voices/guardian/guardian-80a34dc.mp3",
    "who": "guardian",
    "text": "ひとりで守ろうとして……道を、閉ざしていたのか。ありがとう。小さな旅人たち。",
    "duration": 9.68,
    "kind": "story"
  },
  "nyanluna-4843c41": {
    "file": "assets/voices/nyanluna/nyanluna-4843c41-ed537bd29fbc.mp3",
    "who": "nyanluna",
    "text": "少しだけなら。でも、早く手当てしないと……！ 結界が消える前に、巨神を止めよう！",
    "duration": 7.87,
    "kind": "story"
  },
  "nyanluna-switch-2": {
    "file": "assets/voices/nyanluna/nyanluna-switch-2-579d5fbdc20c.mp3",
    "who": "nyanluna",
    "text": "うん、交代だね！",
    "duration": 1.58,
    "kind": "battle",
    "normalizationDb": -0.07
  },
  "nyanluna-attack-2": {
    "file": "assets/voices/nyanluna/nyanluna-attack-2-a20df439576b.mp3",
    "who": "nyanluna",
    "text": "光よ！",
    "duration": 0.66,
    "kind": "battle",
    "normalizationDb": -0.07
  },
  "narrator-b3a71b84": {
    "file": "assets/voices/narrator/narrator-b3a71b84.mp3",
    "who": "narrator",
    "text": "落ちる途中で光の流れが分かれた。目を覚ましたにゃんるなの隣に、親友の姿はない。空には欠けた月と、浮かぶ島々。",
    "duration": 13.43,
    "kind": "story"
  },
  "nyanluna-support-1": {
    "file": "assets/voices/nyanluna/nyanluna-support-1-67e607b534d3.mp3",
    "who": "nyanluna",
    "text": "こっちから援護するよ！",
    "duration": 1.25,
    "kind": "battle",
    "normalizationDb": -0.06
  },
  "narrator-eac8ec41": {
    "file": "assets/voices/narrator/narrator-eac8ec41.mp3",
    "who": "narrator",
    "text": "巨神が倒れ、穂むすびの国に静けさが戻った。にゃんるなはオムソロのそばへ膝をつき、残った月の光を傷に重ねた。",
    "duration": 11.79,
    "kind": "story"
  },
  "nyanluna-dash-2": {
    "file": "assets/voices/nyanluna/nyanluna-dash-2-7380951f0e7b.mp3",
    "who": "nyanluna",
    "text": "よっと！",
    "duration": 0.77,
    "kind": "battle",
    "normalizationDb": -0.01
  },
  "tsukineko-defeat-1": {
    "file": "assets/voices/tsukineko/tsukineko-defeat-1-049fb796ed2e.mp3",
    "who": "tsukineko",
    "text": "次は負けない。もう一度、作戦を立てよう。",
    "duration": 4.68,
    "kind": "battle",
    "normalizationDb": 0.4
  },
  "narrator-ef04c0b0": {
    "file": "assets/voices/narrator/narrator-ef04c0b0.mp3",
    "who": "narrator",
    "text": "にゃんるなとつきねこは、昔から大の仲良し。いつもの帰り道、不思議な月の光をのぞき込んだ二人は、一緒に見知らぬ世界へ落ちてしまった。",
    "duration": 14.23,
    "kind": "story"
  },
  "omsolo-ultimate-1": {
    "file": "assets/voices/omsolo/omsolo-ultimate-1.mp3",
    "who": "omsolo",
    "text": "守ると決めた、この光で！ 翠光、守り手の円舞！",
    "duration": 5.44,
    "kind": "battle",
    "normalizationDb": -1.4
  },
  "nyanluna-b7cb30ca": {
    "file": "assets/voices/nyanluna/nyanluna-b7cb30ca-00814e55e6ba.mp3",
    "who": "nyanluna",
    "text": "「ほどけても結び直せばいい」って、いつも言ってたよね。うん。離れても、また会える。",
    "duration": 8.88,
    "kind": "story"
  },
  "omsolo-levelup-2": {
    "file": "assets/voices/omsolo/omsolo-levelup-2.mp3",
    "who": "omsolo",
    "text": "この力で、皆を守ろう。",
    "duration": 3,
    "kind": "battle",
    "normalizationDb": -1.44
  },
  "nyanluna-f7d99e6f": {
    "file": "assets/voices/nyanluna/nyanluna-f7d99e6f-bfd0c2c83072.mp3",
    "who": "nyanluna",
    "text": "聞こえた！ つきねこ、あっち！",
    "duration": 2.77,
    "kind": "story"
  },
  "omsolo-hurt-1": {
    "file": "assets/voices/omsolo/omsolo-hurt-1-3e9f1430d909.mp3",
    "who": "omsolo",
    "text": "ぐっ！",
    "duration": 0.5,
    "kind": "battle",
    "normalizationDb": 0.0
  },
  "nyanluna-exit-1": {
    "file": "assets/voices/nyanluna/nyanluna-exit-1-1c963b509a75.mp3",
    "who": "nyanluna",
    "text": "月の門が開いたよ！",
    "duration": 2.01,
    "kind": "battle",
    "normalizationDb": -0.05
  },
  "nyanluna-81da10c": {
    "file": "assets/voices/nyanluna/nyanluna-81da10c-f99784fd8171.mp3",
    "who": "nyanluna",
    "text": "間に合った……！ オムソロさん、もう大丈夫。こむすびが、わたしたちを呼んでくれたの。",
    "duration": 7.32,
    "kind": "story"
  },
  "nyanluna-ultimate-1": {
    "file": "assets/voices/nyanluna/nyanluna-ultimate-1-7f55680bdb51.mp3",
    "who": "nyanluna",
    "text": "月の光よ、みんなを守って！ 月華の聖域！",
    "duration": 5.22,
    "kind": "battle",
    "normalizationDb": -0.07
  },
  "omsolo-attack-1": {
    "file": "assets/voices/omsolo/omsolo-attack-1-ef1671171fb6.mp3",
    "who": "omsolo",
    "text": "はっ！",
    "duration": 0.5,
    "kind": "battle",
    "normalizationDb": -0.1
  },
  "nyanluna-levelup-2": {
    "file": "assets/voices/nyanluna/nyanluna-levelup-2-61415f67e98d.mp3",
    "who": "nyanluna",
    "text": "もっと、みんなの力になれる！",
    "duration": 2.96,
    "kind": "battle",
    "normalizationDb": -0.07
  },
  "komusubi-68b175da": {
    "file": "assets/voices/komusubi/komusubi-68b175da.mp3",
    "who": "komusubi",
    "text": "うっ……ひっく……。おねえちゃんたち、たすけて。ぼく、こむすび。お父さんが……オムソロが、まだ、あそこに……！",
    "duration": 13.36,
    "kind": "story"
  },
  "omsolo-switch-1": {
    "file": "assets/voices/omsolo/omsolo-switch-1.mp3",
    "who": "omsolo",
    "text": "私が前に出よう！",
    "duration": 2.2,
    "kind": "battle",
    "normalizationDb": -0.05
  },
  "nyanluna-8b2ed3da": {
    "file": "assets/voices/nyanluna/nyanluna-8b2ed3da-5cf56352712c.mp3",
    "who": "nyanluna",
    "text": "うん。こむすび、お父さんが最後にいた場所を教えて。わたしたちが、必ず迎えに行く。",
    "duration": 7.89,
    "kind": "story"
  },
  "tsukineko-levelup-1": {
    "file": "assets/voices/tsukineko/tsukineko-levelup-1-e3e8894ef0c2.mp3",
    "who": "tsukineko",
    "text": "いい感じ。もっと遠くまで狙えるね。",
    "duration": 3.75,
    "kind": "battle",
    "normalizationDb": 0.39
  },
  "nyanluna-7e7e7f28": {
    "file": "assets/voices/nyanluna/nyanluna-7e7e7f28-46c7f1d2a991.mp3",
    "who": "nyanluna",
    "text": "大丈夫。まず、ゆっくり息をしよう。何があったの？",
    "duration": 5.52,
    "kind": "story"
  },
  "omsolo-dash-1": {
    "file": "assets/voices/omsolo/omsolo-dash-1.mp3",
    "who": "omsolo",
    "text": "見えている！",
    "duration": 1.8,
    "kind": "battle",
    "normalizationDb": -0.05
  },
  "nyanluna-hurt-2": {
    "file": "assets/voices/nyanluna/nyanluna-hurt-2-7081e609880b.mp3",
    "who": "nyanluna",
    "text": "まだ、大丈夫！",
    "duration": 2.04,
    "kind": "battle",
    "normalizationDb": -0.06
  },
  "nyanluna-attack-3": {
    "file": "assets/voices/nyanluna/nyanluna-attack-3-0acd14985411.mp3",
    "who": "nyanluna",
    "text": "届けっ！",
    "duration": 1.13,
    "kind": "battle",
    "normalizationDb": 0.79
  },
  "omsolo_hurt-ca8c565f": {
    "file": "assets/voices/omsolo_hurt/omsolo_hurt-ca8c565f-a66d7fcd252d.mp3",
    "who": "omsolo_hurt",
    "text": "よかった……こむすびは、逃げられた……。",
    "duration": 5.6,
    "kind": "story"
  },
  "omsolo-support-1": {
    "file": "assets/voices/omsolo/omsolo-support-1.mp3",
    "who": "omsolo",
    "text": "後ろは任せろ！",
    "duration": 1.9,
    "kind": "battle",
    "normalizationDb": -0.06
  },
  "nyanluna-5f25ed9a": {
    "file": "assets/voices/nyanluna/nyanluna-5f25ed9a-c960f223feb3.mp3",
    "who": "nyanluna",
    "text": "敵を倒すと、そのキャラの経験値が増えるよ。落ちたクリスタルは拾って集めよう。メーターが満ちたら、3つから好きな祝福を選んでね！",
    "duration": 11.31,
    "kind": "tutorial"
  },
  "tsukineko-hurt-1": {
    "file": "assets/voices/tsukineko/tsukineko-hurt-1-5f08b5017c7f.mp3",
    "who": "tsukineko",
    "text": "いたっ！",
    "duration": 0.85,
    "kind": "battle",
    "normalizationDb": 0.41
  }
};
