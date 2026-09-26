import * as THREE from 'three';
import { ATTACK_DURATION, HEROES, MELEE_MIN_DOT } from './model.js';

export function createSwordSlash({ x, z, angle, range = HEROES[1].range, support = false, color, name }) {
  const arc = 2 * Math.acos(MELEE_MIN_DOT);
  // RingGeometry starts in XY. Centre it on +Z before applying the attack's
  // world-space heading (atan2(dx, dz)), so all headings face the actual target.
  const geometry = new THREE.RingGeometry(range * .78, range, 64, 1,
    -Math.PI / 2 - arc / 2, arc);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    color: color??(support ? 0xadd4e5 : 0x98eaff),
    transparent: true, opacity: .85, side: THREE.DoubleSide,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  // Grass reaches 0.56 units. Keep the horizontal slash at sword/waist height,
  // with depth testing intact so solid characters and scenery still occlude it.
  mesh.position.set(x, 1.05, z);
  mesh.rotation.y = angle;
  mesh.name = name??'tsukineko-sword-slash';
  const effect = { kind: 'sword-slash', mesh, life: ATTACK_DURATION, max: ATTACK_DURATION };
  updateSwordSlash(effect, 0);
  return effect;
}

export function updateSwordSlash(effect, dt) {
  effect.life = Math.max(0, effect.life - dt);
  const progress = 1 - effect.life / effect.max;
  // Show the entire arc through the strike, then fade the follow-through.
  effect.mesh.material.opacity = .85 * (1 - THREE.MathUtils.smoothstep(progress, .52, 1));
  const scale = .9 + .1 * THREE.MathUtils.smoothstep(progress, 0, .45);
  effect.mesh.scale.set(scale, 1, scale);
}
