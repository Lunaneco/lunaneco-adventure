import {WEAPONS,equipmentImage} from './equipment.js';
import {publicUrl} from './public-url.js';
import {isHeroUnlocked} from './recruitment.js';
import {MOCHI_SUPPORT} from './mochi-combat.js';
import {shizukuScytheName} from './shizuku-weapons.js';

export const WEAPON_TICKET_DROP_RATE=.05;
export const WEAPON_MULTI_DRAW_COUNT=10;
export const WEAPON_HERO_IDS=Object.freeze(['nyanluna','tsukineko','omsolo','mochinyafe','shizuku','prim','hehereal','lumi']);
export const WEAPON_RARITIES=Object.freeze([
  Object.freeze({rank:1,name:'通常',color:'#b7cbc7',attack:0,chance:0,duplicateBuds:0}),
  Object.freeze({rank:2,name:'希少',color:'#86d5ff',attack:.10,chance:.75,duplicateBuds:5}),
  Object.freeze({rank:3,name:'特級',color:'#d0a9ff',attack:.22,chance:.20,duplicateBuds:15}),
  Object.freeze({rank:4,name:'伝説',color:'#ffd580',attack:.40,chance:.05,duplicateBuds:50}),
]);
const base=(heroId)=>({...WEAPONS[heroId],heroId,style:'均衡型',attackOffset:0,interval:1,range:1,pierce:heroId==='lumi'?3:heroId==='tsukineko'?2:0});
export const WEAPON_FAMILIES=Object.freeze([
  base('lumi'),
  {id:'lumi-rail-violet',heroId:'lumi',name:'指先のレールガン・紫光',kind:'railgun',style:'速射型',attackOffset:-.08,interval:.78,range:.9,pierce:3,effectColor:0xba9fff,note:'紫の光で識別する速射型。攻撃間隔22%短縮・射程10%短縮。ねこるみでは射程無限。'},
  {id:'lumi-rail-rose',heroId:'lumi',name:'指先のレールガン・桃光',kind:'railgun',style:'遠射型',attackOffset:.16,interval:1.2,range:1.25,pierce:3,effectColor:0xff9ecb,note:'桃色の光で識別する遠射型。威力16%増・射程25%増。ねこるみでは射程無限。'},
  base('hehereal'),
  {id:'sakura-swift-bow',heroId:'hehereal',name:'桜風の弓・そよぎ',kind:'bow',style:'速射型',attackOffset:-.08,interval:.78,range:.9,effectColor:0xff8fc7,note:'追尾矢を素早く放つ。間隔22%短縮・射程10%短縮。'},
  {id:'sakura-far-bow',heroId:'hehereal',name:'桜星の弓・とどけ',kind:'bow',style:'遠射型',attackOffset:.16,interval:1.2,range:1.25,effectColor:0xffd7ec,note:'遠い敵にも追尾矢を届ける。威力16%増・射程25%増。'},
  base('prim'),
  {id:'aurora-claw',heroId:'prim',name:'極光の爪',kind:'claw',style:'速爪型',attackOffset:-.08,interval:.78,range:.9,effectColor:0xbdafff,note:'軽い三本爪で素早く攻撃。攻撃間隔22%短縮・射程10%短縮。'},
  {id:'meteor-claw',heroId:'prim',name:'流星の爪',kind:'claw',style:'重爪型',attackOffset:.16,interval:1.2,range:1.25,effectColor:0xffc7de,note:'重い晶爪で広くひっかく。威力16%増・間隔20%増・射程25%増。'},
  base('nyanluna'),
  {id:'lilica-staff',heroId:'nyanluna',name:'星鈴の杖・リリカ',kind:'staff',style:'速詠型',attackOffset:-.10,interval:.75,range:.80,note:'軽い星鈴で素早く詠唱。攻撃間隔が短くなる代わりに、一撃の威力と射程は控えめ。'},
  {id:'selene-staff',heroId:'nyanluna',name:'宵星の杖・セレーネ',kind:'staff',style:'遠撃型',attackOffset:.14,interval:1.30,range:1.30,note:'遠い敵へ強い月光弾を放つ天球の杖。威力と射程に優れるが、詠唱に時間がかかる。'},
  base('tsukineko'),
  {id:'gemini-gun',heroId:'tsukineko',name:'双連銃・ジェミニ',kind:'gun',style:'連射型',attackOffset:-.10,interval:.70,range:.80,pierce:1,note:'二連銃身からすばやく星弾を発射。短い射程での連射が得意。通常弾は敵1体で止まる。'},
  {id:'artemis-rifle',heroId:'tsukineko',name:'月穿銃・アルテミス',kind:'gun',style:'狙撃型',attackOffset:.28,interval:1.55,range:1.40,pierce:3,note:'遠くから重い一撃を届ける長銃。通常弾は3体を貫通。連射は遅いが、直線上の敵に強い。'},
  base('omsolo'),
  {id:'hayate-saber',heroId:'omsolo',name:'流星剣・ハヤテ',kind:'saber',style:'速斬型',attackOffset:-.08,interval:.72,range:.85,effectColor:0x85eeff,note:'短く軽い蒼い光刃で連続斬撃。接近が必要だが、攻撃間隔に優れる。'},
  {id:'aegis-saber',heroId:'omsolo',name:'護光剣・イージス',kind:'saber',style:'守護型',attackOffset:-.05,interval:1.18,range:1.10,defense:[0,0,8,12,18],effectColor:0xaaff9a,note:'盾形の鍔で身を守る光剣。攻撃は少し遅いが、広めの斬撃と防御力を備える。'},
  base('shizuku'),
  {id:'twilight-scythe',heroId:'shizuku',name:'宵風の鎌・ねむり',kind:'scythe',style:'速刈型',attackOffset:-.08,interval:.78,range:.9,effectColor:0xd4b2ff,note:'軽い鎌で素早く斬り、こまめにHPを吸収する。攻撃間隔22%短縮・射程10%短縮。'},
  {id:'garnet-scythe',heroId:'shizuku',name:'魔心の鎌・かえり道',kind:'scythe',style:'広刈型',attackOffset:.16,interval:1.2,range:1.25,effectColor:0xffb5c9,note:'大きく弧を描く重い鎌。攻撃力と射程に優れ、複数の敵からHPを吸収しやすい。'},
  base('mochinyafe'),
  {id:'mochi-lull-chime',heroId:'mochinyafe',name:'子守鈴・ゆめね',kind:'chime',style:'速唱型',attackOffset:-.08,interval:.75,range:.9,supportInterval:.8,supportRange:.9,effectColor:0xd7baff,note:'小さな二つの鈴で声をすばやく重ねる。通常攻撃は速い代わりに威力・射程が控えめ。援護は3.2秒間隔・射程11.7・4体貫通。'},
  {id:'mochi-echo-bell',heroId:'mochinyafe',name:'響声鈴・とおね',kind:'chime',style:'遠響型',attackOffset:.14,interval:1.25,range:1.35,supportInterval:1.2,supportRange:1.3,supportPierce:2,effectColor:0xffd4a3,note:'大きく開いた鈴で声を遠くへ届ける。通常攻撃は強く遠くへ届くが間隔は長い。援護は4.8秒間隔・射程16.9・6体貫通。'},
].map(weapon=>Object.freeze(weapon)));
export const WEAPON_CATALOG=Object.freeze(WEAPON_FAMILIES.flatMap(weapon=>WEAPON_RARITIES.filter(r=>weapon.style==='均衡型'||r.rank>1).map(rarity=>Object.freeze({id:`${weapon.id}-r${rarity.rank}`,heroId:weapon.heroId,weapon:weapon.heroId==='prim'?Object.freeze({...weapon,name:({
 'prism-claw':['','虹晶の爪・はじまり','虹晶の爪・青光','虹晶の爪・七彩','虹晶の聖爪・プリムの約束'],
 'aurora-claw':['','','極光の爪・そよぎ','極光の爪・空渡り','極光の翼爪・オーロラ'],
 'meteor-claw':['','','流星の爪・かけら','流星の爪・星砕き','流星の竜爪・帰り道']}[weapon.id][rarity.rank])}):weapon.heroId==='shizuku'?Object.freeze({...weapon,name:shizukuScytheName(weapon.id,rarity.rank)}):weapon,rarity,bonus:Object.freeze({attack:Number((rarity.attack+weapon.attackOffset).toFixed(2)),defense:weapon.defense?.[rarity.rank]??0})}))));
const EQUIPMENT_HERO_IDS=WEAPON_HERO_IDS;
const MAX_COUNT=99999999;
const count=value=>Number.isFinite(value)&&value>=0?Math.min(MAX_COUNT,Math.floor(value)):0;
export const weaponVariant=id=>WEAPON_CATALOG.find(item=>item.id===id);
export const rarityLabel=rarity=>`★${rarity.rank} ${rarity.name}`;
export const weaponImage=item=>item.heroId==='lumi'?equipmentImage(item.weapon.id):item.heroId==='hehereal'?equipmentImage('hehereal-bow'):item.heroId==='prim'?publicUrl(`assets/equipment/weapons/${item.id}-v1.webp`):item.heroId==='shizuku'?publicUrl(`assets/equipment/weapons/${item.id}-v3.webp`):item.heroId==='mochinyafe'?publicUrl(`assets/equipment/weapons/${item.weapon.id}-v1.png`):item.weapon.style==='均衡型'?equipmentImage(item.weapon.id):publicUrl(`assets/equipment/weapons/${item.weapon.id}-v1.png`);
export function normalizeWeapons(raw){
  const owned=WEAPON_CATALOG.filter(item=>item.rarity.rank===1||Array.isArray(raw?.owned)&&raw.owned.includes(item.id)).map(item=>item.id);
  const loadout={};
  for(const heroId of EQUIPMENT_HERO_IDS){
    const requested=weaponVariant(raw?.loadout?.[heroId]);
    if(requested?.heroId===heroId&&owned.includes(requested.id))loadout[heroId]=requested.id;
    else if(raw?.version!==2){
      // v1 equipped the highest rarity automatically. Preserve that exact legacy choice once.
      loadout[heroId]=WEAPON_CATALOG.filter(item=>item.heroId===heroId&&owned.includes(item.id)).sort((a,b)=>b.rarity.rank-a.rarity.rank)[0].id;
    }else loadout[heroId]=`${WEAPONS[heroId].id}-r1`;
  }
  // Older draws did not store their paid amount. Keep their pre-v1.41 history;
  // new draws record the actual grant so later reward changes cannot rewrite it.
  const storedDraw=draw=>{const item=weaponVariant(draw?.weaponId);if(!item||item.rarity.rank===1||!owned.includes(item.id))return null;const duplicate=draw.duplicate===true;return {weaponId:item.id,duplicate,...(duplicate?{duplicateBuds:count(draw.duplicateBuds??({2:10,3:30,4:100}[item.rarity.rank]))}:{})};};
  const lastDraw=storedDraw(raw?.lastDraw),batch=Array.isArray(raw?.lastBatch)&&raw.lastBatch.length===WEAPON_MULTI_DRAW_COUNT?raw.lastBatch.map(storedDraw):[];
  const lastBatch=batch.length===WEAPON_MULTI_DRAW_COUNT&&batch.every(Boolean)&&JSON.stringify(batch.at(-1))===JSON.stringify(lastDraw)?batch:null;
  return {version:2,owned,loadout,draws:count(raw?.draws),lastDraw,lastBatch};
}
export function equippedWeapon(profile,heroId){
  if(!EQUIPMENT_HERO_IDS.includes(heroId))return null;
  const raw=profile?.weapons;
  const collection=raw?.version===2?raw:normalizeWeapons(raw),item=weaponVariant(collection.loadout?.[heroId]);
  return item?.heroId===heroId&&collection.owned?.includes(item.id)?item:weaponVariant(`${WEAPONS[heroId].id}-r1`);
}
export function equipWeapon(profile,heroId,id){
  const item=weaponVariant(id);if(!item||item.heroId!==heroId||!isHeroUnlocked(profile,heroId)||!profile.weapons?.owned?.includes(id))return false;
  profile.weapons=normalizeWeapons(profile.weapons);profile.weapons.loadout[heroId]=id;return true;
}
export function weaponAttackBonus(profile,heroId){return equippedWeapon(profile,heroId)?.bonus.attack??0;}
export function weaponDefenseBonus(profile,heroId){return equippedWeapon(profile,heroId)?.bonus.defense??0;}
export function weaponAttackProfile(profile,hero){
  const weapon=equippedWeapon(profile,hero.id)?.weapon;
  return {range:hero.range*(weapon?.range??1),interval:hero.interval*(weapon?.interval??1)*(hero.id==='mochinyafe'?1-.75*(Math.min(50,profile?.characters?.mochinyafe?.level??1)-1)**3/49**3:1),pierce:weapon?.pierce??0,...(hero.id==='mochinyafe'?{supportInterval:MOCHI_SUPPORT.interval*(weapon?.supportInterval??1),supportRange:MOCHI_SUPPORT.range*(weapon?.supportRange??1),supportPierce:MOCHI_SUPPORT.pierce+(weapon?.supportPierce??0)}:{})};
}
export function grantWeaponTickets(profile,amount=1){
  const before=count(profile.inventory.weaponTicket);profile.inventory.weaponTicket=count(before+count(amount));return profile.inventory.weaponTicket-before;
}
export function bossWeaponTicket(profile,enemy,rng=Math.random){
  if(enemy.type!=='boss'||enemy.training||enemy.hp>0)return 0;
  const roll=rng();return Number.isFinite(roll)&&roll>=0&&roll<WEAPON_TICKET_DROP_RATE?grantWeaponTickets(profile):0;
}
export function drawWeapon(profile,rng=Math.random){
  const tickets=count(profile.inventory?.weaponTicket);if(tickets<1)return null;
  const heroRoll=rng(),rarityRoll=rng(),typeRoll=rng();if(![heroRoll,rarityRoll,typeRoll].every(n=>Number.isFinite(n)&&n>=0&&n<1))return null;
  const heroId=WEAPON_HERO_IDS[Math.floor(heroRoll*WEAPON_HERO_IDS.length)];
  let cumulative=0;const rarity=WEAPON_RARITIES.filter(r=>r.chance).find(r=>(cumulative+=r.chance)>rarityRoll);
  const candidates=WEAPON_CATALOG.filter(item=>item.heroId===heroId&&item.rarity===rarity),item=candidates[Math.floor(typeRoll*candidates.length)];
  const collection=normalizeWeapons(profile.weapons),duplicate=collection.owned.includes(item.id);
  if(!duplicate)collection.owned.push(item.id);
  let duplicateBuds=0;if(duplicate){const before=count(profile.inventory.starBud);profile.inventory.starBud=count(before+rarity.duplicateBuds);duplicateBuds=profile.inventory.starBud-before;}
  collection.draws=count(collection.draws+1);collection.lastDraw={weaponId:item.id,duplicate,...(duplicate?{duplicateBuds}:{})};collection.lastBatch=null;profile.weapons=normalizeWeapons(collection);profile.inventory.weaponTicket=tickets-1;
  return {item,duplicate,duplicateBuds};
}
export function drawWeapons(profile,amount=WEAPON_MULTI_DRAW_COUNT,rng=Math.random){
  if(![1,WEAPON_MULTI_DRAW_COUNT].includes(amount)||count(profile.inventory?.weaponTicket)<amount)return null;
  // Work on a copy so an invalid roll never charges for only part of a batch.
  const pending={...profile,inventory:{...profile.inventory},weapons:normalizeWeapons(profile.weapons)},results=[];
  for(let i=0;i<amount;i++){const result=drawWeapon(pending,rng);if(!result)return null;results.push(result);}
  if(amount===WEAPON_MULTI_DRAW_COUNT)pending.weapons.lastBatch=results.map(({item,duplicate,duplicateBuds})=>({weaponId:item.id,duplicate,...(duplicate?{duplicateBuds}:{})}));
  profile.inventory=pending.inventory;profile.weapons=pending.weapons;return results;
}
