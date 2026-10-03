import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';

const old={
 'nyanluna-switch-1':'eb4588633600',
 'nyanluna-switch-2':'150221e6bacf',
 'nyanluna-heal-1':'3a6105da644d',
 'nyanluna-wave-1':'6ec1bfbb791b',
 'nyanluna-support-1':'1f282bc6cd9b',
 'nyanluna-exit-1':'e54ba692270b',
 'nyanluna-dash-2':'d15923b5dd90'
};
test('Nyanluna switch, relief, wave, support, gate and dash use newly retaken content-addressed audio',()=>{
 for(const [id,previous]of Object.entries(old)){
  const clip=VOICE_MANIFEST[id];assert.equal(clip.who,'nyanluna');assert.equal(clip.kind,'battle');
  assert.ok(!clip.file.includes(previous),`${id} still plays the inconsistent take`);
  const bytes=readFileSync(new URL(`../public/${clip.file}`,import.meta.url));
  const digest=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  assert.ok(clip.file.endsWith(`-${digest}.mp3`));
  assert.ok(clip.duration>.5&&clip.duration<5);assert.ok(Number.isFinite(clip.normalizationDb));
 }
});

test('Hikari yo keeps its line and gain while excluding the isolated post-speech pop',()=>{
 const clip=VOICE_MANIFEST['nyanluna-attack-2'];
 assert.equal(clip.text,'光よ！');assert.equal(clip.who,'nyanluna');assert.equal(clip.kind,'battle');
 assert.equal(clip.normalizationDb,.25);assert.ok(clip.duration>=.6&&clip.duration<=.66);
 assert.ok(!clip.file.includes('6acf7b847987'));
 const bytes=readFileSync(new URL(`../public/${clip.file}`,import.meta.url));
 const digest=createHash('sha256').update(bytes).digest('hex').slice(0,12);
 assert.ok(clip.file.endsWith(`-${digest}.mp3`));
});
