import test from 'node:test';
import assert from 'node:assert/strict';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';

// v2.2.1 was noise processing of old recordings. v2.2.2 must use fresh TTS takes.
const OLD_BATTLE_TAKES=new Set([
 "nyanluna-hurt-1-e0428977c3d5.mp3",
 "nyanluna-lowhp-1-61bb22f07f39.mp3",
 "nyanluna-levelup-1-b240ee101c4e.mp3",
 "nyanluna-dash-1-3383915fbfd8.mp3",
 "nyanluna-equip-1-76d32a29a18a.mp3",
 "nyanluna-start-1-e827b8187d02.mp3",
 "nyanluna-switch-1-4ee2a721e234.mp3",
 "nyanluna-attack-1-e1d202f630df.mp3",
 "nyanluna-treasure-1-5a6642e56764.mp3",
 "nyanluna-blessing-1-5a43fac90037.mp3",
 "nyanluna-recruit-1-8553edfa2696.mp3",
 "nyanluna-defeat-1-de3421e40e19.mp3",
 "nyanluna-heal-1-e768be2da1db.mp3",
 "nyanluna-wave-1-16d057ca3e4e.mp3",
 "nyanluna-boss-1-e75310c4e72b.mp3",
 "nyanluna-down-1-9301ed8253cd.mp3",
 "nyanluna-victory-1-65677d7b490d.mp3",
 "nyanluna-victory-2-729a427b53e4.mp3",
 "nyanluna-switch-2-21f094049cf1.mp3",
 "nyanluna-attack-2-8193a867ae21.mp3",
 "nyanluna-support-1-b85664d87cbf.mp3",
 "nyanluna-dash-2-e22b6ecbace8.mp3",
 "nyanluna-exit-1-b5dce10c7b6d.mp3",
 "nyanluna-ultimate-1-0e4dbc6a271a.mp3",
 "nyanluna-levelup-2-b22a13713d35.mp3",
 "nyanluna-hurt-2-1fc109197a0c.mp3",
 "nyanluna-attack-3-0ac35738a20f.mp3"
]);

test('Nyanluna uses 27 fresh content-addressed battle takes, not the v2.2.1 cleanup',()=>{
 const clips=Object.entries(VOICE_MANIFEST).filter(([,v])=>v.who==='nyanluna'&&v.kind==='battle');
 assert.equal(clips.length,27);
 for(const [id,clip]of clips){
  assert.ok(!OLD_BATTLE_TAKES.has(clip.file.split('/').pop()),id+' still uses an old recording');
  assert.match(clip.file,new RegExp('^assets/voices/nyanluna/'+id+'-[a-f0-9]{12}\\.mp3$'));
  assert.ok(clip.duration>=.35&&clip.duration<10,id);
  assert.ok(Number.isFinite(clip.normalizationDb),id);
 }
 assert.equal(Object.values(VOICE_MANIFEST).filter(v=>v.who==='nyanluna'&&v.kind!=='battle').length,35);
});
