import {MOCHI_VOICE_CLIPS} from './mochi-voice-clips.js';
import {BATTLE_VOICES,dialogueVoiceId} from './voice-catalog.js';
const storyTexts=['ふぇ〜！','ふぇ〜……','ふぇ〜？','ふぇ〜っ！'];
const clipFor=text=>MOCHI_VOICE_CLIPS[storyTexts.indexOf(text)]??MOCHI_VOICE_CLIPS[0];
export const MOCHI_VOICE_MANIFEST=Object.freeze(Object.fromEntries([
 ...storyTexts.map(text=>[dialogueVoiceId('mochinyafe',text),{...clipFor(text),who:'mochinyafe',text,kind:'story'}]),
 ...Object.values(BATTLE_VOICES.mochinyafe).flat().map(line=>[line.id,{...clipFor(line.text),...line}]),
]));
