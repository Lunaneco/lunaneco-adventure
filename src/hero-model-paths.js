export const HERO_MODEL_NAMES = ['nyanluna', 'tsukineko', 'omsolo', 'mochinyafe', 'shizuku', 'prim', 'hehereal', 'lumi'];

export const CACHE_MODEL_NAMES = [...HERO_MODEL_NAMES, 'nyanluna-awakening', 'nyanluna-awakening-staff'];

// Build-time content hashes change the pathname, so even an older offline
// worker with ignoreSearch:true cannot return an outdated character model.
const revisions = typeof __HERO_MODEL_REVISIONS__ === 'undefined' ? {} : __HERO_MODEL_REVISIONS__;
export function heroModelPath(name, versions = revisions) {
  const revision = versions[name];
  return `assets/models/${name}${revision ? `.${revision}` : ''}.glb`;
}
