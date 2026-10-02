import {publicUrl} from './public-url.js';
export const WEAPONS=Object.freeze({
  hehereal:{id:'hehereal-bow',name:'桜心の魔法弓・2743',kind:'bow',icon:'spark',effectColor:0xff8fc7,note:'へへりある専用。桜色の魔法矢が遠くの敵を追尾する。'},
  prim:{id:'prism-claw',name:'虹晶の爪・はじまり',kind:'claw',icon:'sword',effectColor:0xaeefff,note:'プリム専用。三本の虹晶の爪で近くの敵を扇状にひっかく。'},
  shizuku:{id:'crimson-scythe',name:'紅月の鎌・しずく',kind:'scythe',icon:'sword',effectColor:0xf2a6c7,note:'雫専用。黒銀の大鎌で近くの敵を扇状に斬り、与えた実ダメージの10%を自分のHPへ吸収する。'},
  mochinyafe:{id:'mochi-voice',name:'ふぇ鈴・もちの音',kind:'chime',icon:'heart',effectColor:0xffb8d4,note:'もちにゃふぇ専用の桜色の鈴。小さな声を追尾する音の弾に変え、弱い攻撃でも命中時に最低1ダメージ。援護は4秒間隔・射程13・4体貫通。'},
  omsolo:{id:'light-saber',name:'ライトセーバー・翠守',kind:'saber',icon:'sword',note:'オムソロ専用。近距離の敵を扇状にまとめて斬り払う緑の光刃。'},
  nyanluna:{id:'luna-staff',name:'月詠の杖・ルナリア',kind:'staff',icon:'moon',note:'にゃんるな専用。敵を追いかける月光弾を放つ。'},
  tsukineko:{id:'nox-rifle',name:'星穿銃・ノクス',kind:'gun',icon:'gun',note:'つきねこ専用。直進する星弾が敵を2体まで貫通する。'},
});
export const UNIQUE_EQUIPMENT=Object.freeze([
  {id:'prism-first-light',name:'はじまりの晶針',act:16,area:2,icon:'star',color:'#bceaff',bonus:{hp:80,attack:.24},note:'プリズムの国で二人がつないだ光の証。HP +80／攻撃力 +24%。'},
  {id:'aurora-wing-charm',name:'オーロラの翼飾り',act:17,area:2,icon:'star',color:'#bceaff',bonus:{hp:100,defense:24},note:'プリズムの国で二人がつないだ光の証。HP +100／防御力 +24。'},
  {id:'prism-heart-knot',name:'星虹の心結び',act:18,area:2,icon:'star',color:'#bceaff',bonus:{hp:85,attack:.22,defense:18},note:'プリズムの国で二人がつないだ光の証。HP +85／攻撃力 +22%／防御力 +18。'},
  {id:'prism-home-crown',name:'虹還りの小冠',act:19,area:2,icon:'star',color:'#bceaff',bonus:{hp:110,attack:.26,defense:26},note:'プリズムの国で二人がつないだ光の証。HP +110／攻撃力 +26%／防御力 +26。'},
  {id:'meadow-charm',name:'星露の花飾り',area:0,icon:'heart',color:'#b6e3c4',bonus:{hp:30},note:'草原の朝露を閉じ込めた花。最大HP +30。'},
  {id:'ruins-lens',name:'月影の照準石',area:1,icon:'spark',color:'#b7cbf6',bonus:{attack:.12},note:'遺跡に残された月のレンズ。攻撃力 +12%。'},
  {id:'dawn-seal',name:'暁守の紋章',area:2,icon:'shield',color:'#f3d097',bonus:{defense:12},note:'聖域の光を宿す紋章。防御力 +12。'},
  {id:'clock-pendant',name:'星時計のペンダント',act:1,area:2,icon:'spark',color:'#93d9ec',bonus:{attack:.08,defense:6},note:'再び動き出した星時計。攻撃力 +8%／防御力 +6。'},
  {id:'cloud-feather',name:'雲渡りの羽',act:2,area:2,icon:'heart',color:'#b5edec',bonus:{hp:24,defense:8},note:'雲海を越えた約束の羽。最大HP +24／防御力 +8。'},
  {id:'twin-star-knot',name:'ふたりの星結び',act:3,area:2,icon:'link',color:'#ceb7ff',bonus:{hp:20,attack:.08},note:'月と星が寄り添う親友の証。最大HP +20／攻撃力 +8%。'},
  {id:'woodland-token',name:'木漏れ日の護符',act:4,area:2,icon:'heart',color:'#b4dda2',bonus:{hp:35,defense:5},note:'森で拾った勇気の印。最大HP +35／防御力 +5。'},
  {id:'jade-guard',name:'翡翠の腕輪',act:5,area:2,icon:'shield',color:'#85e6c0',bonus:{attack:.10,defense:9},note:'緑の光を映す腕輪。攻撃力 +10%／防御力 +9。'},
  {id:'bell-fragment',name:'静かな星鐘',act:6,area:2,icon:'star',color:'#dcb8ff',bonus:{hp:30,attack:.12},note:'救うために鳴らした鐘。最大HP +30／攻撃力 +12%。'},
  {id:'guardian-knot',name:'守り手の結び',act:7,area:2,icon:'link',color:'#afffcc',bonus:{hp:35,attack:.10,defense:8},note:'小さな願いに応えた証。最大HP +35／攻撃力 +10%／防御力 +8。'},
  {id:'mochi-sakura-brooch',name:'桜もちの花結び',act:8,area:2,icon:'heart',color:'#ffbfd5',bonus:{hp:60,defense:12},note:'返事のない里で守り抜いた、桜色の花飾り。最大HP +60／防御力 +12。'},
  {id:'mochi-dream-hourglass',name:'夢砂糖の砂時計',act:9,area:2,icon:'spark',color:'#d3bbff',bonus:{attack:.18,defense:10},note:'奪われた眠りを取り戻す、小さな砂時計。攻撃力 +18%／防御力 +10。'},
  {id:'mochi-echo-bell-relic',name:'こだまの祈り鈴',act:10,area:2,icon:'star',color:'#ffd49d',bonus:{hp:45,attack:.16,defense:10},note:'闇に閉じられた声を、もう一度届ける祈りの鈴。最大HP +45／攻撃力 +16%／防御力 +10。'},
  {id:'mochi-promise-crown',name:'ふぇ〜の約束冠',act:11,area:2,icon:'link',color:'#ffb8df',bonus:{hp:60,attack:.20,defense:16},note:'ひとりぼっちにしない約束を結んだ、小さな冠。最大HP +60／攻撃力 +20%／防御力 +16。'},
  {id:'demon-crimson-rose',name:'紅月の黒薔薇飾り',act:12,area:2,icon:'heart',color:'#d992b5',bonus:{hp:80,attack:.24},note:'眠らない街を守り抜いた、紅い雫を抱く黒薔薇。最大HP +80／攻撃力 +24%。'},
  {id:'demon-lullaby-charm',name:'安らぎの夜鈴',act:13,area:2,icon:'shield',color:'#bba5ef',bonus:{hp:100,defense:24},note:'暴走した子守歌に、穏やかな眠りを取り戻す銀の鈴。最大HP +100／防御力 +24。'},
  {id:'demon-moon-drop-knot',name:'月雫の親友結び',act:14,area:2,icon:'link',color:'#d5b5ef',bonus:{hp:85,attack:.22,defense:18},note:'月と紅い雫を結んだ、背中を預け合う大の仲良しの証。最大HP +85／攻撃力 +22%／防御力 +18。'},
  {id:'demon-kind-king-crown',name:'優しき魔王の冠',act:15,area:2,icon:'star',color:'#e3be8b',bonus:{hp:110,attack:.26,defense:26},note:'正気を取り戻した悪魔大王から贈られた、みんなを守る冠。最大HP +110／攻撃力 +26%／防御力 +26。'},
]);
export const equipmentImage=id=>id==='hehereal-bow'?publicUrl('assets/equipment/hehereal-bow-v1.png'):publicUrl(`assets/equipment/${['prism-first-light','aurora-wing-charm','prism-heart-knot','prism-home-crown'].includes(id)?id+'-v1':id}.${(id.startsWith('crimson-')||id.startsWith('mochi-')||['light-saber','woodland-token','jade-guard','bell-fragment','guardian-knot'].includes(id))?'png':'webp'}`);
export const uniqueEquipment=id=>UNIQUE_EQUIPMENT.find(item=>item.id===id);
const safeId=id=>typeof id==='string'&&/^[a-z0-9_-]{1,64}$/i.test(id)&&!['__proto__','constructor','prototype'].includes(id);
export function normalizeEquipment(raw){
  const owned=UNIQUE_EQUIPMENT.filter(item=>Array.isArray(raw?.owned)&&raw.owned.includes(item.id)).map(item=>item.id),loadout={},used=new Set();
  for(const [hero,id] of Object.entries(raw?.loadout&&typeof raw.loadout==='object'?raw.loadout:{}))if(safeId(hero)&&owned.includes(id)&&!used.has(id)){loadout[hero]=id;used.add(id);}
  return {owned,loadout};
}
export function equipmentBonuses(equipment,heroId){const id=equipment?.loadout?.[heroId];return equipment?.owned?.includes(id)?uniqueEquipment(id)?.bonus??{}:{};}
export function equipmentOwner(equipment,id){return Object.keys(equipment.loadout).find(hero=>equipment.loadout[hero]===id);}
export function equipUnique(equipment,heroId,id,{transfer=false}={}){
  if(!Object.hasOwn(WEAPONS,heroId))return false;
  if(id===''){delete equipment.loadout[heroId];return true;}
  if(!equipment.owned.includes(id)||!uniqueEquipment(id))return false;
  const owner=equipmentOwner(equipment,id);if(owner&&owner!==heroId){if(!transfer)return false;delete equipment.loadout[owner];}
  equipment.loadout[heroId]=id;return true;
}
export function equipmentBonusText(bonus){return [bonus.hp?`HP +${bonus.hp}`:'',bonus.attack?`攻撃力 +${Math.round(bonus.attack*100)}%`:'',bonus.defense?`防御力 +${bonus.defense}`:''].filter(Boolean).join(' ／ ')||'補正なし';}
