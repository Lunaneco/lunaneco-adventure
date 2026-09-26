import {summonPlan,videoSegmentAt} from './weapon-summon-plan.js';
import {batchSummonPlan} from './weapon-batch-plan.js';
import {BATTLE_VOICES} from './voice-catalog.js';

// The stage clock follows the clip within LAG seconds so overlays land on its frames.
// A clip that stops advancing is dropped and the stage finishes without it.
const LAG=.12,STALL=.9,FIRST_FRAME=1.2,VOICE_DELAY=.7;
const SOUND={open:'summonOpen',omen:'summonOmen',awaken:'summonAwaken',pillar:'summonRise',crack:'summonCrack',gold:'summonGold',burst:'summonBurst',cutin:'summonCutin',reveal:'summonReveal',star:'summonStar',name:'summonName',batchGather:'summonGather',batchOrbit:'summonOrbit',batchEclipse:'summonEclipse',batchBreak:'summonBurst',batchFan:'summonFan',batchReveal:'summonCard',batchLegend:'summonLegend',batchComplete:'summonName',batchQuiet:'summonReveal'};

export class WeaponSummonPresentation{
  constructor({view,audio,voice,onFinish=()=>{}}){Object.assign(this,{view,audio,voice,onFinish});this.current=null;}
  get active(){return !!this.current;}
  get finished(){return !!this.current?.finished;}
  start(result,{motion=true,quality='high',rng=Math.random,markup='',batch=null}={}){
    if(this.current||!result?.item)return false;
    const plan=batch?batchSummonPlan(batch,{motion}):summonPlan(result.item.rarity.rank,{motion,rng});
    if(!plan)return false;
    if(batch)result=batch.find(r=>r.item.rarity.rank===plan.rank);
    const s={result,plan,t:0,next:0,finished:false,hidden:false,video:plan.video.length>0,stall:0,lastVideo:null,voiceAt:null,voiced:false};
    this.current=s;
    this.view.open(result,plan,{quality,markup,video:s.video,batch});
    if(s.video&&this.view.videoFailed)this.dropVideo(s);
    return true;
  }
  setHidden(hidden){const s=this.current;if(!s||s.hidden===hidden)return;s.hidden=hidden;this.view.pause(hidden);}
  tick(dt){
    const s=this.current;if(!s||s.finished||s.hidden)return;
    let t=s.t+dt;
    if(s.video){
      if(this.view.videoFailed)this.dropVideo(s);
      else t=this.syncVideo(s,t,dt);
    }
    while(s.next<s.plan.steps.length&&s.plan.steps[s.next].at<=t){
      const step=s.plan.steps[s.next++];
      if(step.name==='final'){s.t=t;this.finish(s,false);return;}
      this.fire(s,step);
    }
    if(s.voiceAt!==null&&t>=s.voiceAt)this.speak(s);
    s.t=t;this.view.frame(dt,t);
  }
  syncVideo(s,t,dt){
    const segment=videoSegmentAt(s.plan,t);
    if(!segment){this.view.video(null);s.stall=0;return t;}
    const expected=segment.from+t-segment.at,pauseAt=segment.to;
    this.view.video(expected,pauseAt);
    const actual=this.view.videoTime;
    if(actual===null){
      s.stall+=dt;if(s.stall>=FIRST_FRAME){this.dropVideo(s);return t;}
      return Math.max(s.t,Math.min(t,segment.at+LAG));
    }
    const moved=s.lastVideo===null||actual!==s.lastVideo;s.lastVideo=actual;
    const follow=segment.at+Math.min(actual,pauseAt)-segment.from;
    const held=Math.max(s.t,Math.min(t,follow+LAG),follow-LAG);
    if(held<t-1e-6&&!moved){s.stall+=dt;if(s.stall>=(s.t<LAG*2?FIRST_FRAME:STALL)){this.dropVideo(s);return t;}}
    else s.stall=0;
    return held;
  }
  dropVideo(s){s.video=false;s.stall=0;this.view.dropVideo();}
  fire(s,step){
    if(step.name==='batchEclipse')this.audio.setSummonSuspense?.(true);
    if(step.name==='batchBreak')this.audio.setSummonSuspense?.(false);
    this.view.step(step);
    const sound=SOUND[step.name],rank=step.rank??s.plan.rank;
    // Reduced motion lights every star at once: one chime instead of a chord of them.
    const audible=s.plan.motion||step.name==='reveal'||step.name==='batchQuiet'||step.name==='star'&&step.index===rank-1;
    if(sound&&audible)this.audio.play(sound,{rank,color:step.color,next:step.next,index:step.index,surge:step.surge});
    if(step.name==='reveal'&&rank===4)s.voiceAt=step.at+(s.plan.motion?VOICE_DELAY:.2);
    if(step.name==='batchLegend'&&!s.voiced&&s.voiceAt===null)s.voiceAt=step.at+.35;
  }
  speak(s){
    s.voiceAt=null;if(s.voiced)return;s.voiced=true;
    const line=BATTLE_VOICES[s.result.item.heroId]?.treasure?.[0];
    if(line)void this.voice.play(line.id,{priority:60,interrupt:true});
  }
  skip(){const s=this.current;if(!s||s.finished)return false;this.finish(s,true);return true;}
  finish(s,skipped){
    this.audio.setSummonSuspense?.(false);
    s.finished=true;s.t=s.plan.total;s.next=s.plan.steps.length;
    this.view.finish({skipped});
    if(skipped)this.audio.play('summonReveal',{rank:s.plan.rank,skipped:true});
    if(s.plan.rank===4&&!s.voiced)this.speak(s);
    this.onFinish(s.result,{skipped});
  }
  updateResult(markup){if(this.current)this.view.updateResult(markup);}
  close(){
    const s=this.current;if(!s)return false;
    this.audio.setSummonSuspense?.(false);
    this.current=null;this.view.close();
    if(s.voiced)this.voice.stop();
    return true;
  }
}
