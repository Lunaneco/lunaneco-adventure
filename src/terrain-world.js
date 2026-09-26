import {MOCHI_PALETTES} from './mochi-country.js';
import {publicUrl} from './public-url.js';
import * as THREE from 'three';
import {part,bakeGroup} from './characters.js';
import {contains,heightAt,ROUTE_PORTALS} from './terrain.js';
import {COUNTRY_PALETTES,dressCountryTerrain} from './musubi-country.js';
const PALETTE={meadow:[0x577a6d,0x426473,0xc0d0b0],stone:[0x8e9fac,0x445c7c,0xc3cecf],clock:[0x839c9d,0x4d5872,0xe7c995],sky:[0x92b3ba,0x536b8d,0xe0dbc1],sanctuary:[0xc4bfa3,0x776e87,0xf1d4a3],eclipse:[0x91849f,0x4c4663,0xe9a7bd]};
function shapeFor(points){const s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();return s;}
export class TerrainWorld{
 constructor(world){this.world=world;this.root=new THREE.Group();this.root.name='Stage-specific walkable terrain';world.scene.add(this.root);this.id=null;this.markers=new THREE.Group();world.scene.add(this.markers);this.materials=[];this.markerGroups=[];this.closedGate=null;
  this.surfaces={};this.surfaceFailures=[];const loader=new THREE.TextureLoader();
  this.ready=Promise.all(['earth','stone'].map(async key=>{
   try{const texture=await loader.loadAsync(publicUrl(`assets/fields/musubi-${key}.webp`));texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(12,13);texture.anisotropy=Math.min(4,world.renderer.capabilities.getMaxAnisotropy());this.surfaces[key]=texture;}
   catch{this.surfaceFailures.push(key);}
  }));
 }
 dispose(){this.root.traverse(o=>o.geometry?.dispose());this.root.clear();this.materials.forEach(m=>m.dispose());this.materials=[];this.markers.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.markers.clear();this.markerGroups=[];}
 mat(options){const m=new THREE.MeshStandardMaterial(options);this.materials.push(m);return m;}
 build(layout){
  this.dispose();this.id=layout.id;this.layout=layout;const [ground,side,accent]=(MOCHI_PALETTES[layout.mochi]??COUNTRY_PALETTES[layout.country]??PALETTE[layout.style]),shape=shapeFor(layout.points),y=layout.height;
  const cliffGeo=new THREE.ExtrudeGeometry(shape,{depth:4,bevelEnabled:false}),vertices=cliffGeo.attributes.position;for(let i=0;i<vertices.count;i++){if(!layout.country&&vertices.getZ(i)===0){const x=vertices.getX(i),z=vertices.getY(i),scale=.79+Math.sin(Math.atan2(z,x)*5)*.035;vertices.setXYZ(i,x*scale,z*scale,0);}}cliffGeo.computeVertexNormals();const cliff=new THREE.Mesh(cliffGeo,this.mat({color:side,roughness:1}));cliff.rotation.x=-Math.PI/2;cliff.position.y=y-4;cliff.receiveShadow=true;cliff.castShadow=true;this.root.add(cliff);
  const map=layout.country?this.surfaces[layout.country==='village'||layout.country==='valley'?'earth':'stone']:layout.style==='meadow'||layout.style==='sky'?this.world.ground.material.map:this.world.floor.material.map;
  const topGeo=new THREE.ShapeGeometry(shape),uv=topGeo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/48+.5,uv.getY(i)/52+.5);const top=new THREE.Mesh(topGeo,this.mat({color:ground,map,roughness:1}));top.rotation.x=-Math.PI/2;top.position.y=y+.012;top.receiveShadow=true;this.root.add(top);
  const edges=new THREE.Group();edges.name=layout.country?'Homusubi field details':'Field edge details';this.root.add(edges);
  if(!layout.country)for(let i=0;i<layout.points.length;i+=2){const [x,z]=layout.points[i],px=x*.84,pz=z*.84;if(contains(layout,px,pz,1)){const rock=part(edges,new THREE.ConeGeometry(2,3.2+(i%3)*.7,5),side,px,y-4,pz,[1,1,.8]);rock.rotation.z=Math.PI;}}
  for(let i=0;i<layout.points.length;i++){
   const a=layout.points[i],b=layout.points[(i+1)%layout.points.length],d=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=Math.atan2(b[0]-a[0],b[1]-a[1]),x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;
   // Solid coping shows the exact edge of the traversable footprint.
   const lip=part(edges,new THREE.BoxGeometry(.24,.24,d),accent,x,y+.07,z);lip.rotation.y=angle;
   const band=part(edges,new THREE.BoxGeometry(.06,.055,d-.1),layout.country?accent:layout.style==='eclipse'?0xff88b4:0xc5e9e8,x,y+.21,z,null,.3);band.rotation.y=angle;
   if(!layout.country&&i%2===0){part(edges,new THREE.CylinderGeometry(.32,.4,.8,6),side,a[0],y+.3,a[1]);part(edges,new THREE.OctahedronGeometry(.18),accent,a[0],y+.88,a[1],[1,1.5,1],.4);}
  }
  // Broken paving follows the room, so disconnected voids remain visibly empty.
  if(!layout.country)for(let z=-23;z<19;z+=2)for(let x=-2;x<=2;x+=2)if(contains(layout,x,z,1.3)&&!(layout.stairs&&z<-6))part(edges,new THREE.BoxGeometry(1.68,.055,1.66),accent,x,y+.04,z);
  if(!layout.country&&layout.style==='clock'){
   for(const radius of [4.5,7]){const r=part(edges,new THREE.TorusGeometry(radius,.065,5,64),accent,0,y+.09,0,null,.2);r.rotation.x=Math.PI/2;}
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const tick=part(edges,new THREE.BoxGeometry(.13,.075,.65),accent,Math.sin(a)*6,y+.08,Math.cos(a)*6);tick.rotation.y=a;}
  }
  if(!layout.country&&(layout.style==='meadow'||layout.style==='sky')){
   const dummy=new THREE.Object3D(),geo=new THREE.ConeGeometry(.16,.47,3),mat=this.mat({color:layout.style==='sky'?0x8eafb7:0x9fbca3,roughness:1}),positions=[];
   for(let i=0;i<900;i++){const x=Math.sin(i*17.13)*24,z=Math.cos(i*11.47)*25;if(contains(layout,x,z,.6)&&Math.abs(x)>3&&!contains(layout,x,z,3))positions.push([x,z]);}
   const grass=new THREE.InstancedMesh(geo,mat,positions.length);positions.forEach(([x,z],i)=>{dummy.position.set(x,y+.22,z);dummy.rotation.y=i*1.17;dummy.scale.set(1,.65+(i%5)*.13,1);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);});grass.receiveShadow=true;this.root.add(grass);
  }
  // Landmark silhouettes vary with the place, beyond the actual walking edge.
  if(!layout.country)for(let i=0;i<layout.points.length;i+=3){const [x,z]=layout.points[i];if(x*.53+z*.74>8)continue;const dx=x*.04,dz=z*.04;
   if(layout.style==='meadow'){part(edges,new THREE.CylinderGeometry(.14,.32,2.6,7),0x665d58,x+dx,y+1.1,z+dz);part(edges,new THREE.IcosahedronGeometry(1.4,1),0x719588,x+dx,y+2.8,z+dz,[1,.7,1]);}
   else{part(edges,new THREE.CylinderGeometry(.38,.58,2.7,8),ground,x+dx,y+1.2,z+dz);part(edges,new THREE.BoxGeometry(1.2,.22,1.2),accent,x+dx,y+2.6,z+dz);if(layout.style==='sky')part(edges,new THREE.ConeGeometry(.1,.6,4),0xe2e7d6,x+dx,y+3.2,z+dz);}
  }
  if(layout.stairs){
   for(let i=0;i<18;i++){const rise=(i+1)*.25;part(edges,new THREE.BoxGeometry(6.5,rise,.52),i%2?accent:ground,0,rise/2,-7-(i+.5)*.5);}
   part(edges,new THREE.BoxGeometry(6.5,4.5,3),ground,0,2.25,-17.5);
   for(const sign of [-1,1]){for(let i=0;i<7;i++){const z=-7-i*1.5,y=-.5*(z+7);part(edges,new THREE.CylinderGeometry(.095,.14,.9,6),accent,sign*3.1,y+.45,z);}
    const rail=part(edges,new THREE.BoxGeometry(.13,.13,10.1),accent,sign*3.1,3.08,-11.5);rail.rotation.x=.464;
   }
   this.closedGate=new THREE.Group();this.closedGate.position.set(0,1.4,-6.8);this.root.add(this.closedGate);
   part(this.closedGate,new THREE.BoxGeometry(6.5,2.6,.16),0x7bacce,0,0,0,[1,1,1],.3).material=this.mat({color:0x8ed5ff,transparent:true,opacity:.28,roughness:.4});
   for(let x=-3;x<=3;x++)part(this.closedGate,new THREE.BoxGeometry(.065,2.6,.08),0xc5e9ff,x,0,.1,null,.5);
  }else this.closedGate=null;
  dressCountryTerrain(edges,layout);this.countryProps=edges.userData.countryProps??[];
  bakeGroup(edges);
  const portals=layout.stairs?[{id:'stairs',...layout.stairPoint,color:0x9cdcff}]:layout.id.endsWith('fork')?ROUTE_PORTALS:[];
  for(const portal of portals){const group=new THREE.Group();group.userData.portal=portal;group.position.set(portal.x,heightAt(layout,portal.x,portal.z)+.14,portal.z);this.markers.add(group);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(portal.radius,.075,7,40),new THREE.MeshBasicMaterial({color:portal.color}));ring.rotation.x=-Math.PI/2;group.add(ring);
   const arch=new THREE.Mesh(new THREE.TorusGeometry(1.9,.14,8,40,Math.PI),new THREE.MeshStandardMaterial({color:portal.color,emissive:portal.color,emissiveIntensity:.4}));arch.position.y=2;group.add(arch);
   for(const side of [-1,1]){const column=new THREE.Mesh(new THREE.CylinderGeometry(.15,.24,2,7),new THREE.MeshStandardMaterial({color:portal.color}));column.position.set(side*1.9,1,0);group.add(column);}
   const star=new THREE.Mesh(new THREE.OctahedronGeometry(.3),new THREE.MeshBasicMaterial({color:portal.color}));star.position.y=1.7;group.add(star);this.markerGroups.push(group);
  }
 }
 update(game,time){
  if(!game){this.root.visible=false;this.markers.visible=false;return;}
  if(this.id!==game.layout.id)this.build(game.layout);this.root.visible=true;this.markers.visible=true;
  if(this.closedGate)this.closedGate.visible=!game.travelOpen;
  for(const group of this.markerGroups){const active=game.travelTargets.some(t=>t.id===group.userData.portal.id);group.scale.setScalar(active?1:.85);group.children.forEach(m=>{m.material.transparent=true;m.material.opacity=active?1:.28;});const star=group.children.at(-1);star.rotation.y=this.world.settings.motion===false?0:time;}
 }
}
