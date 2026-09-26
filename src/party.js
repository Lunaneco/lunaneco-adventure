import {actFor,isActCleared} from './acts.js';

export const PARTY_LIMIT=2;
export const PARTY_KEY='lunaria-party-v1';

// Only roster characters may deploy. Invalid saves fall back to the current starting party.
export function normalizeParty(raw,roster){
  const known=new Set(roster.map(hero=>hero.id));
  const party=[...new Set(Array.isArray(raw)?raw:[])].filter(id=>known.has(id)).slice(0,PARTY_LIMIT);
  return party.length?party:roster.slice(0,PARTY_LIMIT).map(hero=>hero.id);
}

export function requiredPartyMember(profile,act){
  const stage=actFor(act);
  return stage?.chapter===3&&!stage.extra&&!isActCleared(profile,act)?'nyanluna':null;
}

// Preserve the selected lead when a first-clear story member needs the other slot.
export function partyForAct(raw,roster,profile,act,lead){
  const party=normalizeParty(raw,roster),required=requiredPartyMember(profile,act);
  if(!required||party.includes(required)||!roster.some(hero=>hero.id===required))return party;
  return [party.includes(lead)?lead:party[0],required];
}

export function changeParty(party,id,roster,required=null){
  const current=normalizeParty(party,roster);
  if(!roster.some(hero=>hero.id===id))return current;
  if(id===required&&current.includes(id))return current;
  if(current.includes(id))return current.length>1?current.filter(member=>member!==id):current;
  return current.length<PARTY_LIMIT?[...current,id]:current;
}
