import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {talentView} from '../src/talent-ui.js';

test('growth-tree picker keeps all eight IDs stable with Lumi immediately after Hehereal, locked or recruited',()=>{
  const ids=HEROES.map(h=>h.id);
  for(const cleared of [0,8,28,32]){
    const profile=normalizeProgression({story:{version:2,actClears:Array.from({length:32},(_,i)=>(i<20||i>=24)&&i<cleared)}},HEROES);
    const before=structuredClone(profile);
    for(const selected of ['nyanluna','hehereal','lumi']){
      const html=talentView(profile,selected),order=[...html.matchAll(/data-tree-hero="([^"]+)"/g)].map(m=>m[1]);
      assert.deepEqual(order,ids);assert.equal(order[order.indexOf('hehereal')+1],'lumi');
      assert.equal(order.length,8);
    }
    assert.deepEqual(profile,before);assert.deepEqual(HEROES.map(h=>h.id),ids);
  }
});
