import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {ACTS,EXTRA_ACTS} from '../src/acts.js';
import {normalizeProgression} from '../src/progression.js';
import {availableHeroes} from '../src/recruitment.js';
import {requiredPartyMember,partyForAct,changeParty} from '../src/party.js';
import {partyView} from '../src/party-ui.js';
import {stageBriefingView} from '../src/stage-selection-ui.js';

const profile=cleared=>normalizeProgression({story:{version:2,actClears:ACTS.map(a=>a.id<cleared)},tutorial:{firstBattleCompleted:true}},HEROES);

test('every uncleared chapter-four act requires Nyanluna in both modes, preserving the chosen lead and two-person limit',()=>{
  for(let act=12;act<16;act++)for(const difficulty of ['normal','hard']){
    const p=profile(act),roster=availableHeroes(p,HEROES);
    for(const party of [['omsolo'],['tsukineko','omsolo'],['nyanluna'],['nyanluna','mochinyafe'],['mochinyafe','nyanluna'],['shizuku','unknown'],null]){
      const original=structuredClone(party),g=new Adventure({progression:p,act,difficulty,party,hero:2});
      assert.ok(g.party.includes('nyanluna'));assert.ok(g.party.length<=2);assert.equal(new Set(g.party).size,g.party.length);
      assert.ok(g.party.every(id=>roster.some(h=>h.id===id)));assert.equal(g.act,act);assert.deepEqual(party,original);
      if(party?.includes('omsolo')){assert.deepEqual(g.party,['omsolo','nyanluna']);assert.equal(g.player.hero,2);assert.equal(g.partnerHero,0);}
      if(party?.includes('nyanluna'))assert.deepEqual(g.party,party);
    }
    assert.deepEqual(partyForAct(['tsukineko','omsolo'],roster,p,act,'unknown'),['tsukineko','nyanluna']);
  }
});

test('defeat, retry and intermediate gates retain the requirement; the final gate releases only the cleared act',()=>{
  for(let act=12;act<16;act++){
    const p=profile(act),g=new Adventure({progression:p,act,party:['omsolo'],hero:2});
    g.player.invincible=0;g.hurt(1e9,0,0);g.player.invincible=0;g.hurt(1e9,0,0);assert.equal(g.phase,'defeat');
    const retry=new Adventure({progression:g.progression,act,party:['omsolo'],hero:2});assert.ok(retry.party.includes('nyanluna'));
    retry.wave=2;retry.exitOpen=true;retry.exitDelay=0;Object.assign(retry.player,retry.exitPoint);assert.ok(retry.crossExit());assert.equal(requiredPartyMember(retry.progression,act),'nyanluna');assert.ok(retry.advanceStage());
    retry.area=2;retry.wave=6;retry.exitOpen=true;retry.exitDelay=0;Object.assign(retry.player,retry.exitPoint);assert.ok(retry.crossExit());assert.equal(retry.phase,'victory');
    const saved=normalizeProgression(JSON.parse(JSON.stringify(retry.progression)),HEROES);
    assert.equal(requiredPartyMember(saved,act),null);
    for(const difficulty of ['normal','hard'])assert.deepEqual(new Adventure({progression:saved,act,party:['omsolo'],hero:2,difficulty}).party,['omsolo']);
    if(act<15){assert.equal(requiredPartyMember(saved,act+1),'nyanluna');assert.ok(new Adventure({progression:saved,act:act+1,party:['omsolo']}).party.includes('nyanluna'));}
  }
});

test('cleared chapter-four acts, earlier chapters, extra stages and tutorial retain free or existing recruitment rules',()=>{
  const p=profile(16);
  for(const act of [...ACTS.map(a=>a.id),...EXTRA_ACTS.map(a=>a.id)]){
    assert.equal(requiredPartyMember(p,act),null);assert.deepEqual(new Adventure({progression:p,act,party:['mochinyafe'],hero:3}).party,['mochinyafe']);
  }
  assert.equal(requiredPartyMember(profile(12),11),null);
  assert.deepEqual(new Adventure({progression:profile(12),act:12,party:['omsolo'],tutorial:true}).party,['nyanluna']);
});

test('party controls prevent required-member removal while allowing partner changes and showing the restriction only until clear',()=>{
  const p=profile(13),party=['omsolo','nyanluna'],required=requiredPartyMember(p,13);
  assert.deepEqual(changeParty(party,'nyanluna',HEROES,required),party);
  assert.deepEqual(changeParty(party,'omsolo',HEROES,required),['nyanluna']);
  assert.deepEqual(changeParty(['nyanluna'],'mochinyafe',HEROES,required),['nyanluna','mochinyafe']);
  const pending=partyView(party,2,HEROES,()=>60,p,'戻る',13);
  assert.match(pending,/第4章・第2幕は初回クリアまで/);
  assert.match(pending,/<button data-party-toggle="nyanluna"[^>]*disabled[^>]*>[\s\S]*?必須<\/button>/);
  assert.match(stageBriefingView(13,'normal',p),/にゃんるな必須/);
  assert.doesNotMatch(stageBriefingView(12,'hard',p),/にゃんるな必須/);
  assert.doesNotMatch(partyView(party,2,HEROES,()=>60,p,'戻る',12),/party-required-note/);
  assert.deepEqual(changeParty(party,'nyanluna',HEROES,requiredPartyMember(p,12)),['omsolo']);
});
