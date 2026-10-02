import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,awardCharacterXp,breakthrough,xpRequired,ENEMY_REWARDS} from '../src/progression.js';
import {LEVEL_AWAKENING_COSTS} from '../src/level-rules.js';
const story={version:2,actClears:Array(32).fill(true)};
function game(party=['nyanluna','mochinyafe'],progression={story}){const g=new Adventure({party,progression,act:8,seed:42});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.attack=g.partner.attack=999;return g;}
function kill(g,id,type='moss'){const e=type==='goldenSlime'?g.spawnGoldenSlime():g.spawnEnemy(type,0,5);g.hit(e,1e9,0,0,false,false,id);return e;}
test('every enemy, including bosses and gold slime, credits killer 100% and partner 50% for every hero',()=>{
 for(const killer of HEROES.map(h=>h.id))for(const [type,reward] of Object.entries(ENEMY_REWARDS)){
  const other=HEROES.find(h=>h.id!==killer).id,g=game([other,killer]),e=kill(g,killer,type);
  assert.equal(g.earnedXp[killer],reward.xp,`${killer} ${type}`);assert.equal(g.earnedXp[other],reward.xp/2);
  const saved=structuredClone(g.progression);g.hit(e,1e9,0,0);assert.deepEqual(g.progression,saved);
  for(const h of HEROES.filter(h=>!g.party.includes(h.id)))assert.equal(g.earnedXp[h.id],0);
 }
});
test('half XP survives save/reload, exact level boundaries, banking at level cap and awakening',()=>{
 let p=normalizeProgression({story},HEROES);awardCharacterXp(p,'mochinyafe',1.5);p=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.equal(p.characters.mochinyafe.xp,1.5);
 awardCharacterXp(p,'mochinyafe',70.5);assert.equal(p.characters.mochinyafe.level,2);assert.equal(p.characters.mochinyafe.xp,0);
 Object.assign(p.characters.mochinyafe,{level:20,xp:xpRequired(20)-.5});awardCharacterXp(p,'mochinyafe',1);p=normalizeProgression(p,HEROES);assert.equal(p.characters.mochinyafe.xp,xpRequired(20)+.5);
 Object.assign(p.inventory,LEVEL_AWAKENING_COSTS[0]);assert.ok(breakthrough(p,'mochinyafe'));assert.equal(p.characters.mochinyafe.level,21);assert.equal(p.characters.mochinyafe.xp,.5);
 assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
});
test('fallen deployed partner receives 50% and can level up without reviving; max-level killer does not change the split',()=>{
 const g=game();g.healthFor(3).hp=0;g.progressFor(3).xp=xpRequired(1)-1;Object.assign(g.progressFor(0),{level:80,breaks:6});kill(g,'nyanluna');assert.equal(g.earnedXp.nyanluna,0);assert.equal(g.earnedXp.mochinyafe,1.5);assert.equal(g.progressFor(3).level,2);assert.equal(g.progressFor(3).xp,.5);assert.equal(g.healthFor(3).hp,0);
});
test('solo kills award 100% only; an undeployed damage owner cannot create XP for anyone',()=>{
 const g=game(['mochinyafe']);kill(g,'mochinyafe');assert.deepEqual(g.earnedXp,{nyanluna:0,tsukineko:0,omsolo:0,mochinyafe:3,shizuku:0,prim:0,hehereal:0,lumi:0});const before=structuredClone(g.earnedXp);kill(g,'nyanluna');assert.deepEqual(g.earnedXp,before);
});
test('in-flight support attack keeps its killer when the owner falls and control changes',()=>{
 const g=game(['nyanluna','tsukineko']);const e=g.spawnEnemy('moss',g.partner.x,g.partner.z+2);e.hp=1;e.speed=0;g.attackFrom(g.partner,1,true);g.healthFor(1).hp=0;
 for(let i=0;i<30;i++)g.tick(1/60);assert.equal(g.kills,1);assert.equal(g.earnedXp.tsukineko,3);assert.equal(g.earnedXp.nyanluna,1.5);assert.equal(g.healthFor(1).hp,0);
});
test('fractional XP input remains bounded and invalid values cannot corrupt saves',()=>{
 const p=normalizeProgression({story,characters:{nyanluna:{xp:NaN},mochinyafe:{level:20,xp:999999999}}},HEROES);assert.equal(p.characters.nyanluna.xp,0);assert.equal(p.characters.mochinyafe.xp,99999999);
 for(const bad of [NaN,Infinity,-1,'3'])assert.equal(awardCharacterXp(p,'nyanluna',bad).amount,0);
 assert.equal(awardCharacterXp(p,'mochinyafe',1.5).amount,0);assert.deepEqual(normalizeProgression(p,HEROES),p);
});
