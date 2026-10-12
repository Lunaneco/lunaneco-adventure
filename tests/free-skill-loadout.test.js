import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {SKILLS,hasFreeSkillLoadout,loadoutSkillChoices,equippedSkills,equipSkill,skillsForParty,defaultSkills} from '../src/blessings.js';
import {partyView} from '../src/party-ui.js';
import {blessingLoadoutView} from '../src/blessing-loadout-ui.js';
import {extraDifficultyView} from '../src/extra-stage-ui.js';
import {actFor} from '../src/acts.js';

const profile=(cleared=true,story={})=>normalizeProgression({story:{version:2,actClears:Array.from({length:50},(_,i)=>cleared||i<32),...story}},HEROES);
const choose=(g,id)=>{g.phase='upgrade';g.pendingBlessings=1;g.offers=[SKILLS.find(s=>s.id===id)];return g.chooseSkill(id);};
const gate=(g,area)=>{g.phase='playing';g.wave=area*2+2;g.area=area;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);return g.crossExit();};

test('an existing Hehe extra clear receives the banquet ring once when the save loads',()=>{
 const raw={story:{version:2,actClears:Array.from({length:50},(_,i)=>i<=27),extraClears:[false,false,false,false,false,true]},equipment:{owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}}};
 const loaded=normalizeProgression(raw,HEROES);
 assert.equal(loaded.equipment.owned.filter(id=>id==='banquet-gold-ring').length,1);
 assert.equal(loaded.equipment.loadout.nyanluna,'meadow-charm');
 assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(loaded)),HEROES).equipment,loaded.equipment);
 const uncleared=normalizeProgression({story:{version:2,actClears:Array.from({length:50},(_,i)=>i<=27)}},HEROES);
 assert.equal(uncleared.equipment.owned.includes('banquet-gold-ring'),false);
 const forged=normalizeProgression({story:{version:2,actClears:Array(20).fill(true),extraClears:[false,false,false,false,false,true]}},HEROES);
 assert.equal(forged.story.extraClears[5],false);
 assert.equal(forged.equipment.owned.includes('banquet-gold-ring'),false);
});
test('a cleared finale unlocks free skills; an old banquet clear and forged flags do not',()=>{
 const p=profile();assert.equal(p.story.finaleCleared,true);assert.equal(hasFreeSkillLoadout(p),true);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
 assert.equal(hasFreeSkillLoadout(profile(false)),false);
 assert.equal(hasFreeSkillLoadout(profile(false,{extraClears:[false,false,false,false,false,true],chapterSixCleared:true})),false);
 assert.equal(hasFreeSkillLoadout(profile(false,{freeSkills:true,finaleCleared:true})),false);
});
test('the finale grants free skills once, and the Hehe extra grants the banquet ring once',()=>{
 const banquet=new Adventure({act:33,party:['omsolo'],hero:2,progression:profile(false)});banquet.drainEvents();
 assert.equal(hasFreeSkillLoadout(banquet.progression),false);assert.ok(gate(banquet,2));assert.equal(banquet.phase,'victory');
 assert.equal(banquet.earnedUnique,'banquet-gold-ring');assert.equal(banquet.drainEvents().some(e=>e.type==='freeSkillsUnlocked'),false);
 const repeat=new Adventure({act:33,party:['omsolo'],hero:2,progression:banquet.progression});repeat.drainEvents();assert.ok(gate(repeat,2));assert.equal(repeat.earnedUnique,undefined);assert.equal(repeat.progression.equipment.owned.filter(id=>id==='banquet-gold-ring').length,1);
 const ready=profile(false);for(let id=0;id<49;id++)ready.story.actClears[id]=true;ready.story.kephiaPairs=[['nyanluna','tsukineko'],['omsolo','mochinyafe'],['shizuku','prim'],['hehereal','lumi']];
 const g=new Adventure({act:49,progression:ready,party:['lumi']});g.player.invincible=999;g.drainEvents();
 assert.equal(g.act,49);assert.equal(hasFreeSkillLoadout(g.progression),false);
 g.enemies.find(e=>e.type==='boss').hp=0;g.tick(1/60);
 for(let i=0;i<200&&!g.exitOpen&&g.phase==='playing';i++)g.tick(1/60);
 g.exitDelay=0;Object.assign(g.player,g.exitPoint);assert.equal(g.crossExit(),true);
 assert.equal(g.drainEvents().filter(e=>e.type==='freeSkillsUnlocked').length,1);assert.equal(hasFreeSkillLoadout(g.progression),true);
 const again=new Adventure({act:49,progression:g.progression,party:['lumi']});again.player.invincible=999;again.enemies.find(e=>e.type==='boss').hp=0;again.tick(1/60);
 for(let i=0;i<200&&!again.exitOpen&&again.phase==='playing';i++)again.tick(1/60);
 again.exitDelay=0;Object.assign(again.player,again.exitPoint);assert.equal(again.crossExit(),true);assert.equal(again.drainEvents().some(e=>e.type==='freeSkillsUnlocked'),false);
});
test('every recruited hero can add and remove every skill without a three-slot cap',()=>{
 for(const hero of HEROES){
   const p=profile(),characters=structuredClone(p.characters),wallet=structuredClone(p.inventory);
   assert.equal(loadoutSkillChoices(p,hero.id).length,SKILLS.length);
   for(const skill of SKILLS)if(!equippedSkills(p,hero.id).includes(skill.id))assert.ok(equipSkill(p,hero.id,0,skill.id));
   assert.equal(equippedSkills(p,hero.id).length,SKILLS.length);
   assert.ok(equipSkill(p,hero.id,0,SKILLS[0].id));assert.equal(equippedSkills(p,hero.id).includes(SKILLS[0].id),false);
   assert.deepEqual(p.characters,characters);assert.deepEqual(p.inventory,wallet);
   assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
 }
 const locked=profile(true,{actClears:Array(28).fill(true)});assert.equal(equipSkill(locked,'lumi',0,'nova'),false);assert.equal(equipSkill(locked,'omsolo',0,'lumiBrave'),false);assert.equal(equipSkill(profile(),'omsolo',0,'lumiBrave'),true);
});
test('invalid heroes, slot indices, duplicate and unknown skills remain guarded after unlocking',()=>{
 const p=profile(),before=structuredClone(p);
 for(const id of ['constructor','__proto__','missing']){assert.deepEqual(loadoutSkillChoices(p,id),[]);assert.equal(equipSkill(p,id,0,'nova'),false);}
 for(const slot of [-1,3,.5,NaN,'1'])assert.equal(equipSkill(p,'lumi',slot,'missing'),false);
 for(const id of ['constructor','__proto__','missing'])assert.equal(equipSkill(p,'lumi',0,id),false);
 assert.deepEqual(p,before);assert.ok(equipSkill(p,'lumi',0,'nova'));assert.ok(equippedSkills(p,'lumi').includes('nova'));
 assert.ok(equipSkill(p,'lumi',1,'nova'));assert.equal(equippedSkills(p,'lumi').includes('nova'),false);
 const restored=normalizeProgression({...p,blessingLoadouts:{lumi:['nova','nova','missing']}},HEROES);
 assert.deepEqual(equippedSkills(restored,'lumi'),['nova']);
 const empty=normalizeProgression({...profile(),blessingLoadouts:{...profile().blessingLoadouts,lumi:[]}},HEROES);
 assert.deepEqual(equippedSkills(empty,'lumi'),[]);assert.deepEqual(skillsForParty(['lumi'],empty),[]);
});
test('after the finale, common and pair skills enter combat only when placed in a slot',()=>{
 for(const a of HEROES)for(const b of [null,...HEROES.filter(h=>h.id!==a.id)]){
   const party=b?[a.id,b.id]:[a.id],p=profile();assert.ok(equipSkill(p,a.id,0,'bladeTempo'));assert.ok(equipSkill(p,a.id,1,'moonDropBond'));assert.ok(equipSkill(p,a.id,2,'ward'));
   const pool=skillsForParty(party,p),chosen=new Set([...equippedSkills(p,a.id),...(b?equippedSkills(p,b.id):[])]);
   assert.equal(new Set(pool.map(s=>s.id)).size,pool.length);
   for(const skill of SKILLS)assert.equal(pool.some(s=>s.id===skill.id),chosen.has(skill.id),skill.id);
   const view=partyView(party,HEROES.indexOf(a),HEROES,()=>1,p,'戻る',null,{skillHero:b?.id??a.id,skillSlot:2});
   assert.match(view,/id="party-skill-loadout"/);assert.equal((view.match(/data-party-skill-slot=/g)??[]).length,0);
   assert.equal((view.match(/data-party-equip-skill=/g)??[]).length,SKILLS.length);
   assert.match(view,/好きな数だけ候補にできます/);
 }
});
test('shared candidates snapshot on deployment, activate only when chosen and persist through gates',()=>{
 const p=profile();equipSkill(p,'lumi',0,'penetration');equipSkill(p,'lumi',1,'power');
 const g=new Adventure({progression:p,hero:7,party:['lumi']});assert.deepEqual(g.skills,{});assert.ok(g.skillPool.some(s=>s.id==='penetration'));assert.ok(g.skillPool.some(s=>s.id==='power'));
 assert.ok(choose(g,'penetration'));assert.equal(g.effectRank('haste'),1);assert.ok(choose(g,'power'));assert.equal(g.rank('power'),1);
 equipSkill(g.progression,'lumi',0,'nova');assert.ok(g.skillPool.some(s=>s.id==='penetration'));assert.ok(!g.skillPool.some(s=>s.id==='nova'));
 assert.ok(gate(g,0));assert.equal(g.rank('penetration'),1);
 const next=new Adventure({progression:g.progression,hero:7,party:['lumi']});assert.deepEqual(next.skills,{});assert.ok(next.skillPool.some(s=>s.id==='nova'));assert.ok(next.skillPool.some(s=>s.id==='penetration'));
});
test('pre-clear restrictions are unchanged and reward notice is exclusive to Hehe EX',()=>{
 const p=profile(false);assert.equal(equipSkill(p,'lumi',0,'bladeTempo'),false);assert.deepEqual(equippedSkills(p,'lumi'),defaultSkills('lumi'));
 assert.doesNotMatch(partyView(['lumi'],7,HEROES,()=>1,p),/party-free-skills|data-party-equip-skill/);
 assert.doesNotMatch(blessingLoadoutView(p,HEROES[7]),/free-skill-unlocked/);
 assert.match(extraDifficultyView(actFor(33)),/極宴の金環/);assert.doesNotMatch(extraDifficultyView(actFor(20)),/極宴の金環/);
});
