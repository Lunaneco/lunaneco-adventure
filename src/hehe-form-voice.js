import {BATTLE_VOICES} from './voice-catalog.js';

// The supplied clips are reused verbatim, not synthesized as a new voice.
export const HEHE_FORM_LINES=Object.freeze({
 laugh:Object.freeze({id:'hehereal-hehe-laugh',who:'hehereal',text:'（笑い声）'}),
 attack:Object.freeze({id:'hehereal-hehe-attack',who:'hehereal',text:'おりゃ！'}),
 power:Object.freeze({id:'hehereal-hehe-power',who:'hehereal',text:'（雄叫び）'}),
});
export function battleVoiceLines(who,event,game){
 if(who==='hehereal'&&game?.predation?.active){
  return [HEHE_FORM_LINES[['attack','support'].includes(event)?'attack':['ultimate','hurt','down','dash','lowhp'].includes(event)?'power':'laugh']];
 }
 return BATTLE_VOICES[who]?.[event];
}
