import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {FIELD_CAMERA,resizeFieldCamera} from '../src/field-camera.js';

const sizes=[[390,844],[320,568],[375,667],[430,932],[390,720],[844,390],[768,1024],[1440,900],[2560,1440]];
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} !== ${b}`);
function cameraAt(x=0,y=0,z=0){
  const c=new PerspectiveCamera(42,1,.1,230);
  c.position.set(x+FIELD_CAMERA.offset.x,y+FIELD_CAMERA.offset.y,z+FIELD_CAMERA.offset.z);
  c.lookAt(x,y+FIELD_CAMERA.lookHeight,z);c.updateMatrixWorld();return c;
}
function point(c,p,w,h){const v=new Vector3(...p).project(c);return [(v.x+1)*w/2,(1-v.y)*h/2];}
function extent(c,a,b,w,h){const p=point(c,a,w,h),q=point(c,b,w,h);return [q[0]-p[0],q[1]-p[1]];}

test('actors, terrain and telegraphs keep their CSS-pixel scale across viewport sizes',()=>{
  const c=cameraAt();
  const segments=[[[0,0,0],[0,2.8,0]],[[-2,0,0],[2,0,0]],[[0,0,-5],[0,0,5]],[[5,0,-8],[5,4,-8]]];
  resizeFieldCamera(c,390,844);
  const reference=segments.map(([a,b])=>extent(c,a,b,390,844));
  for(const [w,h] of sizes){
    resizeFieldCamera(c,w,h);
    segments.forEach(([a,b],i)=>extent(c,a,b,w,h).forEach((n,j)=>close(n,reference[i][j])));
    // Pixels per camera-plane unit must be identical horizontally and vertically.
    close(c.projectionMatrix.elements[0]*w,c.projectionMatrix.elements[5]*h);
  }
});

test('larger screens reveal more field and preserve the existing reference framing',()=>{
  const c=cameraAt();resizeFieldCamera(c,390,844);close(c.fov,42);
  for(const [w,h] of sizes){
    resizeFieldCamera(c,w,h);const p=point(c,[3,0,-4],w,h);
    const base=cameraAt();resizeFieldCamera(base,390,844);const q=point(base,[3,0,-4],390,844);
    close(p[0]-w/2,q[0]-390/2);close(p[1]-h/2,q[1]-844/2);
  }
});

test('tutorial offset translates the frame without stretching or zooming it and clears on rotation',()=>{
  const c=cameraAt(),a=[0,0,0],b=[0,2.8,0];
  resizeFieldCamera(c,320,568);const original=extent(c,a,b,320,568),p=point(c,a,320,568);
  resizeFieldCamera(c,320,568,true);const shifted=point(c,a,320,568);
  extent(c,a,b,320,568).forEach((v,i)=>close(v,original[i]));close(shifted[0],p[0]);close(shifted[1]-p[1],568*.24);
  resizeFieldCamera(c,844,390,true);assert.equal(c.view.enabled,false);
  extent(c,a,b,844,390).forEach((v,i)=>close(v,original[i]));
  resizeFieldCamera(c,320,568,true);resizeFieldCamera(c,320,568,false);
  point(c,a,320,568).forEach((v,i)=>close(v,p[i]));
});

test('moving to a raised floor retains actor scale and zero-sized transient layouts remain finite',()=>{
  const ground=cameraAt(),roof=cameraAt(0,4.5,0);
  for(const [w,h] of sizes){
    resizeFieldCamera(ground,w,h);resizeFieldCamera(roof,w,h);
    const a=extent(ground,[0,0,0],[0,2.8,0],w,h),b=extent(roof,[0,4.5,0],[0,7.3,0],w,h);
    a.forEach((v,i)=>close(v,b[i]));
  }
  resizeFieldCamera(ground,0,0);assert.ok(ground.projectionMatrix.elements.every(Number.isFinite));
});
