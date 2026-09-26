import {RecruitedAdventure} from './recruited-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
const prepare=()=>{const g=new RecruitedAdventure({hero:1,seed:15});g.waveSpawned=g.waveGoal;g.waveBreak=-100;g.rng=()=>.9;g.player.attack=g.partner.attack=999;return g;};
test('the rifle shoots a moving round at distant enemies in every heading instead of instant melee damage',()=>{
  for(let i=0;i<8;i++){
    const g=prepare(),angle=i*Math.PI/4,e=g.spawnEnemy('golem',Math.sin(angle)*9,3+Math.cos(angle)*9);e.speed=0;
    assert.equal(g.attackFrom(g.player,1),true);assert.equal(e.hp,e.maxHp);const round=g.projectiles[0];assert.equal(round.kind,'gun');assert.equal(round.heroId,'tsukineko');assert.equal(round.target,undefined);assert.ok(Math.abs(Math.atan2(round.vx,round.vz)-Math.atan2(Math.sin(angle),Math.cos(angle)))<1e-8);
    for(let frame=0;frame<25;frame++)g.tick(1/60);assert.ok(e.hp<e.maxHp);
  }
});
test('straight rounds pierce two enemies, hit each once and cannot tunnel through small targets',()=>{
  const g=prepare(),enemies=[3.7,4.3,6].map(z=>g.spawnEnemy('golem',0,z));for(const e of enemies){e.radius=.1;e.speed=0;}
  g.attackFrom(g.player,1);g.tick(.05);for(let i=0;i<8;i++)g.tick(.05);
  assert.ok(Math.abs(enemies[0].maxHp-enemies[0].hp-26)<1e-8);assert.ok(Math.abs(enemies[1].maxHp-enemies[1].hp-26)<1e-8);assert.equal(enemies[2].hp,enemies[2].maxHp);assert.equal(g.projectiles.length,0);
});
test('a rifle round credits Tsukineko after switching to Nyanluna before impact',()=>{
  const g=prepare(),e=g.spawnEnemy('moss',0,11);e.hp=1;e.speed=0;g.attackFrom(g.player,1);g.switchHero();g.player.attack=999;for(let i=0;i<25;i++)g.tick(1/60);assert.equal(g.progressFor(1).xp,3);assert.equal(g.progressFor(0).xp,1.5);
});
test('support rifle fire remains a projectile and uses the support damage multiplier',()=>{
  const g=new RecruitedAdventure({hero:0});g.rng=()=>.9;const e=g.spawnEnemy('golem',g.partner.x,g.partner.z+8);assert.equal(g.attackFrom(g.partner,1,true),true);const bullet=g.projectiles[0];assert.equal(bullet.kind,'gun');assert.equal(bullet.damage,26*.43);assert.equal(e.hp,e.maxHp);
});
