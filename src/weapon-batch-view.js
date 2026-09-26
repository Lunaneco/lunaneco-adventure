import {weaponImage} from './weapons.js';
import {ultimateArtUrl,ULTIMATE_ART} from './ultimate-art.js';
import {storySpeaker} from './story-cast.js';
import {SUMMON_SIGNALS,SIGNAL_FOR_RANK} from './weapon-summon-plan.js';

const point=(i,r=40)=>{const a=(i/10-.25)*Math.PI*2;return [50+Math.cos(a)*r,50+Math.sin(a)*r];};
const constellation=Array.from({length:10},(_,i)=>{
  const a=point(i),b=point((i+3)%10);
  return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" pathLength="1"/>`;
}).join('');

// This layer has no input handlers or timers: the shared presentation clock owns every beat.
export class WeaponBatchScene{
  constructor(host,results,plan){
    this.results=results;this.plan=plan;this.revealed=new Set();
    const el=document.createElement('div');el.className='batch-cinematic';el.setAttribute('aria-hidden','true');
    el.innerHTML=`<div class="batch-sky"></div>
      <header class="batch-heading"><small>TENFOLD LUNAR SUMMON</small><h2>十星の月蝕召喚</h2><p class="batch-caption">十の願いが、月に届く。</p></header>
      <div class="batch-universe">
        <div class="batch-aura"></div><div class="batch-orbit-ring"></div><div class="batch-orbit-ring inner"></div>
        <svg class="batch-constellation" viewBox="0 0 100 100">${constellation}</svg>
        <div class="batch-moon"><div class="batch-moon-texture"></div><div class="batch-eclipse"></div></div>
        <div class="batch-shockwave"></div><div class="batch-rays"></div>
        <div class="batch-fragments">${Array.from({length:24},(_,i)=>`<i style="--angle:${i*15}deg;--flight:${140+i%4*24}px;--delay:${i%3*.025}s"></i>`).join('')}</div>
        <div class="batch-stars">${results.map(({item,duplicate},i)=>{const [x,y]=point(i),color=SUMMON_SIGNALS[SIGNAL_FOR_RANK[item.rarity.rank]].color;return `<div class="batch-star" data-summon-slot="${i}" data-rank="${item.rarity.rank}" style="--orbit-x:${x}%;--orbit-y:${y}%;--grid-x:${10+i%5*20}%;--grid-y:${27+Math.floor(i/5)*46}%;--launch-x:${(x-50)*5}px;--launch-y:${(y-50)*5}px;--star-color:${color}"><div class="batch-star-body"><div class="batch-crystal"><i></i></div><span class="batch-slot-number">${String(i+1).padStart(2,'0')}</span><div class="batch-card-face"><small>${duplicate?'':'NEW'}</small><img src="${weaponImage(item)}" alt="" draggable="false"><b>${'★'.repeat(item.rarity.rank)}</b></div></div></div>`;}).join('')}</div>
      </div>
      <div class="batch-spotlight"><div class="batch-spotlight-rays"></div><img class="batch-spotlight-hero" alt="" draggable="false"><div class="batch-spotlight-weapon"><img alt="" draggable="false"></div><div class="batch-spotlight-copy"><small>LEGENDARY · ★★★★</small><h3></h3><p></p><span></span></div></div>
      <div class="batch-progress"><span class="batch-progress-label">星を集めています</span><strong><b>00</b><i> / 10</i></strong><div>${'<i></i>'.repeat(10)}</div></div>`;
    host.insertBefore(el,host.querySelector('.summon-result'));this.el=el;
    this.slots=[...el.querySelectorAll('.batch-star')];this.caption=el.querySelector('.batch-caption');
    this.progress=el.querySelector('.batch-progress b');this.progressLabel=el.querySelector('.batch-progress-label');
    this.dots=[...el.querySelectorAll('.batch-progress>div i')];
    this.spotlight=el.querySelector('.batch-spotlight');
    for(const id of new Set(results.filter(r=>r.item.rarity.rank===4).map(r=>r.item.heroId))){const img=new Image();img.src=ultimateArtUrl(id);img.decode?.().catch(()=>{});}
  }
  step(step){
    const el=this.el;
    if(step.name==='batchGather'){
      this.slots[step.index].classList.add('is-lit');this.progress.textContent=String(step.index+1).padStart(2,'0');
      this.dots[step.index].classList.add('lit');
    }else if(step.name==='batchOrbit'){
      el.classList.add('is-orbit');this.caption.textContent='十の星が、ひとつにつながる。';
    }else if(step.name==='batchEclipse'){
      el.classList.add('is-eclipse');this.caption.textContent='その静寂の、向こうへ。';
    }else if(step.name==='batchBreak'){
      el.classList.add('is-broken');el.classList.remove('is-eclipse');
      this.caption.textContent=this.plan.rank===4?'月が砕け、伝説が目覚める。':'月の向こうから、届く力。';
    }else if(step.name==='batchFan'||step.name==='batchQuiet'){
      el.classList.add('is-fan');this.slots.forEach(s=>s.classList.add('is-lit'));
      this.progressLabel.textContent='武器が顕現しています';this.progress.textContent='00';this.dots.forEach(d=>d.classList.remove('lit'));
      if(step.name==='batchQuiet')this.caption.textContent='十の星から、あなたのもとへ。';
    }else if(step.name==='batchLegend')this.legend(step.index);
    else if(step.name==='batchLegendEnd')el.classList.remove('is-spotlight');
    else if(step.name==='batchReveal'){
      const slot=this.slots[step.index];slot.classList.add('is-revealed');this.revealed.add(step.index);
      this.progress.textContent=String(this.revealed.size).padStart(2,'0');this.dots[step.index].classList.add('lit');
      if(step.rank===4)this.dots[step.index].classList.add('legend');
    }else if(step.name==='batchComplete'){
      el.classList.add('is-complete');this.progressLabel.textContent='召喚完了';
      this.caption.textContent=this.plan.legends>1?`伝説の武器、${this.plan.legends}本が顕現。`:'十の出会いを、次の冒険へ。';
    }
  }
  legend(index){
    const {item,duplicate}=this.results[index],s=this.spotlight;
    s.querySelector('.batch-spotlight-hero').src=ultimateArtUrl(item.heroId);
    s.querySelector('.batch-spotlight-weapon img').src=weaponImage(item);
    s.querySelector('h3').textContent=item.weapon.name;s.querySelector('p').textContent=`${storySpeaker(item.heroId).name}専用`;
    s.querySelector('.batch-spotlight-copy>span').textContent=duplicate?'重複分は星の芽へ':'新しい伝説を、その手に。';
    s.style.setProperty('--hero-accent',ULTIMATE_ART[item.heroId].accent);
    this.el.classList.remove('is-spotlight');void s.offsetWidth;this.el.classList.add('is-spotlight');
  }
  finish(){this.el.remove();}
}
