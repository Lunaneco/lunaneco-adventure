import {GOLDEN_HEHE} from './chapter-six-enemies.js';
export function goldenHeheHud(game){
 const e=game.goldenHehe;if(!e)return '';
 if(e.status==='active'){const seconds=Math.ceil(Math.max(0,e.expiresAt-game.time));return `<div class="rare-heading"><span>RARE · 黄金のへへへ</span><strong>逃走まで ${seconds}秒</strong></div><div class="rare-timer" role="progressbar" aria-label="黄金のへへへの逃走まで" aria-valuemin="0" aria-valuemax="20" aria-valuenow="${seconds}"><i style="width:${seconds/GOLDEN_HEHE.lifetime*100}%"></i></div><p>素材はレアスライムの<b>2倍</b>＋★3素材を大量獲得</p>`;}
 if(game.time-e.resolvedAt>6)return '';
 return `<div class="rare-heading"><strong>黄金のへへへ ${e.status==='defeated'?'討伐！':'は逃げていった…'}</strong></div><p>${e.status==='defeated'?'素材2倍＋紅月の結晶40個・魔心の宝珠20個を獲得':'各幕で一度だけ20%抽選。再挑戦でも出会えることがあります。'}</p>`;
}
