import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression,breakthroughStatus,talentStatus} from '../src/progression.js';
import {ACTS,CHAPTERS,actFor,isActUnlocked,nextStoryAct,completeAct} from '../src/acts.js';
import {partyForAct} from '../src/party.js';
import {enemyMaterials,gateMaterials,MIASMA_TIER_NODES} from '../src/talents.js';
import {LEVEL_RULES} from '../src/level-rules.js';
import {storyScenesFor} from '../src/chapter.js';
import {STORY_CAST} from '../src/story-cast.js';
import {existsSync} from 'node:fs';
import {darkHeheWave,kephiaPairsReady,toggleKephiaHero,ENDING_CREDITS,PARESIS_ACT_START,DARK_PARESIS_SCENES,KEPHIA_BATTLE_LINES} from '../src/dark-paresis.js';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';
import {finishPredation} from '../src/hehereal-predation.js';
import {dialogueVoiceId} from '../src/voice-catalog.js';
import {BOSSES,enemyForSpawn,enemyRosterForAct} from '../src/enemies.js';
import {fieldFor,contains} from '../src/terrain.js';
import {FLOOR_TYPES,floorPatchesFor} from '../src/special-floors.js';

const roster=HEROES;
const profile=(cleared=32)=>normalizeProgression({story:{version:2,actClears:Array.from({length:50},(_,i)=>(i<20||(i>=24&&i<32))&&i<cleared)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:80,breaks:6}]))},HEROES);
const unlockBefore=(p,id)=>{for(const act of ACTS){if(act.id===id)break;p.story.actClears[act.id]=true;}};

test('chapters 8 through the finale keep old ids and unlock in order',()=>{
  assert.equal(CHAPTERS.length,11);assert.equal(ACTS.length,44);
  assert.deepEqual(CHAPTERS.slice(7).map(c=>c.id),[7,8,9,10]);
  assert.deepEqual([32,33].map(id=>actFor(id).id),[32,33]);
  assert.equal(nextStoryAct(31),34);assert.equal(actFor(34).soloHero,'nyanluna');
  assert.deepEqual(ACTS.filter(a=>a.chapter===7).map(a=>a.soloHero),['nyanluna','tsukineko','omsolo','mochinyafe']);
  assert.deepEqual(ACTS.filter(a=>a.chapter===8).map(a=>a.soloHero),['shizuku','prim','hehereal','lumi']);
  for(const act of ACTS.filter(a=>a.chapter===7||a.chapter===8)){assert.equal(act.recommendedLevel,80);assert.equal(act.soloFirstClear,undefined);}
  for(const act of ACTS.filter(a=>a.chapter===9||a.chapter===10))assert.equal(act.recommendedLevel,90);
  const before=profile(31);assert.equal(isActUnlocked(before,34),false);
  const open=profile(32);assert.equal(isActUnlocked(open,34),true);assert.equal(isActUnlocked(open,35),false);
  assert.equal(partyForAct(['nyanluna','tsukineko'],roster,open,34,'nyanluna').join(),'nyanluna');
  assert.ok(BOSSES[actFor(49).bossId]);
  for(const act of ACTS.filter(a=>a.id>=PARESIS_ACT_START))for(const scene of Object.values(storyScenesFor(act.id)))for(const line of scene.lines)assert.ok(STORY_CAST[line.who],line.who);
});

test('every chapter 8+ line is voiced, and kephia has her own portraits and battle voice',()=>{
  const lines=DARK_PARESIS_SCENES.flatMap(act=>Object.values(act).flatMap(scene=>scene.lines));
  assert.ok(lines.length>150);
  for(const line of lines){
    assert.equal(line.voiced,true,line.text);
    const clip=VOICE_MANIFEST[dialogueVoiceId(line.who,line.text)];
    assert.ok(clip,`${line.who}: ${line.text}`);assert.equal(clip.who,line.who);assert.ok(existsSync('public/'+clip.file),clip.file);
  }
  for(const line of lines.filter(l=>l.who==='mochinyafe'))assert.match(line.text,/^ふぇ〜[っ！？…]*$/u);
  assert.ok(lines.some(l=>l.who==='kephia'&&l.portrait==='kephiaFinal'));
  for(const id of ['kephia','kephiaFinal']){assert.ok(STORY_CAST[id]);assert.ok(existsSync('public/'+STORY_CAST[id].image.replace(/^.*?assets\//,'assets/')),id);}
  for(const line of [...KEPHIA_BATTLE_LINES.form,KEPHIA_BATTLE_LINES.enrage]){const clip=VOICE_MANIFEST[line.id];assert.ok(clip,line.id);assert.equal(clip.who,'kephia');assert.ok(existsSync('public/'+clip.file));}
});

test('tower pressure rises through the chapters and the finale bosses last',()=>{
  const menace=ACTS.filter(a=>a.id>=PARESIS_ACT_START&&!a.kephiaRush).map(a=>a.menace);
  assert.equal(menace.length,12);for(let i=1;i<menace.length;i++)assert.ok(menace[i]>menace[i-1]);
  const finale=ACTS.filter(a=>a.kephiaRush);assert.deepEqual(finale.map(a=>a.bossHp),[100000,110000,120000,150000]);
  for(let i=1;i<finale.length;i++)assert.ok(finale[i].menace>finale[i-1].menace);
});

test('rarity 4 drops and the level 100 road open with chapter 8',()=>{
  assert.equal(LEVEL_RULES.maxLevel,100);
  const early=profile(32);early.story.chapterSevenCleared=false;
  assert.equal(breakthroughStatus(early,'nyanluna').chapterMet,false);
  early.story.chapterSevenCleared=true;early.characters.nyanluna.level=80;
  const ready=breakthroughStatus(early,'nyanluna');
  assert.equal(ready.chapterMet,true);assert.equal(ready.nextCap,90);assert.equal(ready.costs.miasmaShard,24);
  assert.deepEqual(enemyMaterials({type:'moss',rareTier:'paresis'},42,'normal',()=>0).paresisCore,12);
  assert.equal(enemyMaterials({type:'moss'},31,'normal',()=>0).miasmaShard,undefined);
  assert.equal(enemyMaterials({type:'moss'},34,'normal',()=>0).miasmaShard,1);
  assert.equal(enemyMaterials({type:'boss'},34,'normal',()=>0).paresisCore,2);
  assert.equal(gateMaterials(0,34,'normal').miasmaShard,3);
  assert.equal(gateMaterials(0,31,'normal').miasmaShard,undefined);
  const node=talentStatus(early,'nyanluna','miasmaGate');
  assert.equal(node.chapterMet,true);assert.equal(MIASMA_TIER_NODES.at(-1).level,100);
  early.story.chapterSevenCleared=false;assert.equal(talentStatus(early,'nyanluna','miasmaGate').chapterMet,false);
});

test('chapter 10 rolls a stronger rare hehe at 20 percent, once',()=>{
  assert.equal(darkHeheWave({chapter:5},()=>0),null);
  assert.equal(darkHeheWave({chapter:9},()=>.2),null);
  assert.equal(darkHeheWave({chapter:9},()=>0),1);
  const opened=profile(32);unlockBefore(opened,42);
  const g=new Adventure({act:42,seed:1,progression:opened,party:['nyanluna','shizuku']});
  g.darkHeheWave=1;g.wave=1;g.phase='playing';g.exitOpen=false;g.travelOpen=null;g.darkHehe=null;
  const enemy=g.spawnDarkHehe();
  assert.equal(enemy.name,'瘴金のへへへ');assert.equal(enemy.rareTier,'paresis');
  assert.ok(enemy.maxHp>2200);assert.equal(g.spawnDarkHehe(),null);
});

test('the finale assigns eight heroes into four disjoint pairs and fights in that order',()=>{
  const base=profile(46);
  let pairs=base.story.kephiaPairs;
  for(const [phase,hero] of ENDING_CREDITS.map((hero,i)=>[Math.floor(i/2),hero.id]))pairs=toggleKephiaHero(pairs,phase,hero);
  assert.equal(kephiaPairsReady(pairs),true);
  pairs=toggleKephiaHero(pairs,0,'shizuku');
  assert.equal(pairs[0].includes('shizuku'),false);
  base.story.kephiaPairs=pairs;base.story.actClears[46]=true;
  const locked=toggleKephiaHero(base.story.kephiaPairs,0,'lumi',{lockedPhases:new Set([0])});
  assert.deepEqual(locked[0],base.story.kephiaPairs[0]);
  const ready=profile(32);unlockBefore(ready,49);ready.story.kephiaPairs=[['nyanluna','tsukineko'],['omsolo','mochinyafe'],['shizuku','prim'],['hehereal','lumi']];
  assert.deepEqual(partyForAct(['lumi'],roster,ready,46,'lumi'),['nyanluna','tsukineko']);
  assert.deepEqual(partyForAct(['lumi'],roster,ready,49,'lumi'),['hehereal','lumi']);
  const g=new Adventure({act:49,seed:3,progression:ready,party:['nyanluna']});
  assert.deepEqual(g.party,['hehereal','lumi']);
  for(const id of [46,47,48,49])completeAct(ready,id);
  assert.equal(ready.story.finaleCleared,true);
});

test('dark paresis rooms and enemies belong to the tower',()=>{
  assert.deepEqual(enemyRosterForAct(34),['miasmaMoth','paresisChorister','lanternWarden','miasmaBell','darkCenser']);
  assert.equal(enemyForSpawn(34,1,0,0),'miasmaMoth');
  assert.equal(enemyForSpawn(42,3,1,.4),'paresisChorister');
  assert.equal(enemyForSpawn(46,1,4,.9),'boss');
  assert.equal(actFor(46).kephiaRush,true);
  const ids=new Set();
  for(let id=34;id<=49;id++)for(let area=0;area<3;area++){
    const field=fieldFor(id,area);
    assert.equal(field.rooms[0].shapeLabel,'ダークパレシス',id);
    for(const room of field.rooms){
      assert.equal(ids.has(room.id),false,room.id);ids.add(room.id);
      assert.ok(contains(room,room.entrance.x,room.entrance.z,.85),room.id);
      if(!room.stairs)assert.ok(contains(room,room.exit.x,room.exit.z,.3),`${room.id} exit`);
      const patches=floorPatchesFor(room);
      assert.ok(patches.length>=2&&patches.length<=3,room.id);
      assert.equal(patches.filter(p=>FLOOR_TYPES[p.type].kind==='damage').length,1,room.id);
    }
  }
  assert.equal(fieldFor(46,0).kind,'single');
  assert.equal(fieldFor(46,0).rooms[0].paresisShape,2);
});

test('the finale is one boss rush and a failed run saves nothing',()=>{
  const ready=profile(32);unlockBefore(ready,46);
  ready.story.kephiaPairs=[['nyanluna','tsukineko'],['omsolo','mochinyafe'],['shizuku','prim'],['hehereal','lumi']];
  const g=new Adventure({act:46,seed:3,progression:ready,party:['lumi']});
  g.player.invincible=999;
  assert.deepEqual([...g.party],['nyanluna','tsukineko']);
  assert.deepEqual(g.enemies.map(e=>e.type),['boss']);
  assert.equal(g.enemies[0].bossId,'kephia1');
  const down=()=>{g.enemies.find(e=>e.type==='boss').hp=0;g.tick(1/60);};
  const wait=form=>{for(let i=0;i<200&&g.kephiaForm<form&&g.phase==='playing';i++)g.tick(1/60);};
  down();wait(1);
  assert.equal(g.phase,'playing');
  assert.equal(g.act,47);
  assert.deepEqual([...g.party],['omsolo','mochinyafe']);
  assert.equal(g.progression.story.actClears[46],false);
  g.phase='defeat';
  assert.equal(g.progression.story.actClears.slice(46,50).some(Boolean),false);
});

test('a predation pair hands the next form a clean party, and a later omsolo+hehereal pair can predate again',()=>{
  const ready=profile(32);unlockBefore(ready,46);
  ready.story.kephiaPairs=[['omsolo','hehereal'],['nyanluna','tsukineko'],['mochinyafe','shizuku'],['prim','lumi']];
  const g=new Adventure({act:46,seed:3,progression:ready,party:['omsolo','hehereal']});
  g.player.invincible=999;
  assert.equal(g.predate(),true);assert.deepEqual([...g.party],['hehereal']);
  g.enemies.find(e=>e.type==='boss').hp=0;g.drainEvents();
  for(let i=0;i<200&&g.kephiaForm<1;i++)g.tick(1/60);
  const events=g.drainEvents().map(e=>e.type);
  assert.equal(g.act,47);assert.deepEqual([...g.party],['nyanluna','tsukineko']);assert.deepEqual(g.partyHeroes,[0,1]);
  assert.equal(g.player.hero,0);assert.equal(g.partnerHero,1);assert.equal(g.predation.active,false);
  assert.ok(events.indexOf('predationEnd')>=0&&events.indexOf('predationEnd')<events.indexOf('kephiaForm'));
  g.phase='defeat';finishPredation(g);assert.deepEqual([...g.party],['nyanluna','tsukineko']);
  const later=profile(32);unlockBefore(later,46);
  later.story.kephiaPairs=[['nyanluna','tsukineko'],['omsolo','hehereal'],['mochinyafe','shizuku'],['prim','lumi']];
  const h=new Adventure({act:46,seed:3,progression:later,party:['nyanluna']});
  h.player.invincible=999;h.enemies.find(e=>e.type==='boss').hp=0;
  for(let i=0;i<200&&h.kephiaForm<1;i++)h.tick(1/60);
  assert.deepEqual([...h.party],['omsolo','hehereal']);for(let i=0;i<120&&!h.predationReady;i++)h.tick(1/60);
  h.ultimateEffects=[];assert.equal(h.predate(),true);
});

test('clearing the final kephia form records all four finale acts',()=>{
  const ready=profile(32);unlockBefore(ready,46);
  ready.story.kephiaPairs=[['nyanluna','tsukineko'],['omsolo','mochinyafe'],['shizuku','prim'],['hehereal','lumi']];
  const g=new Adventure({act:46,seed:5,progression:ready,party:['lumi']});
  g.player.invincible=999;
  const down=()=>{g.enemies.find(e=>e.type==='boss').hp=0;g.tick(1/60);};
  const wait=form=>{for(let i=0;i<200&&g.kephiaForm<form&&g.phase==='playing';i++)g.tick(1/60);};
  down();wait(1);down();wait(2);down();wait(3);
  assert.equal(g.enemies.find(e=>e.type==='boss').bossId,'kephia4');
  assert.deepEqual([...g.party],['hehereal','lumi']);
  down();
  assert.equal(g.exitOpen,true);
  assert.equal(g.progression.story.finaleCleared,false);
  g.exitDelay=0;g.player.x=g.exitPoint.x;g.player.z=g.exitPoint.z;
  assert.equal(g.crossExit(),true);
  assert.equal(g.phase,'victory');
  assert.equal(g.progression.story.actClears.slice(46,50).every(Boolean),true);
  assert.equal(g.progression.story.finaleCleared,true);
});
