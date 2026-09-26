import {DUET_VOICE} from '../src/shizuku-combat.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {VOICE_MANIFEST} from '../src/voice-manifest.js';
import {ACT_SCENES} from '../src/chapter.js';
import {TUTORIAL_STEPS} from '../src/tutorial.js';
import {BATTLE_VOICES,dialogueVoiceId} from '../src/voice-catalog.js';
import {voicePlaybackGain} from '../src/voice-policy.js';

test('all remaining battle clips have measured levels and the unwanted grunt is not shipped',()=>{
 const battle=Object.values(VOICE_MANIFEST).filter(v=>v.kind==='battle');assert.equal(battle.length,122);
 for(const item of battle){assert.ok(Number.isFinite(item.normalizationDb),item.file);assert.ok(item.normalizationDb>-12&&item.normalizationDb<6,item.file);assert.ok(voicePlaybackGain(item)>0&&voicePlaybackGain(item)<1,item.file);}
 assert.ok(!Object.values(VOICE_MANIFEST).some(v=>v.file.endsWith('tsukineko-hurt-1-a7437c6a58d1.mp3')));
 assert.equal(VOICE_MANIFEST['tsukineko-hurt-1'].text,'いたっ！');assert.equal(VOICE_MANIFEST['tsukineko-hurt-2'],undefined);
});

test('only selected story lines, tutorials and character actions ship voice assets',async()=>{
 const story=ACT_SCENES.flatMap(s=>Object.values(s).flatMap(scene=>scene.lines));
 assert.equal(story.length,245);assert.equal(story.filter(line=>line.voiced).length,107);
 for(const line of story.filter(line=>!line.voiced))assert.equal(VOICE_MANIFEST[dialogueVoiceId(line.who,line.text)],undefined,`Unselected story voice: ${line.text}`);
 const lines=[...story.filter(line=>line.voiced),...TUTORIAL_STEPS.map(s=>({who:'nyanluna',text:s.text}))].map(line=>({...line,id:dialogueVoiceId(line.who,line.text)}));
 lines.push(DUET_VOICE,...Object.values(BATTLE_VOICES).flatMap(events=>Object.values(events).flat()));
 const ids=new Set();
 for(const line of lines){
  ids.add(line.id);const item=VOICE_MANIFEST[line.id];assert.ok(item,`Missing voice: ${line.id} ${line.text}`);assert.equal(item.text,line.text);assert.equal(item.who,line.who);assert.ok(item.duration>0&&item.duration<60);
  const file=new URL(`../public/${item.file}`,import.meta.url);assert.ok((await stat(file)).size>1000);const bytes=await readFile(file),header=bytes.subarray(0,3);assert.ok(header.toString()==='ID3'||header[0]===255,`Invalid MP3 header: ${item.file}`);
  // Re-recordings get a content-addressed URL so existing browser caches cannot replay an old take.
  const digest=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  const original=`assets/voices/${line.who}/${line.id}.mp3`,versioned=`assets/voices/${line.who}/${line.id}-${digest}.mp3`;
  assert.ok(item.file===versioned||(line.who==='mochinyafe'&&new RegExp(`^assets/voices/mochinyafe/mochi-[1-4]-${digest}\\.mp3$`).test(item.file))||(!['nyanluna','tsukineko'].includes(line.who)&&item.file===original),`Stale or incorrect voice URL: ${item.file}`);
 }
 assert.equal(Object.keys(VOICE_MANIFEST).length,ids.size);
});
test('voice distribution includes only approved MP3 clips and no private voice references',async()=>{
 const base=new URL('../public/assets/voices/',import.meta.url),expected=new Set(Object.values(VOICE_MANIFEST).map(v=>v.file));let count=0;
 for(const dir of await readdir(base,{withFileTypes:true})){
  assert.ok(dir.isDirectory());assert.ok(['nyanluna','tsukineko','omsolo','omsolo_hurt','komusubi','guardian','narrator','mochinyafe','shizuku','demonking','demonking_calm'].includes(dir.name));
  for(const name of await readdir(new URL(dir.name+'/',base))){assert.ok(expected.has(`assets/voices/${dir.name}/${name}`),`Unexpected file: ${name}`);count++;}
 }
 assert.equal(count,expected.size);
});
