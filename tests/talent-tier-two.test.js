import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,unlockTalent,talentStatus,characterStats} from '../src/progression.js';
import {FIRST_TIER_NODES,SECOND_TIER_NODES,TALENT_NODES,ultimateBonuses} from '../src/talents.js';
import {ultimateFor,ULTIMATES} from '../src/abilities.js';
import {createSanctuary,updateSanctuary} from '../src/ultimate-effects.js';

const first=FIRST_TIER_NODES.map(n=>n.id),all=TALENT_NODES.map(n=>n.id);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const profile=(id='nyanluna',tree=first,level=50)=>normalizeProgression({story:{version:2,actClears:Array(28).fill(true)},characters:{[id]:{level,breaks:3,tree}},inventory:{starBud:10000,moonDew:1000,wardenCore:100,moonPrism:1000,astralCore:100,limitStone:3}},HEROES);
const quiet=(heroId='nyanluna',tree=all)=>{
  const hero=HEROES.findIndex(h=>h.id===heroId),partner=heroId==='nyanluna'?'tsukineko':'nyanluna';
  const g=new Adventure({hero,progression:profile(heroId,tree),party:[heroId,partner],seed:47});
  g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=999;g.drainEvents();return g;
};
const target=(g,x=0,z=6)=>{const e=g.spawnEnemy('moss',x,z);Object.assign(e,{hp:100000,maxHp:100000,speed:0,attack:999,special:999});return e;};
const tick=(g,n,e,x=e?.x,z=e?.z)=>{for(let i=0;i<n;i++){if(e)Object.assign(e,{x,z,knockX:0,knockZ:0});g.tick(1/60);}};

test('tier two requires the whole first tier, level 30 and all three materials without partial spending',()=>{
  for(const [tree,level] of [[first.slice(0,-1),30],[first,29]]){
    const p=profile('nyanluna',tree,level),before=structuredClone(p);assert.equal(unlockTalent(p,'nyanluna','ascension'),false);assert.deepEqual(p,before);
  }
  const p=profile('nyanluna',first,30);p.inventory.astralCore=3;const before=structuredClone(p);
  assert.deepEqual(talentStatus(p,'nyanluna','ascension').missing,[{id:'astralCore',needed:4,owned:3}]);assert.equal(unlockTalent(p,'nyanluna','ascension'),false);assert.deepEqual(p,before);
  p.inventory.astralCore=4;assert.equal(unlockTalent(p,'nyanluna','ascension'),true);assert.equal(p.inventory.starBud,9840);assert.equal(p.inventory.moonPrism,988);assert.equal(p.inventory.astralCore,0);
});
test('eight advanced nodes cost 2760 buds, 216 rare dew and 66 rare cores per hero; repeat clicks and reload do not charge again',()=>{
  for(const hero of HEROES){
    const p=profile(hero.id),otherId=HEROES.find(h=>h.id!==hero.id).id,other=structuredClone(p.characters[otherId]);
    for(const node of SECOND_TIER_NODES){assert.equal(unlockTalent(p,hero.id,node.id),true);const paid=structuredClone(p);assert.equal(unlockTalent(p,hero.id,node.id),false);assert.deepEqual(p,paid);}
    assert.deepEqual(p.inventory,{bloodCrystal:0,demonHeart:0,starBud:7240,moonDew:1000,wardenCore:100,moonPrism:784,astralCore:34,limitStone:3,weaponTicket:0});assert.deepEqual(p.characters[otherId],other);assert.equal(p.characters[hero.id].tree.length,16);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
  }
});
test('level 35/40/50 gates and the final three branches stay mandatory even with abundant materials',()=>{
  const p=profile('nyanluna',[...first,'ascension'],34);const before=structuredClone(p);assert.equal(unlockTalent(p,'nyanluna','attack3'),false);assert.deepEqual(p,before);
  p.characters.nyanluna.level=35;assert.ok(unlockTalent(p,'nyanluna','attack3'));assert.equal(unlockTalent(p,'nyanluna','ultimatePower'),false);
  p.characters.nyanluna.level=40;assert.ok(unlockTalent(p,'nyanluna','ultimatePower'));assert.equal(unlockTalent(p,'nyanluna','transcendence'),false);
  for(const id of ['guard3','life3','ultimateCharge','ultimateArt'])assert.ok(unlockTalent(p,'nyanluna',id));
  p.characters.nyanluna.level=49;assert.equal(unlockTalent(p,'nyanluna','transcendence'),false);p.characters.nyanluna.level=50;assert.ok(unlockTalent(p,'nyanluna','transcendence'));
});
test('existing first-tier saves keep their stats, wallet and original ultimate; invalid advanced stars grant no effects',()=>{
  for(const h of HEROES){const p=profile(h.id),before=structuredClone(p),stats=characterStats(h,p.characters[h.id]);assert.deepEqual(normalizeProgression(p,HEROES),before);assert.deepEqual(characterStats(h,p.characters[h.id]),stats);const spec=ultimateFor(h.id,p.characters[h.id]);assert.equal(spec.baseDamage,ULTIMATES[h.id].baseDamage);assert.equal(spec.pulses??spec.shots,ULTIMATES[h.id].pulses??ULTIMATES[h.id].shots);}
  const forged=profile('nyanluna',['ultimatePower','ultimateArt','transcendence'],50);assert.deepEqual(forged.characters.nyanluna.tree,[]);assert.equal(ultimateBonuses(forged.characters.nyanluna,'nyanluna').ultimateDamage,0);
  const capped=normalizeProgression({characters:{nyanluna:{level:50,breaks:0,tree:all}}},HEROES);assert.equal(capped.characters.nyanluna.level,20);assert.deepEqual(capped.characters.nyanluna.tree,[...first,'blessing1','blessing2']);
});
test('the power star increases ultimate damage by 35% exactly once and does not boost ordinary skills or attacks',()=>{
  for(const h of HEROES){
    const tree=[...first,'ascension','attack3'],before=quiet(h.id,tree),after=quiet(h.id,[...tree,'ultimatePower']);
    near(before.skillDamage(h.id,20),after.skillDamage(h.id,20));assert.deepEqual(before.statsFor(before.player.hero),after.statsFor(after.player.hero));
    before.player.charge=after.player.charge=100;before.ultimate();after.ultimate();near(after.ultimateEffects[0].damage,before.ultimateEffects[0].damage*1.35);
  }
});
test('awakened Moon Sanctuary has five complete pulses, radius 10 and one 40-HP heal, including its final visual pulse',()=>{
  const g=quiet(),e=target(g,9.7,3);g.player.hp=100;g.player.charge=100;assert.ok(g.ultimate());const effect=g.ultimateEffects[0],damage=effect.damage;near(effect.radius,10);near(effect.duration,3.25);assert.equal(g.player.hp,140);near(damage,g.skillDamage('nyanluna',60)*1.6);
  const mesh=createSanctuary(effect);updateSanctuary(mesh,{...effect,remaining:effect.duration-1});near(mesh.getObjectByName('lunar-rune').rotation.z,.7);
  tick(g,210,e);near(100000-e.hp,damage*5);assert.equal(g.drainEvents().filter(e=>e.type==='ultimatePulse').length,5);assert.equal(g.ultimateEffects.length,0);assert.equal(g.player.hp,140);assert.equal(g.player.charge,0);
  mesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});
test('awakened Comet Barrage retains 12 shots, 4-target piercing and range 24 after swapping to an untrained hero',()=>{
  const g=quiet('tsukineko');g.player.hp=100;g.player.charge=100;g.ultimate();const shot=g.projectiles[0],damage=shot.damage;assert.equal(shot.pierce,4);near(shot.life,26/38);assert.equal(g.player.hp,100);g.switchHero();g.player.attack=g.partner.attack=999;
  tick(g,100);assert.equal(g.drainEvents().filter(e=>e.type==='ultimateShot'&&e.heroId==='tsukineko').length,12);assert.equal(g.ultimateEffects.length,0);assert.equal(g.chargeFor(0),0);assert.equal(g.chargeFor(1),0);assert.ok(g.projectiles.every(p=>p.heroId==='tsukineko'&&p.pierce===4&&p.damage===damage));
});
test('a strengthened rifle round hits four targets once and stops before a fifth',()=>{
  const g=quiet('tsukineko'),enemies=[5,7,9,11,13].map(z=>target(g,0,z));g.player.charge=100;g.ultimate();const damage=g.projectiles[0].damage;g.ultimateEffects=[];
  for(let i=0;i<30;i++){enemies.forEach((e,j)=>Object.assign(e,{x:0,z:5+j*2,knockX:0,knockZ:0}));g.tick(1/60);}
  for(const e of enemies.slice(0,4))near(100000-e.hp,damage);assert.equal(enemies[4].hp,100000);
});
test('awakened Emerald Vow delivers seven pulses, heals 40 once and grants 2.2 seconds of invulnerability',()=>{
  const g=quiet('omsolo'),e=target(g);g.player.hp=100;g.player.charge=100;g.ultimate();const damage=g.ultimateEffects[0].damage;near(g.player.invincible,2.2);assert.equal(g.player.hp,140);near(g.ultimateEffects[0].duration,1.54);
  tick(g,110,e);assert.equal(g.drainEvents().filter(e=>e.type==='saberPulse').length,7);near(100000-e.hp,damage*7);assert.equal(g.player.hp,140);assert.equal(g.player.charge,0);
});
test('charge growth applies to its owner once, stacks with focus and survives departure without leaking to a partner',()=>{
  const g=quiet(),e=target(g);g.skills.focus=1;g.hit(e,1,0,0,false,false,'nyanluna');g.hit(e,1,0,0,false,false,'tsukineko');near(g.chargeFor(0),.65*1.5*1.25*1.3);near(g.chargeFor(1),.65*1.3);
  const next=new Adventure({progression:JSON.parse(JSON.stringify(g.progression)),party:g.party});assert.deepEqual(next.skills,{});near(next.ultimateSpec().power,1.6);assert.equal(next.ultimateSpec().pulses,5);assert.equal(next.ultimateSpec(1).shots,8);
  next.player.charge=100;next.ultimate();next.pause();const before=structuredClone(next.ultimateEffects);tick(next,240);assert.deepEqual(next.ultimateEffects,before);
});
