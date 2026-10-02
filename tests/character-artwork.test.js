import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {STORY_CAST} from '../src/story-cast.js';
import {ULTIMATE_ART} from '../src/ultimate-art.js';

const artwork={
  nyanluna:{portrait:'assets/nyanluna-reference.png',story:'assets/story/nyanluna.webp',css:'style.css'},
  tsukineko:{portrait:'assets/tsukineko-reference.png',story:'assets/story/tsukineko.webp',css:'style.css'},
  mochinyafe:{portrait:'assets/story/mochinyafe.png',story:'assets/story/mochinyafe.png',css:'chapter.css'},
};

for(const [id,art] of Object.entries(artwork))test(`${id}: renewal 3D model retains the adopted 2D portrait and standing art`,()=>{
  assert.ok(STORY_CAST[id].image.endsWith('/'+art.story));
  const css=readFileSync(new URL(`../src/${art.css}`,import.meta.url),'utf8');
  const rule=css.match(new RegExp(`\\.portrait\\.${id}\\{([^}]+)\\}`));
  assert.ok(rule?.[1].includes(`url('/${art.portrait}')`));
  for(const file of [art.story,art.portrait])assert.ok(statSync(new URL(`../public/${file}`,import.meta.url)).size>0);
});

test('renewal portraits cannot override the adopted UI and Mochinyafe cut-in artwork',()=>{
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.doesNotMatch(main,/renewal-characters\.css/);
  assert.equal(ULTIMATE_ART.mochinyafe.file,artwork.mochinyafe.story);
});
