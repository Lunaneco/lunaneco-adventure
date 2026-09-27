import {buildPrismLandmarks} from './prim-visuals.js';
import {buildMochiLandmarks} from './mochi-country.js';
import {buildDemonLandmarks} from './demon-country.js';
import * as THREE from 'three';
import { part, bakeGroup } from './characters.js';

import {FIELD_THEMES} from './field-themes.js';
import {buildCountryLandmarks} from './musubi-country.js';
export {FIELD_THEMES} from './field-themes.js';
const colorKeys=['fog','ground','grass','stone','tint','sky','bounce','sun','fill','portal','motes','accent'];
const palettes=FIELD_THEMES.map(theme=>Object.fromEntries(colorKeys.map(key=>[key,new THREE.Color(theme[key])])));
const clamp=THREE.MathUtils.clamp;

// A camera-aligned matte lies behind the actual 3D arena. Its small UV shift
// supplies distant parallax without the texture edges ever entering the frame.
export class FieldEnvironment {
  constructor(world){
    this.world=world;this.current=0;this.target=0;this.blend=1;this.loaded=[];this.failures=[];
    this.colors=Object.fromEntries(colorKeys.map(key=>[key,new THREE.Color()]));
    this.textures=FIELD_THEMES.map(theme=>{
      const c=new THREE.Color(theme.fog).convertLinearToSRGB();
      const t=new THREE.DataTexture(new Uint8Array([c.r*255,c.g*255,c.b*255,255]),1,1);
      t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
    });
    const uniforms={fromMap:{value:this.textures[0]},toMap:{value:this.textures[0]},blend:{value:1},
      aspect:{value:1},focusX:{value:.5},parallax:{value:new THREE.Vector2()}};
    this.material=new THREE.ShaderMaterial({uniforms,depthWrite:false,depthTest:false,toneMapped:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.999999,1.);}',
      fragmentShader:`uniform sampler2D fromMap;uniform sampler2D toMap;uniform float blend;uniform float aspect;uniform float focusX;uniform vec2 parallax;varying vec2 vUv;
        void main(){vec2 crop=aspect<1.5?vec2(aspect/1.5,1.):vec2(1.,1.5/aspect);
        crop*=.78;vec2 center=vec2(clamp(focusX,crop.x*.5+.018,1.-crop.x*.5-.018),.44);
        vec2 uv=(vUv-.5)*crop+center+parallax;
        gl_FragColor=vec4(mix(texture2D(fromMap,uv).rgb,texture2D(toMap,uv).rgb,blend),1.);
        #include <colorspace_fragment>
        }`});
    this.backdrop=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material);
    this.backdrop.name='Field matte background';this.backdrop.renderOrder=-10000;this.backdrop.frustumCulled=false;
    world.scene.add(this.backdrop);
    // Environment materials are cached globally by the primitive builder; clone
    // them before tinting so enemy colours and the heroes' weapons stay intact.
    const copies=new Map();this.tints=[];
    for(const group of [world.statics,world.portal])group.traverse(object=>{
      if(!object.isMesh||!object.material.color)return;
      const source=object.material;
      if(!copies.has(source)){const copy=source.clone();copies.set(source,copy);this.tints.push({material:copy,base:source.color.clone()});}
      object.material=copies.get(source);
    });
    this.landmarks=this.createLandmarks();this.update(0,new THREE.Vector3(),false);
    const loader=new THREE.TextureLoader();
    this.ready=Promise.all(FIELD_THEMES.map(async(theme,index)=>{
      try{
        const tex=await loader.loadAsync(theme.image);tex.colorSpace=THREE.SRGBColorSpace;
        tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;tex.generateMipmaps=false;
        this.textures[index].dispose();this.textures[index]=tex;this.loaded.push(index);
      }catch{this.failures.push(index);}
    })).then(()=>this.syncTextures());
  }
  createLandmarks(){
    return FIELD_THEMES.map((theme,index)=>{
      const group=new THREE.Group();group.name=`Field ${index+1} landmarks`;this.world.scene.add(group);
      if(theme.prism){buildPrismLandmarks(group);bakeGroup(group);return group;}
      if(theme.demon){buildDemonLandmarks(group,theme.demon);bakeGroup(group);return group;}
      if(theme.mochi){buildMochiLandmarks(group,theme.mochi);bakeGroup(group);return group;}
      if(theme.country){buildCountryLandmarks(group,theme.country);bakeGroup(group);return group;}
      // Small 3D silhouettes sit beyond the playable boundary. The richly
      // detailed architecture farther away is supplied by the matte painting.
      for(let i=0;i<5;i++){
        const a=-Math.PI*.85+i*Math.PI*.22,r=34+(i%2)*9;
        const x=Math.sin(a)*r,z=-Math.cos(a)*r,y=-4-i%2*2;
        const platform=new THREE.Group();platform.position.set(x,y,z);group.add(platform);
        part(platform,new THREE.ConeGeometry(2.4,5,7),index===2?0x958697:0x39466d,0,-2.55,0).rotation.z=Math.PI;
        part(platform,new THREE.CylinderGeometry(2.4,2.25,.24,24),index===2?0xe9d9c3:0x70869b,0,.05,0);
        if(index===0){
          part(platform,new THREE.CylinderGeometry(.13,.24,3,8),0x596b76,0,1.5,0);
          for(let j=0;j<3;j++)part(platform,new THREE.IcosahedronGeometry(1.15,1),[0x819cac,0xa9a7ce,0x779d9f][j],Math.sin(j*2.1)*.6,2.8+j*.18,Math.cos(j*2.1)*.5,[1,.8,1]);
        }else{
          for(const side of [-1,1]){
            part(platform,new THREE.CylinderGeometry(.2,.3,index===1?3.4:4.8,8),index===1?0xa6b1ca:0xe9dece,side*1.3,index===1?1.7:2.4,0);
            part(platform,new THREE.BoxGeometry(.7,.16,.7),0xddc39b,side*1.3,index===1?3.45:4.8,0);
          }
          if(index===1){
            part(platform,new THREE.TorusGeometry(1.3,.16,8,36,Math.PI*.75),0xadb8d2,0,3.4,0);
            part(platform,new THREE.OctahedronGeometry(.45),theme.accent,0,1.8,0,[.7,1.5,.7],.6);
          }else{
            part(platform,new THREE.TorusGeometry(1.35,.045,8,60),0xf1cd8c,0,5.1,0,null,.15);
            part(platform,new THREE.ConeGeometry(1.7,1.1,6),0xdac09f,0,3.5,0);
          }
        }
        // Thin luminous waterfalls add a nearer depth layer to the cloud sea.
        part(platform,new THREE.CylinderGeometry(.10,.21,7,8,1,true),index===2?0xf0ddcf:0xa6c8df,1.6,-3.4,.6,[1,1,.35],.3);
      }
      // Gate accents are outside the combat ring and cannot obscure attacks.
      for(const side of [-1,1]){
        if(index===0){
          part(group,new THREE.OctahedronGeometry(.46),theme.accent,side*4.8,.65,-20,[.7,1.5,.7],.35);
        }else if(index===1){
          part(group,new THREE.CylinderGeometry(.5,.55,2.2,7),0xa2afc6,side*5.1,1.1,-20);
          part(group,new THREE.OctahedronGeometry(.4),theme.accent,side*5.1,2.7,-20,[.6,1.6,.6],.55);
        }else{
          const halo=part(group,new THREE.TorusGeometry(.85,.035,8,40),theme.accent,side*5.1,2.7,-20,null,.45);halo.rotation.y=side*.22;
          part(group,new THREE.CylinderGeometry(.17,.35,2.4,8),0xdfccb4,side*5.1,1.2,-20);
        }
      }
      bakeGroup(group);return group;
    });
  }
  syncTextures(){
    this.material.uniforms.fromMap.value=this.textures[this.current];
    this.material.uniforms.toMap.value=this.textures[this.target];
  }
  setArea(area,{immediate=false}={}){
    area=clamp(Math.floor(Number.isFinite(area)?area:0),0,FIELD_THEMES.length-1);
    if(immediate){this.current=this.target=area;this.blend=1;}
    else if(area!==this.target){this.current=this.target;this.target=area;this.blend=0;}
    this.syncTextures();
  }
  update(dt,cameraTarget,motion){
    const w=this.world;
    this.blend=motion?Math.min(1,this.blend+dt/1.4):1;
    const t=this.blend*this.blend*(3-2*this.blend),a=FIELD_THEMES[this.current],b=FIELD_THEMES[this.target];
    this.material.uniforms.blend.value=t;
    this.material.uniforms.aspect.value=w.camera.aspect;
    this.material.uniforms.focusX.value=THREE.MathUtils.lerp(a.focus??.5,b.focus??.5,t);
    this.material.uniforms.parallax.value.set(motion?clamp(-cameraTarget.x*.0007,-.015,.015):0,motion?clamp(cameraTarget.z*.0004,-.01,.01):0);
    for(const key of colorKeys)this.colors[key].lerpColors(palettes[this.current][key],palettes[this.target][key],t);
    const c=this.colors;
    w.scene.fog.color.copy(c.fog);w.scene.fog.density=.0035;
    w.ground.material.color.copy(c.ground);w.grassMesh.material.color.copy(c.grass);
    w.floor.material.color.copy(c.stone);this.tints.forEach(({material,base})=>material.color.copy(base).multiply(c.tint));
    w.hemisphere.color.copy(c.sky);w.hemisphere.groundColor.copy(c.bounce);w.hemisphere.intensity=1.25;
    w.sun.color.copy(c.sun);w.sun.intensity=THREE.MathUtils.lerp(a.sunPower,b.sunPower,t);
    w.fill.color.copy(c.fill);w.fill.intensity=.7;
    w.renderer.toneMappingExposure=THREE.MathUtils.lerp(a.exposure,b.exposure,t);
    for(const mesh of [w.portalGlow,w.portalCore]){mesh.material.color.copy(c.portal);mesh.material.emissive.copy(c.portal);}
    w.motes.material.color.copy(c.motes);w.motes.material.opacity=this.target===2?.4:.65;
    const visible=t<.5?this.current:this.target;
    this.landmarks.forEach((group,index)=>{group.visible=index===visible;});
  }
  get state(){return {current:this.current,target:this.target,blend:this.blend,loaded:[...this.loaded],failures:[...this.failures],image:FIELD_THEMES[this.target].image};}
}
