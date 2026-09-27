import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,unlockTalent,talentStatus,characterStats} from '../src/progression.js';
import {SKILLS,personalSkills,equippedSkills,equipSkill,skillsForParty,defaultSkills} from '../src/blessings.js';
import {FIRST_TIER_NODES,SKILL_TALENT_NODES,talentNode} from '../src/talents.js';
import {enemySpeedScale} from '../src/ultimate-combat.js';
import {talentView} from '../src/talent-ui.js';
import {partyView} from '../src/party-ui.js';
import {botInput} from './bot.js';
const story={version:2,actClears:Array(20).fill(true)},first=FIRST_TIER_NODES.map(n=>n.id),tree=[...first,'ascension',...SKILL_TALENT_NODES.map(n=>n.id)];
const profile=(options={})=>normalizeProgression({story,characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:35,breaks:2,tree}])),inventory:{starBud:1000,moonDew:100,wardenCore:10,moonPrism:100,astralCore:10},...options},HEROES);
const ids=pool=>pool.map(s=>s.id).sort();
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function prepared(hero='nyanluna',party=[hero]){
 const progression=profile();for(const id of party)personalSkills(id).filter(s=>s.unlockNode).forEach((s,i)=>assert.ok(equipSkill(progression,id,i,s.id)));
 const g=new Adventure({progression,party,hero:HEROES.findIndex(h=>h.id===hero),seed:42});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=999;g.rng=()=>1;g.drainEvents();return g;
}
function choose(g,id){g.phase='upgrade';g.pendingBlessings=1;g.offers=[SKILLS.find(s=>s.id===id)];assert.ok(g.chooseSkill(id));}
function target(g,z=6,type='moss'){const e=g.spawnEnemy(type,0,z);Object.assign(e,{hp:100000,maxHp:100000,speed:0,attack:999,special:999});return e;}
function ticks(g,n,targets=[]){for(let i=0;i<n;i++){for(const [e,z] of targets)Object.assign(e,{x:0,z,knockX:0,knockZ:0});g.tick(1/60);}}

test('old saves preserve every earned value and retain original candidates without unlocking new skills',()=>{
 const raw=profile({characters:{nyanluna:{level:20,xp:72,tree:first},tsukineko:{level:15,xp:19}},blessingLoadouts:undefined});
 const {blessingLoadouts,...legacy}=raw,restored=normalizeProgression(legacy,HEROES);
 assert.deepEqual(restored,raw);assert.deepEqual(restored.blessingLoadouts,{nyanluna:['nova','orbit','reach'],tsukineko:['haste','focus','crit'],omsolo:['saberPower','saberReach','saberGuard'],mochinyafe:['mochiLull','mochiReach','mochiMend'],shizuku:['shizukuPower','shizukuDrain','shizukuReach'],prim:['primPower','primReach','primFocus']});
 assert.equal(skillsForParty(['nyanluna'],restored).length,7);assert.equal(skillsForParty(['nyanluna','tsukineko'],restored).length,12);
});
test('invalid, locked, duplicate, foreign and pair candidates are repaired to three owned personal slots',()=>{
 for(const raw of [null,{},true,'arcanePower',['power','ward','crit','moonFrost','__proto__'],['orbit','orbit','reach','nova']]){
  const p=profile({characters:{nyanluna:{level:4}},blessingLoadouts:{nyanluna:raw}}),slots=equippedSkills(p,'nyanluna');
  assert.equal(slots.length,3);assert.equal(new Set(slots).size,3);assert.deepEqual([...slots].sort(),['nova','orbit','reach']);
 }
 assert.deepEqual(defaultSkills('__proto__'),[]);assert.deepEqual(defaultSkills('constructor'),[]);const p=profile();assert.equal(equipSkill(p,'constructor',0,'arcanePower'),false);
 const forged=profile({characters:{nyanluna:{level:35,breaks:2,tree:['blessing1','blessing2','blessing3']}},blessingLoadouts:{nyanluna:['arcanePower','starlightHeal','moonFrost']}});
 assert.deepEqual(forged.characters.nyanluna.tree,[]);assert.deepEqual(equippedSkills(forged,'nyanluna'),defaultSkills('nyanluna'));
});
test('all twelve skills unlock per hero at increasing levels and rarity costs, with no automatic equip or stat bonus',()=>{
 for(const h of HEROES){
  const p=profile({characters:{[h.id]:{level:35,breaks:2,tree:[...first,'ascension']}}}),stats=characterStats(h,p.characters[h.id]),other=structuredClone(p.characters[HEROES.find(o=>o.id!==h.id).id]);
  for(const node of SKILL_TALENT_NODES){assert.equal(unlockTalent(p,h.id,node.id),true);const paid=structuredClone(p);assert.equal(unlockTalent(p,h.id,node.id),false);assert.deepEqual(p,paid);assert.ok(talentNode(node.id,h.id).skill.requires.includes(h.id));}
  assert.deepEqual(p.inventory,{bloodCrystal:0,demonHeart:0,starBud:710,moonDew:89,wardenCore:8,moonPrism:88,astralCore:6,weaponTicket:0,limitStone:0});assert.deepEqual(characterStats(h,p.characters[h.id]),stats);assert.deepEqual(equippedSkills(p,h.id),defaultSkills(h.id));assert.deepEqual(p.characters[HEROES.find(o=>o.id!==h.id).id],other);
 }
 for(const [level,node,prior] of [[4,'blessing1',['origin']],[14,'blessing2',['origin','blessing1']],[34,'blessing3',tree.slice(0,-1)]]){
  const p=profile({characters:{nyanluna:{level,breaks:2,tree:prior}}}),before=structuredClone(p);assert.equal(unlockTalent(p,'nyanluna',node),false);assert.deepEqual(p,before);
 }
 const ready=profile({characters:{nyanluna:{level:35,breaks:2,tree:['origin','blessing1','blessing2']}}});assert.equal(talentStatus(ready,'nyanluna','blessing3').parents.length,0);assert.equal(unlockTalent(ready,'nyanluna','blessing3'),true);assert.ok(ready.characters.nyanluna.tree.includes('blessing3'));assert.equal(equipSkill(ready,'nyanluna',2,'moonFrost'),true);
 const p=profile({characters:{nyanluna:{level:35,breaks:2,tree:tree.slice(0,-1)}}});p.inventory.astralCore=3;const before=structuredClone(p);assert.equal(unlockTalent(p,'nyanluna','blessing3'),false);assert.deepEqual(p,before);assert.deepEqual(talentStatus(p,'nyanluna','blessing3').missing,[{id:'astralCore',needed:4,owned:3}]);
});
test('free swapping keeps three distinct slots, saves the chosen order and rejects unavailable heroes or slots',()=>{
 const p=profile(),wallet=structuredClone(p.inventory);assert.ok(equipSkill(p,'nyanluna',0,'arcanePower'));assert.ok(equipSkill(p,'nyanluna',1,'arcanePower'));assert.deepEqual(equippedSkills(p,'nyanluna'),['orbit','arcanePower','reach']);
 assert.deepEqual(p.inventory,wallet);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
 const before=structuredClone(p);for(const slot of [-1,3,NaN,.5,'1'])assert.equal(equipSkill(p,'nyanluna',slot,'nova'),false);for(const skill of ['power','crit','ward','unknown'])assert.equal(equipSkill(p,'nyanluna',0,skill),false);assert.deepEqual(p,before);
 const fresh=profile({story:{version:2}}),copy=structuredClone(fresh);assert.equal(equipSkill(fresh,'tsukineko',0,'penetration'),false);assert.equal(equipSkill(fresh,'omsolo',0,'bladeTempo'),false);assert.deepEqual(fresh,copy);
});
test('every pair keeps exactly its original combination skills alongside common skills and equipped slots',()=>{
 for(const [party,pairs] of [[['nyanluna','tsukineko'],['echo','power']],[['nyanluna','omsolo'],['moonGuard']],[['tsukineko','omsolo'],['starBlade']]]){
  const p=profile();for(const h of HEROES)personalSkills(h.id).filter(s=>s.unlockNode).forEach((s,i)=>equipSkill(p,h.id,i,s.id));
  const pool=skillsForParty(party,p);assert.equal(pool.length,10+pairs.length);assert.deepEqual(ids(pool.filter(s=>s.requires?.length===2)),pairs);assert.deepEqual(ids(pool.filter(s=>!s.requires)),['leech','stride','vitality','ward']);
  assert.equal(pool.filter(s=>s.requires?.length===1).length,6);assert.ok(pool.filter(s=>s.requires?.length===1).every(s=>s.unlockNode));assert.deepEqual(ids(skillsForParty([...party].reverse(),p)),ids(pool));
  for(let seed=1;seed<=30;seed++){const g=new Adventure({progression:p,party,seed});g.addCrystals(8);g.tick(1/60);assert.equal(g.offers.length,3);assert.equal(new Set(ids(g.offers)).size,3);assert.ok(g.offers.some(s=>pairs.includes(s.id)));assert.ok(g.offers.every(s=>pool.some(p=>p.id===s.id)));}
 }
});
test('deployment snapshots candidates; picked ranks survive gates and swapping, then reset on next deployment',()=>{
 const g=prepared('nyanluna',['nyanluna','tsukineko']);choose(g,'arcanePower');choose(g,'starlightHeal');const before={...g.skills},pool=ids(g.skillPool);g.switchHero();
 equipSkill(g.progression,'nyanluna',0,'nova');assert.deepEqual(ids(g.skillPool),pool);assert.equal(g.rank('arcanePower'),1);
 for(const wave of [2,4]){g.wave=wave;g.area=wave/2-1;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);assert.ok(g.crossExit());assert.ok(g.advanceStage());assert.deepEqual(g.skills,before);assert.deepEqual(ids(g.skillPool),pool);}
 const next=new Adventure({progression:JSON.parse(JSON.stringify(g.progression)),party:g.party});assert.deepEqual(next.skills,{});assert.ok(next.skillPool.some(s=>s.id==='nova'));assert.ok(!next.skillPool.some(s=>s.id==='arcanePower'));
});
test('the reunion keeps selected Nyanluna skills and their active ranks while adding Tsukineko and fixed pair skills',()=>{
 const p=profile({story:{version:2,actClears:[true,true,true]}});equipSkill(p,'nyanluna',0,'arcanePower');const g=new Adventure({progression:p,party:['nyanluna'],act:3});choose(g,'arcanePower');g.wave=6;assert.ok(g.meetTsukineko());assert.equal(g.rank('arcanePower'),1);assert.ok(g.skillPool.some(s=>s.id==='arcanePower'));assert.ok(!g.skillPool.some(s=>s.id==='nova'));assert.deepEqual(ids(g.skillPool.filter(s=>s.requires?.length===2)),['echo','power']);assert.equal(g.meetTsukineko(),false);
});
test('unequipped skills cannot be selected through stale offers, and max ranks remain enforced',()=>{
 const g=prepared();g.offers=[SKILLS.find(s=>s.id==='nova')];g.phase='upgrade';g.pendingBlessings=1;assert.equal(g.chooseSkill('nova'),false);
 for(let i=0;i<3;i++)choose(g,'arcanePower');g.phase='upgrade';g.offers=[SKILLS.find(s=>s.id==='arcanePower')];assert.equal(g.chooseSkill('arcanePower'),false);assert.equal(g.rank('arcanePower'),3);
});
test('Nyanluna remains best at skill damage; arcane power multiplies skills once and leaves basic attacks alone',()=>{
 const g=prepared('nyanluna',['nyanluna','omsolo']),n=g.skillDamage('nyanluna',20),o=g.skillDamage('omsolo',20),stats=g.statsFor(0);assert.ok(n>o*1.3);
 const e=target(g);g.attackFrom(g.player,0);const basic=g.projectiles[0].damage;g.projectiles=[];choose(g,'arcanePower');near(g.skillDamage('nyanluna',20),n*1.18);near(g.skillDamage('omsolo',20),o*1.18);g.attackFrom(g.player,0);near(g.projectiles[0].damage,basic);assert.deepEqual(g.statsFor(0),stats);
 g.player.charge=100;g.ultimate();near(g.ultimateEffects[0].damage,g.skillDamage('nyanluna',g.ultimateSpec().baseDamage));ticks(g,210,[[e,6]]);assert.ok(e.hp<100000);
});
test('star blessing heals once per chosen offer, benefits Nyanluna most, and does not revive the fallen partner',()=>{
 const g=prepared('nyanluna',['nyanluna','tsukineko']);g.player.hp=50;choose(g,'starlightHeal');near(g.player.hp,77);assert.equal(g.chooseSkill('starlightHeal'),false);near(g.player.hp,77);choose(g,'arcanePower');near(g.player.hp,104);
 g.switchHero();g.player.hp=50;choose(g,'penetration');near(g.player.hp,68);g.healthFor(0).hp=0;choose(g,'preciseAim');near(g.player.hp,86);assert.equal(g.healthFor(0).hp,0);
});
test('moon frost slows on a real magic impact, halves control on bosses, expires and never multiplies sanctuary slowing',()=>{
 for(const type of ['moss','boss']){const g=prepared(),e=target(g,6,type);choose(g,'moonFrost');assert.equal(enemySpeedScale(g,e),1);g.attackFrom(g.player,0);ticks(g,20,[[e,6]]);assert.ok(e.hp<100000);near(enemySpeedScale(g,e),type==='boss'?.825:.65);assert.ok(e.frostUntil>g.time);
  g.ultimateEffects=[{kind:'sanctuary',x:e.x,z:e.z,radius:8,spec:{slow:.25,bossSlow:.8}}];near(enemySpeedScale(g,e),type==='boss'?.8:.25);g.ultimateEffects=[];g.time=e.frostUntil;assert.equal(enemySpeedScale(g,e),1);
 }
});
test('penetration hits one extra target with a normal gun round, without changing ultimate rounds or other heroes',()=>{
 const g=prepared('tsukineko',['tsukineko','nyanluna']),base=g.attackProfile(1),other=g.attackProfile(0);choose(g,'penetration');assert.equal(g.attackProfile(1).pierce,base.pierce+1);assert.deepEqual(g.attackProfile(0),other);
 const targets=[5,7,9,11].map(z=>[target(g,z),z]);g.attackFrom(g.player,1);const bullet=g.projectiles[0];ticks(g,25,targets);assert.equal(bullet.hitIds.length,base.pierce+1);assert.ok(targets[0][0].hp<100000);assert.ok(targets[1][0].hp<100000);assert.ok(targets[2][0].hp<100000);assert.equal(targets[3][0].hp,100000);
 g.player.charge=100;g.ultimate();assert.equal(g.projectiles.at(-1).pierce,g.ultimateSpec().pierce);
});
test('aim raises only normal critical damage and reload charge cannot feed itself from an ultimate kill',()=>{
 const g=prepared('tsukineko');target(g);g.rng=()=>0;g.attackFrom(g.player,1);const before=g.projectiles[0].damage;g.projectiles=[];choose(g,'preciseAim');g.attackFrom(g.player,1);near(g.projectiles[0].damage,before*2.25/2);
 choose(g,'rapidCharge');const e=g.spawnEnemy('moss',10,10);g.player.charge=0;g.hit(e,999999,0,0,false,false,'tsukineko');near(g.player.charge,(.65+6)*HEROES[1].chargeRate*1.3);
 const after=g.player.charge;g.hit(g.spawnEnemy('moss',10,10),999999,0,0,true,false,'tsukineko',false);near(g.player.charge,after);
});
test('blade tempo is Omsolo only; counter guard inherits damage reduction and extends immunity without changing dash',()=>{
 const g=prepared('omsolo',['omsolo','nyanluna']),interval=g.attackProfile(2).interval,other=g.attackProfile(0);choose(g,'bladeTempo');near(g.attackProfile(2).interval,interval*.9);assert.deepEqual(g.attackProfile(0),other);choose(g,'counterGuard');g.player.invincible=0;const before=g.player.hp;g.hurt(20,0,0);near(g.player.hp,before-20*.85*100/(100+g.statsFor(2).defense));near(g.player.invincible,1);g.dash(1,0);near(g.player.invincible,.5);near(g.player.dashSpeed,48);
});
test('recovery amplifies heal effects once, clamps to maximum HP and never resurrects a dead hero',()=>{
 const g=prepared('omsolo');choose(g,'vowRecovery');g.player.hp=50;g.heal(20);near(g.player.hp,73);g.player.charge=100;g.ultimate();near(g.player.hp,73+g.ultimateSpec().heal*1.15);g.heal(99999);near(g.player.hp,g.player.maxHp);g.player.hp=0;g.heal(100);assert.equal(g.player.hp,0);
});
test('tree and party UI distinguish unlocks from active effects and list only equipped personal candidates',()=>{
 const p=profile();equipSkill(p,'nyanluna',0,'arcanePower');const view=talentView(p,'nyanluna','blessing1'),party=partyView(['nyanluna','tsukineko'],0,HEROES,()=>35,p);
 assert.match(view,/data-tree-tier="3"/);assert.match(view,/にゃんるなはスキルが最も得意/);assert.equal((view.match(/data-blessing-slot=/g)??[]).length,3);assert.match(view,/効果が発動するのは戦闘中に祝福を選んでから/);assert.match(party,/data-party-blessing="arcanePower"/);assert.doesNotMatch(party,/data-party-blessing="nova"/);for(const id of ['power','echo'])assert.match(party,new RegExp(`data-party-blessing="${id}"`));
 const locked=talentView(profile({characters:{nyanluna:{level:1}}}),'nyanluna','blessing1');assert.doesNotMatch(locked,/data-equip-blessing="arcanePower"/);assert.match(locked,/Lv.5で解放可能/);
});
for(const party of [['nyanluna'],['tsukineko','omsolo'],['nyanluna','omsolo']])for(const difficulty of ['normal','hard'])test(`new candidate sets complete all six waves in chapter two: ${party.join('+')}, ${difficulty}`,()=>{
 const p=prepared(party[0],party).progression;
 const g=new Adventure({progression:p,party,hero:HEROES.findIndex(h=>h.id===party[0]),act:4,difficulty,seed:42});
 for(let i=0;i<60*500;i++){while(g.phase==='upgrade')g.chooseSkill(g.offers.find(s=>s.unlockNode)?.id??g.offers[0].id);if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;g.tick(1/60,botInput(g));g.drainEvents();}
 assert.equal(g.phase,'victory');assert.equal(g.wave,6);assert.ok(g.blessingsTaken>0);assert.ok(Object.keys(g.skills).some(id=>SKILLS.find(s=>s.id===id)?.unlockNode));
});
