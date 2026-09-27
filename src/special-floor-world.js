import * as THREE from 'three';
import {heightAt} from './terrain.js';
import {FLOOR_TYPES,floorPatchesFor} from './special-floors.js';
import {FLOOR_VISUALS,floorReadout} from './floor-appearance.js';

export function buildSpecialFloors(terrain,layout){
 const entries=[];
 const material=options=>{const m=new THREE.MeshBasicMaterial({depthWrite:false,transparent:true,toneMapped:false,...options});terrain.materials.push(m);return m;};
 for(const patch of floorPatchesFor(layout)){
  const spec=FLOOR_TYPES[patch.type],visual=FLOOR_VISUALS[spec.kind],r=patch.radius,group=new THREE.Group();
  group.name=`Special floor: ${spec.name}`;group.position.set(patch.x,heightAt(layout,patch.x,patch.z)+.15,patch.z);terrain.root.add(group);
  const flat=(geometry,mat,y)=>{const mesh=new THREE.Mesh(geometry,mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;group.add(mesh);return mesh;};
  // A dark backing keeps the boundary visible over bright stone, grass and snow.
  const backing=flat(new THREE.CircleGeometry(r,48),material({color:visual.base,opacity:.87}),0);
  const fill=flat(new THREE.CircleGeometry(r-.23,48),material({color:visual.color,opacity:.14}),.01);
  const rim=flat(new THREE.RingGeometry(r-.20,r,48),material({color:visual.color,opacity:1}),.02);
  const rimEdge=flat(new THREE.RingGeometry(r-.25,r-.20,48),material({color:0xffffff,opacity:.8}),.025);
  const warning=flat(new THREE.RingGeometry(.62,r-.33,48,1,0,Math.PI*2),material({color:0xffdf83,opacity:.8}),.03);warning.visible=false;
  // Filled strokes have a real world-space width; WebGL's one-pixel lines do not.
  const strokes=[];
  const line=(ax,az,bx,bz,width=.23)=>{
   const length=Math.hypot(bx-ax,bz-az),dx=-(bz-az)/length*width/2,dz=(bx-ax)/length*width/2;
   const a=[ax+dx,.065,az+dz],b=[ax-dx,.065,az-dz],c=[bx-dx,.065,bz-dz],d=[bx+dx,.065,bz+dz];
   strokes.push(...a,...b,...c,...a,...c,...d);
  };
  if(spec.kind==='damage'){
   line(-.64,-.64,.64,.64,.31);line(-.64,.64,.64,-.64,.31);
   for(let i=0;i<8;i++){const a=i*Math.PI/4,outer=r-.34,inner=r-.73;line(Math.sin(a-.13)*outer,Math.cos(a-.13)*outer,Math.sin(a)*inner,Math.cos(a)*inner,.18);line(Math.sin(a)*inner,Math.cos(a)*inner,Math.sin(a+.13)*outer,Math.cos(a+.13)*outer,.18);}
  }else if(spec.kind==='heal'){
   line(-.84,0,.84,0,.4);line(0,-.84,0,.84,.4);
   flat(new THREE.RingGeometry(r-.48,r-.39,48),rim.material,.035);
  }else if(spec.kind==='boost'){
   for(const z of [-.65,.05,.75]){line(-.67,z,.0,z-.48,.29);line(0,z-.48,.67,z,.29);}
  }else{
   rim.visible=false;
   for(let i=0;i<12;i++)flat(new THREE.RingGeometry(r-.20,r,5,1,i*Math.PI/6,Math.PI/9),rim.material,.02);
   for(const z of [-.6,0,.6])for(let i=0;i<8;i++){const x=-.95+i*.24;line(x,z+Math.sin(x*4)*.17,x+.24,z+Math.sin((x+.24)*4)*.17,.19);}
  }
  const glyph=new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(strokes,3)),material({color:0xffffff,opacity:1,side:THREE.DoubleSide}));group.add(glyph);
  const charges=[];
  if(spec.kind==='heal')for(let i=0;i<spec.charges;i++){
   const a=-.6+i*.6,dot=flat(new THREE.CircleGeometry(.19,12),material({color:0xffffff,opacity:1}),.08);
   dot.position.x=Math.sin(a)*(r-.67);dot.position.z=Math.cos(a)*(r-.67);charges.push(dot);
  }
  let spikes=null;
  if(spec.kind==='damage'){
   spikes=new THREE.InstancedMesh(new THREE.ConeGeometry(.19,.85,4),material({color:visual.color,opacity:1}),8);
   const point=new THREE.Object3D();for(let i=0;i<8;i++){const a=i*Math.PI/4;point.position.set(Math.sin(a)*r*.75,.43,Math.cos(a)*r*.75);point.updateMatrix();spikes.setMatrixAt(i,point.matrix);}spikes.visible=false;group.add(spikes);
  }
  entries.push({patch,spec,visual,backing,fill,rim,rimEdge,warning,glyph,spikes,charges,group});
 }
 return entries;
}
export function updateSpecialFloors(entries,game){
 for(const entry of entries){
  const {phase,remaining,progress}=floorReadout(game,entry.patch),damage=entry.spec.kind==='damage',spent=phase==='spent';
  entry.group.userData.phase=phase;
  entry.backing.material.opacity=spent?.72:.87;entry.backing.material.color.setHex(spent?0x25323a:entry.visual.base);
  entry.fill.material.opacity=spent?.04:damage?phase==='active'?.5:phase==='warning'?.26:.10:.2;
  entry.rim.material.color.setHex(spent?0x91a3ae:entry.visual.color);
  entry.rim.material.opacity=spent?.55:1;entry.rimEdge.material.opacity=spent?.3:.8;
  entry.glyph.material.opacity=spent?.42:1;
  entry.warning.visible=damage&&phase==='warning';
  if(entry.warning.visible){
   // Reveal the warning arc without allocating a geometry on every frame.
   const total=entry.warning.geometry.index.count,triangles=Math.floor(Math.max(0,Math.min(1,progress))*total/6)*6;
   entry.warning.geometry.setDrawRange(0,triangles);
  }
  if(entry.spikes)entry.spikes.visible=phase==='active';
  entry.charges.forEach((dot,i)=>{dot.material.opacity=i<remaining?1:.18;});
 }
}
