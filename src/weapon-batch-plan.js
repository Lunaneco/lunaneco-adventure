import {SIGNAL_FOR_RANK} from './weapon-summon-plan.js';

// Choreography consumes the ten saved results. It neither draws nor reorders rewards.
export function batchSummonPlan(results,{motion=true}={}){
  if(!Array.isArray(results)||results.length!==10||results.some(r=>!SIGNAL_FOR_RANK[r?.item?.rarity?.rank]))return null;
  const ranks=results.map(r=>r.item.rarity.rank),rank=Math.max(...ranks),signal=SIGNAL_FOR_RANK[rank];
  const steps=[],add=(name,at,extra={})=>steps.push({name,at:Number(at.toFixed(3)),...extra});
  const order=ranks.map((_,i)=>i).sort((a,b)=>ranks[a]-ranks[b]||a-b);
  const plan={batch:true,rank,signal,motion,video:[],cutin:false,steps,ranks,order,legends:ranks.filter(r=>r===4).length};
  if(!motion){
    add('open',0,{color:signal});add('batchQuiet',.15,{color:signal});
    for(let index=0;index<10;index++)add('batchReveal',.4,{index,rank:ranks[index]});
    add('final',1.35);
    return {...plan,total:1.35};
  }
  add('open',0,{color:'blue'});
  for(let index=0;index<10;index++)add('batchGather',.3+index*.16,{index});
  add('batchOrbit',2.05);
  add('batchEclipse',2.85);
  add('batchBreak',3.65,{color:signal});
  add('batchFan',4.45);
  let t=5.05;
  for(const index of order){
    const rarity=ranks[index];
    if(rarity===4){
      add('batchLegend',t,{index,rank:rarity});
      add('batchReveal',t+.22,{index,rank:rarity});
      add('batchLegendEnd',t+1.55,{index});
      t+=1.8;
    }else{
      add('batchReveal',t,{index,rank:rarity});t+=rarity===3?.38:.2;
    }
  }
  add('batchComplete',t+.1);add('final',t+.95);
  return {...plan,total:Number((t+.95).toFixed(3))};
}
