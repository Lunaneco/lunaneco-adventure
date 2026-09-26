import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES,STAGE_EXIT} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {isHeroUnlocked,availableHeroes} from '../src/recruitment.js';
import {ACT_SCENES} from '../src/chapter.js';
import {botInput,chooseOffer} from './bot.js';

const finale=options=>new Adventure({...options,act:3,progression:{...options?.progression,story:{version:2,actClears:[true,true,true,false],tsukinekoUnlocked:false}}});
const encounter=g=>{g.wave=5;g.enemies=[];g.orbs=[];g.drainEvents();g.startWave();return g;};
const gate=g=>{g.enemies=[];g.pendingBlessings=0;g.phase='playing';g.openExit();g.exitDelay=0;Object.assign(g.player,{x:g.exitPoint.x,z:g.exitPoint.z});return g.crossExit();};

test('a fresh save starts with Nyanluna alone and rejects saved locked leads or parties',()=>{
  for(const party of [undefined,[],['tsukineko'],['nyanluna','tsukineko']]){
    const g=new Adventure({party,hero:1});assert.deepEqual(g.party,['nyanluna']);assert.equal(g.player.hero,0);assert.equal(g.hasPartner,false);assert.equal(g.switchHero(),false);assert.equal(g.skillPool.length,7);
    assert.equal(g.attackFrom(g.partner,1,true),false);assert.equal(isHeroUnlocked(g.progression,'tsukineko'),false);
  }
});
test('legacy chapter clears migrate recruitment without changing XP, talents, gear or materials',()=>{
  const legacy={characters:{tsukineko:{level:20,xp:19,breaks:1,tree:['origin']}},inventory:{starBud:10,limitStone:2},equipment:{owned:['dawn-seal'],loadout:{tsukineko:'dawn-seal'}}};
  const locked=normalizeProgression(legacy,HEROES),unlocked=normalizeProgression(legacy,HEROES,{chapterOneCleared:true});
  assert.equal(isHeroUnlocked(locked,'tsukineko'),false);assert.equal(isHeroUnlocked(unlocked,'tsukineko'),true);
  for(const key of ['characters','inventory','equipment','missions'])assert.deepEqual(unlocked[key],locked[key]);
  assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(unlocked)),HEROES),unlocked);
  for(const value of ['true',1,{},null])assert.equal(isHeroUnlocked(normalizeProgression({story:{chapterOneCleared:value}},HEROES),'tsukineko'),false);
  assert.equal(availableHeroes(unlocked,[...HEROES,{id:'unknown'}]).length,2);
});
test('Tsukineko is absent from the opening and early conversations; the final encounter and ending establish joining',()=>{
  for(const act of ACT_SCENES.slice(0,3))for(const scene of Object.values(act))assert.equal(scene.lines.some(l=>l.who==='tsukineko'),false);
  const SCENES=ACT_SCENES[3];
  assert.match(SCENES.guardian.lines.map(l=>l.text).join(''),/膝をついて/);assert.match(SCENES.ending.lines.at(-1).text,/自由に編成/);
});
test('the final wave adds a guest once, spawns one boss and preserves earned growth and blessings',()=>{
  const g=finale();assert.equal(g.meetTsukineko(),false);g.skills={orbit:2};g.player.hp=90;g.time=100;g.runHits=2;g.stageTrial={startedAt:70,hits:1};
  const profile=structuredClone(g.progression);encounter(g);
  assert.deepEqual(g.party,['nyanluna','tsukineko']);assert.equal(g.guestHeroId,'tsukineko');assert.equal(g.skillPool.length,12);assert.deepEqual(g.progression,profile);assert.equal(g.player.hp,112);assert.deepEqual(g.skills,{orbit:2});assert.equal(g.runHits,2);assert.deepEqual(g.stageTrial,{startedAt:70,hits:1});
  assert.equal(g.enemies.length,1);assert.equal(g.enemies[0].type,'boss');assert.equal(g.waveSpawned,1);assert.equal(g.meetTsukineko(),false);assert.equal(g.drainEvents().filter(e=>e.type==='guestJoin').length,1);
});
test('guest can fire, swap and earn her own XP; paired blessings become eligible before recruitment',()=>{
  const g=encounter(finale());g.player.attack=999;g.partner.attack=999;g.enemies=[];g.waveBreak=-100;
  const enemy=g.spawnEnemy('moss',g.partner.x,g.partner.z+3);enemy.hp=1;
  assert.equal(g.attackFrom(g.partner,1,true),true);assert.equal(g.projectiles[0].kind,'gun');
  for(let i=0;i<15;i++)g.tick(1/60);assert.equal(g.earnedXp.tsukineko,3);assert.equal(g.earnedXp.nyanluna,1.5);assert.equal(g.switchHero(),true);
  g.addCrystals(8);g.offerSkills();assert.equal(g.offers.length,3);assert.ok(g.offers.some(s=>s.requires?.length===2));assert.equal(isHeroUnlocked(g.progression,'tsukineko'),false);
});
test('boss defeat and guest XP do not recruit; only crossing the final gate persists joining once',()=>{
  const g=encounter(finale());g.hit(g.enemies[0],99999,0,0,false,false,'tsukineko');g.enemies=[];g.tick(1/60);
  assert.equal(g.exitOpen,true);assert.equal(isHeroUnlocked(g.progression,'tsukineko'),false);assert.equal(g.earnedXp.tsukineko,60);
  assert.equal(gate(g),true);assert.equal(g.phase,'victory');assert.equal(g.guestHeroId,null);assert.equal(g.recruitedHeroId,'tsukineko');assert.equal(isHeroUnlocked(g.progression,'tsukineko'),true);assert.equal(g.crossExit(),false);assert.equal(g.drainEvents().filter(e=>e.type==='recruited').length,1);
  const next=new Adventure({progression:JSON.parse(JSON.stringify(g.progression)),hero:1});assert.equal(next.player.hero,1);assert.equal(next.progressFor(1).level,1);
});
test('quitting or defeat after meeting keeps recruitment locked on the next run',()=>{
  for(const defeat of [false,true]){const g=encounter(finale());if(defeat){g.player.invincible=0;g.hurt(99999,0,0);assert.equal(g.phase,'playing');assert.equal(g.player.hero,1);g.player.invincible=0;g.hurt(99999,0,0);assert.equal(g.phase,'defeat');}
    const retry=new Adventure({progression:JSON.parse(JSON.stringify(g.progression)),party:g.party,hero:1});assert.deepEqual(retry.party,['nyanluna']);assert.equal(retry.guestHeroId,null);assert.equal(isHeroUnlocked(retry.progression,'tsukineko'),false);
  }
});
test('after recruitment, solo replay remains solo through the final boss and grants no second recruitment',()=>{
  for(const id of ['nyanluna','tsukineko']){const g=encounter(new Adventure({progression:{story:{chapterOneCleared:true}},party:[id]}));assert.deepEqual(g.party,[id]);assert.equal(g.guestHeroId,null);gate(g);assert.equal(g.recruitedHeroId,null);assert.equal(g.drainEvents().some(e=>e.type==='recruited'),false);}
});
for(const difficulty of ['normal','hard'])test(`final act completes solo then with guest: ${difficulty}, three seeds`,()=>{
  for(const seed of [1,3,17]){const g=finale({difficulty,seed});let met=false;
    for(let i=0;i<60*360;i++){while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;
      if(g.wave<6){assert.deepEqual(g.party,['nyanluna']);assert.equal(g.earnedXp.tsukineko,0);}else met=true;
      g.tick(1/60,botInput(g));g.drainEvents();
    }
    assert.equal(g.phase,'victory',`seed ${seed}`);assert.equal(g.kills,123);assert.equal(met,true);assert.equal(isHeroUnlocked(g.progression,'tsukineko'),true);
  }
});
