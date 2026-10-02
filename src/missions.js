import {ACTS,actLabel} from './acts.js';
const firstAct=[
  {id:'meadow-hunt',area:0,metric:'kills',goal:24,name:'草原の影をはらう',description:'星詠みの草原で魔物を累計24体倒す',rewards:{starBud:4}},
  {id:'meadow-crystals',area:0,metric:'crystals',goal:12,name:'草原の光集め',description:'星詠みの草原でクリスタルを累計12個回収',rewards:{moonDew:1}},
  {id:'meadow-clear',area:0,metric:'clears',goal:1,name:'最初の月の門',description:'星詠みの草原の月の門を突破',rewards:{starBud:6}},
  {id:'meadow-trial',area:0,metric:'trials',goal:1,name:'星露の試練',description:'チャレンジモードの草原を55秒以内・被弾1回以下で突破',rewards:{},equipment:'meadow-charm',trial:{seconds:55,hits:1}},
  {id:'ruins-hunt',area:1,metric:'kills',goal:40,name:'眠れる街の見回り',description:'月影の遺跡で魔物を累計40体倒す',rewards:{starBud:8}},
  {id:'ruins-crystals',area:1,metric:'crystals',goal:20,name:'遺跡の光集め',description:'月影の遺跡でクリスタルを累計20個回収',rewards:{moonDew:1}},
  {id:'ruins-clear',area:1,metric:'clears',goal:1,name:'月影を越えて',description:'月影の遺跡の月の門を突破',rewards:{starBud:9}},
  {id:'ruins-trial',area:1,metric:'trials',goal:1,name:'月影の試練',description:'チャレンジモードの遺跡を70秒以内・被弾1回以下で突破',rewards:{},equipment:'ruins-lens',trial:{seconds:70,hits:1}},
  {id:'dawn-hunt',area:2,metric:'kills',goal:27,name:'夜明けを取り戻せ',description:'暁の聖域で魔物を累計27体倒す',rewards:{wardenCore:1}},
  {id:'dawn-crystals',area:2,metric:'crystals',goal:24,name:'聖域の光集め',description:'暁の聖域でクリスタルを累計24個回収',rewards:{moonDew:2}},
  {id:'dawn-clear',area:2,metric:'clears',goal:1,name:'暁の向こうへ',description:'暁の聖域の最後の月の門を突破',rewards:{starBud:12}},
  {id:'dawn-trial',area:2,metric:'trials',goal:1,name:'暁守の試練',description:'チャレンジモードの聖域を80秒以内・ノーダメージで突破',rewards:{},equipment:'dawn-seal',trial:{seconds:80,hits:0}},
];
const added=ACTS.slice(1).flatMap(act=>[
  ...act.stages.flatMap((stage,area)=>[
    {id:`act${act.id+1}-${area}-hunt`,act:act.id,area,metric:'kills',goal:act.counts[area*2]+act.counts[area*2+1],name:`${stage.name}の影をはらう`,description:`${stage.name}で魔物を累計${act.counts[area*2]+act.counts[area*2+1]}体倒す`,rewards:{starBud:6+act.id*2}},
    {id:`act${act.id+1}-${area}-crystals`,act:act.id,area,metric:'crystals',goal:20+area*4,name:`${stage.name}の光集め`,description:`${stage.name}でクリスタルを累計${20+area*4}個回収`,rewards:{moonDew:Math.floor((3+act.id)/2)}},
    {id:`act${act.id+1}-${area}-clear`,act:act.id,area,metric:'clears',goal:1,name:`${stage.name}を越えて`,description:`${stage.name}の月の門を突破`,rewards:area===2?{wardenCore:1}:{starBud:8+act.id*2}},
    // Separate claims preserve the rewards of old missions and let existing saves earn the new materials.
    ...(act.id>=4?[{id:`act${act.id+1}-${area}-rare-material`,act:act.id,area,metric:'clears',goal:1,name:`${stage.name}・希少素材`,description:`${stage.name}の月の門を突破し、この幕の全6WAVEをクリア（冒険モードでも可）`,rewards:act.id>=12?(area===2?{astralCore:1,demonHeart:1}:{moonPrism:1,bloodCrystal:3}):area===2?{astralCore:1}:{moonPrism:1}}]:[]),
  ]),
  {id:`act${act.id+1}-relic`,act:act.id,area:2,metric:'trials',goal:1,name:['','時の試練','雲海の試練','双星の試練','木漏れ日の試練','翡翠の試練','灰鐘の試練','守り手の試練','桜もちの試練','夢砂糖の試練','こだまの試練','ふぇ〜の約束','黒薔薇の試練','安らぎの夜鈴','月雫の親友試練','優しき魔王の試練','はじまりの晶針','オーロラの翼試練','星虹の心結び','虹還りの試練'][act.id]??`${act.title}・鎮静の試練`,description:`${actLabel(act.id)}の全6WAVEをチャレンジモード・${[0,180,195,210,230,245,260,280,300,320,340,360][act.id]??420+((act.id-12)%4)*20}秒以内・被弾1回以下でクリア`,rewards:act.id>=12?{bloodCrystal:6,demonHeart:2}:act.id>=8?{astralCore:2,moonPrism:4}:{},equipment:['','clock-pendant','cloud-feather','twin-star-knot','woodland-token','jade-guard','bell-fragment','guardian-knot','mochi-sakura-brooch','mochi-dream-hourglass','mochi-echo-bell-relic','mochi-promise-crown','demon-crimson-rose','demon-lullaby-charm','demon-moon-drop-knot','demon-kind-king-crown','prism-first-light','aurora-wing-charm','prism-heart-knot','prism-home-crown'][act.id],trial:{seconds:[0,180,195,210,230,245,260,280,300,320,340,360][act.id]??420+((act.id-12)%4)*20,hits:1,chapter:true}},
  {id:act.id===3?'chapter-master':`act${act.id+1}-master`,act:act.id,area:2,metric:'chapterMaster',goal:1,name:act.id===3?'限界を越えるふたり':`${act.title}・限界試練`,description:`${actLabel(act.id)}の全6WAVEをチャレンジモード・${[0,180,195,210,230,245,260,280,300,320,340,360][act.id]??420+((act.id-12)%4)*20}秒以内・ノーダメージでクリア（単独出撃も可）`,rewards:{limitStone:1},trial:{seconds:[0,180,195,210,230,245,260,280,300,320,340,360][act.id]??420+((act.id-12)%4)*20,hits:0,chapter:true}},
]);
export const STAGE_MISSIONS=Object.freeze([...firstAct.map(m=>({...m,act:0})),...added]);
export const missionIndex=(act,area)=>act*3+area;
export const missionsFor=(area,act=0)=>STAGE_MISSIONS.filter(m=>m.area===area&&m.act===act);
export const missionsForAct=act=>STAGE_MISSIONS.filter(m=>m.act===act);
export function trialStatus(mission,game){
  if(!mission.trial||!game||mission.act!==game.act)return null;
  const rule=mission.trial,seconds=rule.chapter?game.time:game.time-game.stageTrial.startedAt,hits=rule.chapter?game.runHits:game.stageTrial.hits;
  return {seconds,hits,hard:game.difficulty==='hard',withinTime:seconds<=rule.seconds,withinHits:hits<=rule.hits,eligible:game.difficulty==='hard'&&seconds<=rule.seconds&&hits<=rule.hits};
}
export function normalizeMissions(raw){
  const stages=Array.from({length:(Math.max(...ACTS.map(a=>a.id))+1)*3},(_,i)=>Object.fromEntries(missionsFor(i%3,Math.floor(i/3)).map(m=>{const source=raw?.version!==2&&m.id==='chapter-master'?2:i,n=raw?.stages?.[source]?.[m.metric];return [m.metric,Number.isFinite(n)&&n>=0?Math.min(m.goal,Math.floor(n)):0];})));
  const claimed=STAGE_MISSIONS.filter(m=>Array.isArray(raw?.claimed)&&raw.claimed.includes(m.id)&&stages[missionIndex(m.act,m.area)][m.metric]>=m.goal).map(m=>m.id);
  return {version:2,stages,claimed};
}
// Counters survive a retreat; rewards are only claimed after all six waves and the final gate.
export function advanceMissions(book,area,metric,amount=1,act=0){
  const mission=missionsFor(area,act).find(m=>m.metric===metric);if(!mission||!Number.isFinite(amount)||amount<=0)return {changed:false,completed:[]};
  const stage=book.stages[missionIndex(act,area)],previous=stage[metric];stage[metric]=Math.min(mission.goal,previous+Math.floor(amount));
  return {changed:previous!==stage[metric],completed:[]};
}
export function claimActMissions(book,act){
  const ready=missionsForAct(act).filter(m=>book.stages[missionIndex(act,m.area)][m.metric]>=m.goal&&!book.claimed.includes(m.id));
  book.claimed.push(...ready.map(m=>m.id));return ready;
}
