import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES,SKILLS} from '../src/model.js';
const story={version:2,actClears:Array(28).fill(true)};
function quiet(party=['nyanluna','tsukineko'],hero=0){
 const g=new Adventure({seed:31,party,hero,progression:{story}});
 g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.enemies=[];g.player.attack=g.partner.attack=999;g.player.invincible=0;g.drainEvents();return g;
}
const down=g=>{g.player.invincible=0;g.hurt(99999,0,0);};
for(const party of [['nyanluna','tsukineko'],['nyanluna','omsolo'],['tsukineko','omsolo']]){
 test(`${party}: switching preserves separate damage and healing`,()=>{
  const g=quiet(party),first=g.player.hero,second=g.partnerHero;
  g.player.hp=51;g.switchHero();assert.equal(g.player.hero,second);assert.equal(g.player.hp,g.statsFor(second).maxHp);
  g.player.invincible=0;g.hurt(20,0,0);const secondHp=g.player.hp;assert.equal(g.healthFor(first).hp,51);
  g.player.switchCooldown=0;g.switchHero();assert.equal(g.player.hp,51);g.heal(12);assert.equal(g.player.hp,63);assert.equal(g.healthFor(second).hp,secondHp);
 });
 test(`${party}: knockout automatically bypasses switch cooldown, all down ends run`,()=>{
  const g=quiet(party),first=g.player.hero,second=g.partnerHero;g.healthFor(second).hp=37;g.player.switchCooldown=10;down(g);
  assert.equal(g.player.hero,second);assert.equal(g.player.hp,37);assert.equal(g.healthFor(first).hp,0);assert.equal(g.phase,'playing');assert.ok(g.player.invincible>=1);
  assert.equal(g.hurt(99999,0,0),false);g.player.switchCooldown=0;assert.equal(g.switchHero(),false);
  assert.equal(g.attackFrom(g.partner,first,true),false);assert.equal(g.attackFrom(g.player,first),false);
  down(g);assert.equal(g.phase,'defeat');const events=g.drainEvents();assert.equal(events.filter(e=>e.type==='heroDown').length,2);assert.equal(events.filter(e=>e.type==='switch'&&e.automatic).length,1);assert.equal(events.filter(e=>e.type==='defeat').length,1);
  assert.equal(g.hurt(1,0,0),false);const snap=g.snapshot();g.tick(.05);assert.deepEqual(g.snapshot(),snap);
 });
}
for(const cause of ['contact','bullet','circle','beam','charge'])test(`inactive ally is immune to ${cause}, controlled hero is vulnerable`,()=>{
 const g=quiet();Object.assign(g.player,{x:0,z:3});Object.assign(g.partner,{x:8,z:3});
 const place=(x,z)=>{
  g.enemies=[];g.projectiles=[];g.hazards=[];g.player.invincible=0;
  if(cause==='contact'||cause==='charge'){const e=g.spawnEnemy(cause==='charge'?'charger':'moss',x,z);e.attack=0;e.special=999;e.speed=0;if(cause==='charge')e.rush={angle:0,speed:0,remaining:1};}
  else if(cause==='bullet')g.projectiles=[{id:900,owner:'enemy',x,z,vx:0,vz:0,life:1,radius:.25,damage:20}];
  else g.hazards=[{id:901,x,z,radius:1,shape:cause==='beam'?'line':'circle',length:2,width:1,angle:0,timer:0,damage:20}];
 };
 const hp=structuredClone(g.heroHealth);place(8,3);g.tick(.01);assert.deepEqual(g.heroHealth,hp);assert.equal(g.runHits,0);
 place(g.player.x,g.player.z);g.tick(.01);assert.ok(g.player.hp<hp.nyanluna.hp);assert.equal(g.healthFor(1).hp,hp.tsukineko.hp);assert.equal(g.runHits,1);
});
for(const cause of ['contact','bullet','circle'])test(`automatic replacement survives simultaneous ${cause} attacks`,()=>{
 const g=quiet();g.player.hp=1;
 if(cause==='contact')for(let i=0;i<2;i++){const e=g.spawnEnemy('moss',0,3);e.attack=0;}
 if(cause==='bullet')for(let i=0;i<2;i++)g.projectiles.push({id:900+i,owner:'enemy',x:0,z:3,vx:0,vz:0,life:1,radius:.25,damage:99999});
 if(cause==='circle')for(let i=0;i<2;i++)g.hazards.push({id:900+i,x:0,z:3,radius:2,timer:0,damage:99999});
 g.tick(.01);assert.equal(g.player.hero,1);assert.equal(g.player.hp,210);assert.equal(g.phase,'playing');assert.equal(g.runHits,1);
});
test('downed characters stay down after stat refresh, vitality and wave healing; fresh departure restores them',()=>{
 const g=quiet();down(g);g.progressFor(0).level=2;g.refreshStats();assert.equal(g.healthFor(0).maxHp,186);assert.equal(g.healthFor(0).hp,0);
 g.phase='upgrade';g.pendingBlessings=1;g.offers=[SKILLS.find(s=>s.id==='vitality')];assert.equal(g.chooseSkill('vitality'),true);assert.equal(g.healthFor(0).hp,0);assert.equal(g.healthFor(0).maxHp,226);
 g.startWave();assert.equal(g.healthFor(0).hp,0);assert.equal(g.switchHero(),false);
 const fresh=new Adventure({progression:g.progression,party:g.party});for(const hero of fresh.partyHeroes)assert.equal(fresh.healthFor(hero).hp,fresh.statsFor(hero).maxHp);
});
test('knockout cancels owned ultimate and in-flight shots without cancelling surviving hero effects',()=>{
 const g=quiet();g.ultimateEffects=[{heroId:'nyanluna'},{heroId:'tsukineko'}];g.projectiles=[{heroId:'nyanluna',owner:'player',life:1},{heroId:'tsukineko',owner:'player',life:1}];const oldProjectiles=g.projectiles;down(g);
 assert.deepEqual(g.ultimateEffects,[{heroId:'tsukineko'}]);assert.equal(oldProjectiles[0].life,0);assert.equal(g.projectiles.length,1);assert.equal(g.projectiles[0].heroId,'tsukineko');
});
test('shots after a fatal enemy projectile cannot land from the downed hero in that same frame',()=>{
 const g=quiet(),e=g.spawnEnemy('boss',0,8);e.speed=0;e.attack=e.special=999;g.player.hp=1;
 g.projectiles=[{id:900,owner:'enemy',x:0,z:3,vx:0,vz:0,life:1,radius:.2,damage:10},{id:901,owner:'player',heroId:'nyanluna',kind:'gun',x:0,z:8,vx:0,vz:0,life:1,damage:99999,radius:.2,pierce:1,hitIds:[]}];
 g.tick(.01);assert.equal(e.hp,e.maxHp);assert.equal(g.kills,0);assert.equal(g.player.hero,1);
});
test('guest Tsukineko joins at full individual health including existing vitality',()=>{
 const g=new Adventure({act:3,progression:{story:{version:2,actClears:[true,true,true]}},party:['nyanluna']});g.skills.vitality=2;g.refreshStats();g.player.hp=55;g.wave=5;g.startWave();assert.equal(g.guestHeroId,'tsukineko');assert.equal(g.healthFor(1).hp,290);assert.equal(g.healthFor(0).hp,77);
});
for(const hero of HEROES)test(`${hero.id} solo defeat remains immediate`,()=>{const g=quiet([hero.id]);down(g);assert.equal(g.phase,'defeat');assert.equal(g.hasPartner,false);g.heal(50);assert.equal(g.player.hp,0);});
