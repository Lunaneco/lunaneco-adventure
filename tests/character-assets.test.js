import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const widths = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const components = { 5121: [1, 'readUInt8', 255], 5123: [2, 'readUInt16LE', 65535],
  5125: [4, 'readUInt32LE', 4294967295], 5126: [4, 'readFloatLE', 1] };
function glb(name) {
  const file = readFileSync(new URL(`../public/assets/models/${name}.glb`, import.meta.url));
  assert.equal(file.readUInt32LE(0), 0x46546c67);
  assert.equal(file.readUInt32LE(8), file.length);
  const length = file.readUInt32LE(12);
  const doc = JSON.parse(file.subarray(20, 20 + length));
  const binary = file.subarray(28 + length);
  function read(index) {
    const a = doc.accessors[index], view = doc.bufferViews[a.bufferView];
    const [bytes, method, factor] = components[a.componentType];
    const width = widths[a.type], stride = view.byteStride ?? width * bytes;
    const offset = (view.byteOffset ?? 0) + (a.byteOffset ?? 0);
    return Array.from({ length: a.count }, (_, vertex) => Array.from({ length: width }, (_, c) =>
      binary[method](offset + vertex * stride + c * bytes) / (a.normalized ? factor : 1)));
  }
  return { doc, read, bytes: file.length };
}

for(const name of ['nyanluna','tsukineko','mochinyafe','hehereal'])test(`${name}: published metadata contains no private workstation paths`,()=>{
  assert.doesNotMatch(JSON.stringify(glb(name).doc),/\/Users\/|\/private\//);
});

test('hehereal: portable 64-bone bow heroine preserves reference eyes, opaque hair and valid mobile skin weights',()=>{
 const {doc,read,bytes}=glb('hehereal');assert.equal(doc.skins.length,1);assert.equal(doc.skins[0].joints.length,64);assert.ok(doc.meshes.length<=50);assert.ok(doc.materials.length<=10);assert.ok(bytes<12*1048576);
 assert.equal(doc.images.length,2);assert.ok(doc.images.every(i=>i.bufferView!==undefined&&!i.uri));assert.ok(doc.nodes.some(n=>n.extras?.game_rig_version==='renewal-20261001'));
 let triangles=0;
 for(const p of doc.meshes.flatMap(m=>m.primitives)){
  const positions=read(p.attributes.POSITION),normals=read(p.attributes.NORMAL),weights=read(p.attributes.WEIGHTS_0),joints=read(p.attributes.JOINTS_0),indices=read(p.indices);triangles+=indices.length/3;
  for(const [index] of indices)assert.ok(index>=0&&index<positions.length);
  for(let i=0;i<positions.length;i++){
   assert.ok(positions[i].every(Number.isFinite));assert.ok(normals[i].every(Number.isFinite));
   assert.ok(weights[i].every(w=>Number.isFinite(w)&&w>=0&&w<=1));assert.ok(Math.abs(weights[i].reduce((a,b)=>a+b,0)-1)<.0001);assert.ok(joints[i].every(j=>j>=0&&j<64));
  }
 }
 assert.equal(triangles,169647);assert.ok(triangles<180000);for(const name of ['head','upper_arm.L','upper_arm.R','forearm.L','forearm.R','hand.L','hand.R','thigh.L','thigh.R'])assert.ok(doc.nodes.some(n=>n.name===name));
 for(const side of ['L','R'])assert.ok(doc.nodes.some(n=>n.name===`Eye_reference_${side}`));
 for(const n of doc.nodes.filter(n=>n.mesh!==undefined&&/HAIR/i.test(n.name)))for(const p of doc.meshes[n.mesh].primitives){const m=doc.materials[p.material];assert.ok(!m.alphaMode||m.alphaMode==='OPAQUE');assert.equal(m.pbrMetallicRoughness.baseColorFactor?.[3]??1,1);}
 for(const matrix of read(doc.skins[0].inverseBindMatrices))assert.ok(matrix.every(Number.isFinite));
});

for (const name of ['nyanluna', 'tsukineko', 'omsolo']) {
  test(`${name}: portable skin, geometry, colours and bounds are valid`, () => {
    const { doc, read, bytes } = glb(name);
    const referenceEyes = ['nyanluna', 'tsukineko'].includes(name);
    assert.ok(doc.meshes.length <= (referenceEyes ? 24 : 1), 'Separate skin, hair, garments and eyes stay within the draw budget');
    if(!referenceEyes)assert.equal(doc.meshes[0].primitives.length, 1);
    assert.ok(doc.materials.length <= (referenceEyes ? 5 : 1));
    assert.equal(doc.skins.length, 1);
    assert.ok(bytes < 12 * 1048576, '12 MiB per-character transfer budget');
    assert.equal(doc.images?.length ?? 0, referenceEyes ? 2 : 0);
    assert.ok((doc.images ?? []).every(image => image.bufferView !== undefined && !image.uri),
      'Reference artwork is embedded in the GLB');
    const primitive = doc.meshes[0].primitives[0];
    const pos = read(primitive.attributes.POSITION);
    const normals = read(primitive.attributes.NORMAL);
    const colors = primitive.attributes.COLOR_0===undefined?null:read(primitive.attributes.COLOR_0);
    const joints = read(primitive.attributes.JOINTS_0);
    const weights = read(primitive.attributes.WEIGHTS_0);
    const indices = read(primitive.indices);
    const triangles = doc.meshes.flatMap(mesh => mesh.primitives)
      .reduce((sum, p) => sum + doc.accessors[p.indices].count / 3, 0);
    assert.ok(triangles < 180000, '180k triangle budget including eye details');
    for (const [index] of indices) assert.ok(index >= 0 && index < pos.length);
    let colorful = 0;
    for (let i = 0; i < pos.length; i++) {
      assert.ok(pos[i].every(Number.isFinite));
      assert.ok(normals[i].every(Number.isFinite));
      assert.ok(Math.abs(Math.hypot(...normals[i]) - 1) < .025);
      assert.ok(weights[i].every(v => Number.isFinite(v) && v >= 0 && v <= 1));
      assert.ok(Math.abs(weights[i].reduce((a, b) => a + b, 0) - 1) < .0001);
      assert.ok(joints[i].every(j => j >= 0 && j < doc.skins[0].joints.length));
      if(colors){assert.ok(colors[i].every(v => Number.isFinite(v) && v >= 0 && v <= 1));
        colorful += Number(Math.max(...colors[i].slice(0, 3)) - Math.min(...colors[i].slice(0, 3)) > .04);}
    }
    if(referenceEyes){
      assert.ok(doc.materials.some(m=>m.pbrMetallicRoughness.baseColorTexture), 'Renewal albedo artwork stays embedded');
      assert.ok(doc.nodes.some(n=>n.extras?.game_rig_version==='renewal-20261001'));
      for(const p of doc.meshes.flatMap(m=>m.primitives)){
        const positions=read(p.attributes.POSITION),influences=read(p.attributes.WEIGHTS_0),bones=read(p.attributes.JOINTS_0);
        for(let i=0;i<positions.length;i++){
          assert.ok(positions[i].every(Number.isFinite));
          assert.ok(Math.abs(influences[i].reduce((a,b)=>a+b,0)-1)<.0001);
          assert.ok(bones[i].every(j=>j>=0&&j<doc.skins[0].joints.length));
        }
      }
    }else assert.ok(colorful > pos.length * .2, 'Baked materials contain the supplied character colours');
    const names = doc.nodes.map(n => n.name);
    for (const joint of ['head', 'upper_arm.L', 'upper_arm.R', 'thigh.L', 'thigh.R', 'hand.R']) assert.ok(names.includes(joint));
    for (const row of read(doc.skins[0].inverseBindMatrices)) assert.ok(row.every(Number.isFinite));
    const report = JSON.parse(readFileSync(new URL(`./fixtures/${name}-export.json`, import.meta.url)));
    if(referenceEyes){
      assert.equal(triangles,report.triangles);
      assert.equal(bytes,report.bytes);
      assert.equal(doc.skins[0].joints.length,report.bones);
      assert.equal(createHash('sha256').update(readFileSync(new URL(`../public/assets/models/${name}.glb`,import.meta.url))).digest('hex'),report.export_sha256);
    }
    assert.equal(report.unweighted_vertices, 0);
    assert.ok(report.meshes.every(m => !/FACE_FX_|SmoothLid|DANCE_GROUND/.test(m.source_mesh)));
  });
}

for (const name of ['nyanluna', 'tsukineko']) test(`${name}: both reference eyes retain artwork, UVs and full head-bone weights`, () => {
  const { doc, read } = glb(name);
  const skin = doc.skins[0];
  const head = skin.joints.findIndex(index => doc.nodes[index].name === 'head');
  assert.ok(head >= 0);
  for (const side of ['L', 'R']) {
    const node = doc.nodes.find(n => n.name === `Eye_reference.${side}`);
    assert.ok(node, `Independent ${side} eye survives export`);
    assert.equal(node.skin, 0);
    const p = doc.meshes[node.mesh].primitives[0];
    const positions = read(p.attributes.POSITION), uv = read(p.attributes.TEXCOORD_0);
    const joints = read(p.attributes.JOINTS_0), weights = read(p.attributes.WEIGHTS_0);
    assert.ok(positions.length > 100);
    for (let i = 0; i < positions.length; i++) {
      assert.ok(positions[i].every(Number.isFinite));
      assert.ok(uv[i].every(v => Number.isFinite(v) && v >= 0 && v <= 1));
      assert.equal(joints[i][0], head);
      assert.deepEqual(weights[i], [1, 0, 0, 0]);
    }
    for (const [index] of read(p.indices)) assert.ok(index >= 0 && index < positions.length);
    const material = doc.materials[p.material];
    const texture = doc.textures[material.pbrMetallicRoughness.baseColorTexture.index];
    assert.equal(doc.images[texture.source].mimeType, 'image/png');
  }
});

test('mochinyafe: renewal paws, portable matte colours, skin weights and mobile budget',()=>{
 const {doc,read,bytes}=glb('mochinyafe');assert.equal(doc.meshes.length,7);assert.equal(doc.materials.length,1);assert.equal(doc.skins.length,1);assert.equal(doc.images?.length??0,0);assert.ok(bytes<2*1048576);
 let triangles=0,minY=Infinity,maxY=-Infinity;
 let pinkVertices=0;
 for(const primitive of doc.meshes.flatMap(m=>m.primitives)){
  const positions=read(primitive.attributes.POSITION),normals=read(primitive.attributes.NORMAL),indices=read(primitive.indices);triangles+=indices.length/3;
  for(const p of positions){assert.ok(p.every(Number.isFinite));minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);}
  for(const n of normals)assert.ok(n.every(Number.isFinite));for(const [index] of indices)assert.ok(index>=0&&index<positions.length);
  const weights=read(primitive.attributes.WEIGHTS_0),joints=read(primitive.attributes.JOINTS_0),colors=read(primitive.attributes.COLOR_0);
  for(let i=0;i<positions.length;i++){
   assert.ok(Math.abs(weights[i].reduce((a,b)=>a+b,0)-1)<.0001);assert.ok(joints[i].every(j=>j>=0&&j<8));
   const c=colors[i];assert.ok(c.every(v=>Number.isFinite(v)&&v>=0&&v<=1));pinkVertices+=Number(c[0]>c[1]+.04&&c[2]>c[1]+.01);
  }
 }
 const report=JSON.parse(readFileSync(new URL('./fixtures/mochinyafe-export.json',import.meta.url)));
 assert.equal(bytes,report.bytes);
 assert.equal(createHash('sha256').update(readFileSync(new URL('../public/assets/models/mochinyafe.glb',import.meta.url))).digest('hex'),report.export_sha256);
 assert.equal(triangles,report.triangles);assert.ok(triangles<40000);assert.equal(report.limbCount,4);
 assert.ok(maxY-minY>.5&&maxY-minY<1.1);assert.ok(pinkVertices>100,'Pink cheeks and ears survive export');
 for(const side of ['L','R'])for(const region of ['front','back'])assert.ok(doc.nodes.some(n=>n.name===`paw.${region}.${side}`));
 assert.equal(doc.skins[0].joints.length,8);assert.ok(doc.nodes.some(n=>n.extras?.game_rig_version==='renewal-20261001'));
 assert.ok(doc.materials[0].pbrMetallicRoughness.roughnessFactor>=.9);assert.equal(report.unweighted_vertices,0);
});
