import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,breakthrough,breakthroughStatus,talentStatus,unlockTalent} from '../src/progression.js';
import {LEVEL_AWAKENING_COSTS} from '../src/level-rules.js';
import {LIMIT_BREAK_NODES} from '../src/talents.js';
import {talentView} from '../src/talent-ui.js';
const story={version:2,actClears:Array(20).fill(true)};
function gate(g,area){g.phase='playing';g.area=area;g.wave=area*2+2;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.equal(g.crossExit(),true);}

test('each of eight acts guarantees one ticket on every clear in both modes, independently of first-clear missions',()=>{
  for(let act=0;act<8;act++)for(const difficulty of ['normal','hard']){
    let progression=normalizeProgression({story},HEROES);
    for(let run=1;run<=2;run++){
      const g=new Adventure({act,difficulty,progression});g.lootRng=()=>.99;
      gate(g,0);gate(g,1);assert.equal(g.earnedWeaponTickets,0);
      gate(g,2);assert.equal(g.phase,'victory');assert.equal(g.earnedWeaponTickets,1);
      assert.equal(g.progression.inventory.weaponTicket,run);
      const event=g.drainEvents().find(e=>e.type==='weaponTicket');assert.equal(event.source,'actClear');assert.equal(event.count,1);
      const completed=structuredClone(g.progression);assert.equal(g.crossExit(),false);assert.deepEqual(g.progression,completed);
      progression=normalizeProgression(JSON.parse(JSON.stringify(g.progression)),HEROES);assert.equal(progression.inventory.weaponTicket,run);
    }
  }
});
test('the clear ticket supplements boss drops; defeat or return before the final gate earns no guarantee',()=>{
  const g=new Adventure({progression:{story}});g.enemies=[];g.lootRng=()=>0;
  const boss=g.spawnEnemy('boss',10,10);g.hit(boss,999999,0,0);assert.equal(g.earnedWeaponTickets,1);
  gate(g,2);assert.equal(g.earnedWeaponTickets,2);assert.equal(g.progression.inventory.weaponTicket,2);
  const early=new Adventure({progression:{story}});gate(early,0);assert.equal(new Adventure({progression:early.progression}).progression.inventory.weaponTicket,0);
  const lost=new Adventure();lost.player.invincible=0;lost.hurt(999999,0,0);assert.equal(lost.phase,'defeat');assert.equal(lost.progression.inventory.weaponTicket,0);assert.equal(lost.crossExit(),false);
});
test('awakening costs escalate, agree with the tree and do not require chapter-two materials for Lv.30',()=>{
  assert.deepEqual(LIMIT_BREAK_NODES.map(n=>n.cost),LEVEL_AWAKENING_COSTS);
  assert.deepEqual(LEVEL_AWAKENING_COSTS.slice(0,3),[{limitStone:1,starBud:60,moonDew:12,wardenCore:3},{limitStone:2,starBud:180,moonPrism:20,astralCore:6},{limitStone:4,starBud:420,moonPrism:60,astralCore:18}]);
});
test('every stone and material is required atomically for each character and cap, including the direct API',()=>{
  for(const hero of HEROES)for(const [stage,cost] of LEVEL_AWAKENING_COSTS.entries()){
    const make=()=>normalizeProgression({story,characters:{[hero.id]:{level:20+stage*10,breaks:stage,xp:400}},inventory:cost},HEROES),node=`limit${30+stage*10}`;
    for(const id of Object.keys(cost)){
      const p=make();p.inventory[id]--;const before=structuredClone(p);
      assert.equal(breakthroughStatus(p,hero.id).canBreak,false);assert.deepEqual(breakthroughStatus(p,hero.id).missing,[{id,needed:cost[id],owned:cost[id]-1}]);
      assert.equal(talentStatus(p,hero.id,node).canUnlock,false);assert.equal(unlockTalent(p,hero.id,node),false);assert.equal(breakthrough(p,hero.id),false);assert.deepEqual(p,before);
    }
    const p=make(),other=structuredClone(p.characters);assert.equal(unlockTalent(p,hero.id,node),true);
    for(const id of Object.keys(cost))assert.equal(p.inventory[id],0);
    for(const h of HEROES.filter(h=>h.id!==hero.id))assert.deepEqual(p.characters[h.id],other[h.id]);
    assert.equal(p.characters[hero.id].breaks,stage+1);const after=structuredClone(p);assert.equal(unlockTalent(p,hero.id,node),false);assert.deepEqual(p,after);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
  }
});
test('awakening UI names the actual missing rare material and preserves previously unlocked caps',()=>{
  const p=normalizeProgression({story,characters:{nyanluna:{level:30,breaks:1}},inventory:{...LEVEL_AWAKENING_COSTS[1],astralCore:5}},HEROES),before=structuredClone(p);
  assert.equal(talentStatus(p,'nyanluna','limit30').owned,true);assert.equal(unlockTalent(p,'nyanluna','limit30'),false);
  const html=talentView(p,'nyanluna','limit40');assert.match(html,/★2 深星の宝珠が1個不足/);assert.doesNotMatch(html,/覚醒の輝石が1個不足/);assert.match(html,/覚醒の輝石・素材が足りません/);assert.deepEqual(p,before);
});
