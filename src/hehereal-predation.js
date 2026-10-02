import {skillsForParty} from './blessings.js';
import {ultimateBonuses} from './talents.js';

export const PREDATION_KILL_ATTACK_RATE=.1;
export function predationUltimate(character){
 const bonus=ultimateBonuses(character,'hehereal');
 const pulses=8+bonus.ultimatePulses+bonus.ultimateShots,interval=.35;
 return {id:'hehe-predation-dance',name:'捕食の舞',icon:'link',color:0xffb77c,kind:'predationDance',radius:6.5+bonus.ultimateRadius+bonus.ultimateRange*.25,pulses,interval,duration:pulses*interval,baseDamage:38*(1+bonus.ultimateDamage),immunity:pulses*interval+bonus.ultimateImmunity,note:'魔法の弓を持って周囲を舞う。必殺技中の敵撃破1体ごとに変身時のへへりある自身の攻撃力の10%を加算。上昇は幕終了まで維持。'};
}
export function predationKill(game,heroId){
 const state=game.predation;
 if(game.phase!=='playing'||!state?.active||heroId!=='hehereal'||!game.ultimateEffects.some(e=>e.kind==='predationDance'&&e.heroId==='hehereal'&&e.remaining>0))return false;
 state.danceKills++;state.attackBonus=state.baseAttack*PREDATION_KILL_ATTACK_RATE*state.danceKills;
 game.emit('predationPower',{hero:6,heroId:'hehereal',kills:state.danceKills,attackBonus:state.attackBonus});return true;
}

export const hasPredationPair=party=>party?.length===2&&party.includes('omsolo')&&party.includes('hehereal');
export function canPredate(game){
 return game.phase==='playing'&&!game.predation?.active&&!game.predation?.used&&hasPredationPair(game.party)&&game.isHeroAlive(2)&&game.isHeroAlive(6)&&!game.tutorial?.active&&!game.exitOpen&&!game.travelOpen&&!game.mount.active&&!game.ultimateEffects.length;
}
export function startPredation(game){
 if(!canPredate(game))return false;
 const baseAttack=game.statsFor(6).attack;
 game.predation={active:true,used:true,baseAttack,attackBonus:0,danceKills:0,party:[...game.party],lead:game.player.hero};
 game.cancelRice();
 // Absorbed Omsolo cannot keep attacking through lingering shots or support.
 game.projectiles=game.projectiles.filter(p=>p.heroId!=='omsolo');
 game.party=Object.freeze(['hehereal']);game.partyHeroes=[6];
 game.skillPool=Object.freeze(skillsForParty(game.party,game.progression));
 game.player.hero=6;game.player.attack=.05;game.player.dash=0;game.player.moving=false;
 game.partner.moving=false;game.refreshStats();
 game.emit('predationStart',{hero:6,heroId:'hehereal'});
 return true;
}
// There is intentionally no manual release or timer. A whole act is one battle.
export function finishPredation(game){
 if(!game.predation?.active||!['victory','defeat'].includes(game.phase))return false;
 const state=game.predation;state.active=false;state.attackBonus=0;state.danceKills=0;
 game.party=Object.freeze([...state.party]);game.partyHeroes=game.party.map(id=>id==='omsolo'?2:6);
 game.player.hero=state.lead;game.skillPool=Object.freeze(skillsForParty(game.party,game.progression));
 game.refreshStats();game.emit('predationEnd',{hero:6,heroId:'hehereal'});return true;
}
