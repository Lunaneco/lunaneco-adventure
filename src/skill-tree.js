// Prerequisites are shared by save validation, the tree and blessing availability.
export const SKILL_TALENT_NODES=Object.freeze([
  {id:'blessing1',kind:'skill',tier:3,branch:'スキル解放',level:5,parents:['origin'],cost:{starBud:30,moonDew:3},bonus:{},x:50,y:16},
  {id:'blessing2',kind:'skill',tier:3,branch:'スキル解放',level:15,parents:['blessing1'],cost:{starBud:80,moonDew:8,wardenCore:2},bonus:{},x:50,y:46},
  {id:'blessing3',kind:'skill',tier:3,branch:'スキル解放',level:35,parents:['blessing2'],cost:{starBud:180,moonPrism:12,astralCore:4},bonus:{},x:50,y:76},
]);
