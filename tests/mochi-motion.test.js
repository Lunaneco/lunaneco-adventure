import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3} from 'three';
import {mochiSlimePose} from '../src/mochi-motion.js';
import {createEnemy,animateEnemy} from '../src/characters.js';

test('Mochi compresses on the floor, stretches into a hop and retains volume',()=>{
 let lowest=Infinity,highest=0,air=0,landings=0;
 for(let frame=0;frame<240;frame++){
  const pose=mochiSlimePose(frame/60,{movement:1});lowest=Math.min(lowest,pose.y);highest=Math.max(highest,pose.y);air=Math.max(air,pose.hop);
  assert.ok(Object.values(pose).every(Number.isFinite));assert.ok(Math.abs(pose.x*pose.y*pose.z-1)<1e-9);assert.ok(pose.hop>=0);
  if(pose.y<.8){assert.equal(pose.hop,0);landings++;}
 }
 assert.ok(lowest<.78&&highest>1.13&&air>.29&&landings>10);
});
test('idle stays grounded, cries squash visibly, and dashes stretch forward without excessive flattening',()=>{
 for(let i=0;i<120;i++){
  const idle=mochiSlimePose(i/60),cry=mochiSlimePose(i/60,{cry:1}),dash=mochiSlimePose(i/60,{dash:1,movement:1,cry:1,hit:1});
  assert.equal(idle.hop,0);assert.ok(idle.y>.98&&idle.y<1.02);assert.ok(cry.y<idle.y-.16);assert.ok(dash.z>dash.x*1.27);assert.ok(dash.y>=.64);
  assert.ok(Math.abs(dash.x*dash.y*dash.z-1)<1e-9);
 }
});
test('all four dark Mochis share grounded squash/hops and keep a frozen pose still',()=>{
 for(const bossId of ['darkmochi','dreammochi','bellmochi','kingmochi']){
  const root=createEnemy('boss',bossId),e={type:'boss',bossId,id:1,x:0,z:0,face:0,speed:1.5,radius:2,hit:0};let low=Infinity,high=0;
  for(let i=0;i<120;i++){animateEnemy(root,e,i/60);root.updateMatrixWorld(true);const bounds=new Box3().setFromObject(root.userData.body);assert.ok(bounds.min.y>=.014);low=Math.min(low,root.userData.body.scale.y);high=Math.max(high,root.userData.body.position.y);}
  assert.ok(low<.78&&high>.30);
  const pose=root.userData.body.matrix.clone();animateEnemy(root,{...e,mochiFrozen:true},10);root.updateMatrixWorld(true);assert.deepEqual(root.userData.body.matrix,pose);
  animateEnemy(root,{...e,cast:{kind:'chant'}},0);assert.ok(root.userData.body.scale.y<1);assert.equal(root.userData.body.position.y,.015);
 }
});
