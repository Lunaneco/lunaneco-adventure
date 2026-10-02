import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Adventure,HEROES} from '../src/model.js';
import {hasPredationPair,finishPredation} from '../src/hehereal-predation.js';
import {battleVoiceLines,HEHE_FORM_LINES} from '../src/hehe-form-voice.js';
import {battleVoiceCues} from '../src/voice-policy.js';
import {UltimatePresentation} from '../src/ultimate-presentation.js';
import {createHeheForm,updateHeheForm} from '../src/hehe-form-visuals.js';
import {WEAPON_CATALOG,equippedWeapon,equipWeapon} from '../src/weapons.js';

function battle(hero=6,act=0){
 const g=new Adventure({seed:31,hero,act,party:['omsolo','hehereal'],progression:{story:{version:2,actClears:Array(32).fill(true)},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}]))}});
 g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=999;g.player.invincible=0;g.drainEvents();return g;
}
test('predation requires exactly the two living partners, works with either lead, and leaves saved selection untouched',()=>{
 assert.equal(hasPredationPair(['hehereal','omsolo']),true);assert.equal(hasPredationPair(['hehereal']),false);assert.equal(hasPredationPair(['hehereal','prim']),false);
 for(const lead of [2,6]){const g=battle(lead),saved=structuredClone(g.progression);assert.equal(g.predationReady,true);assert.equal(g.predate(),true);assert.equal(g.player.hero,6);assert.deepEqual(g.party,['hehereal']);assert.equal(g.partnerHero,null);assert.equal(g.hasLivingPartner,false);assert.deepEqual(g.progression,saved);}
 for(const id of [2,6]){const g=battle();g.healthFor(id).hp=0;assert.equal(g.predate(),false);}
});
test('capturing is never damage: no HP loss, hurt/down, hit counters, combo reset or mission progress',()=>{
 const g=battle();g.healthFor(2).hp=113;g.healthFor(6).hp=127;g.combo=12;g.comboTimer=3;g.runHits=4;g.stageTrial.hits=2;
 const health=structuredClone(g.heroHealth),missions=structuredClone(g.progression.missions),invincible=g.player.invincible;
 assert.equal(g.predate(),true);assert.deepEqual(g.heroHealth,health);assert.deepEqual(g.progression.missions,missions);assert.equal(g.runHits,4);assert.equal(g.stageTrial.hits,2);assert.equal(g.combo,12);assert.equal(g.comboTimer,3);assert.equal(g.player.invincible,invincible);
 assert.deepEqual(g.drainEvents().map(e=>e.type),['predationStart']);
});
test('capture preserves Hehereal attack, HP, defense, bow and charge, without adding Omsolo attack',()=>{
 const g=battle();for(const id of ['omsolo','hehereal']){const weapon=WEAPON_CATALOG.find(w=>w.heroId===id&&w.rarity.rank===4);g.progression.weapons.owned.push(weapon.id);equipWeapon(g.progression,id,weapon.id);}
 const base=g.statsFor(6),weapon=equippedWeapon(g.progression,'hehereal'),profile=g.attackProfile(6);g.ultimateCharges.hehereal=73;g.ultimateCharges.omsolo=92;
 g.predate();const after=g.statsFor(6);assert.deepEqual(after,base);assert.equal(g.predation.baseAttack,base.attack);assert.equal(g.predation.attackBonus,0);assert.deepEqual(g.attackProfile(6),profile);assert.deepEqual(equippedWeapon(g.progression,'hehereal'),weapon);assert.equal(g.player.charge,73);assert.equal(g.chargeFor(2),92);
 for(let i=0;i<5;i++){assert.equal(g.predate(),false);assert.equal(finishPredation(g),false);assert.equal(g.statsFor(6).attack,base.attack);}assert.equal(g.switchHero(),false);
});
test('all Omsolo weapon variants and levels leave transformed attack unchanged with either lead',()=>{
 for(const lead of [2,6])for(const level of [1,40,80])for(const weapon of WEAPON_CATALOG.filter(w=>w.heroId==='omsolo')){
  const g=battle(lead);g.progression.characters.omsolo.level=level;g.progression.characters.omsolo.breaks=6;g.progression.weapons.owned.push(weapon.id);assert.equal(equipWeapon(g.progression,'omsolo',weapon.id),true);
  const own=g.statsFor(6),other=g.statsFor(2).attack,health=structuredClone(g.heroHealth);assert.ok(other>0);assert.equal(g.predate(),true);assert.deepEqual(g.statsFor(6),own);assert.equal(g.predation.baseAttack,own.attack);assert.deepEqual(g.heroHealth,health);
 }
});
test('absorbed Omsolo cannot support, shoot, earn run XP, charge, or leave lingering attacks',()=>{
 const g=battle();g.projectiles=[{id:1,heroId:'omsolo',life:2},{id:2,heroId:'hehereal',life:2}];g.predate();assert.deepEqual(g.projectiles.map(p=>p.heroId),['hehereal']);
 const e=g.spawnEnemy('moss',g.player.x,g.player.z-6);e.hp=1e9;e.speed=0;e.special=e.attack=999;
 assert.equal(g.attackFrom(g.partner,2,true),false);assert.equal(g.attackFrom(g.player,2),false);assert.equal(g.attackFrom(g.player,6),true);assert.equal(g.projectiles.at(-1).kind,'magicArrow');assert.equal(g.projectiles.at(-1).damage,g.statsFor(6).attack);
 const om=g.chargeFor(2);g.gainUltimateCharge('omsolo',20);assert.equal(g.chargeFor(2),om);g.projectiles=[];g.hit(e,1e10,0,0);assert.equal(g.earnedXp.omsolo,0);assert.ok(g.earnedXp.hehereal>0);
});
test('form persists through waves, movement, pauses and stage transitions without a timer',()=>{
 const g=battle();g.predate();g.pause();g.tick(120);assert.equal(g.predation.active,true);g.resume();g.startWave();assert.deepEqual(g.party,['hehereal']);g.phase='transition';g.advanceStage();assert.equal(g.predation.active,true);assert.equal(g.player.hero,6);assert.equal(finishPredation(g),false);
});
test('victory restores the original duo/lead and base attack without healing either character',()=>{
 const g=battle(2),base=g.statsFor(6).attack;g.healthFor(2).hp=101;g.healthFor(6).hp=137;g.predate();g.wave=6;g.area=2;g.exitOpen=true;g.exitDelay=0;g.pendingBlessings=0;Object.assign(g.player,g.exitPoint);assert.equal(g.crossExit(),true);
 assert.equal(g.phase,'victory');assert.equal(g.predation.active,false);assert.deepEqual(g.party,['omsolo','hehereal']);assert.equal(g.player.hero,2);assert.equal(g.statsFor(6).attack,base);assert.equal(g.healthFor(2).hp,101);assert.equal(g.healthFor(6).hp,137);assert.equal(g.predate(),false);
 const fresh=battle();assert.equal(fresh.predation.used,false);assert.equal(fresh.predation.active,false);
});
test('defeat is final while absorbed: Omsolo is not an extra life; form ends only after defeat',()=>{
 const g=battle();g.healthFor(2).hp=111;g.predate();g.player.invincible=0;g.hurt(1e9,0,0);
 assert.equal(g.phase,'defeat');assert.equal(g.predation.active,false);assert.equal(g.healthFor(6).hp,0);assert.equal(g.healthFor(2).hp,111);assert.deepEqual(g.party,['omsolo','hehereal']);const events=g.drainEvents();assert.equal(events.filter(e=>e.type==='defeat').length,1);assert.ok(!events.some(e=>e.type==='switch'&&e.automatic));g.tick(.1);assert.equal(g.phase,'defeat');
});
for(const condition of ['pause','upgrade','ultimateIntro','transition','exit','travel','ultimate','tutorial'])test(`cannot consume during ${condition}`,()=>{
 const g=battle();if(['pause','upgrade','ultimateIntro','transition'].includes(condition))g.phase=condition;else if(condition==='exit')g.exitOpen=true;else if(condition==='travel')g.travelOpen='stairs';else if(condition==='ultimate')g.ultimateEffects=[{heroId:'omsolo'}];else g.tutorial={active:true};assert.equal(g.predate(),false);assert.equal(g.predation.active,false);
});
test('chapter six unlocks capture only after feeding, and the transformed exception allows Hehereal alone',()=>{
 const g=new Adventure({act:24,hero:2,party:['omsolo','nyanluna'],progression:{story:{version:2,actClears:Array(20).fill(true)},characters:{omsolo:{level:60,breaks:4}}}});assert.deepEqual(g.party,['omsolo']);assert.equal(g.predate(),false);g.wave=3;g.meetHehereal();assert.equal(g.predate(),true);assert.equal(g.player.hero,6);assert.equal(g.switchHero(),false);g.startWave();assert.deepEqual(g.party,['hehereal']);
});
test('supplied voice clips replace every transformed action, including ultimate cut-in; normal voice restores',()=>{
 const g=battle();assert.match(battleVoiceLines('hehereal','attack',g)[0].id,/^hehereal-attack/);g.predate();
 assert.equal(battleVoiceLines('hehereal','predation',g)[0],HEHE_FORM_LINES.laugh);assert.equal(battleVoiceLines('hehereal','attack',g)[0],HEHE_FORM_LINES.attack);assert.equal(battleVoiceLines('hehereal','ultimate',g)[0],HEHE_FORM_LINES.power);assert.match(battleVoiceLines('omsolo','attack',g)[0].id,/^omsolo/);
 assert.equal(battleVoiceCues(g.drainEvents(),g)[0].event,'predation');
 let shown;const voice={setMode(){},stop(){}},view={show(...args){shown=args;},hide(){}};g.player.charge=100;
 const cutin=new UltimatePresentation({voice,view,getGame:()=>g});assert.equal(cutin.start(g),true);assert.equal(shown[0],'hehehe');assert.equal(shown[1].id,HEHE_FORM_LINES.power.id);cutin.cancel();g.phase='victory';finishPredation(g);assert.match(battleVoiceLines('hehereal','ultimate',g)[0].id,/^hehereal-ultimate/);
});
test('native 3D form uses the bald monster silhouette and keeps all ten bows at the hand',()=>{
 const form=createHeheForm(),normal=new THREE.Group(),state={x:0,z:0,face:.5,moving:true,dash:0};normal.position.set(2,1,3);
 assert.equal(form.name,'hehereal-hehe-form');assert.equal(form.userData.statusRing.visible,false);
 const variants=WEAPON_CATALOG.filter(w=>w.heroId==='hehereal');assert.equal(variants.length,10);
 for(const weapon of variants){updateHeheForm(form,normal,state,2,.016,weapon);assert.deepEqual(form.position.toArray(),[2,1,3]);assert.deepEqual(form.userData.weapon.position.toArray(),[.69,.78,.23]);assert.equal(form.userData.weapon.userData.variantId,weapon.id);assert.equal(form.userData.weapon.userData.family,weapon.weapon.id);const box=new THREE.Box3().setFromObject(form);assert.ok(Number.isFinite(box.max.y));}
 assert.equal(form.userData.weaponCache.size,10);
});
