import {ultimateFor} from './abilities.js';
import {ultimateBonuses,bonusText} from './talents.js';
import {icon} from './icons.js';
export function heroAbilities(hero,character){
  const ultimate=ultimateFor(hero.id,character),growth=character?bonusText(ultimateBonuses(character,hero.id)):'';
  return `<section class="hero-abilities ${hero.id}" aria-label="${hero.name}の特性と必殺技"><div class="hero-trait"><span>${icon(hero.skillPower>1?'spark':'shield')}</span><div><small>${hero.role} · 固有特性</small><strong>${hero.trait}</strong><p>${hero.traitText}</p></div></div><div class="hero-signature"><span>${icon(ultimate.icon)}</span><div><small>固有必殺技 · キャラ別ゲージ</small><strong>${ultimate.name}</strong><p>${ultimate.note}</p>${growth?`<p class="ultimate-tree-bonus">ツリー強化：${growth}</p>`:''}</div></div>${hero.skillPower>1?'<p class="skill-affinity-note">威力補正は必殺技・撃破時の星屑・周回星に適用。通常攻撃やHP強化は対象外です。</p>':''}</section>`;
}
