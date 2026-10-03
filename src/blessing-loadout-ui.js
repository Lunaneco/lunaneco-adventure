import {icon} from './icons.js';
import {SKILLS,loadoutSkillChoices,hasFreeSkillLoadout,equippedSkills,isSkillAvailable,SKILL_SLOTS,skillUpgradeLabel} from './blessings.js';

export function blessingLoadoutView(profile,hero,selectedSlot=0,{party=false}={}){
  const loadout=equippedSkills(profile,hero.id),slot=Number.isInteger(selectedSlot)&&selectedSlot>=0&&selectedSlot<SKILL_SLOTS?selectedSlot:0;
  const free=hasFreeSkillLoadout(profile),skills=loadoutSkillChoices(profile,hero.id),available=skills.filter(s=>isSkillAvailable(profile,hero.id,s.id));
  const slotAttribute=party?'data-party-skill-slot':'data-blessing-slot',equipAttribute=party?'data-party-equip-skill':'data-equip-blessing';
  return `<section class="blessing-loadout" id="${party?'party-skill-loadout':'blessing-loadout'}" aria-label="${hero.name}のスキル候補を付け替える">
    <header><small>SKILL LOADOUT</small><h3>祝福の候補をセット</h3><span>${available.length} / ${skills.length}種類 解放</span></header>
    ${free?'<p class="free-skill-unlocked">極宴クリア報酬：全員のスキル・全枠の付け替え解放。編成や成長ツリーの解放状況に関係なく選べます。</p>':''}
    <p>枠を選び、下のスキルをタップして入れ替え。セットした3つが、戦闘中の3択候補に入ります。</p>
    <div class="blessing-slots" role="group" aria-label="入れ替えるスキル枠">${loadout.map((id,i)=>{const skill=SKILLS.find(s=>s.id===id);return `<button ${slotAttribute}="${i}" aria-pressed="${slot===i}" aria-label="${hero.name}の枠${i+1}：${skill.name}"><small>枠 ${i+1}</small>${icon(skill.icon)}<strong>${skill.name}</strong></button>`;}).join('')}</div>
    <h4>${hero.name}の枠${slot+1}に入れるスキル</h4><div class="blessing-options">${available.map(skill=>{const current=loadout.indexOf(skill.id);return `<button ${equipAttribute}="${skill.id}" data-blessing-hero="${hero.id}" aria-label="${skill.name}を枠${slot+1}にセット" ${loadout[slot]===skill.id?'disabled':''}>${icon(skill.icon)}<span>${skill.upgrades?`<b class="skill-upgrade-label">${skillUpgradeLabel(skill)}</b>`:''}<strong>${skill.name}</strong><small>${skill.text}</small></span><em>${current===slot?'セット中':current>=0?`枠${current+1}と交換`:'セット'}</em></button>`;}).join('')}</div>
    <p class="blessing-loadout-note">上位版は元の効果を継承して強化。元のスキルと両方選んだ場合、共通の効果は高い方のランクで適用します。<br>共通4種と二人の連携スキルは、編成に応じて自動で追加。枠を使いません。${free?'<br>極宴クリア後は、他キャラ・未解放の上位版・連携スキルも枠にセットできます。効果の対象キャラ・武器条件は各スキルの説明どおりです。対象が出撃していないスキルは効果が出ない場合があります。':''}<br>効果が発動するのは戦闘中に祝福を選んでから。効果はその幕の全6WAVEで続き、新しい出撃でリセットされます。候補の設定は自動保存・付け替え無料です。</p>
  </section>`;
}

export function skillUnlockDetail(profile,hero,node,status){
  const equipped=equippedSkills(profile,hero.id).includes(node.skill.id);
  return `<p class="skill-upgrade-label">${skillUpgradeLabel(node.skill)}</p><p class="talent-effect">${node.skill.text}</p><p class="talent-permanent">効果の数値は1回取得するごとの増加量です。最大 ${node.skill.max} 回まで重ねて取得できます。</p><p class="skill-unlock-guide">この星で${hero.name}の祝福候補を解放します。解放後に3枠へセットし、戦闘中のクリスタル3択で選ぶと効果が発動します。</p>${status.owned?`<p class="talent-owned-note">✓ 候補は解放済み · ${equipped?'セット中':'未セット'}</p><button class="skill-loadout-link" data-edit-blessings>候補を付け替える ${icon('arrow')}</button>`:''}`;
}
