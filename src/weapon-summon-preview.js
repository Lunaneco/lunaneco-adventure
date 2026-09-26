// Dev server only: vite build bundles index.html alone. Plays the real summon for a chosen weapon and
// route; nothing is saved and no ticket is spent.
// Same stylesheets in the same order as main.js, so the stage and result card cascade identically.
import './difficulty.css';
import './terrain.css';
import './abilities.css';
import './tutorial.css';
import './style.css';
import './chapter.css';
import './story-cast.css';
import './progression.css';
import './talents.css';
import './party.css';
import './rewards.css';
import './weapons.css';
import './equipment-ui.css';
import './weapon-summon.css';
import './weapon-batch.css';
import './voices.css';
import './ultimate-presentation.css';
import './weapon-summon-preview.css';
import {HEROES} from './model.js';
import {normalizeProgression} from './progression.js';
import {WEAPON_CATALOG,equipWeapon,normalizeWeapons,weaponImage} from './weapons.js';
import {weaponDrawResult,weaponBatchResult} from './weapons-ui.js';
import {summonRoute} from './weapon-summon-plan.js';
import {WeaponSummonPresentation} from './weapon-summon.js';
import {WeaponSummonView} from './weapon-summon-view.js';
import {Soundscape} from './audio.js';
import {VoicePlayer} from './voice-player.js';

const $=s=>document.querySelector(s);
const AUTO_NEXT=2.5;
const ITEMS=WEAPON_CATALOG.filter(item=>item.rarity.rank>1),FAMILIES=[...new Set(ITEMS.map(item=>item.weapon))];
const COLOR={blue:'青',purple:'紫',gold:'金'};
const routeLabel=route=>(route.omen?'流れ星の前兆 → ':'')+route.colors.map(c=>COLOR[c]).join(' → ');
const ROUTES=Object.fromEntries([2,3,4].map(rank=>{
  const found=new Map();
  for(let i=0;i<40;i++){const roll=(i+.5)/40,route=summonRoute(rank,()=>roll),kind=route.omen?'omen':route.colors.length>1?'promote':'direct';if(!found.has(kind))found.set(kind,{kind,roll,label:routeLabel(route)});}
  return [rank,['direct','promote','omen'].flatMap(kind=>found.get(kind)??[])];
}));
const ROUTE_COUNT=ITEMS.reduce((n,item)=>n+ROUTES[item.rarity.rank].length,0);
const MODES=[['auto','本番と同じ確率'],['direct','直行（青・紫・金）'],['promote','昇格（青→紫・青→金）'],['omen','流れ星の前兆（★4のみ）']];
const SEED={inventory:{weaponTicket:9,starBud:10},story:{version:2,actClears:Array(12).fill(true)},tutorial:{firstBattleCompleted:true}};
const BATCH_PRESETS=[{label:'青の十星',ranks:Array(10).fill(2)},{label:'紫の月蝕',ranks:[2,3,2,2,3,2,2,2,3,2]},{label:'伝説の顕現',ranks:[2,2,3,2,4,2,2,3,2,2]},{label:'三つの伝説',ranks:[2,4,2,3,2,4,2,3,4,2]}];
const FLAGS=['duplicate','locked','motion','video','sound'];
const options={route:'auto',duplicate:false,locked:false,motion:true,video:true,quality:'high',sound:true};

const audio=new Soundscape();audio.music=false;
const voice=new VoicePlayer(audio);
const dialog=$('#weapon-summon'),view=new WeaponSummonView(dialog);
const bar=document.createElement('div');bar.className='preview-bar hidden';bar.style.setProperty('--auto-next',`${AUTO_NEXT}s`);
bar.innerHTML=`<p class="preview-label"></p><div class="preview-actions"><button type="button" data-preview="prev" aria-label="前の演出">◀</button><button type="button" data-preview="replay" aria-label="もう一度再生">↻</button><button type="button" data-preview="next" aria-label="次の演出">▶</button><button type="button" data-preview="auto" aria-pressed="false">自動送り</button><button type="button" data-preview="exit">一覧へ</button></div>`;
dialog.append(bar);
let playlist=[],index=0,auto=false,wait=0,finishedAt=-Infinity,returnFocus=null,drawn=null,batchDrawn=null,profile=null,pointer=null;
const summon=new WeaponSummonPresentation({view,audio,voice,onFinish:()=>{finishedAt=performance.now();wait=0;syncBar();}});

function previewProfile(item){
  const p=normalizeProgression(options.locked?{...SEED,story:{version:2,actClears:Array(8).fill(false)}}:SEED,HEROES);
  p.weapons=normalizeWeapons({...p.weapons,owned:[...p.weapons.owned,item.id]});return p;
}
function play(at){
  const entry=playlist[at];if(!entry)return;
  summon.close();index=at;wait=0;
  batchDrawn=entry.batch??null;
  const {item}=entry,routes=ROUTES[item.rarity.rank],route=entry.route??(options.route==='auto'?null:routes.find(r=>r.kind===options.route)??routes[0]);
  profile=previewProfile(item);drawn={item,duplicate:options.duplicate,duplicateBuds:options.duplicate?item.rarity.duplicateBuds:0};
  if(batchDrawn)profile.weapons=normalizeWeapons({...profile.weapons,owned:[...profile.weapons.owned,...batchDrawn.map(r=>r.item.id)]});
  audio.init();voice.init();
  summon.start(drawn,{motion:options.motion,quality:options.quality,rng:route?()=>route.roll:Math.random,markup:batchDrawn?weaponBatchResult(batchDrawn,profile,true):weaponDrawResult(drawn,profile,true),batch:batchDrawn});
  if(!options.video&&summon.current.video)summon.dropVideo(summon.current);
  const plan=summon.current.plan;
  bar.querySelector('.preview-label').textContent=`${at+1} / ${playlist.length}　${item.weapon.name} ★${item.rarity.rank}　${batchDrawn?entry.label:plan.motion?routeLabel(plan.route):'動きを減らす表示'}`;
  syncBar();
}
function syncBar(){
  bar.classList.toggle('hidden',!summon.finished||!!batchDrawn);bar.dataset.auto=String(auto);
  bar.querySelector('[data-preview="auto"]').setAttribute('aria-pressed',String(auto));
  bar.querySelector('[data-preview="prev"]').disabled=index===0;bar.querySelector('[data-preview="next"]').disabled=index>=playlist.length-1;
}
function next(){if(index<playlist.length-1)play(index+1);else{auto=false;syncBar();}}
function exit(){auto=false;summon.close();syncBar();returnFocus?.focus({preventScroll:true});}
// As in the game: the first close request finishes an unfinished summon, and a second one within
// 350 ms of the result appearing counts as the same press.
function requestClose(){if(summon.skip()||performance.now()-finishedAt<350)return;exit();}

const radios=(name,list)=>list.map(([value,label])=>`<label class="preview-choice"><input type="radio" name="${name}" value="${value}" ${String(options[name])===value?'checked':''}><span>${label}</span></label>`).join('');
$('#preview').innerHTML=`<header class="preview-head"><span class="eyebrow">DEV PREVIEW · SIGNATURE WEAPON SUMMON</span><h1>専用武器ガチャ 演出プレビュー</h1><p>ゲームと同じ召喚演出を、武器とルートを選んで再生します。<br>ガチャ券とセーブデータは変わりません。</p></header>
<section class="preview-options" aria-label="再生の設定">
<fieldset><legend>演出ルート</legend>${radios('route',MODES)}</fieldset>
<fieldset><legend>結果</legend>${radios('duplicate',[['false','新しい武器'],['true','重複（星の芽に変換）']])}</fieldset>
<fieldset><legend>つきねこ・オムソロ・もちにゃふぇ</legend>${radios('locked',[['false','加入済み'],['true','未加入（保管のみ）']])}</fieldset>
<fieldset><legend>演出の動き</legend>${radios('motion',[['true','通常'],['false','動きを減らす（約1.5秒）']])}</fieldset>
<fieldset><legend>召喚動画</legend>${radios('video',[['true','使う'],['false','使わない（読み込めない環境）']])}</fieldset>
<fieldset><legend>画質</legend>${radios('quality',[['high','高'],['low','低']])}</fieldset>
<fieldset><legend>音</legend>${radios('sound',[['true','効果音・ボイスあり'],['false','なし']])}</fieldset>
</section>
<section class="preview-run"><button type="button" class="primary" data-run="catalog">${ITEMS.length}本を順番に再生</button><button type="button" class="secondary" data-run="routes">全ルート${ROUTE_COUNT}通りを順番に再生</button><p>結果が出て${AUTO_NEXT}秒後に次へ進みます。画面タップ・Space でスキップ、Esc で自動送りを止め、もう一度押すと一覧へ。<br>演出中は ← → で前後の武器、R でもう一度。</p></section>
<section id="batch-preview" class="preview-run"><h2>10連 · 十星の月蝕召喚</h2>${BATCH_PRESETS.map((p,i)=>`<button type="button" class="secondary" data-batch-preview="${i}">${p.label}</button>`).join('')}<p>10本の星が集まり、月蝕が砕け、実際の結果を順番に表示。★4は1本ずつキャラと武器が登場します。</p></section>
<section class="preview-catalog">${HEROES.map(hero=>`<section class="preview-hero" aria-label="${hero.name}の専用武器"><h2><span class="portrait ${hero.id}"></span>${hero.name}</h2>${FAMILIES.filter(weapon=>weapon.heroId===hero.id).map(weapon=>{const items=ITEMS.filter(item=>item.weapon===weapon);return `<article class="preview-weapon"><img src="${weaponImage(items[0])}" alt="" width="64" height="64" decoding="async"><h3>${weapon.name}</h3><small>${weapon.style}</small><div class="preview-ranks">${items.map(item=>`<button type="button" data-play="${item.id}" style="--rarity-color:${item.rarity.color}" aria-label="${weapon.name} ★${item.rarity.rank}の演出を再生">★${item.rarity.rank}<small>${item.rarity.name}</small></button>`).join('')}</div></article>`;}).join('')}</section>`).join('')}</section>`;

$('#preview').addEventListener('change',e=>{
  const {name,value}=e.target;if(!(name in options))return;
  options[name]=FLAGS.includes(name)?value==='true':value;
  if(name==='sound'){audio.setEnabled(options.sound);voice.configure(options.sound);}
});
document.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.hasAttribute('data-batch-preview')){
    returnFocus=t;auto=false;
    const preset=BATCH_PRESETS[Number(t.dataset.batchPreview)],batch=preset.ranks.map((rank,i)=>{const choices=ITEMS.filter(item=>item.rarity.rank===rank),item=choices[i%choices.length];return {item,duplicate:options.duplicate,duplicateBuds:options.duplicate?item.rarity.duplicateBuds:0};});
    playlist=[{item:batch.reduce((best,r)=>r.item.rarity.rank>best.rarity.rank?r.item:best,batch[0].item),batch,label:preset.label}];play(0);
  }
  else if(t.dataset.play){returnFocus=t;auto=false;playlist=ITEMS.map(item=>({item}));play(ITEMS.findIndex(item=>item.id===t.dataset.play));}
  else if(t.dataset.run){returnFocus=t;auto=true;playlist=t.dataset.run==='routes'?ITEMS.flatMap(item=>ROUTES[item.rarity.rank].map(route=>({item,route}))):ITEMS.map(item=>({item}));play(0);}
  else if(t.hasAttribute('data-summon-skip'))summon.skip();
  else if(t.hasAttribute('data-close'))requestClose();
  else if(t.dataset.equipWeapon){const hero=t.dataset.weaponHero;if(drawn&&equipWeapon(profile,hero,t.dataset.equipWeapon)){voice.cue(hero,'equip');audio.play('upgrade');summon.updateResult(batchDrawn?weaponBatchResult(batchDrawn,profile,true):weaponDrawResult(drawn,profile,true));$('#weapon-draw-result [data-close]')?.focus({preventScroll:true});}}
  else if(t.dataset.preview==='auto'){auto=!auto;wait=0;syncBar();}
  else if(t.dataset.preview==='replay')play(index);
  else if(t.dataset.preview==='prev')play(index-1);
  else if(t.dataset.preview==='next')next();
  else if(t.dataset.preview==='exit')exit();
});
// Only a tap that starts on the stage skips, as in the game.
dialog.addEventListener('pointerdown',e=>{pointer=null;if(e.button!==0||!e.isPrimary||e.target.closest('button,.draw-sheet'))return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};});
dialog.addEventListener('pointerup',e=>{const tap=!!pointer&&e.pointerId===pointer.id&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)<18;pointer=null;if(tap)summon.skip();});
dialog.addEventListener('pointercancel',()=>{pointer=null;});
dialog.addEventListener('cancel',e=>{e.preventDefault();auto=false;requestClose();});
addEventListener('keydown',e=>{
  if(!summon.active)return;
  if(e.code==='Escape'){e.preventDefault();auto=false;syncBar();requestClose();return;}
  if(['Space','Enter'].includes(e.code)&&!summon.finished&&!e.target.closest?.('button')){e.preventDefault();if(!e.repeat)summon.skip();return;}
  if(e.repeat||e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.code==='ArrowRight')next();else if(e.code==='ArrowLeft')play(index-1);else if(e.code==='KeyR')play(index);
});
document.addEventListener('pointerdown',()=>{voice.init();if(voice.suspended)voice.resume();},{passive:true});
document.addEventListener('visibilitychange',()=>{audio.setSuspended(document.hidden);summon.setHidden(document.hidden);if(document.hidden)voice.suspend();else voice.resume();});
let last=performance.now();
requestAnimationFrame(function frame(now){
  const dt=Math.min((now-last)/1000,.1);last=now;
  if(!document.hidden){summon.tick(dt);if(auto&&summon.finished&&(wait+=dt)>=AUTO_NEXT)next();}
  requestAnimationFrame(frame);
});
view.preload();
window.__LUNARIA_SUMMON_PREVIEW__={summon,voice};
