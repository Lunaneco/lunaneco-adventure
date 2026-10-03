import {createLumiFingerLight,createLumiEars,updateLumiEars} from './lumi-visuals.js';
import {NEKO_LUMI_ATTACK,nekoLumiAttackPose} from './lumi-attack-motion.js';
import {createHeherealBow} from './hehereal-visuals.js';
import {createPrimClaw} from './prim-visuals.js';
import {PRIM_MOUNT} from './prim-combat.js';
import {createShizukuScythe} from './shizuku-weapon.js';
import {publicUrl} from './public-url.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { part, bakeGroup } from './characters.js';
import { ATTACK_DURATION } from './model.js';
import {createWeaponVariant} from './weapon-models.js';
import {mochiSlimePose} from './mochi-motion.js';
import {HERO_MODEL_NAMES, heroModelPath} from './hero-model-paths.js';
import {createNyanlunaNaturalMotion} from './nyanluna-natural-motion.js';

const files = HERO_MODEL_NAMES;
const axisX = new THREE.Vector3(1, 0, 0);
const axisY = new THREE.Vector3(0, 1, 0);
const axisZ = new THREE.Vector3(0, 0, 1);
const rotation = new THREE.Quaternion();
const delta = new THREE.Quaternion();
const handPosition = new THREE.Vector3();
const handRotation = new THREE.Quaternion();
const rigRotation = new THREE.Quaternion();
const gripOffset = new THREE.Vector3();

export async function loadHeroes() {
  const loader = new GLTFLoader();
  const assets = await Promise.all(files.map(name => loader.loadAsync(publicUrl(heroModelPath(name)))));
  return assets.map((asset, hero) => createHero(asset, hero));
}

export async function loadNyanlunaAwakeningHero(){
  const loader=new GLTFLoader(),[body,staff]=await Promise.all(['nyanluna-awakening','nyanluna-awakening-staff'].map(name=>loader.loadAsync(publicUrl(heroModelPath(name)))));
  const prop=staff.scene.getObjectByName('Nyanluna_Moon_Staff');if(!prop)throw new Error('Awakening staff mesh missing');prop.position.y-=.25;
  staff.scene.name='Awakened moon staff · supplied';staff.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=false;o.material.roughness=.83;o.material.metalness=0;}});
  return createHero(body,0,{awakened:true,weapon:staff.scene});
}

function starGeometry(radius) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5 + Math.PI / 2;
    const r = i % 2 ? radius * .43 : radius;
    if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: .045, bevelEnabled: true,
    bevelSegments: 1, steps: 1, bevelSize: .015, bevelThickness: .01 });
}

function createWeapon(hero) {
  if(hero===7)return createLumiFingerLight();
  if(hero===6)return createHeherealBow();
  if(hero===5)return createPrimClaw();
  if(hero===4)return createShizukuScythe();
  const weapon = new THREE.Group();
  const gold = 0xd2ad6b;
  if (hero === 0) {
    part(weapon, new THREE.CylinderGeometry(.028, .034, 1.64, 10), gold, 0, .40, 0);
    part(weapon, new THREE.TorusGeometry(.25, .052, 8, 28, Math.PI * 1.62),
      0xf5da96, 0, 1.25, 0, null, .20, .5).rotation.z = .5;
    part(weapon, starGeometry(.14), 0xd8bdff, 0, 1.23, .04, null, 1.5);
    part(weapon, new THREE.SphereGeometry(1, 12, 8), 0xddc4ff, 0, -.41, 0, [.07, .095, .07]);
  } else if(hero===2){
    part(weapon,new THREE.CylinderGeometry(.09,.10,.48,12),0x9ca9b0,0,0,0,null,0,.7);
    for(const y of [-.18,-.08,.02])part(weapon,new THREE.TorusGeometry(.097,.023,6,14),0x263339,0,y,0).rotation.x=Math.PI/2;
    part(weapon,new THREE.CylinderGeometry(.125,.1,.11,12),0xdcebe1,0,.28,0,null,0,.8);
    part(weapon,new THREE.SphereGeometry(.037,8,6),0x8dffad,0,.08,.095,null,1.8);
    const blade=part(weapon,new THREE.CapsuleGeometry(.055,2.0,5,10),0xb3ffc4,0,1.36,0,null,1.8);blade.userData.dynamic=true;
    const glow=new THREE.Mesh(new THREE.CapsuleGeometry(.12,2.04,5,10),new THREE.MeshBasicMaterial({color:0x20ff55,transparent:true,opacity:.56,depthWrite:false,blending:THREE.AdditiveBlending}));glow.position.y=1.36;glow.userData.dynamic=true;weapon.add(glow);
    weapon.userData.blade=blade;weapon.userData.glow=glow;
  } else {
    // The rifle points along local +Z; its grip follows the right-hand bone.
    part(weapon,new THREE.BoxGeometry(.23,.24,.65),0x23354b,0,.13,.30);
    part(weapon,new THREE.BoxGeometry(.18,.19,.31),0xe2ecf1,0,.16,-.15);
    part(weapon,new THREE.BoxGeometry(.13,.29,.15),0x1b293b,0,-.06,.05).rotation.x=-.20;
    part(weapon,new THREE.CylinderGeometry(.065,.075,.59,12),gold,0,.15,.90).rotation.x=Math.PI/2;
    part(weapon,new THREE.BoxGeometry(.27,.065,.45),0x9ceeff,0,.27,.35,null,1.0);
    part(weapon,new THREE.BoxGeometry(.07,.035,.54),0x83dfff,.145,.14,.34,null,1.4);
    part(weapon,new THREE.BoxGeometry(.07,.035,.54),0x83dfff,-.145,.14,.34,null,1.4);
    part(weapon,new THREE.CylinderGeometry(.075,.075,.28,10),0x31445c,0,.36,.18).rotation.x=Math.PI/2;
    part(weapon,new THREE.SphereGeometry(.065,8,6),0x8fe5ff,0,.36,.34,null,1.6);
    part(weapon,starGeometry(.09),gold,.13,.11,.27);
  }
  bakeGroup(weapon);
  weapon.name = ['Moon staff · Lunaria','Star rifle · Nox','Light saber · Suishu'][hero];
  if(hero===1){const flash=new THREE.Mesh(new THREE.OctahedronGeometry(.16),new THREE.MeshBasicMaterial({color:0xc7f8ff,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));flash.position.set(0,.15,1.23);flash.scale.set(.65,.65,1.65);flash.visible=false;weapon.add(flash);weapon.userData.muzzle=flash;}

  weapon.userData.family=['luna-staff','nox-rifle','light-saber'][hero];
  return weapon;
}

export function setHeroWeapon(root,item){
  const d=root.userData;if(!item||d.awakened)return;const key=[4,5,6,7].includes(d.hero)?item.id:item.weapon.id,current=[4,5,6,7].includes(d.hero)?d.weapon.userData.variantId:d.weapon.userData.family;if(current===key)return;
  d.weaponCache??=new Map([[current,d.weapon]]);
  let next=d.weaponCache.get(key);
  if(!next){next=![3,4,5,6,7].includes(d.hero)&&item.weapon.style==='均衡型'?createWeapon(d.hero):createWeaponVariant(item);d.weaponCache.set(key,next);}
  if(d.hero===3){next.position.set(d.renewal?.65:.75,.95,d.renewal?.9:.2);next.scale.setScalar(.75);}
  d.rig.remove(d.weapon);d.rig.add(next);d.weapon=next;
}

function createHero(asset, hero, options={}) {
  const root = new THREE.Group();
  root.name = options.awakened?'nyanluna-awakening':files[hero];
  const rig = new THREE.Group();
  root.add(rig);
  const model = asset.scene;
  model.name = `${root.name}_supplied_model`;
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model, true);
  const height = bounds.max.y - bounds.min.y;
  if (!Number.isFinite(height) || height < .1) throw new Error(`Invalid character bounds: ${files[hero]}`);
  const scale = (hero===5?3.8:hero===3?1.55:hero===2?2.8:3.1) / height;
  model.scale.multiplyScalar(scale);
  model.position.set(-(bounds.min.x + bounds.max.x) * .5 * scale, -bounds.min.y * scale,
    -(bounds.min.z + bounds.max.z) * .5 * scale);
  const slimeBody=hero===3?new THREE.Group():null;
  if(slimeBody){slimeBody.name='mochinyafe_slime_deformation';slimeBody.add(model);rig.add(slimeBody);}else rig.add(model);
  const bones = new Map();
  let renewal = false;
  const metrics = { triangles: 0, meshes: 0, skinnedMeshes: 0, vertices: 0 };
  root.updateMatrixWorld(true);
  model.traverse(object => {
    if(object.userData.game_rig_version==='renewal-20261001')renewal=true;
    if (object.isBone) {
      const parentRest = object.parent.getWorldQuaternion(new THREE.Quaternion());
      bones.set(object.userData.name ?? object.name, { bone: object, rest: object.quaternion.clone(),
        parentRest, inverseParentRest: parentRest.clone().invert() });
    }
    if (object.isMesh) {
      object.castShadow = true;
      // The source has overlapping fine hair strands. Avoid shadow-map acne on
      // those strands while preserving their cast shadows on the ground.
      object.receiveShadow = false;
      // Skin bounds change with poses; a pair of always-present heroes need no frustum culling.
      object.frustumCulled = false;
      if(hero!==3)object.material.roughness = .83;
      object.material.metalness = 0;
      // A soft albedo fill keeps the supplied facial colours legible beneath the
      // large fringe at the elevated gameplay camera, without flattening all lighting.
      object.material.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>',
          'outgoingLight = mix(outgoingLight, diffuseColor.rgb, 0.28);\n#include <opaque_fragment>');
      };
      object.material.customProgramCacheKey = () => 'lunaria-character-fill-v1';
      metrics.meshes++;
      metrics.skinnedMeshes += Number(!!object.isSkinnedMesh);
      metrics.vertices += object.geometry.attributes.position.count;
      metrics.triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
    }
  });
  for (const required of (hero===3?[]:['head', 'upper_arm.L', 'upper_arm.R', 'thigh.L', 'thigh.R', 'hand.R'])) {
    if (!bones.has(required)) throw new Error(`Character bone missing: ${files[hero]} / ${required}`);
  }
  const weapon = options.weapon??(hero===3?new THREE.Group():createWeapon(hero));if(options.weapon)weapon.scale.setScalar(scale);
  rig.add(weapon);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.6, .66, 48),
    new THREE.MeshBasicMaterial({ color: hero===7?0xb8c9ff:hero===6?0xff9dc9:hero===4?0xe5a0ba:hero===3?0xffb8d4:hero === 0 ? 0xd5adff : hero===1?0x8ce9ff:0x8affaf,
      transparent: true, opacity: .65, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  root.add(ring);
  root.userData = { rig, model, slimeBody, bones, weapon, ring, hero, renewal, attackTime: 0,
    metrics, awakened:!!options.awakened, normalizationScale:scale, source: publicUrl(heroModelPath(root.name)), movement: 0 };
  if(options.awakened)root.userData.naturalMotion=createNyanlunaNaturalMotion(model,asset.animations,bones);
  if(hero===7){root.userData.ears=createLumiEars();rig.add(root.userData.ears);}
  animateHero(root, { x: 0, z: 0, face: 0, moving: false, invincible: 0 }, 0, 0, hero === 0);
  return root;
}

// Rotations are expressed in character space, then converted into each source bone's
// own rest basis. The two source rigs have different arm orientations and bone rolls.
function pose(data, name, x = 0, y = 0, z = 0) {
  const entry = data.bones.get(name);
  if (!entry) return;
  delta.setFromAxisAngle(axisX, x);
  delta.multiply(rotation.setFromAxisAngle(axisY, y));
  delta.multiply(rotation.setFromAxisAngle(axisZ, z));
  entry.bone.quaternion.copy(entry.inverseParentRest).multiply(delta)
    .multiply(entry.parentRest).multiply(entry.rest);
}

export function animateHero(root, state, time, dt, active) {
  const d = root.userData;
  if(d.naturalMotion){
    root.position.set(state.x,0,state.z);
    const turn=Math.atan2(Math.sin(state.face-root.rotation.y),Math.cos(state.face-root.rotation.y));
    root.rotation.y+=turn*(1-Math.exp(-14*Math.max(0,dt)));
    const ground=Math.hypot(state.x,state.z)<6.3?.105:.025;
    d.rig.rotation.set(0,0,0);d.rig.position.set(0,ground,0);d.weapon.visible=true;
    d.attackTime=Math.max(0,d.attackTime-dt);
    d.movement=d.naturalMotion.update(state,dt,d.attackTime,ATTACK_DURATION).movement;
    root.updateMatrixWorld(true);
    const hand=d.bones.get('hand.R').bone;
    hand.getWorldPosition(handPosition);d.rig.worldToLocal(handPosition);
    hand.getWorldQuaternion(handRotation);d.rig.getWorldQuaternion(rigRotation).invert();handRotation.premultiply(rigRotation).normalize();
    if(!d.awakenedGrip){const inverse=handRotation.clone().invert();d.awakenedGrip={rotation:inverse.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.08,0,.13))),offset:new THREE.Vector3(0,-.03,.075).applyQuaternion(inverse)};}
    gripOffset.copy(d.awakenedGrip.offset).applyQuaternion(handRotation);
    d.weapon.position.copy(handPosition).add(gripOffset);d.weapon.quaternion.copy(handRotation).multiply(d.awakenedGrip.rotation);
    d.ring.position.y=ground+.016;d.ring.material.opacity=active?.6:.22;d.ring.scale.setScalar(active?1:.8);
    d.rig.visible=!(active&&state.invincible>.05&&state.invincible<.8&&Math.floor(time*22)%3===0);
    return;
  }
  if(d.hero===5){
    root.position.set(state.x,0,state.z);root.scale.setScalar(state.mounted?PRIM_MOUNT.scale:1);
    root.rotation.y+=Math.atan2(Math.sin(state.face-root.rotation.y),Math.cos(state.face-root.rotation.y))*Math.min(1,dt*14);
    d.movement=THREE.MathUtils.damp(d.movement,state.moving?1:0,13,dt);d.attackTime=Math.max(0,d.attackTime-dt);
    const stride=Math.sin(time*10)*d.movement,attack=d.attackTime>0?Math.sin(d.attackTime/ATTACK_DURATION*Math.PI):0;
    d.rig.position.y=(state.mounted?.45:.02)+Math.abs(stride)*.035;d.rig.rotation.x=state.mounted?.85:0;
    pose(d,'upper_arm.L',-.12,0,-.55);pose(d,'upper_arm.R',-.12-attack*.6,attack*.2,.55-attack*.2);
    pose(d,'forearm.L',-.28);pose(d,'forearm.R',-.28-attack*.3);
    pose(d,'thigh.L',stride*.2);pose(d,'thigh.R',-stride*.2);pose(d,'shin.L',Math.max(0,-stride)*.1);pose(d,'shin.R',Math.max(0,stride)*.1);
    pose(d,'head',Math.sin(time*2)*.018);pose(d,'chest',0,attack*-.13,0);
    for(const side of ['L','R'])pose(d,`wing_base.${side}`,0,0,Math.sin(time*2.5)*(side==='L'?-1:1)*.08);
    for(let i=1;i<=8;i++)pose(d,`tail.${String(i).padStart(2,'0')}`,0,Math.sin(time*2-i*.5)*.045,0);
    root.updateMatrixWorld(true);d.bones.get('hand.R').bone.getWorldPosition(handPosition);d.rig.worldToLocal(handPosition);d.weapon.position.copy(handPosition);d.weapon.rotation.set(.15-attack*.5,0,.1);
    d.rig.visible=true;d.ring.position.y=.03;d.ring.material.opacity=active?.6:.22;return;
  }
  if(d.hero===3){
    root.position.set(state.x,0,state.z);
    root.rotation.y+=Math.atan2(Math.sin(state.face-root.rotation.y),Math.cos(state.face-root.rotation.y))*Math.min(1,dt*14);
    d.movement=THREE.MathUtils.damp(d.movement,state.moving?1:0,13,dt);
    d.attackTime=Math.max(0,d.attackTime-dt);
    const cry=d.attackTime>0?Math.sin(d.attackTime/ATTACK_DURATION*Math.PI):0;
    const bodyPose=mochiSlimePose(time,{movement:d.movement,cry,dash:state.dash>0?1:0});
    d.rig.position.set(0,.015,0);d.rig.rotation.set(0,0,0);d.rig.scale.setScalar(1);
    d.slimeBody.position.y=bodyPose.hop;d.slimeBody.scale.set(bodyPose.x,bodyPose.y,bodyPose.z);d.slimeBody.rotation.y=bodyPose.sway;
    if(d.renewal){
      const step=Math.sin(time*11.5)*d.movement;
      for(const side of ['L','R']){
        const sign=side==='L'?1:-1;
        pose(d,`paw.front.${side}`,step*sign*.16-cry*.14);
        pose(d,`paw.back.${side}`,-step*sign*.16);
        pose(d,`ear.${side}`,0,0,sign*(Math.sin(time*3)*.025+cry*.06));
      }
    }
    d.weapon.position.y=.95+bodyPose.hop*.8;d.weapon.rotation.z=Math.sin(time*3)*.16+cry*.15;
    d.rig.visible=!(active&&state.invincible>.05&&state.invincible<.8&&Math.floor(time*22)%3===0);
    d.ring.position.y=.025;d.ring.material.opacity=active?.6:.22;d.ring.scale.setScalar(active?1:.8);return;
  }
  d.rig.rotation.set(0,0,0);d.rig.position.x=0;d.weapon.visible=true;
  root.position.set(state.x, 0, state.z);
  const aiming=d.hero===7&&state.neko&&d.nekoAttack&&d.attackTime>0?d.lumiAttackAngle??state.face:state.face;
  const turn = Math.atan2(Math.sin(aiming - root.rotation.y), Math.cos(aiming - root.rotation.y));
  root.rotation.y += turn * Math.min(1, dt * 14);
  d.movement = THREE.MathUtils.damp(d.movement, state.moving ? 1 : 0, 13, dt);
  const stride = Math.sin(time * 13) * d.movement;
  const ground = Math.hypot(state.x, state.z) < 6.3 ? .105 : .025;
  d.rig.position.y = ground + Math.abs(Math.sin(time * 13)) * .045 * d.movement;
  d.attackTime = Math.max(0, d.attackTime - dt);
  const attackDuration=d.hero===7&&d.nekoAttack?NEKO_LUMI_ATTACK.duration:ATTACK_DURATION;
  const attack = d.attackTime > 0 ? Math.sin(d.attackTime / attackDuration * Math.PI) : 0;
  const nekoShot=d.hero===7&&state.neko&&d.nekoAttack&&d.attackTime>0?nekoLumiAttackPose(d.attackTime):null;
  pose(d, 'thigh.L', stride * .30);
  pose(d, 'thigh.R', -stride * .30);
  pose(d, 'shin.L', Math.max(0, -stride) * .16);
  pose(d, 'shin.R', Math.max(0, stride) * .16);
  pose(d, 'chest', Math.sin(time * 2.2) * .013, attack * -.06, stride * .014);
  pose(d, 'head', 0, Math.sin(time * 1.8) * .025, Math.sin(time * 2) * .015);
  // Renewal humans are both authored in A pose; older Tsukineko is T pose.
  const lowerArm = d.awakened ? 1.02 : d.renewal ? .06 : d.hero > 0 ? 1.02 : .06;
  pose(d, 'upper_arm.L', -stride * .18, 0, -lowerArm);
  pose(d, 'upper_arm.R', d.hero===1?-.95+attack*.14:stride*.14-attack*.70, d.hero===1?-.12:attack*-.22, d.hero===1?(d.renewal?-.18:.78):lowerArm-attack*.13);
  pose(d, 'forearm.L', -.12);
  pose(d, 'forearm.R', d.hero===1?-.48-attack*.09:-.20-attack*.20);
  if(d.awakened){pose(d,'upper_arm.R',-.12-attack*.22,attack*.18,1.03-attack*.04);pose(d,'forearm.R',-.30-attack*.12);pose(d,'upper_arm.L',-.12-attack*.28,-attack*.15,-1.02+attack*.12);}
  if(d.hero===7){
    pose(d,'upper_arm.R',-.05,1.55,.08);pose(d,'forearm.R',.02,.10+attack*.03,0);
    if(nekoShot){
      const {stance,recoil}=nekoShot;
      pose(d,'chest',-.045*stance,-.16*stance+.075*recoil,-.025*stance);
      pose(d,'head',.025*stance,.08*stance,.025*stance);
      pose(d,'upper_arm.R',-.05-.22*recoil,1.55+.12*recoil,.08+.10*recoil);
      pose(d,'forearm.R',.02+.12*recoil,.10-.10*recoil,0);
      pose(d,'upper_arm.L',-stride*.18-.25*stance,-.65*stance,-lowerArm+.48*stance);
      pose(d,'forearm.L',-.12-.60*stance);
      if(d.movement<.15){pose(d,'thigh.L',-.06*stance);pose(d,'thigh.R',.10*stance);pose(d,'shin.R',.06*stance);}
    }
  }
  if(d.hero===6){
    // Both arms start along character X. Turn them forward about Y, keeping
    // the bow ahead of the chest and the drawing hand behind its string.
    pose(d,'upper_arm.L',-.08,-1.7,-.08);pose(d,'forearm.L',.02,-.12,0);
    pose(d,'upper_arm.R',-.08,1.72,.08);pose(d,'forearm.R',.02,1.12+attack*.28,0);
  }
  if(d.hero===2){
    pose(d,'upper_arm.R',-.28-attack*.55,attack*.45,1.05-attack*.35);
    pose(d,'forearm.R',-.5-attack*.15);pose(d,'upper_arm.L',stride*.12,0,-1.06);
    for(const side of ['L','R']){const leg=side==='L'?stride:-stride;pose(d,`robe.front.${side}`,Math.max(0,leg)*.22);pose(d,`robe.back.${side}`,Math.min(0,leg)*.15);}
    pose(d,'tail.01',0,Math.sin(time*2)*.07);
  }
  if(d.hero===4){pose(d,'upper_arm.R',-.35-attack*.65,attack*.5,1.05-attack*.42);pose(d,'forearm.R',-.32);pose(d,'chest',0,attack*-.28,0);for(const side of ['L','R']){pose(d,`skirt.front.${side}`,Math.max(0,side==='L'?stride:-stride)*.16);pose(d,`wing.${side}`,0,Math.sin(time*2)*.03,0);}}
  if(state.riding){pose(d,'thigh.L',-1.2,0,-.42);pose(d,'thigh.R',-1.2,0,.42);pose(d,'shin.L',1.4);pose(d,'shin.R',1.4);d.rig.position.y=0;}
  for (const side of ['L', 'R', 'back']) {
    pose(d, `hair_mid.${side}`, Math.sin(time * 2.8 + (side === 'R' ? 1 : 0)) * .014 + stride * .018);
    pose(d, `hair_tip.${side}`, Math.sin(time * 3.2) * .02);
  }
  if(d.renewal){
    pose(d,'hair.back_mid',Math.sin(time*2.8)*.014+stride*.018);
    pose(d,'hair.back_tip',Math.sin(time*3.2)*.02);
    for(const side of ['L','R']){
      const leg=side==='L'?stride:-stride;
      pose(d,`skirt.front.${side}`,Math.max(0,leg)*.14);
      pose(d,`skirt.back.${side}`,Math.min(0,leg)*.10);
    }
  }
  if(d.hero===4)for(const finger of ['index','middle','ring','little','thumb'])for(const joint of ['01','02']){const b=d.bones.get(`${finger}.${joint}.R`);if(b)b.bone.quaternion.copy(b.rest).multiply(new THREE.Quaternion().setFromAxisAngle(axisX,finger==='thumb'?.4:joint==='01'?.65:1.0));}
  root.updateMatrixWorld(true);
  d.bones.get(d.hero===6?'hand.L':'hand.R').bone.getWorldPosition(handPosition);
  d.rig.worldToLocal(handPosition);
  d.weapon.position.copy(handPosition).addScaledVector(axisZ, .06);
  if(d.renewal){
    // Advance from the wrist to the palm in the hand bone's rest basis.
    d.bones.get('hand.R').bone.getWorldQuaternion(handRotation);
    d.rig.getWorldQuaternion(rigRotation).invert();handRotation.premultiply(rigRotation);
    gripOffset.set(0,.07,0).applyQuaternion(handRotation);
    d.weapon.position.copy(handPosition).add(gripOffset);
  }
  if(d.hero===7){
    d.bones.get('hand.R').bone.getWorldQuaternion(handRotation);d.rig.getWorldQuaternion(rigRotation).invert();handRotation.premultiply(rigRotation);
    d.weapon.position.copy(handPosition).add(new THREE.Vector3(0,.16,0).applyQuaternion(handRotation));d.weapon.rotation.set(0,0,0);
    const glow=nekoShot?nekoShot.flash:attack;
    d.weapon.userData.light.material.opacity=.4+glow*.6;d.weapon.userData.light.scale.setScalar(1+glow*(nekoShot?1.5:0));updateLumiEars(root,!!state.neko);
  }
  else if(d.awakened){
    d.bones.get('hand.R').bone.getWorldQuaternion(handRotation);d.rig.getWorldQuaternion(rigRotation).invert();handRotation.premultiply(rigRotation);
    if(!d.awakenedGrip){const inverse=handRotation.clone().invert();d.awakenedGrip={rotation:inverse.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.08,0,.13))),offset:new THREE.Vector3(0,-.03,.075).applyQuaternion(inverse)};}
    d.weapon.position.copy(handPosition).add(d.awakenedGrip.offset.clone().applyQuaternion(handRotation));d.weapon.quaternion.copy(handRotation).multiply(d.awakenedGrip.rotation);
  }
  else if(d.hero===1){d.weapon.rotation.set(-attack*.075,0,0);d.weapon.position.z-=attack*.10;d.weapon.userData.muzzle.visible=d.attackTime>ATTACK_DURATION-.09;}
  else if(d.hero===2){
    // Calibrate once in the idle grip, then keep the hilt rigidly attached to
    // the hand. Its blade points forward and away from the face, not backwards.
    d.bones.get('hand.R').bone.getWorldQuaternion(handRotation);
    d.rig.getWorldQuaternion(rigRotation).invert();handRotation.premultiply(rigRotation);
    if(!d.saberGrip){const inverse=handRotation.clone().invert();d.saberGrip={rotation:inverse.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.22,0,.44))),offset:new THREE.Vector3(0,-.015,.09).applyQuaternion(inverse)};}
    d.weapon.position.copy(handPosition).add(d.saberGrip.offset.clone().applyQuaternion(handRotation));
    d.weapon.quaternion.copy(handRotation).multiply(d.saberGrip.rotation);
    d.weapon.userData.glow.material.opacity=.55+Math.sin(time*12)*.05;
  }
  else if(d.hero===6){
    d.bones.get('hand.L').bone.getWorldQuaternion(handRotation);d.rig.getWorldQuaternion(rigRotation).invert();handRotation.premultiply(rigRotation);
    if(!d.bowGrip){const inverse=handRotation.clone().invert();d.bowGrip={rotation:inverse.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axisY,-Math.PI/2)),offset:new THREE.Vector3(0,0,.075).applyQuaternion(inverse)};}
    d.weapon.position.copy(handPosition).add(d.bowGrip.offset.clone().applyQuaternion(handRotation));d.weapon.quaternion.copy(handRotation).multiply(d.bowGrip.rotation);
  }
  else if(d.hero===4){
    d.bones.get('hand.R').bone.getWorldQuaternion(handRotation);d.rig.getWorldQuaternion(rigRotation).invert();handRotation.premultiply(rigRotation);
    if(!d.scytheGrip){const inverse=handRotation.clone().invert();d.scytheGrip={rotation:inverse.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.15,0,-.25))),offset:new THREE.Vector3(0,-.065,.075).applyQuaternion(inverse)};}
    d.weapon.position.copy(handPosition).add(d.scytheGrip.offset.clone().applyQuaternion(handRotation));d.weapon.quaternion.copy(handRotation).multiply(d.scytheGrip.rotation);
  }
  else d.weapon.rotation.set(-attack*1.25+.08,-attack*.25,.13);
  d.ring.position.y = ground + .016;
  d.ring.material.opacity = active ? .6 : .22;
  d.ring.scale.setScalar(active ? 1 : .8);
  d.rig.visible = !(active && state.invincible > .05 && state.invincible < .8 && Math.floor(time * 22) % 3 === 0);
}

export function animateWoundedHero(root,state,time,dt){
 animateHero(root,{...state,face:.7,moving:false,invincible:0},time,dt,false);
 const d=root.userData;d.rig.rotation.z=-1.45;d.rig.position.set(-1.2,1.05,0);d.weapon.visible=false;d.ring.material.opacity=.1;
}
