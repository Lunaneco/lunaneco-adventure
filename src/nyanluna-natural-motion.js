import * as THREE from 'three';

const CLIPS={idle:'Nyanluna_Natural_Idle',walk:'Nyanluna_Natural_WalkInPlace',cast:'Nyanluna_Game_Cast',dash:'Nyanluna_Game_Dash'};
const UPPER=/^(spine|chest|neck|head|clavicle\.|upper_arm\.|forearm\.|hand\.|fingers\.|thumb\.)/;

// Native IK and deformation drivers are baked in the GLB. Never run the old
// generic FK posing over these tracks: it loses planted feet and bone rolls.
export function createNyanlunaNaturalMotion(model,clips,bones){
  const required=Object.fromEntries(Object.entries(CLIPS).map(([key,name])=>{
    const clip=clips.find(c=>c.name===name);
    if(!clip)throw new Error(`Awakening motion missing: ${name}`);
    return [key,clip];
  }));
  const upperNodes=new Set([...bones].filter(([name])=>UPPER.test(name)).map(([,b])=>b.bone.name));
  const correctiveMeshes=[];
  model.traverse(o=>{if(o.isMesh&&o.morphTargetInfluences){correctiveMeshes.push(o);if(/SLEEVE|TORSO/.test(o.name))upperNodes.add(o.name);}});
  const overlay=clip=>{
    const result=clip.clone();
    result.tracks=result.tracks.filter(t=>upperNodes.has(THREE.PropertyBinding.parseTrackName(t.name).nodeName));
    if(!result.tracks.length)throw new Error(`Awakening overlay has no upper-body tracks: ${clip.name}`);
    return THREE.AnimationUtils.makeClipAdditive(result,0,required.idle);
  };
  const mixer=new THREE.AnimationMixer(model);
  const actions={idle:mixer.clipAction(required.idle),walk:mixer.clipAction(required.walk),cast:mixer.clipAction(overlay(required.cast)),dash:mixer.clipAction(overlay(required.dash))};
  for(const action of Object.values(actions)){action.play();action.paused=true;}
  let idleTime=0,walkTime=0,movement=0,dash=0;
  const motion={clips:Object.values(CLIPS),mixer,actions,
    reset(){idleTime=walkTime=movement=dash=0;for(const a of Object.values(actions))a.time=0;motion.update({moving:false,dash:0},0,0);},
    update(state,dt,attackTime,attackDuration=.35){
      const step=Math.max(0,dt);
      const target=state.moving?1:0;
      const gaitSeconds=target*step+(movement-target)*(1-Math.exp(-13*step))/13;
      movement=THREE.MathUtils.damp(movement,target,13,step);
      dash=THREE.MathUtils.damp(dash,state.dash>0?1:0,28,step);
      idleTime=(idleTime+step)%required.idle.duration;
      // Advance the gait locally rather than using global scene time, so a
      // stopped character does not jump to an unrelated foot phase on restart.
      walkTime=(walkTime+1.8*gaitSeconds)%required.walk.duration;
      actions.idle.time=idleTime;actions.walk.time=walkTime;
      actions.idle.setEffectiveWeight(1-movement);actions.walk.setEffectiveWeight(movement);
      actions.cast.time=THREE.MathUtils.clamp(1-attackTime/attackDuration,0,1)*required.cast.duration;
      actions.cast.setEffectiveWeight(attackTime>0?1:0);
      actions.dash.time=0;actions.dash.setEffectiveWeight(dash);
      mixer.update(0);
      for(const mesh of correctiveMeshes)for(let i=0;i<mesh.morphTargetInfluences.length;i++)mesh.morphTargetInfluences[i]=THREE.MathUtils.clamp(mesh.morphTargetInfluences[i],0,1);
      return {movement,dash};
    }
  };
  motion.reset();return motion;
}
