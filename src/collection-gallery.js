import {HEROES} from './model.js';
import {isHeroUnlocked,recruitmentNote} from './recruitment.js';
import {publicUrl} from './public-url.js';
import {icon} from './icons.js';

// ① Lv.30, ② Lv.50, ③ Lv.70. ④ opens with ③.
export const STILL_UNLOCK_LEVELS=Object.freeze([30,50,70,70]);
// るみは、Lv.30 の2枚（LV30A・LV30B）、Lv.50、Lv.70 の順にひらく。
const STILL_LEVELS={lumi:Object.freeze([30,30,50,70])};
export const stillLevelsFor=heroId=>STILL_LEVELS[heroId]??STILL_UNLOCK_LEVELS;
const MARKS=['①','②','③','④'];
const ROMANS=['I','II','III','IV'];
const STILL_FILES={
  nyanluna:['nyanluna-1.jpg','nyanluna-2.jpg','nyanluna-3.jpg'],
  tsukineko:['tsukineko-1.jpg','tsukineko-2.jpg','tsukineko-3.jpg'],
  omsolo:['omsolo-1.jpg','omsolo-2.jpg','omsolo-3.jpg'],
  mochinyafe:['mochinyafe-1.jpg','mochinyafe-2.jpg','mochinyafe-3.jpg'],
  shizuku:['shizuku-1.jpg','shizuku-2.jpg','shizuku-3.jpg','shizuku-4.jpg'],
  prim:['prim-1.jpg','prim-2.jpg','prim-3.jpg'],
  hehereal:['hehereal-1.jpg','hehereal-2.jpg','hehereal-3.jpg'],
  lumi:['lumi-lv30a.jpg','lumi-lv30b.jpg','lumi-lv50.jpg','lumi-lv70.jpg'],
};
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const heroLevel=(profile,id)=>{const level=profile?.characters?.[id]?.level;return Number.isFinite(level)?level:1;};

export function galleryEntries(roster=HEROES){
  return roster.filter(hero=>STILL_FILES[hero.id]).map(hero=>({
    id:hero.id,name:hero.name,title:hero.title,color:hero.color,
    stills:STILL_FILES[hero.id].map((file,index)=>({
      index,file,mark:MARKS[index],roman:ROMANS[index],level:stillLevelsFor(hero.id)[index],
      src:publicUrl(`assets/stills/${file}`),
    })),
  }));
}
export function isStillUnlocked(profile,heroId,index){
  const files=STILL_FILES[heroId],needed=stillLevelsFor(heroId)[index];
  return !!files&&index>=0&&index<files.length&&needed!=null&&isHeroUnlocked(profile,heroId)&&heroLevel(profile,heroId)>=needed;
}
export function stillsUnlockedByLevel(heroId,before,level){
  const levels=stillLevelsFor(heroId);
  return (STILL_FILES[heroId]??[]).flatMap((file,index)=>before<levels[index]&&level>=levels[index]?[{index,mark:MARKS[index],level:levels[index]}]:[]);
}
export function adjacentUnlockedStill(profile,heroId,index,direction){
  const files=STILL_FILES[heroId]??[];
  for(let cursor=index+direction;cursor>=0&&cursor<files.length;cursor+=direction)if(isStillUnlocked(profile,heroId,cursor))return cursor;
  return null;
}
function entryFor(heroId){return galleryEntries().find(hero=>hero.id===heroId)??galleryEntries()[0];}
export function galleryProgress(profile){
  const entries=galleryEntries();
  const total=entries.reduce((sum,hero)=>sum+hero.stills.length,0);
  const open=entries.reduce((sum,hero)=>sum+hero.stills.filter(still=>isStillUnlocked(profile,hero.id,still.index)).length,0);
  return {open,total};
}

export function galleryView(profile,selectedId){
  const entries=galleryEntries(),selected=entries.find(hero=>hero.id===selectedId)??entries[0];
  const progress=galleryProgress(profile),recruited=isHeroUnlocked(profile,selected.id),level=heroLevel(profile,selected.id);
  const opened=selected.stills.filter(still=>isStillUnlocked(profile,selected.id,still.index)).length;
  return `<div class="gallery-mast"><div><span class="eyebrow">FRAMED MEMORIES</span><h2>Collection Gallery</h2><p>レベルが届いた順に、額縁がひらく。<br>①は Lv.30、②は Lv.50、③と④は Lv.70。<br>るみは①と②が Lv.30、③が Lv.50、④が Lv.70。</p></div><div class="gallery-medallion" aria-label="解放 ${progress.open} / ${progress.total}"><b>${progress.open}</b><span>/ ${progress.total}</span><small>解放</small></div></div><div class="gallery-cast" role="tablist" aria-label="キャラクター">${entries.map(hero=>{const count=hero.stills.filter(still=>isStillUnlocked(profile,hero.id,still.index)).length,joined=isHeroUnlocked(profile,hero.id);return `<button type="button" class="gallery-cast-card" role="tab" data-gallery-hero="${hero.id}" aria-pressed="${hero.id===selected.id}" aria-label="${esc(hero.name)}、${joined?`${count} / ${hero.stills.length} 解放`:'未加入'}"><span class="portrait ${hero.id}" aria-hidden="true"></span><span><strong>${esc(hero.name)}</strong><small>${joined?`${count} / ${hero.stills.length}`:'未加入'}</small></span></button>`;}).join('')}</div><section class="gallery-wall-wrap" aria-label="${esc(selected.name)}のスチル"><header class="gallery-wall-head"><div><h3>${esc(selected.name)}</h3><p>${esc(selected.title)}</p></div><span>${recruited?`Lv.${level} · ${opened} / ${selected.stills.length}`:esc(recruitmentNote(selected.id))}</span></header><div class="gallery-wall" style="--hero:${selected.color}">${selected.stills.map(still=>{const unlocked=isStillUnlocked(profile,selected.id,still.index);return `<button type="button" class="gallery-frame ${unlocked?'is-open':'is-sealed'}" data-gallery-hero="${selected.id}" data-gallery-still="${still.index}" ${unlocked?'':`aria-disabled="true"`} aria-label="${esc(selected.name)}のスチル${still.mark}${unlocked?'を見る':recruited?`、未解放。Lv.${still.level}で解放`:'、未解放。加入後に解放'}"><span class="gallery-mat">${unlocked?`<img src="${still.src}" alt="" width="360" height="480" loading="lazy" decoding="async" draggable="false">`:`<span class="gallery-seal">${icon('lock')}<b>${recruited?`Lv.${still.level}`:'加入後'}</b></span>`}</span><span class="gallery-plaque"><small>STILL ${still.roman}</small><b>${still.mark}</b><em>Lv.${still.level}</em></span>${still.index>0&&still.level===selected.stills[still.index-1].level?`<span class="gallery-same">${selected.stills[still.index-1].mark}と同時</span>`:''}</button>`;}).join('')}</div></section><dialog id="gallery-viewer" class="gallery-viewer" aria-label="スチルの拡大"></dialog>`;
}

export function galleryViewerMarkup(profile,heroId,index){
  if(!isStillUnlocked(profile,heroId,index))return '';
  const hero=entryFor(heroId),still=hero.stills[index],previous=adjacentUnlockedStill(profile,heroId,index,-1),next=adjacentUnlockedStill(profile,heroId,index,1);
  return `<button type="button" class="gallery-viewer-close" data-gallery-close aria-label="スチルを閉じる">${icon('close')}</button><div class="gallery-viewer-stage"><button type="button" class="gallery-viewer-step is-prev" data-gallery-step="-1" aria-label="前のスチル" ${previous==null?'disabled':''}>${icon('chevron')}</button><figure><img src="${still.src}" alt="${esc(hero.name)}のスチル${still.mark}" draggable="false"><figcaption><small>Collection Gallery</small><strong>${esc(hero.name)}</strong><span>Still ${still.roman} · ${still.mark} · Lv.${still.level}</span></figcaption></figure><button type="button" class="gallery-viewer-step" data-gallery-step="1" aria-label="次のスチル" ${next==null?'disabled':''}>${icon('chevron')}</button></div>`;
}
