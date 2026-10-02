import {contains,walkingLayout,navGrid,ROUTE_PORTALS} from './terrain.js';

const damage=(name,color,power)=>({name,color,kind:'damage',power,period:6.6,warning:1.3,active:1.7,note:'輪が満ちると噴出。予告中に離れるか、回避で通り抜けよう。'});
const slow=(name,color)=>({name,color,kind:'slow',speed:.72,note:'移動速度が28%低下。敵も減速する。回避の速さは変わらない。'});
const heal=(name,color)=>({name,color,kind:'heal',charges:3,note:'1秒ごとに最大HPの6%を回復。この床は1回の冒険で3回まで。'});
export const FLOOR_TYPES=Object.freeze({
 hehefire:damage('へへ炎の噴出口',0xffad77,64),ricewell:heal('おむすびの泉',0xffc9dc),hehewind:{name:'花弓の風路',color:0xffb0d4,kind:'boost',speed:1.3,note:'上を歩く間、移動速度が30%上昇。回避の速さは変わらない。'},
 starfall:damage('星屑の噴出口',0xf59e69,12),moonwell:heal('月光の泉',0x8bf0ba),
 bramble:damage('茨の芽吹き',0xf49357,28),water:slow('浅い用水路',0x65cced),tailwind:{name:'穂風の道',color:0xa9e7bd,kind:'boost',speed:1.3,note:'上を歩く間、移動速度が30%上昇。回避の速さは変わらない。'},
 nightmare:damage('夢蝕の染み',0xe776ba,42),caramel:slow('ねばねば蜜',0xeac16d),teawell:heal('癒しのミルクティー',0xb5eda5),
 hellfire:damage('魔炎の噴出口',0xff8067,64),seal:slow('重力の魔法陣',0xae8cf3),
 prism:damage('結晶の光脈',0xffa5b5,64),frost:slow('青晶の霜',0x89ddff),aurora:{name:'虹風の流路',color:0x9df5df,kind:'boost',speed:1.3,note:'上を歩く間、移動速度が30%上昇。回避の速さは変わらない。'},
});
export const CHAPTER_FLOORS=Object.freeze([['starfall','moonwell'],['bramble','water','tailwind'],['nightmare','caramel','teawell'],['hellfire','seal','moonwell'],['prism','frost','aurora'],['hehefire','ricewell','hehewind']]);
const patches=new Map(),paths=new Map();
const nearest=(nodes,point)=>nodes.reduce((best,n)=>Math.hypot(n.x-point.x,n.z-point.z)<Math.hypot(best.x-point.x,best.z-point.z)?n:best,nodes[0]);
// Reserve a corridor along the actual navigation graph, including both fork exits.
export function floorSafePaths(layout){
 if(paths.has(layout.id))return paths.get(layout.id);
 const {nodes}=navGrid(layout),start=nearest(nodes,layout.entrance),queue=[start.index],parent=new Map([[start.index,start.index]]);
 for(let i=0;i<queue.length;i++)for(const id of nodes[queue[i]].neighbors)if(!parent.has(id)){parent.set(id,queue[i]);queue.push(id);}
 const targets=layout.stairs?[layout.stairPoint]:layout.id.endsWith('fork')?ROUTE_PORTALS:[layout.exit],reserved=[layout.entrance];
 for(const target of targets){let n=nearest(nodes,target);reserved.push(target);for(let steps=0;n&&steps<nodes.length;steps++){reserved.push(n);if(n.index===start.index)break;n=nodes[parent.get(n.index)];}}
 paths.set(layout.id,reserved);return reserved;
}
export function floorPatchesFor(layout){
 if(patches.has(layout.id))return patches.get(layout.id);
 const chapter=layout.chapter??0,types=CHAPTER_FLOORS[chapter],walk=walkingLayout(layout),nodes=navGrid(walk).nodes,reserved=floorSafePaths(layout),result=[];
 const protectedPoints=[layout.entrance,layout.exit,{x:0,z:3},{x:-1.7,z:4.5},...(layout.stairs?[layout.stairPoint]:layout.id.endsWith('fork')?ROUTE_PORTALS:[])];
 const goals=[{x:-9,z:-3},{x:10,z:3},{x:-10,z:12}];
 for(const [i,type] of types.entries()){
  let chosen=null,radius=2.35;
  for(const r of [2.35,2.05,1.8]){
   const candidates=nodes.filter(n=>contains(walk,n.x,n.z,r+.45)&&protectedPoints.every(p=>Math.hypot(n.x-p.x,n.z-p.z)>r+2.5)&&reserved.every(p=>Math.hypot(n.x-p.x,n.z-p.z)>r+1.4)&&result.every(p=>Math.hypot(n.x-p.x,n.z-p.z)>r+p.radius+1));
   if(candidates.length){chosen=nearest(candidates,goals[i]);radius=r;break;}
  }
  if(chosen)result.push(Object.freeze({id:`${layout.id}:${type}`,type,x:chosen.x,z:chosen.z,radius}));
 }
 patches.set(layout.id,Object.freeze(result));return patches.get(layout.id);
}
export const floorContains=(patch,point)=>Math.hypot(patch.x-point.x,patch.z-point.z)<patch.radius;
export function floorState(game){
 game.floorRooms??=new Map();
 if(!game.floorRooms.has(game.layout.id))game.floorRooms.set(game.layout.id,{time:0,damageCooldown:0,healing:{}});
 return game.floorRooms.get(game.layout.id);
}
export const floorsEngaged=game=>!game.tutorial?.active&&!game.exitOpen&&!game.travelOpen&&(game.waveSpawned<game.waveGoal||game.enemies.some(e=>e.hp>0));
export function floorPhase(game,patch){
 const spec=FLOOR_TYPES[patch.type],state=floorState(game);
 if(!floorsEngaged(game))return {phase:'quiet',progress:0};
 if(spec.kind==='heal'&&(state.healing[patch.id]?.used??0)>=spec.charges)return {phase:'spent',progress:0};
 if(spec.kind!=='damage')return {phase:'active',progress:1};
 const t=state.time%spec.period,start=spec.period-spec.warning-spec.active;
 return t<start?{phase:'quiet',progress:0}:t<start+spec.warning?{phase:'warning',progress:(t-start)/spec.warning}:{phase:'active',progress:1};
}
export function advanceFloors(game,dt){
 const state=floorState(game);if(!floorsEngaged(game))return;
 state.time+=dt;state.damageCooldown=Math.max(0,state.damageCooldown-dt);
}
export function floorMovementScale(game,point,{enemy=false}={}){
 if(!floorsEngaged(game))return 1;
 const patch=floorPatchesFor(game.layout).find(p=>floorContains(p,point));if(!patch)return 1;
 const spec=FLOOR_TYPES[patch.type];return spec.kind==='slow'?spec.speed:spec.kind==='boost'&&!enemy?spec.speed:1;
}
export function tickFloors(game,dt){
 if(!floorsEngaged(game)||game.phase!=='playing')return;
 const state=floorState(game),player=game.player;
 for(const patch of floorPatchesFor(game.layout)){
  const spec=FLOOR_TYPES[patch.type],inside=floorContains(patch,player);
  if(spec.kind==='damage'&&inside&&floorPhase(game,patch).phase==='active'&&state.damageCooldown<=0){
   if(game.hurt(spec.power*(game.difficulty==='hard'?1.3:1),patch.x,patch.z)){state.damageCooldown=1.2;game.emit('floorDamage',{floor:spec.name,x:patch.x,z:patch.z});if(game.phase==='defeat')return;}
  }
  if(spec.kind==='heal'){
   const healing=state.healing[patch.id]??={used:0,elapsed:0};
   const recipients=game.mount.active?[player.hero,game.partnerHero]:[player.hero];
   if(!inside||healing.used>=spec.charges||!recipients.some(i=>{const h=game.healthFor(i);return h.hp>0&&h.hp<h.maxHp;})){healing.elapsed=0;continue;}
   healing.elapsed+=dt;if(healing.elapsed+1e-9<1)continue;healing.elapsed=0;healing.used++;
   for(const hero of recipients){const h=game.healthFor(hero);if(h.hp<=0)continue;const amount=Math.min(h.maxHp-h.hp,h.maxHp*.06);h.hp+=amount;if(amount>0)game.emit('heal',{hero,heroId:game.heroId(hero),amount});}
  }
 }
}
export function floorUnderfoot(game){return floorPatchesFor(game.layout).find(p=>floorContains(p,game.player));}
