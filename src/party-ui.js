import {isHeroUnlocked,recruitmentNote} from './recruitment.js';
import {icon} from './icons.js';
import {skillsForParty,skillUpgradeLabel,blessingSource,partyTitle} from './blessings.js';
import {hasShizukuBond} from './shizuku-combat.js';
import {PARTY_LIMIT} from './party.js';

export function partyView(party,lead,roster,levelFor,profile,backLabel='戻る'){
  const pool=skillsForParty(party,profile);
  return `<div class="modal-heading party-heading"><span class="eyebrow">ADVENTURE PARTY</span><h2>パーティ編成</h2><p>${isHeroUnlocked(profile,'tsukineko')?'一緒に出発する仲間を、2人まで。':'仲間は、物語を進めると増えていきます。'}</p></div>
  <div class="party-capacity"><strong>出撃メンバー</strong><span><b>${party.length}</b> / ${PARTY_LIMIT}体</span></div>
  <div class="party-roster">${roster.map((hero,i)=>{const unlocked=isHeroUnlocked(profile,hero.id),included=party.includes(hero.id),isLead=lead===i;return `<article class="party-member ${included?'included':!unlocked?'unrecruited':''}"><span class="portrait ${hero.id}" role="img" aria-label="${hero.name}"></span><div class="party-member-name"><strong>${hero.name}</strong><small>Lv.${levelFor(hero.id)} · ${hero.role}</small><span>${!unlocked?recruitmentNote(hero.id):included?(isLead?'先頭で出撃':'援護で出撃'):'待機中'}</span></div><div class="party-member-actions"><button data-party-toggle="${hero.id}" aria-pressed="${included}" aria-label="${hero.name}を${included?'編成から外す':'編成に加える'}" ${!unlocked||included&&party.length===1||!included&&party.length>=PARTY_LIMIT?'disabled':''}>${icon(included?'check':'link')}${!unlocked?'未加入':included?'外す':'連れて行く'}</button>${included?`<button data-party-lead="${i}" aria-pressed="${isLead}" ${isLead?'disabled':''}>${isLead?'先頭':'先頭にする'}</button>`:''}</div></article>`;}).join('')}</div>
  ${hasShizukuBond(party)?`<section class="shizuku-bond" aria-label="雫とにゃんるなの特別ボーナス"><strong>月と雫の親友ボーナス</strong><p>二人の最大HP・攻撃力 +12% ／ 必殺ゲージ獲得 +20%</p><p>二人のゲージが100なら、必殺ボタンで「月雫・おかえりの約束」。二人の掛け声で6連撃・二人を回復。</p></section>`:''}
  <details class="party-blessings" aria-label="この編成の祝福"><summary>この編成の祝福・スキル</summary><div class="party-blessings-title"><span>${icon(party.length===2?'link':'star')} この編成の祝福</span><b>${pool.length}種類</b></div><strong>${partyTitle(party,roster)}</strong><p>${party.length===2?'共通＋ふたりそれぞれの祝福＋連携の祝福。':'共通＋出撃キャラの祝福。単独出撃では援護・交代は使いません。'}<br>クリスタルを集めると、この候補から3択。対象キャラが指定された効果を除き、出撃メンバーで共有します。にゃんるなの必殺技・星屑・周回星は威力1.5倍。</p><div class="party-blessing-list">${pool.map(skill=>`<span data-party-blessing="${skill.id}" data-source="${skill.requires?.length===2?'pair':skill.requires?.[0]??'common'}" title="${blessingSource(skill,roster)}：${skill.text}">${icon(skill.icon)}${skill.name}<small>${skillUpgradeLabel(skill)||blessingSource(skill,roster)}</small></span>`).join('')}</div><button class="skill-loadout-link" data-open-skill-loadout>スキル候補を付け替える ${icon('arrow')}</button></details>
  <p class="party-save-note" role="status">編成は自動保存されます。</p><button class="primary" data-close>${backLabel} ${icon('check')}</button>`;
}
