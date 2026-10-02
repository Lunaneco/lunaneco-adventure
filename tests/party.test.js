import {RecruitedAdventure} from './recruited-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,STAGE_EXIT} from '../src/model.js';
import {normalizeParty,changeParty,PARTY_LIMIT} from '../src/party.js';
import {skillsForParty} from '../src/blessings.js';
import {botInput,chooseOffer} from './bot.js';
const ids=pool=>pool.map(skill=>skill.id).sort();
const both=HEROES.slice(0,2).map(hero=>hero.id);
test('deployment accepts one or two distinct roster members and repairs invalid saved parties',()=>{
  assert.equal(HEROES.length,7);assert.equal(PARTY_LIMIT,2);
  for(const raw of [null,[],['unknown'],{},['__proto__']])assert.deepEqual(normalizeParty(raw,HEROES),both);
  assert.deepEqual(normalizeParty(['tsukineko','tsukineko','unknown'],HEROES),['tsukineko']);
  const roster=[...HEROES,{id:'test-only-third'}];assert.deepEqual(normalizeParty([...both,'test-only-third'],roster),both);
  assert.deepEqual(changeParty(both,'test-only-third',roster),both);
  assert.deepEqual(changeParty(['nyanluna'],'nyanluna',HEROES),['nyanluna']);
  assert.deepEqual(changeParty(['nyanluna'],'tsukineko',HEROES),both);
});
test('solo pools differ; only the duo unlocks its two combination blessings',()=>{
  const mage=skillsForParty(['nyanluna']),sword=skillsForParty(['tsukineko']),duo=skillsForParty(both);
  assert.equal(mage.length,7);assert.equal(sword.length,7);assert.equal(duo.length,12);
  assert.deepEqual(ids(mage.filter(s=>!s.requires)),['leech','stride','vitality','ward']);
  assert.deepEqual(ids(mage.filter(s=>s.requires)),['nova','orbit','reach']);
  assert.deepEqual(ids(sword.filter(s=>s.requires)),['crit','focus','haste']);
  assert.deepEqual(ids(duo.filter(s=>s.requires?.length===2)),['echo','power']);
  assert.deepEqual(ids(skillsForParty([...both].reverse())),ids(duo));
});
test('all three party compositions roll three unique eligible blessings and exclude capped ranks',()=>{
  for(const party of [['nyanluna'],['tsukineko'],both])for(let seed=1;seed<=100;seed++){
    const game=new RecruitedAdventure({party,seed});game.skills.vitality=3;game.addCrystals(8);game.tick(1/60);
    assert.equal(game.offers.length,3);assert.equal(new Set(game.offers.map(s=>s.id)).size,3);
    assert.ok(game.offers.some(s=>s.requires?.length===(party.length===2?2:1)));
    for(const skill of game.offers){assert.ok(game.skillPool.includes(skill));assert.notEqual(skill.id,'vitality');}
    const selected=game.offers[0].id;assert.equal(game.chooseSkill(selected),true);assert.equal(game.chooseSkill(selected),false);
  }
});
test('solo attacks and XP belong only to the deployed hero; support and swapping are unavailable',()=>{
  for(const [hero,party] of [[0,['nyanluna']],[1,['tsukineko']]]){
    const game=new RecruitedAdventure({party,seed:8});assert.equal(game.player.hero,hero);assert.equal(game.partnerHero,null);assert.equal(game.switchHero(),false);
    game.waveSpawned=game.waveGoal;game.waveBreak=-100;game.spawnEnemy('moss',0,5);game.drainEvents();
    assert.equal(game.attackFrom(game.partner,1-hero,true),false);assert.equal(game.attackFrom(game.partner,hero,true),false);
    for(let i=0;i<120;i++)game.tick(1/60);
    assert.ok(game.kills>=1);assert.ok(game.earnedXp[party[0]]>0);assert.equal(game.earnedXp[HEROES[1-hero].id],0);
    const attacks=game.drainEvents().filter(e=>e.type==='attack');assert.ok(attacks.length);assert.ok(attacks.every(e=>e.hero===hero&&!e.support));
  }
});
test('party membership is copied at deployment and lead swaps do not change the blessing pool',()=>{
  const party=[...both],game=new RecruitedAdventure({party,hero:1});party.pop();assert.deepEqual(game.party,both);
  const pool=ids(game.skillPool);assert.equal(game.switchHero(),true);assert.equal(game.player.hero,0);assert.equal(game.partnerHero,1);assert.deepEqual(ids(game.skillPool),pool);
  const solo=new RecruitedAdventure({party:['tsukineko'],hero:0});assert.equal(solo.player.hero,1);
});
test('ineligible or capped blessings cannot be chosen even from stale offers',()=>{
  const solo=new RecruitedAdventure({party:['nyanluna']});solo.phase='upgrade';solo.pendingBlessings=1;solo.offers=skillsForParty(both);
  assert.equal(solo.chooseSkill('echo'),false);assert.equal(solo.chooseSkill('crit'),false);
  solo.skills.vitality=3;assert.equal(solo.chooseSkill('vitality'),false);assert.deepEqual(solo.skills,{vitality:3});assert.equal(solo.pendingBlessings,1);
});
test('stage gates retain blessings while preserving deployment and earned character XP',()=>{
  const game=new RecruitedAdventure({party:['tsukineko']});const enemy=game.spawnEnemy('moss',0,6);game.hit(enemy,999,0,0);const xp=game.progressFor(1).xp;
  game.skills={haste:2,crit:1};game.wave=2;game.exitOpen=true;game.exitDelay=0;Object.assign(game.player,game.exitPoint);assert.equal(game.crossExit(),true);assert.equal(game.advanceStage(),true);
  assert.deepEqual(game.party,['tsukineko']);assert.deepEqual(game.skills,{haste:2,crit:1});assert.equal(game.progressFor(1).xp,xp);assert.equal(game.hasPartner,false);assert.equal(game.skillPool.length,7);
});
for(const hero of both)for(const difficulty of ['normal','hard'])test(`solo chapter is completable: ${hero}, ${difficulty}, three seeds`,()=>{
  for(const seed of [1,3,17]){const game=new RecruitedAdventure({party:[hero],difficulty,seed});
    for(let frame=0;frame<60*360;frame++){while(game.phase==='upgrade')game.chooseSkill(chooseOffer(game));if(game.phase==='transition')game.advanceStage();if(game.phase!=='playing')break;game.tick(1/60,botInput(game));game.drainEvents();}
    assert.equal(game.phase,'victory',`${hero}/${difficulty}/${seed}`);assert.equal(game.kills,91);assert.equal(game.stagesCleared,3);assert.ok(game.player.hp>0);
    assert.equal(game.earnedXp[both.find(id=>id!==hero)],0);
  }
});
