import {publicUrl} from './public-url.js';
import {SUMMON_SIGNALS} from './weapon-summon-plan.js';
import {weaponImage} from './weapons.js';
import {ULTIMATE_ART,ultimateArtUrl} from './ultimate-art.js';
import {storySpeaker} from './story-cast.js';
import {icon} from './icons.js';
import {WeaponBatchScene} from './weapon-batch-view.js';

export const SUMMON_ASSETS=Object.freeze({
  idle:'assets/gacha/moon-summon-v1.webp',light:'assets/gacha/summon-light-v1.webp',
  reveal:'assets/gacha/weapon-reveal-v1.webp',video:'assets/gacha/weapon-summon-v1.mp4',
});
// Particle space is measured in stage widths; the art is 941x1672.
const TALL=1672/941,HALO={x:.52,y:.368*TALL,r:.25},SEAL={x:.5,y:.698*TALL,rx:.26,ry:.062},PILLAR_X=.51;
const RAINBOW=['#ffa3c4','#ffc890','#fff096','#b4ffbe','#96ecff','#aebcff','#e3adff'];
const rand=(a,b)=>a+Math.random()*(b-a),pick=list=>list[Math.floor(Math.random()*list.length)];
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;};

function crackPaths(){
  const paths=[];
  for(let i=0;i<9;i++){
    let a=i/9*Math.PI*2+rand(-.3,.3),x=480,y=700,d=`M${x} ${y}`;
    for(let j=0;j<5;j++){a+=rand(-.55,.55);const length=rand(30,64)*(1-j*.1);x+=Math.cos(a)*length;y+=Math.sin(a)*length*1.7;d+=` L${x.toFixed(1)} ${y.toFixed(1)}`;}
    paths.push(`<path d="${d}" pathLength="1"/>`);
  }
  return paths.join('');
}
function rainbowRays(){
  const count=30,step=360/count;
  return `conic-gradient(${Array.from({length:count},(_,i)=>`hsl(${Math.round(i*step*2.4)%360} 80% 86%) ${(i*step).toFixed(1)}deg ${(i*step+1.8).toFixed(1)}deg,transparent ${(i*step+1.8).toFixed(1)}deg ${((i+1)*step).toFixed(1)}deg`).join(',')})`;
}

class SummonParticles{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.items=[];this.streams=[];this.sprites=new Map();this.low=false;this.width=1;this.time=0;}
  resize(){
    const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(this.low?1:2,globalThis.devicePixelRatio||1);
    const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    this.width=w;
  }
  sprite(color){
    let s=this.sprites.get(color);if(s)return s;
    s=document.createElement('canvas');s.width=s.height=64;const x=s.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.16,rgba(color,.95));g.addColorStop(.45,rgba(color,.3));g.addColorStop(1,rgba(color,0));
    x.fillStyle=g;x.fillRect(0,0,64,64);this.sprites.set(color,s);return s;
  }
  add(p){if(this.items.length<(this.low?170:440)){p.max=p.life;this.items.push(p);}}
  burst(count,spawn){for(let i=0,n=this.low?Math.ceil(count*.45):count;i<n;i++)spawn(i);}
  stream(seconds,rate,spawn,tag=''){this.streams.push({left:seconds,rate:this.low?rate*.45:rate,carry:0,spawn,tag});}
  stop(tag){this.streams=this.streams.filter(s=>tag&&s.tag!==tag);}
  clear(){this.items.length=0;this.streams.length=0;this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
  ambient(color){
    this.stream(Infinity,8,()=>this.add({kind:'mote',x:rand(0,1),y:rand(.25,.95)*TALL,vx:rand(-.006,.006),vy:rand(-.035,-.012),life:rand(3,6),size:rand(.0025,.006),color:Math.random()<.6?'#dcecff':color,twinkle:rand(2,6)}),'ambient');
  }
  converge(color){
    this.stream(.62,120,()=>{const a=rand(0,Math.PI*2),r=rand(.3,.62);
      this.add({kind:'spark',x:SEAL.x+Math.cos(a)*r,y:SEAL.y+Math.sin(a)*r*.62-.03,vx:0,vy:0,target:{x:SEAL.x+Math.cos(a)*SEAL.rx*.55,y:SEAL.y+Math.sin(a)*SEAL.ry*.55},speed:rand(.35,.62),swirl:rand(.35,.85)*(Math.random()<.5?-1:1),life:1.15,size:rand(.0035,.0075),color:Math.random()<.3?'#ffffff':color,trail:.06});});
  }
  rise(color,seconds){
    this.stream(seconds,95,()=>this.add({kind:'spark',x:PILLAR_X+rand(-.035,.035),y:SEAL.y-.015,vx:rand(-.025,.025),vy:rand(-.95,-.45),drag:.996,life:rand(.7,1.3),size:rand(.004,.009),color:Math.random()<.35?'#ffffff':color,trail:.04,wobble:rand(0,6)}),'rise');
  }
  goldRise(seconds){
    this.stream(seconds,70,()=>{const a=rand(0,Math.PI*2);this.add({kind:'spark',x:PILLAR_X+Math.cos(a)*.035,y:SEAL.y-.02,vx:0,vy:rand(-.7,-.36),spiral:{a,r:rand(.03,.07),w:rand(3,5.5)},life:rand(1,1.8),size:rand(.004,.009),color:pick(['#ffe3a0','#fff6dc','#ffc864','#ffd780']),trail:.035});},'rise');
    this.stream(seconds,14,()=>this.add({kind:'mote',x:rand(.1,.9),y:rand(.55,.95)*TALL,vx:rand(-.01,.01),vy:rand(-.09,-.04),life:rand(1.6,2.6),size:rand(.004,.008),color:'#ffd780',twinkle:rand(3,7)}),'rise');
  }
  shards(color){
    this.burst(48,()=>{const side=Math.random()<.5?-1:1;this.add({kind:'shard',x:PILLAR_X+rand(-.025,.025),y:rand(.12,.68)*TALL,vx:side*rand(.15,.85),vy:rand(-.4,.25),grav:.7,drag:.985,life:rand(.6,1.2),size:rand(.008,.022),angle:rand(0,6.3),spin:rand(-12,12),color:Math.random()<.45?'#ffffff':color});});
  }
  explode(color,rainbow){
    this.burst(150,()=>{const a=rand(0,Math.PI*2),v=rand(.22,1.35);this.add({kind:'spark',x:HALO.x+Math.cos(a)*.02,y:HALO.y+Math.sin(a)*.02,vx:Math.cos(a)*v,vy:Math.sin(a)*v,drag:.93,life:rand(.5,1.5),size:rand(.004,.01),color:rainbow?pick(RAINBOW):Math.random()<.4?'#ffffff':color,trail:.07});});
    this.burst(26,()=>{const a=rand(0,Math.PI*2),r=rand(.05,.45);this.add({kind:'star',x:HALO.x+Math.cos(a)*r,y:HALO.y+Math.sin(a)*r,vx:0,vy:-.01,life:rand(.6,1.2),size:rand(.008,.018),color:rainbow?pick(RAINBOW):color});});
  }
  glint(color,rainbow){
    this.burst(40,()=>{const a=rand(0,Math.PI*2),v=rand(.18,.6);this.add({kind:'spark',x:HALO.x,y:HALO.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,drag:.92,life:rand(.4,.9),size:rand(.003,.007),color:rainbow?pick(RAINBOW):'#ffffff',trail:.05});});
    this.burst(18,()=>{const a=rand(0,Math.PI*2),r=rand(.06,.2);this.add({kind:'star',x:HALO.x+Math.cos(a)*r,y:HALO.y+Math.sin(a)*r,vx:0,vy:0,life:rand(.5,1),size:rand(.01,.02),color});});
  }
  glitter(color,rainbow){
    this.stop('glitter');
    this.stream(Infinity,15,()=>{const a=rand(0,Math.PI*2),r=HALO.r+rand(-.02,.02);this.add({kind:'star',x:HALO.x+Math.cos(a)*r,y:HALO.y+Math.sin(a)*r*.97,vx:0,vy:-.006,life:rand(.8,1.5),size:rand(.006,.014),color:rainbow&&Math.random()<.7?pick(RAINBOW):Math.random()<.4?'#ffffff':color});},'glitter');
    this.stream(Infinity,7,()=>this.add({kind:'mote',x:rand(.2,.82),y:rand(.62,.78)*TALL,vx:rand(-.008,.008),vy:rand(-.08,-.03),life:rand(1.8,3),size:rand(.003,.007),color:rainbow?pick(RAINBOW):color,twinkle:rand(3,6)}),'glitter');
  }
  frame(dt){
    this.time+=dt;
    for(const s of this.streams){s.carry+=s.rate*dt;while(s.carry>=1){s.carry--;s.spawn();}s.left-=dt;}
    this.streams=this.streams.filter(s=>s.left>0);
    const ctx=this.ctx,w=this.width;ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    let kept=0;
    for(const p of this.items){
      p.life-=dt;if(p.life<=0)continue;
      if(p.target){const dx=p.target.x-p.x,dy=p.target.y-p.y,d=Math.hypot(dx,dy)||1,v=p.speed*(1+(1-p.life/p.max)*1.6);p.vx=dx/d*v-dy/d*v*p.swirl;p.vy=dy/d*v+dx/d*v*p.swirl;if(d<.012)p.life=Math.min(p.life,.08);}
      if(p.spiral){p.spiral.a+=p.spiral.w*dt;p.spiral.r+=.018*dt;p.x=PILLAR_X+Math.cos(p.spiral.a)*p.spiral.r;}
      if(p.drag)p.vx*=p.drag**(dt*60),p.vy*=p.drag**(dt*60);
      if(p.grav)p.vy+=p.grav*dt;
      if(p.wobble!==undefined)p.vx+=Math.sin(this.time*8+p.wobble)*.05*dt;
      if(!p.spiral)p.x+=p.vx*dt;p.y+=p.vy*dt;
      const k=p.life/p.max,a=Math.min(1,(1-k)/.12,k/.4),x=p.x*w,y=p.y*w,size=p.size*w;
      ctx.globalAlpha=a;
      if(p.kind==='spark'){
        const speed=Math.hypot(p.vx,p.vy),tail=Math.min(.09,speed*p.trail)*w/(speed||1);
        ctx.strokeStyle=rgba(p.color,.85);ctx.lineWidth=Math.max(1,size*.55);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-p.vx*tail,y-p.vy*tail);ctx.stroke();
        ctx.drawImage(this.sprite(p.color),x-size*1.6,y-size*1.6,size*3.2,size*3.2);
      }else if(p.kind==='star'){
        const arm=size*(1.6+Math.sin(k*Math.PI)*1.6);ctx.strokeStyle=rgba(p.color,.9);ctx.lineWidth=Math.max(1,size*.18);
        ctx.beginPath();ctx.moveTo(x-arm,y);ctx.lineTo(x+arm,y);ctx.moveTo(x,y-arm);ctx.lineTo(x,y+arm);ctx.stroke();
        ctx.drawImage(this.sprite(p.color),x-size,y-size,size*2,size*2);
      }else if(p.kind==='shard'){
        p.angle+=p.spin*dt;ctx.save();ctx.translate(x,y);ctx.rotate(p.angle);ctx.fillStyle=rgba(p.color,.9);ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.55,size*.8);ctx.lineTo(-size*.5,size*.45);ctx.closePath();ctx.fill();ctx.restore();
      }else{
        const s=size*(1.6+.6*Math.sin(this.time*p.twinkle+p.x*40));ctx.drawImage(this.sprite(p.color),x-s*2,y-s*2,s*4,s*4);
      }
      this.items[kept++]=p;
    }
    this.items.length=kept;ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
}

const TEMPLATE=`<div class="summon-root" data-phase="idle">
 <div class="summon-backfill" aria-hidden="true"></div>
 <div class="summon-stage" aria-hidden="true"><div class="summon-camera">
  <img class="summon-layer summon-idle" alt="" draggable="false" decoding="async">
  <video class="summon-layer summon-video" muted playsinline preload="none" disablepictureinpicture disableremoteplayback tabindex="-1"></video>
  <img class="summon-layer summon-light" alt="" draggable="false" decoding="async">
  <img class="summon-layer summon-reveal" alt="" draggable="false" decoding="async">
  <div class="summon-seal"></div><div class="summon-seal-glow"></div>
  <div class="summon-rays"></div>
  <div class="summon-pillar"><b></b><i></i><em></em></div>
  <svg class="summon-crack" viewBox="0 0 941 1672" preserveAspectRatio="none"></svg>
  <div class="summon-shock"></div>
  <div class="summon-weapon"><div class="summon-weapon-float"><img class="summon-weapon-art" alt="" draggable="false"><i class="summon-weapon-silhouette"></i><i class="summon-weapon-shine"></i></div></div>
  <canvas class="summon-particles"></canvas>
  <div class="summon-omen"><i></i></div>
  <div class="summon-flash"></div>
 </div></div>
 <div class="summon-vignette" aria-hidden="true"></div>
 <div class="summon-letterbox" aria-hidden="true"><i></i><i></i></div>
 <div class="summon-cutin" aria-hidden="true"><div class="summon-cutin-band"><img alt="" draggable="false"><div class="summon-cutin-copy"><small>LEGENDARY WEAPON</small><strong></strong><span>伝説の専用武器、顕現。</span></div></div></div>
 <div class="summon-result"></div>
 <button class="summon-skip" type="button" data-summon-skip aria-label="演出をスキップして結果を見る">タップでスキップ ${icon('chevron')}</button>
</div>`;

export class WeaponSummonView{
  constructor(dialog){
    this.dialog=dialog;dialog.innerHTML=TEMPLATE;
    const $=s=>dialog.querySelector(s);
    Object.assign(this,{root:$('.summon-root'),stage:$('.summon-stage'),backfill:$('.summon-backfill'),idle:$('.summon-idle'),videoEl:$('.summon-video'),light:$('.summon-light'),reveal:$('.summon-reveal'),crack:$('.summon-crack'),weapon:$('.summon-weapon-art'),cutinImg:$('.summon-cutin-band img'),cutinName:$('.summon-cutin-copy strong'),result:$('.summon-result'),skipButton:$('.summon-skip')});
    this.particles=new SummonParticles($('.summon-particles'));
    this.later=[];this.isOpen=false;this.videoOn=false;this.videoError=false;this.pauseAt=null;this.plan=null;
    this.observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>this.layout()):null;
    const v=this.videoEl;
    v.addEventListener('playing',()=>{if(this.isOpen&&this.videoOn)this.root.classList.add('video-live');});
    v.addEventListener('error',()=>{if(this.isOpen)this.videoError=true;});
  }
  preload(){
    if(this.preloaded)return;this.preloaded=true;
    this.idle.src=publicUrl(SUMMON_ASSETS.idle);this.light.src=publicUrl(SUMMON_ASSETS.light);this.reveal.src=publicUrl(SUMMON_ASSETS.reveal);
    this.backfill.style.backgroundImage=`url("${publicUrl(SUMMON_ASSETS.idle)}")`;
    this.videoEl.preload='auto';this.videoEl.src=publicUrl(SUMMON_ASSETS.video);
    for(const img of [this.idle,this.light,this.reveal])img.decode?.().catch(()=>{});
  }
  open(result,plan,{quality='high',markup='',video=true,batch=null}={}){
    this.preload();
    const root=this.root,item=result.item,rank=item.rarity.rank,v=this.videoEl;
    this.isOpen=true;this.plan=plan;this.later=[];this.videoError=false;this.pauseAt=null;
    root.className='summon-root';root.dataset.phase='open';root.dataset.rank=rank;
    root.classList.toggle('is-motion',plan.motion);root.classList.toggle('is-low',quality==='low');
    this.setSignal(plan.steps[0].color??plan.signal);
    root.style.setProperty('--rarity-color',item.rarity.color);
    const art=weaponImage(item);this.weapon.src=art;root.style.setProperty('--weapon-mask',`url("${art}")`);this.weapon.decode?.().catch(()=>{});
    root.style.removeProperty('--ray-gradient');
    if(plan.cutin){this.cutinImg.src=ultimateArtUrl(item.heroId);this.cutinImg.decode?.().catch(()=>{});this.cutinName.textContent=storySpeaker(item.heroId).name;root.style.setProperty('--cutin-color',ULTIMATE_ART[item.heroId].accent);root.style.setProperty('--ray-gradient',rainbowRays());}
    this.result.innerHTML=markup;root.classList.toggle('is-batch',!!this.result.querySelector('.weapon-batch-result'));this.crack.innerHTML=crackPaths();
    this.batchScene?.finish();this.batchScene=plan.batch?new WeaponBatchScene(root,batch,plan):null;
    this.videoOn=video&&!!v.canPlayType?.('video/mp4');root.classList.toggle('no-video',!this.videoOn);
    if(this.videoOn){
      // Started inside the summon tap so low-power autoplay rules cannot block it.
      try{if(v.currentTime>0)v.currentTime=0;}catch{}
      Promise.resolve(v.play()).catch(()=>{if(this.isOpen)this.videoError=true;});
      if(typeof v.requestVideoFrameCallback==='function'){const onFrame=(now,meta)=>{if(!this.isOpen)return;if(this.pauseAt!==null&&meta.mediaTime>=this.pauseAt-.03&&!v.paused)v.pause();v.requestVideoFrameCallback(onFrame);};v.requestVideoFrameCallback(onFrame);}
    }
    if(!this.dialog.open)this.dialog.showModal();
    this.skipButton.focus({preventScroll:true});
    // Engines without overflow:clip let focus scroll the oversized stage sideways.
    root.scrollLeft=root.scrollTop=0;
    this.particles.low=quality==='low';this.particles.clear();this.layout();this.observer?.observe(root);
    if(plan.motion)this.particles.ambient(SUMMON_SIGNALS.blue.color);
  }
  layout(){
    if(!this.isOpen)return;
    // Untransformed sizes: the altar may be mid-lift or slid aside when the screen turns.
    const root=this.root,height=root.clientHeight,stageH=this.stage.offsetHeight,stageW=this.stage.offsetWidth;
    const resultTop=(height-stageH)/2+stageH*.368+stageW*HALO.r*1.04;
    root.style.setProperty('--result-top',`${Math.round(resultTop)}px`);
    // Portrait screens lift the altar at the end just enough for the whole result to fit below the halo.
    const card=this.result.firstElementChild,room=height-resultTop-(parseFloat(getComputedStyle(this.result).paddingBottom)||0);
    const need=card&&root.clientWidth<height?card.scrollHeight-room:0;
    root.style.setProperty('--final-lift',`${need>0?Math.round(Math.min(need+6,height*.2)):0}px`);
    this.particles.resize();
  }
  setSignal(color){
    const signal=SUMMON_SIGNALS[color]??SUMMON_SIGNALS.blue;
    this.root.dataset.signal=color;this.root.style.setProperty('--summon-color',signal.color);this.root.style.setProperty('--summon-glow',signal.glow);
  }
  pulse(name){const root=this.root;root.classList.remove(name);void root.offsetWidth;root.classList.add(name);}
  at(time,fn){this.later.push({time,fn});}
  showBackdrop(color){this.root.classList.add(color==='gold'&&(this.videoOn||!this.plan.motion)?'show-reveal':'show-light');}
  step(step){
    const root=this.root,P=this.particles,gold=this.plan.rank===4;
    root.dataset.phase=step.name;root.classList.add(`at-${step.name}`);
    if(step.color&&step.name!=='crack')this.setSignal(step.color);
    const color=SUMMON_SIGNALS[root.dataset.signal].color;
    if(this.batchScene&&step.name.startsWith('batch')){
      this.batchScene.step(step);
      if(step.name==='batchBreak'&&this.plan.motion){this.pulse('fx-flash');P.explode(color,gold);}
      return;
    }
    if(step.name==='omen')this.pulse('fx-omen');
    else if(step.name==='awaken')P.converge('#8ff3ff');
    else if(step.name==='pillar'){root.classList.add('show-pillar');if(step.surge)this.pulse('fx-surge');P.rise(color,step.surge?.5:1.1);}
    else if(step.name==='crack'){
      root.style.setProperty('--next-glow',SUMMON_SIGNALS[step.next].glow);this.pulse('fx-crack');
      this.at(step.at+.55,()=>{root.classList.remove('show-pillar','fx-crack');this.setSignal(step.next);this.pulse('fx-flash');this.pulse('fx-shake');P.stop('rise');P.shards(SUMMON_SIGNALS[step.next].color);});
    }else if(step.name==='gold'){root.classList.add('is-gold','show-letterbox');if(!this.videoOn)root.classList.add('show-pillar');P.goldRise(3.2);}
    else if(step.name==='burst'){
      root.classList.remove('show-pillar');P.stop('rise');
      if(step.color!=='gold'||!this.videoOn)root.classList.add('show-light');
      this.pulse('fx-flash');this.pulse('fx-shock');this.pulse('fx-shake');P.explode(color,step.color==='gold');
    }else if(step.name==='halo'){root.classList.add('show-halo');this.showBackdrop(step.color);if(this.plan.motion)P.glitter(color,gold);}
    else if(step.name==='cutin')this.pulse('fx-cutin');
    else if(step.name==='reveal'){
      root.classList.remove('show-letterbox','show-pillar');root.classList.add('show-weapon','show-halo');this.showBackdrop(step.color);
      if(this.plan.motion){this.pulse('fx-glint');P.glint(color,gold);P.glitter(color,gold);}
    }else if(step.name==='star'){root.classList.add('show-title');this.result.querySelectorAll('.draw-stars i')[step.index]?.classList.add('lit');}
    else if(step.name==='name')root.classList.add('show-name');
  }
  frame(dt,t){
    if(!this.isOpen)return;
    if(this.later.length){const due=this.later.filter(e=>t>=e.time);this.later=this.later.filter(e=>t<e.time);for(const e of due)e.fn();}
    this.particles.frame(dt);
  }
  get videoFailed(){return this.videoError;}
  get videoTime(){const v=this.videoEl;return this.videoOn&&v.readyState>=2?v.currentTime:null;}
  video(expected,pauseAt=null){
    if(!this.videoOn)return;
    const v=this.videoEl;this.pauseAt=pauseAt;
    if(expected===null||pauseAt!==null&&v.currentTime>=pauseAt-.03){if(!v.paused)v.pause();return;}
    if(v.paused&&!v.ended)Promise.resolve(v.play()).catch(()=>{if(this.isOpen)this.videoError=true;});
  }
  dropVideo(){this.videoOn=false;this.videoEl.pause();this.root.classList.remove('video-live');this.root.classList.add('no-video');if(this.root.classList.contains('is-gold')&&!this.root.classList.contains('show-light'))this.root.classList.add('show-pillar');}
  pause(value){this.root.classList.toggle('is-paused',value);if(value)this.videoEl.pause();}
  finish({skipped=false}={}){
    const root=this.root,plan=this.plan,color=SUMMON_SIGNALS[plan.signal].color;
    this.batchScene?.finish();this.batchScene=null;
    this.later=[];this.pauseAt=null;if(!this.videoEl.paused)this.videoEl.pause();
    root.classList.remove('show-pillar','show-letterbox','fx-crack','fx-cutin');
    if(skipped)root.classList.add('is-skipped');
    this.setSignal(plan.signal);this.showBackdrop(plan.signal);
    root.classList.add('show-weapon','show-halo','show-title','show-name','is-final');root.dataset.phase='final';
    this.result.querySelectorAll('.draw-stars i').forEach(star=>star.classList.add('lit'));
    if(skipped&&plan.motion){this.particles.stop();this.particles.ambient(color);this.particles.glitter(color,plan.rank===4);}
    this.result.querySelector('[data-close]')?.focus({preventScroll:true});
  }
  updateResult(markup){
    this.result.innerHTML=markup;
    if(this.root.classList.contains('is-final'))this.result.querySelectorAll('.draw-stars i').forEach(star=>star.classList.add('lit'));
    this.layout();
  }
  close(){
    this.batchScene?.finish();this.batchScene=null;
    this.isOpen=false;this.later=[];this.pauseAt=null;this.observer?.disconnect();
    this.videoEl.pause();this.particles.clear();
    if(this.dialog.open)this.dialog.close();
    this.root.className='summon-root';this.root.dataset.phase='idle';this.result.innerHTML='';
  }
}
