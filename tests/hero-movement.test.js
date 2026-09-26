import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {contains} from '../src/terrain.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function quiet(hero,options={}){
  const g=new Adventure({hero,party:[HEROES[hero].id],progression:{story:{version:2,actClears:Array(12).fill(true)}},seed:93,...options});
  g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.drainEvents();return g;
}
const distance=(g,start)=>Math.hypot(g.player.x-start.x,g.player.z-start.z);
function walk(hero,stride,input,dt){
  const g=quiet(hero),start={...g.player};g.skills.stride=stride;
  for(let i=0;i<Math.round(.5/dt);i++)g.tick(dt,input);
  return distance(g,start);
}
function dash(hero,input,dt){
  const g=quiet(hero),start={...g.player};assert.ok(g.dash(input.x,input.z));
  const cooldown=g.player.dashCooldown,immunity=g.player.invincible,duration=g.player.dash;
  for(let i=0;i<100&&g.player.dash>0;i++)g.tick(dt);
  return {distance:distance(g,start),cooldown,immunity,duration};
}
for(const dt of [1/30,1/60,1/120])test(`Omsolo moves and dodges twice as far at ${Math.round(1/dt)} Hz, including diagonal input and movement blessings`,()=>{
  for(const input of [{x:1,z:0},{x:0,z:-1},{x:1,z:1}]){
    for(const stride of [0,3]){
      const [n,t,o]=HEROES.map((_,hero)=>walk(hero,stride,input,dt));
      near(n,5.6*.5*(1+stride*.12));near(t,n);near(o,n*2);
    }
    const [n,t,o]=HEROES.map((_,hero)=>dash(hero,input,dt));
    near(t.distance,n.distance);near(o.distance,n.distance*2);
    for(const key of ['cooldown','immunity','duration']){near(o[key],n[key]);near(t[key],n[key]);}
  }
});

test('switching changes walking speed immediately but cannot change the speed of a dodge already started',()=>{
  for(const first of [0,2]){
    const other=first===0?2:0,g=quiet(first,{party:['nyanluna','omsolo']});
    assert.ok(g.dash(1,0));g.tick(.05);assert.ok(g.switchHero());
    let before=g.player.x;g.tick(.05);near(g.player.x-before,(first===2?48:24)*.05);
    while(g.player.dash>0)g.tick(.01);
    before=g.player.x;g.tick(.05,{x:1,z:0});near(g.player.x-before,(other===2?11.2:5.6)*.05);
    g.player.dashCooldown=0;assert.ok(g.dash(-1,0));before=g.player.x;g.tick(.05);near(before-g.player.x,(other===2?48:24)*.05);
  }
});

test('Omsolo cannot dodge across a gap or reach a locked upper floor at double speed',()=>{
  const bridge=quiet(2,{act:2});bridge.wave=5;bridge.area=2;Object.assign(bridge.player,{x:-9,z:-12});
  assert.ok(bridge.dash(0,1));for(let i=0;i<8;i++){bridge.tick(.05);assert.ok(contains(bridge.walkLayout,bridge.player.x,bridge.player.z,.6));}
  assert.ok(bridge.player.z<0);
  const stairs=quiet(2);stairs.wave=3;stairs.area=1;stairs.waveSpawned=0;stairs.spawnTimer=999;Object.assign(stairs.player,{x:0,z:-5});
  assert.ok(stairs.dash(0,-1));for(let i=0;i<8;i++)stairs.tick(.05);
  assert.ok(stairs.player.z>-7);assert.equal(stairs.travelOpen,null);assert.ok(contains(stairs.walkLayout,stairs.player.x,stairs.player.z,.6));
});
