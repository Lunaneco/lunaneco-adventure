// A decorative movie: title-only playback, with a still image on devices that
// block autoplay or request less motion. Loading it never blocks game startup.
export function createTitleVideo(video,{motionEnabled}){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,failed=false;
  const shouldPlay=()=>visible&&!document.hidden&&motionEnabled()&&!reduced.matches&&!failed;
  const pause=()=>{video.pause();video.classList.remove('is-playing');};
  const sync=()=>{
    if(!shouldPlay()){pause();return;}
    if(!video.getAttribute('src'))video.src=video.dataset.src;
    video.play()?.catch(()=>video.classList.remove('is-playing'));
  };
  video.muted=true;video.defaultMuted=true;
  video.addEventListener('playing',()=>{if(shouldPlay())video.classList.add('is-playing');else pause();});
  video.addEventListener('error',()=>{failed=true;pause();});
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pagehide',pause);
  window.addEventListener('pageshow',sync);
  reduced.addEventListener('change',sync);
  // Retry from a gesture when mobile power-saving mode refused autoplay.
  for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{if(video.paused&&shouldPlay())sync();},{passive:true});
  return {setVisible(value){visible=value;sync();},sync};
}
