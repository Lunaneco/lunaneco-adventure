import {heightAt,navigation,moveWithin} from './terrain.js';
import * as THREE from 'three';
import {STAGE_EXIT} from './model.js';

export class StageGate{
  constructor(world){
    this.world=world;this.group=new THREE.Group();this.group.name='Reachable stage exit';this.group.position.set(STAGE_EXIT.x,.16,STAGE_EXIT.z);world.scene.add(this.group);
    const gold=new THREE.MeshBasicMaterial({color:0xffe6a0,transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide});
    this.ring=new THREE.Mesh(new THREE.RingGeometry(STAGE_EXIT.radius-.08,STAGE_EXIT.radius,80),gold);this.ring.rotation.x=-Math.PI/2;this.group.add(this.ring);
    this.inner=new THREE.Mesh(new THREE.CircleGeometry(STAGE_EXIT.radius-.1,64),new THREE.MeshBasicMaterial({color:0xffdfa0,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide}));this.inner.rotation.x=-Math.PI/2;this.inner.position.y=-.02;this.group.add(this.inner);
    const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 vUv;void main(){gl_FragColor=vec4(1.,.82,.42,.13*pow(1.-vUv.y,2.));}'});
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.5,6,40,1,true),mat);beam.position.y=3;this.group.add(beam);
    this.star=new THREE.Mesh(new THREE.OctahedronGeometry(.3),new THREE.MeshBasicMaterial({color:0xfff2b6}));this.star.position.y=2.1;this.group.add(this.star);
    this.trail=new THREE.Group();world.scene.add(this.trail);
    for(let i=0;i<6;i++){const arrow=new THREE.Shape();arrow.moveTo(-.36,.35);arrow.lineTo(0,-.1);arrow.lineTo(.36,.35);arrow.lineTo(.36,0);arrow.lineTo(0,-.45);arrow.lineTo(-.36,0);arrow.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(arrow),gold);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=Math.PI;mesh.position.set(0,.18,-2-i*2.5);this.trail.add(mesh);}
    for(const mesh of [world.portalCore,world.portalGlow]){mesh.material.transparent=true;mesh.material.depthWrite=false;}
    this.update(null,0);
  }
  update(game,time){
    const active=!!game?.exitOpen,exit=game?.exitPoint??STAGE_EXIT,y=game?heightAt(game.layout,exit.x,exit.z):0;this.group.position.set(exit.x,y+.16,exit.z);
    this.world.portal.position.set(exit.x,y,exit.z-3.8);this.world.portal.visible=!!game&&!game.layout.stairs&&!(game.field.kind==='branch'&&game.wave%2===1);
    if(active){let p={x:game.player.x,z:game.player.z};for(const m of this.trail.children){const d=navigation(game.walkLayout,p,exit),length=Math.hypot(d.x,d.z)||1,next=moveWithin(game.walkLayout,p,p.x+d.x/length*2,p.z+d.z/length*2);m.position.set(next.x,y+.18,next.z);m.rotation.set(-Math.PI/2,0,Math.atan2(next.x-p.x,next.z-p.z));m.visible=Math.hypot(exit.x-p.x,exit.z-p.z)>2;p=next;}}this.group.visible=active;this.trail.visible=active;
    this.world.portalCore.visible=active;this.world.portalGlow.material.opacity=active?1:.12;
    this.world.portalGlow.material.emissiveIntensity=active?1.7:.08;
    const motion=this.world.settings.motion!==false;this.star.position.y=2.1+(motion?Math.sin(time*2.6)*.18:0);this.star.rotation.y=motion?time:0;
    this.ring.material.opacity=active?(motion?.72+Math.sin(time*3)*.16:.85):0;
  }
}
