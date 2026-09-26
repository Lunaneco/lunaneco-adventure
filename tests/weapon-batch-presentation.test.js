import test from 'node:test';
import assert from 'node:assert/strict';
import {batchSummonPlan} from '../src/weapon-batch-plan.js';
import {WeaponSummonPresentation} from '../src/weapon-summon.js';
import {WEAPON_CATALOG} from '../src/weapons.js';
import {SUMMON_SIGNALS} from '../src/weapon-summon-plan.js';

const batch=ranks=>Object.freeze(ranks.map((rank,index)=>Object.freeze({item:WEAPON_CATALOG.find(item=>item.rarity.rank===rank&&item.heroId===['nyanluna','tsukineko','omsolo'][index%3]),duplicate:index>3,duplicateBuds:index>3?5:0})));
const cases=[Array(10).fill(2),[2,3,2,2,3,2,2,2,3,2],[2,4,2,3,2,4,2,3,4,2],Array(10).fill(4)];

test('the ten-star ceremony reveals every saved slot once and spotlights every actual legend',()=>{
  for(const ranks of cases){
    const results=batch(ranks),before=JSON.stringify(results),plan=batchSummonPlan(results);
    assert.equal(JSON.stringify(results),before);
    assert.equal(plan.rank,Math.max(...ranks));
    assert.equal(SUMMON_SIGNALS[plan.steps.find(s=>s.name==='batchBreak').color].rank,plan.rank);
    assert.deepEqual(plan.steps.filter(s=>s.name==='batchGather').map(s=>s.index),[0,1,2,3,4,5,6,7,8,9]);
    const reveals=plan.steps.filter(s=>s.name==='batchReveal');
    assert.deepEqual(reveals.map(s=>s.index).sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8,9]);
    assert.deepEqual(reveals.map(s=>s.rank),[...ranks].sort());
    assert.deepEqual(plan.steps.filter(s=>s.name==='batchLegend').map(s=>s.index),ranks.flatMap((rank,i)=>rank===4?[i]:[]));
    for(const s of reveals)assert.equal(s.rank,ranks[s.index]);
    plan.steps.reduce((last,s)=>{assert.ok(s.at>=last);return s.at;},0);
    assert.equal(plan.steps.at(-1).at,plan.total);assert.ok(plan.total<=25);
    assert.deepEqual(plan.video,[],'the batch ceremony must not depend on video playback');
    assert.ok(plan.steps.filter(s=>s.at<3.65&&s.color).every(s=>s.color==='blue'),'opening does not promise a higher rarity');
  }
});
test('reduced motion is a short static reveal with no eclipse or cut-ins',()=>{
  const plan=batchSummonPlan(batch(cases[2]),{motion:false});
  assert.ok(plan.total<=1.5);
  assert.deepEqual([...new Set(plan.steps.map(s=>s.name))],['open','batchQuiet','batchReveal','final']);
  assert.equal(plan.steps.filter(s=>s.name==='batchReveal').length,10);
  for(const invalid of [null,[],batch([2,3]),[...batch(Array(9).fill(2)),{}]])assert.equal(batchSummonPlan(invalid),null);
});
function harness(){
  const events=[],sounds=[],voices=[],tension=[],finished=[];
  const view={open(result,plan){events.push(['open',result.item.heroId,plan.batch]);},step(s){events.push(['step',s.name,s.index]);},frame(){},finish(s){events.push(['finish',s.skipped]);},close(){events.push(['close']);},pause(v){events.push(['pause',v]);}};
  const audio={play:(name,detail)=>sounds.push([name,detail]),setSummonSuspense:v=>tension.push(v)};
  const voice={play:id=>voices.push(id),stop:()=>voices.push('stop')};
  const summon=new WeaponSummonPresentation({view,audio,voice,onFinish:(result,info)=>finished.push(info)});
  const run=seconds=>{for(let i=0;i<Math.ceil(seconds*60);i++)summon.tick(1/60);};
  return {summon,run,events,sounds,voices,tension,finished};
}
test('a natural batch plays once, lowers music for the eclipse and keeps legendary voice with its owner',()=>{
  const results=batch(cases[2]),h=harness();
  assert.equal(h.summon.start(results[0],{batch:results}),true);
  assert.equal(h.summon.current.result.item.heroId,'tsukineko','featured result is the actual first legend');
  h.run(h.summon.current.plan.total+1);
  assert.equal(h.events.filter(e=>e[1]==='batchReveal').length,10);
  assert.deepEqual(h.voices,['tsukineko-treasure-1'],'multiple legends do not overlap voice lines');
  assert.deepEqual(h.tension,[true,false,false]);
  assert.deepEqual(h.finished,[{skipped:false}]);
});
test('skip from every beat settles all rewards once, clears tension, and closing permits a normal single draw',()=>{
  const results=batch(cases[2]),plan=batchSummonPlan(results);
  for(const step of plan.steps.slice(0,-1)){
    const h=harness();h.summon.start(results[0],{batch:results});h.run(step.at+.01);
    assert.equal(h.summon.skip(),true);assert.equal(h.summon.skip(),false);h.run(30);
    assert.deepEqual(h.finished,[{skipped:true}]);assert.equal(h.tension.at(-1),false);
    assert.equal(h.voices.length,1);h.summon.close();
    assert.equal(h.summon.start(results[0],{motion:false}),true);
    assert.equal(h.summon.current.plan.batch,undefined);h.run(2);assert.equal(h.summon.finished,true);
  }
});
test('backgrounding pauses the sequence; reduced motion has only one quiet result chord',()=>{
  const results=batch(cases[2]),h=harness();h.summon.start(results[0],{batch:results});h.run(3);
  const t=h.summon.current.t,count=h.events.length;h.summon.setHidden(true);h.run(15);
  assert.equal(h.summon.current.t,t);assert.equal(h.events.length,count+1);
  h.summon.setHidden(false);h.run(20);assert.equal(h.summon.finished,true);
  h.summon.close();
  const quiet=harness();quiet.summon.start(results[0],{batch:results,motion:false});quiet.run(2);
  assert.deepEqual(quiet.sounds.map(s=>s[0]),['summonReveal']);assert.equal(quiet.finished.length,1);
});
