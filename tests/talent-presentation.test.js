import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {talentView,talentDetailView} from '../src/talent-ui.js';
import {talentNode} from '../src/talents.js';
import {talentUnlockCopy,presentTalentUnlock} from '../src/talent-presentation.js';

test('responsive tier labels preserve all four ordered tiers and their accessible full names',()=>{
  const profile=normalizeProgression({},HEROES),before=structuredClone(profile);
  const html=talentView(profile,'nyanluna');
  assert.deepEqual([...html.matchAll(/data-tree-tier="(\d)"/g)].map(m=>m[1]),['1','2','4','3']);
  assert.match(html,/aria-label="1段目 · 基礎の星、Lv.1–15、0 \/ 8 解放"/);
  assert.match(html,/class="tree-tier-step">1段目 · <\/span><span class="tree-tier-name">基礎の星/);
  assert.match(html,/aria-label="スキルの星、Lv.5–35、0 \/ 3 解放"/);
  assert.deepEqual(profile,before);
});

test('incoming constellation and level paths identify their destination without changing the graph',()=>{
  const profile=normalizeProgression({},HEROES);
  for(const [selected,destination,count] of [['origin','attack1',1],['ascension','transcendence',3],['demonGate','demonAwakening',3],['blessing1','blessing3',1]]){
    const html=talentView(profile,'nyanluna',selected);
    assert.equal([...html.matchAll(new RegExp(`data-link-node="${destination}" pathLength="1"`,'g'))].length,count);
    assert.match(html,/data-link-node="limit40" pathLength="1"/);
  }
});

test('unlock copy uses real node effects, with distinct level and skill announcements',()=>{
  assert.deepEqual(talentUnlockCopy(talentNode('origin','nyanluna')),{eyebrow:'CONSTELLATION UNLOCKED',name:'はじまりの光',effect:'基礎HP +12'});
  assert.equal(talentUnlockCopy(talentNode('limit30','nyanluna')).effect,'レベル上限 Lv.20 → Lv.30');
  assert.equal(talentUnlockCopy(talentNode('limit30','nyanluna')).eyebrow,'LEVEL LIMIT UNLOCKED');
  assert.equal(talentUnlockCopy(talentNode('blessing1','nyanluna')).name,talentNode('blessing1','nyanluna').name);
  assert.equal(presentTalentUnlock(null,talentNode('origin','nyanluna')),false);
});

test('floating explanations share real unlock conditions without duplicate desktop IDs or save changes',()=>{
  const profile=normalizeProgression({},HEROES),before=structuredClone(profile);
  for(const id of ['origin','guard2','blessing1','limit30']){
    const inline=talentDetailView(profile,'nyanluna',id),sheet=talentDetailView(profile,'nyanluna',id,{dialog:true});
    assert.match(sheet,/id="dialog-talent-detail"/);
    assert.match(sheet,/id="talent-explanation-title" tabindex="-1"/);
    assert.doesNotMatch(sheet,/\sid="(?:talent-detail|limit-current-level|limit-next-level)"/);
    assert.equal(sheet.replace(/id="dialog-([^"]+)"/g,'id="$1"').replace('<h3 id="talent-explanation-title" tabindex="-1">','<h3>'),inline);
    assert.match(sheet,new RegExp(`data-unlock-node="${id}" data-unlock-hero="nyanluna" disabled`));
  }
  assert.match(talentDetailView(profile,'nyanluna','limit30',{dialog:true}),/id="dialog-limit-current-level"/);
  assert.match(talentView(profile,'nyanluna','limit30',0,{visibleTier:3}),/data-tree-tier="3" aria-pressed="true"/);
  assert.match(talentView(profile,'nyanluna','origin',0,{visibleTier:3}),/data-tree-tier="1" aria-pressed="true"/);
  assert.deepEqual(profile,before);
});
