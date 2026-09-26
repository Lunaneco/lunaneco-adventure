import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES} from '../src/model.js';
import {normalizeProgression,talentStatus,unlockTalent,previewLimitBreak,levelCap,characterStats,LEVEL_RULES} from '../src/progression.js';
import {LIMIT_BREAK_NODES,GROWTH_NODES,isTalentUnlocked,growthCount,nextLimitNode} from '../src/talents.js';
const saved=(characters={},stones=3)=>normalizeProgression({characters,inventory:{limitStone:stones,starBud:1000,moonDew:100,wardenCore:20,moonPrism:100,astralCore:30}},HEROES);

test('the tree exposes exactly six cap steps from the shared level rules',()=>{
 assert.equal(GROWTH_NODES.length,33);assert.deepEqual(LIMIT_BREAK_NODES.map(n=>[n.level,n.cap,n.cost.limitStone]),[[20,30,1],[30,40,2],[40,50,4],[50,60,5],[60,70,6],[70,80,8]]);
 assert.equal(LIMIT_BREAK_NODES.at(-1).cap,LEVEL_RULES.maxLevel);
});
test('old breakthrough progress lights the correct tree nodes without requiring ability stars',()=>{
 const p=saved({nyanluna:{level:30,xp:5,breaks:1},tsukineko:{level:41,xp:2,breaks:3}}),before=structuredClone(p);
 assert.equal(talentStatus(p,'nyanluna','limit30').owned,true);assert.equal(talentStatus(p,'nyanluna','limit40').canUnlock,true);assert.equal(nextLimitNode(p.characters.nyanluna).id,'limit40');
 assert.equal(growthCount(p.characters.tsukineko),3);assert.equal(nextLimitNode(p.characters.tsukineko).id,'limit60');assert.equal(unlockTalent(p,'nyanluna','limit30'),false);assert.deepEqual(p,before);
});
test('a cap node spends the stone and all materials and applies banked XP to the selected character',()=>{
 const p=saved({nyanluna:{level:20,xp:664,breaks:0}});const other=structuredClone(p.characters.tsukineko),wallet=structuredClone(p.inventory);
 assert.equal(unlockTalent(p,'nyanluna','limit30'),true);assert.deepEqual(p.characters.nyanluna,{level:21,xp:136,breaks:1,tree:[]});assert.deepEqual(p.characters.tsukineko,other);
 assert.deepEqual(p.inventory,{...wallet,...Object.fromEntries(Object.entries(LIMIT_BREAK_NODES[0].cost).map(([id,n])=>[id,wallet[id]-n]))});assert.equal(unlockTalent(p,'nyanluna','limit30'),false);assert.equal(p.inventory.limitStone,2);
});
test('an old clicked node cannot spend the next stone even if banked XP reaches the next cap',()=>{
 const p=saved({nyanluna:{level:20,xp:99999,breaks:0}});assert.equal(unlockTalent(p,'nyanluna','limit50'),false);
 assert.equal(unlockTalent(p,'nyanluna','limit30'),true);assert.equal(p.characters.nyanluna.level,30);const after=structuredClone(p);
 assert.equal(unlockTalent(p,'nyanluna','limit30'),false);assert.deepEqual(p,after);assert.equal(unlockTalent(p,'nyanluna','limit40'),true);assert.equal(levelCap(p.characters.nyanluna),40);
});
test('level, sequence and actual limit stones remain necessary regardless of other resources',()=>{
 const p=saved({nyanluna:{level:19},tsukineko:{level:20}},0),before=structuredClone(p);
 for(const id of ['limit30','limit40','limit50']){assert.equal(unlockTalent(p,'nyanluna',id),false);assert.equal(unlockTalent(p,'tsukineko',id),false);}
 assert.deepEqual(p,before);p.inventory.limitStone=1;assert.equal(unlockTalent(p,'nyanluna','limit30'),false);assert.equal(unlockTalent(p,'tsukineko','limit40'),false);assert.equal(unlockTalent(p,'tsukineko','limit30'),true);
});
test('previewing a breakthrough does not spend or mutate anything and matches the eventual result',()=>{
 const p=saved({nyanluna:{level:20,xp:664,tree:['origin','guard1']}}),before=structuredClone(p);
 const preview=previewLimitBreak(p,'nyanluna','limit30');assert.equal(preview.level,21);assert.deepEqual(preview.tree,['origin','guard1']);assert.deepEqual(p,before);
 unlockTalent(p,'nyanluna','limit30');assert.deepEqual(p.characters.nyanluna,preview);assert.equal(previewLimitBreak(p,'nyanluna','limit30'),null);assert.equal(previewLimitBreak(p,'nyanluna','limit40'),null);assert.equal(previewLimitBreak(p,'nyanluna','origin'),null);
});
test('completed caps survive reload and cannot be paid again or duplicated as ability bonuses',()=>{
 const p=saved({nyanluna:{level:50,breaks:3,tree:['origin','guard1','limit30','limit40','limit50']}}),stats=characterStats(HEROES[0],p.characters.nyanluna);
 assert.deepEqual(p.characters.nyanluna.tree,['origin','guard1']);assert.equal(growthCount(p.characters.nyanluna),5);
 for(const n of LIMIT_BREAK_NODES.slice(0,3)){assert.equal(isTalentUnlocked(p.characters.nyanluna,n.id),true);assert.equal(unlockTalent(p,'nyanluna',n.id),false);}
 const restored=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.deepEqual(restored,p);assert.deepEqual(characterStats(HEROES[0],restored.characters.nyanluna),stats);assert.equal(restored.inventory.limitStone,3);
 const forged=saved({nyanluna:{level:20,tree:['limit30']}});assert.equal(isTalentUnlocked(forged.characters.nyanluna,'limit30'),false);assert.equal(levelCap(forged.characters.nyanluna),20);
});
