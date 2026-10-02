// Existing iOS home-screen installs can retain their original status-bar mode.
// Detect the running mode, rather than relying on a changed manifest/meta tag.
export function configureStandaloneViewport(){
  const mode=matchMedia('(display-mode: standalone)');
  const sync=()=>{
    const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    document.documentElement.classList.toggle('ios-standalone',ios&&(navigator.standalone===true||mode.matches));
  };
  sync();
  mode.addEventListener('change',sync);
  window.addEventListener('pageshow',sync);
}
