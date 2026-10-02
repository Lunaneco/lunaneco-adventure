import {SEVENTH_CHAPTER_SCENES,isLumiAct} from './chapter-seven.js';
import {publicUrl} from './public-url.js';
import {SIXTH_CHAPTER_SCENES,isHeheAct} from './chapter-six.js';
import {FIFTH_CHAPTER_SCENES} from './chapter-five-story.js';
import {FOURTH_CHAPTER_SCENES} from './chapter-four-story.js';
import {THIRD_CHAPTER_SCENES} from './chapter-three-story.js';
import {SECOND_CHAPTER_SCENES} from './chapter-two-story.js';
import {storySpeaker,preloadStoryCast} from './story-cast.js';
import {ACTS,actFor,actLabel} from './acts.js';
import {NYAN_QUEST_ID,NYAN_AWAKENING_SCENES} from './nyanluna-awakening.js';
import {RICE_QUEST_ID,RICE_SCENES} from './rice-awakening.js';
export const CHAPTER={title:'迷子の月と、ふたりの約束',summary:'大の仲良しの二人が、一緒に迷い込んだ月の世界。はぐれた親友を探す、全4幕の物語。',stages:ACTS[0].stages};
const line=(who,text,voiced)=>({who,text,voiced});
const scene=(act,area,kicker,title,next,lines,voiced=false)=>({act,area,kicker:`ACT 0${act+1} · ${kicker}`,title,next,lines:lines.map(([who,text])=>line(who,text,voiced))});
export const ACT_SCENES=[{
 opening:scene(0,0,'はじまり','離れてしまった手。','草原へ出発',[
 ['narrator','にゃんるなとつきねこは、昔から大の仲良し。いつもの帰り道、不思議な月の光をのぞき込んだ二人は、一緒に見知らぬ世界へ落ちてしまった。'],
 ['nyanluna','つきねこ……？ さっきまで、手をつないでいたのに。'],
 ['narrator','落ちる途中で光の流れが分かれた。目を覚ましたにゃんるなの隣に、親友の姿はない。空には欠けた月と、浮かぶ島々。'],
 ['nyanluna','あわてない。つきねこなら、きっと大丈夫。二人で帰るって決めたんだから。まずは、あの門まで行ってみよう。'],
 ],true),
 ruins:scene(0,1,'最初の月の門','見知らぬ街の記憶。','遺跡へ進む',[
 ['narrator','光る輪をくぐると、音の消えた街に出た。石碑に残った光が、古い言葉を映し出す。'],
 ['guardian','「月を閉ざせ。嵐から島を守れ。道が消えても、ここを離れるな。」'],
 ['nyanluna','道が消えた……？ わたしたちがはぐれたのも、そのせいなのかな。'],
 ['nyanluna','つきねこだったら、出口を探しに高い場所へ行くはず。わたしも、進まなくちゃ。'],
 ]),
 sanctuary:scene(0,2,'封印の前庭','最初の鍵。','聖域へ進む',[
 ['narrator','街を抜けると、白い神殿の奥に封印の番人が立っていた。その胸には、時計の針に似た鍵が光る。'],
 ['guardian','「この先へ進む者よ。閉じた光を、再びつなぐ覚悟はあるか。」'],
 ['nyanluna','つきねこを探しているの。怖くても、ここで立ち止まるわけにはいかないよ。'],
 ]),
 ending:scene(0,2,'第1幕クリア','時計塔へ続く道。','報酬を受け取る',[
 ['narrator','番人が静かに膝をつき、月の門が開く。鍵の光は、遠い時計塔を指していた。'],
 ['nyanluna','まだ見つからない。でも、道はつながった。つきねこ、待ってて。'],
 ['narrator','時計塔の向こうにも、島々が続いている。にゃんるなは一度息を整え、次の旅の支度を始めた。'],
 ]),
},{
 opening:scene(1,0,'記憶の回廊','水鏡に残った夜。','回廊へ出発',[
 ['narrator','時計塔へ続く回廊には、過ぎた時間を映す水鏡が並んでいた。一枚だけ、見慣れた帰り道が揺れている。'],
 ['nyanluna','これ、わたしたちの街……！ つきねこが笑ってる。あの光に触れる、少し前だ。'],
 ['nyanluna','いつも一緒だったもんね。今度も、絶対に見つけるよ。'],
 ]),
 ruins:scene(1,1,'星時計の庭','ふたつの流れ。','庭へ進む',[
 ['narrator','庭の時計に灯りを入れると、空から落ちる二筋の光が映った。一筋は草原へ。もう一筋は、雲海のずっと向こうへ。'],
 ['nyanluna','つきねこは、あっちに落ちたんだ。無事でいて……！'],
 ['guardian','「止めた時間は、帰る者の道も閉ざす。針を進めよ。光を解け。」'],
 ]),
 sanctuary:scene(1,2,'時計塔の頂','動き出す五つの刻印。','塔の頂へ進む',[
 ['narrator','塔の頂で、時守の残響が目覚めた。足元に五つの刻印が現れ、順に強い光を放つ。'],
 ['nyanluna','同じ場所にいたら危ない……！ 刻印をかわして、止まった針を動かそう。'],
 ['guardian','「取り戻せ。待つだけでは、時は進まぬ。」'],
 ]),
 ending:scene(1,2,'第2幕クリア','動いた針が指す先。','報酬を受け取る',[
 ['narrator','最後の門へ光を運ぶと、時計塔が大きく鳴った。止まっていた橋が、雲海の上へ少しずつ伸び始める。'],
 ['nyanluna','帰ったら、この時計の話をしよう。つきねこ、きっと目を丸くするよね。'],
 ['narrator','橋が伸びる先は、星渡りの浮島。にゃんるなは親友の笑顔を思い浮かべながら、次の道を確かめた。'],
 ]),
},{
 opening:scene(2,0,'風待ちの丘','同じ空の下で。','丘へ出発',[
 ['narrator','雲海の風は、思っていたより冷たかった。にゃんるなは杖を抱え、遠くの島を見つめる。'],
 ['nyanluna','つきねこも、この空を見てるのかな。あっちでちゃんと、ごはん食べてるかな。'],
 ['nyanluna','……会ったら、いっぱい話そう。まずは、この橋を渡らなきゃ。'],
 ]),
 ruins:scene(2,1,'雲影の浮島','結び直した約束。','浮島へ進む',[
 ['narrator','途切れた橋の根元に、細い糸が引っかかっていた。落ちるときに切れた、にゃんるなのリボンだった。'],
 ['nyanluna','つきねこが結んでくれたリボン……。なくしたと思ってた。'],
 ['nyanluna','「ほどけても結び直せばいい」って、いつも言ってたよね。うん。離れても、また会える。'],
 ],true),
 sanctuary:scene(2,2,'星渡りの橋','星の雨を越えて。','橋へ進む',[
 ['narrator','対岸を守る番人が腕を広げた。雲間から星の弾が広がり、橋を渡る道をふさいでいく。'],
 ['nyanluna','よく見れば、星と星の間を通れる。つきねこ、もう少しでそっちに行けるよ。'],
 ['guardian','「光は、閉じ込めるほど暗くなる。あの者に……伝えてくれ。」'],
 ]),
 ending:scene(2,2,'第3幕クリア','夜明けの手前。','報酬を受け取る',[
 ['narrator','番人が去ると、雲が開けた。その向こうには、暗い月を抱えた巨大な聖域が浮かんでいる。'],
 ['nyanluna','この世界に来たときの光と、同じ色だ。あそこに行けば、帰り道も見つかるかもしれない。'],
 ['narrator','別々の場所から同じ光を目指していたことを、にゃんるなはまだ知らなかった。'],
 ]),
},{
 opening:scene(3,0,'最後の参道','閉ざされた月のもとへ。','参道へ出発',[
 ['narrator','月落ちの参道。空の月は、守護者の大きな腕の中に閉ざされていた。にゃんるなは島で集めた光を掲げる。'],
 ['nyanluna','この道の先が、きっと出口につながってる。つきねこも、ここを目指してたらいいな。'],
 ['guardian','「また嵐が来る。私が守る。月も、島も……すべて、ここに。」'],
 ]),
 ruins:scene(3,1,'暁を待つ庭','守りたかったもの。','庭へ進む',[
 ['narrator','石碑の記憶がつながった。守護者は嵐から世界を救おうとして、月ごと道を封じてしまったのだ。'],
 ['nyanluna','月を空へ返したら、みんなの道も戻るんだね。わたしたちの帰り道も。'],
 ['nyanluna','ひとりで全部、抱えなくていいんだよ。その手をひらくお手伝い、わたしにさせて。'],
 ]),
 sanctuary:scene(3,2,'月還りの聖域','聞き覚えのある音。','聖域の奥へ',[
 ['narrator','最後の庭を抜けようとしたとき、奥から乾いた銃声が響いた。二発、少し間を置いて、もう一発。'],
 ['nyanluna','今の音……まさか。つきねこ？'],
 ['narrator','声は返らない。にゃんるなは胸の高鳴りを抑え、残る魔物を退けながら聖域の奥へ走った。'],
 ]),
 guardian:scene(3,2,'REUNION · 思いがけない再会','やっと、見つけた。','つきねこと共に戦う',[
 ['narrator','守護者の影の前で、銃を構えたつきねこが膝をついていた。出口を探し、たどり着いた同じ場所。二人はようやく顔を見合わせた。'],
 ['nyanluna','つきねこっ！ 伏せて！'],
 ['narrator','月光の一撃が迫る影をはじく。つきねこは目を見開き、それから、泣きそうな顔で笑った。'],
 ['tsukineko','にゃんるな……！ ずっと探してた！ 出口に行けば会えるかもって……でも、こいつが強くて。'],
 ['nyanluna','わたしも！ もう、すごく心配したんだから。……お話は、こいつを止めてからね。'],
 ['tsukineko','うん。いつもどおり、にゃんるなが光でひらいて、わたしが狙う。背中、任せて！'],
 ['nyanluna','もちろん。二人で迷い込んだんだもん。帰るときも、絶対に一緒だよ！'],
 ],true),
 ending:scene(3,2,'第1章クリア · ふたりの約束','もう一度、手をつないで。','報酬を受け取りメニューへ',[
 ['narrator','最後の光を門へ届けると、守護者の腕がほどけた。月が空へ昇り、島々をつなぐ銀色の道が戻ってくる。'],
 ['guardian','ひとりで守ろうとして……道を、閉ざしていたのか。ありがとう。小さな旅人たち。'],
 ['tsukineko','やっと隣に戻れた。……もう、はぐれたくない。'],
 ['nyanluna','わたしも。帰り道はまだ先みたいだけど、二人なら大丈夫。いつも、そうだったでしょ？'],
 ['tsukineko','うん。道がなかったら、一緒に探そう。約束ね。'],
 ['narrator','二人は、もう一度しっかりと手をつないだ。つきねこと自由に編成できるようになった。元の世界への旅は、ここから二人で。――第1章、おわり。'],
 ],true),
},...SECOND_CHAPTER_SCENES,...THIRD_CHAPTER_SCENES,...FOURTH_CHAPTER_SCENES,...FIFTH_CHAPTER_SCENES];
export const SCENES=ACT_SCENES[0];
export const storyScenesFor=act=>act===NYAN_QUEST_ID?NYAN_AWAKENING_SCENES:isLumiAct(act)?SEVENTH_CHAPTER_SCENES[act-28]:isHeheAct(act)?SIXTH_CHAPTER_SCENES[act-24]:act===RICE_QUEST_ID?RICE_SCENES:ACT_SCENES[act];
export class ChapterStory{
  constructor(){
    preloadStoryCast();
    this.dialog=document.createElement('dialog');this.dialog.id='story-dialog';this.dialog.className='story-dialog';this.dialog.setAttribute('aria-labelledby','story-title');document.body.append(this.dialog);
    this.dialog.addEventListener('cancel',e=>e.preventDefault());
    this.dialog.addEventListener('click',e=>{const button=e.target.closest('button');if(button?.id==='story-next')this.next();if(button?.id==='story-skip')this.finish();if(button?.id==='story-voice'&&this.scene.lines[this.index]?.voiced)this.onVoice?.(this.scene.lines[this.index]);});
  }
  show(scene,onFinish){this.scene=scene;this.index=0;this.onFinish=onFinish;this.render();if(!this.dialog.open)this.dialog.showModal();this.dialog.querySelector('#story-next').focus();}
  render(){
    const entry=this.scene.lines[this.index],speaker=this.speakerFor?.(entry)??storySpeaker(entry.portrait??entry.who),last=this.index===this.scene.lines.length-1;
    this.dialog.style.setProperty('--story-image',`url('${this.scene.image?publicUrl(this.scene.image):actFor(entry.act??this.scene.act??0).stages[entry.area??this.scene.area].image}')`);
    this.dialog.style.setProperty('--speaker-color',speaker.color);this.dialog.dataset.speaker=entry.who;
    this.dialog.innerHTML=`<div class="story-art"></div><div class="story-vignette"></div><header class="story-header"><span>${this.scene.kicker}</span><button id="story-skip">会話をスキップ</button></header><div class="story-title-block"><small>${actLabel(entry.act??this.scene.act??0)}</small><h2 id="story-title">${this.scene.title}</h2></div><div class="story-body"><figure class="story-cast ${entry.who}"><img class="story-character-image" src="${speaker.image}" alt="${speaker.alt}" decoding="sync" width="1024" height="1536"></figure><section class="story-dialogue" aria-live="polite"><div class="story-speaker ${entry.who}"><span class="speaker-light" aria-hidden="true"></span><div><small>${speaker.role}</small><strong>${speaker.name}</strong></div></div><p tabindex="0" aria-label="会話文">${entry.text}</p>${entry.voiced?`<button id="story-voice" class="story-voice" aria-label="${speaker.name}の台詞をもう一度聞く">♪ もう一度聞く</button>`:''}<footer><span class="story-progress">${String(this.index+1).padStart(2,'0')} <i>/</i> ${String(this.scene.lines.length).padStart(2,'0')}</span><button id="story-next">${last?this.scene.next:'つづきを読む'} <span aria-hidden="true">→</span></button></footer></section></div>`;
    this.onVoice?.(entry,this.scene.lines.slice(this.index+1,this.index+3).filter(line=>line.voiced));
  }
  next(){if(++this.index>=this.scene.lines.length)this.finish();else{this.render();this.dialog.querySelector('#story-next').focus();}}
  finish(){const done=this.onFinish;this.onFinish=null;this.onVoiceStop?.();this.dialog.close();done?.();}
  cancel(){this.onFinish=null;this.onVoiceStop?.();this.dialog.close();}
}
