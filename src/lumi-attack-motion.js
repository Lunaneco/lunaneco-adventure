// Shared timing keeps the three rail impacts, recoil and fingertip flashes in sync.
export const NEKO_LUMI_ATTACK=Object.freeze({
  interval:.09,duration:.42,weights:Object.freeze([.3,.3,.4]),width:.48,
});
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function nekoLumiAttackPose(remaining){
  if(!Number.isFinite(remaining)||remaining<=0)return {stance:0,recoil:0,flash:0};
  const elapsed=Math.max(0,NEKO_LUMI_ATTACK.duration-remaining);
  const stance=1-smooth((elapsed-.22)/.20);
  let recoil=0,flash=0;
  for(let i=0;i<NEKO_LUMI_ATTACK.weights.length;i++){
    const age=elapsed-i*NEKO_LUMI_ATTACK.interval;
    if(age<0)continue;
    // Smooth recoil peaks after impact; the last shot has a stronger follow-through.
    const weight=i===2?1:.75;
    recoil+=weight*Math.sin(Math.PI*clamp(age/.085))*(age<.085?1:0);
    flash=Math.max(flash,weight*Math.exp(-age/.035));
  }
  return {stance,recoil:Math.min(1,recoil),flash};
}
