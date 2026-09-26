// Combat data is shared by the simulation, readable HUD hints and the renderer.
import {DEMON_ENEMIES,DEMON_BOSSES} from './chapter-four-enemies.js';
import {MOCHI_ENEMIES,MOCHI_BOSSES} from './chapter-three-enemies.js';
import {actFor} from './acts.js';
import {GOLDEN_SLIME} from './golden-slime.js';
export const ELITE_BOSS_MULTIPLIER=2;
export const ELITE_BOSS_LABEL=`HP×${ELITE_BOSS_MULTIPLIER}・攻撃威力×${ELITE_BOSS_MULTIPLIER}`;
export const ENEMY_TYPES=Object.freeze({...DEMON_ENEMIES,...MOCHI_ENEMIES,goldenSlime:GOLDEN_SLIME,
  moss:{name:'草の魔物',hp:29,speed:1.4,damage:9,radius:.64,role:'近接',hint:'近づいて体当たりする。距離を取ろう。',xp:3,crystals:1,buds:1},
  bat:{name:'月影コウモリ',hp:23,speed:2.35,damage:7,radius:.52,role:'飛行',hint:'素早く接近する。囲まれる前に倒そう。',xp:4,crystals:1,buds:1},
  golem:{name:'遺跡ゴーレム',hp:85,speed:.88,damage:17,radius:.95,role:'重装',hint:'頑丈だが足が遅い。周り込みながら攻撃しよう。',xp:9,crystals:3,buds:2},
  archer:{name:'影森の弓兵',hp:32,speed:1.55,damage:7,radius:.58,role:'遠距離',hint:'橙の照準線のあとに矢を放つ。横へ動いてかわそう。',xp:5,crystals:2,buds:1},
  mage:{name:'月蝕の魔導士',hp:38,speed:1.15,damage:6,radius:.62,role:'魔法',hint:'紫の魔法陣から離れよう。詠唱中に倒すと魔法を止められる。',xp:6,crystals:2,buds:2},
  charger:{name:'棘甲の突撃獣',hp:56,speed:1.55,damage:11,radius:.78,role:'突進',hint:'橙の帯が突進の予告。横へ回避すると隙ができる。',xp:7,crystals:2,buds:2},
  reaper:{name:'刈影の案山子',hp:110,speed:1.9,damage:28,radius:.78,role:'鎌の近接',chapter:1,barHeight:2.8,hint:'赤い短い帯へ鎌を振る。振りかぶったら横か背後へ回り込もう。',xp:12,crystals:2,buds:3},
  matchlock:{name:'煤火の火縄兵',hp:100,speed:1.45,damage:24,radius:.7,role:'三連射',chapter:1,ranged:true,barHeight:2.5,hint:'橙の照準を固定して三連射。最初の一発を避けた後も横へ動き続けよう。',xp:14,crystals:2,buds:3},
  stormlantern:{name:'雷綴りの灯籠',hp:120,speed:1.25,damage:22,radius:.65,role:'時間差の雷',chapter:1,ranged:true,flying:true,barHeight:2.8,hint:'三つの雷印が時間差で落ちる。消えた印へ戻ると、次の雷を避けやすい。',xp:16,crystals:2,buds:3},
  pestmoth:{name:'翡翠の毒蛾',hp:86,speed:2.4,damage:23,radius:.66,role:'鱗粉の扇弾',chapter:1,ranged:true,flying:true,barHeight:2.2,hint:'緑の扇形に鱗粉弾を放つ。弾の隙間を抜けるか、背後へ回り込もう。',xp:13,crystals:2,buds:3},
  ironcrab:{name:'米蔵の鎧蟹',hp:225,speed:1.05,damage:39,radius:1.1,role:'鋏の挟撃',chapter:1,barHeight:2.3,hint:'二本の青い帯で挟み撃ち。帯の間が安全地帯。頑丈なので必殺技も使おう。',xp:22,crystals:3,buds:4},
  ramcart:{name:'破門の突槌車',hp:158,speed:1.55,damage:36,radius:1.05,role:'高速突進',chapter:1,barHeight:2.5,hint:'赤い長い帯の後に高速突進。帯を横切って避け、止まった後に反撃しよう。',xp:18,crystals:3,buds:4},
});
export const CHAPTER_ONE_ENEMIES=Object.freeze(['moss','bat','golem','archer','mage','charger']);
export const CHAPTER_TWO_ENEMIES=Object.freeze(['reaper','matchlock','stormlantern','pestmoth','ironcrab','ramcart']);
export const CHAPTER_THREE_ENEMIES=Object.freeze(Object.keys(MOCHI_ENEMIES));
export const CHAPTER_FOUR_ENEMIES=Object.freeze(Object.keys(DEMON_ENEMIES));
export const enemyRosterForAct=act=>actFor(act)?.chapter===3?CHAPTER_FOUR_ENEMIES:actFor(act)?.chapter===2?CHAPTER_THREE_ENEMIES:actFor(act)?.chapter===1?CHAPTER_TWO_ENEMIES:CHAPTER_ONE_ENEMIES;
export const isRangedEnemy=type=>ENEMY_TYPES[type]?.ranged===true||['archer','mage'].includes(type);
export const BOSSES=Object.freeze({...DEMON_BOSSES,...MOCHI_BOSSES,
  thornmaw:{name:'茨牙の獣王',subtitle:'THE THORNMAW KING',role:'茨をまとう巨獣',color:0xffac69,speed:1.35,radius:2.1,attacks:["追い込む茨爪","三段の獣吼","獣王の跳撃"],hint:'左右の茨爪が中央へ迫り、最後に噛み砕く。咆哮は内から外へ三段階。突進先の爆発と、その外側の衝撃までかわして反撃。'},
  basalt:{name:'岩鎧の大蛇',subtitle:'THE JADE COIL',role:'翡翠の岩蛇',color:0x9ff4b6,speed:1.1,radius:2.1,attacks:["蛇行する地割れ","脱皮の岩礫","蛇尾の連続薙ぎ"],hint:'蛇のように曲がる地割れを横へ抜けよう。岩礫は角度を変えて連射。尾は扇状に順番になぎ払うので、消えた帯へ切り返そう。'},
  ironbell:{name:'鉄鐘の門衛',subtitle:'THE IRON BELL KEEPER',role:'鐘楼の鉄騎士',color:0xd7acff,speed:.8,radius:2,attacks:["開門の交差鐘","波紋の三重奏","落鐘の断罪"],hint:'十字と斜めの鐘撃を交互に回避。輪の波紋には安全な中央がある。足元への落鐘の後、十字の亀裂が走るので斜めへ逃げよう。'},
  colossus:{name:'蹂躙の巨神・ヴォルガント',subtitle:'VOLGANT · THE STARBREAKER',role:'砦を砕く巨神',color:0xff876e,speed:.95,radius:2.65,attacks:["蹂躙する巨歩","砦を砕く流星群","双腕・地殻崩し"],hint:'Lv.30を目安に準備し、180秒以内に救出。足踏みから輪状の余震、流星と星弾の同時攻撃。左右の亀裂の後は中央が砕ける。'},
  treant:{name:'封印の番人',subtitle:'THE ROOTBOUND SENTINEL',role:'古樹の巨人',color:0xf4b56e,speed:1,radius:1.9,attacks:["這い根の分岐","芽吹きの連弾","根走りの挟撃"],hint:'足元から左右へ根が連鎖。横へ逃げ続けず根の列を縦に抜けよう。種弾は二連射、突進後には左右の根が追撃。HP半分で連撃が増加。'},
  chronarch:{name:'時守の残響',subtitle:'THE ASTRAL CHRONARCH',role:'浮遊する星時計',color:0xffd079,speed:.9,radius:1.7,attacks:["終刻の文字盤","回転する時針","巻き戻しの連射"],hint:'刻印が時計回りに破裂し、最後に中央を攻撃。十字の針は三段階に回転。先に消えた線へ移り、連射が止まってから反撃。'},
  tempest:{name:'雲海の番人',subtitle:'THE CLOUDSEA WYVERN',role:'雲海の翼竜',color:0xff9c7e,speed:1.3,radius:1.85,attacks:["薙ぎ渡る風壁","旋回する星羽","急降下の風圧"],hint:'風の帯が横から順に通過。消えた帯へ切り返そう。星羽は切れ目が動く連続弾幕。急降下の後は着地点を囲む風圧に注意。'},
  eclipse:{name:'月蝕の守護者',subtitle:'THE ECLIPSE WARDEN',role:'月を抱く石の守り手',color:0xff749d,speed:1.1,radius:1.9,attacks:["満ち欠けの月蝕","螺旋の欠け月","月影の残響"],hint:'輪の中央へ入り、続く中央爆発では外へ。星弾は切れ目が動く連射。突進した跡にも月影が連鎖する。HP半分で三連撃へ。'},
});
export const BOSS_IDS=Object.freeze(['treant','chronarch','tempest','eclipse','thornmaw','basalt','ironbell','colossus',...Object.keys(MOCHI_BOSSES),...Object.keys(DEMON_BOSSES)]);
export function enemyForSpawn(act,wave,index,roll){
  if(wave===6)return 'boss';
  if(actFor(act)?.extra){const roster=enemyRosterForAct(act);return roster[index<roster.length?index:Math.min(roster.length-1,Math.floor(roll*roster.length))];}
  if(actFor(act)?.chapter===3){const roster=CHAPTER_FOUR_ENEMIES;return roster[index<roster.length?index:Math.min(roster.length-1,Math.floor(roll*roster.length))];}
  if(actFor(act)?.chapter===2){const available=CHAPTER_THREE_ENEMIES.slice(0,Math.min(7,3+wave));return available[index<available.length?index:Math.min(available.length-1,Math.floor(roll*available.length))];}
  if(act>=4){
    // Every second-chapter wave uses only the new roster, including the opening.
    const introductions=['reaper','matchlock','stormlantern','ironcrab','ramcart'];
    if(index===0)return introductions[Math.min(4,wave-1)];
    if(index===1)return wave===1?'matchlock':'pestmoth';
    const weights=[.27,.19,.16,.18,wave>=3?.13:.07,wave>=2?.13:0];
    let value=roll*weights.reduce((a,b)=>a+b,0);
    for(let i=0;i<weights.length;i++){value-=weights[i];if(value<0)return CHAPTER_TWO_ENEMIES[i];}
    return 'reaper';
  }
  if(act===0&&wave===1)return 'moss';
  // Guarantee the introduction before adding each type to the mixed encounters.
  if(index===0){if(wave===2)return 'archer';if(wave===3)return 'mage';if(wave===4)return 'charger';}
  const available=[['moss',.3],['bat',.23],...(wave>=3?[['golem',.17]]:[]),['archer',.13],...(wave>=3||act>0?[['mage',.1]]:[]),...(wave>=4||act>1?[['charger',.1]]:[])];
  let value=roll*available.reduce((sum,[,weight])=>sum+weight,0);
  for(const [id,weight] of available){value-=weight;if(value<0)return id;}return 'moss';
}
export function distanceToHazard(x,z,h){
  if(h.shape==='ring'){const r=Math.hypot(x-h.x,z-h.z);return Math.max(h.innerRadius-r,r-h.radius);}
  if(h.shape!=='line')return Math.hypot(x-h.x,z-h.z)-h.radius;
  const dx=x-h.x,dz=z-h.z,along=dx*Math.sin(h.angle)+dz*Math.cos(h.angle),across=dx*Math.cos(h.angle)-dz*Math.sin(h.angle);
  const a=Math.abs(along)-h.length/2,b=Math.abs(across)-h.width/2;
  return Math.hypot(Math.max(0,a),Math.max(0,b))+Math.min(0,Math.max(a,b));
}
