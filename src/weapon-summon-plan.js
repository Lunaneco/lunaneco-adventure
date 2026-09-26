// Presentation only: the weapon is drawn and saved before a plan exists.
// Signals are honest. A colour promises at least its rarity and never downgrades.
export const SUMMON_SIGNALS=Object.freeze({
  blue:Object.freeze({rank:2,color:'#86d5ff',glow:'#3fb4ff'}),
  purple:Object.freeze({rank:3,color:'#d0a9ff',glow:'#a86bff'}),
  gold:Object.freeze({rank:4,color:'#ffd580',glow:'#ffb938'}),
});
export const SIGNAL_FOR_RANK=Object.freeze({2:'blue',3:'purple',4:'gold'});
// Seconds in weapon-summon-v1.mp4: the altar is still cyan until 1.0 and the
// supplied staff enters at 6.44, so the clip ends at 6.25.
export const SUMMON_VIDEO=Object.freeze({branch:.96,burst:4.2,halo:5.85,end:6.25});
const PILLAR=1.1,CRACK=.7,SURGE=.5,SETTLE=.3,HALO=.55,CUTIN=1.35,REVEAL=1.1,STAR=.24,NAME=.7;
const unit=value=>Number.isFinite(value)&&value>=0&&value<1;

export function summonRoute(rank,rng=Math.random){
  const roll=rng(),r=unit(roll)?roll:.99;
  if(rank===4)return r<.25?{omen:true,colors:['gold']}:r<.6?{omen:false,colors:['blue','gold']}:{omen:false,colors:['gold']};
  if(rank===3)return r<.3?{omen:false,colors:['blue','purple']}:{omen:false,colors:['purple']};
  return {omen:false,colors:['blue']};
}

export function summonPlan(rank,{motion=true,rng=Math.random}={}){
  const signal=SIGNAL_FOR_RANK[rank]??'blue',steps=[],video=[];
  const add=(name,at,extra={})=>{steps.push({name,at:Number(at.toFixed(3)),...extra});return at;};
  if(!motion){
    add('open',0,{color:signal});add('halo',.3,{color:signal});add('reveal',.6,{color:signal});
    for(let i=0;i<rank;i++)add('star',1,{index:i});
    add('name',1.1);add('final',1.45);
    return {rank,signal,route:{omen:false,colors:[signal]},motion,steps,video,cutin:false,total:1.45};
  }
  const route=summonRoute(rank,rng),[first,next]=route.colors;
  add('open',0,{color:'blue'});
  if(route.omen)add('omen',.12);
  add('awaken',.25);
  let t=SUMMON_VIDEO.branch,revealAt;
  const goldFrom=at=>{
    video.push({at,from:SUMMON_VIDEO.branch,to:SUMMON_VIDEO.end});
    const v=value=>at+value-SUMMON_VIDEO.branch;
    add('gold',at,{color:'gold'});add('burst',v(SUMMON_VIDEO.burst),{color:'gold'});add('halo',v(SUMMON_VIDEO.halo),{color:'gold'});
    return v(SUMMON_VIDEO.end);
  };
  video.push({at:0,from:0,to:SUMMON_VIDEO.branch});
  if(first==='gold')t=goldFrom(t);
  else{
    add('pillar',t,{color:first});t+=PILLAR;
    if(next){
      add('crack',t,{color:first,next});t+=CRACK;
      if(next==='gold')t=goldFrom(t);
      else{add('pillar',t,{color:next,surge:true});t+=SURGE;}
    }
    if(next!=='gold'){const color=next??first;add('burst',t,{color});t+=SETTLE;add('halo',t,{color});t+=HALO;}
  }
  const cutin=rank===4;
  if(cutin){add('cutin',t);t+=CUTIN;}
  revealAt=add('reveal',t,{color:signal});t=revealAt+REVEAL;
  for(let i=0;i<rank;i++)add('star',t+i*STAR,{index:i});
  t+=rank*STAR+(rank===4?.18:.06);
  add('name',t);t+=NAME;
  add('final',t);
  return {rank,signal,route,motion,steps,video:mergeSegments(video),cutin,total:Number(t.toFixed(3))};
}
// Back-to-back segments play as one, so the clip never stalls on the joint.
function mergeSegments(segments){
  const merged=[];
  for(const s of segments){const last=merged.at(-1);if(last&&Math.abs(last.at+last.to-last.from-s.at)<1e-6&&last.to===s.from)last.to=s.to;else merged.push({...s});}
  return merged.map(s=>Object.freeze({at:Number(s.at.toFixed(3)),from:s.from,to:s.to}));
}

export function videoSegmentAt(plan,t){return plan.video.find(s=>t>=s.at&&t<s.at+(s.to-s.from))??null;}
// Where the clip should be at time t, or null while the stage runs on its own.
export function videoTimeAt(plan,t){const s=videoSegmentAt(plan,t);return s?s.from+t-s.at:null;}
