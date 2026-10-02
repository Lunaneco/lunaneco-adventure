import {RecruitedAdventure} from './recruited-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,STAGE_EXIT} from '../src/model.js';
import {normalizeProgression,characterStats,grantMaterials,talentStatus,unlockTalent} from '../src/progression.js';
import {TALENT_NODES,talentBonuses} from '../src/talents.js';
const profile=(level=15)=>normalizeProgression({characters:Object.fromEntries(HEROES.map(h=>[h.id,{level}])),inventory:{starBud:200,moonDew:20,wardenCore:2,limitStone:1}},HEROES);
const kill=(g,type='moss',id='nyanluna')=>{g.materialRng=()=>0;const e=g.spawnEnemy(type,10,10);g.hit(e,100000,0,0,false,false,id);return e;};

test('initial defense is character-specific and actually reduces incoming damage',()=>{
 for(const [hero,defense] of [[0,8],[1,14]]){const g=new RecruitedAdventure({hero});assert.equal(g.statsFor(hero).defense,defense);g.player.invincible=0;g.hurt(100,0,0);assert.ok(Math.abs(HEROES[hero].baseHp-g.player.hp-10000/(100+defense))<1e-8);}
});
test('legacy saves preserve level, XP, cap and stones while adding empty trees and materials',()=>{
 const p=normalizeProgression({characters:{nyanluna:{level:22,xp:15,breaks:1},future_hero:{level:7,xp:2,breaks:0}},inventory:{limitStone:3}},HEROES);
 assert.deepEqual(p.characters.nyanluna,{level:22,xp:15,breaks:1,tree:[]});assert.deepEqual(p.characters.future_hero,{level:7,xp:2,breaks:0,tree:[]});assert.deepEqual(p.inventory,{bloodCrystal:0,demonHeart:0,limitStone:3,weaponTicket:0,starBud:0,moonDew:0,wardenCore:0,moonPrism:0,astralCore:0});assert.deepEqual(normalizeProgression(p,HEROES),p);
});
test('materials, levels and parents gate unlocks without partially consuming resources',()=>{
 const p=profile(1),before=structuredClone(p.inventory);assert.equal(unlockTalent(p,'nyanluna','guard2'),false);assert.deepEqual(p.inventory,before);
 assert.equal(unlockTalent(p,'nyanluna','origin'),true);const paid=structuredClone(p.inventory);assert.equal(unlockTalent(p,'nyanluna','guard1'),false);assert.equal(talentStatus(p,'nyanluna','guard1').levelMet,false);assert.deepEqual(p.inventory,paid);
 p.characters.nyanluna.level=7;p.inventory.moonDew=1;unlockTalent(p,'nyanluna','guard1');const short=structuredClone(p);assert.equal(unlockTalent(p,'nyanluna','guard2'),false);assert.deepEqual(p,short);assert.equal(talentStatus(p,'nyanluna','guard2').missing[0].id,'moonDew');
});
test('materials are shared but each character owns independent nodes, with no duplicate charge',()=>{
 const p=profile(),before=p.inventory.starBud;assert.equal(unlockTalent(p,'nyanluna','origin'),true);assert.equal(unlockTalent(p,'nyanluna','origin'),false);assert.equal(p.inventory.starBud,before-4);assert.deepEqual(p.characters.tsukineko.tree,[]);
 assert.equal(unlockTalent(p,'tsukineko','origin'),true);assert.equal(p.inventory.starBud,before-8);assert.equal(p.inventory.limitStone,1);assert.deepEqual(p.characters.nyanluna.tree,['origin']);
});
test('each of the three paths grows independently and awakening needs all three',()=>{
 const p=profile();for(const id of ['origin','guard1','guard2'])assert.equal(unlockTalent(p,'nyanluna',id),true);
 assert.equal(talentStatus(p,'nyanluna','attack1').canUnlock,true);assert.deepEqual(talentStatus(p,'nyanluna','awakening').parents,['attack2','life2']);assert.equal(unlockTalent(p,'nyanluna','awakening'),false);
 for(const id of ['attack1','life1','attack2','life2','awakening'])assert.equal(unlockTalent(p,'nyanluna',id),true);assert.equal(p.characters.nyanluna.tree.length,8);assert.equal(p.inventory.wardenCore,1);assert.equal(p.inventory.moonDew,10);assert.equal(p.inventory.starBud,100);
});
test('different awakenings apply the advertised permanent bonuses without stacking twice',()=>{
 for(const hero of HEROES.filter(h=>h.id!=='mochinyafe')){const p=profile();for(const n of TALENT_NODES)unlockTalent(p,hero.id,n.id);const character=p.characters[hero.id],bonus=talentBonuses(character,hero.id),stats=characterStats(hero,character);
  assert.equal(bonus.hp,hero.id==='nyanluna'?96:hero.id==='tsukineko'?112:['shizuku','prim','hehereal','lumi'].includes(hero.id)?104:120);assert.equal(bonus.defense,hero.id==='nyanluna'?15:hero.id==='tsukineko'?19:['shizuku','prim','hehereal','lumi'].includes(hero.id)?17:21);assert.equal(Math.round(bonus.attack*100),hero.id==='nyanluna'?27:hero.id==='tsukineko'?23:hero.id==='shizuku'?25:25);
  assert.equal(stats.maxHp,hero.baseHp+14*6+bonus.hp);assert.equal(stats.defense,hero.baseDefense+14+bonus.defense);assert.ok(Math.abs(stats.attack-hero.damage*(1+14*.045)*(1+bonus.attack))<1e-8);
  const restored=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.deepEqual(characterStats(hero,restored.characters[hero.id]),stats);assert.equal(unlockTalent(restored,hero.id,'awakening'),false);
 }
});
test('enemy drops are separate from XP and crystals and are awarded only once',()=>{
 const g=new RecruitedAdventure();g.drainEvents();const e=kill(g);assert.equal(g.progressFor(0).xp,3);assert.equal(g.stageCrystals,0);assert.equal(g.orbs[0].value,1);assert.equal(g.progression.inventory.starBud,1);g.hit(e,9999,0,0);assert.equal(g.progression.inventory.starBud,1);
 kill(g,'golem','tsukineko');assert.equal(g.progression.inventory.starBud,3);kill(g,'boss');assert.equal(g.progression.inventory.starBud,6);assert.equal(g.progression.inventory.wardenCore,1);assert.deepEqual(g.earnedMaterials,{bloodCrystal:0,demonHeart:0,starBud:6,moonDew:0,wardenCore:1,moonPrism:0,astralCore:0});
});
test('a capped character still earns materials; death cannot grant late drops',()=>{
 const p=profile();p.characters.nyanluna.level=80;p.characters.nyanluna.breaks=6;const g=new RecruitedAdventure({progression:p,party:['nyanluna']});kill(g);assert.equal(g.progressFor(0).xp,0);assert.equal(g.earnedMaterials.starBud,1);
 const e=g.spawnEnemy('boss',0,5);g.player.invincible=0;g.hurt(99999,0,0);g.hit(e,99999,0,0);assert.equal(g.earnedMaterials.wardenCore,0);
});
test('each gate grants its dew once, including the final gate, and retains the tree',()=>{
 const p=profile();unlockTalent(p,'nyanluna','origin');const g=new RecruitedAdventure({progression:p});g.drainEvents();const before=g.progression.inventory.moonDew;
 for(const area of [0,1,2]){g.area=area;g.wave=(area+1)*2;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,{x:g.exitPoint.x,z:g.exitPoint.z});assert.equal(g.crossExit(),true);assert.equal(g.crossExit(),false);if(area<2)g.advanceStage();}
 assert.equal(g.phase,'victory');assert.equal(g.progression.inventory.moonDew,before+3);assert.equal(g.earnedMaterials.moonDew,3);assert.deepEqual(g.progressFor(0).tree,['origin']);assert.equal(g.player.maxHp,276);
});
test('tree attack, HP and defense affect combat and survive a new departure and character swaps',()=>{
 const p=profile();for(const id of ['origin','attack1','guard1'])unlockTalent(p,'tsukineko',id);const g=new RecruitedAdventure({hero:1,progression:p});g.rng=()=>.9;
 const stats=g.statsFor(1);const e=g.spawnEnemy('boss',0,5);g.attackFrom(g.player,1);g.player.attack=g.partner.attack=1000;g.tick(.05);assert.ok(Math.abs(e.maxHp-e.hp-stats.attack)<1e-8);assert.equal(g.player.maxHp,306);
 g.player.hp=g.player.maxHp/2;g.switchHero();assert.equal(g.player.hp/g.player.maxHp,1);g.player.switchCooldown=0;g.switchHero();assert.equal(g.player.hp,153);
 g.skills.ward=1;g.player.invincible=0;const hp=g.player.hp;g.hurt(100,0,0);assert.ok(Math.abs(hp-g.player.hp-100*.85*100/(100+stats.defense))<1e-8);const next=new RecruitedAdventure({hero:1,progression:g.progression});assert.deepEqual(next.skills,{});assert.deepEqual(next.statsFor(1),stats);
});
test('corrupt or incomplete trees and materials are sanitized without phantom bonuses',()=>{
 const p=normalizeProgression({characters:{nyanluna:{level:7,tree:['guard2','origin','origin','awakening','unknown','__proto__']},tsukineko:{level:1,tree:['origin','guard1']}},inventory:{starBud:-10,moonDew:'50',wardenCore:Infinity}},HEROES);
 assert.deepEqual(p.characters.nyanluna.tree,['origin']);assert.deepEqual(p.characters.tsukineko.tree,['origin']);assert.equal(p.inventory.starBud,0);assert.equal(p.inventory.moonDew,0);assert.equal(p.inventory.wardenCore,0);
 const before=structuredClone(p);assert.equal(unlockTalent(p,'nyanluna','bad'),false);assert.equal(unlockTalent(p,'__proto__','origin'),false);assert.deepEqual(p,before);
});
test('granting invalid or unknown material values cannot reduce the wallet or alter cap stones',()=>{
 const p=profile(),before=structuredClone(p.inventory);grantMaterials(p,{starBud:-1,moonDew:NaN,wardenCore:'5',limitStone:999,unknown:100});assert.deepEqual(p.inventory,before);grantMaterials(p,{starBud:2});assert.equal(p.inventory.starBud,before.starBud+2);
});
