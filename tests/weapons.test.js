import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES,seededRandom} from '../src/model.js';
import {normalizeProgression,combatStats} from '../src/progression.js';
import {equipUnique,normalizeEquipment} from '../src/equipment.js';
import {WEAPON_CATALOG,WEAPON_HERO_IDS,WEAPON_RARITIES,WEAPON_TICKET_DROP_RATE,normalizeWeapons,equippedWeapon,equipWeapon,weaponVariant,weaponImage,weaponAttackProfile,drawWeapon,bossWeaponTicket} from '../src/weapons.js';
import {weaponGachaView,weaponDrawResult,weaponLoadoutView} from '../src/weapons-ui.js';
const fresh=()=>normalizeProgression({},HEROES);
const roll=(profile,hero,rarity,type=0)=>{const values=[hero,rarity,type];return drawWeapon(profile,()=>values.shift());};
const quiet=(options={})=>{const g=new Adventure({seed:27,...options});g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.drainEvents();return g;};

test('mochinyafe keeps the Lv.50 attack interval floor through the new Lv.80 cap',()=>{
 const hero=HEROES.find(h=>h.id==='mochinyafe'),p=fresh();
 p.characters.mochinyafe.level=50;const floor=weaponAttackProfile(p,hero).interval;assert.ok(floor>0);
 for(const level of [60,70,80]){p.characters.mochinyafe.level=level;assert.equal(weaponAttackProfile(p,hero).interval,floor);}
});

test('legacy saves retain all progress, relics and base stats with seven starter weapons and zero tickets',()=>{
 const old={story:{version:2,actClears:[true,true]},characters:{nyanluna:{level:9,xp:17,tree:['origin']},future:{level:2}},inventory:{starBud:71,moonDew:5,limitStone:2},equipment:{owned:['meadow-charm'],loadout:{nyanluna:'meadow-charm'}}};
 const p=normalizeProgression(old,HEROES);assert.equal(p.inventory.weaponTicket,0);assert.equal(p.inventory.starBud,71);assert.deepEqual(p.equipment,old.equipment);assert.equal(p.characters.nyanluna.level,9);assert.equal(p.characters.nyanluna.xp,17);assert.equal(p.characters.future.level,2);assert.equal(p.weapons.owned.length,7);
 for(const hero of HEROES)assert.equal(equippedWeapon(p,hero.id).rarity.rank,1);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
});
test('weapon IDs, tickets and saved draw results are normalized without accepting invented rewards',()=>{
 for(const bad of [-2,NaN,Infinity,'4',null])assert.equal(normalizeProgression({inventory:{weaponTicket:bad}},HEROES).inventory.weaponTicket,0);
 const p=normalizeProgression({inventory:{weaponTicket:4.9},weapons:{owned:['nox-rifle-r4','nox-rifle-r4','luna-staff-r99','__proto__'],draws:-2,lastDraw:{weaponId:'<script>',duplicate:true}}},HEROES);
 assert.equal(p.inventory.weaponTicket,4);assert.equal(p.weapons.owned.length,8);assert.equal(p.weapons.draws,0);assert.equal(p.weapons.lastDraw,null);assert.deepEqual(normalizeWeapons(null),normalizeWeapons({}));
});
for(const [heroIndex,heroRoll] of WEAPON_HERO_IDS.map((_,i)=>[i,i/WEAPON_HERO_IDS.length]))for(const [rank,rarityRoll] of [[2,0],[3,.75],[4,.95]])test(`gacha boundary selects hero ${heroIndex}, rarity ${rank}, independently of recruitment`,()=>{
 const p=fresh();p.inventory.weaponTicket=1;const before=structuredClone(p),r=roll(p,heroRoll,rarityRoll);assert.equal(r.item.heroId,WEAPON_HERO_IDS[heroIndex]);assert.equal(r.item.rarity.rank,rank);assert.equal(r.duplicate,false);assert.equal(p.inventory.weaponTicket,0);assert.equal(p.weapons.draws,1);assert.equal(equippedWeapon(p,r.item.heroId).rarity.rank,1);assert.deepEqual(p.characters,before.characters);assert.deepEqual(p.story,before.story);assert.deepEqual(p.equipment,before.equipment);assert.deepEqual(normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES),p);
});
test('the published 75/20/5 rates and equal character odds cover a uniform grid exactly',()=>{
 const p=fresh();p.inventory.weaponTicket=2100;const totals={};
 for(let hero=0;hero<WEAPON_HERO_IDS.length;hero++)for(let rarity=0;rarity<100;rarity++)for(let type=0;type<3;type++){const result=roll(p,(hero+.5)/WEAPON_HERO_IDS.length,(rarity+.5)/100,(type+.5)/3),id=`${result.item.heroId}-${result.item.rarity.rank}`;totals[id]=(totals[id]??0)+1;}
 for(const id of WEAPON_HERO_IDS){assert.equal(totals[`${id}-2`],225);assert.equal(totals[`${id}-3`],60);assert.equal(totals[`${id}-4`],15);}assert.equal(p.weapons.owned.length,70);assert.equal(p.inventory.weaponTicket,0);
});
test('a draw with no ticket, or an invalid RNG, changes nothing',()=>{
 const p=fresh(),before=structuredClone(p);assert.equal(drawWeapon(p,()=>{throw Error('must not roll');}),null);assert.deepEqual(p,before);
 p.inventory.weaponTicket=2;for(const value of [NaN,-.1,1,Infinity]){const snapshot=structuredClone(p);assert.equal(drawWeapon(p,()=>value),null);assert.deepEqual(p,snapshot);}
});
for(const [rarity,seed] of [[2,.1],[3,.8],[4,.99]])test(`rarity ${rarity} duplicate converts into the advertised buds and still consumes exactly one ticket`,()=>{
 const p=fresh();p.inventory.weaponTicket=3;roll(p,0,seed);const r=roll(p,0,seed);assert.equal(r.duplicate,true);assert.equal(r.duplicateBuds,WEAPON_RARITIES[rarity-1].duplicateBuds);assert.equal(p.inventory.starBud,r.duplicateBuds);assert.equal(p.inventory.weaponTicket,1);assert.equal(p.weapons.owned.length,8);assert.equal(p.weapons.draws,2);assert.deepEqual(p.weapons.lastDraw,{weaponId:r.item.id,duplicate:true,duplicateBuds:r.duplicateBuds});
 const restored=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.deepEqual(restored,p);assert.equal(restored.inventory.starBud,r.duplicateBuds);
});
test('only the equipped owner receives the bonus; draws preserve the selection and relics stay separate',()=>{
 const p=fresh();p.inventory.weaponTicket=3;p.equipment.owned=['ruins-lens'];equipUnique(p.equipment,'nyanluna','ruins-lens');const before=HEROES.map(h=>combatStats(p,h));
 roll(p,0,.99);assert.equal(equipWeapon(p,'nyanluna','luna-staff-r4'),true);assert.equal(combatStats(p,HEROES[0]).attack,before[0].attack*1.4);assert.deepEqual(combatStats(p,HEROES[1]),before[1]);assert.deepEqual(combatStats(p,HEROES[2]),before[2]);assert.equal(p.equipment.loadout.nyanluna,'ruins-lens');
 const lower=roll(p,0,.1);assert.equal(lower.duplicate,false);assert.equal(equippedWeapon(p,'nyanluna').rarity.rank,4);
 const g=new Adventure({progression:p});assert.equal(g.statsFor(0).attack,combatStats(p,HEROES[0]).attack);g.rng=()=>1;const e=g.spawnEnemy('boss',0,5);g.attackFrom(g.player,0);assert.equal(g.projectiles[0].damage,g.statsFor(0).attack);assert.ok(Math.abs(g.skillDamage('nyanluna',10)-10*g.statsFor(0).attack/HEROES[0].damage*HEROES[0].skillPower)<1e-9);
});
test('all six characters can wear any relic, with one slot each and one wearer per physical item',()=>{
 const e=normalizeEquipment({owned:['meadow-charm','dawn-seal'],loadout:{}});
 for(const hero of HEROES){assert.equal(equipUnique(e,hero.id,'meadow-charm',{transfer:true}),true);assert.deepEqual(Object.entries(e.loadout),[[hero.id,'meadow-charm']]);assert.equal(equipUnique(e,hero.id,'dawn-seal'),true);assert.equal(e.loadout[hero.id],'dawn-seal');assert.equal(equipUnique(e,hero.id,''),true);}
 equipUnique(e,'nyanluna','meadow-charm');assert.equal(equipUnique(e,'tsukineko','meadow-charm'),false);equipUnique(e,'tsukineko','meadow-charm',{transfer:true});assert.equal(e.loadout.nyanluna,undefined);assert.equal(e.loadout.tsukineko,'meadow-charm');
});
test('every boss including elite has a 5% ticket drop, regular enemies, living bosses and training do not',()=>{
 assert.equal(WEAPON_TICKET_DROP_RATE,.05);
 for(const elite of [false,true])for(const [rng,expected] of [[0,1],[.049999,1],[.05,0],[.99,0]]){const p=fresh();assert.equal(bossWeaponTicket(p,{type:'boss',hp:0,elite},()=>rng),expected);assert.equal(p.inventory.weaponTicket,expected);}
 for(const e of [{type:'moss',hp:0},{type:'boss',hp:1},{type:'boss',hp:0,training:true}])assert.equal(bossWeaponTicket(fresh(),e,()=>{throw Error('ineligible enemy rolled');}),0);
});
test('actual boss kills award once, attribute to the run, persist through defeat and do not perturb combat RNG',()=>{
 const g=quiet(),random=seededRandom(27);g.lootRng=()=>0;const e=g.spawnEnemy('boss',8,8);random(); // spawn consumes one attack timer roll
 g.hit(e,99999,0,0);assert.equal(g.earnedWeaponTickets,1);assert.equal(g.progression.inventory.weaponTicket,1);assert.equal(g.rng(),random());g.hit(e,99999,0,0);assert.equal(g.earnedWeaponTickets,1);assert.equal(g.drainEvents().filter(e=>e.type==='weaponTicket').length,1);
 g.player.invincible=0;g.hurt(99999,0,0);assert.equal(g.phase,'defeat');const saved=normalizeProgression(JSON.parse(JSON.stringify(g.progression)),HEROES);assert.equal(saved.inventory.weaponTicket,1);const late=g.spawnEnemy('boss',8,8);g.hit(late,99999,0,0);assert.equal(g.progression.inventory.weaponTicket,1);
});
test('every chapter boss and strong-route boss can grant a ticket without needing the final gate',()=>{
 for(let act=0;act<8;act++)for(const elite of [false,true]){const g=quiet({act,progression:{story:{version:2,actClears:Array(28).fill(true)}}});g.lootRng=()=>0;const e=g.spawnEnemy('boss',10,10,{elite});g.hit(e,99999,0,0);assert.equal(g.progression.inventory.weaponTicket,1);assert.notEqual(g.phase,'victory');assert.equal(new Adventure({progression:g.progression}).progression.inventory.weaponTicket,1);}
});
test('gacha descriptions expose exact odds, locked-character storage and duplicate values and exact-name duplicate rules',()=>{
 const p=fresh(),html=weaponGachaView(p);assert.match(html,/5%で1枚/);assert.match(html,/75%/);assert.match(html,/20%/);assert.match(html,/約0.2381%/);assert.match(html,/同じ武器・同じレア度/);assert.match(html,/data-draw-weapon disabled/);for(const id of WEAPON_HERO_IDS)assert.ok(html.includes(`data-weapon-hero="${id}"`));
 p.inventory.weaponTicket=1;const r=roll(p,.8,.99),result=weaponDrawResult(r,p,true);assert.match(result,/加入後に使えるよう保管/);assert.match(result,/★4/);assert.match(result,/結果を保存/);assert.equal(WEAPON_CATALOG.length,70);
});

const allWeapons=()=>normalizeProgression({story:{version:2,actClears:Array(28).fill(true)},weapons:{version:2,owned:WEAPON_CATALOG.map(w=>w.id)},tutorial:{firstBattleCompleted:true}},HEROES);
test('each gacha hero has three distinct combat profiles at every gacha rarity and one starter',()=>{
 assert.equal(new Set(WEAPON_CATALOG.map(w=>w.id)).size,70);
 for(const hero of HEROES.filter(h=>WEAPON_HERO_IDS.includes(h.id)))for(const rank of [1,2,3,4]){
  const items=WEAPON_CATALOG.filter(w=>w.heroId===hero.id&&w.rarity.rank===rank);assert.equal(items.length,rank===1?1:3);
  const stats=new Set();for(const item of items){const p=allWeapons();assert.ok(equipWeapon(p,hero.id,item.id));stats.add(JSON.stringify({...combatStats(p,hero),...weaponAttackProfile(p,hero)}));assert.ok(weaponImage(item).startsWith('/assets/equipment/'));}assert.equal(stats.size,items.length);
 }
});
test('v1 migration keeps the previously automatic highest weapon; v2 preserves even a lower manual choice',()=>{
 const old=fresh();old.weapons={owned:['luna-staff-r2','luna-staff-r4','nox-rifle-r3'],draws:6,lastDraw:{weaponId:'nox-rifle-r3',duplicate:false}};
 const p=normalizeProgression(old,HEROES);assert.equal(equippedWeapon(p,'nyanluna').id,'luna-staff-r4');assert.equal(equippedWeapon(p,'tsukineko').id,'nox-rifle-r3');assert.ok(equipWeapon(p,'nyanluna','luna-staff-r2'));
 p.inventory.weaponTicket=1;roll(p,0,.99,.9);assert.equal(equippedWeapon(p,'nyanluna').id,'luna-staff-r2');
 const loaded=normalizeProgression(JSON.parse(JSON.stringify(p)),HEROES);assert.equal(equippedWeapon(loaded,'nyanluna').id,'luna-staff-r2');assert.deepEqual(loaded,p);assert.equal(equippedWeapon(new Adventure({progression:loaded}).progression,'nyanluna').id,'luna-staff-r2');
 p.weapons.loadout.nyanluna='made-up';assert.equal(normalizeProgression(p,HEROES).weapons.loadout.nyanluna,'luna-staff-r1');
});
test('only owned, character-specific weapons on recruited heroes can be equipped',()=>{
 const p=fresh();p.weapons.owned.push('nox-rifle-r4');
 for(const [hero,id] of [['nyanluna','selene-staff-r2'],['nyanluna','nox-rifle-r4'],['tsukineko','nox-rifle-r4'],['__proto__','luna-staff-r1'],['nyanluna','__proto__']]){const before=structuredClone(p);assert.equal(equipWeapon(p,hero,id),false);assert.deepEqual(p,before);}
});
test('different weapon families at the same rarity are new acquisitions, only exact duplicates convert',()=>{
 const p=fresh();p.inventory.weaponTicket=4;for(const type of [0,.34,.67])assert.equal(roll(p,0,.1,type).duplicate,false);
 assert.equal(p.weapons.owned.length,10);assert.equal(p.inventory.starBud,0);assert.equal(roll(p,0,.1,.34).duplicate,true);assert.equal(p.inventory.starBud,5);assert.equal(p.weapons.loadout.nyanluna,'luna-staff-r1');
});
test('speed and reach change actual attacks, stack with blessings, and retain support scaling',()=>{
 for(const [id,hero] of [['lilica-staff-r2',0],['artemis-rifle-r3',1],['hayate-saber-r4',2]]){
  const p=allWeapons();equipWeapon(p,HEROES[hero].id,id);const party=[HEROES[hero].id,HEROES[(hero+1)%3].id],g=quiet({progression:p,party,hero});g.rng=()=>1;
  g.player.x=0;g.player.z=0;const spec=weaponAttackProfile(p,HEROES[hero]);const e=g.spawnEnemy('boss',0,spec.range+.5);e.radius=.01;e.speed=0;e.hp=1e6;
  assert.equal(g.attackFrom(g.player,hero),false);g.skills.reach=2;assert.equal(g.attackFrom(g.player,hero),true);g.skills.haste=2;g.player.attack=0;g.partner.attack=0;g.tick(.01,{});assert.ok(Math.abs(g.player.attack-spec.interval*.85**2)<1e-9);
  g.activateHero((hero+1)%3);g.partner.x=0;g.partner.z=0;g.partner.attack=0;g.tick(.01,{});assert.ok(Math.abs(g.partner.attack-spec.interval*2.6*.85**2)<1e-9);
 }
});
test('gun variants stop after their actual advertised number of enemies',()=>{
 for(const [id,pierce] of [['gemini-gun-r2',1],['nox-rifle-r2',2],['artemis-rifle-r2',3]]){
  const p=allWeapons();equipWeapon(p,'tsukineko',id);const g=quiet({progression:p,party:['tsukineko'],hero:1});g.rng=()=>1;g.player.x=0;g.player.z=0;
  const targets=[2,3.5,5,6.5].map(z=>{const e=g.spawnEnemy('boss',0,z);e.speed=0;e.hp=1e6;e.attack=999;return e;});assert.equal(g.attackFrom(g.player,1),true);g.player.attack=999;
  for(let i=0;i<12;i++)g.tick(.025,{});assert.equal(targets.filter(e=>e.hp<1e6).length,pierce,id);
 }
});
test('guard weapon reduces only its owner damage and does not reset hero health or relics',()=>{
 const p=allWeapons();const defense=combatStats(p,HEROES[2]).defense;const before=HEROES.map(h=>combatStats(p,h));equipWeapon(p,'omsolo','aegis-saber-r4');assert.equal(combatStats(p,HEROES[2]).defense,defense+18);for(const i of [0,1])assert.deepEqual(combatStats(p,HEROES[i]),before[i]);
 const g=quiet({progression:p,hero:2,party:['omsolo','nyanluna']});g.player.invincible=0;const hp=g.player.hp;g.hurt(30,1,1);assert.ok(Math.abs(hp-g.player.hp-30*100/(100+defense+18))<1e-9);
});
test('equipment comparison uses actual stats and lists only owned weapons',()=>{
 const p=allWeapons();equipWeapon(p,'nyanluna','luna-staff-r2');const html=weaponLoadoutView(p,HEROES[0]);assert.match(html,/data-weapon-option="lilica-staff-r2"/);assert.match(html,/装備中との差 -0.14秒/);assert.match(html,/装備する/);assert.match(html,/通常攻撃に適用/);
 const initial=weaponLoadoutView(fresh(),HEROES[0]);assert.equal([...initial.matchAll(/data-weapon-option=/g)].length,1);assert.match(initial,/data-weapon-option="luna-staff-r1"/);assert.doesNotMatch(initial,/data-weapon-option="lilica|ガチャで入手|未所持/);
});
