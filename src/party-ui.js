import {hasNekoLumi} from './lumi-combat.js';
import {hasPredationPair} from './hehereal-predation.js';
import {isHeroUnlocked,recruitmentNote} from './recruitment.js';
import {icon} from './icons.js';
import {skillsForParty,skillUpgradeLabel,blessingSource,partyTitle} from './blessings.js';
import {hasPrimBond} from './prim-combat.js';
import {hasShizukuBond} from './shizuku-combat.js';
import {PARTY_LIMIT,requiredPartyMember} from './party.js';
import {actLabel,actFor} from './acts.js';

export function partyView(party,lead,roster,levelFor,profile,backLabel='戻る',act=null){
  const pool=skillsForParty(party,profile),required=requiredPartyMember(profile,act),heheSolo=actFor(act)?.chapter===5;
  return `<div class="modal-heading party-heading"><span class="eyebrow">ADVENTURE PARTY</span><h2>パーティ編成</h2><p>${isHeroUnlocked(profile,'tsukineko')?'一緒に出発する仲間を、2人まで。':'仲間は、物語を進めると増えていきます。'}</p></div>
  ${required?`<p class="party-required-note" role="status">${actLabel(act)}${required==='omsolo'?(heheSolo?'は初回クリアまでオムソロ操作固定。食事イベント後、へへりあるが援護します。捕食変身中のみへへりあるの単独操作になります。この幕のクリア後は自由編成、2人編成ならNPCへへりあるは参加しません。':'は再挑戦もオムソロ単独で出撃します。') :required==='mochinyafe'?'は初回クリアまで、もちにゃふぇ操作固定。るみがNPC援護に参加します。':required==='tsukineko'?'は初回クリアまで、つきねこ単独で出撃します。':'は初回クリアまで、にゃんるなが必須です。先頭・援護のどちらでも出撃できます。'}${required==='omsolo'?'保存した編成はそのまま残ります。':'この幕のクリア後は自由に編成できます。'}</p>`:''}
  <div class="party-capacity"><strong>出撃メンバー</strong><span><b>${party.length}</b> / ${PARTY_LIMIT}体</span></div>
  <div class="party-roster">${roster.map((hero,i)=>{const unlocked=isHeroUnlocked(profile,hero.id),included=party.includes(hero.id),isLead=lead===i,mandatory=hero.id===required;return `<article class="party-member ${included?'included':!unlocked?'unrecruited':''}"><span class="portrait ${hero.id}" role="img" aria-label="${hero.name}"></span><div class="party-member-name"><strong>${hero.name}</strong><small>Lv.${levelFor(hero.id)} · ${hero.role}</small><span>${!unlocked?recruitmentNote(hero.id):included?(isLead?'先頭で出撃':'援護で出撃'):'待機中'}</span></div><div class="party-member-actions"><button data-party-toggle="${hero.id}" aria-pressed="${included}" aria-label="${mandatory?`${hero.name}は初回クリアまで編成必須`:`${hero.name}を${included?'編成から外す':'編成に加える'}`}" ${required==='tsukineko'||!unlocked||mandatory||included&&party.length===1||!included&&party.length>=PARTY_LIMIT?'disabled':''}>${icon(included?'check':'link')}${!unlocked?'未加入':mandatory?'必須':included?'外す':'連れて行く'}</button>${included?`<button data-party-lead="${i}" aria-pressed="${isLead}" ${isLead?'disabled':''}>${isLead?'先頭':'先頭にする'}</button>`:''}</div></article>`;}).join('')}</div>
  ${hasNekoLumi(party)?'<section class="chapter-seven-brief"><strong>ねこるみ · 射程無限</strong><p>もちにゃふぇと編成している間、るみにねこみみが生えます。通常攻撃・援護・必殺技は距離に関係なく届きます。青・紫・桃の光で装備を見分けられます。</p></section>':''}
  ${hasPredationPair(party)?'<section class="chapter-six-brief"><strong>へへりあるの捕食変身</strong><p>捕食ボタン（F）でオムソロを取り込み、へへへとして単独で戦います。オムソロ分の攻撃力は加算しません。攻撃力・魔法の弓・HP・防御はへへりあるのものを維持。必殺技「捕食の舞」中の撃破1体ごとに、変身時のへへりある自身の攻撃力の10%を追加。幕のクリア・敗北まで解除不可、戦闘終了後に二人へ戻ります。</p></section>':''}
  ${hasPrimBond(party)?`<section class="prim-bond" aria-label="つきねことプリムの特別ボーナス"><strong>星虹のパートナーボーナス</strong><p>二人の最大HP・攻撃力 +12% ／ 必殺ゲージ獲得 +20%</p><p>二人のゲージ100で「星虹・ふたりの帰り道」。搭乗ボタン（R）でプリムが大きくなり、12秒間二人の通常攻撃を同時に行えます。二人ともメイン扱いで、それぞれのHPと防御力で被弾します。移動速度はオムソロと同じ。終了後20秒待機。</p></section>`:''}
  ${hasShizukuBond(party)?`<section class="shizuku-bond" aria-label="雫とにゃんるなの特別ボーナス"><strong>月と雫の親友ボーナス</strong><p>二人の最大HP・攻撃力 +12% ／ 必殺ゲージ獲得 +20%</p><p>二人のゲージが100なら、必殺ボタンで「月雫・おかえりの約束」。二人の掛け声で6連撃・二人を回復。</p></section>`:''}
  <details class="party-blessings" aria-label="この編成の祝福"><summary>この編成の祝福・スキル</summary><div class="party-blessings-title"><span>${icon(party.length===2?'link':'star')} この編成の祝福</span><b>${pool.length}種類</b></div><strong>${partyTitle(party,roster)}</strong><p>${party.length===2?'共通＋ふたりそれぞれの祝福＋連携の祝福。':'共通＋出撃キャラの祝福。単独出撃では援護・交代は使いません。'}<br>クリスタルを集めると、この候補から3択。対象キャラが指定された効果を除き、出撃メンバーで共有します。にゃんるなの必殺技・星屑・周回星は威力1.5倍。</p><div class="party-blessing-list">${pool.map(skill=>`<span data-party-blessing="${skill.id}" data-source="${skill.requires?.length===2?'pair':skill.requires?.[0]??'common'}" title="${blessingSource(skill,roster)}：${skill.text}">${icon(skill.icon)}${skill.name}<small>${skillUpgradeLabel(skill)||blessingSource(skill,roster)}</small></span>`).join('')}</div><button class="skill-loadout-link" data-open-skill-loadout>スキル候補を付け替える ${icon('arrow')}</button></details>
  <p class="party-save-note" role="status">編成は自動保存されます。</p><button class="primary" data-close>${backLabel} ${icon('check')}</button>`;
}
