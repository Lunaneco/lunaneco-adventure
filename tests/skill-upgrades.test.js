import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {SKILLS,skillUpgradeLabel} from '../src/blessings.js';
import {normalizeProgression} from '../src/progression.js';
import {TALENT_NODES} from '../src/talents.js';
import {ultimateFor,ULTIMATES} from '../src/abilities.js';
import {mochiCryHit} from '../src/mochi-combat.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function game(hero,skill,rank=1){
 const g=new Adventure({seed:41,hero,party:hero===3?['mochinyafe','nyanluna']:[HEROES[hero].id],progression:{story:{version:2,actClears:Array(20).fill(true)}}});
 g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=999;g.player.invincible=0;g.rng=()=>1;if(skill)g.skills[skill]=rank;return g;
}
function target(g,x=0,z=2,type='moss'){
 const e=g.spawnEnemy(type,x,z);Object.assign(e,{hp:10000,maxHp:10000,speed:0,attack:999,special:999});return e;
}
const upgrades=SKILLS.filter(s=>s.upgrades);
test('every tree blessing upgrades exactly one original of the same hero and retains at least its maximum rank',()=>{
 assert.equal(upgrades.length,21);assert.equal(new Set(upgrades.map(s=>s.upgrades)).size,21);
 for(const s of upgrades){const base=SKILLS.find(b=>b.id===s.upgrades);assert.ok(base&&!base.unlockNode);assert.deepEqual(base.requires,s.requires);assert.ok(s.max>=base.max);assert.ok(skillUpgradeLabel(s).includes(base.name));}
});
test('base and upgraded effects use the higher acquired rank without changing raw levels, in either acquisition order',()=>{
 for(const s of upgrades){const hero=HEROES.findIndex(h=>h.id===s.requires[0]),g=game(hero,s.upgrades,2);assert.equal(g.effectRank(s.upgrades),2);g.skills[s.id]=1;assert.equal(g.effectRank(s.upgrades),2);assert.equal(g.rank(s.id),1);g.skills[s.id]=3;assert.equal(g.effectRank(s.upgrades),3);assert.equal(g.rank(s.upgrades),2);delete g.skills[s.upgrades];assert.equal(g.effectRank(s.upgrades),3);}
});
for(const rank of [1,3]){
 test(`starburst upgrade retains actual kill explosions with higher damage and a larger radius at rank ${rank}`,()=>{
  const results=['nova','arcanePower'].map(skill=>{const g=game(0,skill,rank),victim=target(g),nearby=target(g,2,2),far=target(g,4,2);g.hit(victim,1e6,0,0);return {nearby:10000-nearby.hp,far:10000-far.hp,event:g.drainEvents().find(e=>e.type==='nova')};});
  assert.ok(results[0].nearby>0);assert.ok(results[1].nearby>results[0].nearby);assert.equal(results[0].far,0);assert.ok(results[1].far>0);assert.ok(results[1].event.radius>results[0].event.radius);
 });
 test(`orbit upgrade preserves every orbiting star and raises contact damage at rank ${rank}`,()=>{
  const results=['orbit','starlightHeal'].map(skill=>{const g=game(0,skill,rank);const targets=Array.from({length:rank},(_,i)=>{const a=(g.time+1/60)*2.3+i/rank*Math.PI*2;return target(g,g.player.x+Math.cos(a)*2.5,g.player.z+Math.sin(a)*2.5);});g.tick(1/60);return targets.map(e=>10000-e.hp);});
  for(let i=0;i<rank;i++){assert.ok(results[0][i]>0);assert.ok(results[1][i]>results[0][i]);}
 });
 test(`range upgrade retains targeting and crystal attraction at rank ${rank}`,()=>{
  const results=['reach','moonFrost'].map(skill=>{const g=game(0,skill,rank);target(g,0,g.player.z+g.attackProfile(0).range*(1+.18*rank));assert.ok(g.attackFrom(g.player,0));g.orbs=[{x:g.player.x+3.5+rank,z:g.player.z,age:0,value:1}];const before=g.orbs[0].x;g.tick(1/60);return {life:g.projectiles[0].life,attracted:g.orbs[0].x<before};});
  near(results[0].life,results[1].life);assert.ok(results.every(r=>r.attracted));
 });
 test(`rapid shot upgrade keeps attack speed and adds piercing at rank ${rank}`,()=>{
  const results=['haste','penetration'].map(skill=>{const g=game(1,skill,rank);target(g,0,5);g.player.attack=0;g.tick(1/60);return {interval:g.player.attack,pierce:g.projectiles[0].pierce};});
  near(results[0].interval,results[1].interval);assert.equal(results[1].pierce,results[0].pierce+rank);
 });
 test(`critical upgrade keeps critical chance and raises critical damage at rank ${rank}`,()=>{
  const shots=['crit','preciseAim'].map(skill=>{const g=game(1,skill,rank);target(g);g.rng=()=>.05+.15*rank-.001;g.attackFrom(g.player,1);return g.projectiles[0];});
  assert.ok(shots.every(s=>s.crit));assert.ok(shots[1].damage>shots[0].damage);
 });
 test(`charge upgrade keeps on-hit gain and increases kill gain without charging from ultimates at rank ${rank}`,()=>{
  const results=['focus','rapidCharge'].map(skill=>{const g=game(1,skill,rank),e=target(g);g.hit(e,1,0,0);const hit=g.player.charge;g.hit(e,1e6,0,0);const kill=g.player.charge;const next=target(g);g.hit(next,1e6,0,0,false,false,'tsukineko',false);near(g.player.charge,kill);return {hit,kill};});
  near(results[0].hit,results[1].hit);assert.ok(results[1].kill>results[0].kill);
 });
 test(`sword upgrade preserves slash damage and makes attacks faster at rank ${rank}`,()=>{
  const results=['saberPower','bladeTempo'].map(skill=>{const g=game(2,skill,rank),e=target(g,0,5);g.attackFrom(g.player,2);return {damage:10000-e.hp,interval:g.attackProfile(2).interval};});
  assert.ok(results[0].damage>0);near(results[0].damage,results[1].damage);assert.ok(results[1].interval<results[0].interval);
 });
 test(`prayer upgrade expands melee reach beyond the original and boosts healing at rank ${rank}`,()=>{
  const results=['saberReach','vowRecovery'].map(skill=>{const g=game(2,skill,rank),range=g.attackProfile(2).range+rank*.35+.075*rank;const e=target(g,0,g.player.z+range+.5);e.radius=.5;g.attackFrom(g.player,2);g.player.hp=50;g.heal(20);return {damage:10000-e.hp,hp:g.player.hp};});
  assert.equal(results[0].damage,0);assert.ok(results[1].damage>0);assert.ok(results[1].hp>results[0].hp);
 });
 test(`Mochi stop upgrade lengthens crowd control and weakens bosses at rank ${rank}`,()=>{
  const results=['mochiLull','mochiWeaken'].map(skill=>{const g=game(3,skill,rank),e=target(g),boss=target(g,0,6,'boss');mochiCryHit(g,e);mochiCryHit(g,boss);const weak=boss.mochiAttackDown;mochiCryHit(g,boss,{ultimate:true});assert.ok(boss.mochiAttackDown>weak);return {stop:e.mochiStopUntil,weak};});
  assert.ok(results[1].stop>results[0].stop);assert.ok(results[1].weak>results[0].weak);
 });
 test(`Mochi bravery keeps support range and pierce and strengthens main attacks at rank ${rank}`,()=>{
  const results=['mochiReach','mochiBrave'].map(skill=>{const g=game(3,skill,rank);target(g,0,5);g.attackFrom(g.player,3);const main=g.projectiles.pop().damage;g.switchHero();g.attackFrom(g.partner,3,true);return {main,bullet:g.projectiles[0]};});
  near(results[0].bullet.life,results[1].bullet.life);assert.equal(results[0].bullet.pierce,results[1].bullet.pierce);assert.ok(results[1].main>results[0].main);
 });
 test(`Mochi charge upgrade doubles healing and adds charge on actual support at rank ${rank}`,()=>{
  const results=['mochiMend','mochiCharge'].map(skill=>{const g=game(3,skill,rank);g.switchHero();g.player.hp=50;target(g,0,5);g.attackFrom(g.partner,3,true);return {heal:g.player.hp-50,charge:g.chargeFor(3)};});
  near(results[1].heal,results[0].heal*2);assert.equal(results[0].charge,0);assert.ok(results[1].charge>0);
 });
}
for(const rank of [1,2])test(`guard upgrade retains damage reduction and extends immunity at rank ${rank}`,()=>{
 const results=['saberGuard','counterGuard'].map(skill=>{const g=game(2,skill,rank),before=g.player.hp;g.hurt(50,0,0);return {damage:before-g.player.hp,invincible:g.player.invincible};});
 near(results[0].damage,results[1].damage);assert.ok(results[1].invincible>results[0].invincible);
});
test('all permanent ultimate-tree upgrades retain base mechanics and raise power, coverage, healing and immunity',()=>{
 const p=normalizeProgression({characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:50,breaks:3,tree:TALENT_NODES.map(n=>n.id)}]))},HEROES);
 for(const h of HEROES){const base=ULTIMATES[h.id],up=ultimateFor(h.id,p.characters[h.id]);assert.equal(up.kind,base.kind);assert.ok(up.baseDamage>base.baseDamage);assert.ok(up.chargeMultiplier>1);for(const key of ['immunity','shots','pierce','range','pulses','radius','heal','duration'])if(key in base)assert.ok(up[key]>=base[key],`${h.id} ${key}`);}
});
