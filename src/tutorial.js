export const TUTORIAL_STEPS=Object.freeze([
  {id:'welcome',title:'にゃんるなと、はじめの一歩',text:'わたしはにゃんるな。月の灯りを探しに行く前に、一緒に動いてみよう！ ここではダメージを受けないから、ゆっくりで大丈夫。',hint:'草原で操作を練習しよう',button:'一緒に練習する'},
  {id:'move',title:'まずは、歩いてみよう',text:'画面の空いている所を指でドラッグしてみて。指を動かした方向へ歩けるよ！',hint:'少し歩くと、次の練習へ · キーボードは WASD / 矢印、パッドは左スティック',target:'move'},
  {id:'dash',title:'すっとかわす、回避！',text:'上手！ 次は右下の「回避」を押してみよう。赤い攻撃予告が見えたら、すっと外へ逃げるの。',hint:'回避を1回使おう · キーボードは Space、パッドは A',target:'dash'},
  {id:'attack',title:'攻撃は、わたしに任せて',text:'あの魔法の的を見て。近くの敵には自動で攻撃するよ。攻撃ボタンはなくて大丈夫、移動と回避に集中してね！',hint:'近くの練習用の的を倒そう · この的から経験値や報酬は出ません',target:'attack'},
  {id:'crystals',title:'経験値とクリスタルは別だよ',text:'敵を倒すと、そのキャラの経験値が増えるよ。落ちたクリスタルは拾って集めよう。メーターが満ちたら、3つから好きな祝福を選んでね！',hint:'レベルは冒険後も残るよ。祝福は今の幕の全6WAVEで続くよ！',button:'覚えたよ',target:'crystal'},
  {id:'ready',title:'光る門の向こうへ',text:'月のボタンが100%になったら、わたしの必殺技「月華の聖域」！ 魔物をすべて倒したら、光る月の門へ進もう。準備はできた？ 一緒に月明かりを取り戻そう！',hint:'必殺技は月のボタン / E / パッドの Y · 最後の門で幕クリア・ミッション報酬',button:'冒険をはじめる',target:'ultimate'},
]);

export function needsFirstBattleTutorial(profile){return !profile?.story?.actClears?.[0]&&!profile?.story?.chapterOneCleared&&!profile?.tutorial?.firstBattleCompleted;}

export class FirstBattleTutorial{
  constructor(){this.index=0;this.distance=0;this.active=true;}
  get step(){return TUTORIAL_STEPS[this.index];}
  get practicing(){return this.active&&['move','dash','attack'].includes(this.step.id);}
  next(){if(!this.active||!this.step.button)return false;if(this.index===TUTORIAL_STEPS.length-1)this.active=false;else this.index++;return true;}
  observe(action,value=0){
    if(!this.active)return false;
    if(this.step.id==='move'&&action==='move'&&Number.isFinite(value)&&value>0){this.distance+=value;if(this.distance<2.4)return false;}
    else if(!(this.step.id==='dash'&&action==='dash'||this.step.id==='attack'&&action==='defeat'))return false;
    this.index++;return true;
  }
}
