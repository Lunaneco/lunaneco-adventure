import {actFor} from './acts.js';
import {ENEMY_TYPES} from './enemies.js';
import {GOLDEN_SLIME} from './golden-slime.js';
import {LEVEL_RULES,LEVEL_AWAKENING_COSTS} from './level-rules.js';
import {SKILL_TALENT_NODES} from './skill-tree.js';
import {personalSkills} from './blessings.js';
export {SKILL_TALENT_NODES} from './skill-tree.js';
export const MATERIALS=Object.freeze({
  bloodCrystal:{rarity:3,name:'紅月の結晶',icon:'crystal',source:'第4章の敵・月の門',note:'悪魔の国の通常敵の素材抽選に当選すると1個、各月の門から3個。3段目の成長ツリーとLv.60・70・80への覚醒に使用。'},
  demonHeart:{rarity:3,name:'魔心の宝珠',icon:'heart',source:'第4章のボス・試練',note:'悪魔の国のボスから毎回2個、強ボスから3個。3段目の成長ツリーとLv.60・70・80への覚醒に使用。'},
  starBud:{rarity:1,name:'星の芽',icon:'spark',source:'敵撃破',note:'通常敵から50%で1〜4個、ボスから確定で3個。成長ツリーの強化に使用。'},
  moonDew:{rarity:1,name:'月のしずく',icon:'moon',source:'月の門を突破',note:'各幕の月の門から1個ずつ、全3個。1段目とLv.30へのレベル覚醒に使用。'},
  wardenCore:{rarity:1,name:'守護者の欠片',icon:'star',source:'ボス撃破',note:'各幕のボスを倒すと1個。1段目の最後の星とLv.30へのレベル覚醒に使用。'},
  moonPrism:{rarity:2,name:'月虹の結晶',icon:'moon',source:'第2章・チャレンジの門',note:'第2章、または全章のチャレンジモードで、月の門から1個ずつ、全3個。毎回入手でき、第2章の突破ミッションでも獲得。2段目とLv.40・50へのレベル覚醒に使用。'},
  astralCore:{rarity:2,name:'深星の宝珠',icon:'star',source:'第2章・高難度のボス',note:'第2章またはチャレンジモードのボス、全章の分岐の強ボスから毎回1個。第2章の最終エリア突破ミッションでも1個。2段目とLv.40・50へのレベル覚醒に使用。'},
});
export const TREE_RESOURCES=Object.freeze({...MATERIALS,limitStone:{name:'覚醒の輝石',icon:'crystal',source:'章クリア・高難度試練・レア討伐',note:'各章の第4幕クリアで毎回1個。第3章の金色のスライム討伐1体につき1個。各章の時間制限・ノーダメージ試練でも各1個。レベルの道で素材と一緒に使用。必要数は1・2・4・5・6・8個へ増加し、上限を10ずつ解放。'}});
export const MATERIAL_DROPS=Object.freeze({...Object.fromEntries(Object.entries(ENEMY_TYPES).map(([id,s])=>[id,{starBud:s.buds}])),boss:{starBud:3,wardenCore:1}});
// Higher-rarity rewards supplement normal drops; replaying an eligible stage earns them again.
export const MATERIAL_DROP_CHANCE=.5;
export function enemyMaterials(enemy,act,difficulty,random=Math.random){
  if(enemy.type===GOLDEN_SLIME.type)return {...GOLDEN_SLIME.materials};
  if(enemy.type!=='boss'&&random()>=MATERIAL_DROP_CHANCE)return {};
  return {...MATERIAL_DROPS[enemy.type],...(actFor(act)?.chapter===3?(enemy.type==='boss'?{demonHeart:enemy.elite?3:2}:{bloodCrystal:1}):{}),...(enemy.type==='boss'&&(act>=4||difficulty==='hard'||enemy.elite)?{astralCore:1}:{})};
}
export function gateMaterials(area,act,difficulty){return {moonDew:1,...(actFor(act)?.chapter===3?{bloodCrystal:3}:{}),...(act>=4||difficulty==='hard'?{moonPrism:1}:{})};}
export function resourceLabel(id){const m=TREE_RESOURCES[id];return `${m.rarity?`★${m.rarity} `:''}${m.name}`;}
export function tierMaterialCost(nodes){const total={};for(const node of nodes)for(const [id,n] of Object.entries(node.cost))total[id]=(total[id]??0)+n;return total;}
// Ordered by prerequisites; both the graph and saved-data validation use this order.
export const FIRST_TIER_NODES=Object.freeze([
  {id:'origin',name:'はじまりの光',branch:'原点',icon:'spark',level:1,parents:[],cost:{starBud:4},bonus:{hp:12},x:50,y:12},
  {id:'attack1',name:'攻撃の星 I',branch:'攻撃',icon:'sword',level:3,parents:['origin'],cost:{starBud:8},bonus:{attack:.06},x:18,y:37},
  {id:'guard1',name:'守護の星 I',branch:'守護',icon:'shield',level:3,parents:['origin'],cost:{starBud:8},bonus:{defense:4},x:50,y:37},
  {id:'life1',name:'生命の星 I',branch:'生命',icon:'heart',level:3,parents:['origin'],cost:{starBud:8},bonus:{hp:24},x:82,y:37},
  {id:'attack2',name:'攻撃の星 II',branch:'攻撃',icon:'sword',level:7,parents:['attack1'],cost:{starBud:16,moonDew:2},bonus:{attack:.09},x:18,y:62},
  {id:'guard2',name:'守護の星 II',branch:'守護',icon:'shield',level:7,parents:['guard1'],cost:{starBud:16,moonDew:2},bonus:{defense:7},x:50,y:62},
  {id:'life2',name:'生命の星 II',branch:'生命',icon:'heart',level:7,parents:['life1'],cost:{starBud:16,moonDew:2},bonus:{hp:40},x:82,y:62},
  {id:'awakening',name:'星の目覚め',branch:'奥義',icon:'moon',level:15,parents:['attack2','guard2','life2'],cost:{starBud:24,moonDew:4,wardenCore:1},bonus:{hp:28,attack:.10,defense:6},x:50,y:85},
]);
export const SECOND_TIER_NODES=Object.freeze([
  {id:'ascension',tier:2,name:'深星の扉',branch:'覚醒',icon:'star',level:30,parents:['awakening'],cost:{starBud:160,moonPrism:12,astralCore:4},bonus:{hp:40,attack:.10,defense:8},x:50,y:12},
  {id:'attack3',tier:2,name:'攻撃の星 III',branch:'攻撃',icon:'sword',level:35,parents:['ascension'],cost:{starBud:240,moonPrism:18,astralCore:6},bonus:{attack:.18},x:18,y:37},
  {id:'guard3',tier:2,name:'守護の星 III',branch:'守護',icon:'shield',level:35,parents:['ascension'],cost:{starBud:240,moonPrism:18,astralCore:6},bonus:{defense:18},x:50,y:37},
  {id:'life3',tier:2,name:'生命の星 III',branch:'生命',icon:'heart',level:35,parents:['ascension'],cost:{starBud:240,moonPrism:18,astralCore:6},bonus:{hp:90},x:82,y:37},
  {id:'ultimatePower',tier:2,name:'奥義の威光',branch:'必殺技',icon:'spark',level:40,parents:['attack3'],cost:{starBud:360,moonPrism:30,astralCore:8},bonus:{ultimateDamage:.35},x:18,y:62},
  {id:'ultimateCharge',tier:2,name:'奥義の共鳴',branch:'必殺技',icon:'moon',level:40,parents:['guard3'],cost:{starBud:360,moonPrism:30,astralCore:8},bonus:{ultimateCharge:.25},x:50,y:62},
  {id:'ultimateArt',tier:2,name:'奥義の真髄',branch:'固有必殺技',icon:'shield',level:40,parents:['life3'],cost:{starBud:360,moonPrism:30,astralCore:8},bonus:{},x:82,y:62},
  {id:'transcendence',tier:2,name:'星の超覚醒',branch:'最終奥義',icon:'star',level:50,parents:['ultimatePower','ultimateCharge','ultimateArt'],cost:{starBud:800,moonPrism:60,astralCore:20},bonus:{ultimateDamage:.25},x:50,y:85},
]);
// Tier 3 is the pre-existing skill branch; tier 4 is the third ability tier.
export const THIRD_TIER_NODES=Object.freeze([
 {id:'demonGate',tier:4,name:'紅月の扉',branch:'第3段階',icon:'moon',level:60,parents:['transcendence'],cost:{starBud:400,bloodCrystal:12,demonHeart:3},bonus:{hp:70,attack:.12,defense:12},x:50,y:12},
 {id:'attack4',tier:4,name:'攻撃の星 IV',branch:'攻撃',icon:'sword',level:65,parents:['demonGate'],cost:{starBud:500,bloodCrystal:18,demonHeart:4},bonus:{attack:.24},x:18,y:37},
 {id:'guard4',tier:4,name:'守護の星 IV',branch:'守護',icon:'shield',level:65,parents:['demonGate'],cost:{starBud:500,bloodCrystal:18,demonHeart:4},bonus:{defense:28},x:50,y:37},
 {id:'life4',tier:4,name:'生命の星 IV',branch:'生命',icon:'heart',level:65,parents:['demonGate'],cost:{starBud:500,bloodCrystal:18,demonHeart:4},bonus:{hp:140},x:82,y:37},
 {id:'demonPower',tier:4,name:'奥義の紅月',branch:'必殺技',icon:'spark',level:70,parents:['attack4'],cost:{starBud:650,bloodCrystal:24,demonHeart:6},bonus:{ultimateDamage:.35},x:18,y:62},
 {id:'demonCharge',tier:4,name:'奥義の絆星',branch:'必殺技',icon:'link',level:70,parents:['guard4'],cost:{starBud:650,bloodCrystal:24,demonHeart:6},bonus:{ultimateCharge:.3},x:50,y:62},
 {id:'demonMercy',tier:4,name:'奥義の慈心',branch:'生命',icon:'heart',level:70,parents:['life4'],cost:{starBud:650,bloodCrystal:24,demonHeart:6},bonus:{hp:80,ultimateImmunity:.5},x:82,y:62},
 {id:'demonAwakening',tier:4,name:'紅月の大覚醒',branch:'最終奥義',icon:'star',level:80,parents:['demonPower','demonCharge','demonMercy'],cost:{starBud:1200,bloodCrystal:48,demonHeart:16},bonus:{hp:100,attack:.20,defense:20,ultimateDamage:.3},x:50,y:85},
]);
export const TALENT_NODES=Object.freeze([...FIRST_TIER_NODES,...SECOND_TIER_NODES,...THIRD_TIER_NODES,...SKILL_TALENT_NODES]);
export const LIMIT_BREAK_NODES=Object.freeze(Array.from({length:(LEVEL_RULES.maxLevel-LEVEL_RULES.initialCap)/LEVEL_RULES.capStep},(_,i)=>{
  const level=LEVEL_RULES.initialCap+i*LEVEL_RULES.capStep,cap=level+LEVEL_RULES.capStep;
  return {id:`limit${cap}`,kind:'limit',stage:i+1,name:`レベル覚醒 ${['I','II','III','IV','V','VI'][i]??i+1}`,branch:'レベルの道',icon:'crystal',level,cap,parents:i?[`limit${level}`]:[],cost:LEVEL_AWAKENING_COSTS[i],bonus:{},x:8+i*16.8,y:40};
}));
export const GROWTH_NODES=Object.freeze([...TALENT_NODES,...LIMIT_BREAK_NODES]);
export function isTalentUnlocked(character,id){const limit=LIMIT_BREAK_NODES.find(node=>node.id===id);return limit?character.breaks>=limit.stage:(character.tree??[]).includes(id);}
export function growthCount(character){return (character.tree??[]).length+LIMIT_BREAK_NODES.filter(node=>isTalentUnlocked(character,node.id)).length;}
export function nextLimitNode(character){return LIMIT_BREAK_NODES.find(node=>!isTalentUnlocked(character,node.id))??LIMIT_BREAK_NODES.at(-1);}
export function nodeEffectText(node){return node.kind==='limit'?`レベル上限 Lv.${node.level} → Lv.${node.cap}`:node.kind==='skill'?`祝福候補「${node.name}」を解放：${node.skill.text}`:bonusText(node.bonus);}
export function talentNode(id,heroId){
  const node=GROWTH_NODES.find(n=>n.id===id);if(!node)return null;
  if(node.kind==='skill'){const skill=personalSkills(heroId).find(s=>s.unlockNode===id);return skill?{...node,name:skill.name,icon:skill.icon,skill}:null;}
  if(heroId==='mochinyafe'&&!node.kind){
    if(id==='ultimateArt')return {...node,name:'やさしい子守唄',bonus:{ultimateHeal:24,ultimateRadius:2}};
    if(id==='transcendence')return {...node,name:'ふぇ〜・大いなる目覚め',bonus:{ultimateDamage:.25,ultimatePulses:2,hp:120,attack:.25,defense:24}};
    const bonus={...node.bonus};if(bonus.hp)bonus.hp*=3;if(bonus.defense)bonus.defense*=3;if(bonus.attack)bonus.attack*=2.5;
    return {...node,name:id==='awakening'?'もちもちの目覚め':node.name,bonus};
  }
  if(id==='awakening'&&heroId==='nyanluna')return {...node,name:'月光の極意',bonus:{hp:20,attack:.12,defense:4}};
  if(id==='awakening'&&heroId==='tsukineko')return {...node,name:'星影の極意',bonus:{hp:36,attack:.08,defense:8}};
  if(id==='awakening'&&heroId==='omsolo')return {...node,name:'翠刃の極意',bonus:{hp:44,attack:.10,defense:10}};
  if(heroId==='shizuku'&&id==='ultimateArt')return {...node,name:'刈り取るのは痛みだけ',bonus:{ultimateHeal:18,ultimateRadius:1}};
  if(heroId==='shizuku'&&id==='transcendence')return {...node,name:'雫・紅月の目覚め',bonus:{...node.bonus,ultimatePulses:2}};
  if(id==='ultimateArt'){
    const art={nyanluna:{name:'月華の慈雨',bonus:{ultimateHeal:16,ultimateRadius:1.5}},tsukineko:{name:'彗星の貫徹',bonus:{ultimatePierce:1,ultimateRange:4}},omsolo:{name:'翠光の加護',bonus:{ultimateHeal:12,ultimateImmunity:.6}}}[heroId];
    if(art)return {...node,...art};
  }
  if(id==='transcendence'){
    const art={nyanluna:{name:'月華・超覚醒',bonus:{ultimatePulses:1}},tsukineko:{name:'彗星・超覚醒',bonus:{ultimateShots:4}},omsolo:{name:'翠光・超覚醒',bonus:{ultimatePulses:2}}}[heroId];
    if(art)return {...node,name:art.name,bonus:{...node.bonus,...art.bonus}};
  }
  return node;
}
export function normalizeTalentTree(raw,level=80){
  const requested=new Set(Array.isArray(raw)?raw:[]),valid=[];
  for(const node of TALENT_NODES)if(requested.has(node.id)&&level>=node.level&&node.parents.every(id=>valid.includes(id)))valid.push(node.id);
  return valid;
}
export function talentBonuses(character,heroId){
  return sumBonuses(character,heroId,['hp','attack','defense']);
}
export function ultimateBonuses(character,heroId){
  return sumBonuses(character,heroId,['ultimateDamage','ultimateCharge','ultimateHeal','ultimateRadius','ultimatePierce','ultimateRange','ultimateImmunity','ultimatePulses','ultimateShots']);
}
function sumBonuses(character,heroId,keys){
  const bonus=Object.fromEntries(keys.map(key=>[key,0]));
  for(const id of normalizeTalentTree(character.tree,character.level)){const node=talentNode(id,heroId);if(!node)continue;for(const stat of Object.keys(bonus))bonus[stat]+=node.bonus[stat]??0;}
  return bonus;
}
export function bonusText(bonus){return [bonus.hp?`基礎HP +${bonus.hp}`:'',bonus.attack?`基礎攻撃力 +${Math.round(bonus.attack*100)}%`:'',bonus.defense?`基礎防御力 +${bonus.defense}`:'',
  bonus.ultimateDamage?`必殺技威力 +${Math.round(bonus.ultimateDamage*100)}%`:'',bonus.ultimateCharge?`必殺ゲージ獲得 +${Math.round(bonus.ultimateCharge*100)}%`:'',
  bonus.ultimateHeal?`必殺技の回復量 +${bonus.ultimateHeal}`:'',bonus.ultimateRadius?`必殺技の半径 +${bonus.ultimateRadius}`:'',bonus.ultimatePierce?`必殺弾の貫通 +${bonus.ultimatePierce}体`:'',bonus.ultimateRange?`必殺弾の射程 +${bonus.ultimateRange}`:'',bonus.ultimateImmunity?`必殺技の無敵時間 +${bonus.ultimateImmunity}秒`:'',bonus.ultimatePulses?`必殺技の攻撃回数 +${bonus.ultimatePulses}回`:'',bonus.ultimateShots?`必殺技の連射数 +${bonus.ultimateShots}発`:'',
].filter(Boolean).join(' ／ ');}
