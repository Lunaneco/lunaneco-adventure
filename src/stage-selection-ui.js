import {ACTS,EXTRA_ACTS,CHAPTERS,actFor,actLabel,isActUnlocked,isActCleared,clearTicketReward} from './acts.js';
import {STAGE_MISSIONS} from './missions.js';
import {icon} from './icons.js';
import {extraCombatHint} from './extra-stages.js';
import {requiredPartyMember} from './party.js';
import {fieldFor} from './terrain.js';
import {mapSvg} from './terrain-ui.js';
import {floorLegend} from './floor-appearance.js';
import {FLOOR_TYPES,floorPatchesFor} from './special-floors.js';
import {NYAN_QUEST,NYAN_AWAKENING_HELP,hasNyanAwakening} from './nyanluna-awakening.js';
import {RICE_QUEST,RICE_HELP,hasRicePower} from './rice-awakening.js';

export function stageSelectionView(chapterId,profile){
  const chapter=CHAPTERS[chapterId],acts=ACTS.filter(a=>a.chapter===chapterId),extra=EXTRA_ACTS.find(a=>a.chapter===chapterId);
  const card=act=>{
    const unlocked=isActUnlocked(profile,act.id),cleared=isActCleared(profile,act.id);
    return `<button class="journey-act ${act.extra?'journey-extra':''}" data-act="${act.id}" aria-haspopup="dialog" ${unlocked?'':'disabled'}>
      <span class="journey-act-art" style="background-image:url('${act.stages[0].image}')" aria-hidden="true"></span>
      <span class="journey-act-copy"><small>${act.awakening?'SOLO AWAKENING':act.extra?'EXTRA':`第${act.number}幕`}</small><strong>${act.title}</strong><span class="journey-act-status">${cleared?`${icon('check')} ${act.awakening?(act.awakening==='nyanluna'?'にゃんるな覚醒 習得済み':'ライスの力 習得済み'):'クリア'}`:unlocked?`${icon('arrow')} ${act.awakening?'覚醒イベント発生 · 単独で挑戦':act.extra?'高難度に挑戦':'ミッションへ'}`:`${icon('lock')} ${act.awakening?(act.awakening==='nyanluna'?'にゃんるなLv.50で解放':'オムソロ加入・Lv.50で解放'):act.extra?`第${act.endgame?act.chapter+1:Math.floor(act.unlockAfterAct/4)+1}章クリアで解放`:'前の幕をクリアで解放'}`}</span></span>
      <span class="journey-act-number" aria-hidden="true">${act.awakening?(act.awakening==='nyanluna'?'月':'米'):act.extra?'EX':String(act.number).padStart(2,'0')}</span>
    </button>`;
  };
  return `<nav class="journey-chapters" aria-label="章を選ぶ">${CHAPTERS.map(c=>`<button data-chapter="${c.id}" aria-pressed="${c.id===chapterId}" ${isActUnlocked(profile,c.start)?'':'disabled'}>第${c.id+1}章 ${!isActUnlocked(profile,c.start)?icon('lock'):''}</button>`).join('')}</nav>
    <header class="journey-chapter-title"><div><span>CHAPTER ${String(chapterId+1).padStart(2,'0')}</span><h2>${chapter.title}</h2></div><span class="journey-completion">${acts.filter(a=>isActCleared(profile,a.id)).length}<i>/</i>4 ${icon('check')}</span></header>
    <div class="journey-acts" role="group" aria-label="幕を選ぶ">${acts.map(card).join('')}</div>
    ${extra?`<section class="journey-extra-wrap" aria-label="エクストラステージ">${card(extra)}</section>`:''}
    ${chapterId===NYAN_QUEST.chapter?`<section class="journey-extra-wrap nyan-awakening-quest" aria-label="にゃんるなの覚醒イベント">${card(NYAN_QUEST)}<p class="rice-quest-note">にゃんるなLv.50・単独限定。初回クリアで時間制限つきの覚醒を習得。</p></section>`:''}
    ${chapterId===RICE_QUEST.chapter?`<section class="journey-extra-wrap rice-quest" aria-label="オムソロの覚醒イベント">${card(RICE_QUEST)}<p class="rice-quest-note">オムソロ単独限定。初回クリアで「ライスの力」を習得。</p></section>`:''}`;
}

export function stageBriefingView(actId,difficulty,profile){
  const act=actFor(actId),cleared=isActCleared(profile,actId),trial=STAGE_MISSIONS.find(m=>m.act===actId&&m.trial);
  return `<article class="stage-briefing">
    <div class="brief-art" style="background-image:url('${act.stages[0].image}')"><span>${actLabel(actId)}</span><button class="brief-close" data-close aria-label="閉じる">${icon('close')}</button></div>
    <div class="brief-body"><div class="brief-title-row"><h2 id="stage-brief-title" tabindex="-1">${act.title}</h2>${act.recommendedLevel?`<span>推奨 Lv.${act.recommendedLevel}</span>`:''}</div><p class="brief-summary">${act.summary}</p>
      <section class="brief-objective" aria-labelledby="brief-objective-title"><h3 id="brief-objective-title">${icon('compass')} ミッション</h3><p>魔物を倒して、月の門を進もう。</p><strong>「${act.boss}」を倒し、最後の門へ。</strong></section>
      ${act.endgame?`<section class="brief-objective brief-party-rule" aria-label="編成条件"><h3>${icon('link')} フルカンスト向けエクストラ</h3><strong>好きな仲間1〜2人で出撃 · 推奨Lv.80</strong><p>${extraCombatHint(act)}</p></section>`:act.chapter===6?`<section class="brief-objective brief-party-rule" aria-label="編成条件"><h3>${icon(cleared?'link':'lock')} ${cleared?'クリア後の自由編成':'初回クリアまでのソロクエスト'}</h3><strong>${cleared?'好きな仲間1〜2人で出撃':'もちにゃふぇ操作固定'} · 推奨Lv.60</strong><p>${cleared?'選んだキャラと先頭を使い、2人編成ではNPCるみを追加しません。交代・自動交代も通常どおり。':'初回クリアまではもちにゃふぇ単独で出撃。第1幕の出会いの後、るみがNPC援護に参加します。NPCへは交代できません。'}クリアした幕は自由編成。保存した編成は変更しません。</p><small>第4幕クリアでるみが正式加入。もちにゃふぇとるみを組むと、ねこるみに変わって通常・援護・必殺技が射程無限。</small></section>`:act.chapter===5?`<section class="brief-objective brief-party-rule" aria-label="編成条件"><h3>${icon(cleared?'link':'lock')} ${cleared?'クリア後の自由編成':'初回クリアまでのソロクエスト'}</h3><strong>${cleared?'好きな仲間1〜2人で出撃':'オムソロ操作固定'} · 推奨Lv.60</strong><p>${cleared?'選んだキャラと先頭をそのまま使い、2人編成ではNPCへへりあるを追加しません。交代・戦闘不能時の自動交代も通常どおり。1人編成なら、へへりある以外の操作役をNPCへへりあるが弓で援護します。':'この幕の初回クリアまではオムソロ単独で出撃。第1幕の食事イベント後、NPCへへりあるが弓で援護し、クリアした幕は自由編成になります。'}オムソロとへへりあるの共闘中は捕食（F）でへへへに変身。戦闘終了まで解除不可・被弾には数えません。保存した編成は変更しません。</p><small>第4幕クリアでへへりあるが正式加入。黄金のへへへは各幕で一度だけ20%抽選：素材2倍＋★3素材を大量獲得。</small></section>`:act.awakening==='nyanluna'?`<section class="brief-objective brief-party-rule" aria-label="編成条件"><h3>${icon('lock')} ソロ限定クエスト</h3><strong>にゃんるな1人で出撃 · Lv.50以上</strong><p>再挑戦も単独限定。保存済みのパーティと先頭キャラは変更しません。</p></section><section class="brief-objective rice-reward"><h3>${icon('spark')} 覚醒報酬：月光を結ぶ覚醒</h3><p>${NYAN_AWAKENING_HELP}</p><small>最後の門を突破すると永久習得。撤退・敗北では習得しません。${hasNyanAwakening(profile)?'すでに習得済みです。':''}</small></section>`:act.awakening?`<section class="brief-objective brief-party-rule" aria-label="編成条件"><h3>${icon('lock')} ソロ限定クエスト</h3><strong>オムソロ1人で出撃 · Lv.50以上</strong><p>再挑戦も単独限定。保存済みのパーティと先頭キャラは変更しません。</p></section><section class="brief-objective rice-reward"><h3>${icon('spark')} 覚醒報酬：ライスの力</h3><p>${RICE_HELP}</p><small>最後の門を突破すると永久習得。撤退・敗北では習得しません。${hasRicePower(profile)?'すでに習得済みです。':''}</small></section>`:requiredPartyMember(profile,actId)?`<section class="brief-objective brief-party-rule" aria-label="編成条件"><h3>${icon('lock')} 初回クリアまでの編成</h3><strong>${act.chapter===4?'つきねこ単独で出撃':'にゃんるな必須（先頭・援護どちらでも可）'}</strong><p>${act.chapter===4?'つきねこ1人の編成に自動で切り替わります。':'にゃんるなを自動で編成に加えます。'}この幕をクリアすると、自由に編成できます。</p></section>`:''}
      <div class="brief-route" aria-label="進行ルート">${act.stages.map((s,i)=>`<span><b>${i+1}</b>${s.name}</span>`).join('')}</div>
      <section class="brief-terrain" aria-label="地形と特殊床"><h3>地形と特殊床</h3><div>${act.stages.map((s,i)=>{const f=fieldFor(actId,i),l=f.rooms[0];return `<article>${mapSvg(l)}<strong>${l.shapeLabel}</strong><small>${{single:'ひとつの広場',floors:'階段でつながる2フロア',branch:'通常・強敵の分岐'}[f.kind]}</small><p>${floorPatchesFor(l).map(p=>FLOOR_TYPES[p.type].name).join('・')}</p></article>`;}).join('')}</div>${floorLegend(fieldFor(actId,0).rooms[0])}<p>赤橙の×は予告後にダメージ。緑の＋はHP回復（白い点1つ＝1回）。紫の波線は減速、黄色の矢印は加速。床のそばの表示も確認しよう。</p></section>
      <section id="stage-difficulty" class="brief-difficulty" aria-label="難易度">${act.awakening?`<strong>覚醒試練 · ${act.awakening==='nyanluna'?'にゃんるな':'オムソロ'}単独</strong><span>Lv.50向け・全6WAVE（難易度固定）</span>`:act.extra?`<strong>${icon('star')} ${act.endgame?'フルカンスト向け':act.apex?'Lv.50 EX最難関':'エクストラ・最高難度'}</strong><span>適正 Lv.${act.recommendedLevel}</span>`:`<div class="brief-modes" role="group" aria-label="難易度"><button data-difficulty="normal" aria-pressed="${difficulty==='normal'}">冒険</button><button data-difficulty="hard" aria-pressed="${difficulty==='hard'}">チャレンジ</button></div><p>${difficulty==='hard'?'手強い敵と戦い、特別な素材を集めよう。':'物語を楽しみながら、仲間を育てよう。'}</p>`}</section>
      <div class="brief-reward">${icon('star')}<span>クリア報酬</span><b>武器ガチャ券 ×${clearTicketReward(profile,actId)}</b>${act.extra&&!cleared?'<small>初回</small>':''}</div>
      ${trial?`<button class="brief-missions-link" data-show-mission="${trial.id}">素材・試練の報酬 ${icon('chevron')}</button>`:''}
      ${!act.extra&&cleared?`<button id="chapter-story" class="brief-story">${icon('book')} 物語を読み返す</button>`:''}
    </div><footer class="brief-actions"><button class="brief-back" data-close>戻る</button><button id="chapter-start" class="brief-start" data-mode="${act.awakening?'awakening':act.extra?'extra':difficulty}">ステージ開始 ${icon('arrow')}</button></footer>
  </article>`;
}
