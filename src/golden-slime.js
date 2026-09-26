import {clearPath,contains} from './terrain.js';

export const GOLDEN_SLIME=Object.freeze({
  type:'goldenSlime',name:'金色のスライム',chance:.20,lifetime:20,tickets:10,stones:1,
  hp:1100,speed:4.6,damage:0,radius:.76,role:'逃げるレア敵',chapter:2,rare:true,
  hint:'20秒で逃走。追いかけて倒すと撃破者EXP1,500・相方EXP750・大量の素材・武器ガチャ券10枚・覚醒の輝石1個！ もちにゃふぇの援護で足止めできる。',
  xp:1500,crystals:0,buds:100,
  materials:Object.freeze({starBud:100,moonDew:20,wardenCore:10,moonPrism:15,astralCore:5}),
});

// A separate RNG keeps rare encounters from changing regular waves or drop rolls.
// Story chapter 3 rolls once per wave. Its extra guarantees exactly one, on wave 1.
export function goldenSlimeWave(act,rng,wave){
  if(act.chapter!==2||act.extra||rng()>=GOLDEN_SLIME.chance)return null;
  return wave;
}
export function guaranteedExtraRareWave(act){
  return act.chapter===2&&act.extra?1:null;
}

export function fleeGoldenSlime(game,e,dt,slow=1){
  e.fleeTimer=(e.fleeTimer??0)-dt;
  if(e.fleeTimer<=0||!e.fleeDirection){
    const away=Math.atan2(e.x-game.player.x,e.z-game.player.z),layout=game.walkLayout;
    let best=null,score=-Infinity;
    // Inspect legal paths ahead, so narrow bridges and concave corners do not trap it.
    for(const distance of [3,1])for(let i=0;i<16;i++){
      const angle=away+i*Math.PI/8,dx=Math.sin(angle),dz=Math.cos(angle);
      const goal={x:e.x+dx*distance,z:e.z+dz*distance};
      if(!contains(layout,goal.x,goal.z,e.radius)||!clearPath(layout,e,goal,e.radius))continue;
      const separation=Math.hypot(goal.x-game.player.x,goal.z-game.player.z);
      const continuity=e.fleeDirection?dx*e.fleeDirection.x+dz*e.fleeDirection.z:0;
      const value=separation+.6*continuity+.1*distance;
      if(value>score){score=value;best={x:dx,z:dz};}
    }
    e.fleeDirection=best??{x:0,z:0};e.fleeTimer=.3;
  }
  const dir=e.fleeDirection;e.face=Math.atan2(dir.x,dir.z);
  e.x+=dir.x*e.speed*slow*dt;e.z+=dir.z*e.speed*slow*dt;
}

export function goldenSlimeHud(game){
  const encounter=game.goldenSlime;if(!encounter)return '';
  if(encounter.status==='active'){
    const remaining=Math.max(0,encounter.expiresAt-game.time),seconds=Math.ceil(remaining);
    return `<div class="rare-heading"><span>RARE · 金色のスライム</span><strong>逃走まで ${seconds}秒</strong></div><div class="rare-timer" role="progressbar" aria-label="金色のスライムの逃走まで" aria-valuemin="0" aria-valuemax="20" aria-valuenow="${seconds}"><i style="width:${seconds/GOLDEN_SLIME.lifetime*100}%"></i></div><p>討伐で <b>ガチャ券10枚</b> ＋輝石1個・大量EXP・素材</p>`;
  }
  if(game.time-encounter.resolvedAt>6)return '';
  return encounter.status==='defeated'?`<div class="rare-heading"><strong>金色のスライム 討伐！ この冒険 ${game.goldenSlimeKills}体</strong></div><p><b>ガチャ券10枚</b>・覚醒の輝石1個・大量EXP・素材を獲得</p>`:'<div class="rare-heading"><strong>金色のスライムは逃げていった…</strong></div><p>また出会ったら、援護で足止めしよう</p>';
}
