export const PARTY_LIMIT=2;
export const PARTY_KEY='lunaria-party-v1';

// Only roster characters may deploy. Invalid saves fall back to the current starting party.
export function normalizeParty(raw,roster){
  const known=new Set(roster.map(hero=>hero.id));
  const party=[...new Set(Array.isArray(raw)?raw:[])].filter(id=>known.has(id)).slice(0,PARTY_LIMIT);
  return party.length?party:roster.slice(0,PARTY_LIMIT).map(hero=>hero.id);
}

export function changeParty(party,id,roster){
  const current=normalizeParty(party,roster);
  if(!roster.some(hero=>hero.id===id))return current;
  if(current.includes(id))return current.length>1?current.filter(member=>member!==id):current;
  return current.length<PARTY_LIMIT?[...current,id]:current;
}
