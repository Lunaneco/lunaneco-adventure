import {storySpeaker} from './story-cast.js';
import {ULTIMATE_ART,ultimateArtUrl} from './ultimate-art.js';

export class UltimatePresentationView{
  constructor(root){this.root=root;}
  async show(heroId,line,spec){
    const speaker=storySpeaker(heroId),art=ULTIMATE_ART[heroId],root=this.root;
    root.dataset.hero=heroId;root.dataset.phase='enter';root.classList.remove('hidden','is-speaking','is-paused');
    root.style.setProperty('--cutin-color',art.accent);
    root.querySelector('.cutin-hero').textContent=speaker.name;
    root.querySelector('.cutin-role').textContent=speaker.role;
    root.querySelector('.cutin-ability').textContent=spec.name;
    root.querySelector('.cutin-english').textContent=art.label;
    root.querySelector('.cutin-line').textContent=line.text;
    const image=root.querySelector('.cutin-face');image.alt=art.alt;image.src=ultimateArtUrl(heroId);
    root.setAttribute('aria-hidden','false');document.querySelector('#hud').inert=true;root.focus({preventScroll:true});await image.decode();
  }
  speaking(value){this.root.classList.toggle('is-speaking',value);if(value)this.root.dataset.phase='voice';}
  pause(value){this.root.classList.toggle('is-paused',value);}
  release(){this.root.dataset.phase='release';}
  hide(){this.root.classList.add('hidden');this.root.classList.remove('is-speaking','is-paused');this.root.setAttribute('aria-hidden','true');document.querySelector('#hud').inert=false;}
}
