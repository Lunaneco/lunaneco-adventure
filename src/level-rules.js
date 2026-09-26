export const LEVEL_RULES=Object.freeze({initialCap:20,capStep:10,maxLevel:80,hpPerLevel:6,attackPerLevel:.045,defensePerLevel:1});
// Lv.30 must be reachable with chapter-one materials before the recommended Lv.30 second chapter.
export const LEVEL_AWAKENING_COSTS=Object.freeze([
  Object.freeze({limitStone:1,starBud:60,moonDew:12,wardenCore:3}),
  Object.freeze({limitStone:2,starBud:180,moonPrism:20,astralCore:6}),
  Object.freeze({limitStone:4,starBud:420,moonPrism:60,astralCore:18}),
  Object.freeze({limitStone:5,starBud:650,moonPrism:60,bloodCrystal:12,demonHeart:4}),
  Object.freeze({limitStone:6,starBud:900,moonPrism:90,bloodCrystal:24,demonHeart:8}),
  Object.freeze({limitStone:8,starBud:1200,bloodCrystal:60,demonHeart:20}),
]);
