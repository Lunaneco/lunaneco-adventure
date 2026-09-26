import {ACTS,EXTRA_ACTS,CHAPTERS,actFor,actLabel,isActUnlocked,isActCleared,clearTicketReward} from './acts.js';
import {STAGE_MISSIONS} from './missions.js';
import {icon} from './icons.js';

export function stageSelectionView(chapterId,profile){
  const chapter=CHAPTERS[chapterId],acts=ACTS.filter(a=>a.chapter===chapterId),extra=EXTRA_ACTS.find(a=>a.chapter===chapterId);
  const card=act=>{
    const unlocked=isActUnlocked(profile,act.id),cleared=isActCleared(profile,act.id);
    return `<button class="journey-act ${act.extra?'journey-extra':''}" data-act="${act.id}" aria-haspopup="dialog" ${unlocked?'':'disabled'}>
      <span class="journey-act-art" style="background-image:url('${act.stages[0].image}')" aria-hidden="true"></span>
      <span class="journey-act-copy"><small>${act.extra?'EXTRA':`第${act.number}幕`}</small><strong>${act.title}</strong><span class="journey-act-status">${cleared?`${icon('check')} クリア`:unlocked?`${icon('arrow')} ${act.extra?'高難度に挑戦':'ミッションへ'}`:`${icon('lock')} ${act.extra?`第${Math.floor(act.unlockAfterAct/4)+1}章クリアで解放`:'前の幕をクリアで解放'}`}</span></span>
      <span class="journey-act-number" aria-hidden="true">${act.extra?'EX':String(act.number).padStart(2,'0')}</span>
    </button>`;
  };
  return `<nav class="journey-chapters" aria-label="章を選ぶ">${CHAPTERS.map(c=>`<button data-chapter="${c.id}" aria-pressed="${c.id===chapterId}" ${isActUnlocked(profile,c.start)?'':'disabled'}>第${c.id+1}章 ${!isActUnlocked(profile,c.start)?icon('lock'):''}</button>`).join('')}</nav>
    <header class="journey-chapter-title"><div><span>CHAPTER ${String(chapterId+1).padStart(2,'0')}</span><h2>${chapter.title}</h2></div><span class="journey-completion">${acts.filter(a=>isActCleared(profile,a.id)).length}<i>/</i>4 ${icon('check')}</span></header>
    <div class="journey-acts" role="group" aria-label="幕を選ぶ">${acts.map(card).join('')}</div>
    ${extra?`<section class="journey-extra-wrap" aria-label="エクストラステージ">${card(extra)}</section>`:''}`;
}

export function stageBriefingView(actId,difficulty,profile){
  const act=actFor(actId),cleared=isActCleared(profile,actId),trial=STAGE_MISSIONS.find(m=>m.act===actId&&m.trial);
  return `<article class="stage-briefing">
    <div class="brief-art" style="background-image:url('${act.stages[0].image}')"><span>${actLabel(actId)}</span><button class="brief-close" data-close aria-label="閉じる">${icon('close')}</button></div>
    <div class="brief-body"><div class="brief-title-row"><h2 id="stage-brief-title" tabindex="-1">${act.title}</h2>${act.recommendedLevel?`<span>推奨 Lv.${act.recommendedLevel}</span>`:''}</div><p class="brief-summary">${act.summary}</p>
      <section class="brief-objective" aria-labelledby="brief-objective-title"><h3 id="brief-objective-title">${icon('compass')} ミッション</h3><p>魔物を倒して、月の門を進もう。</p><strong>「${act.boss}」を倒し、最後の門へ。</strong></section>
      <div class="brief-route" aria-label="進行ルート">${act.stages.map((s,i)=>`<span><b>${i+1}</b>${s.name}</span>`).join('')}</div>
      <section id="stage-difficulty" class="brief-difficulty" aria-label="難易度">${act.extra?`<strong>${icon('star')} ${act.apex?'全EX最難関':'エクストラ・最高難度'}</strong><span>適正 Lv.50</span>`:`<div class="brief-modes" role="group" aria-label="難易度"><button data-difficulty="normal" aria-pressed="${difficulty==='normal'}">冒険</button><button data-difficulty="hard" aria-pressed="${difficulty==='hard'}">チャレンジ</button></div><p>${difficulty==='hard'?'手強い敵と戦い、特別な素材を集めよう。':'物語を楽しみながら、仲間を育てよう。'}</p>`}</section>
      <div class="brief-reward">${icon('star')}<span>クリア報酬</span><b>武器ガチャ券 ×${clearTicketReward(profile,actId)}</b>${act.extra&&!cleared?'<small>初回</small>':''}</div>
      ${trial?`<button class="brief-missions-link" data-show-mission="${trial.id}">素材・試練の報酬 ${icon('chevron')}</button>`:''}
      ${!act.extra&&cleared?`<button id="chapter-story" class="brief-story">${icon('book')} 物語を読み返す</button>`:''}
    </div><footer class="brief-actions"><button class="brief-back" data-close>戻る</button><button id="chapter-start" class="brief-start" data-mode="${act.extra?'extra':difficulty}">ステージ開始 ${icon('arrow')}</button></footer>
  </article>`;
}
