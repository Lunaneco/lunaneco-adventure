import {TUTORIAL_STEPS} from './tutorial.js';

export class BattleTutorialView{
  constructor(){
    this.panel=document.createElement('section');this.panel.id='battle-tutorial';this.panel.className='tutorial-panel hidden';this.panel.setAttribute('aria-labelledby','tutorial-title');this.panel.setAttribute('aria-live','polite');document.body.append(this.panel);this.index=-1;this.voiceStep=null;
  }
  render(game,blocked=false){
    const tutorial=game?.tutorial,active=!!tutorial?.active;
    this.panel.classList.toggle('hidden',!active||blocked);
    document.body.classList.toggle('tutorial-running',active);
    document.body.dataset.tutorialStep=active?tutorial.step.id:'';
    if(!active){this.index=-1;this.voiceStep=null;return;}
    if(!blocked&&this.voiceStep!==tutorial.step.id){this.voiceStep=tutorial.step.id;this.onVoice?.(tutorial.step);}
    if(this.index!==tutorial.index){
      this.index=tutorial.index;const step=tutorial.step;
      this.panel.innerHTML=`<header><span class="portrait nyanluna" role="img" aria-label="にゃんるな"></span><div><small>はじめての冒険 · ${tutorial.index+1} / ${TUTORIAL_STEPS.length}</small><strong>にゃんるな</strong></div><button id="tutorial-skip" aria-label="チュートリアルをスキップ">スキップ</button></header><h2 id="tutorial-title">${step.title}</h2><p class="tutorial-speech">「${step.text}」</p><div class="tutorial-task">${step.hint}</div>${step.id==='move'?'<div class="tutorial-distance" role="progressbar" aria-label="歩く練習" aria-valuemin="0" aria-valuemax="100"><i></i></div>':''}${step.button?`<button id="tutorial-next">${step.button} <span aria-hidden="true">→</span></button>`:'<small class="tutorial-safe">練習中 · ダメージなし / 制限時間は停止</small>'}`;
    }
    if(tutorial.step.id==='move'){const value=Math.min(100,tutorial.distance/2.4*100),meter=this.panel.querySelector('.tutorial-distance');meter.setAttribute('aria-valuenow',Math.floor(value));meter.firstElementChild.style.width=`${value}%`;}
  }
}
