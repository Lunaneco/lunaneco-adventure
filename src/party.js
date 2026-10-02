import {actFor,isActCleared} from './acts.js';

export const PARTY_LIMIT=2;
export const PARTY_KEY='lunaria-party-v1';

// Only roster characters may deploy. Invalid saves fall back to the current starting party.
export function normalizeParty(raw,roster){
  const known=new Set(roster.map(hero=>hero.id));
  const party=[...new Set(Array.isArray(raw)?raw:[])].filter(id=>known.has(id)).slice(0,PARTY_LIMIT);
  return party.length?party:roster.slice(0,PARTY_LIMIT).map(hero=>hero.id);
}

export const requiresSoloTsukineko=(profile,act)=>actFor(act)?.chapter===4&&!actFor(act)?.extra&&!isActCleared(profile,act);
export function soloHeroForAct(profile,act){
  const stage=actFor(act);
  return stage?.soloHero&&(!stage.soloFirstClear||!isActCleared(profile,act))?stage.soloHero:null;
}

export function requiredPartyMember(profile,act){
  const stage=actFor(act);
  const solo=soloHeroForAct(profile,act);
  if(solo)return solo;
  if(requiresSoloTsukineko(profile,act))return 'tsukineko';
  return stage?.chapter===3&&!stage.extra&&!isActCleared(profile,act)?'nyanluna':null;
}

// Preserve the selected lead when a first-clear story member needs the other slot.
export function partyForAct(raw,roster,profile,act,lead){
  const solo=soloHeroForAct(profile,act);
  if(solo&&roster.some(h=>h.id===solo))return [solo];
  if(requiresSoloTsukineko(profile,act)&&roster.some(h=>h.id==='tsukineko'))return ['tsukineko'];
  const party=normalizeParty(raw,roster),required=requiredPartyMember(profile,act);
  if(!required||party.includes(required)||!roster.some(hero=>hero.id===required))return party;
  return [party.includes(lead)?lead:party[0],required];
}

export function changeParty(party,id,roster,required=null){
  const current=normalizeParty(party,roster);
  if(required==='tsukineko')return ['tsukineko'];
  if(!roster.some(hero=>hero.id===id))return current;
  if(id===required&&current.includes(id))return current;
  if(current.includes(id))return current.length>1?current.filter(member=>member!==id):current;
  return current.length<PARTY_LIMIT?[...current,id]:current;
}
