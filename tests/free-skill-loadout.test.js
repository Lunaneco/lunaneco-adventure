import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {SKILLS,hasFreeSkillLoadout,loadoutSkillChoices,equippedSkills,equipSkill,skillsForParty,defaultSkills} from '../src/blessings.js';
import {partyView} from '../src/party-ui.js';
import {blessingLoadoutView} from '../src/blessing-loadout-ui.js';
import {extraDifficultyView} from '../src/extra-stage-ui.js';
import {actFor} from '../src/acts.js';

const profile=(cleared=true,story={})=>normalizeProgression({story:{version:2,actClears:Array(32).fill(true),extraClears:[false,false,false,false,false,cleared],...story}},HEROES);
const choose=(g,id)=>{g.phase='upgrade';g.pendingBlessings=1;g.offers=[SKILLS.find(s=>s.id===id)];return g.chooseSkill(id);};
const gate=(g,area)=>{g.phase='playing';g.wave=area*2+2;g.area=area;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);return g.crossExit();};

test('valid old extreme-banquet clear records unlock retroactively; other or forged clears do not',()=>{
 const p=profile();assert.equal(hasFreeSkillLoadout(p),true);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
 assert.equal(hasFreeSkillLoadout(profile(false)),false);
 assert.equal(hasFreeSkillLoadout(profile(false,{extraClears:[true,true,true,false,false,false]})),false);
 assert.equal(hasFreeSkillLoadout(profile(true,{actClears:Array(27).fill(true),chapterSixCleared:true})),false);
 assert.equal(hasFreeSkillLoadout(profile(false,{freeSkills:true})),false);
});
test('the last gate alone grants the reward once and keeps clear tickets intact',()=>{
 const g=new Adventure({act:33,party:['omsolo'],hero:2,progression:profile(false)});g.drainEvents();
 assert.equal(hasFreeSkillLoadout(g.progression),false);assert.ok(gate(g,0));assert.ok(gate(g,1));
 assert.equal(hasFreeSkillLoadout(g.progression),false);assert.equal(g.drainEvents().some(e=>e.type==='freeSkillsUnlocked'),false);
 assert.ok(gate(g,2));assert.equal(g.phase,'victory');assert.equal(g.clearRewardTickets,10);
 assert.equal(g.drainEvents().filter(e=>e.type==='freeSkillsUnlocked').length,1);assert.equal(hasFreeSkillLoadout(g.progression),true);
 const again=new Adventure({act:33,party:['omsolo'],hero:2,progression:g.progression});again.drainEvents();assert.ok(gate(again,2));assert.equal(again.clearRewardTickets,2);assert.equal(again.drainEvents().some(e=>e.type==='freeSkillsUnlocked'),false);
 for(const act of [0,20,21,22,27,31]){const other=new Adventure({act,progression:profile(false)});other.drainEvents();assert.ok(gate(other,2));assert.equal(hasFreeSkillLoadout(other.progression),false);assert.equal(other.drainEvents().some(e=>e.type==='freeSkillsUnlocked'),false);}
 const lost=new Adventure({act:33,progression:profile(false)});Object.assign(lost,{phase:'defeat',wave:6,area:2,exitOpen:true,exitDelay:0,pendingBlessings:0});Object.assign(lost.player,lost.exitPoint);assert.equal(lost.crossExit(),false);assert.equal(hasFreeSkillLoadout(lost.progression),false);
});
test('every recruited hero can equip every skill in every slot without growth or wallet mutation',()=>{
 for(const hero of HEROES)for(const skill of SKILLS)for(let slot=0;slot<3;slot++){
   const p=profile(),characters=structuredClone(p.characters),wallet=structuredClone(p.inventory);
   assert.equal(loadoutSkillChoices(p,hero.id).length,SKILLS.length);
   if(equippedSkills(p,hero.id)[slot]!==skill.id)assert.ok(equipSkill(p,hero.id,slot,skill.id));
   assert.equal(equippedSkills(p,hero.id)[slot],skill.id);assert.equal(new Set(equippedSkills(p,hero.id)).size,3);
   assert.deepEqual(p.characters,characters);assert.deepEqual(p.inventory,wallet);
   assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
 }
 const p=profile(true,{actClears:Array(28).fill(true)});assert.equal(equipSkill(p,'lumi',0,'nova'),false);assert.equal(equipSkill(p,'omsolo',0,'lumiBrave'),true);
});
test('invalid heroes, slot indices, duplicate and unknown skills remain guarded after unlocking',()=>{
 const p=profile(),before=structuredClone(p);
 for(const id of ['constructor','__proto__','missing']){assert.deepEqual(loadoutSkillChoices(p,id),[]);assert.equal(equipSkill(p,id,0,'nova'),false);}
 for(const slot of [-1,3,.5,NaN,'1'])assert.equal(equipSkill(p,'lumi',slot,'nova'),false);
 for(const id of ['constructor','__proto__','missing'])assert.equal(equipSkill(p,'lumi',0,id),false);
 assert.deepEqual(p,before);assert.ok(equipSkill(p,'lumi',0,'nova'));assert.ok(equipSkill(p,'lumi',1,'nova'));
 assert.deepEqual(equippedSkills(p,'lumi'),['lumiReach','nova','lumiFocus']);
 const restored=normalizeProgression({...p,blessingLoadouts:{lumi:['nova','nova','missing']}},HEROES);
 assert.deepEqual(equippedSkills(restored,'lumi'),['nova','lumiPower','lumiReach']);
});
test('all solo/duo parties include chosen foreign skills and preserve automatic common/pair candidates',()=>{
 for(const a of HEROES)for(const b of [null,...HEROES.filter(h=>h.id!==a.id)]){
   const party=b?[a.id,b.id]:[a.id],p=profile();assert.ok(equipSkill(p,a.id,0,'bladeTempo'));assert.ok(equipSkill(p,a.id,1,'moonDropBond'));
   const pool=skillsForParty(party,p);assert.equal(new Set(pool.map(s=>s.id)).size,pool.length);
   for(const id of ['bladeTempo','moonDropBond','ward','vitality','leech','stride'])assert.ok(pool.some(s=>s.id===id));
   for(const pair of SKILLS.filter(s=>s.requires?.length===2&&s.requires.every(id=>party.includes(id))))assert.ok(pool.includes(pair));
   const view=partyView(party,HEROES.indexOf(a),HEROES,()=>1,p,'戻る',null,{skillHero:b?.id??a.id,skillSlot:2});
   assert.match(view,/id="party-skill-loadout"/);assert.equal((view.match(/data-party-skill-slot=/g)??[]).length,3);
   assert.equal((view.match(/data-party-equip-skill=/g)??[]).length,SKILLS.length);
   assert.match(view,/対象が出撃していないスキルは効果が出ない場合/);
 }
});
test('shared candidates snapshot on deployment, activate only when chosen and persist through gates',()=>{
 const p=profile();equipSkill(p,'lumi',0,'penetration');equipSkill(p,'lumi',1,'power');
 const g=new Adventure({progression:p,hero:7,party:['lumi']});assert.deepEqual(g.skills,{});assert.ok(g.skillPool.some(s=>s.id==='penetration'));assert.ok(g.skillPool.some(s=>s.id==='power'));
 assert.ok(choose(g,'penetration'));assert.equal(g.effectRank('haste'),1);assert.ok(choose(g,'power'));assert.equal(g.rank('power'),1);
 equipSkill(g.progression,'lumi',0,'nova');assert.ok(g.skillPool.some(s=>s.id==='penetration'));assert.ok(!g.skillPool.some(s=>s.id==='nova'));
 assert.ok(gate(g,0));assert.equal(g.rank('penetration'),1);
 const next=new Adventure({progression:g.progression,hero:7,party:['lumi']});assert.deepEqual(next.skills,{});assert.ok(next.skillPool.some(s=>s.id==='nova'));assert.equal(choose(next,'penetration'),false);
});
test('pre-clear restrictions are unchanged and reward notice is exclusive to Hehe EX',()=>{
 const p=profile(false);assert.equal(equipSkill(p,'lumi',0,'bladeTempo'),false);assert.deepEqual(equippedSkills(p,'lumi'),defaultSkills('lumi'));
 assert.doesNotMatch(partyView(['lumi'],7,HEROES,()=>1,p),/party-free-skills|data-party-equip-skill/);
 assert.doesNotMatch(blessingLoadoutView(p,HEROES[7]),/free-skill-unlocked/);
 assert.match(extraDifficultyView(actFor(33)),/全員のスキル・全3枠/);assert.doesNotMatch(extraDifficultyView(actFor(20)),/全員のスキル/);
});
