import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createNyanlunaNaturalMotion} from '../src/nyanluna-natural-motion.js';

function fixture(){
 const model=new THREE.Group(),head=new THREE.Bone(),pelvis=new THREE.Bone(),hand=new THREE.Bone();
 head.name='head';pelvis.name='pelvis';hand.name='handR';model.add(pelvis);pelvis.add(head,hand);
 const bones=new Map([['head',{bone:head}],['pelvis',{bone:pelvis}],['hand.R',{bone:hand}]]);
 const names=['Nyanluna_Natural_Idle','Nyanluna_Natural_WalkInPlace','Nyanluna_Game_Cast','Nyanluna_Game_Dash'];
 const clips=names.map((name,i)=>new THREE.AnimationClip(name,1,[
  new THREE.VectorKeyframeTrack('pelvis.position',[0,.5,1],[0,0,0,0,i===1?.02:0,0,0,0,0]),
  new THREE.QuaternionKeyframeTrack('head.quaternion',[0,.5,1],[0,0,0,1,0,Math.sin(i*.05),0,Math.cos(i*.05),0,0,0,1]),
  new THREE.QuaternionKeyframeTrack('handR.quaternion',[0,.5,1],[0,0,0,1,Math.sin(i*.1),0,0,Math.cos(i*.1),0,0,0,1])
 ]));
 const motion=createNyanlunaNaturalMotion(model,clips,bones);return {motion,head,hand,pelvis};
}
test('natural movement blends, pauses and resets without a global-time jump',()=>{
 const {motion,hand}=fixture();
 motion.update({moving:true,dash:0},.1,0);assert.ok(motion.actions.walk.getEffectiveWeight()>0&&motion.actions.walk.getEffectiveWeight()<1);
 const before=motion.actions.walk.time,q=hand.quaternion.clone();motion.update({moving:false,dash:0},0,0);
 assert.equal(motion.actions.walk.time,before);assert.ok(q.angleTo(hand.quaternion)<1e-7);
 motion.reset();assert.equal(motion.actions.walk.time,0);assert.equal(motion.actions.walk.getEffectiveWeight(),0);assert.equal(motion.actions.cast.getEffectiveWeight(),0);assert.equal(motion.actions.dash.getEffectiveWeight(),0);
});
test('walking phase and blend agree at 30 and 60 fps, including stops',()=>{
 const simulate=fps=>{const {motion}=fixture();for(const moving of [true,false,true])for(let i=0;i<fps;i++)motion.update({moving,dash:0},1/fps,0);return motion;};
 const a=simulate(30),b=simulate(60);assert.ok(Math.abs(a.actions.walk.time-b.actions.walk.time)<1e-9);assert.ok(Math.abs(a.actions.walk.getEffectiveWeight()-b.actions.walk.getEffectiveWeight())<1e-9);
});
test('cast and dash overlays do not override the planted pelvis or gait',()=>{
 const {motion,hand,pelvis}=fixture();motion.update({moving:true,dash:.2},.1,.175);
 assert.ok(hand.quaternion.angleTo(new THREE.Quaternion())>.05);
 assert.ok(motion.actions.cast.getClip().tracks.every(t=>!t.name.startsWith('pelvis.')));
 assert.ok(motion.actions.dash.getClip().tracks.every(t=>!t.name.startsWith('pelvis.')));
 assert.ok(pelvis.position.y<.02);
 motion.update({moving:true,dash:0},.6,0);assert.equal(motion.actions.cast.getEffectiveWeight(),0);assert.ok(motion.actions.dash.getEffectiveWeight()<1e-6);
});
test('missing native clips fail clearly instead of reverting to incompatible FK',()=>{
 assert.throws(()=>createNyanlunaNaturalMotion(new THREE.Group(),[],new Map()),/Awakening motion missing/);
});
