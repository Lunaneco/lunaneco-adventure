import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {WEAPONS} from '../src/equipment.js';
import {FIRST_TIER_NODES,TALENT_NODES} from '../src/talents.js';

function probe(hero,{level=1,rank=1,tree=[],distance=2.5}={}){
  const id=HEROES[hero].id,weapon=`${WEAPONS[id].id}-r${rank}`;
  const progression=normalizeProgression({story:{version:2,actClears:Array(12).fill(true)},characters:{[id]:{level,breaks:3,tree}},weapons:{version:2,owned:[weapon],loadout:{[id]:weapon}}},HEROES);
  const g=new Adventure({hero,party:[id],progression,seed:91});
  g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.rng=()=>1;
  Object.assign(g.player,{x:0,z:0,invincible:999});
  const enemy=g.spawnEnemy('moss',0,distance);
  Object.assign(enemy,{hp:1e6,maxHp:1e6,speed:0,attack:999,special:999});
  for(let i=0;i<12*60;i++){
    Object.assign(enemy,{x:0,z:distance,knockX:0,knockZ:0});g.tick(1/60);
  }
  return {g,damage:1e6-enemy.hp,charge:g.player.charge,stats:g.statsFor(hero)};
}

for(const [level,rank,tree] of [[1,1,[]],[20,2,FIRST_TIER_NODES],[30,3,FIRST_TIER_NODES],[50,4,TALENT_NODES]]){
  test(`Lv.${level} matched gear: ranged firepower, skill charge and close-combat risk retain distinct roles`,()=>{
    const [n,t,o]=HEROES.map((_,i)=>probe(i,{level,rank,tree:tree.map(node=>node.id)}));
    // Real attack cadence and projectile impact, with critical hits and kills excluded.
    assert.ok(t.damage/n.damage>1.35&&t.damage/n.damage<1.75,'ranged basic attacks retain a bounded advantage');
    assert.ok(o.damage/t.damage>1.1&&o.damage/t.damage<1.5,'melee pays back its shorter reach');
    assert.ok(n.charge>t.charge&&n.charge>o.charge,'Nyanluna actually charges faster over equal combat time');
    assert.ok(n.g.skillDamage('nyanluna',20)>t.g.skillDamage('tsukineko',20)*1.4);
    assert.ok(o.stats.maxHp>t.stats.maxHp&&t.stats.maxHp>n.stats.maxHp);
    assert.ok(o.stats.defense>t.stats.defense&&t.stats.defense>n.stats.defense);
    assert.ok(o.stats.attack>t.stats.attack&&t.stats.attack>n.stats.attack);
  });
}

test('melee power requires closing the distance; both ranged heroes still attack from six units away',()=>{
  const [n,t,o]=HEROES.map((_,i)=>probe(i,{distance:6}));
  assert.ok(n.damage>0&&t.damage>0);assert.equal(o.damage,0);assert.equal(o.charge,0);
});
