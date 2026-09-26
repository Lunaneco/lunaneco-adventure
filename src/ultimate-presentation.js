import {DUET_VOICE} from './shizuku-combat.js';
import {canCastUltimate} from './ultimate-combat.js';
import {BATTLE_VOICES} from './voice-catalog.js';

// Combat remains frozen until the actual voice finishes, including after a pause.
export class UltimatePresentation{
  constructor({voice,view,getGame,onComplete=()=>{}}){Object.assign(this,{voice,view,getGame,onComplete});this.current=null;}
  get active(){return !!this.current;}
  start(game){
    if(this.active||!canCastUltimate(game))return false;
    const hero=game.player.hero,heroId=game.heroId(hero),line=game.duetReady?DUET_VOICE:BATTLE_VOICES[heroId].ultimate[0];
    const state={game,hero,heroId,line,elapsed:0,voiceElapsed:0,stall:0,ready:false,requested:false,started:false,ended:false,paused:false,release:null};
    this.current=state;game.phase='ultimateIntro';this.voice.setMode('ultimate');
    Promise.resolve(this.view.show(game.duetReady?'shizukuDuet':heroId,line,game.ultimateSpec(hero))).catch(()=>{}).then(()=>{if(this.current===state)state.ready=true;});
    return true;
  }
  pause(){const s=this.current;if(!s||s.paused)return false;s.paused=true;this.view.pause(true);this.voice.suspend();return true;}
  resume(){const s=this.current;if(!s||!s.paused)return false;s.paused=false;this.view.pause(false);this.voice.resume();return true;}
  skip(){
    const s=this.current;if(!s||s.paused||this.voice.suspended)return false;
    if(this.getGame()!==s.game||s.game.phase!=='ultimateIntro'||s.game.player.hero!==s.hero){this.cancel();return false;}
    this.finish(s);return true;
  }
  cancel(){const s=this.current;if(!s)return;this.current=null;this.voice.stop();this.view.hide();if(s.game.phase==='ultimateIntro')s.game.phase='playing';}
  tick(dt){
    const s=this.current;if(!s)return;
    if(this.getGame()!==s.game||s.game.phase!=='ultimateIntro'||s.game.player.hero!==s.hero){this.cancel();return;}
    if(s.paused||this.voice.suspended)return;
    s.elapsed+=dt;
    if(s.release!==null){s.release+=dt;if(s.release>=.18)this.finish(s);return;}
    if(!s.requested&&s.elapsed>=.24&&(s.ready||s.elapsed>=2)){
      s.requested=true;
      void this.voice.play(s.line.id,{priority:100,interrupt:true,
        onStart:()=>{if(this.current===s){s.started=true;s.stall=0;this.view.speaking(true);}},
        onFinish:()=>{if(this.current===s){s.ended=true;this.view.speaking(false);}},
      });
    }
    if(s.requested&&!s.ended){
      s.voiceElapsed+=dt;
      s.stall=this.voice.sound.ctx?.state==='running'?0:s.stall+dt;
      const duration=this.voice.manifest[s.line.id]?.duration??8;
      if((!s.started&&s.voiceElapsed>=3.5)||s.stall>=3.5||s.voiceElapsed>duration+5){this.voice.stop();s.ended=true;}
    }
    if(s.ended&&s.elapsed>=1.6){s.release=0;this.view.release();}
  }
  finish(s){
    if(this.current!==s)return;
    this.current=null;this.view.hide();this.voice.setMode('battle');s.game.phase='playing';
    const cast=s.game.ultimate({voicePresented:true});this.onComplete(cast);
  }
}
