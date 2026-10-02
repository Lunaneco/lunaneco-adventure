import {HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {TALENT_NODES} from '../src/talents.js';
import {WEAPON_CATALOG} from '../src/weapons.js';
import {UNIQUE_EQUIPMENT} from '../src/equipment.js';

export function maxedHeheProfile(cleared=32){
 return normalizeProgression({
  story:{version:2,actClears:Array.from({length:32},(_,i)=>i<cleared)},
  tutorial:{firstBattleCompleted:true},awakenings:{nyanluna:true,rice:true},
  characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:80,breaks:6,tree:TALENT_NODES.map(n=>n.id)}])),
  weapons:{version:2,owned:WEAPON_CATALOG.map(w=>w.id),loadout:Object.fromEntries(HEROES.map(h=>[h.id,WEAPON_CATALOG.filter(w=>w.heroId===h.id&&w.rarity.rank===4).sort((a,b)=>b.bonus.attack-a.bonus.attack)[0].id]))},
  equipment:{owned:UNIQUE_EQUIPMENT.map(e=>e.id),loadout:Object.fromEntries(HEROES.map(h=>[h.id,UNIQUE_EQUIPMENT.filter(e=>!e.heroId||e.heroId===h.id).sort((a,b)=>((b.bonus.hp??0)+(b.bonus.defense??0)*2)-((a.bonus.hp??0)+(a.bonus.defense??0)*2))[0].id]))},
 },HEROES);
}
