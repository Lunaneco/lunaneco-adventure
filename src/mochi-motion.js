// Ground-based, volume-preserving deformation. The body sits at local Y=0;
// rigid equipment follows the hop separately so bells never turn rubbery.
export function mochiSlimePose(time,{movement=0,cry=0,dash=0,hit=0}={}){
 const moving=Math.max(0,Math.min(1,movement)),s=Math.sin(time*11.5);
 const lift=Math.max(0,s),squash=Math.max(0,-s);
 const y=Math.max(.64,1+Math.sin(time*2.4)*.016*(1-moving)+moving*(lift*.15-squash*.24)-cry*.17-hit*.1-dash*.12);
 const stretch=1+dash*.28,radial=1/Math.sqrt(y);
 return {x:radial/Math.sqrt(stretch),y,z:radial*Math.sqrt(stretch),hop:lift*.30*moving*(1-dash*.5),sway:Math.sin(time*5.75)*.035*moving};
}
