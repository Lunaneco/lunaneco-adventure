import * as THREE from 'three';
import {part,bakeGroup} from './characters.js';
export function createPrimClaw(family='prism-claw',rank=1){
 const root=new THREE.Group(),color=family==='aurora-claw'?0xb5aaff:family==='meteor-claw'?0xffb8dc:0xa9eaff;
 root.name=`Prim claw ${family} ${rank}`;root.userData={family,variantId:`${family}-r${rank}`};
 part(root,new THREE.TorusGeometry(.19,.038,6,14),rank===4?0xe9c17f:0xc6d9e9,0,0,0).rotation.x=Math.PI/2;
 for(let i=-1;i<=1;i++){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(i*.14,0,.05),new THREE.Vector3(i*.17,.07,.3),new THREE.Vector3(i*.15,-.07,.56+rank*.04)]);part(root,new THREE.TubeGeometry(curve,7,.035+(rank-1)*.008,5,false),color,0,0,0,null,.35);}
 if(rank>=2)part(root,new THREE.OctahedronGeometry(.07+rank*.016),color,0,.11,0,null,.5);
 bakeGroup(root);return root;
}
export function buildPrismLandmarks(group){
 group.name='Prism country · crystal terraces and aurora';
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2,r=27+(i%4)*2.3,h=4+(i%5)*1.5;const crystal=part(group,new THREE.ConeGeometry(1+(i%3)*.4,h,5),[0x8bcbea,0xb9a9e5,0xa5e2de][i%3],Math.sin(a)*r,h/2-1,Math.cos(a)*r,[1,1,.8],.12);crystal.rotation.z=Math.sin(i)*.27;}
 for(let band=0;band<3;band++){
  const pts=Array.from({length:24},(_,i)=>new THREE.Vector3(-38+i*3.3,11+band*1.8+Math.sin(i*.5+band)*1.6,-27-Math.sin(i*.24)*5));
  const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),46,.22+band*.1,5,false);const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:[0x8affdf,0x86cfff,0xc8a6ff][band],transparent:true,opacity:.25,depthWrite:false}));group.add(mesh);
 }
}
export function prismBeamVisual(event,height){
 const root=new THREE.Group();root.name='Prim straight prism breath';if(event.mouth)root.position.copy(event.mouth);else root.position.set(event.x,height+1.45,event.z);root.rotation.y=event.angle;
 const colors=[0xffadc8,0xffdfa8,0xceffb8,0x8affeb,0x99cdff,0xc3a9ff,0xf0bbff];
 colors.forEach((color,i)=>{const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false});const beam=new THREE.Mesh(new THREE.CylinderGeometry(.09,.18,event.range,7),material);beam.rotation.x=Math.PI/2;beam.position.set((i-3)*event.width/8,0,event.range/2);root.add(beam);});
 return {mesh:root,life:.28,max:.28,prism:true};
}
export function dressPrismTerrain(group,layout,contains){
 const vertices=[],colors=[],palette=[0x86acc8,0x92bdd8,0xa9d0e6,0xb0c4e5,0x8cbad4].map(c=>new THREE.Color(c));
 for(let x=-24;x<24;x+=3)for(let z=-26;z<26;z+=3){
  for(const points of [[[x,z],[x+3,z],[x,z+3]],[[x+3,z],[x+3,z+3],[x,z+3]]]){
   if(!points.every(([a,b])=>contains(layout,a,b,.05))||layout.stairs&&z<-6&&Math.abs(x)<4)continue;
   const color=palette[Math.abs(Math.round(x*13+z*7))%palette.length];for(const [a,b]of points){vertices.push(a,layout.height+.026,b);colors.push(color.r,color.g,color.b);}
  }
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.38,metalness:.15,side:THREE.DoubleSide});const floor=new THREE.Mesh(geo,material);floor.receiveShadow=true;group.add(floor);
 for(let i=0;i<layout.points.length;i+=2){const [x,z]=layout.points[i];for(let n=0;n<3;n++){const c=part(group,new THREE.ConeGeometry(.25+n*.07,1+n*.5,5),[0x8fe1ff,0xbcafff,0xa4e9e1][n],x*1.03+n*.24,layout.height+.5+n*.25,z*1.03,[1,1,.8],.2);c.rotation.z=(n-1)*.2;}}
 return material;
}
