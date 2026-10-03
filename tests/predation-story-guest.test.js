import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {isHeroUnlocked} from '../src/recruitment.js';

function game(act=28,lead=6,cleared=32){
 return new Adventure({act,hero:lead,seed:31,party:['omsolo','hehereal'],progression:{story:{version:2,actClears:Array(cleared).fill(true)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}])),tutorial:{firstBattleCompleted:true}}});
}
function cross(g,wave){
 g.wave=wave;g.area=Math.floor((wave-1)/2);g.enemies=[];g.projectiles=[];g.hazards=[];g.ultimateEffects=[];g.orbs=[];
 g.pendingBlessings=0;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);
 assert.equal(g.crossExit(),true);
}
function soloForm(g){
 assert.equal(g.predation.active,true);assert.equal(g.predation.used,true);
 assert.deepEqual(g.party,['hehereal']);assert.deepEqual(g.partyHeroes,[6]);
 assert.equal(g.player.hero,6);assert.equal(g.partnerHero,null);assert.equal(g.hasPartner,false);
 assert.equal(g.guestHeroId,null);assert.equal(g.switchHero(),false);
 assert.ok(!g.drainEvents().some(e=>e.type==='guestJoin'));
}

for(const act of [28,29,30,31])for(const lead of [2,6])test(`chapter-seven act ${act}, lead ${lead}: absorbed duo never gains Lumi across the story encounter and later gates`,()=>{
 const g=game(act,lead),saved=structuredClone(g.progression.characters),base=g.statsFor(6).attack;
 assert.deepEqual(g.party,['omsolo','hehereal']);g.drainEvents();assert.equal(g.predate(),true);g.drainEvents();
 cross(g,2);assert.equal(g.phase,'transition');assert.equal(g.advanceStage(),true);
 assert.equal(g.wave,3);assert.equal(g.meetLumi(),false);soloForm(g);
 cross(g,4);assert.equal(g.advanceStage(),true);assert.equal(g.wave,5);soloForm(g);
 // Tick an actual attack, move and cast after meeting Lumi; no hidden support
 // or revived Omsolo can act while the transformation remains irreversible.
 const enemy=g.spawnEnemy('antiGuard',g.player.x,g.player.z-6);Object.assign(enemy,{hp:1e6,maxHp:1e6,speed:0,attack:999,special:999});
 const x=g.player.x;g.player.attack=0;g.tick(1/60,{x:1,z:0});assert.ok(g.player.x>x);
 assert.ok(g.projectiles.some(b=>b.heroId==='hehereal'));assert.ok(!g.projectiles.some(b=>b.heroId==='lumi'||b.heroId==='omsolo'));
 g.player.charge=100;assert.equal(g.ultimate(),true);assert.equal(g.ultimateSpec().id,'hehe-predation-dance');assert.equal(g.predate(),false);soloForm(g);
 assert.deepEqual(g.progression.characters,saved);assert.equal(g.statsFor(6).attack,base);
 cross(g,6);assert.equal(g.phase,'victory');assert.equal(g.predation.active,false);
 assert.deepEqual(g.party,['omsolo','hehereal']);assert.equal(g.player.hero,lead);assert.equal(g.guestHeroId,null);assert.equal(g.recruitedHeroId,null);
});

test('meeting Lumi while absorbed never recruits or gives NPC stat floor to a still-locked Lumi',()=>{
 const g=game(28,6,29);g.progression.characters.lumi.level=1;g.progression.characters.lumi.breaks=0;
 const stats=g.statsFor(7),health=structuredClone(g.healthFor(7));assert.equal(isHeroUnlocked(g.progression,'lumi'),false);
 assert.equal(g.predate(),true);cross(g,2);assert.equal(g.advanceStage(),true);soloForm(g);
 assert.equal(isHeroUnlocked(g.progression,'lumi'),false);assert.equal(g.recruitedHeroId,null);
 assert.deepEqual(g.statsFor(7),stats);assert.deepEqual(g.healthFor(7),health);
});

test('absorbed Hehereal still loses alone after the Lumi encounter, without restoring Omsolo as an extra life',()=>{
 const g=game();const hp=g.healthFor(2).hp;g.predate();cross(g,2);g.advanceStage();soloForm(g);
 g.player.invincible=0;g.hurt(1e9,g.player.x,g.player.z);
 assert.equal(g.phase,'defeat');assert.equal(g.predation.active,false);assert.equal(g.healthFor(6).hp,0);assert.equal(g.healthFor(2).hp,hp);
 assert.deepEqual(g.party,['omsolo','hehereal']);assert.ok(!g.drainEvents().some(e=>e.type==='switch'&&e.automatic));
});

test('real chapter-seven solo runs still receive Lumi at the same story point',()=>{
 for(const cleared of [28,29]){
  const g=new Adventure({act:28,hero:3,seed:31,party:['mochinyafe'],progression:{story:{version:2,actClears:Array(cleared).fill(true)},tutorial:{firstBattleCompleted:true}}});
  assert.deepEqual(g.party,['mochinyafe']);assert.equal(g.guestHeroId,null);
  cross(g,2);assert.equal(g.advanceStage(),true);assert.equal(g.guestHeroId,'lumi');assert.deepEqual(g.party,['mochinyafe','lumi']);
  assert.equal(g.meetLumi(),false);assert.equal(g.switchHero(),false);assert.equal(g.predation.used,false);
 }
});
