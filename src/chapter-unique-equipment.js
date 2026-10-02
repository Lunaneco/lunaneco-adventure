// Chapter six/seven trial rewards use the existing common unique-equipment slot.
export const CHAPTER_UNIQUE_EQUIPMENT=Object.freeze([
  {
    "id": "heh-fullness-knot",
    "name": "まんぷくの守り結び",
    "act": 24,
    "area": 2,
    "icon": "heart",
    "color": "#e6c397",
    "image": "assets/equipment/heh-fullness-knot-v1.png",
    "bonus": {
      "hp": 120,
      "defense": 20
    },
    "note": "分け合ったおむすびのぬくもりを結んだ、へへへランドの守り札。 最大HP +120／防御力 +20。"
  },
  {
    "id": "heh-sakura-aim",
    "name": "桜追いの弓飾り",
    "act": 25,
    "area": 2,
    "icon": "spark",
    "color": "#ffafd1",
    "image": "assets/equipment/heh-sakura-aim-v1.png",
    "bonus": {
      "attack": 0.28,
      "defense": 20
    },
    "note": "桜の魔法矢の軌跡を閉じ込めた、小さな弓の飾り。 攻撃力 +28%／防御力 +20。"
  },
  {
    "id": "heh-golden-glasses",
    "name": "黄金へへへの眼鏡飾り",
    "act": 26,
    "area": 2,
    "icon": "star",
    "color": "#f2d277",
    "image": "assets/equipment/heh-golden-glasses-v1.png",
    "bonus": {
      "hp": 110,
      "attack": 0.26,
      "defense": 24
    },
    "note": "黄金のへへへの眼鏡をかたどった、幸運の金色ブローチ。 最大HP +110／攻撃力 +26%／防御力 +24。"
  },
  {
    "id": "heh-bond-emblem",
    "name": "共闘の桜心弓章",
    "act": 27,
    "area": 2,
    "icon": "link",
    "color": "#ffc5db",
    "image": "assets/equipment/heh-bond-emblem-v1.png",
    "bonus": {
      "hp": 140,
      "attack": 0.3,
      "defense": 30
    },
    "note": "顔のおむすびと花弓でつないだ、二人の共闘の証。 最大HP +140／攻撃力 +30%／防御力 +30。"
  },
  {
    "id": "lumi-home-light-ring",
    "name": "帰り灯の晶環",
    "act": 28,
    "area": 2,
    "icon": "spark",
    "color": "#a3edff",
    "image": "assets/equipment/lumi-home-light-ring-v1.png",
    "bonus": {
      "hp": 130,
      "defense": 26
    },
    "note": "荒らされたケモみみの村へ、帰り道を照らす青い晶環。 最大HP +130／防御力 +26。"
  },
  {
    "id": "lumi-heart-cat-bell",
    "name": "ときめきのねこ鈴",
    "act": 29,
    "area": 2,
    "icon": "heart",
    "color": "#f5b8d5",
    "image": "assets/equipment/lumi-heart-cat-bell-v1.png",
    "bonus": {
      "hp": 120,
      "attack": 0.28,
      "defense": 24
    },
    "note": "もちにゃふぇにときめいて生まれた、小さな猫耳の鈴。 最大HP +120／攻撃力 +28%／防御力 +24。"
  },
  {
    "id": "lumi-village-guard-ring",
    "name": "村守りの護指環",
    "act": 30,
    "area": 2,
    "icon": "shield",
    "color": "#c5b5ff",
    "image": "assets/equipment/lumi-village-guard-ring-v1.png",
    "bonus": {
      "hp": 150,
      "defense": 32
    },
    "note": "誰の帰る場所も奪わせないと誓った、紫の護りの指環。 最大HP +150／防御力 +32。"
  },
  {
    "id": "lumi-infinite-bond-ring",
    "name": "無限光の絆環",
    "act": 31,
    "area": 2,
    "icon": "link",
    "color": "#efc5f8",
    "image": "assets/equipment/lumi-infinite-bond-ring-v1.png",
    "bonus": {
      "hp": 150,
      "attack": 0.32,
      "defense": 32
    },
    "note": "もちにゃふぇとねこるみの光が、どこまでも届く絆の指環。 最大HP +150／攻撃力 +32%／防御力 +32。"
  }
].map(item=>Object.freeze({...item,bonus:Object.freeze(item.bonus)})));
export const chapterUniqueReward=act=>CHAPTER_UNIQUE_EQUIPMENT.find(item=>item.act===act);
