import * as THREE from 'three';
import {heightAt} from './terrain.js';
import {FLOOR_TYPES,floorPatchesFor,floorPhase} from './special-floors.js';

export function buildSpecialFloors(terrain,layout){
 const entries=[];
 const material=options=>{const m=new THREE.MeshBasicMaterial({depthWrite:false,transparent:true,toneMapped:false,...options});terrain.materials.push(m);return m;};
 for(const patch of floorPatchesFor(layout)){
  const spec=FLOOR_TYPES[patch.type],group=new THREE.Group();group.name=`Special floor: ${spec.name}`;group.position.set(patch.x,heightAt(layout,patch.x,patch.z)+.13,patch.z);terrain.root.add(group);
  const flat=(geometry,mat,y)=>{const mesh=new THREE.Mesh(geometry,mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;group.add(mesh);return mesh;};
  const fill=flat(new THREE.CircleGeometry(patch.radius,40),material({color:spec.color,opacity:.16}),0);
  const rim=flat(new THREE.RingGeometry(patch.radius-.10,patch.radius,40),material({color:spec.color,opacity:.9}),.015);
  const warning=flat(new THREE.CircleGeometry(patch.radius-.16,40),material({color:spec.color,opacity:.2}),.022);warning.visible=false;
  // Distinct symbols remain readable without colour: spikes, waves, chevrons, plus.
  const segments=[];const line=(ax,az,bx,bz)=>segments.push(ax,.035,az,bx,.035,bz);
  if(spec.kind==='damage'){
   const r=patch.radius*.77;for(let i=0;i<8;i++){const a=i*Math.PI/4,b=a+.2,c=a-.2;line(Math.sin(b)*r,Math.cos(b)*r,Math.sin(a)*(r-.45),Math.cos(a)*(r-.45));line(Math.sin(a)*(r-.45),Math.cos(a)*(r-.45),Math.sin(c)*r,Math.cos(c)*r);}
   line(-.65,-.65,.65,.65);line(-.65,.65,.65,-.65);
  }else if(spec.kind==='heal'){
   for(const d of [-.12,0,.12]){line(-.82,d,.82,d);line(d,-.82,d,.82);}
  }else if(spec.kind==='boost'){
   for(const z of [-.6,.2,.95]){line(-.7,z,.0,z-.55);line(0,z-.55,.7,z);}
  }else{
   for(const z of [-.65,0,.65])for(let i=0;i<8;i++){const x=-1+i*.25;line(x,z+Math.sin(x*4)*.13,x+.25,z+Math.sin((x+.25)*4)*.13);}
  }
  const glyph=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(segments,3)),material({color:0xf2fcff,opacity:.95}));group.add(glyph);
  let spikes=null;
  if(spec.kind==='damage'){
   spikes=new THREE.InstancedMesh(new THREE.ConeGeometry(.17,.8,4),material({color:spec.color,opacity:.85}),8);
   const point=new THREE.Object3D();for(let i=0;i<8;i++){const a=i*Math.PI/4;point.position.set(Math.sin(a)*patch.radius*.72,.4,Math.cos(a)*patch.radius*.72);point.updateMatrix();spikes.setMatrixAt(i,point.matrix);}spikes.visible=false;group.add(spikes);
  }
  entries.push({patch,spec,fill,rim,warning,glyph,spikes,group});
 }
 return entries;
}
export function updateSpecialFloors(entries,game){
 for(const entry of entries){
  const {phase,progress}=floorPhase(game,entry.patch),damage=entry.spec.kind==='damage',spent=phase==='spent';
  entry.group.userData.phase=phase;
  entry.fill.material.opacity=spent?.04:damage?phase==='active'?.57:phase==='warning'?.20:.09:phase==='quiet'?.06:.22;
  entry.rim.material.opacity=spent?.22:phase==='quiet'?.45:1;
  entry.glyph.material.opacity=spent?.22:phase==='quiet'?.5:1;
  entry.warning.visible=damage&&phase==='warning';entry.warning.scale.setScalar(.12+.88*progress);
  if(entry.spikes)entry.spikes.visible=phase==='active';
  entry.rim.material.color.setHex(damage&&phase==='active'?0xffedaa:entry.spec.color);
 }
}
