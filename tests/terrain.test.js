import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure} from '../src/model.js';
import {FIELD_LAYOUTS,ROUTE_REWARD,contains,walkingLayout,navGrid,navigation,moveWithin,spawnPoint,heightAt} from '../src/terrain.js';
import {botInput,chooseOffer} from './bot.js';
const unlocked={story:{version:2,actClears:[true,true,true,true],tsukinekoUnlocked:true},characters:{nyanluna:{level:20},tsukineko:{level:20}}};
function room(act,area){const g=new Adventure({seed:1,act,progression:unlocked});g.wave=area*2+1;g.area=area;g.waveSpawned=g.waveGoal=1;g.waveBreak=0;g.enemies=[];g.player.attack=g.partner.attack=999;g.drainEvents();return g;}
function open(g){for(let i=0;i<150&&!g.travelOpen;i++)g.tick(1/60);assert.ok(g.travelOpen);g.drainEvents();}
function walk(g,target){for(let i=0;i<1800&&g.travelOpen;i++){while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));g.tick(1/60,g.directionTo(target));}assert.equal(g.travelOpen,null);}
test('twelve stages contain four two-floor stages, four forks and four single stages, with 24 named rooms',()=>{
 const fields=FIELD_LAYOUTS.slice(0,4).flat(),rooms=fields.flatMap(f=>f.rooms);assert.equal(fields.length,12);for(const kind of ['single','floors','branch'])assert.equal(fields.filter(f=>f.kind===kind).length,4);assert.equal(new Set(rooms.map(r=>r.id)).size,24);assert.ok(new Set(rooms.map(r=>JSON.stringify(r.points))).size>=8);
});
test('every room has a connected navigation mesh and a reachable entrance',()=>{
 for(const f of FIELD_LAYOUTS.flat())for(const l of f.rooms){const layout=walkingLayout(l),nodes=navGrid(layout).nodes;assert.ok(contains(layout,l.entrance.x,l.entrance.z,.65),l.id);assert.ok(nodes.length>70,l.id);const seen=new Set([0]),queue=[0];for(let i=0;i<queue.length;i++)for(const id of nodes[queue[i]].neighbors)if(!seen.has(id)){seen.add(id);queue.push(id);}assert.equal(seen.size,nodes.length,l.id);}
});
test('navigation walks around corners and gaps instead of crossing the void',()=>{
 const fork=FIELD_LAYOUTS[5][2].rooms[0],target={x:-12,z:-13};let corner={x:-7.355064667461669,z:-1.8506923808358942};
 for(let i=0;i<600&&Math.hypot(corner.x-target.x,corner.z-target.z)>1;i++){const d=navigation(fork,corner,target),n=Math.hypot(d.x,d.z)||1;corner=moveWithin(fork,corner,corner.x+d.x/n*.1,corner.z+d.z/n*.1);}
 assert.ok(Math.hypot(corner.x-target.x,corner.z-target.z)<1,'Fork navigation must use the same clearance as walking collision');
 for(const f of FIELD_LAYOUTS.flat())for(const l of f.rooms){let p={...l.entrance};const target=l.stairs?l.stairPoint:f.kind==='branch'&&l===f.rooms[0]?{x:12,z:-13}:l.exit;for(let i=0;i<3000&&Math.hypot(p.x-target.x,p.z-target.z)>1;i++){const d=navigation(l,p,target),n=Math.hypot(d.x,d.z)||1;p=moveWithin(l,p,p.x+d.x/n*.16,p.z+d.z/n*.16);assert.ok(contains(l,p.x,p.z,.64),l.id);}assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<=1,l.id);}
 const bridge=FIELD_LAYOUTS[2][2].rooms[0],p={x:-9,z:-12},after=moveWithin(bridge,p,-9,12);assert.ok(after.z<0);assert.ok(contains(bridge,after.x,after.z,.6));
});
test('regular spawn positions stay on the actual floor, including narrow bridges and upper crescents',()=>{
 for(const f of FIELD_LAYOUTS.flat())for(const raw of f.rooms){const l=walkingLayout(raw);for(let i=0;i<80;i++){const p=spawnPoint(l,l.entrance,i/80*Math.PI*2);assert.ok(contains(l,p.x,p.z,.8),`${l.id}: ${p.x},${p.z}`);assert.ok(Math.hypot(p.x-l.entrance.x,p.z-l.entrance.z)>=7,l.id);}}
});
test('stairs remain blocked during combat and only open after the lower floor is cleared',()=>{
 const g=room(0,1);g.waveSpawned=0;g.spawnTimer=999;g.player.z=-5;for(let i=0;i<100;i++)g.tick(1/60,{x:0,z:-1});assert.ok(g.player.z>-7);assert.equal(g.travelOpen,null);assert.equal(g.enterPassage('stairs'),false);g.waveSpawned=1;open(g);assert.equal(g.travelOpen,'stairs');assert.equal(g.wave,3);assert.equal(g.enterPassage('stairs'),false);assert.equal(heightAt(g.layout,0,-16.6),4.5);
});
test('walking upstairs retains all blessings, XP, crystal progress, cap and HP with the normal wave heal',()=>{
 const g=room(0,1);g.skills={power:2,vitality:1};g.refreshStats();g.stageCrystals=7;g.player.hp=85;g.ultimateCharges.nyanluna=61;const profile=structuredClone(g.progression);open(g);walk(g,g.travelTargets[0]);assert.equal(g.wave,4);assert.equal(g.layout.height,4.5);assert.deepEqual(g.skills,{power:2,vitality:1});assert.equal(g.stageCrystals,7);assert.equal(g.player.hp,107);assert.equal(g.ultimateCharges.nyanluna,61);assert.deepEqual(g.progression,profile);assert.equal(g.enterPassage('stairs'),false);assert.equal(g.projectiles.length,0);assert.equal(g.hazards.length,0);
});
test('pause freezes a passage; collected crystal offers must be resolved before travelling',()=>{
 const g=room(0,1);g.orbs=[{id:999,x:14,z:14,value:8,age:0}];open(g);assert.equal(g.phase,'upgrade');const before=g.snapshot();g.tick(.05,{x:0,z:-1});assert.deepEqual(g.snapshot(),before);g.chooseSkill(g.offers[0].id);g.pause();const paused=g.snapshot();g.tick(.05);assert.deepEqual(g.snapshot(),paused);g.resume();walk(g,g.travelTargets[0]);assert.equal(g.blessingsTaken,1);assert.equal(g.wave,4);
});
for(const route of ['safe','elite'])test(`all four forks can physically select ${route} exactly once and preserve the run`,()=>{
 for(let act=0;act<4;act++){const area=FIELD_LAYOUTS[act].findIndex(f=>f.kind==='branch'),g=room(act,area);g.skills={haste:2};open(g);assert.equal(g.travelTargets.length,2);assert.equal(g.enterPassage(route),false);walk(g,g.travelTargets.find(t=>t.id===route));assert.equal(g.route,route);assert.equal(g.wave,area*2+2);assert.equal(g.rank('haste'),2);assert.equal(g.enterPassage(route==='elite'?'safe':'elite'),false);assert.equal(g.waveGoal,g.actConfig.counts[g.wave-1]+Number(route==='elite'&&g.wave!==6));
  g.enemies=[];g.waveSpawned=g.waveGoal-1;g.spawn();const last=g.enemies.at(-1);assert.equal(last.elite,route==='elite');if(route==='elite'){assert.equal(last.type,'boss');assert.ok(last.damage>22);}
 }
});
test('an elite boss awards the advertised extra materials once; safe bosses do not',()=>{
 const g=room(1,1);g.wave=4;g.route='elite';const boss=g.spawnEnemy('boss',0,-4,{elite:true});g.hit(boss,999999,0,0);const saved=structuredClone(g.progression);assert.equal(g.earnedMaterials.starBud,3+ROUTE_REWARD.starBud);assert.equal(g.earnedMaterials.moonDew,ROUTE_REWARD.moonDew);assert.equal(g.earnedMaterials.wardenCore,1+ROUTE_REWARD.wardenCore);assert.deepEqual(g.routeRewards,[1]);g.hit(boss,999999,0,0);assert.deepEqual(g.progression,saved);
 const safe=room(1,1);safe.hit(safe.spawnEnemy('boss',0,-4),999999,0,0);assert.deepEqual(safe.routeRewards,[]);assert.equal(safe.earnedMaterials.moonDew,0);
});
for(const difficulty of ['normal','hard'])test(`all four elite routes and upper floors are completable with earned level 20, ${difficulty}`,()=>{
 for(let act=0;act<4;act++){
  const g=new Adventure({act,seed:3,hero:1,difficulty,progression:unlocked});g.auditRoute='elite';const visited=new Set(),passages=[];
  for(let f=0;f<60*480;f++){while(g.phase==='upgrade')g.chooseSkill(chooseOffer(g));if(g.phase==='transition')g.advanceStage();if(g.phase!=='playing')break;visited.add(g.layout.id);g.tick(1/60,botInput(g));for(const e of g.drainEvents())if(e.type==='passageEntered')passages.push(e.kind);assert.ok(contains(g.walkLayout,g.player.x,g.player.z,.6));if(g.hasPartner)assert.ok(contains(g.walkLayout,g.partner.x,g.partner.z,.5));}
  assert.equal(g.phase,'victory',JSON.stringify({act,wave:g.wave,phase:g.phase,hp:g.player.hp,layout:g.layout.id,travel:g.travelOpen}));assert.ok(passages.includes('stairs')&&passages.includes('branch'));assert.equal(visited.size,5);assert.equal(g.routeRewards.length,1);assert.equal(g.kills,g.actConfig.counts.reduce((a,b)=>a+b)+(act===0?0:1));
 }
});
