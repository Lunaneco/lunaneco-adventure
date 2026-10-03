import * as THREE from 'three';

// Only light is equipped: the supplied hand remains empty.
export function createLumiFingerLight(id='lumi-rail-cyan',rank=1){
 const color=id==='lumi-rail-violet'?0xba9fff:id==='lumi-rail-rose'?0xff9ecb:0x8feaff,g=new THREE.Group();
 const light=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));
 g.add(light);g.name='Lumi fingertip light';g.userData={family:id,variantId:`${id}-r${rank}`,color,light};return g;
}
function sculptedLumiEarGeometry(){
 // Closed, smoothly rounded pinna: a raised cream rim, recessed pink bowl,
 // and a convex hair-coloured back. All colour belongs to opaque geometry.
 const outline=new THREE.CatmullRomCurve3([
  [-.29,0],[.04,-.06],[.30,.025],[.34,.22],[.34,.53],[.31,.64],
  [.26,.655],[.12,.53],[-.06,.33],[-.23,.15],
 ].map(([x,y])=>new THREE.Vector3(x,y,0)),true,'centripetal');
 const segments=64,rings=14,center=new THREE.Vector2(.015,.23),points=outline.getSpacedPoints(segments).slice(0,-1),positions=[],colors=[],indices=[];
 const cream=new THREE.Color(0xe7dcd2),pink=new THREE.Color(0xe9a8b7),softPink=new THREE.Color(0xf0c4ca),backCream=new THREE.Color(0xdbcec8);
 const add=(x,y,z,color)=>{const index=positions.length/3;positions.push(x,y,z);colors.push(color.r,color.g,color.b);return index;};
 const surfaces=[];
 for(const front of [true,false]){
  const rows=[[add(center.x,center.y,front?.058:-.105,front?pink:backCream)]];
  for(let i=1;i<=rings;i++){
   const r=i/rings,row=[];
   for(let j=0;j<segments;j++){
    if(!front&&i===rings){row.push(surfaces[0].at(-1)[j]);continue;}
    const edge=points[j],x=THREE.MathUtils.lerp(center.x,edge.x,r),y=THREE.MathUtils.lerp(center.y,edge.y,r),angle=Math.atan2(edge.y-center.y,edge.x-center.x);
    const rim=Math.exp(-(((r-.84)/.14)**2)),z=front?.025+.115*rim+.032*(1-r):.025-.13*(1-r*r);
    // A broad soft tuft boundary in the lower bowl; no noisy fur texture.
    const tuft=angle<0?.035*Math.cos(angle*5):0,blend=THREE.MathUtils.smoothstep(r+tuft,.57,.82);
    const color=front?pink.clone().lerp(softPink,THREE.MathUtils.smoothstep(r,.2,.62)).lerp(cream,blend):backCream.clone().lerp(cream,r*.75);
    row.push(add(x,y,z,color));
   }
   rows.push(row);
  }
  const triangle=(a,b,c)=>indices.push(...(front?[a,b,c]:[a,c,b]));
  for(let j=0;j<segments;j++)triangle(rows[0][0],rows[1][j],rows[1][(j+1)%segments]);
  for(let i=1;i<rings;i++)for(let j=0;j<segments;j++){const next=(j+1)%segments;triangle(rows[i][j],rows[i+1][j],rows[i+1][next]);triangle(rows[i][j],rows[i+1][next],rows[i][next]);}
  surfaces.push(rows);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
export function createLumiEars(){
 const g=new THREE.Group();g.name='Neko Lumi ears';g.userData.designVersion='sculpted-small-pinna-v3';
 const geometry=sculptedLumiEarGeometry(),material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,metalness:0});
 for(const sign of [-1,1]){
  const ear=new THREE.Mesh(geometry,material);ear.name=sign<0?'Neko Lumi ear L':'Neko Lumi ear R';ear.position.set(sign*.41,-.02,-.015);ear.scale.set(sign*.60,.55,.65);ear.rotation.z=sign*-.08;ear.castShadow=true;ear.receiveShadow=false;g.add(ear);
 }
 g.visible=false;return g;
}
export function updateLumiEars(root,neko){
 const d=root.userData;if(!d.ears)return;d.ears.visible=neko;root.updateMatrixWorld(true);
 const head=d.bones.get('head').bone,p=head.getWorldPosition(new THREE.Vector3());d.rig.worldToLocal(p);
 // The 3.1-unit bounds include the ahoge. Seat the ear bases inside the
 // curved scalp, not above the top of the character's bounding box.
 if(!d.earsOffset)d.earsOffset=new THREE.Vector3(0,2.76-p.y,.04);
 const relative=head.getWorldQuaternion(new THREE.Quaternion()).premultiply(d.rig.getWorldQuaternion(new THREE.Quaternion()).invert());
 // Follow pose delta only; the source head bone's bind basis faces backwards.
 // Applying that authored basis to a new ear would hide its pink front.
 if(!d.earsRestQuaternion)d.earsRestQuaternion=relative.clone().invert();
 const rotation=relative.multiply(d.earsRestQuaternion);
 d.ears.position.copy(p).add(d.earsOffset.clone().applyQuaternion(rotation));d.ears.quaternion.copy(rotation);
}
export function lumiRailVisual(origin,event){
 if(event.nekoBurst)return nekoRailVisual(origin,event);
 const g=new THREE.Group(),distance=Math.min(90,Math.max(.1,event.range)),direction=new THREE.Vector3(Math.sin(event.angle),0,Math.cos(event.angle));
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(event.ultimate?.075:.035,event.ultimate?.075:.035,distance,8),new THREE.MeshBasicMaterial({color:event.color??0x8feaff,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));
 beam.position.copy(direction).multiplyScalar(distance/2);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);g.add(beam);g.position.copy(origin);g.userData.mechanicalRange=event.range;return g;
}
function nekoRailVisual(origin,event){
 const g=new THREE.Group(),distance=Math.min(90,Math.max(.1,event.range)),color=event.color??0x8feaff,finisher=event.pulse===2;
 g.name='Neko Lumi · triple piercing rail';g.position.copy(origin);g.rotation.y=event.angle;
 const layers=[];
 const add=(geometry,tint,opacity)=>{
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:tint,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));
  mesh.userData.baseOpacity=opacity;layers.push(mesh);g.add(mesh);return mesh;
 };
 const ray=(radius,tint,opacity,x=0)=>{
  const mesh=add(new THREE.CylinderGeometry(radius,radius,distance,6).rotateX(Math.PI/2),tint,opacity);
  mesh.position.set(x,0,distance/2);return mesh;
 };
 ray(finisher?.10:.075,color,.25);ray(finisher?.034:.025,0xf5fbff,.95);
 for(const sign of [-1,1])ray(.009,color,.6,sign*.11);
 const muzzle=add(new THREE.TorusGeometry(.18,.017,6,24),color,.8);muzzle.position.z=.10;
 const flash=add(new THREE.OctahedronGeometry(.13),0xf4faff,.85);flash.scale.set(.65,.65,2.8);flash.position.z=.13;
 const travel=[];
 for(let i=0;i<2;i++){
  const ring=add(new THREE.TorusGeometry(.14+i*.045,.013,6,20),color,.6);ring.position.z=.25;travel.push(ring);
 }
 g.userData={mechanicalRange:event.range,distance,layers,muzzle,flash,travel,pulse:event.pulse};return g;
}
export function updateNekoRailVisual(effect,dt){
 effect.life=Math.max(0,effect.life-dt);
 const progress=1-effect.life/effect.max,{distance,layers,muzzle,flash,travel}=effect.mesh.userData;
 const fade=(1-progress)**1.5;
 for(const mesh of layers)mesh.material.opacity=mesh.userData.baseOpacity*fade;
 muzzle.scale.setScalar(.75+progress*2.1);flash.scale.set(.65*(1-progress),.65*(1-progress),2.8*(1-progress));
 for(const [i,ring] of travel.entries()){
  ring.position.z=Math.min(distance,.25+distance*Math.min(1,progress*1.5+i*.12));
  ring.scale.setScalar(1+progress*.7);
 }
}
export function buildKemoVillage(group,index,{part}){
 // All decorative rubble is outside the walking footprint.
 for(const side of [-1,1])for(let i=0;i<3;i++){
  const house=new THREE.Group();house.position.set(side*(27+i%2*5),-.3,-19+i*15);house.rotation.y=side*.12;group.add(house);
  part(house,new THREE.BoxGeometry(5.5,3.4,5),0xd4c3b4,0,1.7,0);
  part(house,new THREE.ConeGeometry(4.2,2.4,4),0x9c889d,0,4.3,0).rotation.y=Math.PI/4;
  part(house,new THREE.BoxGeometry(1.5,2.6,.1),0x766573,0,1.3,2.56);
  for(const x of [-2,2]){const plank=part(house,new THREE.BoxGeometry(.18,4.2,.18),0x8c7569,x,2.1,2.7);plank.rotation.z=x*.09;}
  for(let j=0;j<3;j++){const rubble=part(house,new THREE.BoxGeometry(1.8,.4,.8),0xa39a9c,j-1,.15,3.8+j*.4);rubble.rotation.y=j*.7;}
 }
 for(const side of [-1,1]){part(group,new THREE.CylinderGeometry(.3,.36,4,8),0xae9380,side*5,2,-28);part(group,new THREE.ConeGeometry(.7,1.4,3),0xcdb7c5,side*5,5,-28);}
 const cross=part(group,new THREE.BoxGeometry(11,.4,.5),0xae9380,0,4,-28);cross.rotation.z=.08;
 part(group,new THREE.TorusGeometry(.8,.13,8,20),index===3?0xb5e8ef:0xbfa9c7,0,3.5,-27.7);
}
