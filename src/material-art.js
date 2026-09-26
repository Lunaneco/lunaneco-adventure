import {publicUrl} from './public-url.js';
const files=Object.freeze({bloodCrystal:'blood-crystal',demonHeart:'demon-heart',starBud:'star-bud',moonDew:'moon-dew',wardenCore:'warden-shard',moonPrism:'moon-prism',astralCore:'astral-orb',limitStone:'awakening-stone'});
export function materialImage(id){return files[id]?publicUrl(`assets/materials/${files[id]}-v1.png`):'';}
export function materialArt(id){return `<img class="material-art" src="${materialImage(id)}" alt="" width="80" height="80" decoding="async">`;}
