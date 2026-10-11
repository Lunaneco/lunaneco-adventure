// Lock only the battle's browser gestures. Menus retain native scrolling and
// zoom; single taps and pointer events are never cancelled by this fallback.
export function configureBattleViewport({documentTarget=document}={}){
  const active=()=>documentTarget.body.classList.contains('playing');
  const prevent=event=>{if(active()&&event.cancelable)event.preventDefault();};
  const touch=event=>{if(event.touches?.length>1)prevent(event);};
  const wheel=event=>{if(event.ctrlKey||event.metaKey)prevent(event);};
  const key=event=>{
    if((event.ctrlKey||event.metaKey)&&(['+','-','=','_'].includes(event.key)||['NumpadAdd','NumpadSubtract'].includes(event.code)))prevent(event);
  };
  const listeners=[['touchmove',touch],['gesturestart',prevent],['gesturechange',prevent],['gestureend',prevent],['dblclick',prevent],['wheel',wheel],['keydown',key]];
  const options={capture:true,passive:false};
  for(const [type,listener] of listeners)documentTarget.addEventListener(type,listener,options);
  return ()=>{for(const [type,listener] of listeners)documentTarget.removeEventListener(type,listener,options);};
}
