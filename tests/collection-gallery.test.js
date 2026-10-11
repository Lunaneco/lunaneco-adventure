import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {STILL_UNLOCK_LEVELS,galleryEntries,galleryProgress,galleryView,galleryViewerMarkup,isStillUnlocked,stillsUnlockedByLevel,adjacentUnlockedStill} from '../src/collection-gallery.js';

const profile=()=>normalizeProgression({},HEROES);
const recruit=(saved,id)=>{
  const flags={tsukineko:'chapterOneCleared',omsolo:'chapterTwoCleared',mochinyafe:'chapterThreeCleared',shizuku:'chapterFourCleared',prim:'chapterFiveCleared',hehereal:'chapterSixCleared',lumi:'chapterSevenCleared'};
  if(flags[id])saved.story[flags[id]]=true;
  return saved;
};

test('stills open in order at Lv.30, Lv.50 and Lv.70, with the fourth beside the third',()=>{
  assert.deepEqual([...STILL_UNLOCK_LEVELS],[30,50,70,70]);
  const entries=galleryEntries();
  assert.deepEqual(entries.map(hero=>hero.id),HEROES.map(hero=>hero.id));
  assert.equal(entries.find(hero=>hero.id==='lumi').stills.length,1);
  assert.equal(entries.find(hero=>hero.id==='shizuku').stills.length,4);
  assert.equal(entries.reduce((sum,hero)=>sum+hero.stills.length,0),23);
  for(const hero of entries)for(const still of hero.stills){
    assert.equal(still.level,STILL_UNLOCK_LEVELS[still.index]);
    assert.equal(existsSync(fileURLToPath(new URL(`../public/assets/stills/${still.file}`,import.meta.url))),true);
  }
});

test('a recruited character reveals each still only at its level, and ③ and ④ open together',()=>{
  const saved=recruit(profile(),'shizuku');
  saved.characters.shizuku.level=29;
  assert.equal(isStillUnlocked(saved,'shizuku',0),false);
  saved.characters.shizuku.level=30;
  assert.deepEqual([0,1,2,3].map(index=>isStillUnlocked(saved,'shizuku',index)),[true,false,false,false]);
  saved.characters.shizuku.level=50;
  assert.deepEqual([0,1,2,3].map(index=>isStillUnlocked(saved,'shizuku',index)),[true,true,false,false]);
  saved.characters.shizuku.level=69;
  assert.equal(isStillUnlocked(saved,'shizuku',2),false);
  assert.equal(isStillUnlocked(saved,'shizuku',3),false);
  saved.characters.shizuku.level=70;
  assert.deepEqual([0,1,2,3].map(index=>isStillUnlocked(saved,'shizuku',index)),[true,true,true,true]);
  assert.deepEqual(stillsUnlockedByLevel('shizuku',69,70).map(still=>still.mark),['③','④']);
  assert.deepEqual(stillsUnlockedByLevel('nyanluna',29,50).map(still=>still.mark),['①','②']);
  assert.deepEqual(stillsUnlockedByLevel('lumi',1,80).map(still=>still.mark),['①']);
  assert.equal(adjacentUnlockedStill(saved,'shizuku',2,1),3);
  saved.characters.shizuku.level=50;
  assert.equal(adjacentUnlockedStill(saved,'shizuku',1,1),null);
});

test('level alone does not reveal a still before the character joins',()=>{
  const saved=profile();
  saved.characters.lumi.level=70;
  saved.characters.shizuku.level=70;
  assert.equal(isStillUnlocked(saved,'lumi',0),false);
  assert.equal(isStillUnlocked(saved,'shizuku',3),false);
  assert.equal(galleryViewerMarkup(saved,'shizuku',3),'');
  const html=galleryView(saved,'shizuku');
  assert.doesNotMatch(html,/shizuku-[1-4]\.jpg/);
  assert.match(html,/未加入/);
  recruit(saved,'lumi');
  assert.equal(isStillUnlocked(saved,'lumi',0),true);
  assert.equal(galleryEntries().find(hero=>hero.id==='lumi').stills.length,1);
});

test('the gallery shows an opened frame and hides the picture until that level',()=>{
  const saved=recruit(profile(),'shizuku');
  saved.characters.nyanluna.level=30;
  saved.characters.shizuku.level=70;
  const early=galleryView(saved,'nyanluna');
  assert.match(early,/Collection Gallery/);
  assert.match(early,/nyanluna-1\.jpg/);
  assert.doesNotMatch(early,/nyanluna-2\.jpg/);
  assert.match(early,/aria-disabled="true"/);
  const html=galleryView(saved,'shizuku');
  for(const file of ['shizuku-1.jpg','shizuku-2.jpg','shizuku-3.jpg','shizuku-4.jpg'])assert.match(html,new RegExp(file));
  assert.match(html,/③と同時/);
  assert.equal(galleryProgress(saved).open,5);
  const viewer=galleryViewerMarkup(saved,'shizuku',3);
  assert.match(viewer,/shizuku-4\.jpg/);
  assert.match(viewer,/data-gallery-close/);
  assert.doesNotMatch(viewer,/shizuku-1\.jpg/);
});
