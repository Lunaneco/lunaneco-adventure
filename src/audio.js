import {MusicPlayer} from './music.js';

export class Soundscape {
  constructor(){this.ctx=null;this.enabled=true;this.music=true;this.next=0;this.beat=0;this.master=null;this.menuBus=null;this.ducking=false;this.summonSuspense=false;this.scene='menu';this.suspended=false;this.paused=false;this.bgm=new MusicPlayer();}
  init(){
    if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=this.enabled?.34:0;this.master.connect(this.ctx.destination);this.menuBus=this.ctx.createGain();this.menuBus.connect(this.master);this.bgm.attach(this.ctx);}catch{return;}}
    if(this.ctx.state!=='running'&&this.ctx.state!=='closed')this.ctx.resume().catch(()=>{});
    this.refreshMusic();this.bgm.unlock();
  }
  setEnabled(value){this.enabled=value;if(this.master)this.master.gain.setTargetAtTime(value?(this.ducking?.11:.34):0,this.ctx.currentTime,.05);this.refreshMusic();}
  setDucking(value){this.ducking=value;if(this.master)this.master.gain.setTargetAtTime(this.enabled?(value?.11:.34):0,this.ctx.currentTime,.08);this.refreshMusic();}
  setSummonSuspense(value){this.summonSuspense=value;this.refreshMusic();}
  setMusic(value){this.music=value;this.refreshMusic();}
  setSuspended(value){this.suspended=value;this.refreshMusic();}
  setPaused(value){this.paused=value;this.refreshMusic();}
  refreshMusic(){
    this.bgm.update({scene:this.scene,enabled:this.enabled&&this.music,suspended:this.suspended||this.paused,ducked:this.ducking||this.summonSuspense});
    const value=this.enabled&&this.music&&!this.suspended&&!this.paused&&this.scene==='menu'?1:0;
    if(this.menuBus&&value!==this.menuVolume){this.menuVolume=value;this.menuBus.gain.setTargetAtTime(value,this.ctx.currentTime,.035);}
  }
  tone(freq,duration=.15,type='sine',volume=.3,delay=0,end=null,bus=this.master,attack=.008){
    if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime+delay;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(30,end),t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+Math.min(attack,duration*.8));g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(bus);o.start(t);o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  noise(duration=.4,{volume=.15,delay=0,type='bandpass',freq=1200,end=null,q=1,attack=.01}={}){
    if(!this.ctx||!this.enabled)return;const ctx=this.ctx,t=ctx.currentTime+delay;
    if(!this.noiseBuffer){const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;this.noiseBuffer=buffer;}
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();source.buffer=this.noiseBuffer;source.loop=true;
    filter.type=type;filter.Q.value=q;filter.frequency.setValueAtTime(freq,t);if(end)filter.frequency.exponentialRampToValueAtTime(end,t+duration);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+Math.min(attack,duration*.8));g.gain.exponentialRampToValueAtTime(.001,t+duration);
    source.connect(filter);filter.connect(g);g.connect(this.master);source.start(t,Math.random()*1.5);source.stop(t+duration+.02);source.onended=()=>{source.disconnect();filter.disconnect();g.disconnect();};
  }
  // Weapon gacha cues, voiced in the menu theme's G major. Colours climb in pitch: blue, purple, gold.
  summon(name,{rank=2,color='blue',index=0,surge=false,skipped=false}={}){
    const tone=(f,d,type,v,delay=0,end=null,attack)=>this.tone(f,d,type,v,delay,end,this.master,attack),noise=(d,o)=>this.noise(d,o);
    const chord={blue:[392,494,587],purple:[440,554,659],gold:[392,494,587,784,988]}[color]??[392,494,587];
    if(name==='summonOpen'){noise(1.3,{volume:.07,type:'lowpass',freq:260,end:1300,attack:.45});tone(98,1.8,'sine',.08,0,null,.6);}
    if(name==='summonOmen'){tone(2637,.55,'sine',.05,0,1318);[2093,2349,2637,3136].forEach((f,i)=>tone(f,.3,'sine',.035,.04+i*.06));noise(.8,{volume:.05,type:'highpass',freq:5200,end:2400,attack:.05});}
    if(name==='summonAwaken'){noise(.8,{volume:.09,freq:400,end:2400,q:.8,attack:.5});[392,494,587,784].forEach((f,i)=>tone(f,.6,'sine',.06,.1+i*.09));}
    if(name==='summonRise'){
      const top=color==='purple'?[659,831,988]:[587,740,880],lift=surge?.35:.9;
      tone(196,lift,'triangle',.09,0,color==='purple'?988:784);noise(lift,{volume:.11,freq:300,end:3200,attack:lift*.4});
      top.forEach((f,i)=>tone(f,surge?.6:.9,'sine',.05,lift*.6+i*.05));
    }
    if(name==='summonCrack'){
      [0,.13,.29].forEach((delay,i)=>noise(.16+i*.04,{volume:.14+i*.04,type:'highpass',freq:2600-i*400,attack:.003,delay}));tone(82,.55,'sawtooth',.06,0,41);
      noise(.65,{volume:.26,type:'highpass',freq:1800,end:6400,attack:.003,delay:.55});[1568,2093,2637].forEach((f,i)=>tone(f,.5,'sine',.05,.56+i*.04));
    }
    if(name==='summonGold'){[196,294,392,494,587].forEach((f,i)=>tone(f,2.6,'triangle',.05,i*.04,null,1.3));noise(2.4,{volume:.09,freq:500,end:4200,attack:1.9});tone(1568,1.4,'sine',.05,2.3);}
    if(name==='summonBurst'){
      tone(62,.9,'sine',.28,0,31);noise(.95,{volume:.24,type:'lowpass',freq:6400,end:280,attack:.003});
      chord.forEach((f,i)=>tone(f,1.5,'triangle',.07,.03+i*.025));if(color==='gold')[1568,1976,2349,3136].forEach((f,i)=>tone(f,1,'sine',.03,.15+i*.07));
    }
    if(name==='summonCutin'){noise(.5,{volume:.16,freq:600,end:5200,q:1.2,attack:.22});tone(330,.4,'sawtooth',.04,0,1320);[196,392,587].forEach(f=>tone(f,.7,'sawtooth',.05,.26));}
    if(name==='summonReveal'){
      const base=rank===4?784:rank===3?659:587,length=skipped?.9:1.6;
      tone(base,length,'triangle',.08);tone(base*2,length*.85,'sine',.06,.02);tone(base*3,length*.6,'sine',.03,.04);
      noise(skipped?.5:1,{volume:.06,type:'highpass',freq:4200,attack:.02});if(rank===4)[988,1175,1568].forEach((f,i)=>tone(f,1.2,'sine',.04,.1+i*.06));
    }
    if(name==='summonStar'){const f=[1175,1319,1568,1976][index]??1976;tone(f,.5,'sine',.08);tone(f*2,.3,'sine',.025,.01);if(rank===4&&index===rank-1)noise(.7,{volume:.05,type:'highpass',freq:5600,attack:.02,delay:.05});}
    if(name==='summonName')[392,494,587,784,988].forEach((f,i)=>tone(f,.9,'sine',.045,i*.045));
    if(name==='summonGather'){
      const f=[392,494,587,784,988,1175,1568,1976,2349,3136][index]??784;
      tone(f,.28,'sine',.055);tone(f/2,.4,'triangle',.025);
    }
    if(name==='summonOrbit'){[196,294,392,587].forEach((f,i)=>tone(f,.7,'sine',.045,i*.04,null,.22));noise(.6,{volume:.07,freq:500,end:2400,attack:.3});}
    if(name==='summonEclipse'){tone(65,.55,'sine',.12,0,32);noise(.22,{volume:.045,type:'lowpass',freq:300,end:80});}
    if(name==='summonFan'){noise(.45,{volume:.075,type:'highpass',freq:1400,end:4600,attack:.18});[784,988,1175].forEach((f,i)=>tone(f,.4,'sine',.035,i*.045));}
    if(name==='summonCard'){
      const f=rank===4?1568:rank===3?1175:784;
      tone(f,.3,'sine',.055);tone(f*1.5,.2,'sine',.025,.02);
    }
    if(name==='summonLegend'){
      tone(49,.65,'sine',.2,0,32);noise(.4,{volume:.15,freq:800,end:4200,attack:.01});
      [392,587,784,988,1568].forEach((f,i)=>tone(f,1.2,'triangle',.045,.03+i*.035));
    }
  }
  play(name,detail){
    if(!this.enabled)return;
    if(name.startsWith('summon')){this.summon(name,detail);return;}
    if(name==='attack')this.tone(540,.12,'sine',.1,0,180);
    if(name==='shot'){this.tone(720,.055,'sawtooth',.075,0,95);this.tone(180,.11,'triangle',.11,0,55);}
    if(name==='hit')this.tone(180,.07,'triangle',.15,0,70);
    if(name==='collect')this.tone(1300,.09,'sine',.035);
    if(name==='dash')this.tone(300,.2,'sine',.16,0,950);
    if(name==='hurt'){
      // Keep Tsukineko's light damage reaction clear of the low, rough hit sound.
      if(detail?.hero===1)this.tone(560,.075,'sine',.075,0,330);
      else this.tone(125,.2,'sawtooth',.14,0,48);
    }
    if(name==='switch'){[440,660,880].forEach((n,i)=>this.tone(n,.22,'sine',.13,i*.055));}
    if(name==='upgrade'||name==='wave'){[392,494,587,784].forEach((n,i)=>this.tone(n,.7,'sine',.2,i*.1));}
    if(name==='ultimateGun'){[220,330,660].forEach((n,i)=>this.tone(n,.25,'sawtooth',.06,i*.06));}
    if(name==='ultimateReveal'){this.tone(150,.21,'triangle',.16,0,1080);this.tone(72,.18,'sine',.22);this.tone(1760,.12,'sine',.045,.05,880);}
    if(name==='ultimate'){[130,196,261,392,523,784,1046].forEach((n,i)=>this.tone(n,1.6,'triangle',.14,i*.055));}
    if(name==='victory'){[392,494,587,784,740,784,988].forEach((n,i)=>this.tone(n,.9,'sine',.25,i*.17));}
    if(name==='defeat'){[330,294,247,196].forEach((n,i)=>this.tone(n,.8,'sine',.15,i*.2));}
    if(name==='click')this.tone(880,.1,'sine',.1);
  }
  tick(scene='menu',{paused=false}={}){
    this.scene=scene;this.paused=paused;this.refreshMusic();
    if(!this.ctx||!this.music||!this.enabled||this.suspended||this.paused||scene!=='menu'||this.ctx.state!=='running')return;
    const now=this.ctx.currentTime;if(now<this.next)return;this.next=now+.48;
    const melody=[392,0,587,659,784,0,659,587,494,0,587,0,440,0,392,0,330,0,494,587,659,0,587,494,440,0,392,0,294,0,330,0];
    const note=melody[this.beat%melody.length];if(note)this.tone(note,1.4,'sine',.095,0,null,this.menuBus);
    if(this.beat%8===0){const root=[196,164.81,130.81,146.83][Math.floor(this.beat/8)%4];this.tone(root,3.5,'sine',.08,0,null,this.menuBus);this.tone(root*1.5,3,'sine',.045,0,null,this.menuBus);}
    this.beat++;
  }
}
