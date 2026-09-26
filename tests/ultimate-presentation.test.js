import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {UltimatePresentation} from '../src/ultimate-presentation.js';
import {battleVoiceCues} from '../src/voice-policy.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness(hero=0){
  const progression=normalizeProgression({story:{version:2,actClears:Array(12).fill(true),tsukinekoUnlocked:true,omsoloUnlocked:true}},HEROES);
  let game=new Adventure({hero,party:[HEROES[hero].id,HEROES[(hero+1)%3].id],progression});
  game.waveSpawned=game.waveGoal;game.waveBreak=-1000;game.player.attack=game.partner.attack=999;game.enemies=[];game.player.charge=100;game.drainEvents();
  const records=[],view={async show(id,line,spec){records.push(['show',id,line.text,spec.name]);},hide(){records.push(['hide']);},speaking(value){records.push(['speaking',value]);},pause(value){records.push(['pause',value]);},release(){records.push(['release']);}};
  const voice={sound:{ctx:{state:'running'}},manifest:{},mode:'battle',suspended:false,options:null,setMode(mode){this.stop();this.mode=mode;},async play(id,options){this.options=options;records.push(['voice',id]);},stop(){const options=this.options;this.options=null;options?.onFinish('cancelled');},suspend(){this.suspended=true;},resume(){this.suspended=false;}};
  const controller=new UltimatePresentation({voice,view,getGame:()=>game,onComplete:cast=>records.push(['cast',cast])});
  return {game,voice,records,controller,replaceGame(){game=null;},tick(seconds){for(let i=0;i<Math.ceil(seconds*60);i++){controller.tick(1/60);game?.tick(1/60);}}};
}
test('all three heroes show their own face and call before applying damage or consuming charge',async()=>{
  for(let hero=0;hero<3;hero++){
    const h=harness(hero),g=h.game;g.player.hp=50;const target=g.spawnEnemy('boss',g.player.x,g.player.z+1),hp=target.hp,time=g.time;
    assert.equal(g.player.hero,hero);assert.equal(h.controller.start(g),true);await flush();
    h.tick(.15);assert.equal(h.records.some(r=>r[0]==='voice'),false);
    h.tick(.2);assert.deepEqual(h.records.find(r=>r[0]==='voice'),['voice',`${HEROES[hero].id}-ultimate-1`]);
    h.voice.options.onStart();h.tick(2);assert.equal(g.phase,'ultimateIntro');assert.equal(g.player.charge,100);assert.equal(target.hp,hp);assert.equal(g.player.hp,50);assert.equal(g.time,time);assert.equal(g.ultimateEffects.length,0);
    h.voice.options.onFinish('ended');h.tick(.3);assert.equal(h.controller.active,false);assert.equal(g.phase,'playing');assert.equal(g.player.charge,0);assert.equal(g.ultimateEffects[0].heroId,HEROES[hero].id);assert.equal(h.records.filter(r=>r[0]==='cast').length,1);
    const events=g.drainEvents(),ultimate=events.find(e=>e.type==='ultimate');assert.equal(ultimate.voicePresented,true);assert.equal(battleVoiceCues([ultimate],g).length,0);
  }
});
test('repeated input, switching and dash cannot bypass a pending introduction',async()=>{
  const h=harness();assert.ok(h.controller.start(h.game));await flush();h.tick(.4);
  assert.equal(h.controller.start(h.game),false);assert.equal(h.game.ultimate(),false);assert.equal(h.game.switchHero(),false);assert.equal(h.game.dash(1,0),false);assert.equal(h.game.player.charge,100);
});
test('pause freezes introduction, rescue deadline and voice; completion waits for resume',async()=>{
  const h=harness();h.game.rescue={active:true,remaining:8};h.controller.start(h.game);await flush();h.tick(.4);h.voice.options.onStart();h.controller.pause();h.tick(20);
  assert.equal(h.game.rescue.remaining,8);assert.equal(h.game.player.charge,100);assert.equal(h.voice.suspended,true);
  h.voice.options.onFinish('ended');h.tick(10);assert.equal(h.game.phase,'ultimateIntro');h.controller.resume();h.tick(2);assert.equal(h.game.phase,'playing');assert.equal(h.records.filter(r=>r[0]==='cast').length,1);
});
test('muted or unavailable audio still displays the face and readable line before casting',async()=>{
  const h=harness();h.voice.play=async(id,options)=>options.onFinish('unavailable');h.controller.start(h.game);await flush();h.tick(.5);assert.equal(h.game.player.charge,100);h.tick(1.5);assert.equal(h.game.player.charge,0);assert.ok(h.records.find(r=>r[0]==='release'));
});
test('failed or stalled loads have a bounded fallback and cannot trigger a second cast later',async()=>{
  const h=harness();h.controller.start(h.game);await flush();h.tick(.4);const delayed=h.voice.options;h.tick(4);assert.equal(h.controller.active,false);assert.equal(h.records.filter(r=>r[0]==='cast').length,1);delayed.onStart();delayed.onFinish('ended');h.tick(3);assert.equal(h.records.filter(r=>r[0]==='cast').length,1);
});
test('leaving a run or cancelling during pause discards the pending cast without consuming charge',async()=>{
  for(const replace of [true,false]){const h=harness();h.controller.start(h.game);await flush();h.tick(.4);const delayed=h.voice.options;h.controller.pause();if(replace){h.replaceGame();h.controller.tick(.1);}else h.controller.cancel();delayed.onStart();delayed.onFinish('ended');assert.equal(h.controller.active,false);assert.equal(h.game.player.charge,100);assert.equal(h.game.ultimateEffects.length,0);}
});
test('invalid ultimate requests never open the presentation',()=>{
  for(const alter of [g=>g.player.charge=99,g=>g.player.hp=0,g=>g.exitOpen=true,g=>g.travelOpen=true,g=>g.phase='paused',g=>g.tutorial={active:true}]){const h=harness();alter(h.game);assert.equal(h.controller.start(h.game),false);assert.equal(h.records.length,0);}
});

test('skipping during entrance, loading, voice or release casts once and cancels pending audio',async()=>{
  for(const stage of ['entrance','loading','voice','release']){
    const h=harness();h.controller.start(h.game);await flush();
    if(stage!=='entrance')h.tick(.4);
    const pending=h.voice.options;
    if(stage==='voice'||stage==='release')pending.onStart();
    if(stage==='release'){h.tick(1.5);pending.onFinish('ended');h.controller.tick(.01);}
    assert.equal(h.controller.skip(),true);assert.equal(h.controller.active,false);assert.equal(h.game.player.charge,0);assert.equal(h.game.phase,'playing');assert.equal(h.voice.mode,'battle');assert.equal(h.voice.options,null);
    assert.equal(h.controller.skip(),false);pending?.onStart();pending?.onFinish('ended');h.tick(1);
    assert.equal(h.records.filter(r=>r[0]==='cast').length,1);assert.equal(h.game.drainEvents().filter(e=>e.type==='ultimate').length,1);
  }
});
test('a pause or stale run cannot be skipped into a cast',async()=>{
 const h=harness();h.controller.start(h.game);await flush();h.controller.pause();assert.equal(h.controller.skip(),false);assert.equal(h.game.player.charge,100);h.controller.resume();h.replaceGame();assert.equal(h.controller.skip(),false);assert.equal(h.game.player.charge,100);
});
