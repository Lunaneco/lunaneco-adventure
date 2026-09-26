import * as THREE from 'three';

export function buildCountryEnemy(type,root,body,{part,ball,tube,bakeGroup}){
 let focus=null;const wings=[],rotors=[];
 const box=(g,c,x,y,z,w,h,d)=>part(g,new THREE.BoxGeometry(w,h,d),c,x,y,z);
 const rod=(g,c,x,y,z,r,h)=>part(g,new THREE.CylinderGeometry(r,r,h,8),c,x,y,z);
 if(type==='reaper'){
  // Straw skirt, bamboo limbs and a tall crescent sickle: a lean rural silhouette.
  part(body,new THREE.ConeGeometry(.6,1.25,9),0x9a7b48,0,.9,0);
  for(let i=0;i<9;i++)rod(body,0xd0b778,Math.sin(i*.7)*.48,.6,Math.cos(i*.7)*.4,.035,.8);
  ball(body,0x454b43,0,1.72,0,[.38,.42,.32]);
  part(body,new THREE.ConeGeometry(.71,.38,9),0xc2a772,0,2.12,0);
  for(const s of [-1,1]){tube(body,[[s*.3,1.42,0],[s*.65,1.3,.1],[s*.9,1.5,.15]],.09,0x8f7650);rod(body,0x64583d,s*.25,.22,0,.1,.43);ball(body,0xffa680,s*.13,1.77,.3,[.075,.035,.04]);}
  const handle=rod(body,0x625345,1.02,1.4,.18,.055,2.35);handle.rotation.z=-.12;
  const blade=part(body,new THREE.TorusGeometry(.6,.075,5,22,Math.PI*1.1),0xbac8b2,.66,2.35,.18,[1,.75,.5]);blade.rotation.z=.2;
  focus=part(body,new THREE.OctahedronGeometry(.12),0xff8c79,0,1.3,.42,[.8,1,.5],.8);
 }else if(type==='matchlock'){
  // Armoured ash imp carrying a barrel rather than the first chapter's bow.
  ball(body,0x3d4945,0,.9,0,[.54,.65,.42]);
  box(body,0x897552,0,.91,.38,.66,.6,.15);
  ball(body,0x253d3c,0,1.66,.03,[.43,.38,.34]);
  part(body,new THREE.SphereGeometry(.51,12,8,0,Math.PI*2,0,Math.PI/2),0x697a6c,0,1.68,0);
  part(body,new THREE.CylinderGeometry(.56,.56,.12,10),0x9a926d,0,1.72,0);
  for(const s of [-1,1]){ball(body,0xffbf80,s*.14,1.66,.35,[.085,.045,.05]);ball(body,0x2f3c38,s*.29,.17,.13,[.24,.17,.3]);ball(body,0x7d7660,s*.4,1.05,.45,[.22,.22,.24]);}
  box(body,0x87644b,.17,1.08,.54,.25,.24,1.2);
  const barrel=part(body,new THREE.CylinderGeometry(.15,.19,1.35,10),0x465252,.17,1.2,.97);barrel.rotation.x=Math.PI/2;
  const rim=part(body,new THREE.TorusGeometry(.155,.04,5,12),0xdcb77c,.17,1.2,1.66);
  focus=part(body,new THREE.SphereGeometry(.105,8,6),0xffbb72,.17,1.2,1.685,null,.85);
 }else if(type==='stormlantern'){
  // Floating hexagonal lantern with a copper roof and suspended prayer slips.
  part(body,new THREE.CylinderGeometry(.46,.43,.94,6),0xdfc692,0,1.55,0,null,.1);
  for(let i=0;i<6;i++)rod(body,0x827454,Math.sin(i*Math.PI/3)*.46,1.55,Math.cos(i*Math.PI/3)*.46,.035,1);
  for(const y of [1.04,2.06])part(body,new THREE.CylinderGeometry(.52,.52,.10,6),0x6c7971,0,y,0);
  part(body,new THREE.ConeGeometry(.68,.36,6),0x577168,0,2.29,0);
  for(const s of [-1,1]){box(body,0x704b75,s*.16,1.61,.45,.11,.09,.025);box(body,0xb397c4,s*.34,.7,0,.19,.52,.03);}
  part(body,new THREE.TorusGeometry(.63,.035,4,24),0xb7a6ec,0,1.55,0,null,.4).rotation.x=Math.PI/2;
  focus=part(body,new THREE.OctahedronGeometry(.23),0xd6b5ff,0,.77,0,[.7,1.3,.7],1);
 }else if(type==='pestmoth'){
  // Four leaf-shaped wings, feathery antennae and a glowing pollen abdomen.
  ball(body,0x45634c,0,1.3,0,[.25,.3,.6]);ball(body,0xb8c775,0,1.43,.46,[.31,.23,.26]);
  for(const s of [-1,1]){
   ball(body,0xffe6a4,s*.19,1.5,.63,[.1,.095,.06]);tube(body,[[s*.12,1.59,.54],[s*.3,1.96,.72],[s*.48,2,.63]],.025,0xd8d796);
   const wing=new THREE.Group();wing.position.set(s*.18,1.38,0);root.add(wing);wings.push(wing);
   for(const [z,scale] of [[-.32,1],[.4,.73]]){
    const leaf=part(wing,new THREE.SphereGeometry(.78,10,6),0x8cba72,s*.55,0,z,[1,.10,scale]);leaf.rotation.y=s*.3;
    ball(wing,0xd3d589,s*.75,.08,z,[.2,.025,.25]);ball(wing,0x526843,s*.77,.11,z,[.09,.02,.13]);
   }bakeGroup(wing);
  }
  focus=part(body,new THREE.IcosahedronGeometry(.17),0xd4f092,0,1.33,-.5,[.8,.8,1.4],.75);
 }else if(type==='ironcrab'){
  ball(body,0x456d70,0,.68,0,[.95,.56,.8]);
  part(body,new THREE.CylinderGeometry(.58,.94,.55,6),0x7c8c7d,0,1.0,-.13);
  box(body,0xc2ac70,0,1.31,-.13,.72,.08,.59);
  for(const s of [-1,1]){
   for(let i=0;i<3;i++)tube(body,[[s*.7,.6,-.5+i*.45],[s*1.16,.46,-.65+i*.57],[s*1.33,.06,-.85+i*.65]],.09,0x687f75);
   rod(body,0x779a8b,s*.3,1.21,.57,.06,.44);ball(body,0xffda8b,s*.3,1.48,.57,[.14,.12,.12]);
   tube(body,[[s*.65,.75,.4],[s*1.03,.92,.8],[s*.92,.94,1.1]],.14,0x718875);
   for(const fork of [-1,1]){const claw=part(body,new THREE.ConeGeometry(.22,.68,6),0x9cd6ce,s*.9+fork*.19,1,1.35);claw.rotation.x=Math.PI/2;claw.rotation.z= fork*.24;}
  }
  focus=part(body,new THREE.OctahedronGeometry(.15),0x8cf0e8,0,1.38,-.13,null,.7);
 }else if(type==='ramcart'){
  box(body,0x775c41,0,.79,0,1.48,.4,1.75);
  for(const s of [-1,1]){
   box(body,0x61766a,s*.61,1.15,-.1,.17,.65,1.65);
   for(const z of [-.57,.6]){
    const wheel=new THREE.Group();wheel.position.set(s*.87,.44,z);root.add(wheel);rotors.push(wheel);
    const rim=part(wheel,new THREE.CylinderGeometry(.42,.42,.18,10),0x536864);rim.rotation.z=Math.PI/2;
    for(let i=0;i<4;i++){const spoke=box(wheel,0xbda06c,0,0,0,.20,.09,.73);spoke.rotation.x=i*Math.PI/4;}bakeGroup(wheel);
   }
   part(body,new THREE.ConeGeometry(.12,.4,5),0xdac39e,s*.63,1.48,.67);
  }
  const log=part(body,new THREE.CylinderGeometry(.33,.38,2.15,9),0xa17c53,0,1.15,.25);log.rotation.x=Math.PI/2;
  part(body,new THREE.ConeGeometry(.45,.42,6),0x93a195,0,1.15,1.49).rotation.x=Math.PI/2;
  part(body,new THREE.ConeGeometry(.74,.39,4),0x3a5950,0,1.84,-.35).rotation.y=Math.PI/4;
  focus=part(body,new THREE.OctahedronGeometry(.19),0xffa375,0,1.57,.72,[1,.7,.6],.9);
 }
 return {focus,wings,rotors};
}
