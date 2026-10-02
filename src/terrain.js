import {chapterRoom} from './chapter-terrain.js';
import {RICE_QUEST_ID} from './rice-awakening.js';
// The same outlines drive floor geometry, walking collision, navigation and spawn positions.
const polygon=(id,name,points,style='stone',extra={})=>({id,name,points,style,entrance:{x:0,z:8},exit:{x:0,z:-16.6,radius:1.7},height:0,...extra});
const oct=(x,z)=>[[-x*.55,-z],[x*.55,-z],[x,-z*.55],[x,z*.55],[x*.55,z],[-x*.55,z],[-x,z*.55],[-x,-z*.55]];
const petal=polygon('cape','星露の岬',[[-6,-20],[7,-18],[15,-11],[17,0],[13,11],[4,17],[-9,14],[-16,5],[-17,-7]],'meadow');
const courtyard=polygon('courtyard','月影の中庭',[[-15,-7],[-3.6,-7],[-3.6,-19],[3.6,-19],[3.6,-7],[15,-7],[16,10],[10,16],[-10,16],[-16,10]],'stone',{stairs:true,combatPoints:[[-15,-7],[15,-7],[16,10],[10,16],[-10,16],[-16,10]],stairPoint:{x:0,z:-16.6,radius:1.6}});
const fork=polygon('fork','ふたつの月路',[[-9,16],[9,16],[14,6],[8,-2],[18,-7],[18,-16],[11,-20],[0,-10],[-11,-20],[-18,-16],[-18,-7],[-8,-2],[-14,6]],'stone');
const roof=polygon('roof','月見の上層回廊',oct(16,20),'stone',{height:4.5});
const altar=polygon('altar','暁の花冠壇',[[-6,-20],[6,-20],[6,-13],[16,-10],[18,0],[13,12],[5,17],[-5,17],[-13,12],[-18,0],[-16,-10],[-6,-13]],'sanctuary');
const hall=polygon('hall','忘却の折れ回廊',[[-15,-21],[5,-21],[5,-3],[15,-3],[15,16],[-15,16]],'stone',{exit:{x:-6,z:-17,radius:1.7}});
const garden=polygon('garden','星時計の八角庭',oct(19,20),'clock');
const prison=polygon('prison','逆さ時計の牢',[[-13,-20],[13,-20],[17,-12],[17,10],[10,17],[-10,17],[-17,10],[-17,-12]],'clock');
const bridge=polygon('bridge','雲海の双島橋',[[-10,-25],[10,-25],[16,-17],[16,-9],[4,-4],[4,4],[15,9],[15,17],[7,22],[-7,22],[-15,17],[-15,9],[-4,4],[-4,-4],[-16,-9],[-16,-17]],'sky',{exit:{x:0,z:-21,radius:1.7}});
const crescent=polygon('crescent','風待ちの三日月岬',[[-6,-20],[6,-20],[15,-13],[17,-3],[11,7],[8,16],[-7,17],[-15,9],[-16,-2],[-10,-5],[-5,0],[-2,6],[5,5],[8,-3],[5,-11],[-6,-14]],'sky');
const cross=polygon('cross','月落ちの十字参道',[[-6,-21],[6,-21],[6,-7],[17,-7],[17,7],[7,7],[7,18],[-7,18],[-7,7],[-17,7],[-17,-7],[-6,-7]],'sanctuary');
const eclipse=polygon('eclipse','月蝕の祭壇',oct(18,21),'eclipse');
const variant=(base,id,name,style=base.style,extra={})=>({...base,id,name,style,...extra});
const single=(room,note)=>({kind:'single',rooms:[room],note});
const floors=(lower,upper)=>({kind:'floors',rooms:[lower,upper],note:'2フロア · 下階を制圧して階段で上階へ'});
const branch=(lobby,safe,elite)=>({kind:'branch',rooms:[lobby,safe,elite],note:'分岐 · 左は通常、右は強敵と追加素材'});
const BASE_FIELD_LAYOUTS=Object.freeze([
 [single(petal,'岬 · 広い草地と細い北端'),floors(courtyard,roof),branch(variant(fork,'dawn-fork','暁の分かれ道','sanctuary'),altar,variant(eclipse,'root-altar','封印の深淵壇','meadow'))],
 [single(hall,'L字回廊 · 曲がり角を使って戦う'),branch(variant(fork,'clock-fork','時計庭の分岐','clock'),garden,prison),floors(variant(courtyard,'clock-lower','時計塔・下層','clock'),variant(roof,'clock-upper','時計塔・上層','clock'))],
 [branch(variant(fork,'wind-fork','風待ちの岐路','sky'),variant(garden,'wind-isle','風渡りの浮島','sky'),variant(eclipse,'storm-isle','嵐を抱く浮島','sky')),floors(variant(courtyard,'cloud-lower','雲影の浮島・下層','sky'),variant(crescent,'cloud-upper','三日月の上層島','sky',{height:4.5})),single(bridge,'双島橋 · ふたつの島を細い橋がつなぐ')],
 [single(cross,'十字参道 · 四方へ伸びる足場'),branch(variant(fork,'moon-fork','月還りの分岐','sanctuary'),variant(altar,'moon-garden','暁を待つ庭'),eclipse),floors(variant(courtyard,'sanctuary-lower','月還りの聖域・下層','sanctuary'),variant(altar,'sanctuary-upper','月還りの聖域・上層','sanctuary',{height:4.5}))],
 [single(variant(petal,'lantern-grove','稲穂の里道','meadow'),'棚田の里道 · 稲穂をたどる'),floors(variant(courtyard,'woodbridge-lower','こむすびの木橋・下層','meadow'),variant(bridge,'woodbridge-upper','こむすびの木橋・上層','meadow',{height:4.5})),branch(variant(fork,'thorn-fork','里はずれの竹林の分岐','meadow'),variant(altar,'thorn-den','竹林の獣王の狩場','meadow'),variant(prison,'thorn-deep','茨牙の深い竹やぶ','meadow'))],
 [single(variant(crescent,'jade-canyon','翡翠の用水峡','sky'),'用水峡 · 広場をつなぐ水辺の道'),floors(variant(courtyard,'sluice-lower','水車の大水門・下層'),variant(hall,'sluice-upper','大水門の上層水路','stone',{height:4.5})),branch(variant(fork,'serpent-fork','用水路の分岐'),variant(bridge,'serpent-bridge','蛇骨の渡し'),variant(eclipse,'serpent-nest','岩鎧の水源洞','stone'))],
 [single(variant(cross,'ash-road','のり屋根の市庭','stone'),'棚状の市庭 · 閉ざされた市場'),branch(variant(fork,'fort-fork','城下の分かれ路'),variant(garden,'fort-court','用水路の中庭'),variant(prison,'fort-prison','封鎖された米蔵')),floors(variant(courtyard,'bell-lower','穂鐘の見張り台・下層','clock'),variant(roof,'bell-upper','穂鐘の見張り台・上層','clock'))],
 [single(variant(hall,'broken-fort','砕けた穂守り砦','eclipse'),'段状の砦跡 · 巨神の爪痕'),floors(variant(courtyard,'lifelight-lower','命灯りの石段・下層','sanctuary'),variant(roof,'lifelight-upper','命灯りの石段・上層','sanctuary')),single(variant(eclipse,'colossus-arena','穂守りの大広場','eclipse'),'救出戦 · 巨神を倒しオムソロを救う')],

 [single(variant(petal,'mochi-village','さくらもちの里','sanctuary'),'もちの里 · 空になった丸い家々'),floors(variant(courtyard,'mochi-tea-lower','こぼれ茶の小径・下層','sanctuary'),variant(roof,'mochi-tea-upper','こぼれ茶の小径・上層','sanctuary')),single(variant(garden,'mochi-claw','影爪の茶屋','sanctuary'),'追手 · 影爪の突進をかわす')],
 [single(variant(crescent,'mochi-river','ミルクティーの渓谷','sky'),'渓谷 · 細い岸辺を進む'),floors(variant(courtyard,'mochi-sugar-lower','ゆめ砂糖の架け橋・下層','sky'),variant(bridge,'mochi-sugar-upper','ゆめ砂糖の架け橋・上層','sky',{height:4.5})),branch(variant(fork,'mochi-dream-fork','夢喰の分かれ道','eclipse'),variant(altar,'mochi-dream','夢喰の寝床','eclipse'),variant(prison,'mochi-deepdream','夢喰の深い眠り','eclipse'))],
 [single(variant(cross,'mochi-town','しずかな夢見の街','clock'),'夢見の街 · 黒い霧と丸い広場'),branch(variant(fork,'mochi-bell-fork','黒鈴の分かれ道','clock'),variant(garden,'mochi-bell-garden','ほどけた鈴の庭','clock'),variant(prison,'mochi-bell-cell','黒鈴の封鎖路','eclipse')),floors(variant(courtyard,'mochi-bell-lower','こだまの鐘楼・下層','clock'),variant(roof,'mochi-bell-upper','こだまの鐘楼・上層','clock'))],
 [single(variant(hall,'mochi-palace','うす桃の王宮跡','sanctuary'),'王宮跡 · 壊れた丸い回廊'),floors(variant(courtyard,'mochi-light-lower','最後の灯りの階段・下層','sanctuary'),variant(roof,'mochi-light-upper','最後の灯りの階段・上層','sanctuary')),single(variant(eclipse,'mochi-final','ふぇ〜の約束の広場','eclipse'),'救出戦 · 闇の王の結界を破る')],
 ...['紅灯りの街道','紅霧の水路','黒薔薇の城下','静寂の王城'].map((name,i)=>[
 single(variant([cross,crescent,garden,hall][i],`demon-${i}-entry`,name,'eclipse'), '悪魔の国 · 暴走する悪魔たちを止める'),
 floors(variant(courtyard,`demon-${i}-lower`,'黒石の階段・下層','eclipse'),variant(roof,`demon-${i}-upper`,'黒石の回廊・上層','eclipse')),
 i===2?branch(variant(fork,'demon-fork','黒薔薇の分岐','eclipse'),variant(altar,'demon-safe','黒翼の見張り台','eclipse'),variant(prison,'demon-elite','黒翼の深淵塔','eclipse')):single(variant(eclipse,`demon-${i}-arena`,['真紅の城門','夢魔の眠り庭','黒翼の見張り台','おかえりの王座'][i],'eclipse'),'鎮静の戦い · 追尾が止まる瞬間を見て回避')
 ]),
 ...['青晶の入り江','オーロラの峡谷','七彩の分かれ道','虹還りの道'].map((name,i)=>[single(variant([petal,crescent,garden,cross][i],`prism-${i}-entry`,name,'sky'),'青晶の道 · 光の予告を見て回避'),floors(variant(courtyard,`prism-${i}-lower`,'結晶段・下層','sky'),variant(roof,`prism-${i}-upper`,'結晶段・上層','sky')),single(variant(eclipse,`prism-${i}-arena`,['虹欠片の広場','氷鏡の湖畔','空割れの尖塔','プリズムの心臓'][i],'sky'),'結晶の試練 · 第4章と同じ強さ')]),
].map((act,index)=>index>=16?act.map((field,district)=>({...field,rooms:field.rooms.map(room=>({...room,prism:true,district}))})):index>=12?act.map((field,district)=>({...field,rooms:field.rooms.map(room=>({...room,demon:['demon-gate','demon-canal','demon-town','demon-palace'][index-12],district}))})):index>=8?act.map((field,district)=>({...field,rooms:field.rooms.map(room=>({...room,mochi:['mochi-village','mochi-teagarden','mochi-dreamtown','mochi-palace'][index-8],district}))})):index<4?act:act.map((field,district)=>({...field,rooms:field.rooms.map(room=>({...room,country:['village','valley','town','fortress'][index-4],district,surface:index===4&&district===1?'wood':'stone'}))}))));
export const FIELD_LAYOUTS=Object.freeze(BASE_FIELD_LAYOUTS.map((fields,act)=>fields.map((field,area)=>({...field,rooms:field.rooms.map((room,index)=>chapterRoom(room,Math.floor(act/4),act%4,area,field.kind,index))}))));
export const ROUTE_REWARD=Object.freeze({starBud:10,moonDew:2,wardenCore:1});
export const ROUTE_PORTALS=Object.freeze([{id:'safe',x:-12,z:-13,radius:1.8,label:'通常ルート',color:0x9eead6},{id:'elite',x:12,z:-13,radius:1.8,label:'強ボスルート',color:0xff8b99}]);
const BASE_EXTRA_FIELD_LAYOUTS=Object.freeze([
 [single(variant(petal,'extra-moon-meadow','深月の草原'),'最高難度 · 六種の魔物が最初から出現'),floors(variant(courtyard,'extra-moon-lower','星影の回廊・下層'),variant(roof,'extra-moon-upper','星影の上層回廊')),single(variant(eclipse,'extra-moon-altar','月蝕の深淵壇'),'最終決戦 · 最初から月蝕深化')],
 [single(variant(garden,'extra-rice-road','黄金の修羅道','meadow',{country:'village',district:0,surface:'stone'}),'最高難度 · 連射と時間差攻撃'),floors(variant(courtyard,'extra-rice-lower','穂鐘の試練塔・下層','clock',{country:'town',district:1,surface:'stone'}),variant(roof,'extra-rice-upper','穂鐘の試練塔・上層','clock',{country:'town',district:1,surface:'stone'})),single(variant(eclipse,'extra-rice-arena','穂守りの極陣','eclipse',{country:'fortress',district:2,surface:'stone'}),'最終決戦 · 最初から巨神の猛攻')],
 [single(variant(garden,'extra-mochi-street','夢蝕のもち街道','clock',{mochi:'mochi-dreamtown',district:0}),'全EX最難関 · 七種の魔物の総攻撃'),floors(variant(courtyard,'extra-mochi-lower','黒糖の螺旋回廊・下層','sky',{mochi:'mochi-teagarden',district:1}),variant(roof,'extra-mochi-upper','黒糖の螺旋回廊・上層','sky',{mochi:'mochi-teagarden',district:1})),single(variant(eclipse,'extra-mochi-throne','夢蝕の王座','eclipse',{mochi:'mochi-palace',district:2}),'最終決戦 · HP半分で夢蝕覚醒')],
]);
export const EXTRA_FIELD_LAYOUTS=Object.freeze(BASE_EXTRA_FIELD_LAYOUTS.map((fields,chapter)=>fields.map((field,area)=>({...field,rooms:field.rooms.map((room,index)=>chapterRoom(room,chapter,3,area,field.kind,index))}))));
// The solo trial uses three separate, single-floor arenas. No story/EX room is changed.
export const RICE_FIELD_LAYOUTS=Object.freeze([garden,hall,eclipse].map((room,area)=>single(chapterRoom(variant(room,`rice-awakening-${area}`,['ユーダの修行場','静かな用水の庭','誓いの穂守り壇'][area],'meadow',{country:['village','valley','fortress'][area],district:area,surface:'stone'}),1,0,area,'single',0),'オムソロ単独 · ライスの力の覚醒試練')));
export const fieldFor=(act,area)=>act===RICE_QUEST_ID?(RICE_FIELD_LAYOUTS[area]??RICE_FIELD_LAYOUTS[0]):FIELD_LAYOUTS[act]?.[area]??EXTRA_FIELD_LAYOUTS[act-FIELD_LAYOUTS.length]?.[area]??FIELD_LAYOUTS[0][0];
export function layoutFor(act,area,wave,route='safe'){
 const f=fieldFor(act,area);return f.rooms[f.kind==='floors'?(wave%2===0?1:0):f.kind==='branch'&&wave%2===0?(route==='elite'?2:1):0];
}
const combatLayouts=new Map();
export function walkingLayout(layout,stairsOpen=false){if(!layout.combatPoints||stairsOpen)return layout;if(!combatLayouts.has(layout.id))combatLayouts.set(layout.id,{...layout,id:layout.id+'-combat',points:layout.combatPoints});return combatLayouts.get(layout.id);}
export function heightAt(layout,x,z){return layout.stairs&&Math.abs(x)<=3.65&&z<-7?Math.min(4.5,(-z-7)/9*4.5):layout.height;}
function edgeDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return {x:a[0]+dx*t,z:a[1]+dz*t,d:Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)};}
export function contains(layout,x,z,margin=0){
 const p=layout.points;let inside=false,min=Infinity;
 for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if(((a[1]>z)!==(b[1]>z))&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;if(margin)min=Math.min(min,edgeDistance(x,z,a,b).d);}
 return inside&&min>=margin-1e-8;
}
export function projectInside(layout,x,z,margin=.65){
 if(contains(layout,x,z,margin))return {x,z};let best=null,bestD=Infinity;const p=layout.points;
 for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],near=edgeDistance(x,z,a,b),len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  for(const sign of [-1,1]){const q={x:near.x+(b[1]-a[1])/len*(margin+.02)*sign,z:near.z-(b[0]-a[0])/len*(margin+.02)*sign};if(contains(layout,q.x,q.z,margin)){const d=Math.hypot(q.x-x,q.z-z);if(d<bestD){best=q;bestD=d;}}}
 }
 if(best)return best;
 // Concave vertices can reject both offset candidates; use a guaranteed interior grid point.
 for(const n of navGrid(layout).nodes){const d=Math.hypot(n.x-x,n.z-z);if(d<bestD&&contains(layout,n.x,n.z,margin)){best=n;bestD=d;}}
 return best?{x:best.x,z:best.z}:{...layout.entrance};
}
export function moveWithin(layout,from,x,z,margin=.65){
 let p=contains(layout,from.x,from.z,margin)?{x:from.x,z:from.z}:projectInside(layout,from.x,from.z,margin);
 const dx=x-from.x,dz=z-from.z,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.3));
 for(let i=0;i<steps;i++){const nx=p.x+dx/steps,nz=p.z+dz/steps;if(contains(layout,nx,nz,margin)){p.x=nx;p.z=nz;}else if(contains(layout,nx,p.z,margin))p.x=nx;else if(contains(layout,p.x,nz,margin))p.z=nz;}
 return p;
}
export function clearPath(layout,a,b,margin=.65){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.7));for(let i=0;i<=n;i++)if(!contains(layout,a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,margin))return false;return true;}
const grids=new Map();
export function navGrid(layout){
 if(grids.has(layout.id))return grids.get(layout.id);const nodes=[],byKey=new Map(),step=2;
 const xs=layout.points.map(p=>p[0]),zs=layout.points.map(p=>p[1]);
 for(let z=Math.floor(Math.min(...zs)/step)*step;z<=Math.max(...zs);z+=step)for(let x=Math.floor(Math.min(...xs)/step)*step;x<=Math.max(...xs);x+=step)if(contains(layout,x,z,.8)){const n={x,z,index:nodes.length,neighbors:[]};nodes.push(n);byKey.set(`${x},${z}`,n);}
 for(const n of nodes)for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,2],[2,-2],[-2,-2]]){const next=byKey.get(`${n.x+dx},${n.z+dz}`);if(next&&clearPath(layout,n,next,.7))n.neighbors.push(next.index);}
 const grid={nodes};grids.set(layout.id,grid);return grid;
}
export function navigation(layout,from,to){
 if(clearPath(layout,from,to))return {x:to.x-from.x,z:to.z-from.z};
 const nodes=navGrid(layout).nodes;let start=-1,end=-1,sd=Infinity,ed=Infinity;
 for(const n of nodes){const d=Math.hypot(n.x-from.x,n.z-from.z),e=Math.hypot(n.x-to.x,n.z-to.z);if(d<sd){start=n.index;sd=d;}if(e<ed){end=n.index;ed=e;}}
 if(start<0||end<0)return {x:0,z:0};const queue=[end],prev=new Int32Array(nodes.length).fill(-1);prev[end]=end;
 for(let q=0;q<queue.length&&prev[start]<0;q++)for(const id of nodes[queue[q]].neighbors)if(prev[id]<0){prev[id]=queue[q];queue.push(id);}
 if(prev[start]<0)return {x:0,z:0};let next=nodes[prev[start]];
 // Do not aim through a corner simply because a grid point is close across a gap.
 if(!clearPath(layout,from,next,.65))next=nodes[start];
 return {x:next.x-from.x,z:next.z-from.z};
}
export function spawnPoint(layout,p,angle){
 const initial=projectInside(layout,p.x+Math.sin(angle)*13,p.z+Math.cos(angle)*13,.9);if(Math.hypot(initial.x-p.x,initial.z-p.z)>=7)return initial;
 const candidates=navGrid(layout).nodes.filter(n=>Math.hypot(n.x-p.x,n.z-p.z)>=8&&Math.hypot(n.x-p.x,n.z-p.z)<=16);if(candidates.length)return candidates[Math.floor((angle/(Math.PI*2)%1)*candidates.length)];
 return navGrid(layout).nodes.reduce((a,b)=>Math.hypot(b.x-p.x,b.z-p.z)>Math.hypot(a.x-p.x,a.z-p.z)?b:a,initial);
}
