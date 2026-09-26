import {fieldFor} from './terrain.js';
import {ELITE_BOSS_LABEL} from './enemies.js';
export const fieldSummary=(act,area)=>{const field=fieldFor(act,area);return field.note+(field.kind==='branch'?`（強ボス ${ELITE_BOSS_LABEL}）`:'');};
export function mapSvg(layout,extra=''){
 return `<svg viewBox="-28 -28 56 56" aria-hidden="true"><polygon points="${layout.points.map(p=>p.join(',')).join(' ')}" fill="#456776" stroke="#c1d5bd" stroke-width=".7"/>${extra}</svg>`;
}
let mapKey='';
const enemyLayers=new WeakMap();
function updateMapEnemies(layer,enemies){
 let markers=enemyLayers.get(layer);if(!markers){markers=new Map();enemyLayers.set(layer,markers);}
 const alive=new Set();let bosses=0,rare=0;
 for(const enemy of enemies){
  if(!(enemy.hp>0)||!Number.isFinite(enemy.x)||!Number.isFinite(enemy.z))continue;
  alive.add(enemy.id);const boss=enemy.type==='boss';if(boss)bosses++;const gold=enemy.type==='goldenSlime';if(gold)rare++;
  let marker=markers.get(enemy.id);
  if(!marker||marker.boss!==boss||marker.gold!==gold){
   marker?.node.remove();const node=layer.ownerDocument.createElementNS('http://www.w3.org/2000/svg',boss||gold?'path':'circle');
   node.setAttribute('class',`map-enemy${boss?' boss':gold?' rare':''}`);node.dataset.enemyId=enemy.id;
   if(gold)node.setAttribute('d','M0 -2.6 .7 -.9 2.5 -.8 1.1 .5 1.6 2.4 0 1.3 -1.6 2.4 -1.1 .5 -2.5 -.8 -.7 -.9Z');else if(boss)node.setAttribute('d','M0 -2.1 2.1 0 0 2.1 -2.1 0Z');else node.setAttribute('r','1.15');
   layer.append(node);marker={node,boss,gold};markers.set(enemy.id,marker);
  }
  marker.node.setAttribute('transform',`translate(${enemy.x} ${enemy.z})`);
 }
 for(const [id,marker] of markers)if(!alive.has(id)){marker.node.remove();markers.delete(id);}
 return {enemies:alive.size-bosses-rare,bosses,rare};
}
export function updateTerrainUi(game){
 const map=document.querySelector('#field-map'),guide=document.querySelector('#passage-guide');if(!game)return;
 const l=game.layout,key=l.id+':'+game.travelOpen+':'+game.exitOpen;
 if(key!==mapKey||!map.querySelector('#map-enemies')){mapKey=key;map.innerHTML=`<small>${game.field.kind==='floors'?(game.wave%2?'1F / 2F':'2F / 2F'):game.route==='elite'?'DANGER ROUTE':game.field.kind==='branch'?'BRANCH ROUTE':'FIELD MAP'} <i>N ↑</i></small>${mapSvg(l,`<g id="map-enemies"></g><g id="map-targets"></g><circle id="map-player" r="1.25" fill="#fff7cc" stroke="#153240" stroke-width=".6"/>`)}<div class="map-legend"><span class="map-key-player">自分</span><span class="map-key-enemy">敵</span><span class="map-key-boss">ボス</span><span class="map-key-rare hidden">レア</span></div><span>${l.name}</span>`;}
 const counts=updateMapEnemies(map.querySelector('#map-enemies'),game.enemies);
 map.querySelector('.map-key-rare').classList.toggle('hidden',!counts.rare);
 const description=`${l.name}の地図：現在地、敵${counts.enemies}体、ボス${counts.bosses}体${counts.rare?`、金色のスライム${counts.rare}体`:''}、開いている出口`;
 if(map.getAttribute('aria-label')!==description)map.setAttribute('aria-label',description);
 const player=map.querySelector('#map-player');player.setAttribute('cx',game.player.x);player.setAttribute('cy',game.player.z);
 const targets=game.exitOpen?[{...game.exitPoint,color:0xffe6a0}]:game.travelTargets;
 map.querySelector('#map-targets').innerHTML=targets.map(t=>`<circle cx="${t.x}" cy="${t.z}" r="1.65" fill="#${t.color.toString(16).padStart(6,'0')}"/>`).join('');
 guide.classList.toggle('hidden',!game.travelOpen);guide.classList.toggle('compact',!!game.travelOrigin&&Math.hypot(game.player.x-game.travelOrigin.x,game.player.z-game.travelOrigin.z)>1.5);
 const signature=game.travelOpen??'';
 if(guide.dataset.kind!==signature){guide.dataset.kind=signature;guide.innerHTML=signature==='stairs'?'<small>LOWER FLOOR CLEAR</small><strong>青い階段から、上のフロアへ</strong><span>祝福・HP・クリスタルを引き継ぎます</span>':signature==='branch'?`<small>CHOOSE YOUR PATH</small><strong>進む道を、歩いて選ぼう</strong><div><span class="safe">左 · 緑の門<br><b>通常ルート</b></span><span class="elite">右 · 赤の門<br><b>強ボスルート</b><small class="elite-stats">${ELITE_BOSS_LABEL}</small></span></div><p>強ボス撃破：★2 深星の宝珠1個<br>★1 星の芽20・月のしずく4・守護者の欠片1を追加<br>門を通ると、この出撃では道を戻れません</p>`:'';}
}
