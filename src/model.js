import {createNyanAwakening,canAwakenNyan,startNyanAwakening,finishNyanAwakening,tickNyanAwakening,awakenedNyanUltimate,fireAwakenedNyan,hasNyanAwakening} from './nyanluna-awakening.js';
import {hasNekoLumi,lumiUltimate,fireLumiRail} from './lumi-combat.js';
import {canPredate,startPredation,finishPredation,predationUltimate,predationKill} from './hehereal-predation.js';
import {advanceFloors,tickFloors,floorMovementScale} from './special-floors.js';
import {PRIM_BOND,PRIM_MOUNT,PRIM_DUET,hasPrimBond,canPrimDuet,canMount,startMount,endMount,tickMount} from './prim-combat.js';
import {SHIZUKU_BOND,hasShizukuBond,canShizukuDuet,SHIZUKU_DUET,drainShizuku} from './shizuku-combat.js';
import {GOLDEN_HEHE,goldenHeheWave} from './chapter-six-enemies.js';
import {GOLDEN_SLIME,goldenSlimeWave,guaranteedExtraRareWave} from './golden-slime.js';
import {MOCHI_SUPPORT,mochiCryHit,mochiFrozen,mochiIncomingDamage,mochiDefenseMultiplier} from './mochi-combat.js';
import {fieldFor,layoutFor,walkingLayout,heightAt,contains,projectInside,moveWithin,navigation,clearPath,spawnPoint,ROUTE_PORTALS,ROUTE_REWARD} from './terrain.js';
import {ENEMY_TYPES,BOSSES,ELITE_BOSS_MULTIPLIER,enemyForSpawn,distanceToHazard,isRangedEnemy} from './enemies.js';
import {tickEnemyBehavior} from './enemy-combat.js';
import {actFor,isActUnlocked,completeAct,clearTicketReward} from './acts.js';
import {extraCombatFor} from './extra-stages.js';
import {hasRicePower} from './rice-awakening.js';
import {canUseRice,grabRice,moveRice,releaseRice,cancelRice,tickRice} from './rice-combat.js';
import {castUltimate,tickUltimates,enemySpeedScale} from './ultimate-combat.js';
import {ultimateFor} from './abilities.js';
import {bossWeaponTicket,grantWeaponTickets,weaponAttackProfile,equippedWeapon} from './weapons.js';
import {advanceMissions,claimActMissions,missionsFor,trialStatus} from './missions.js';
import {skillsForParty,skillEffectRank} from './blessings.js';
import {partyForAct} from './party.js';
import {availableHeroes,isHeroUnlocked} from './recruitment.js';
import {FirstBattleTutorial} from './tutorial.js';
import {normalizeProgression,characterProgress,combatStats,awardCharacterXp,grantMaterials,grantLimitStone,ENEMY_REWARDS} from './progression.js';
import {MATERIALS,enemyMaterials,gateMaterials,ultimateBonuses} from './talents.js';
export const ARENA_RADIUS = 18.5;
export const ATTACK_DURATION = .35;
export const MELEE_MIN_DOT = -.15;
export const STAGE_EXIT = Object.freeze({x:0,z:-16.6,radius:1.7});
export const HEROES = [

  { id: 'nyanluna', name: 'にゃんるな', title: '月光の魔法使い', color: '#d9baff', moveSpeed:5.6, dashSpeed:24, range:12, damage:20, baseHp:180, baseDefense:8, interval:.55, skillPower:1.5, chargeRate:1.5, role:'スキル特化', trait:'月光共鳴', traitText:'スキルダメージ +50%／必殺ゲージ獲得 +50%'  },
  { id: 'tsukineko', name: 'つきねこ', title: '星影の銃使い', color: '#82e5ff', moveSpeed:5.6, dashSpeed:24, range:11, damage:26, baseHp:210, baseDefense:14, interval:.46, skillPower:1, chargeRate:1, role:'基礎能力特化', trait:'星影の鍛錬', traitText:'高いHP・攻撃力・防御力と、速い通常射撃'  },
  {id:'omsolo',name:'オムソロ',title:'翠光の剣士',color:'#aaffba',moveSpeed:11.2,dashSpeed:48,range:3.2,damage:42,baseHp:250,baseDefense:21,interval:.60,skillPower:1.1,chargeRate:1.2,role:'近接・守護',trait:'守り手の剣',traitText:'通常移動速度・回避距離2倍／扇状の近接攻撃／高いHPと防御力／必殺ゲージ獲得 +20%。必殺技で周囲を斬り払い、自分を守る'},
  {id:'mochinyafe',name:'もちにゃふぇ',title:'最後のもちもち守り手',color:'#ffb8d4',moveSpeed:4.2,dashSpeed:20,range:6,damage:5,baseHp:75,baseDefense:1,interval:1.4,skillPower:1,chargeRate:1.3,role:'援護特化・大器晩成',trait:'小さな声の大きな奇跡',traitText:'操作中は弱い追尾音弾で攻撃。援護のふぇ〜で雑魚を1.8秒停止／ボスの攻撃・防御を5秒間30%低下。初期能力は最弱、Lv.50では全員を超える基礎能力。ツリーのHP・防御成長3倍、攻撃成長2.5倍'},
  {id:'shizuku',name:'雫',title:'紅月の鎌使い',color:'#e5a0ba',moveSpeed:7,dashSpeed:30,range:3.9,damage:39,baseHp:230,baseDefense:16,interval:.64,skillPower:1.15,chargeRate:1.15,role:'近接・HP吸収',trait:'不器用な守り手',traitText:'鎌で与えた実ダメージの10%を自分のHPへ吸収。にゃんるなと編成すると二人のHP・攻撃+12%、必殺ゲージ獲得+20%。二人のゲージ100で特殊連携技。'},
  {id:'prim',name:'プリム',title:'七彩の小竜',color:'#bceaff',moveSpeed:6.2,dashSpeed:26,range:3.5,damage:41,baseHp:265,baseDefense:20,interval:.62,skillPower:1.15,chargeRate:1.15,role:'爪・直線ブレス・搭乗',trait:'キュ〜の約束',traitText:'爪で近接攻撃。必殺技は一直線のプリズムブレス。つきねこと組むとHP・攻撃+12%、ゲージ+20%。搭乗中12秒は二人がメインで攻撃・個別に被弾し、オムソロと同じ速さで移動。終了後20秒待機。'},
  {id:'hehereal',name:'へへりある',title:'桜心の花弓使い',color:'#ff9dc9',moveSpeed:5.6,dashSpeed:24,range:15,damage:28,baseHp:190,baseDefense:10,interval:.65,skillPower:1.1,chargeRate:1.2,role:'遠距離・追尾弓',trait:'おむすびの約束',traitText:'桜の魔法矢で遠くの敵を追尾。必殺技は追尾矢9連射。第6章ではオムソロの援護として共闘。二人編成時は捕食でオムソロを取り込み、へへへに変身。攻撃力・弓・HP・防御は自分のものを維持。必殺技は捕食の舞に変わり、発動中の撃破で攻撃力が上がる。戦闘終了まで解除不可。'},
  {id:'lumi',name:'るみ',title:'指先の光をつなぐ少女',color:'#b8c9ff',moveSpeed:5.6,dashSpeed:24,range:14,damage:30,baseHp:185,baseDefense:9,interval:.72,skillPower:1.1,chargeRate:1.15,role:'直線貫通・レールガン',trait:'ねこみみに、ときめいて',traitText:'指先から色の違う光を放つ。通常は武器ごとの有限射程。もちにゃふぇと編成するとねこみみが生えてねこるみに変わり、通常攻撃・援護・必殺技の射程が無限になる。第7章クリア後に仲間になる。'},
];
export {SKILLS} from './blessings.js';
export const AREAS = [
  { name:'星詠みの草原', sub:'THE STARLIT MEADOW', color:0x5d9871 },
  { name:'月影の遺跡', sub:'RUINS OF THE CRESCENT', color:0x69899e },
  { name:'暁の聖域', sub:'SANCTUARY OF DAWN', color:0x98819d },
];
export function seededRandom(seed) { let a=seed>>>0; return () => { a+=0x6D2B79F5; let t=a; t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296; }; }
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Adventure {
  constructor({seed=Date.now(),hero=0,difficulty='normal',progression,party,tutorial=false,act=0}={}) {
    this.tutorial=tutorial?new FirstBattleTutorial():null;if(tutorial){hero=0;party=['nyanluna'];act=0;}
    this.nyanAwakening=createNyanAwakening();this.nyanAwakeningNewlyLearned=false;this.predation={active:false,used:false,baseAttack:0,attackBonus:0,danceKills:0};this.progression=normalizeProgression(progression,HEROES);this.guestHeroId=null;this.recruitedHeroId=null;this.act=isActUnlocked(this.progression,act)?act:0;this.actConfig=actFor(this.act);this.pendingTrials=new Set();this.rescue=null;
    this.party=Object.freeze(partyForAct(party,availableHeroes(this.progression,HEROES),this.progression,this.act,HEROES[hero]?.id));this.partyHeroes=this.party.map(id=>HEROES.findIndex(h=>h.id===id));hero=this.partyHeroes.includes(hero)?hero:this.partyHeroes[0];this.skillPool=Object.freeze(skillsForParty(this.party,this.progression));
    this.goldenSlimeKills=0;this.goldenSlimeLastWave=0;this.earnedRareStones=0;this.clearRewardTickets=0;this.earnedWeaponTickets=0;this.earnedMissions=[];this.earnedXp=Object.fromEntries(HEROES.map(h=>[h.id,0]));this.earnedMaterials=Object.fromEntries(Object.keys(MATERIALS).map(id=>[id,0]));
    this.rng=seededRandom(seed);this.lootRng=seededRandom(seed^0x57EA90C1);this.materialRng=seededRandom(seed^0x4D41544C);this.rareRng=seededRandom(seed^0x604D5A1E);this.heheRng=seededRandom(seed^0x27436060);this.goldenHeheWave=goldenHeheWave(this.actConfig,this.heheRng);this.goldenHehe=null;this.goldenHeheKills=0;this.goldenSlime=null;this.goldenSlimeWave=guaranteedExtraRareWave(this.actConfig);this.seed=seed;this.difficulty=this.actConfig.difficulty??(this.actConfig.extra?'hard':difficulty);this.phase='playing';this.events=[];this.ids=1;this.rice={held:null,cooldown:0};this.riceNewlyLearned=false;
    this.heroHealth=Object.fromEntries(HEROES.map(h=>{const maxHp=this.statsFor(HEROES.indexOf(h)).maxHp;return [h.id,{hp:maxHp,maxHp}];}));
    this.player={x:0,z:3,hero,face:Math.PI,invincible:1,dash:0,dashCooldown:0,dx:0,dz:-1,attack:0,charge:0,switchCooldown:0};
    // HP follows the controlled character; switching never copies another character's damage.
    Object.defineProperties(this.player,{
      hp:{enumerable:true,get:()=>this.healthFor(this.player.hero).hp,set:value=>{if(Number.isFinite(value))this.healthFor(this.player.hero).hp=clamp(value,0,this.player.maxHp);}},
      maxHp:{enumerable:true,get:()=>this.healthFor(this.player.hero).maxHp,set:value=>{if(Number.isFinite(value)&&value>0)this.healthFor(this.player.hero).maxHp=value;}},
    });
    this.ultimateCharges=Object.fromEntries(HEROES.map(h=>[h.id,0]));this.ultimateEffects=[];
    Object.defineProperty(this.player,'charge',{enumerable:true,get:()=>this.chargeFor(this.player.hero),set:value=>{this.ultimateCharges[this.heroId(this.player.hero)]=Number.isFinite(value)?clamp(value,0,100):0;}});
    this.floorRooms=new Map();this.mount={active:false,remaining:0,cooldown:0};this.partner={x:-1.7,z:4.5,attack:0,face:Math.PI};this.enemies=[];this.projectiles=[];this.orbs=[];this.hazards=[];
    this.skills={};this.offers=[];this.pendingBlessings=0;this.blessingTier=0;this.stageCrystals=0;this.crystalGoal=8;this.totalCrystals=0;this.blessingsTaken=0;this.time=0;this.kills=0;this.combo=0;this.comboTimer=0;this.maxCombo=0;this.damageDealt=0;
    this.stageTrial={startedAt:0,hits:0};this.runHits=0;this.seenEnemyTypes=new Set();
    this.travelOpen=null;this.travelDelay=0;this.route=null;this.routeRewards=[];this.wave=0;this.spawnTimer=0;this.waveSpawned=0;this.waveGoal=0;this.waveBreak=0;this.orbitTimer=0;this.exitOpen=false;this.exitDelay=0;this.stagesCleared=0;this.refreshStats();this.player.hp=this.player.maxHp;this.startWave();
    this.tutorialStart={player:{...this.player},partner:{...this.partner}};
  }
  get field(){return fieldFor(this.act,this.area);}
  get layout(){return layoutFor(this.act,this.area,this.wave,this.route);}
  get walkLayout(){return walkingLayout(this.layout,this.travelOpen==='stairs');}
  get exitPoint(){return this.layout.exit;}
  get travelTargets(){return this.travelOpen==='stairs'?[{id:'stairs',...this.layout.stairPoint,label:'上のフロアへ',color:0x9cdcff}]:this.travelOpen==='branch'?ROUTE_PORTALS:[];}
  canWalk(x,z){return contains(this.walkLayout,x,z,.85);}
  directionTo(target,source=this.player){const d=navigation(this.walkLayout,source,target),length=Math.hypot(d.x,d.z)||1;return {x:d.x/length,z:d.z/length};}
  steerEnemy(e){
    const layout=this.walkLayout,p=this.player;
    if(clearPath(layout,e,p,.55)){const d=Math.hypot(p.x-e.x,p.z-e.z)||1;return {x:(p.x-e.x)/d,z:(p.z-e.z)/d};}
    if(!e.navGoal||e.navTimer<=0){const d=navigation(layout,e,p);e.navGoal={x:e.x+d.x,z:e.z+d.z};e.navTimer=.35;}
    const d=Math.hypot(e.navGoal.x-e.x,e.navGoal.z-e.z)||1;return {x:(e.navGoal.x-e.x)/d,z:(e.navGoal.z-e.z)/d};
  }
  openPassage(){
    if(this.travelOpen||this.phase!=='playing')return false;
    this.cancelRice();
    this.travelOpen=this.field.kind==='floors'?'stairs':'branch';this.travelDelay=.65;this.travelOrigin={x:this.player.x,z:this.player.z};
    this.projectiles=[];this.hazards=[];this.ultimateEffects=[];this.collectAll();this.emit('passageOpen',{kind:this.travelOpen});return true;
  }
  enterPassage(id){
    const target=this.travelTargets.find(t=>t.id===id);
    if(!target||this.phase!=='playing'||this.travelDelay>0||this.pendingBlessings>0||Math.hypot(this.player.x-target.x,this.player.z-target.z)>target.radius)return false;
    const kind=this.travelOpen;if(kind==='branch')this.route=id;this.travelOpen=null;
    this.projectiles=[];this.hazards=[];this.ultimateEffects=[];this.enemies=[];this.startWave();
    Object.assign(this.player,projectInside(this.walkLayout,this.layout.entrance.x,this.layout.entrance.z),{dash:0,invincible:1.5,moving:false});
    Object.assign(this.partner,projectInside(this.walkLayout,this.player.x-1.7,this.player.z+1.5),{moving:false});
    this.emit('passageEntered',{kind,route:this.route,name:this.layout.name});this.emit('stageEntered',{area:this.area});return true;
  }
  advanceTutorial(){
    if(this.phase!=='playing'||!this.tutorial?.next())return false;
    if(!this.tutorial.active)this.finishTutorial();else this.emit('tutorialStep');return true;
  }
  observeTutorial(action,value){
    if(!this.tutorial?.observe(action,value))return;
    if(this.tutorial.step.id==='attack'){
      let x=this.player.x,z=this.player.z-6;const radius=Math.hypot(x,z);if(radius>16){x*=16/radius;z*=16/radius;}
      const target=this.spawnEnemy('moss',x,z);Object.assign(target,{training:true,speed:0,damage:0,hp:this.statsFor(0).attack*2,maxHp:this.statsFor(0).attack*2});
    }
    this.player.moving=false;this.emit('tutorialStep');
  }
  skipTutorial(){if(this.phase!=='playing'||!this.tutorial?.active)return false;this.finishTutorial();return true;}
  finishTutorial(){
    this.tutorial.active=false;this.progression.tutorial.firstBattleCompleted=true;
    this.enemies=[];this.projectiles=[];this.hazards=[];this.orbs=[];this.rng=seededRandom(this.seed);
    Object.assign(this.player,this.tutorialStart.player);Object.assign(this.partner,this.tutorialStart.partner);
    this.emit('tutorialComplete');this.wave=0;this.startWave();
  }
  heroId(hero){return HEROES[hero].id;}
  chargeFor(hero){return this.ultimateCharges[this.heroId(hero)]??0;}
  ultimateActive(hero){return this.ultimateEffects.some(effect=>effect.heroId===this.heroId(hero)||effect.heroIds?.includes(this.heroId(hero)));}
  get duetReady(){return canShizukuDuet(this)||canPrimDuet(this);}
  get duetKind(){return canPrimDuet(this)?'prim':canShizukuDuet(this)?'shizuku':null;}
  get mountReady(){return canMount(this);}
  get nyanAwakeningReady(){return canAwakenNyan(this);}
  awakenNyan(){return startNyanAwakening(this);}
  get predationReady(){return canPredate(this);}
  predate(){return startPredation(this);}
  mountPrim(){return startMount(this);}
  dismount(){return endMount(this);}
  sourceFor(heroId){return this.heroId(this.player.hero)===heroId?this.player:this.partner;}
  skillDamage(heroId,base){const index=HEROES.findIndex(h=>h.id===heroId);if(index<0)return 0;const hero=HEROES[index];return base*(this.statsFor(index).attack/hero.damage)*(1+this.rank('prismBond')*.15+this.rank('moonDropBond')*.15+this.rank('power')*.25+this.rank('moonGuard')*.18+this.rank('starBlade')*.18)*hero.skillPower*(1+this.rank('arcanePower')*.18)*(heroId==='lumi'?1+this.rank('lumiBrave')*.15:heroId==='hehereal'?1+this.rank('sakuraBrave')*.15:heroId==='prim'?1+this.rank('primBrave')*.15:1);}
  ultimateSpec(hero=this.player.hero){if(hero===0&&this.nyanAwakening.active)return awakenedNyanUltimate(ultimateFor('nyanluna',this.progressFor(0)));if(hero===7)return {...lumiUltimate(this.progressFor(hero),hasNekoLumi(this.party)),range:hasNekoLumi(this.party)?Infinity:lumiUltimate(this.progressFor(hero)).range+this.rank('lumiFar')*2,color:equippedWeapon(this.progression,'lumi')?.weapon.effectColor??0x8feaff};if(hero===6&&this.predation.active)return predationUltimate(this.progressFor(hero));if(canPrimDuet(this))return PRIM_DUET;if(canShizukuDuet(this))return SHIZUKU_DUET;const spec=ultimateFor(this.heroId(hero),this.progressFor(hero));return spec.kind==='homingBarrage'?{...spec,range:spec.range+this.rank('sakuraFar')*2}:spec.kind==='prismBeam'?{...spec,range:spec.range+this.rank('primBeam')*2}:spec;}
  gainUltimateCharge(heroId,amount){if(!this.party.includes(heroId)||!Number.isFinite(amount)||amount<=0)return;const hero=HEROES.find(h=>h.id===heroId),bonus=ultimateBonuses(this.progression.characters[heroId],heroId);this.ultimateCharges[heroId]=clamp(this.ultimateCharges[heroId]+amount*hero.chargeRate*(heroId==='lumi'?1+this.effectRank('lumiFocus')*.2:heroId==='hehereal'?1+this.effectRank('sakuraFocus')*.2:heroId==='prim'?1+this.effectRank('primFocus')*.2:1)*(heroId==='shizuku'?1+this.rank('shizukuPromise')*.15:1)*(hasShizukuBond(this.party)?SHIZUKU_BOND.charge:hasPrimBond(this.party)?PRIM_BOND.charge:1)*(1+this.effectRank('focus')*.3)*(1+bonus.ultimateCharge),0,100);}
  get hasPartner(){return this.party.length===2;}
  get partnerHero(){return this.partyHeroes.find(hero=>hero!==this.player.hero)??null;}
  isHeroAlive(hero){return this.partyHeroes.includes(hero)&&this.healthFor(hero).hp>0;}
  get hasLivingPartner(){return this.hasPartner&&this.isHeroAlive(this.partnerHero);}
  progressFor(hero){return characterProgress(this.progression,HEROES[hero].id);}
  statsFor(hero){const profile=[5,6].includes(this.actConfig?.chapter)&&['hehereal','lumi'].includes(this.guestHeroId)&&HEROES[hero].id===this.guestHeroId?{...this.progression,characters:{...this.progression.characters,[this.guestHeroId]:{...this.progression.characters[this.guestHeroId],level:Math.max(60,this.progression.characters[this.guestHeroId].level),breaks:Math.max(4,this.progression.characters[this.guestHeroId].breaks)}}}:this.progression;const stats=combatStats(profile,HEROES[hero]);if(hasShizukuBond(this.party)&&this.partyHeroes.includes(hero)){stats.maxHp=Math.round(stats.maxHp*SHIZUKU_BOND.hp);stats.attack*=SHIZUKU_BOND.attack;}if(hasPrimBond(this.party)&&this.partyHeroes.includes(hero)){stats.maxHp=Math.round(stats.maxHp*PRIM_BOND.hp);stats.attack*=PRIM_BOND.attack;}if(hero===6&&this.predation?.active)stats.attack+=this.predation.attackBonus;return stats;}
  attackProfile(hero){const profile=weaponAttackProfile(this.progression,HEROES[hero]);return {...profile,range:hero===7&&hasNekoLumi(this.party)?Infinity:profile.range,pierce:profile.pierce+(hero===1?this.rank('penetration'):0),interval:profile.interval*(hero===7?Math.pow(.92,this.effectRank('lumiTempo')):hero===6?Math.pow(.92,this.effectRank('sakuraTempo')):hero===5?Math.pow(.92,this.effectRank('primTempo')):hero===4?Math.pow(.92,this.effectRank('shizukuTempo')):hero===2?Math.pow(.9,this.rank('bladeTempo')):1)};}
  healthFor(hero){return this.heroHealth[this.heroId(hero)];}
  refreshStats(){
    for(const hero of this.partyHeroes){const health=this.healthFor(hero),maxHp=this.statsFor(hero).maxHp+this.rank('vitality')*40;health.hp=health.hp>0?Math.min(maxHp,health.hp+Math.max(0,maxHp-health.maxHp)):0;health.maxHp=maxHp;}
  }
  rank(id){return this.skills[id]||0;}
  effectRank(id){return skillEffectRank(this.skills,id);}
  collectMaterials(rewards,source){const amounts=grantMaterials(this.progression,rewards);for(const [id,value] of Object.entries(amounts))this.earnedMaterials[id]+=value;if(Object.keys(amounts).length)this.emit('materials',{amounts,source});}
  trackMission(metric,amount=1){
    const result=advanceMissions(this.progression.missions,this.area,metric,amount,this.act);if(!result.changed)return;
    this.emit('missionProgress');
  }
  claimMissions(){
    for(const id of this.pendingTrials){const mission=missionsFor(0,this.act).concat(missionsFor(1,this.act),missionsFor(2,this.act)).find(m=>m.id===id);if(mission)advanceMissions(this.progression.missions,mission.area,mission.metric,1,this.act);}
    for(const mission of claimActMissions(this.progression.missions,this.act)){
      this.collectMaterials(mission.rewards,'mission');if(mission.rewards.limitStone)grantLimitStone(this.progression,mission.rewards.limitStone);
      if(mission.equipment&&!this.progression.equipment.owned.includes(mission.equipment))this.progression.equipment.owned.push(mission.equipment);
      this.earnedMissions.push(mission.id);this.emit('missionComplete',{id:mission.id,equipment:mission.equipment,rewards:mission.rewards});
    }
    this.pendingTrials.clear();this.emit('missionProgress');
  }
  emit(type,data={}){this.events.push({type,...data});}
  drainEvents(){return this.events.splice(0);}
  meetTsukineko(){
    if(this.act!==3||this.wave!==6||this.guestHeroId||isHeroUnlocked(this.progression,'tsukineko'))return false;
    this.guestHeroId='tsukineko';this.party=Object.freeze(['nyanluna','tsukineko']);this.partyHeroes=[0,1];this.skillPool=Object.freeze(skillsForParty(this.party,this.progression));
    this.refreshStats();
    Object.assign(this.partner,{x:this.player.x-1.7,z:this.player.z+1.5,attack:0,face:Math.PI});
    this.emit('guestJoin',{heroId:'tsukineko'});return true;
  }
  meetHehereal(){
    if(this.actConfig.chapter!==5||this.guestHeroId==='hehereal'||this.predation.used||this.party.length!==1||this.party.includes('hehereal')||this.act===24&&this.wave<3)return false;
    this.guestHeroId='hehereal';this.party=Object.freeze([...this.party,'hehereal']);this.partyHeroes=this.party.map(id=>HEROES.findIndex(h=>h.id===id));this.skillPool=Object.freeze(skillsForParty(this.party,this.progression));this.refreshStats();
    Object.assign(this.partner,{x:this.player.x-1.7,z:this.player.z+1.5,attack:0,face:Math.PI});this.emit('guestJoin',{heroId:'hehereal'});return true;
  }
  meetLumi(){
    if(this.actConfig.chapter!==6||this.guestHeroId||this.party.length!==1||this.party.includes('lumi')||this.act===28&&this.wave<3)return false;
    this.guestHeroId='lumi';this.party=Object.freeze([...this.party,'lumi']);this.partyHeroes=this.party.map(id=>HEROES.findIndex(h=>h.id===id));this.skillPool=Object.freeze(skillsForParty(this.party,this.progression));this.refreshStats();
    Object.assign(this.partner,{x:this.player.x-1.7,z:this.player.z+1.5,attack:0,face:Math.PI});this.emit('guestJoin',{heroId:'lumi'});return true;
  }
  startWave(){
    this.wave++;this.waveSpawned=0;this.waveGoal=this.actConfig.counts[this.wave-1];this.spawnTimer=.6;this.waveBreak=0;
    this.area=Math.min(2,Math.floor((this.wave-1)/2));
    const scheduledRare=goldenSlimeWave(this.actConfig,this.rareRng,this.wave);if(scheduledRare)this.goldenSlimeWave=scheduledRare;
    if(this.wave%2===1)this.route=null;
    if(this.route==='elite'&&this.wave%2===0&&this.wave!==6)this.waveGoal++;
    if(this.meetTsukineko())this.spawn();this.meetHehereal();this.meetLumi();
    if(this.act===7&&this.wave===6&&!isHeroUnlocked(this.progression,'omsolo')){this.rescue={active:true,remaining:180,total:180,saved:false,x:-6,z:-7};this.spawn();const boss=this.enemies.find(e=>e.type==='boss');if(boss)Object.assign(boss,{x:-6,z:-11,face:0});this.emit('rescueStart');}
    if((this.act===11||this.act===15)&&this.wave===6)this.spawn();
    this.emit('wave',{wave:this.wave,area:this.area,theme:this.actConfig.stages[this.area].theme,act:this.act,boss:this.wave===6});
    if(this.wave>1){this.heal(22);this.collectAll();}
  }
  openExit(){
    if(this.exitOpen||this.phase!=='playing')return false;
    this.cancelRice();
    this.exitOpen=true;this.exitDelay=.65;this.ultimateEffects=[];this.projectiles=[];this.hazards=[];this.collectAll();
    this.emit('exitOpen',{area:this.area,final:this.wave===6});return true;
  }
  crossExit(){
    if(this.phase!=='playing'||!this.exitOpen||this.exitDelay>0||this.pendingBlessings>0||Math.hypot(this.player.x-this.exitPoint.x,this.player.z-this.exitPoint.z)>this.exitPoint.radius)return false;
    this.exitOpen=false;this.stagesCleared=this.area+1;this.trackMission('clears');
    for(const mission of missionsFor(this.area,this.act))if(mission.trial&&trialStatus(mission,this).eligible)this.pendingTrials.add(mission.id);
    this.collectMaterials(gateMaterials(this.area,this.act,this.difficulty),'gate');this.combo=0;this.comboTimer=0;this.player.dash=0;this.player.moving=false;this.partner.moving=false;
    if(this.wave===6){
      this.claimMissions();
      const tickets=grantWeaponTickets(this.progression,clearTicketReward(this.progression,this.act));
      this.clearRewardTickets=tickets;this.earnedWeaponTickets+=tickets;
      if(tickets)this.emit('weaponTicket',{count:tickets,total:this.progression.inventory.weaponTicket,source:'actClear'});
      const knewRice=hasRicePower(this.progression),knewNyan=hasNyanAwakening(this.progression);
      if(completeAct(this.progression,this.act)){this.recruitedHeroId=this.actConfig.recruit;this.emit('recruited',{heroId:this.recruitedHeroId});}
      if(!knewRice&&hasRicePower(this.progression)){this.riceNewlyLearned=true;this.emit('riceAwakened');}
      if(!knewNyan&&hasNyanAwakening(this.progression)){this.nyanAwakeningNewlyLearned=true;this.emit('nyanAwakeningLearned');}
      finishNyanAwakening(this,{reset:true});this.guestHeroId=null;this.phase='victory';finishPredation(this);this.emit('victory');
    }
    else{this.phase='transition';this.emit('stageClear',{area:this.area,nextArea:this.area+1});}
    return true;
  }
  advanceStage(){
    if(this.phase!=='transition')return false;
    this.phase='playing';this.travelOpen=null;this.route=null;this.stageTrial={startedAt:this.time,hits:0};Object.assign(this.player,{x:0,z:8,face:Math.PI,dash:0,invincible:1.5,moving:false});
    Object.assign(this.partner,{x:-1.7,z:9.5,face:Math.PI,moving:false});
    this.projectiles=[];this.hazards=[];this.enemies=[];this.startWave();Object.assign(this.player,projectInside(this.walkLayout,this.layout.entrance.x,this.layout.entrance.z));Object.assign(this.partner,projectInside(this.walkLayout,this.player.x-1.7,this.player.z+1.5));this.emit('stageEntered',{area:this.area});return true;
  }
  spawnEnemy(type,x,z,{elite=false}={}){
    const boss=type==='boss',rare=type===GOLDEN_SLIME.type||type===GOLDEN_HEHE.type,rng=type===GOLDEN_HEHE.type?this.heheRng:rare?this.rareRng:this.rng;const hard=this.difficulty==='hard'?1.3:1,power=boss&&elite?ELITE_BOSS_MULTIPLIER:1;
    const spec=boss?BOSSES[this.actConfig.bossId]:ENEMY_TYPES[type];if(!spec)throw new Error(`Unknown enemy: ${type}`);
    const extra=this.actConfig.extra,hp=(boss?this.actConfig.bossHp:spec.hp)*(boss?1:(1+(this.wave-1)*.14)*(extra||this.actConfig.awakening?this.actConfig.hpScale:1+(this.actConfig.chapter>=3?this.actConfig.number-1:this.actConfig.chapter===2?this.act-8:this.act)*.08))*hard*power;
    const e={id:this.ids++,type,bossId:boss?this.actConfig.bossId:null,name:(boss?this.actConfig.boss:spec.name)+(elite?'・深淵':''),elite,x,z,hp,maxHp:hp,speed:spec.speed*(extra?extraCombatFor(this.actConfig).moveScale:1),damage:(boss?(this.actConfig.chapter>=3?92:this.actConfig.chapter===2?62:this.actConfig.chapter===1?45:22):spec.damage)*hard*power*(extra?this.actConfig.damageScale:1),radius:spec.radius*(elite?1.12:1),hit:0,attack:1+rng(),age:0,knockX:0,knockZ:0,face:0,action:0,special:this.actConfig.chapter>=2?(boss?2.4:1.1+rng()*.7):boss?3:1.4+rng(),cast:null,rush:null,recovery:0,enraged:!!extra&&boss,navTimer:0};
    if(rare){e.rare=true;e.expiresAt=this.time+spec.lifetime;}
    if(this.actConfig.awakening)e.damage*=this.actConfig.damageScale;
    this.enemies.push(e);this.emit('spawn',{id:e.id,x,z,boss});return e;
  }
  spawn(){
    const angle=this.rng()*Math.PI*2;let {x,z}=spawnPoint(this.walkLayout,this.player,angle);
    let type=enemyForSpawn(this.act,this.wave,this.waveSpawned,this.rng());
    if(isRangedEnemy(type)&&this.enemies.filter(e=>e.hp>0&&isRangedEnemy(e.type)).length>=(this.actConfig.extra?extraCombatFor(this.actConfig).rangedLimit:this.actConfig.chapter>=3?5:this.actConfig.chapter>=1?4:3))type=this.actConfig.chapter===5?'heheBrawler':this.actConfig.chapter===4?'prismCrawler':this.actConfig.chapter===3?'demonImp':this.actConfig.chapter===2?'mochiGoblin':this.actConfig.chapter===1?'reaper':'bat';
    if(type!=='boss'&&!this.seenEnemyTypes.has(type)){this.seenEnemyTypes.add(type);if(ENEMY_TYPES[type]?.chapter>=1||['archer','mage','charger'].includes(type))this.emit('enemyIntro',{enemyType:type});}
    const elite=this.route==='elite'&&this.wave%2===0&&(this.wave===6||this.waveSpawned===this.waveGoal-1);
    if(elite)type='boss';
    if(type==='boss')({x,z}=projectInside(this.walkLayout,0,-11,2.3));
    this.spawnEnemy(type,x,z,{elite});this.waveSpawned++;
    if(this.wave===this.goldenSlimeWave&&this.waveSpawned===3)this.spawnGoldenSlime();
    if(this.wave===this.goldenHeheWave&&this.waveSpawned===3)this.spawnGoldenHehe();
  }
  spawnGoldenHehe(){
    if(this.actConfig.chapter!==5||this.wave!==this.goldenHeheWave||this.goldenHehe||this.phase!=='playing'||this.exitOpen||this.travelOpen)return null;
    const angle=this.heheRng()*Math.PI*2,p=this.player,point=projectInside(this.walkLayout,p.x+Math.sin(angle)*8,p.z+Math.cos(angle)*8,.9);
    const enemy=this.spawnEnemy(GOLDEN_HEHE.type,point.x,point.z);this.goldenHehe={id:enemy.id,status:'active',expiresAt:enemy.expiresAt};this.emit('rareSpawn',{id:enemy.id,x:enemy.x,z:enemy.z,rareType:GOLDEN_HEHE.type});return enemy;
  }
  spawnGoldenSlime(){
    if(this.actConfig.chapter!==2||(this.actConfig.extra&&this.wave!==this.goldenSlimeWave)||this.goldenSlime?.status==='active'||this.goldenSlimeLastWave===this.wave||this.phase!=='playing'||this.exitOpen||this.travelOpen)return null;
    const angle=this.rareRng()*Math.PI*2,p=this.player;
    let point=projectInside(this.walkLayout,p.x+Math.sin(angle)*8,p.z+Math.cos(angle)*8,.9);
    if(Math.hypot(point.x-p.x,point.z-p.z)<5)point=spawnPoint(this.walkLayout,p,angle);
    const enemy=this.spawnEnemy(GOLDEN_SLIME.type,point.x,point.z);
    this.goldenSlimeLastWave=this.wave;this.goldenSlime={id:enemy.id,status:'active',expiresAt:enemy.expiresAt};
    this.emit('rareSpawn',{id:enemy.id,x:enemy.x,z:enemy.z});return enemy;
  }
  expireGoldenSlime(e){
    if(![GOLDEN_SLIME.type,GOLDEN_HEHE.type].includes(e.type)||e.hp<=0||this.time<e.expiresAt)return false;
    e.hp=0;e.escaped=true;
    if(this.goldenSlime?.id===e.id)Object.assign(this.goldenSlime,{status:'escaped',resolvedAt:this.time});
    if(this.goldenHehe?.id===e.id)Object.assign(this.goldenHehe,{status:'escaped',resolvedAt:this.time});
    this.emit('rareEscape',{id:e.id,x:e.x,z:e.z,rareType:e.type});return true;
  }
  nearest(x,z,range){let best=null,dist=range;for(const e of this.enemies){if(e.hp<=0||e.riceHeld)continue;const d=Math.hypot(e.x-x,e.z-z);if(d-e.radius<dist){best=e;dist=d-e.radius;}}return best;}
  heal(amount){if(this.player.hp>0){const before=this.player.hp;this.player.hp=Math.min(this.player.maxHp,this.player.hp+amount*(1+this.rank('vowRecovery')*.15));if(this.player.hp>before)this.emit('heal',{hero:this.player.hero,heroId:this.heroId(this.player.hero),amount:this.player.hp-before});}}
  dash(dx,dz){
    const p=this.player;if(this.phase!=='playing'||p.dashCooldown>0||this.tutorial?.active&&this.tutorial.step.id!=='dash')return false;
    const d=Math.hypot(dx,dz);p.dx=d>.01?dx/d:Math.sin(p.face);p.dz=d>.01?dz/d:Math.cos(p.face);
    p.dash=.22;p.dashSpeed=this.mount.active?PRIM_MOUNT.dashSpeed:HEROES[p.hero].dashSpeed??24;p.dashCooldown=Math.max(.65,1.5-this.rank('stride')*.2);p.invincible=.5;this.emit('dash',{x:p.x,z:p.z,hero:p.hero});this.observeTutorial('dash');return true;
  }
  switchHero(){if(['hehereal','lumi'].includes(this.guestHeroId)||this.mount.active)return false;if(this.phase!=='playing'||!this.hasLivingPartner||this.player.switchCooldown>0)return false;this.activateHero(this.partnerHero);return true;}
  activateHero(hero,automatic=false){
    this.cancelRice();
    const p=this.player;p.hero=hero;this.refreshStats();p.switchCooldown=.65;p.attack=.05;p.invincible=Math.max(p.invincible,automatic?1.5:.32);
    if(automatic){p.dash=0;this.partner.moving=false;}
    this.emit('switch',{hero:p.hero,x:p.x,z:p.z,automatic});
  }
  ultimate(options){return castUltimate(this,options);}
  attackFrom(source,hero,support=false){
    if(!this.isHeroAlive(hero)||(support&&!this.hasLivingPartner))return false;
    const stats=this.attackProfile(hero);const range=hero===3&&support?stats.supportRange+this.effectRank('mochiReach')*2:stats.range*(1+this.effectRank('reach')*.18)+(hero===7?this.effectRank('lumiReach')*2:hero===6?this.effectRank('sakuraReach')*2:hero===5?this.effectRank('primReach')*.4:hero===4?this.effectRank('shizukuReach')*.4:hero===2?this.effectRank('saberReach')*.35+this.rank('vowRecovery')*.15:0);const enemy=this.nearest(source.x,source.z,range);if(!enemy)return false;
    const angle=Math.atan2(enemy.x-source.x,enemy.z-source.z);source.face=angle;
    const heroId=HEROES[hero].id;let damage=this.statsFor(hero).attack*(1+this.rank('prismBond')*.15+this.rank('moonDropBond')*.15+this.rank('power')*.25+this.rank('moonGuard')*.18+this.rank('starBlade')*.18)*(support?.43*(1+this.rank('echo')*.35+this.rank('starBlade')*.2):1);
    const crit=this.rng()<.05+this.effectRank('crit')*.15;if(crit)damage*=2+this.rank('preciseAim')*.25;
    this.emit('attack',{x:source.x,z:source.z,angle,hero,support,range,color:equippedWeapon(this.progression,heroId)?.weapon.effectColor});
    if(hero===7){return fireLumiRail(this,source,{range,damage:damage*(1+this.effectRank('lumiPower')*.2),crit,color:equippedWeapon(this.progression,heroId)?.weapon.effectColor,pierce:stats.pierce});}
    if(hero===3){
      if(support){this.projectiles.push({id:this.ids++,owner:'player',heroId,kind:'mochiCry',x:source.x,z:source.z,vx:Math.sin(angle)*MOCHI_SUPPORT.speed,vz:Math.cos(angle)*MOCHI_SUPPORT.speed,life:(range+2)/MOCHI_SUPPORT.speed,damage,crit:false,radius:1.05,pierce:stats.supportPierce+this.effectRank('mochiReach'),hitIds:[]});if(this.effectRank('mochiMend'))this.heal(this.effectRank('mochiMend')*2+this.rank('mochiCharge')*2);if(this.rank('mochiCharge'))this.gainUltimateCharge(heroId,this.rank('mochiCharge')*3);}
      else this.projectiles.push({id:this.ids++,owner:'player',heroId,kind:'mochiNote',x:source.x,z:source.z,vx:Math.sin(angle)*12,vz:Math.cos(angle)*12,speed:12,life:(range+3)/12,damage:Math.max(1,damage*(1+this.rank('mochiBrave')*.3)),crit,target:enemy.id,radius:.42,color:equippedWeapon(this.progression,heroId)?.weapon.effectColor});
    }else if(hero===6){
      const speed=19;damage*=1+this.effectRank('sakuraPower')*.2;this.projectiles.push({id:this.ids++,owner:'player',heroId,kind:'magicArrow',x:source.x,z:source.z,vx:Math.sin(angle)*speed,vz:Math.cos(angle)*speed,speed,life:(range+3)/speed,damage,crit,target:enemy.id,radius:.3,color:0xff9dc9});
    }else if(hero===0){
      if(this.nyanAwakening.active)return fireAwakenedNyan(this,source,{enemy,angle,damage,crit,range});
      const id=this.ids++;this.projectiles.push({id,owner:'player',heroId,x:source.x,z:source.z,vx:Math.sin(angle)*15,vz:Math.cos(angle)*15,kind:'magic',speed:15,life:Math.max(1.5,(range+2)/15),damage,crit,target:enemy.id,radius:.28});
    }else if(hero===1){
      const id=this.ids++;this.projectiles.push({id,owner:'player',kind:'gun',heroId,x:source.x,z:source.z,vx:Math.sin(angle)*28,vz:Math.cos(angle)*28,speed:28,life:(range+2)/28,damage,crit,radius:.23,pierce:stats.pierce,hitIds:[]});
    }else{
      const reach=range;
      for(const target of [...this.enemies]){const dx=target.x-source.x,dz=target.z-source.z,d=Math.hypot(dx,dz);if(target.hp>0&&!target.riceHeld&&d-target.radius<=reach&&(d<.01||(dx*Math.sin(angle)+dz*Math.cos(angle))/d>=MELEE_MIN_DOT)){const dealt=this.hit(target,damage*(1+(hero===5?this.effectRank('primPower')*.2:hero===4?this.effectRank('shizukuPower')*.2:this.effectRank('saberPower')*.22)),source.x,source.z,crit,false,heroId);if(hero===4)drainShizuku(this,dealt);}}
    }
    return true;
  }
  hit(e,damage,x,z,crit=false,chain=false,heroId=HEROES[this.player.hero].id,canCharge=true){
    if(e.hp<=0||this.phase==='defeat'||this.phase==='victory'||this.expireGoldenSlime(e))return 0;damage*=mochiDefenseMultiplier(this,e);const dealt=Math.min(e.hp,Math.max(0,damage));e.hp-=damage;e.hit=.15;if(!e.training)this.damageDealt+=Math.min(damage,e.hp+damage);
    const dx=e.x-x,dz=e.z-z,d=Math.hypot(dx,dz)||1;const knock=e.type==='boss'?.5:3.5;e.knockX=dx/d*knock;e.knockZ=dz/d*knock;
    this.emit('hit',{id:e.id,x:e.x,z:e.z,damage:Math.round(damage),crit});
    if(e.training){if(e.hp<=0){this.emit('death',{id:e.id,x:e.x,z:e.z,enemyType:e.type,training:true});this.observeTutorial('defeat');}return;}
    if(canCharge)this.gainUltimateCharge(heroId,.65);
    if(e.hp<=0){
      if(e.type==='boss'&&this.act===7&&this.wave===6&&this.rescue?.active){this.rescue.active=false;this.rescue.saved=true;this.emit('rescueSaved');}
      predationKill(this,heroId);this.kills++;this.trackMission('kills');this.combo++;this.comboTimer=4;this.maxCombo=Math.max(this.maxCombo,this.combo);
      if(canCharge)this.gainUltimateCharge(heroId,4+this.rank('rapidCharge')*2);
      const rare=e.type===GOLDEN_SLIME.type||e.type===GOLDEN_HEHE.type,rareSpec=e.type===GOLDEN_HEHE.type?GOLDEN_HEHE:GOLDEN_SLIME;
      // Credit the projectile/skill owner even after swapping; only deployed characters share XP.
      const recipients=this.party.includes(heroId)?this.party:[];
      for(const id of recipients){const earned=awardCharacterXp(this.progression,id,(ENEMY_REWARDS[e.type]?.xp??0)*(id===heroId?1:.5));if(earned){this.earnedXp[id]=(this.earnedXp[id]??0)+earned.amount;this.refreshStats();this.emit('characterXp',earned);}}
      this.collectMaterials(enemyMaterials(e,this.act,this.difficulty,this.materialRng),'enemy');
      const tickets=rare?grantWeaponTickets(this.progression,rareSpec.tickets):bossWeaponTicket(this.progression,e,this.lootRng);if(tickets){this.earnedWeaponTickets+=tickets;this.emit('weaponTicket',{count:tickets,total:this.progression.inventory.weaponTicket,...(rare?{source:e.type}:{})});}
      if(rare){if(e.type===GOLDEN_HEHE.type)this.goldenHeheKills++;else this.goldenSlimeKills++;const before=this.progression.inventory.limitStone;grantLimitStone(this.progression,rareSpec.stones);this.earnedRareStones+=this.progression.inventory.limitStone-before;if(this.goldenSlime?.id===e.id)Object.assign(this.goldenSlime,{status:'defeated',resolvedAt:this.time});if(this.goldenHehe?.id===e.id)Object.assign(this.goldenHehe,{status:'defeated',resolvedAt:this.time});this.emit('rareDefeated',{id:e.id,x:e.x,z:e.z,tickets,rareType:e.type});}
      if(e.elite){this.collectMaterials(ROUTE_REWARD,'route');this.routeRewards.push(this.area);this.emit('routeReward',{rewards:ROUTE_REWARD});}
      this.emit('death',{id:e.id,x:e.x,z:e.z,enemyType:e.type,heroId});
      if(this.rank('leech')&&this.kills%6===0)this.heal(8*this.rank('leech'));
      const value=ENEMY_REWARDS[e.type]?.crystals??0;if(value)this.orbs.push({id:this.ids++,x:e.x,z:e.z,value,age:0});
      if(this.effectRank('nova')&&!chain){this.emit('nova',{x:e.x,z:e.z,radius:3.8+this.rank('arcanePower')*.6});for(const n of [...this.enemies])if(n!==e&&n.hp>0&&Math.hypot(n.x-e.x,n.z-e.z)<3.8+this.rank('arcanePower')*.6)this.hit(n,this.skillDamage(heroId,14*this.effectRank('nova')),e.x,e.z,false,true,heroId,canCharge);}
      // Carry the recovered light to the open gate to complete the chapter.
    }
    return dealt;
  }
  hurt(amount,x,z){
    const p=this.player;if(p.invincible>0||this.phase!=='playing'||this.exitOpen||this.travelOpen||this.tutorial?.active)return false;
    if(this.mount.active){const other=this.partnerHero,health=this.healthFor(other);const damage=amount*Math.pow(.85,this.rank('ward')+this.effectRank('saberGuard'))*100/(100+this.statsFor(other).defense);health.hp=Math.max(0,health.hp-damage);this.emit('hurt',{damage:Math.round(damage),hero:other,x,z});if(health.hp<=0){const heroId=this.heroId(other);this.emit('heroDown',{hero:other,heroId});this.ultimateEffects=this.ultimateEffects.filter(e=>e.heroId!==heroId&&!e.heroIds?.includes(heroId));for(const bullet of this.projectiles)if(bullet.heroId===heroId)bullet.life=0;endMount(this);}}
    const damage=amount*(p.hero===4?Math.pow(.9,this.rank('shizukuMercy')):1)*Math.pow(.85,(this.rank('ward')+this.effectRank('saberGuard')))*100/(100+this.statsFor(p.hero).defense);p.hp=Math.max(0,p.hp-damage);p.invincible=.8+this.rank('counterGuard')*.2;this.combo=0;if(damage>0){this.stageTrial.hits++;this.runHits++;}
    this.emit('hurt',{damage:Math.round(damage),hero:p.hero,x,z});
    if(p.hp<=0){
      endMount(this);if(p.hero===0)finishNyanAwakening(this);const heroId=this.heroId(p.hero);this.emit('heroDown',{hero:p.hero,heroId});
      this.ultimateEffects=this.ultimateEffects.filter(effect=>effect.heroId!==heroId&&!effect.heroIds?.includes(heroId));
      // Mark in-flight shots too: a knockout can happen during the projectile loop.
      for(const bullet of this.projectiles)if(bullet.owner==='player'&&bullet.heroId===heroId)bullet.life=0;
      this.projectiles=this.projectiles.filter(bullet=>bullet.life>0);
      if(this.hasLivingPartner&&!['hehereal','lumi'].includes(this.guestHeroId))this.activateHero(this.partnerHero,true);
      else{this.cancelRice();this.phase='defeat';this.ultimateEffects=[];this.projectiles=[];this.hazards=[];finishPredation(this);finishNyanAwakening(this,{reset:true});this.emit('defeat');}
    }
    return true;
  }
  addCrystals(value){if(this.phase==='victory'||this.phase==='defeat'||!Number.isFinite(value)||value<=0)return;value=Math.floor(value);this.trackMission('crystals',value);this.stageCrystals+=value;this.totalCrystals+=value;while(this.stageCrystals>=this.crystalGoal){this.stageCrystals-=this.crystalGoal;this.blessingTier++;this.crystalGoal=Math.round(this.crystalGoal*1.25+2);this.pendingBlessings++;}}
  collectAll(){for(const orb of this.orbs)this.addCrystals(orb.value);this.orbs=[];}
  offerSkills(){
    const available=this.skillPool.filter(s=>this.rank(s.id)<s.max);for(let i=available.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[available[i],available[j]]=[available[j],available[i]];}
    if(!available.length){this.pendingBlessings=0;this.heal(40);return;}
    this.offers=available.slice(0,3);
    // Keep the party's identity visible: a duo blessing, or a deployed hero's blessing.
    const signatures=available.filter(s=>s.requires?.length===(this.hasPartner&&available.some(s=>s.requires?.length===2)?2:1));
    if(signatures.length&&!this.offers.some(s=>signatures.includes(s)))this.offers[this.offers.length-1]=signatures[0];
    this.cancelRice();this.phase='upgrade';this.emit('upgrade',{offers:this.offers});
  }
  chooseSkill(id){
    const skill=this.skillPool.find(s=>s.id===id);
    if(this.phase!=='upgrade'||!skill||this.rank(id)>=skill.max||!this.offers.some(s=>s.id===id))return false;
    this.skills[id]=this.rank(id)+1;this.blessingsTaken++;if(id==='vitality'){const hp=this.player.hp;this.refreshStats();this.player.hp=hp;this.heal(60);}
    if(this.rank('starlightHeal'))this.heal((this.player.hero===0?27:18)*this.rank('starlightHeal'));
    this.pendingBlessings=Math.max(0,this.pendingBlessings-1);this.offers=[];this.phase='playing';this.emit('skill',{id});
    if(this.pendingBlessings>0)this.offerSkills();return true;
  }
  get riceAvailable(){return canUseRice(this);}
  grabRice(kind,id){return grabRice(this,kind,id);}
  moveRice(point){return moveRice(this,point);}
  releaseRice(){return releaseRice(this);}
  cancelRice(){return cancelRice(this);}
  pause(){if(this.phase==='playing'){this.cancelRice();this.phase='paused';return true;}return false;}
  resume(){if(this.phase==='paused')this.phase='playing';}
  tick(dt,input={x:0,z:0}){
    if(this.phase!=='playing')return;const training=this.tutorial?.active;
    if(training&&!this.tutorial.practicing)return;
    dt=clamp(dt,0,.05);if(!training)this.time+=dt;tickMount(this,dt);tickNyanAwakening(this,dt);
    for(const e of this.enemies)this.expireGoldenSlime(e);
    tickRice(this,dt);
    if(this.rescue?.active){this.rescue.remaining=Math.max(0,this.rescue.remaining-dt);if(this.rescue.remaining<=0){this.phase='defeat';this.ultimateEffects=[];this.projectiles=[];this.hazards=[];finishNyanAwakening(this,{reset:true});this.emit('defeat',{reason:'rescueTimeout'});return;}}
    advanceFloors(this,dt);
    const p=this.player,fromX=p.x,fromZ=p.z;
    for(const prop of ['attack','dashCooldown','invincible','switchCooldown'])p[prop]=Math.max(0,p[prop]-dt);
    let dx=input.x||0,dz=input.z||0;const speed=(this.mount.active?PRIM_MOUNT.speed:HEROES[p.hero].moveSpeed??5.6)*(1+this.rank('stride')*.12)*floorMovementScale(this,p);const length=Math.hypot(dx,dz);if(length>1){dx/=length;dz/=length;}
    if(p.dash>0){p.dash=Math.max(0,p.dash-dt);dx=p.dx;dz=p.dz;p.x+=dx*(p.dashSpeed??24)*dt;p.z+=dz*(p.dashSpeed??24)*dt;}else{p.x+=dx*speed*dt;p.z+=dz*speed*dt;}
    if(Math.hypot(dx,dz)>.05)p.face=Math.atan2(dx,dz);p.moving=Math.hypot(dx,dz)>.05;
    Object.assign(p,moveWithin(this.walkLayout,{x:fromX,z:fromZ},p.x,p.z));
    const partner=this.partner;const targetX=p.x-Math.cos(p.face)*1.7-Math.sin(p.face),targetZ=p.z+Math.sin(p.face)*1.7-Math.cos(p.face);
    const partnerFrom={x:partner.x,z:partner.z};
    if(this.hasLivingPartner){if(!clearPath(this.walkLayout,partner,{x:targetX,z:targetZ},.55)){const d=navigation(this.walkLayout,partner,{x:targetX,z:targetZ}),length=Math.hypot(d.x,d.z)||1;partner.x+=d.x/length*6*dt;partner.z+=d.z/length*6*dt;}partner.moving=Math.hypot(partner.x-targetX,partner.z-targetZ)>.3;partner.x+=(targetX-partner.x)*Math.min(1,dt*5);partner.z+=(targetZ-partner.z)*Math.min(1,dt*5);partner.attack=Math.max(0,partner.attack-dt);}else partner.moving=false;
    Object.assign(partner,moveWithin(this.walkLayout,partnerFrom,partner.x,partner.z,.55));
    if(this.mount.active)Object.assign(partner,{x:p.x,z:p.z,face:p.face,moving:p.moving});
    if(training){this.observeTutorial('move',Math.hypot(p.x-fromX,p.z-fromZ));if(this.tutorial.step.id!=='attack')return;}
    if(this.travelOpen){
      if(this.pendingBlessings>0){this.offerSkills();return;}
      this.travelDelay=Math.max(0,this.travelDelay-dt);for(const target of this.travelTargets)if(this.enterPassage(target.id))break;return;
    }
    if(this.exitOpen){
      if(this.pendingBlessings>0){this.offerSkills();return;}
      this.exitDelay=Math.max(0,this.exitDelay-dt);this.crossExit();return;
    }
    tickFloors(this,dt);if(this.phase!=='playing')return;
    if(!training)tickUltimates(this,dt);
    if(p.attack<=0&&this.attackFrom(p,p.hero))p.attack=this.attackProfile(p.hero).interval*Math.pow(.85,this.effectRank('haste'));
    if(this.hasLivingPartner&&partner.attack<=0&&this.attackFrom(partner,this.partnerHero,!this.mount.active))partner.attack=this.partnerHero===3?this.attackProfile(3).supportInterval:this.attackProfile(this.partnerHero).interval*(this.mount.active?1:2.6)*Math.pow(.85,this.effectRank('haste'));
    if(!training){this.spawnTimer-=dt;if(this.waveSpawned<this.waveGoal&&this.spawnTimer<=0){this.spawn();this.spawnTimer=this.wave===6?100:Math.max(.43,1.15-this.wave*.10)*(this.actConfig.extra?extraCombatFor(this.actConfig).spawnScale:1);}}
    for(const e of this.enemies){
      if(e.hp<=0||e.riceHeld||e.riceThrown)continue;e.mochiFrozen=mochiFrozen(this,e);if(e.mochiFrozen){e.hit=Math.max(0,e.hit-dt);continue;}if(e.mochiWeakenUntil<=this.time){e.mochiAttackDown=0;e.mochiDefenseDown=0;}const enemyFrom={x:e.x,z:e.z};e.navTimer-=dt;e.age+=dt;e.hit=Math.max(0,e.hit-dt);e.attack-=dt*(this.actConfig.extra?extraCombatFor(this.actConfig).cooldownRate:1);
      if(!e.training)tickEnemyBehavior(this,e,dt,enemySpeedScale(this,e)*floorMovementScale(this,e,{enemy:true}));
      e.x+=e.knockX*dt;e.z+=e.knockZ*dt;e.knockX*=Math.max(0,1-dt*7);e.knockZ*=Math.max(0,1-dt*7);
      Object.assign(e,moveWithin(this.walkLayout,enemyFrom,e.x,e.z,Math.min(.8,e.radius)));
      if(!e.rare&&Math.hypot(p.x-e.x,p.z-e.z)<e.radius+.7&&e.attack<=0){this.hurt(mochiIncomingDamage(this,e.damage,e.id),e.x,e.z);e.attack=1.2;if(this.phase==='defeat')return;}
    }
    for(let i=0;i<this.enemies.length;i++)for(let j=i+1;j<this.enemies.length;j++){
      const a=this.enemies[i],b=this.enemies[j];if(a.hp<=0||b.hp<=0||a.riceHeld||b.riceHeld||a.riceThrown||b.riceThrown||mochiFrozen(this,a)||mochiFrozen(this,b))continue;const x=b.x-a.x,z=b.z-a.z,d=Math.hypot(x,z)||.01,min=(a.radius+b.radius)*.82;
      if(d<min){const k=(min-d)*dt*2.5;a.x-=x/d*k;a.z-=z/d*k;b.x+=x/d*k;b.z+=z/d*k;Object.assign(a,projectInside(this.walkLayout,a.x,a.z,.55));Object.assign(b,projectInside(this.walkLayout,b.x,b.z,.55));}
    }
    for(const bullet of this.projectiles){
      if(bullet.life<=0||bullet.riceHeld)continue;
      bullet.life-=dt;if(bullet.owner==='player'&&['magic','mochiNote','magicArrow'].includes(bullet.kind)){
        const target=this.enemies.find(e=>e.id===bullet.target&&e.hp>0&&!e.riceHeld)??(bullet.kind==='magicArrow'||bullet.awakened?this.nearest(bullet.x,bullet.z,bullet.life*bullet.speed):null);if(target){bullet.target=target.id;}if(target){const x=target.x-bullet.x,z=target.z-bullet.z,d=Math.hypot(x,z)||1;bullet.vx=x/d*bullet.speed;bullet.vz=z/d*bullet.speed;}
      }
      if(bullet.owner==='enemy'&&bullet.homing>0){const target=Math.atan2(p.x-bullet.x,p.z-bullet.z),current=Math.atan2(bullet.vx,bullet.vz),turn=Math.atan2(Math.sin(target-current),Math.cos(target-current)),angle=current+clamp(turn,-bullet.turnRate*dt,bullet.turnRate*dt);bullet.vx=Math.sin(angle)*bullet.speed;bullet.vz=Math.cos(angle)*bullet.speed;bullet.homing=Math.max(0,bullet.homing-dt);}
      const fromX=bullet.x,fromZ=bullet.z;bullet.x+=bullet.vx*dt;bullet.z+=bullet.vz*dt;
      if(bullet.owner==='player'){
        // Swept collision prevents fast rounds crossing a small enemy between frames.
        const dx=bullet.x-fromX,dz=bullet.z-fromZ,lengthSq=dx*dx+dz*dz;
        const hits=this.enemies.filter(e=>e.hp>0&&!e.riceHeld&&!bullet.hitIds?.includes(e.id)).map(e=>{const t=clamp(((e.x-fromX)*dx+(e.z-fromZ)*dz)/(lengthSq||1),0,1);return {e,t,d:Math.hypot(e.x-fromX-dx*t,e.z-fromZ-dz*t)};}).filter(h=>h.d<h.e.radius+bullet.radius).sort((a,b)=>a.t-b.t);
        for(const {e} of hits){if(bullet.kind==='mochiCry')mochiCryHit(this,e);if(['magic','moonPierce'].includes(bullet.kind)&&bullet.heroId==='nyanluna'&&this.rank('moonFrost')){e.frostUntil=this.time+2;e.frostSlow=.25+this.rank('moonFrost')*.1;}this.hit(e,bullet.damage,fromX,fromZ,bullet.crit,false,bullet.heroId,!bullet.ultimate);if(bullet.hitIds){bullet.hitIds.push(e.id);bullet.pierce--;if(bullet.pierce>0)continue;}bullet.life=0;break;}
      }
      else{
        const dx=bullet.x-fromX,dz=bullet.z-fromZ,l=dx*dx+dz*dz,t=clamp(((p.x-fromX)*dx+(p.z-fromZ)*dz)/(l||1),0,1);
        if(Math.hypot(p.x-fromX-dx*t,p.z-fromZ-dz*t)<.6+bullet.radius){this.hurt(mochiIncomingDamage(this,bullet.damage,bullet.sourceId),bullet.x,bullet.z);bullet.life=0;if(this.phase==='defeat')return;}
      }
    }
    this.projectiles=this.projectiles.filter(b=>b.life>0);
    this.hazards=this.hazards.filter(h=>!h.sourceId||this.enemies.some(e=>e.id===h.sourceId&&e.hp>0));
    for(const h of this.hazards){if(h.riceHeld)continue;h.timer-=dt;if(h.timer<=0){if(h.damage)this.emit('hazard',{x:h.x,z:h.z,radius:h.radius,innerRadius:h.innerRadius,color:h.color,shape:h.shape,length:h.length,width:h.width,angle:h.angle});if(distanceToHazard(p.x,p.z,h)<.45&&h.damage){this.hurt(mochiIncomingDamage(this,h.damage,h.sourceId),h.x,h.z);if(this.phase==='defeat')return;}}}
    this.hazards=this.hazards.filter(h=>h.timer>0);
    this.orbitTimer-=dt;if(this.effectRank('orbit')&&this.orbitTimer<=0){this.orbitTimer=.45;for(let i=0;i<this.effectRank('orbit');i++){const a=this.time*2.3+i/this.effectRank('orbit')*Math.PI*2,x=p.x+Math.cos(a)*2.5,z=p.z+Math.sin(a)*2.5;for(const e of this.enemies)if(e.hp>0&&Math.hypot(e.x-x,e.z-z)<e.radius+1)this.hit(e,this.skillDamage(this.heroId(p.hero),12+this.rank('starlightHeal')*4),p.x,p.z,false,false,HEROES[p.hero].id);}}
    for(const orb of this.orbs){orb.age+=dt;const x=p.x-orb.x,z=p.z-orb.z,d=Math.hypot(x,z)||.01;if(d<3.5+this.effectRank('reach')*1.5||orb.age>7){const k=Math.min(1,dt*(orb.age>7?5:9));orb.x+=x*k;orb.z+=z*k;}if(d<.8){this.addCrystals(orb.value);orb.value=0;this.emit('collect');}}
    this.orbs=this.orbs.filter(o=>o.value>0);this.enemies=this.enemies.filter(e=>e.hp>0);
    this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;
    if(this.phase!=='playing'||training)return;
    if(this.waveSpawned>=this.waveGoal&&!this.enemies.length){
      if(this.wave%2===0)this.openExit();
      else{this.waveBreak+=dt;if(this.waveBreak>2.2){if(this.field.kind==='single')this.startWave();else this.openPassage();}}
    }
    if(this.pendingBlessings>0){this.offerSkills();return;}
  }
  snapshot(){return {nyanAwakening:{...this.nyanAwakening},predation:{active:this.predation.active,used:this.predation.used,attackBonus:this.predation.attackBonus,danceKills:this.predation.danceKills},goldenHeheKills:this.goldenHeheKills,goldenHehe:this.goldenHehe?{...this.goldenHehe}:null,mount:{...this.mount},goldenSlimeKills:this.goldenSlimeKills,goldenSlime:this.goldenSlime?{...this.goldenSlime}:null,earnedRareStones:this.earnedRareStones,earnedWeaponTickets:this.earnedWeaponTickets,heroHealth:Object.fromEntries(this.party.map(id=>[id,{...this.heroHealth[id]}])),rescue:this.rescue?{...this.rescue}:null,layout:this.layout.id,travelOpen:this.travelOpen,travelTargets:this.travelTargets,route:this.route,routeRewards:[...this.routeRewards],act:this.act,actTitle:this.actConfig.title,phase:this.phase,ultimateCharges:{...this.ultimateCharges},ultimateEffects:this.ultimateEffects.map(e=>({...e})),tutorial:this.tutorial?{active:this.tutorial.active,step:this.tutorial.step.id,distance:this.tutorial.distance}:null,guestHeroId:this.guestHeroId,recruitedHeroId:this.recruitedHeroId,party:[...this.party],partnerHero:this.partnerHero,skillPool:this.skillPool.map(s=>s.id),exitOpen:this.exitOpen,stagesCleared:this.stagesCleared,wave:this.wave,area:this.area,kills:this.kills,time:this.time,characterLevels:Object.fromEntries(HEROES.map((h,i)=>[h.id,{...this.progressFor(i)}])),earnedXp:{...this.earnedXp},stageCrystals:this.stageCrystals,crystalGoal:this.crystalGoal,blessingTier:this.blessingTier,blessingsTaken:this.blessingsTaken,player:{...this.player},enemyCount:this.enemies.length,projectiles:this.projectiles.length,earnedMissions:[...this.earnedMissions],skills:{...this.skills},offers:this.offers.map(s=>s.id),boss:this.enemies.find(e=>e.type==='boss')?.hp||0};}
}
