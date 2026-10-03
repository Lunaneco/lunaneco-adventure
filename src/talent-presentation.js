import {icon} from './icons.js';
import {nodeEffectText} from './talents.js';

export function talentUnlockCopy(node){
  return {
    eyebrow:node.kind==='limit'?'LEVEL LIMIT UNLOCKED':'CONSTELLATION UNLOCKED',
    name:node.name,
    effect:node.kind==='skill'?'新しいスキルを使えるようになりました':nodeEffectText(node),
  };
}

let activePresentation;

// Presentation only: spending and saving happen before this function is called.
export function presentTalentUnlock(root,node,{motion=true}={}){
  const button=root?.querySelector(`[data-tree-node="${node.id}"]`);
  if(!button)return false;
  activePresentation?.();
  const doc=root.ownerDocument,win=doc.defaultView;
  const animated=motion&&!win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const orb=button.querySelector('.talent-orb');
  // Keep the tree at the position where its explanation was opened.
  button.classList.add('just-unlocked');
  const links=[...root.querySelectorAll(`[data-link-node="${node.id}"].lit`)];
  const burst=doc.createElement('span');burst.className='constellation-unlock-burst';burst.setAttribute('aria-hidden','true');
  if(animated){
    for(let i=0;i<8;i++){
      const spark=doc.createElement('i'),angle=i*Math.PI/4;
      spark.className='constellation-unlock-spark';
      spark.style.setProperty('--spark-x',`${Math.cos(angle)*66}px`);
      spark.style.setProperty('--spark-y',`${Math.sin(angle)*66}px`);
      spark.style.setProperty('--spark-delay',`${i%3*35}ms`);
      burst.append(spark);
    }
    orb.append(burst);
    links.forEach(link=>link.classList.add('just-lit'));
  }
  const notice=doc.createElement('div'),copy=talentUnlockCopy(node);
  notice.className=`constellation-unlock-notice${animated?'':' is-still'}`;
  notice.setAttribute('aria-hidden','true'); // Existing status and live announcer read the result.
  notice.innerHTML=`<span class="unlock-notice-icon">${icon(node.kind==='limit'?'crystal':'spark')}</span><div><small></small><strong></strong><p></p></div>`;
  notice.querySelector('small').textContent=copy.eyebrow;
  notice.querySelector('strong').textContent=copy.name;
  notice.querySelector('p').textContent=copy.effect;
  const colors=win.getComputedStyle(button.closest('.limit-branch')??root.querySelector('.tree-workbench'));
  notice.style.setProperty('--unlock-glow',colors.getPropertyValue('--tree-glow'));
  notice.style.setProperty('--unlock-rgb',colors.getPropertyValue('--tree-rgb'));
  doc.body.append(notice);
  let timer;
  const cleanup=()=>{
    win.clearTimeout(timer);button.classList.remove('just-unlocked');
    links.forEach(link=>link.classList.remove('just-lit'));burst.remove();notice.remove();
    if(activePresentation===cleanup)activePresentation=null;
  };
  activePresentation=cleanup;timer=win.setTimeout(cleanup,2600);
  return true;
}
