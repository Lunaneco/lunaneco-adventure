import test from 'node:test';
import assert from 'node:assert/strict';
import {summonPlan,summonRoute,SUMMON_SIGNALS,SUMMON_VIDEO,SIGNAL_FOR_RANK,videoTimeAt} from '../src/weapon-summon-plan.js';
import {WeaponSummonPresentation} from '../src/weapon-summon.js';
import {WEAPON_CATALOG} from '../src/weapons.js';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';
import {Soundscape} from '../src/audio.js';

const pick=(heroId,rank)=>WEAPON_CATALOG.find(item=>item.heroId===heroId&&item.rarity.rank===rank);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(freeze);}return value;};
const shown=plan=>plan.steps.flatMap(step=>[step.color,step.next].filter(Boolean));

test('every route promises no more than the drawn rarity, never downgrades and reveals the true colour',()=>{
  for(const rank of [2,3,4])for(let i=0;i<500;i++){
    const plan=summonPlan(rank,{rng:()=>i/500});let best=0;
    for(const color of shown(plan)){const r=SUMMON_SIGNALS[color].rank;assert.ok(r<=rank,`${color} shown for ★${rank}`);assert.ok(r>=best,`${color} after a higher colour`);best=r;}
    assert.equal(plan.steps.find(s=>s.name==='reveal').color,SIGNAL_FOR_RANK[rank]);
    assert.equal(plan.steps.some(s=>s.name==='omen'),plan.route.omen);if(plan.route.omen)assert.equal(rank,4);
    assert.equal(plan.video.some(s=>s.to>SUMMON_VIDEO.branch),rank===4,'only legends play the gold part of the clip');
    assert.equal(plan.steps.some(s=>s.name==='cutin'),rank===4);
    assert.equal(plan.steps.filter(s=>s.name==='star').length,rank);
  }
});
test('each presentation route is reachable with its cosmetic odds',()=>{
  const route=(rank,roll)=>summonRoute(rank,()=>roll);
  assert.deepEqual(route(2,0),{omen:false,colors:['blue']});
  assert.deepEqual(route(3,.1),{omen:false,colors:['blue','purple']});assert.deepEqual(route(3,.5),{omen:false,colors:['purple']});
  assert.deepEqual(route(4,.1),{omen:true,colors:['gold']});assert.deepEqual(route(4,.4),{omen:false,colors:['blue','gold']});assert.deepEqual(route(4,.8),{omen:false,colors:['gold']});
  for(const bad of [NaN,-1,1,Infinity])assert.deepEqual(route(4,bad),{omen:false,colors:['gold']});
});
test('the first second is identical for every rarity except the legendary omen',()=>{
  const opening=plan=>plan.steps.filter(s=>s.at<SUMMON_VIDEO.branch&&s.name!=='omen').map(s=>`${s.name}@${s.at}:${s.color??''}`);
  const base=opening(summonPlan(2,{rng:()=>0}));
  for(const [rank,roll] of [[3,.1],[3,.5],[4,.4],[4,.8],[4,.1]])assert.deepEqual(opening(summonPlan(rank,{rng:()=>roll})),base);
  // The moment of truth: a blue pillar either bursts (★2) or cracks (promotion) at the same instant.
  const blue=summonPlan(2,{rng:()=>0}),promoted=summonPlan(4,{rng:()=>.4});
  assert.equal(blue.steps.find(s=>s.name==='burst').at,promoted.steps.find(s=>s.name==='crack').at);
});
test('timelines are ordered, bounded and the clip stops before the supplied staff appears',()=>{
  for(const [rank,roll,limit] of [[2,0,5.5],[3,.5,6],[3,.1,7],[4,.8,11],[4,.1,11],[4,.4,12.5]]){
    const plan=summonPlan(rank,{rng:()=>roll});
    plan.steps.reduce((last,step)=>{assert.ok(step.at>=last,`${step.name} out of order`);return step.at;},0);
    assert.equal(plan.steps.at(-1).name,'final');assert.equal(plan.steps.at(-1).at,plan.total);assert.ok(plan.total<=limit,`★${rank} route took ${plan.total}s`);
    for(const s of plan.video){assert.ok(s.to<=SUMMON_VIDEO.end&&SUMMON_VIDEO.end<6.44);assert.ok(s.from<s.to);}
  }
  assert.deepEqual(summonPlan(2,{rng:()=>0}).video,[{at:0,from:0,to:SUMMON_VIDEO.branch}]);
  assert.deepEqual(summonPlan(4,{rng:()=>.8}).video,[{at:0,from:0,to:SUMMON_VIDEO.end}],'straight gold plays without a pause');
  const promoted=summonPlan(4,{rng:()=>.4});
  assert.deepEqual(promoted.video,[{at:0,from:0,to:SUMMON_VIDEO.branch},{at:2.76,from:SUMMON_VIDEO.branch,to:SUMMON_VIDEO.end}]);
  assert.equal(videoTimeAt(promoted,.5),.5);assert.equal(videoTimeAt(promoted,1.5),null);assert.ok(Math.abs(videoTimeAt(promoted,4)-(4-2.76+SUMMON_VIDEO.branch))<1e-9);
  // Overlays meet the clip's own sunburst frame.
  assert.ok(Math.abs(videoTimeAt(promoted,promoted.steps.find(s=>s.name==='burst').at)-SUMMON_VIDEO.burst)<1e-9);
});
test('reduced motion skips the clip, flashes, promotions and omens and is short',()=>{
  for(const rank of [2,3,4]){
    const plan=summonPlan(rank,{motion:false,rng:()=>.1});
    assert.deepEqual(plan.video,[]);assert.equal(plan.total<=1.5,true);
    assert.deepEqual([...new Set(plan.steps.map(s=>s.name))],['open','halo','reveal','star','name','final']);
    assert.deepEqual([...new Set(shown(plan))],[SIGNAL_FOR_RANK[rank]]);
  }
});

function harness({autoVideo=true}={}){
  const calls=[],sounds=[],voices=[];
  const view={videoFailed:false,time:null,autoVideo,
    open(result,plan,options){calls.push(['open',plan.rank,options.video]);},step(step){calls.push(['step',step.name]);},frame(){},
    video(expected,pauseAt){calls.push(['video',expected===null?null:Number(expected.toFixed(3))]);if(this.autoVideo)this.time=expected===null?this.time:Math.min(expected,pauseAt);},
    get videoTime(){return this.time;},dropVideo(){calls.push(['drop']);},pause(value){calls.push(['pause',value]);},
    finish(options){calls.push(['finish',options.skipped]);},updateResult(){calls.push(['update']);},close(){calls.push(['close']);}};
  const audio={play(name,detail){sounds.push([name,detail]);}},voice={play(id,options){voices.push(['play',id,options.priority]);},stop(){voices.push(['stop']);}};
  const finished=[],controller=new WeaponSummonPresentation({view,audio,voice,onFinish:(result,info)=>finished.push(info)});
  const run=(seconds,step=1/60)=>{for(let i=0;i<Math.round(seconds/step);i++)controller.tick(step);};
  return {calls,sounds,voices,finished,view,controller,run};
}
const drawn=(heroId,rank,duplicate=false)=>freeze({item:pick(heroId,rank),duplicate,duplicateBuds:duplicate?10:0});

test('steps fire once, in order, and the result opens when the timeline ends',()=>{
  for(const [rank,roll] of [[2,0],[3,.1],[4,.4]]){
    const h=harness(),result=drawn('nyanluna',rank),plan=summonPlan(rank,{rng:()=>roll});
    assert.equal(h.controller.start(result,{rng:()=>roll}),true);assert.equal(h.controller.start(result),false,'a second summon cannot overlap');
    h.run(plan.total+.5);
    assert.deepEqual(h.calls.filter(c=>c[0]==='step').map(c=>c[1]),plan.steps.slice(0,-1).map(s=>s.name));
    assert.deepEqual(h.calls.filter(c=>c[0]==='finish'),[['finish',false]]);assert.deepEqual(h.finished,[{skipped:false}]);
    assert.equal(h.controller.finished,true);assert.equal(h.controller.active,true,'the result stays until closed');
    assert.equal(h.sounds.filter(s=>s[0]==='summonStar').length,rank);
  }
});
test('skipping jumps to the result exactly once with one chime, and a legend still speaks once',()=>{
  const h=harness();h.controller.start(drawn('tsukineko',4),{rng:()=>.8});h.run(.5);
  assert.equal(h.controller.skip(),true);assert.equal(h.controller.skip(),false);h.run(12);
  assert.deepEqual(h.calls.filter(c=>c[0]==='finish'),[['finish',true]]);
  assert.equal(h.calls.filter(c=>c[0]==='step').length,2,'no steps fire after the skip');
  assert.deepEqual(h.sounds.filter(s=>s[0]==='summonReveal').map(s=>s[1].skipped),[true]);
  assert.deepEqual(h.voices,[['play','tsukineko-treasure-1',60]]);
});
test('legendary voice lines belong to the weapon owner and exist as audio files',()=>{
  for(const hero of ['nyanluna','tsukineko','omsolo']){
    const h=harness(),plan=summonPlan(4,{rng:()=>.8});h.controller.start(drawn(hero,4),{rng:()=>.8});h.run(plan.total+.2);
    assert.deepEqual(h.voices,[['play',`${hero}-treasure-1`,60]]);assert.ok(VOICE_MANIFEST[`${hero}-treasure-1`]);
    const reveal=plan.steps.find(s=>s.name==='reveal').at;assert.ok(reveal<plan.total);
  }
  const quiet=harness();quiet.controller.start(drawn('omsolo',3),{rng:()=>.5});quiet.run(10);assert.deepEqual(quiet.voices,[]);
});
test('the clock waits for a late clip, follows a fast one and drops a stalled one',()=>{
  const lag=harness({autoVideo:false});lag.view.time=0;lag.controller.start(drawn('omsolo',4),{rng:()=>.8});lag.run(.5);
  assert.ok(lag.controller.current.t<=.13,'held until the first frames advance');
  lag.view.autoVideo=true;lag.view.time=.2;lag.run(.1);assert.ok(lag.controller.current.t>.2);
  lag.view.autoVideo=false;lag.view.time=3;lag.controller.tick(1/60);assert.ok(Math.abs(lag.controller.current.t-(3-.12))<.02,'jumps forward to a clip that ran ahead');
  const stuck=harness({autoVideo:false});stuck.view.time=0;stuck.controller.start(drawn('omsolo',4),{rng:()=>.8});stuck.run(1.4);
  assert.deepEqual(stuck.calls.filter(c=>c[0]==='drop'),[['drop']]);const plan=summonPlan(4,{rng:()=>.8});stuck.run(plan.total);
  assert.deepEqual(stuck.finished,[{skipped:false}]);
  const missing=harness({autoVideo:false});missing.controller.start(drawn('omsolo',2),{rng:()=>0});missing.run(1.25);assert.deepEqual(missing.calls.filter(c=>c[0]==='drop'),[['drop']]);
  const failed=harness();failed.view.videoFailed=true;failed.controller.start(drawn('omsolo',2),{rng:()=>0});assert.deepEqual(failed.calls.filter(c=>c[0]==='drop'),[['drop']]);
});
test('the clip pauses between segments and resumes for a promotion to gold',()=>{
  const h=harness(),plan=summonPlan(4,{rng:()=>.4});h.controller.start(drawn('nyanluna',4),{rng:()=>.4});h.run(plan.total);
  const video=h.calls.filter(c=>c[0]==='video').map(c=>c[1]);
  const firstGap=video.indexOf(null),resumed=video.findIndex((v,i)=>i>firstGap&&v!==null);
  assert.ok(firstGap>0&&resumed>firstGap);assert.ok(Math.max(...video.slice(0,firstGap))<=SUMMON_VIDEO.branch);
  assert.ok(Math.abs(video[resumed]-SUMMON_VIDEO.branch)<.03,'resumes from the paused frame');
});
test('a hidden page freezes the stage; closing cancels it and stops only a line it started',()=>{
  const h=harness();h.controller.start(drawn('nyanluna',2),{rng:()=>0});h.run(.5);const t=h.controller.current.t;
  h.controller.setHidden(true);h.run(3);assert.equal(h.controller.current.t,t);h.controller.setHidden(false);h.run(.1);assert.ok(h.controller.current.t>t);
  assert.deepEqual(h.calls.filter(c=>c[0]==='pause'),[['pause',true],['pause',false]]);
  assert.equal(h.controller.close(),true);assert.equal(h.controller.active,false);assert.equal(h.controller.close(),false);assert.deepEqual(h.voices,[]);
  const legend=harness();legend.controller.start(drawn('nyanluna',4),{rng:()=>.8});legend.controller.skip();legend.controller.close();assert.deepEqual(legend.voices.map(v=>v[0]),['play','stop']);
});
test('every summon cue schedules ordered, bounded envelopes',()=>{
  const nodes=[],param=value=>({value,events:[],setValueAtTime(v,t){this.events.push([v,t]);},linearRampToValueAtTime(v,t){this.events.push([v,t]);},exponentialRampToValueAtTime(v,t){assert.ok(v>0,'exponential ramps cannot reach zero');this.events.push([v,t]);},setTargetAtTime(){}});
  const node=kind=>{const n={kind,connect(){},disconnect(){},start(t){n.start=t;},stop(t){n.stop=t;},frequency:param(440),gain:param(1),Q:param(1)};nodes.push(n);return n;};
  const sound=new Soundscape();sound.ctx={currentTime:10,sampleRate:8000,state:'running',destination:{},createOscillator:()=>node('osc'),createGain:()=>node('gain'),createBiquadFilter:()=>node('filter'),createBufferSource:()=>node('noise'),createBuffer:(channels,length)=>({getChannelData:()=>new Float32Array(length)})};sound.master=node('master');
  const cues=[['summonOpen'],['summonOmen'],['summonAwaken'],['summonRise',{color:'blue'}],['summonRise',{color:'purple',surge:true}],['summonCrack',{color:'blue'}],['summonGold'],['summonBurst',{color:'blue'}],['summonBurst',{color:'gold',rank:4}],['summonCutin'],['summonReveal',{rank:2}],['summonReveal',{rank:4,skipped:true}],...[0,1,2,3].map(index=>['summonStar',{rank:4,index}]),['summonName'],...[0,5,9].map(index=>['summonGather',{index}]),['summonOrbit'],['summonEclipse'],['summonFan'],...[2,3,4].map(rank=>['summonCard',{rank}]),['summonLegend']];
  for(const [name,detail] of cues){
    nodes.length=0;sound.play(name,detail);const gains=nodes.filter(n=>n.kind==='gain');
    assert.ok(nodes.some(n=>n.kind==='osc'||n.kind==='noise'),`${name} is silent`);assert.ok(nodes.filter(n=>n.kind==='osc').length<=12,`${name} uses too many voices`);
    for(const n of nodes)for(const p of [n.gain,n.frequency])p.events.reduce((last,[,t])=>{assert.ok(t>=last&&t>=10,`${name} automation out of order`);return t;},10);
    const peaks=gains.map(g=>Math.max(...g.gain.events.map(([v])=>v)));assert.ok(Math.max(...peaks)<=.3,`${name} peak ${Math.max(...peaks)}`);assert.ok(peaks.reduce((a,b)=>a+b,0)<=1.2,`${name} is too loud overall`);
  }
});
test('reduced motion plays one reveal chime and one star chime',()=>{
  const h=harness(),plan=summonPlan(4,{motion:false});h.controller.start(drawn('omsolo',4),{motion:false});h.run(plan.total+.1);
  assert.deepEqual(h.sounds.map(s=>s[0]),['summonReveal','summonStar']);assert.deepEqual(h.calls[0],['open',4,false]);
});
