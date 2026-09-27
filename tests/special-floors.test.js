import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {FIELD_LAYOUTS,EXTRA_FIELD_LAYOUTS,contains,walkingLayout,navGrid,ROUTE_PORTALS} from '../src/terrain.js';
import {FLOOR_TYPES,floorPatchesFor,floorState,floorPhase,floorMovementScale} from '../src/special-floors.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const profile={story:{version:2,actClears:Array(20).fill(true),extraClears:[true,true,true]},tutorial:{firstBattleCompleted:true},characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:60,breaks:4}]))};
function arena(act=12,options={}){
 const g=new Adventure({act,hero:1,party:['tsukineko','prim'],progression:profile,seed:3,...options});
 g.enemies=[];g.waveSpawned=0;g.spawnTimer=999;g.player.attack=g.partner.attack=999;g.player.invincible=0;g.drainEvents();return g;
}
const tick=(g,seconds,input)=>{for(let t=0;t<Math.round(seconds*60);t++)g.tick(1/60,input);};
const patch=(g,kind)=>floorPatchesFor(g.layout).find(p=>FLOOR_TYPES[p.type].kind===kind);
function stand(g,p){Object.assign(g.player,{x:p.x,z:p.z});}
test('chapter silhouettes differ, and every normal/extra room has safe floor placement and a clear route to every gate',()=>{
 const signatures=FIELD_LAYOUTS.filter((_,i)=>i%4===0).map(a=>JSON.stringify(a[0].rooms[0].points));assert.equal(new Set(signatures).size,5);
 for(const field of [...FIELD_LAYOUTS,...EXTRA_FIELD_LAYOUTS].flat())for(const layout of field.rooms){
  const patches=floorPatchesFor(layout),walk=walkingLayout(layout);assert.ok(patches.length>=2&&patches.length<=3,layout.id);assert.equal(patches.filter(p=>FLOOR_TYPES[p.type].kind==='damage').length,1,layout.id);
  for(const p of patches){assert.ok(contains(walk,p.x,p.z,p.radius+.4),p.id);for(const q of patches)if(p!==q)assert.ok(Math.hypot(p.x-q.x,p.z-q.z)>p.radius+q.radius+.9,p.id);for(const q of [layout.entrance,layout.exit,{x:0,z:3}])assert.ok(Math.hypot(p.x-q.x,p.z-q.z)>p.radius+2,p.id);}
  const nodes=navGrid(layout).nodes,clear=n=>patches.every(p=>Math.hypot(p.x-n.x,p.z-n.z)>p.radius+.8),nearest=p=>nodes.reduce((a,b)=>Math.hypot(b.x-p.x,b.z-p.z)<Math.hypot(a.x-p.x,a.z-p.z)?b:a),start=nearest(layout.entrance),seen=new Set([start.index]),queue=[start.index];
  for(let i=0;i<queue.length;i++)for(const n of nodes[queue[i]].neighbors)if(!seen.has(n)&&clear(nodes[n])){seen.add(n);queue.push(n);}
  for(const target of layout.stairs?[layout.stairPoint]:field.kind==='branch'&&field.rooms[0]===layout?ROUTE_PORTALS:[layout.exit])assert.ok(seen.has(nearest(target).index),`${layout.id}: blocked gate`);
 }
});
test('floor damage waits for its tell, respects defense and immunity, counts hits, and never ticks per frame',()=>{
 const g=arena(),p=patch(g,'damage'),spec=FLOOR_TYPES[p.type];stand(g,p);const hp=g.player.hp;
 floorState(g).time=3.65;tick(g,.5);assert.equal(floorPhase(g,p).phase,'warning');assert.equal(g.player.hp,hp);
 tick(g,.8);assert.equal(floorPhase(g,p).phase,'active');near(hp-g.player.hp,spec.power*100/(100+g.statsFor(g.player.hero).defense));assert.equal(g.runHits,1);
 tick(g,.7);assert.equal(g.runHits,1);assert.equal(g.stageTrial.hits,1);
 const immune=arena();stand(immune,patch(immune,'damage'));floorState(immune).time=4.91;immune.player.invincible=2;tick(immune,1);assert.equal(immune.runHits,0);
});
test('damage applies only inside the circle, uses challenge scaling, and leaves the support hero unharmed',()=>{
 const damage=[];
 for(const difficulty of ['normal','hard']){const g=arena(12,{difficulty}),p=patch(g,'damage'),hp=g.player.hp,partnerHp=g.healthFor(g.partnerHero).hp;floorState(g).time=4.91;stand(g,{x:p.x+p.radius+.2,z:p.z});tick(g,.1);assert.equal(g.player.hp,hp);stand(g,p);tick(g,.1);damage.push(hp-g.player.hp);assert.equal(g.healthFor(g.partnerHero).hp,partnerHp);}
 near(damage[1],damage[0]*1.3);
});
test('slow and boost floors alter walking, slow enemy movement, and preserve dash speed',()=>{
 for(const [act,kind,scale] of [[4,'slow',.72],[4,'boost',1.3],[16,'slow',.72],[16,'boost',1.3]]){
  const g=arena(act),p=patch(g,kind);stand(g,p);const x=g.player.x;tick(g,.05,{x:1,z:0});near(g.player.x-x,HEROES[1].moveSpeed*scale*.05);near(floorMovementScale(g,p,{enemy:true}),kind==='slow'?.72:1);
  stand(g,p);g.dash(1,0);tick(g,.05,{x:1,z:0});near(g.player.x-p.x,HEROES[1].dashSpeed*.05);
 }
});
test('healing wells have three charges per room, cannot revive support, and cannot be reset by leaving or switching waves',()=>{
 const g=arena(8),p=patch(g,'heal');stand(g,p);g.player.hp=g.player.maxHp*.5;const hp=g.player.hp,max=g.player.maxHp;g.healthFor(g.partnerHero).hp=0;
 tick(g,3.2);near(g.player.hp,hp+max*.18);assert.equal(floorPhase(g,p).phase,'spent');assert.equal(g.healthFor(g.partnerHero).hp,0);
 stand(g,g.layout.entrance);tick(g,.2);stand(g,p);tick(g,3);near(g.player.hp,hp+max*.18);
 g.startWave();g.spawnTimer=999;g.player.attack=999;const afterWave=g.player.hp;tick(g,2);assert.equal(g.player.hp,afterWave);assert.equal(floorPhase(g,p).phase,'spent');
 const full=arena(8),well=patch(full,'heal');stand(full,well);tick(full,2);assert.equal(floorState(full).healing[well.id].used,0);
});
test('mounting keeps independent damage/defense and lets both living riders share one healing charge',()=>{
 const g=arena(12),p=patch(g,'damage');g.mountPrim();stand(g,p);floorState(g).time=4.91;
 const before=g.partyHeroes.map(i=>g.healthFor(i).hp);tick(g,.05);
 g.partyHeroes.forEach((i,n)=>near(before[n]-g.healthFor(i).hp,FLOOR_TYPES[p.type].power*100/(100+g.statsFor(i).defense)));
 const healing=arena(8),well=patch(healing,'heal');healing.mountPrim();stand(healing,well);for(const i of healing.partyHeroes)healing.healthFor(i).hp=healing.healthFor(i).maxHp*.5;
 tick(healing,1.05);for(const i of healing.partyHeroes)near(healing.healthFor(i).hp,healing.healthFor(i).maxHp*.56);assert.equal(floorState(healing).healing[well.id].used,1);
});
test('floor state freezes during pause, dialogue and choices; tutorial and cleared rooms remain safe',()=>{
 for(const phase of ['paused','upgrade','transition','victory','defeat']){const g=arena(),p=patch(g,'damage');stand(g,p);floorState(g).time=4.91;const before=structuredClone(floorState(g)),hp=g.player.hp;g.phase=phase;tick(g,2);assert.deepEqual(floorState(g),before);assert.equal(g.player.hp,hp);}
 for(const cleared of ['exit','travel','enemies']){const g=arena(),p=patch(g,'damage');stand(g,p);floorState(g).time=4.91;const hp=g.player.hp;if(cleared==='exit')g.exitOpen=true;else if(cleared==='travel')g.travelOpen='branch';else{g.waveSpawned=g.waveGoal;g.waveBreak=-999;}tick(g,1);assert.equal(g.player.hp,hp);assert.equal(floorPhase(g,p).phase,'quiet');}
 const tutorial=arena(0,{tutorial:true});const p=patch(tutorial,'damage');stand(tutorial,p);floorState(tutorial).time=4.91;const hp=tutorial.player.hp;tick(tutorial,2);assert.equal(tutorial.player.hp,hp);assert.equal(floorPhase(tutorial,p).phase,'quiet');
});
test('a lethal damage floor uses normal ally takeover and defeat instead of leaving a dead active hero',()=>{
 for(const living of [true,false]){const g=arena(),p=patch(g,'damage'),lead=g.player.hero,other=g.partnerHero;stand(g,p);g.player.hp=1;if(!living)g.healthFor(other).hp=0;floorState(g).time=4.91;tick(g,.05);assert.equal(g.healthFor(lead).hp,0);assert.equal(g.phase,living?'playing':'defeat');if(living)assert.equal(g.player.hero,other);else assert.equal(g.drainEvents().filter(e=>e.type==='defeat').length,1);}
});
