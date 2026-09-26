import {ultimateBonuses} from './talents.js';
export const ULTIMATES=Object.freeze({
  shizuku:Object.freeze({id:'crimson-mercy',name:'紅月の鎌',icon:'sword',color:0xf2a6c7,kind:'scytheDance',radius:6,pulses:5,interval:.25,duration:1.25,baseDamage:52,heal:18,immunity:1.8,note:'大鎌で周囲を5回斬り、実ダメージの10%を吸収。発動時HP18回復。'}),
  mochinyafe:Object.freeze({id:'mochi-lullaby',name:'ふぇ〜・やさしい世界',icon:'heart',color:0xffb8d4,kind:'mochiLullaby',radius:8,pulses:3,interval:.8,duration:2.4,baseDamage:7,heal:36,immunity:1.5,note:'3回の声で周囲を包み、HPを36回復。雑魚を3秒停止、ボスの攻撃・防御を7秒間40%低下。'}),
  omsolo:Object.freeze({id:'emerald-vow',name:'翠光・守り手の円舞',icon:'sword',color:0xaaffba,kind:'bladeDance',radius:6.5,pulses:5,interval:.22,duration:1.1,baseDamage:56,heal:28,immunity:1.6,note:'周囲を5回斬り払い、HPを28回復。発動中は無敵。移動・交代しても剣舞を続ける。'}),
  nyanluna:Object.freeze({id:'moon-sanctuary',name:'月華の聖域',icon:'moon',color:0xdfbaff,kind:'sanctuary',radius:8.5,pulses:4,interval:.65,duration:2.6,baseDamage:60,heal:24,slow:.55,bossSlow:.8,immunity:1.5,note:'月の魔法陣で4回の範囲攻撃。敵を減速し、発動時にHPを24回復。'}),
  tsukineko:Object.freeze({id:'comet-barrage',name:'星銃・彗星連射',icon:'gun',color:0x89edff,kind:'barrage',shots:8,interval:.11,range:20,speed:38,pierce:3,baseDamage:38,immunity:.9,note:'敵を自動で狙う8連射。各弾は3体まで貫通。移動や交代をしても撃ち切る。'}),
});
export function ultimateFor(heroId,character){
  const base=ULTIMATES[heroId];if(!base||!character)return base;
  const bonus=ultimateBonuses(character,heroId),spec={...base,power:1+bonus.ultimateDamage,chargeMultiplier:1+bonus.ultimateCharge};
  spec.baseDamage*=spec.power;spec.immunity+=bonus.ultimateImmunity;
  if(spec.kind==='barrage'){
    spec.shots+=bonus.ultimateShots;spec.pierce+=bonus.ultimatePierce;spec.range+=bonus.ultimateRange;
    spec.note=`敵を自動で狙う${spec.shots}連射。各弾は${spec.pierce}体まで貫通。移動や交代をしても撃ち切る。`;
  }else{
    spec.pulses+=bonus.ultimatePulses;spec.duration+=bonus.ultimatePulses*spec.interval;spec.heal+=bonus.ultimateHeal;spec.radius+=bonus.ultimateRadius;
    spec.note=spec.kind==='scytheDance'?`大鎌で周囲を${spec.pulses}回斬り、実ダメージの10%以上をHP吸収。発動時HP${spec.heal}回復。`:spec.kind==='mochiLullaby'?`${spec.pulses}回のふぇ〜で周囲を包み、HPを${spec.heal}回復。雑魚を3秒停止、ボスの攻撃・防御を7秒間40%低下。`:spec.kind==='sanctuary'?`月の魔法陣で${spec.pulses}回の範囲攻撃。敵を減速し、発動時にHPを${spec.heal}回復。`:`周囲を${spec.pulses}回斬り払い、HPを${spec.heal}回復。発動中は無敵。移動・交代しても剣舞を続ける。`;
  }
  return spec;
}
