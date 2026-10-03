import {SKILL_TALENT_NODES} from './skill-tree.js';
import {isHeroUnlocked} from './recruitment.js';
export const SKILL_SLOTS=3;
export const SKILLS = [
 {id:'lumiPower',requires:['lumi'],name:'小さな指先の光',icon:'spark',type:'光術',text:'るみのレールガン威力 +20%',max:3},
 {id:'lumiReach',requires:['lumi'],name:'帰り道まで届け',icon:'wind',type:'光術',text:'通常るみの射程 +2。ねこるみは引き続き無限',max:3},
 {id:'lumiFocus',requires:['lumi'],name:'ねこみみのときめき',icon:'star',type:'必殺',text:'るみの必殺ゲージ獲得 +20%',max:3},
 {id:'lumiTempo',requires:['lumi'],upgrades:'lumiPower',unlockNode:'blessing1',name:'重なる指先の光',icon:'spark',type:'光術',text:'威力+20%を継承。攻撃間隔8%短縮',max:3},
 {id:'lumiFar',requires:['lumi'],upgrades:'lumiReach',unlockNode:'blessing2',name:'村までつづく光',icon:'wind',type:'光術',text:'通常射程+2を継承。必殺技の射程+2',max:3},
 {id:'lumiBrave',requires:['lumi'],upgrades:'lumiFocus',unlockNode:'blessing3',name:'好きでいても、いい',icon:'star',type:'必殺',text:'ゲージ+20%を継承。必殺技威力+15%',max:3},
 {id:'sakuraPower',requires:['hehereal'],name:'桜心の矢',icon:'spark',type:'弓術',text:'へへりあるの通常追尾矢ダメージ +20%',max:3},
 {id:'sakuraReach',requires:['hehereal'],name:'遠くの誰かへ',icon:'wind',type:'弓術',text:'へへりあるの弓の射程 +2',max:3},
 {id:'sakuraFocus',requires:['hehereal'],name:'いただきますの力',icon:'star',type:'必殺',text:'へへりあるの必殺ゲージ獲得 +20%',max:3},
 {id:'sakuraTempo',requires:['hehereal'],upgrades:'sakuraPower',unlockNode:'blessing1',name:'花びらの連射',icon:'spark',type:'弓術',text:'追尾矢の威力+20%を継承。さらに攻撃間隔8%短縮',max:3},
 {id:'sakuraFar',requires:['hehereal'],upgrades:'sakuraReach',unlockNode:'blessing2',name:'まっすぐな約束',icon:'wind',type:'弓術',text:'弓の射程+2を継承。さらに必殺技の射程+2',max:3},
 {id:'sakuraBrave',requires:['hehereal'],upgrades:'sakuraFocus',unlockNode:'blessing3',name:'半分の勇気',icon:'star',type:'必殺',text:'ゲージ獲得+20%を継承。さらに本人の必殺技威力+15%',max:3},
 {id:'primPower',requires:['prim'],name:'虹晶の爪研ぎ',icon:'sword',type:'爪術',text:'プリムの通常爪攻撃ダメージ +20%',max:3},
 {id:'primReach',requires:['prim'],name:'小竜の踏み込み',icon:'wind',type:'爪術',text:'プリムの爪の範囲 +0.4',max:3},
 {id:'primFocus',requires:['prim'],name:'七彩の息づかい',icon:'star',type:'必殺',text:'プリムの必殺ゲージ獲得 +20%',max:3},
 {id:'primTempo',requires:['prim'],upgrades:'primPower',unlockNode:'blessing1',name:'キュ〜の連爪',icon:'sword',type:'爪術',text:'爪の威力+20%を継承。さらにプリムの攻撃間隔8%短縮',max:3},
 {id:'primBeam',requires:['prim'],upgrades:'primReach',unlockNode:'blessing2',name:'虹の向こうへ',icon:'spark',type:'爪術',text:'爪の範囲+0.4を継承。さらにプリズムブレスの射程 +2',max:3},
 {id:'primBrave',requires:['prim'],upgrades:'primFocus',unlockNode:'blessing3',name:'声を信じて',icon:'star',type:'必殺',text:'プリムのゲージ獲得+20%を継承。さらに本人の必殺技威力 +15%',max:3},
 {id:'prismBond',requires:['tsukineko','prim'],name:'同じ光を見ていた',icon:'link',type:'絆',text:'つきねことプリムの与えるダメージ +15%。搭乗中も有効',max:3},

 {id:'shizukuPower',requires:['shizuku'],name:'黒薔薇の刃',icon:'sword',type:'鎌術',text:'雫の通常斬撃ダメージ +20%',max:3},
 {id:'shizukuDrain',requires:['shizuku'],name:'痛みをもらう',icon:'heart',type:'吸収',text:'雫のHP吸収率 +2.5ポイント',max:3},
 {id:'shizukuReach',requires:['shizuku'],name:'そこにいろ',icon:'wind',type:'鎌術',text:'雫の鎌の範囲 +0.4',max:3},
 {id:'shizukuTempo',requires:['shizuku'],upgrades:'shizukuPower',unlockNode:'blessing1',name:'早く終わらせる',icon:'sword',type:'鎌術',text:'通常斬撃+20%を継承。さらに攻撃間隔8%短縮',max:3},
 {id:'shizukuMercy',requires:['shizuku'],upgrades:'shizukuDrain',unlockNode:'blessing2',name:'無茶するな',icon:'heart',type:'吸収',text:'HP吸収率+2.5ポイントを継承。さらに雫の被ダメージ10%軽減',max:3},
 {id:'shizukuPromise',requires:['shizuku'],upgrades:'shizukuReach',unlockNode:'blessing3',name:'言えない約束',icon:'link',type:'鎌術',text:'鎌の範囲+0.4を継承。さらに雫の必殺ゲージ獲得+15%',max:3},
 {id:'moonDropBond',requires:['nyanluna','shizuku'],name:'コーラは二人分',icon:'link',type:'絆',text:'二人の与えるダメージ +15%。編成だけのHP・攻撃+12%とゲージ+20%にも重なる',max:3},
  {id:'mochiLull',requires:['mochinyafe'],name:'ねむねむのこだま',icon:'moon',type:'妨害',text:'ふぇ〜による雑魚の停止時間 +0.3秒',max:3},
  {id:'mochiReach',requires:['mochinyafe'],name:'とどけ、小さな声',icon:'wind',type:'援護',text:'援護の声の射程 +2、貫通数 +1体',max:3},
  {id:'mochiMend',requires:['mochinyafe'],name:'ほっとする声',icon:'heart',type:'回復',text:'援護の声を放つたび操作キャラのHPを2回復',max:3},
  {id:'mochiWeaken',requires:['mochinyafe'],upgrades:'mochiLull',unlockNode:'blessing1',name:'闇をほどく声',icon:'shield',type:'妨害',text:'雑魚の停止時間 +0.5秒（元は+0.3秒）。さらにボスの攻撃・防御低下を5ポイント強化',max:3},
  {id:'mochiBrave',requires:['mochinyafe'],upgrades:'mochiReach',unlockNode:'blessing2',name:'ちいさな勇気',icon:'heart',type:'攻撃',text:'援護の声の射程 +2・貫通数 +1体を継承。さらに通常音弾の威力 +30%',max:3},
  {id:'mochiCharge',requires:['mochinyafe'],upgrades:'mochiMend',unlockNode:'blessing3',name:'夢をつなぐ声',icon:'star',type:'必殺',text:'援護のたびHPを4回復（元は2）。さらに本人の必殺ゲージを3獲得',max:3},
  { id:'power', requires:['nyanluna', 'tsukineko'], name:'月と銃の約束', icon:'spark', type:'攻撃', text:'ふたりの与えるダメージ +25%', max:4 },
  { id:'haste', requires:['tsukineko'], name:'星降るリズム', icon:'wind', type:'速度', text:'通常攻撃の間隔を 15% 短縮', max:3 },
  { id:'vitality', name:'生命の花冠', icon:'heart', type:'守護', text:'最大HP +40、HPを60回復', max:3 },
  { id:'nova', requires:['nyanluna'], name:'こぼれる星屑', icon:'star', type:'連鎖', text:'敵を倒すと周囲へ星屑攻撃。にゃんるなは威力1.5倍', max:3 },
  { id:'orbit', requires:['nyanluna'], name:'月衛の輪', icon:'moon', type:'魔法', text:'操作キャラを守る周回星を1つ追加。にゃんるなは威力1.5倍', max:3 },
  { id:'echo', requires:['nyanluna', 'tsukineko'], name:'双星の共鳴', icon:'link', type:'絆', text:'控えの仲間の援護攻撃を 35% 強化', max:3 },
  { id:'stride', name:'風の足音', icon:'wind', type:'回避', text:'移動速度 +12%、回避の再使用を短縮', max:3 },
  { id:'focus', requires:['tsukineko'], name:'星銃の闘志', icon:'moon', type:'必殺', text:'攻撃した本人の必殺ゲージ獲得量 +30%', max:3 },
  { id:'leech', name:'やさしい灯火', icon:'heart', type:'回復', text:'敵を6体倒すたびHPを8回復', max:3 },
  { id:'crit', requires:['tsukineko'], name:'一番星の閃き', icon:'gun', type:'会心', text:'会心率 +15%（基礎会心ダメージ2倍）', max:3 },
  { id:'reach', requires:['nyanluna'], name:'遠い星への手紙', icon:'spark', type:'射程', text:'攻撃範囲 +18%、クリスタルの回収範囲拡大', max:3 },
  { id:'ward', name:'夜明けのヴェール', icon:'shield', type:'守護', text:'受けるダメージを 15% 軽減', max:3 },
  {id:'saberPower',requires:['omsolo'],name:'翠刃の研鑽',icon:'sword',type:'剣術',text:'オムソロの通常斬撃ダメージ +22%',max:4},
  {id:'saberReach',requires:['omsolo'],name:'踏み込みの光',icon:'wind',type:'剣術',text:'オムソロの斬撃範囲 +0.35',max:3},
  {id:'saberGuard',requires:['omsolo'],name:'守り手の構え',icon:'shield',type:'守護',text:'編成全体の被ダメージをさらに15%軽減',max:2},
  {id:'moonGuard',requires:['nyanluna','omsolo'],name:'月と翠刃の誓い',icon:'link',type:'絆',text:'にゃんるなとオムソロの与えるダメージ +18%',max:3},
  {id:'starBlade',requires:['tsukineko','omsolo'],name:'銃剣の挟撃',icon:'link',type:'絆',text:'与えるダメージ +18%／援護攻撃 +20%',max:3},
  {id:'arcanePower',requires:['nyanluna'],upgrades:'nova',unlockNode:'blessing1',name:'月詠みの魔力',icon:'spark',type:'魔法',text:'撃破時の星屑攻撃を継承。さらに星屑の範囲 +0.6、必殺技・星屑・周回星の威力 +18%',max:3},
  {id:'starlightHeal',requires:['nyanluna'],upgrades:'orbit',unlockNode:'blessing2',name:'星結びの祝福',icon:'heart',type:'回復',text:'周回星を1つ追加し、各星の基礎威力 +4（元は12）。さらに祝福選択時にHP18回復、にゃんるな操作中は27回復',max:3},
  {id:'moonFrost',requires:['nyanluna'],upgrades:'reach',unlockNode:'blessing3',name:'月影の結界',icon:'moon',type:'妨害',text:'攻撃範囲 +18%・回収範囲拡大を継承。さらに通常魔法で2秒間35%／45%／55%減速。ボスは半分',max:3},
  {id:'penetration',requires:['tsukineko'],upgrades:'haste',unlockNode:'blessing1',name:'貫く星弾',icon:'gun',type:'射撃',text:'通常攻撃の間隔15%短縮を継承。さらにつきねこの通常弾の貫通数 +1体',max:3},
  {id:'preciseAim',requires:['tsukineko'],upgrades:'crit',unlockNode:'blessing2',name:'狙い澄ます一瞬',icon:'spark',type:'会心',text:'会心率 +15%を継承。さらに通常攻撃の会心倍率 +0.25倍（基礎2倍）',max:3},
  {id:'rapidCharge',requires:['tsukineko'],upgrades:'focus',unlockNode:'blessing3',name:'星銃の装填',icon:'gun',type:'必殺',text:'必殺ゲージ獲得量 +30%を継承。さらに撃破時の基礎獲得量 +2。必殺技による撃破は対象外',max:3},
  {id:'bladeTempo',requires:['omsolo'],upgrades:'saberPower',unlockNode:'blessing1',name:'翠刃の連舞',icon:'sword',type:'剣術',text:'オムソロの通常斬撃ダメージ +22%を継承。さらに斬撃の間隔を10%短縮',max:4},
  {id:'counterGuard',requires:['omsolo'],upgrades:'saberGuard',unlockNode:'blessing2',name:'揺るがぬ守り',icon:'shield',type:'守護',text:'編成全体の被ダメージ15%軽減を継承。さらに被弾後の無敵時間 +0.2秒',max:3},
  {id:'vowRecovery',requires:['omsolo'],upgrades:'saberReach',unlockNode:'blessing3',name:'守り手の祈り',icon:'heart',type:'回復',text:'オムソロの斬撃範囲 +0.5（元は+0.35）。さらにHP回復量 +15%。祝福・門・必殺技に有効',max:3},
];
// Combat inherits the original effect. Picking both keeps the higher rank instead of double-counting.
const UPGRADE_FOR=Object.freeze(Object.fromEntries(SKILLS.filter(s=>s.upgrades).map(s=>[s.upgrades,s.id])));
export function skillEffectRank(ranks,id){return Math.max(ranks[id]??0,ranks[UPGRADE_FOR[id]]??0);}
export function skillUpgradeLabel(skill){const base=SKILLS.find(s=>s.id===skill.upgrades);return base?`上位版 · ${base.name}`:'';}
export const PERSONAL_SKILLS=Object.freeze(Object.fromEntries(['nyanluna','tsukineko','omsolo','mochinyafe','shizuku','prim','hehereal','lumi'].map(id=>[id,SKILLS.filter(s=>s.requires?.length===1&&s.requires[0]===id)])));
export function personalSkills(heroId){return Object.hasOwn(PERSONAL_SKILLS,heroId)?PERSONAL_SKILLS[heroId]:[];}
export function defaultSkills(heroId){return personalSkills(heroId).filter(s=>!s.unlockNode).map(s=>s.id);}
// Derive this permanent reward from the existing validated EX clear record.
export const hasFreeSkillLoadout=profile=>profile?.story?.chapterSixCleared===true&&profile.story.extraClears?.[5]===true;
export const loadoutSkillChoices=(profile,heroId)=>Object.hasOwn(PERSONAL_SKILLS,heroId)?hasFreeSkillLoadout(profile)?SKILLS:personalSkills(heroId):[];
export function isSkillAvailable(profile,heroId,skillId){
  if(!Object.hasOwn(PERSONAL_SKILLS,heroId))return false;
  if(hasFreeSkillLoadout(profile))return SKILLS.some(s=>s.id===skillId);
  const skill=personalSkills(heroId).find(s=>s.id===skillId);if(!skill)return false;
  if(!skill.unlockNode)return true;
  const node=SKILL_TALENT_NODES.find(n=>n.id===skill.unlockNode),p=profile?.characters?.[heroId];
  return Array.isArray(p?.tree)&&p.level>=node.level&&p.tree.includes(node.id)&&node.parents.every(id=>p.tree.includes(id));
}
export function equippedSkills(profile,heroId){
  const raw=profile?.blessingLoadouts?.[heroId],valid=[];
  for(const id of [...(Array.isArray(raw)?raw:[]),...defaultSkills(heroId)]){
    if(valid.length===SKILL_SLOTS)break;
    if(!valid.includes(id)&&isSkillAvailable(profile,heroId,id))valid.push(id);
  }
  return valid;
}
export function normalizeSkillLoadouts(raw,profile){return Object.fromEntries(Object.keys(PERSONAL_SKILLS).map(id=>[id,equippedSkills({...profile,blessingLoadouts:raw},id)]));}
export function equipSkill(profile,heroId,slot,skillId){
  if(!isHeroUnlocked(profile,heroId)||!Number.isInteger(slot)||slot<0||slot>=SKILL_SLOTS||!isSkillAvailable(profile,heroId,skillId))return false;
  const next=equippedSkills(profile,heroId),old=next.indexOf(skillId);
  if(next[slot]===skillId)return false;
  if(old!==-1)next[old]=next[slot];
  next[slot]=skillId;profile.blessingLoadouts??={};profile.blessingLoadouts[heroId]=next;return true;
}
// Common and pair blessings are automatic. Personal candidates use a fixed loadout.
export function skillsForParty(party,profile){
  const ids=new Set(party),equipped=new Set(party.flatMap(id=>equippedSkills(profile,id)));
  if(hasFreeSkillLoadout(profile))return SKILLS.filter(skill=>equipped.has(skill.id)||skill.requires?.length!==1&&(skill.requires??[]).every(id=>ids.has(id)));
  return SKILLS.filter(skill=>(skill.requires??[]).every(id=>ids.has(id))&&(skill.requires?.length!==1||equipped.has(skill.id)));
}
export function blessingSource(skill,roster){
  if(!skill.requires?.length)return '共通';
  if(skill.requires.length>1)return 'ふたりの連携';
  return `${roster.find(hero=>hero.id===skill.requires[0])?.name??'仲間'}の祝福`;
}
export function partyTitle(party,roster){return party.map(id=>roster.find(hero=>hero.id===id)?.name??'仲間').join(' × ');}
