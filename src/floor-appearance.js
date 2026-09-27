import {heightAt} from './terrain.js';
import {FLOOR_TYPES,floorPatchesFor,floorPhase,floorState,floorsEngaged} from './special-floors.js';

// Every chapter uses the same visual language for the same effect.
export const FLOOR_VISUALS=Object.freeze({
 damage:{label:'危険',symbol:'×',color:0xff6847,ink:'#ff967c',base:0x391815,shape:'赤橙のトゲ輪と×'},
 heal:{label:'回復',symbol:'＋',color:0x42edac,ink:'#7effcb',base:0x103d35,shape:'緑の二重輪と＋'},
 slow:{label:'減速',symbol:'≈',color:0xbc96ff,ink:'#d3bbff',base:0x302047,shape:'紫の点線輪と波線'},
 boost:{label:'加速',symbol:'»',color:0xffda4d,ink:'#ffe68c',base:0x443713,shape:'黄色の輪と矢印'},
});
export const floorHex=color=>'#'+color.toString(16).padStart(6,'0');
export function floorReadout(game,patch){
 const spec=FLOOR_TYPES[patch.type],visual=FLOOR_VISUALS[spec.kind];
 const remaining=spec.kind==='heal'?Math.max(0,spec.charges-(floorState(game).healing[patch.id]?.used??0)):null;
 const cycle=floorPhase(game,patch),engaged=floorsEngaged(game),phase=remaining===0?'spent':cycle.phase;
 const detail=phase==='spent'?'使い切り':!engaged?'休止中':spec.kind==='heal'?`残り${remaining}回`:spec.kind==='damage'?{quiet:'準備中',warning:'もうすぐ発動',active:'発動中'}[phase]:spec.kind==='slow'?'移動 −28%':'移動 ＋30%';
 const label=phase==='spent'?'回復済':!engaged?`${visual.label} · 休止`:spec.kind==='heal'?`回復 · ${remaining}回`:phase==='warning'?'危険 · 予告':phase==='active'&&spec.kind==='damage'?'危険 · 発動':visual.label;
 return {spec,visual,remaining,phase,progress:cycle.progress,detail,label};
}
export function floorLegend(layout){
 const kinds=[...new Set(floorPatchesFor(layout).map(p=>FLOOR_TYPES[p.type].kind))];
 return `<div class="floor-legend" aria-label="床の効果">${kinds.map(kind=>{const v=FLOOR_VISUALS[kind];return `<span class="floor-key" data-kind="${kind}" style="--floor-ink:${v.ink};--floor-base:${floorHex(v.base)}"><i aria-hidden="true">${v.symbol}</i>${v.label}</span>`;}).join('')}</div>`;
}
// Screen-space captions stay legible on phones without adding GPU textures.
export function drawFloorLabels(ctx,world,game,width,height){
 if(game.tutorial?.active)return;
 ctx.save();ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
 for(const patch of floorPatchesFor(game.layout)){
  const {visual,phase,label}=floorReadout(game,patch);
  const pos=world.project(patch.x+patch.radius*.58,heightAt(game.layout,patch.x,patch.z)+.15,patch.z+patch.radius*.81);
  const text=`${visual.symbol} ${label}`,w=ctx.measureText(text).width+18,h=24,x=pos.x,y=pos.y+16;
  // Captions follow their floor; off-screen floors must not create floating labels.
  if(!pos.visible||x-w/2<3||x+w/2>width-3||y-h/2<85||y+h/2>height-30)continue;
  ctx.globalAlpha=phase==='spent'?.7:1;
  ctx.fillStyle=phase==='spent'?'#25323a':floorHex(visual.base);ctx.strokeStyle=phase==='spent'?'#a2aeb5':visual.ink;ctx.lineWidth=1.25;
  ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,6);ctx.fill();ctx.stroke();
  ctx.fillStyle=phase==='spent'?'#d1dadd':'#ffffff';ctx.fillText(text,x,y+.5);
 }
 ctx.restore();
}
