import {NYAN_UNLOCK_LEVEL,NYAN_AWAKENING_RULES,NYAN_AWAKENING_HELP,hasNyanAwakening} from './nyanluna-awakening.js';
import './nyanluna-awakening.css';
import {hasNekoLumi} from './lumi-combat.js';
import {storySpeaker} from './story-cast.js';
import './chapter-seven.css';
import {HEHE_FORM_LINES} from './hehe-form-voice.js';
import {hasPredationPair} from './hehereal-predation.js';
import {version as APP_VERSION} from '../package.json';
import {GOLDEN_HEHE} from './chapter-six-enemies.js';
import {goldenHeheHud} from './golden-hehe-ui.js';
import './chapter-six.css';
import {goldenSlimeHud,GOLDEN_SLIME} from './golden-slime.js';
import './golden-slime.css';
import {publicUrl} from './public-url.js';
import {difficultyName,difficultyCards} from './difficulty-ui.js';
import './difficulty.css';
import {heightAt} from './terrain.js';
import {RICE_HELP,RICE_UNLOCK_LEVEL,hasRicePower} from './rice-awakening.js';
import './rice-awakening.css';
import {fieldSummary,updateTerrainUi,floorGuide} from './terrain-ui.js';
import './terrain.css';
import {drawFloorLabels} from './floor-appearance.js';
import {ENEMY_TYPES,BOSSES,ELITE_BOSS_LABEL,enemyRosterForAct} from './enemies.js';
import {ACTS,CHAPTERS,actFor,chapterForAct,actLabel,isActUnlocked,nextStoryAct} from './acts.js';
import {ultimateFor} from './abilities.js';
import './abilities.css';
import {needsFirstBattleTutorial} from './tutorial.js';
import {BattleTutorialView} from './tutorial-ui.js';
import './tutorial.css';
import {availableHeroes,isHeroUnlocked,recruitmentNote} from './recruitment.js';
import {missionsView,equipmentView,currentMissions,missionRewardText} from './rewards-ui.js';
import {STAGE_MISSIONS,missionsFor,trialStatus} from './missions.js';
import {equipUnique,uniqueEquipment} from './equipment.js';
import {PARTY_KEY,normalizeParty,changeParty} from './party.js';
import {partyView} from './party-ui.js';
import {skillUpgradeLabel,blessingSource,partyTitle,equipSkill,hasFreeSkillLoadout} from './blessings.js';
import './style.css';
import './chapter.css';
import './story-cast.css';
import './progression.css';
import './talents.css';
import './materials.css';
import './party.css';
import './blessing-loadout.css';
import './rewards.css';
import './weapons.css';
import './equipment-ui.css';
import {drawWeapons,equipWeapon,weaponVariant} from './weapons.js';
import {weaponGachaView,weaponDrawResult,weaponBatchResult} from './weapons-ui.js';
import {WeaponSummonPresentation} from './weapon-summon.js';
import {WeaponSummonView} from './weapon-summon-view.js';
import './weapon-summon.css';
import './weapon-batch.css';
import {talentView,talentDetailView,materialsText} from './talent-ui.js';
import {presentTalentUnlock} from './talent-presentation.js';
import {materialArt} from './material-art.js';
import {talentNode,nodeEffectText} from './talents.js';
import {PROGRESSION_KEY,normalizeProgression,characterProgress,xpRequired,levelCap,LEVEL_RULES,grantLimitStone,unlockTalent} from './progression.js';
import {growthCards} from './progression-ui.js';
import { Adventure,HEROES,SKILLS,AREAS,STAGE_EXIT } from './model.js';
import { World } from './world.js';
import { Soundscape } from './audio.js';
import {musicScene} from './music.js';
import {VoicePlayer} from './voice-player.js';
import {dialogueVoiceId,BATTLE_VOICES} from './voice-catalog.js';
import './voices.css';
import {UltimatePresentation} from './ultimate-presentation.js';
import {UltimatePresentationView} from './ultimate-presentation-view.js';
import './ultimate-presentation.css';
import {preloadUltimateArt} from './ultimate-art.js';
import { icon } from './icons.js';
import {stageSelectionView,stageBriefingView} from './stage-selection-ui.js';
import './navigation.css';
import './constellation.css';
import './equipment-contrast.css';
import {createTitleVideo} from './title-video.js';
import './title-video.css';
import './readable-ui.css';
import './chapter-four.css';
import './story-mobile.css';
import './skill-choice.css';
import './chapter-five.css';
import './mobile-layout.css';
import './talent-presentation.css';
import {configureStandaloneViewport} from './viewport.js';
import {hasPrimBond} from './prim-combat.js';
import {extraCombatHint} from './extra-stages.js';
import {storyScenesFor,ChapterStory} from './chapter.js';
configureStandaloneViewport();
const story=new ChapterStory();
const tutorialView=new BattleTutorialView();
const $=s=>document.querySelector(s);
const read=(key,fallback)=>{try{const raw=JSON.parse(localStorage.getItem(key));return raw&&typeof raw==='object'?raw:fallback;}catch{return fallback;}};
let storageAvailable=true;
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{storageAvailable=false;return false;}};
const savedSettings=read('lunaria-settings-v1',{});
const settings={voice:savedSettings.voice!==false,voiceVolume:typeof savedSettings.voiceVolume==='number'?Math.max(0,Math.min(1,savedSettings.voiceVolume)):.85,sound:savedSettings.sound!==false,music:savedSettings.music!==false,quality:savedSettings.quality==='low'?'low':'high',motion:savedSettings.motion!==false};
const rawRecord=read('lunaria-record-v1',{});
const num=(v)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?Math.floor(v):0;
let record={chapterOneCleared:rawRecord.chapterOneCleared===true,runs:num(rawRecord.runs),wins:num(rawRecord.wins),best:num(rawRecord.best),crystals:num(rawRecord.crystals),bestCombo:num(rawRecord.bestCombo)};
let progression=normalizeProgression(read(PROGRESSION_KEY,{}),HEROES,record);
const persistProgression=()=>save(PROGRESSION_KEY,progression);
record.chapterOneCleared=progression.story.chapterOneCleared;
const unlockedRoster=()=>availableHeroes(progression,HEROES);
const heroLevel=id=>characterProgress(progression,id).level;
// Opening the game must not select an uncleared chapter or change the saved party.
let selectedAct=0;
let equipmentHero=HEROES[0].id,equipmentCategory='weapons';
let treeHero=HEROES[0].id,treeSelection='origin',blessingSlot=0;
let talentDialogScroll=null;
let partySkillHero=null,partySkillSlot=0;
const savedParty=read(PARTY_KEY,{});let selectedParty=normalizeParty(savedParty.members,unlockedRoster());
let selectedHero=Math.max(0,HEROES.findIndex(h=>h.id===(selectedParty.includes(savedParty.lead)?savedParty.lead:selectedParty[0]))),difficulty='normal',game=null,world=null,last=performance.now(),accumulator=0,activeDialog=null,returnFocus=null,resultSaved=false,toastTimer=0,bannerTimer=0,ultimateBannerTimer=0,renderFrames=0,storyEnabled=true,pendingStory=null;
let lastSkills='',lastHero=-1;
const audio=new Soundscape();audio.enabled=settings.sound;audio.music=settings.music;
const voice=new VoicePlayer(audio,{enabled:settings.voice,volume:settings.voiceVolume,onCaption:item=>{const el=$('#voice-caption');if(!el)return;el.classList.toggle('visible',!!item&&voice.mode==='battle');el.textContent=item?`${game?.predation.active&&item.who==='hehereal'?'へへへ':item.who==='lumi'&&hasNekoLumi(game?.party)?'ねこるみ':HEROES.find(h=>h.id===item.who)?.name??''}「${item.text}」`:'';}});
story.speakerFor=entry=>entry.who==='lumi'&&story.scene?.neko&&hasNekoLumi(game?.party)?storySpeaker('nekolumi'):game?.predation.active&&entry.who==='hehereal'?{name:'へへへ',role:'へへりある · オムソロ取り込み中',image:publicUrl('assets/portraits/hehe-form-v1.png'),alt:'桜の魔法弓を持った、変身中のへへへ',color:'#ff9dc9'}:undefined;
story.onVoice=(entry,next=[])=>{voice.setMode('story');if(!entry.voiced){voice.stop();return;}const available=voice.enabled&&audio.enabled&&voice.volume>0,button=story.dialog.querySelector('#story-voice');if(button){button.disabled=!available;button.textContent=available?'♪ もう一度聞く':'♪ ボイスOFF';}if(game?.predation.active&&entry.who==='hehereal'){void voice.play(HEHE_FORM_LINES.laugh.id,{priority:100,interrupt:true});return;}void voice.dialogue(entry.who,entry.text);voice.preload(next.map(line=>dialogueVoiceId(line.who,line.text)));};
story.onVoiceStop=()=>voice.stop();
tutorialView.onVoice=step=>{void voice.dialogue('nyanluna',step.text,'tutorial');};
document.addEventListener('pointerdown',()=>{voice.init();if(voice.suspended&&activeDialog!=='pause')voice.resume();},{passive:true});
const keys=new Set();const stick={id:null,x:0,y:0,cx:0,cy:0};const previousPad={};
const portrait=(hero,cls='')=>`<span class="portrait ${HEROES[hero].id} ${cls}" role="img" aria-label="${HEROES[hero].name}"></span>`;
const minutes=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
$('#app').innerHTML=`
  <section id="home" class="home" aria-label="タイトル画面">
    <div class="key-art" aria-hidden="true"><div class="title-backdrop"></div><div class="title-film"><img src="${publicUrl('assets/title/adventure-poster.jpg')}" alt="" fetchpriority="high"><video id="title-video" data-src="${publicUrl('assets/title/adventure-loop.mp4')}" poster="${publicUrl('assets/title/adventure-poster.jpg')}" muted loop playsinline preload="none" disablepictureinpicture tabindex="-1"></video></div></div><div class="home-shade"></div><div class="dust dust-one"></div><div class="dust dust-two"></div>
    <div class="title-lockup"><span class="title-orbit" aria-hidden="true">☾</span><p class="title-kicker">LUNANECO ADVENTURE</p><h1 class="game-title"><span>ルナネコの</span><span>不思議な冒険</span></h1><p class="title-caption">月明かりが、ふたりを導く。</p></div>
    <div class="title-entry"><button id="start" class="title-start"><span>冒険をはじめる</span>${icon('arrow')}</button></div>
    <footer class="title-footer"><span>月と星をめぐる、小さな冒険。</span><span class="version">Ver. ${APP_VERSION}</span></footer>
  </section>
  <section id="chapter-menu" class="chapter-menu menu-light hidden" tabindex="-1" aria-label="冒険メニュー"></section>
  <section id="hud" class="hud hidden" aria-label="戦闘情報">
    <div class="party-hud"><button id="switch" data-action="switch" class="active-portrait" aria-label="仲間を交代（Q）">${portrait(0)}<span class="swap-badge">${icon('swap')}</span></button><div class="health-panel"><div class="hero-heading"><strong id="hero-name">にゃんるな</strong><small class="lead-status">操作中</small><span id="level">Lv. 1</span></div><div class="health-track" role="progressbar" aria-label="HP" aria-valuemin="0" aria-valuemax="180" aria-valuenow="180"><i id="health-fill"></i><span id="hp">180 / 180</span></div><div class="xp-track" role="progressbar" aria-label="キャラクター経験値" aria-valuemin="0" aria-valuemax="8" aria-valuenow="0"><i id="xp-fill"></i></div><small id="hero-exp" class="hero-exp">EXP 0 / 36</small><span class="partner-label"><b id="partner-name">つきねこ</b> が援護中 <kbd>Q</kbd></span></div></div>
    <div class="stage-hud"><span id="area-sub">THE STARLIT MEADOW</span><strong id="area-name">星詠みの草原</strong><div class="wave-row"><span id="wave">WAVE 01 / 06</span><div id="wave-dots">${Array.from({length:6},()=>'<i></i>').join('')}</div></div></div>
    <div class="top-actions"><span class="kills">${icon('sword')}<b id="kill-count">0</b></span><time id="timer">00:00</time><button id="pause" class="icon-button" aria-label="一時停止（Esc）">${icon('pause')}</button></div>
    <div id="boss-hud" class="boss-hud hidden"><div><span>月蝕の守護者</span><small>THE ECLIPSE WARDEN</small></div><div class="boss-track"><i id="boss-fill"></i></div></div>
    <div id="objective" class="objective">${icon('compass')}<span>現れた魔物をすべて倒す</span><b id="remaining">0 / 10</b><small id="mission-tracker"></small></div>
    <div id="rare-encounter" class="rare-encounter hidden"></div>
    <div id="stage-crystal-hud" class="stage-crystal-hud">${icon('crystal')}<div><span>クリスタル <small>この幕の間</small></span><strong id="crystal-count">0 / 8</strong><div class="crystal-track" role="progressbar" aria-label="次の祝福までのクリスタル" aria-valuemin="0" aria-valuemax="8" aria-valuenow="0"><i id="crystal-fill"></i></div><small id="blessing-count">次の祝福まで</small></div></div>
    <div id="combo" class="combo"><strong>0</strong><span>CHAIN</span></div>
    <div id="acquired" class="acquired" aria-label="獲得した冒険スキル"></div>
    <div class="controls"><button id="rice" data-action="rice" class="rice-button hidden" aria-label="ライスの力で5秒間、敵の遠距離攻撃を反射（T）"><span id="rice-label">ライス</span><small id="rice-status">5秒反射</small><kbd>T</kbd></button><button id="nyan-awakening" data-action="awakening" class="nyan-awakening-button hidden" aria-label="にゃんるなが覚醒（G）"><span id="nyan-awakening-label">覚醒</span><small id="nyan-awakening-status">20秒</small><kbd>G</kbd></button><button id="predation" data-action="predation" class="predation-button hidden" aria-label="へへりあるがオムソロを捕食して変身（F）。戦闘終了まで解除できません"><span class="portrait hehereal"></span><span id="predation-label">捕食</span><small id="predation-status">単独変身</small><kbd>F</kbd></button><button id="mount" data-action="mount" class="mount-button hidden" aria-label="プリムに搭乗（R）"><span id="mount-label">搭乗</span><small id="mount-time">12秒</small><kbd>R</kbd></button><button id="switch-action" data-action="switch" class="action-button switch-action" aria-label="つきねこに操作を切り替え（Q）">${portrait(1)}<span class="swap-badge">${icon('swap')}</span><span class="switch-label">交代</span><small id="switch-target" class="switch-target">つきねこへ</small><kbd>Q</kbd><i class="cooldown-mask"></i></button><button id="dash" data-action="dash" class="action-button dash-button" aria-label="回避（Space）">${icon('wind')}<span>回避</span><kbd>SPACE</kbd><i class="cooldown-mask"></i></button><button id="ultimate" data-action="ultimate" class="action-button ultimate-button" aria-label="月華の聖域（E）"><div class="charge-ring"></div>${icon('moon')}<span id="ult-label">0%</span><kbd>E</kbd></button></div>
    <div id="exit-guide" class="exit-guide hidden" aria-live="polite"><span>月の門が開いた</span><strong id="exit-instruction">光る輪へ進もう</strong><small>矢印の先へ移動すると、次のステージへ</small></div>
    <div id="field-map" class="field-map" role="img" aria-label="現在のフィールドの地図"></div><div id="passage-guide" class="passage-guide hidden" role="status"></div>
    <div id="control-hint" class="control-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移動</span><i></i><span>近くの敵を自動で攻撃</span><i></i><span>ドラッグでも移動</span></div>
    <div class="touch-hint">ドラッグで移動</div>
    <div id="rice-control-hint" class="rice-control-hint hidden" role="status"></div>
  </section>
  <div id="joystick" class="joystick hidden"><i></i></div>
  <canvas id="numbers" class="numbers"></canvas><div id="damage-flash"></div>
  <div id="wave-banner" class="wave-banner"><span></span><strong></strong><small></small></div>
  <div id="voice-caption" class="voice-caption" aria-hidden="true"></div>
  <div id="ultimate-banner" class="ultimate-banner"><span>CHARACTER ULTIMATE</span><strong>月華の聖域</strong></div>
  <section id="ultimate-cutin" class="ultimate-cutin hidden" role="dialog" aria-modal="true" tabindex="-1" aria-label="必殺技の演出" aria-hidden="true">
    <button id="cutin-pause" class="cutin-pause" aria-label="必殺技の演出を一時停止">${icon('pause')}</button>
    <div class="cutin-speedlines" aria-hidden="true"></div><div class="cutin-flash" aria-hidden="true"></div><div class="cutin-shockwave" aria-hidden="true"></div>
    <div class="cutin-panel"><div class="cutin-portrait"><img class="cutin-face" alt="" draggable="false"><div class="cutin-art-shade"></div><div class="cutin-sparks" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div></div>
      <div class="cutin-copy"><span class="cutin-role"></span><strong class="cutin-hero"></strong><small class="cutin-english"></small><h2 class="cutin-ability"></h2><p class="cutin-line"></p><div class="cutin-signal" aria-hidden="true">${'<i></i>'.repeat(9)}</div></div>
    </div>
    <button id="cutin-skip" class="cutin-skip" aria-label="演出を省略して必殺技を発動">タップして演出をスキップ ${icon('chevron')}</button>
  </section>
  <div id="toast" class="toast" role="status"></div>
  <dialog id="modal" class="modal"><div id="modal-content"></div></dialog>
  <dialog id="weapon-summon" class="weapon-summon-dialog" aria-label="専用武器ガチャの召喚演出"></dialog>
`;
const titleVideo=createTitleVideo($('#title-video'),{motionEnabled:()=>settings.motion});
const ultimatePresentation=new UltimatePresentation({voice,view:new UltimatePresentationView($('#ultimate-cutin')),getGame:()=>game,onComplete:()=>{resetInput();handleEvents(game.drainEvents());updateHud();canvas.focus();}});
// A fresh pointer must start on the overlay: releasing the activation tap never skips it.
let cutinPointer=null,cutinTap=false;
$('#ultimate-cutin').addEventListener('pointerdown',event=>{
  cutinTap=false;if(event.button!==0||!event.isPrimary||event.target.closest('#cutin-pause'))return;
  cutinPointer={id:event.pointerId,x:event.clientX,y:event.clientY};
});
$('#ultimate-cutin').addEventListener('pointerup',event=>{
  cutinTap=!!cutinPointer&&event.pointerId===cutinPointer.id&&Math.hypot(event.clientX-cutinPointer.x,event.clientY-cutinPointer.y)<18;cutinPointer=null;
});
$('#ultimate-cutin').addEventListener('pointercancel',()=>{cutinPointer=null;cutinTap=false;});
$('#ultimate-cutin').addEventListener('click',event=>{
  if(event.target.closest('#cutin-pause'))return;
  const tap=cutinTap||event.detail===0&&event.target.closest('#cutin-skip');cutinTap=false;cutinPointer=null;
  event.preventDefault();event.stopPropagation();if(tap&&!activeDialog)ultimatePresentation.skip();
});
const summonView=new WeaponSummonView($('#weapon-summon'));
let summonPointer=null,summonFinishedAt=-Infinity;
const weaponSummon=new WeaponSummonPresentation({view:summonView,audio,voice,onFinish:({item,duplicate})=>{summonFinishedAt=performance.now();if(Array.isArray(currentWeaponDraw)){const added=currentWeaponDraw.filter(r=>!r.duplicate).length;announce(`10連ガチャの結果。新規${added}本、重複${10-added}本。10回分を保存しました。`);return;}announce(`${HEROES.find(h=>h.id===item.heroId).name}専用の★${item.rarity.rank}武器「${item.weapon.name}」を獲得。${duplicate?'重複分は星の芽へ変換しました。':''}`);}});
// As with the cut-in, only a tap that starts on the summon stage skips it.
$('#weapon-summon').addEventListener('pointerdown',event=>{summonPointer=null;if(event.button!==0||!event.isPrimary||event.target.closest('button,.draw-sheet'))return;summonPointer={id:event.pointerId,x:event.clientX,y:event.clientY};});
$('#weapon-summon').addEventListener('pointerup',event=>{const tap=!!summonPointer&&event.pointerId===summonPointer.id&&Math.hypot(event.clientX-summonPointer.x,event.clientY-summonPointer.y)<18;summonPointer=null;if(tap)weaponSummon.skip();});
$('#weapon-summon').addEventListener('pointercancel',()=>{summonPointer=null;});
$('#weapon-summon').addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
const dialogs={
  stage:()=>stageBriefingView(selectedAct,difficulty,progression),
  talent:()=>`<header class="talent-sheet-header"><small>CONSTELLATION · 星の解放</small><button class="talent-sheet-close icon-button" data-close aria-label="説明を閉じてツリーに戻る">${icon('close')}</button></header>${talentDetailView(progression,treeHero,treeSelection,{dialog:true})}`,
  party:()=>partyView(selectedParty,selectedHero,HEROES,heroLevel,progression,$('#chapter-menu').classList.contains('hidden')?'タイトルへ戻る':'メニューへ戻る',null,{skillHero:partySkillHero,skillSlot:partySkillSlot}),
  guide:()=>`<div class="modal-heading"><span class="eyebrow">ADVENTURE GUIDE</span><h2>ふたりなら、もっと遠くへ。</h2><p>移動に集中。攻撃は、仲間にまかせよう。</p></div><div class="guide-grid"><article>${icon('compass')}<h3>撃って、かわして</h3><p><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> または画面をドラッグして移動。近くの敵へ自動攻撃。<kbd>Space</kbd> で無敵時間のある回避。</p></article><article>${icon('swap')}<h3>ふたりの力を重ねる</h3><p>最初はにゃんるなだけで出発。第4幕の最後で親友のつきねこと再会・共闘し、クリアすると正式加入します。加入後は冒険画面の「パーティ」で1〜2体を選択。2体編成なら右下の「交代」で、表示された仲間の操作に切り替え。移動しながらでも押せます。<kbd>Q</kbd> または左上の顔でも交代。にゃんるなは遠距離魔法、つきねこは貫通する銃撃。第2章の最後ではオムソロを救出し、クリア後に近接の光剣使いとして加入します。第3章ではもちにゃふぇ、第4章ではHP吸収の鎌使い・雫、第5章では爪とブレスで戦うプリムが加入。第5章の各幕は初回クリアまでつきねこ一人で出撃し、クリアした幕は自由に編成できます。第6章「へへへランド」は推奨Lv.60。各幕の初回クリアまではオムソロ単独で出撃し、クリアした幕は自由編成。2人編成ではNPCのへへりあるは参加しません。おむすびを分けた後は、へへりあるが魔法の弓で援護し、最後の幕をクリアすると正式加入します。登場人物が増えても出撃は最大2人です。控えの仲間も援護します。HPはキャラ別。援護中の仲間は無敵。つきねこ＋プリムでは搭乗ボタン（PCはR）でプリムが大きくなり、12秒間二人ともメインとして攻撃・被弾します。移動はオムソロと同じ速さ。終了後20秒で再搭乗できます。通常の冒険では倒れると生存中の相方へ自動交代し、全員が倒れると終了します。第6章のNPCへへりあるは援護専用。操作役が倒れると終了します。クリア後に選んだ2人編成では、交代・自動交代を通常どおり使えます。戦闘不能からの復帰は次の冒険です。</p></article><article>${icon('spark')}<h3>経験値とクリスタル</h3><p>敵を倒したキャラに経験値100%、もう一人の出撃キャラに50%が入り、レベルと基礎能力が成長。援護の撃破も倒した本人に100%。端数の0.5も保存します。戦闘不能でも出撃中なら50%を獲得。未出撃のキャラとLv.80には入りません。落ちたクリスタルを集めると、出撃メンバーに応じた候補から3つの祝福を提示。共通・キャラ由来・2体の連携があり、効果は編成内で共有します。祝福は同じ幕の全6WAVEで維持されます。にゃんるなはスキルダメージ+50%・ゲージ獲得+50%。つきねこは基礎HP・攻撃力・防御力と通常射撃に優れます。</p></article><article>${icon('moon')}<h3>キャラ固有の必殺技</h3><p>攻撃した本人のゲージが増加し、100%で <kbd>E</kbd> または右下の必殺ボタン。にゃんるな「月華の聖域」は範囲攻撃・減速・HP回復。つきねこ「星銃・彗星連射」は貫通弾の8連射。オムソロ「翠光・守り手の円舞」は周囲への連続斬撃と回復・短い無敵。雫「紅月の鎌」は連続斬撃とHP吸収。にゃんるなと雫の二人が生存し、両ゲージ100%なら特殊連携「月雫・おかえりの約束」に変化します。へへりあるの「花弓・追いかける約束」は遠くの敵を追尾する魔法矢9連射。プリムの「プリズムブレス」は一直線の貫通攻撃。つきねことプリムの両ゲージが100%なら、二人の攻撃を重ねる「星虹・ふたりの帰り道」が発動します。専用イラストとボイスの演出後に発動します。演出中は画面をタップ（PCはEnter／Space）すると省略して即発動します。演出中は敵も味方も止まり、救出の制限時間も進みません。ゲージはキャラ別に保持し、援護でも蓄積。必殺技自体では増えません。</p></article></div><div class="guide-note">全6章・各章4幕・各幕6WAVE。地形はステージごとに変化。2フロアでは下階を制圧して青い階段から上階へ。分岐では左の緑の門が通常、右の赤い門が強ボスと追加素材。強ボスは同じ難易度の通常ボスに対して${ELITE_BOSS_LABEL}。地図を見て歩いて選ぼう。2WAVEごとに月の門が開きます。光る輪へ移動して次へ進もう。各幕の最後の門でクリア。ミッション報酬を受け取り、メニューから次の幕へ進みます。橙の照準線・突進の帯、紫や桃色の魔法陣から離れよう。<br>ゲームパッド：左スティック移動 / A回避 / B交代 / Y必殺 / Start一時停止。<br>祝福・クリスタルは新しい出撃でリセット。キャラ別のレベル・経験値・覚醒の輝石はこのブラウザに自動保存されます。成長ツリーは素材を使ってキャラごとに解放。「スキルの星」では新しい祝福候補を解放し、出撃前に3枠へセット。共通・二人の連携は枠を使わず自動で候補に入ります。星の芽は通常敵から50%で入手。月のしずくは月の門から1個ずつ、守護者の欠片はボスから入手。1段目はレア度1素材のみ。2段目には第2章・チャレンジモードで集めるレア度2素材も必要です。防御力はキャラ固有値＋レベル成長＋ツリー効果で被ダメージを軽減します。初期上限Lv.20。各章の第4幕クリアでもらえる覚醒の輝石と育成素材で、上限を10ずつ最大Lv.80まで解放できます。石は段階ごとに1・2・4・5・6・8個、Lv.40以降はレア度2素材も必要です。Lv.60の上限解放からは、第4〜6章で集めるレア度3素材も使います。成長ツリーの3段目はLv.60から解放されます。上限到達後の経験値も蓄積されます。<br>ステージミッションで育成素材を入手。ユニーク装備は全キャラ共通の各1枠。同じ装備は一人だけ使用でき、装備画面で仲間どうしの付け替えが可能です。チャレンジモードの時間・被弾条件を達成して入手します。専用武器は別枠の★1〜★4。各幕の全6WAVEクリアで毎回ガチャ券を1枚確定入手。ボスからも5%で追加の専用武器ガチャ券が落ち、メニュー「武器ガチャ」で1枚につき1回使えます。7人の専用武器から均等に抽選。★2が75%、★3が20%、★4が5%。★2〜★4は各キャラ・各レア度に性能の違う3種類。装備画面で自由に付け替えられます。同じ武器・同じレア度の重複だけを星の芽に変換。ガチャでは装備を変更しません。高難度の章ミッションでは追加の覚醒の輝石も入手できます。</div><button id="tutorial-replay" class="secondary">にゃんるなと操作を練習する</button><p class="tutorial-replay-note">にゃんるな1体で最初の戦闘から開始。育成・所持品は引き継ぎます。</p><button class="primary" data-close>準備はできた ${icon('arrow')}</button>`,
  settings:()=>`<div class="modal-heading"><span class="eyebrow">SETTINGS</span><h2>あなたの冒険に合わせて。</h2></div><div class="settings-list"><label><span>${icon('volume')}全体サウンド</span><input id="setting-sound" type="checkbox" ${settings.sound?'checked':''}></label><label><span>${icon('volume')}キャラクターボイス</span><input id="setting-voice" type="checkbox" ${settings.voice?'checked':''}></label><label class="voice-volume-setting"><span>ボイス音量 <output id="voice-volume-value">${Math.round(settings.voiceVolume*100)}%</output></span><input id="setting-voice-volume" aria-label="ボイス音量" type="range" min="0" max="100" value="${Math.round(settings.voiceVolume*100)}"></label><label><span>${icon('moon')}BGM</span><input id="setting-music" type="checkbox" ${settings.music?'checked':''}></label><label><span>${icon('spark')}画質</span><select id="setting-quality"><option value="high" ${settings.quality==='high'?'selected':''}>高画質</option><option value="low" ${settings.quality==='low'?'selected':''}>軽量</option></select></label><label><span>${icon('wind')}画面の揺れ・演出</span><input id="setting-motion" type="checkbox" ${settings.motion?'checked':''}></label></div><p class="subtle">動きが重い場合は「軽量」を選択してください。設定は自動保存されます。</p><button class="primary" data-close>閉じる ${icon('check')}</button>`,
  records:()=>`<div class="modal-heading"><span class="eyebrow">YOUR ADVENTURE</span><h2>星が覚えている、ふたりの軌跡。</h2></div><div class="record-feature">${icon('trophy')}<small>BEST SCORE</small><strong>${record.best.toLocaleString()}</strong></div><div class="record-grid"><div><strong>${record.runs}</strong><span>冒険した回数</span></div><div><strong>${record.wins}</strong><span>守護者の討伐</span></div><div><strong>${record.bestCombo}</strong><span>最大チェイン</span></div><div><strong>${progression.inventory.limitStone}</strong><span>所持する覚醒の輝石</span></div></div><p class="subtle">${record.runs?'次の冒険が、新しい記録になる。':'物語はこれから。最初の冒険へ出発しよう。'}</p><button class="primary" data-close>閉じる ${icon('arrow')}</button>`,
  difficulty:()=>`<div class="modal-heading"><span class="eyebrow">CHOOSE YOUR JOURNEY</span><h2>出撃モードを選ぶ</h2><p>ステージ選択画面でも、いつでも切り替えられます。</p></div>${difficultyCards(difficulty)}`,
};
function updateDifficultyLabels(){
  const extra=actFor(selectedAct).extra,label=actFor(selectedAct).awakening?'覚醒試練 · 単独・Lv.50':extra?'エクストラ · 最高難度':difficultyName(difficulty);
  document.querySelectorAll('[data-difficulty]').forEach(button=>{
    const selected=button.dataset.difficulty===difficulty;
    button.classList.toggle('selected',selected);
    button.setAttribute('aria-pressed',String(selected));
    const status=button.querySelector('[data-mode-selection]');if(status)status.textContent=selected?'選択中':'選ぶ';
  });
  if($('#chapter-start')){
    $('#chapter-start').dataset.mode=actFor(selectedAct).awakening?'awakening':extra?'extra':difficulty;
    $('#chapter-start').setAttribute('aria-label',`ステージ開始：${actLabel(selectedAct)}、${label}`);
  }
}
function chooseDifficulty(mode){
  if(game||!['normal','hard'].includes(mode))return;
  difficulty=mode;if(activeDialog==='stage'){const focused=document.activeElement?.dataset.difficulty;$('#modal-content').innerHTML=dialogs.stage();if(focused)$(`[data-difficulty="${focused}"]`)?.focus({preventScroll:true});}updateDifficultyLabels();
  announce(`${difficultyName(mode)}を選択しました。選んだ幕の全6WAVEに適用されます。`);
}
function persistParty(){save(PARTY_KEY,{members:selectedParty,lead:HEROES[selectedHero].id});}
function updatePartyLabels(){

  updateGrowthLabels();
  if($('#journey-party-faces'))$('#journey-party-faces').innerHTML=selectedParty.map(id=>portrait(HEROES.findIndex(h=>h.id===id))).join('');

}
function renderPartyDialog(){if(activeDialog!=='party')return;const scroll=$('#modal').scrollTop,expanded=$('.party-blessings')?.open;$('#modal-content').innerHTML=dialogs.party()+`<button class="dialog-close icon-button" data-close aria-label="閉じる">${icon('close')}</button>`;if(expanded)$('.party-blessings').open=true;$('#modal').scrollTop=scroll;if(!storageAvailable)$('.party-save-note').textContent='この環境では編成・スキル候補を保存できません。この画面では設定を維持します。';}
function openDialog(type){
  if(activeDialog||(type==='party'&&game))return;
  if(type==='party'||type==='stage')updatePartyLabels();
  audio.init();audio.play('click');returnFocus=document.activeElement;activeDialog=type;
  $('#modal').classList.toggle('talent-explanation',type==='talent');
  if(type==='talent')talentDialogScroll=$('#chapter-menu').scrollTop;
  $('#modal-content').innerHTML=dialogs[type]()+(['stage','talent'].includes(type)?'':`<button class="dialog-close icon-button" data-close aria-label="閉じる">${icon('close')}</button>`);
  const title=type==='stage'?'stage-brief-title':type==='talent'?'talent-explanation-title':null;
  if(title)$('#modal').setAttribute('aria-labelledby',title);else $('#modal').removeAttribute('aria-labelledby');
  $('#modal').showModal();
  if(type==='stage'){updateDifficultyLabels();$('#stage-brief-title').focus({preventScroll:true});}
  if(type==='talent'){$('#modal').scrollTop=0;$('#talent-explanation-title').focus({preventScroll:true});$('#chapter-menu').scrollTop=talentDialogScroll;}
  bindSettings();
}
function closeDialog(){
  if(['upgrade','result','story'].includes(activeDialog))return;
  if(activeDialog==='weapon-result'){closeWeaponSummon();return;}
  if(activeDialog==='pause'){audio.init();audio.setPaused(false);if(!ultimatePresentation.resume()){game?.resume();voice.resume();}}
  const talent=activeDialog==='talent';
  $('#modal').close();if(activeDialog==='stage'||talent)$('#modal-content').replaceChildren();
  $('#modal').removeAttribute('aria-labelledby');$('#modal').classList.remove('talent-explanation');
  activeDialog=null;tutorialView.render(game);resetInput();returnFocus?.focus?.(talent?{preventScroll:true}:undefined);
  if(talent){$('#chapter-menu').scrollTop=talentDialogScroll;talentDialogScroll=null;}
}
function bindSettings(){
  ['sound','music','quality','motion','voice'].forEach(key=>{const el=$(`#setting-${key}`);if(!el)return;el.addEventListener('change',()=>{settings[key]=key==='quality'?el.value:el.checked;audio.setEnabled(settings.sound);audio.setMusic(settings.music);voice.configure(settings.voice,settings.voiceVolume);world.settings.motion=settings.motion;world.setQuality(settings.quality);document.body.classList.toggle('reduce-motion',!settings.motion);titleVideo.sync();save('lunaria-settings-v1',settings);});});
  $('#setting-voice-volume')?.addEventListener('input',e=>{settings.voiceVolume=Number(e.target.value)/100;voice.configure(settings.voice,settings.voiceVolume);$('#voice-volume-value').textContent=`${e.target.value}%`;save('lunaria-settings-v1',settings);});
}
function pause(){if(!game||!(ultimatePresentation.active?ultimatePresentation.pause():game.pause()))return;voice.suspend();resetInput();activeDialog='pause';audio.setPaused(true);tutorialView.render(game,true);audio.play('click');$('#modal-content').innerHTML=`<div class="pause-symbol">${icon('moon')}</div><div class="modal-heading"><span class="eyebrow">TAKE A BREATH</span><h2>月明かりの下で、ひと休み。</h2><p>WAVE ${game.wave} / 6 <i>·</i> ${minutes(game.time)}</p></div><div class="run-materials"><small>この冒険で獲得した成長素材</small><p>${materialsText(game.earnedMaterials)}</p>${ticketRewardText(game.earnedWeaponTickets)}${game.earnedRareStones?`<p>レア討伐 ${game.goldenSlimeKills+game.goldenHeheKills}体：覚醒の輝石 +${game.earnedRareStones}個</p>`:''}</div><button id="resume" class="primary">冒険をつづける ${icon('play')}</button><button id="quit" class="secondary">冒険を終了してメニューへ</button><p class="subtle">キャラの成長・獲得素材は保存済み。クリスタルと祝福は終了時にリセットされます。</p><div class="enemy-guide"><h3>この幕のボス · ${game.actConfig.boss}</h3><p>${game.actConfig.extra?extraCombatHint(game.actConfig):BOSSES[game.actConfig.bossId].hint}</p><h3>新しい敵の見分け方</h3>${(game.actConfig.extra||game.actConfig.chapter>=1?enemyRosterForAct(game.act):['archer','mage','charger']).map(id=>`<p><b>${ENEMY_TYPES[id].name}</b> ${ENEMY_TYPES[id].hint}</p>`).join('')}</div>${game.actConfig.chapter===2&&!game.actConfig.extra?`<p class="subtle">${GOLDEN_SLIME.name}：${GOLDEN_SLIME.hint}</p>`:''}${floorGuide(game)}${currentMissions(progression,game)}`;$('#modal').showModal();}
function upgrade(){
  activeDialog='upgrade';resetInput();$('#modal-content').innerHTML=`<div class="modal-heading upgrade-heading"><span class="eyebrow">CRYSTAL BLESSING · STAGE 0${game.area+1}</span><h2>スキルを1つ選ぶ</h2><p>この幕の最後まで、出撃メンバーを強くする力をひとつ。</p><div class="blessing-party">${icon(game.hasPartner?'link':'star')}<span>${partyTitle(game.party,HEROES)}</span><b>${game.party.length}体編成</b></div><div class="blessing-affinity">${game.party.includes('nyanluna')?'にゃんるなの必殺技・星屑・周回星は威力1.5倍':game.party.includes('omsolo')?'オムソロは扇状の近接斬撃と守りが得意':'つきねこは高い基礎能力と貫通射撃が得意'}</div></div><div class="skill-options">${game.offers.map(s=>`<button class="skill-card" data-skill="${s.id}"><span class="skill-type">${s.type}<span>${game.rank(s.id)?`Lv. ${game.rank(s.id)+1}`:'NEW'}</span></span><div class="skill-emblem">${icon(s.icon)}</div><h3>${s.name}</h3><div class="skill-card-meta"><small class="blessing-source" data-source="${s.requires?.length===2?'pair':s.requires?.[0]??'common'}" title="${blessingSource(s,HEROES)}">${s.requires?.length===1?HEROES.find(h=>h.id===s.requires[0]).name:blessingSource(s,HEROES)}</small>${s.upgrades?`<small class="skill-upgrade-label">${skillUpgradeLabel(s)}</small>`:''}</div><p>${s.text}</p><span class="skill-select">この力を選ぶ ${icon('arrow')}</span></button>`).join('')}</div><div class="upgrade-footer">${icon('link')} 祝福はこの幕の全6WAVEで継続。新しい出撃でリセット。</div>`;$('#modal').classList.add('wide');if(!$('#modal').open)$('#modal').showModal();
}
function showResult(victory){
  if(resultSaved)return;resultSaved=true;resetInput();
  const mult=game.difficulty==='hard'?1.5:1,score=Math.round((game.kills*100+game.maxCombo*25+game.blessingsTaken*50+(victory?5000:0))*mult),best=score>record.best;
  const recruited=game.recruitedHeroId,earnedXp={...game.earnedXp},earnedMaterials={...game.earnedMaterials},earnedMissions=[...game.earnedMissions],earnedWeaponTickets=game.earnedWeaponTickets,clearRewardTickets=game.clearRewardTickets;
  const act=game.act,chapterStones=victory&&actFor(act).number===4?1:0,stones=chapterStones+game.earnedRareStones;record.runs++;if(victory){record.wins++;record.chapterOneCleared=progression.story.chapterOneCleared;if(chapterStones)grantLimitStone(progression,chapterStones);}
  record.best=Math.max(record.best,score);record.bestCombo=Math.max(record.bestCombo,game.maxCombo);save('lunaria-record-v1',record);persistProgression();updateGrowthLabels();
  if(victory&&(storyEnabled||game.actConfig.extra)){playStory('ending',()=>goMenu({score,earnedXp,earnedMaterials,earnedMissions,earnedWeaponTickets,clearRewardTickets,best,stones,recruited,act}));return;}
  activeDialog='result';$('#modal').classList.remove('wide');$('#modal-content').innerHTML=`<div class="result ${victory?'victory':'defeat'}"><div class="result-symbol">${icon(victory?'trophy':'moon')}</div><span class="eyebrow">${victory?'THE MOON GATE IS OPEN':'EVERY JOURNEY MAKES US STRONGER'}</span><h2>${victory?'VICTORY':'JOURNEY ENDS'}</h2>${recruited?recruitmentBanner(recruited):''}<p class="result-copy">${victory?'月の門は、ふたりの未来へ。':game.rescue?.remaining===0?'結界が尽き、救出に間に合いませんでした。育成と装備を整えて、もう一度。':'この経験も、次の一歩になる。'}</p><div class="result-portraits">${game.partyHeroes.map(i=>portrait(i)).join(icon('link'))}</div><div class="result-score"><small>${best?'NEW BEST SCORE':'TOTAL SCORE'}</small><strong>${score.toLocaleString()}</strong></div><div class="result-stats"><div><b>${game.kills}</b><span>撃破数</span></div><div><b>${game.maxCombo}</b><span>最大CHAIN</span></div><div><b>${minutes(game.time)}</b><span>冒険時間</span></div></div><div class="reward">${stones?`${icon('crystal')} 覚醒の輝石 <strong>+${stones}</strong>`:'キャラの成長は次の冒険へ'}<span>${earnedXpText(earnedXp)}</span><span class="result-materials">${materialsText(earnedMaterials)}</span>${ticketRewardText(earnedWeaponTickets,clearRewardTickets)}<span>${storageAvailable?'レベル・経験値を保存しました':'この環境では記録を保存できません'}</span></div>${missionRunSummary(earnedMissions)}<button id="retry" class="primary">もう一度、冒険へ ${icon('reset')}</button><button id="home-button" class="secondary">メニューへ戻る</button></div>`;if(!$('#modal').open)$('#modal').showModal();announce(victory?`${actLabel(act)}をクリアしました。`:'冒険が終了しました。');
}
function start({withStory=true,withTutorial=withStory&&selectedAct===0&&needsFirstBattleTutorial(progression),skipOpening=false}={}){
  if(!world?.assetsReady)return;ultimatePresentation.cancel();voice.stop();voice.cooldowns.clear();voice.suspended=false;voice.setMode('battle');story.cancel();pendingStory=null;storyEnabled=withStory;$('#chapter-menu').classList.add('hidden');audio.init();audio.play('wave');$('#modal').close();$('#modal').removeAttribute('aria-labelledby');$('#modal-content').replaceChildren();$('#modal').classList.remove('wide');activeDialog=null;persistProgression();game=new Adventure({hero:selectedHero,difficulty,progression,party:selectedParty,tutorial:withTutorial,act:selectedAct});selectedAct=game.act;lastHero=-1;lastSkills='';progression=game.progression;resultSaved=false;world.reset();$('#home').classList.add('hidden');titleVideo.setVisible(false);$('#hud').classList.remove('hidden');document.body.classList.add('playing');$('#control-hint').classList.remove('hidden');accumulator=0;resetInput();$('#start').blur();handleEvents(game.drainEvents());preloadUltimateArt([...game.party,...(game.party.includes('nyanluna')&&hasNyanAwakening(progression)?['nyanlunaAwakened']:[])]);voice.preload(game.party.flatMap(who=>['attack','hurt','ultimate','switch'].map(event=>BATTLE_VOICES[who]?.[event]?.[0]?.id).filter(Boolean)));updateHud();audio.tick(musicScene(game));if(withStory&&!skipOpening)playStory('opening');
}
function goHome(){updateDifficultyLabels();ultimatePresentation.cancel();voice.setMode('menu');voice.stop();persistProgression();updateGrowthLabels();story.cancel();pendingStory=null;$('#chapter-menu').classList.add('hidden');$('#exit-guide').classList.add('hidden');game=null;audio.tick('menu');tutorialView.render(null);updatePartyLabels();numberContext.clearRect(0,0,numberCanvas.width,numberCanvas.height);$('#modal').close();$('#modal').removeAttribute('aria-labelledby');$('#modal-content').replaceChildren();$('#modal').classList.remove('wide');activeDialog=null;$('#hud').classList.add('hidden');$('#home').classList.remove('hidden');titleVideo.setVisible(true);$('#boss-hud').classList.add('hidden');$('#wave-banner').classList.remove('visible');$('#ultimate-banner').classList.remove('visible');$('#toast').classList.remove('visible');document.body.classList.remove('playing');world.reset();resetInput();clearTimeout(bannerTimer);clearTimeout(ultimateBannerTimer);clearTimeout(toastTimer);$('#start').focus();}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2300);}
function announce(message){$('#announcer').textContent=message;}
function resetInput(){keys.clear();stick.id=null;stick.x=stick.y=0;$('#joystick').classList.add('hidden');}
function playStory(id,done){
  if(!storyScenesFor(game?.act??selectedAct)){done?.();return;}
  if(!storyEnabled&&id!=='replay'){done?.();return;}
  const run=game,wasPlaying=run?.phase==='playing';if(wasPlaying)run.pause();resetInput();activeDialog='story';tutorialView.voiceStep=null;tutorialView.render(game,true);
  clearTimeout(bannerTimer);$('#wave-banner').classList.remove('visible');$('#modal').close();
  const scenes=storyScenesFor(run?.act??selectedAct);
  const scene=id==='replay'?{...scenes.opening,title:actFor(selectedAct).title,next:'メニューへ',lines:Object.values(scenes).flatMap(s=>s.lines.map(line=>({...line,area:s.area,act:s.act})))}:scenes[id];
  story.show(scene,()=>{activeDialog=null;resetInput();if(run&&game!==run)return;if(wasPlaying)run.resume();voice.setMode(run?.tutorial?.active?'tutorial':run?'battle':'menu');done?.();updateHud();if(game?.phase==='playing')canvas.focus();});
}
function earnedXpText(earned){return HEROES.map(h=>`${h.name} EXP +${earned[h.id]??0}`).join(' ／ ');}
function updateGrowthLabels(){
  document.querySelectorAll('[data-hero-level]').forEach(el=>{const id=el.dataset.heroLevel;el.textContent=!isHeroUnlocked(progression,id)?recruitmentNote(id):`Lv.${heroLevel(id)}${el.tagName==='EM'?` · ${HEROES.find(h=>h.id===id).role}`:''}`;});
  if($('#limit-stones'))$('#limit-stones').textContent=progression.inventory.limitStone.toLocaleString();
}
function ticketRewardText(count=0,clearTickets=0){return count?`<span class="run-ticket-reward">専用武器ガチャ券 +${count}枚${clearTickets===1?'（幕クリア保証1枚を含む）':clearTickets?`（クリア報酬${clearTickets}枚を含む）`:''}</span>`:'';}
let currentWeaponDraw=null,lastWeaponDrawCount=1;
const weaponResultMarkup=()=>Array.isArray(currentWeaponDraw)?weaponBatchResult(currentWeaponDraw,progression,storageAvailable):weaponDrawResult(currentWeaponDraw,progression,storageAvailable);
function summonWeapon(amount=1){
  if(game||activeDialog||$('#chapter-menu').classList.contains('hidden'))return;
  const results=drawWeapons(progression,amount);if(!results)return;
  const result=results.reduce((best,next)=>next.item.rarity.rank>best.item.rarity.rank?next:best);
  // Persist the roll before displaying it; closing or reloading never rerolls it.
  persistProgression();renderRewards();$('#growth-cards').innerHTML=growthCards(progression);
  currentWeaponDraw=amount===1?result:results;lastWeaponDrawCount=amount;activeDialog='weapon-result';audio.init();
  const motion=settings.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!weaponSummon.start(result,{motion,quality:settings.quality,markup:weaponResultMarkup(),batch:amount===10?results:null})){activeDialog=null;return;}
  if(motion)announce(`${amount===10?'10連ガチャの':'専用武器を'}召喚中。画面をタップするとスキップできます。`);
}
// The first close request (Esc, back, close button) finishes an unfinished summon; a second
// request within 350 ms of the result appearing is treated as the same press.
function closeWeaponSummon(){
  if(weaponSummon.skip()||performance.now()-summonFinishedAt<350)return;
  weaponSummon.close();activeDialog=null;currentWeaponDraw=null;resetInput();
  ($(lastWeaponDrawCount===10?'[data-draw-weapons]:not(:disabled)':'[data-draw-weapon]:not(:disabled)')??$('[data-draw-weapon]:not(:disabled)')??$('[data-menu-tab="weapons"]'))?.focus({preventScroll:true});
}
function missionRunSummary(ids=[]){return ids.length?`<div class="mission-run-rewards">ミッション ${ids.length}件達成<br>${ids.map(id=>STAGE_MISSIONS.find(m=>m.id===id)).filter(Boolean).map(m=>`${m.name}：${missionRewardText(m)}`).join('<br>')}</div>`:'';}
function renderRewards(){
  if($('#weapons-panel'))$('#weapons-panel').innerHTML=weaponGachaView(progression);
  if($('#missions-panel'))$('#missions-panel').innerHTML=missionsView(progression,actFor(selectedAct).extra?chapterForAct(selectedAct).start:selectedAct);
  if($('#equipment-content')){
    const expanded=new Set([...document.querySelectorAll('[data-equipment-detail][open]')].map(el=>el.dataset.equipmentDetail));
    $('#equipment-content').innerHTML=equipmentView(progression,equipmentHero,equipmentCategory);
    document.querySelectorAll('[data-equipment-detail]').forEach(el=>{el.open=expanded.has(el.dataset.equipmentDetail);});
  }
}
function switchMenuTab(tab){
  if(!['adventure','growth','talent','missions','equipment','weapons'].includes(tab))return;$('#journey-page-title').textContent=({adventure:'ステージ選択',growth:'キャラ育成',talent:'成長ツリー',missions:'ミッション',equipment:'装備',weapons:'武器ガチャ'})[tab];if(tab==='talent')renderTalent();if(tab==='weapons')summonView.preload();if(['missions','equipment','weapons'].includes(tab))renderRewards();
  for(const key of ['adventure','growth','talent','missions','equipment','weapons']){const active=key===tab;$(`#${key}-panel`).classList.toggle('hidden',!active);$(`[data-menu-tab="${key}"]`).setAttribute('aria-pressed',String(active));}
}
function renderTalent({preserveView=false}={}){
  const root=$('#tree-content');if(!root)return;
  const top=$('#chapter-menu').scrollTop,openDetails=[...root.querySelectorAll('details')].map(el=>el.open),pickerLeft=root.querySelector('.tree-hero-picker')?.scrollLeft??0;
  const visibleTier=preserveView?Number(root.querySelector('[data-tree-tier][aria-pressed="true"]')?.dataset.treeTier):undefined;
  root.innerHTML=talentView(progression,treeHero,treeSelection,blessingSlot,{visibleTier});
  if(preserveView){
    root.querySelectorAll('details').forEach((el,i)=>el.open=openDetails[i]??false);
    root.querySelector('.tree-hero-picker').scrollLeft=pickerLeft;$('#chapter-menu').scrollTop=top;
  }
}
function chooseTreeHero(id){if(game||!isHeroUnlocked(progression,id))return;treeHero=id;blessingSlot=0;const tier=talentNode(treeSelection,treeHero)?.tier;treeSelection=tier===4?'demonGate':tier===3?'blessing1':tier===2?'ascension':'origin';renderTalent();$('#tree-feedback').textContent='';$(`[data-tree-hero="${id}"]`).focus({preventScroll:true});}
function chooseTreeNode(id){
  const node=talentNode(id,treeHero);if(game||activeDialog||!node)return;
  treeSelection=id;renderTalent({preserveView:true});$(`[data-tree-node="${id}"]`).focus({preventScroll:true});announce(`${node.name}、${nodeEffectText(node)}。`);
  if(innerWidth<=760)openDialog('talent');
}
function applyTalent(heroId,nodeId){
  if(game||heroId!==treeHero||!isHeroUnlocked(progression,heroId)||!unlockTalent(progression,heroId,nodeId))return;
  const treeTop=talentDialogScroll??$('#chapter-menu').scrollTop;
  if(activeDialog==='talent')closeDialog();
  persistProgression();updateGrowthLabels();renderTalent({preserveView:true});$('#growth-cards').innerHTML=growthCards(progression);audio.play('upgrade');
  const node=talentNode(nodeId,heroId),hero=HEROES.find(h=>h.id===heroId);
  presentTalentUnlock($('#tree-content'),node,{motion:settings.motion});
  $('#tree-feedback').textContent=`${hero.name}の「${node.name}」を解放。${nodeEffectText(node)}。${storageAvailable?'保存しました。':'この環境では保存できません。'}`;
  $(`[data-tree-node="${nodeId}"]`).focus({preventScroll:true});announce(`${hero.name}の${node.name}を解放しました。`);
  $('#chapter-menu').scrollTop=treeTop;
}
function recruitmentBanner(id){if(id==='lumi')return `<section class="recruitment-banner" aria-label="仲間加入"><span class="portrait lumi"></span><div><small>FINGERTIP LIGHT · OUR WAY HOME</small><strong>るみが仲間になった！</strong><p>指先のレールガンで直線貫通攻撃。もちにゃふぇと組むとねこるみになり、通常攻撃・援護・必殺技が射程無限。8人の仲間から最大2人で出撃できます。</p></div></section>`;if(id==='hehereal')return `<section class="recruitment-banner" aria-label="仲間加入"><span class="portrait hehereal" role="img" aria-label="へへりある"></span><div><small>SAKURA & RICE · OUR PROMISE</small><strong>へへりあるが仲間になった！</strong><p>桜の魔法弓で遠距離の敵を追尾。必殺技は追尾矢9連射。編成・育成・装備から、8人の仲間のうち最大2人で出撃できます。</p></div></section>`;if(id==='prim')return `<section class="recruitment-banner" aria-label="仲間加入"><span class="portrait prim" role="img" aria-label="プリム"></span><div><small>OUR WAY HOME</small><strong>プリムが仲間になった！</strong><p>爪と一直線のプリズムブレスで戦う小竜。つきねこと組むとHP・攻撃+12%／ゲージ+20%。二人のゲージ100で連携技。搭乗ボタンで大きくなり、12秒間二人がメインで攻撃・被弾。移動はオムソロと同じ速さ。終了後20秒で再搭乗できます。</p></div></section>`;if(id==='shizuku')return `<section class="recruitment-banner" aria-label="仲間加入"><span class="portrait shizuku" role="img" aria-label="雫"></span><div><small>ALWAYS BY YOUR SIDE</small><strong>雫が仲間になった！</strong><p>大鎌で近接攻撃、実ダメージの10%をHP吸収。にゃんるなと組むとHP・攻撃+12%／ゲージ+20%。二人のゲージ100で特殊連携「月雫・おかえりの約束」が発動。</p></div></section>`;if(id==='mochinyafe')return `<section class="recruitment-banner" aria-label="仲間加入"><span class="portrait mochinyafe" role="img" aria-label="もちにゃふぇ"></span><div><small>NO LONGER ALONE</small><strong>もちにゃふぇが仲間になった！</strong><p>援護の「ふぇ〜」で雑魚を停止、ボスの攻撃・防御を低下。初期は最弱、Lv.50で最強へ育つ大器晩成型。パーティ編成から4人のうち最大2人を選べます。</p></div></section>`;const hero=HEROES.find(h=>h.id===id);return `<section class="recruitment-banner" aria-label="仲間加入"><span class="portrait ${id}" role="img" aria-label="${hero.name}"></span><div><small>${id==='omsolo'?'RESCUE COMPLETE':'REUNITED'}</small><strong>${id==='omsolo'?'オムソロが仲間になった！':'つきねこと、また一緒に！'}</strong><p>${id==='omsolo'?'緑の光刃で戦う近接の剣士。編成・祝福から仲間を入れ替えて、最大2人で出撃できます。':'大の仲良しの二人が再会。編成・育成・装備が解放されました。'}</p></div></section>`;}
function goMenu(result){
  const winningHero=game?HEROES[game.player.hero].id:HEROES[selectedHero].id;
  if(result)selectedAct=actFor(result.act).extra||actFor(result.act).awakening?result.act:nextStoryAct(result.act);goHome();equipmentHero=HEROES[selectedHero].id;treeHero=HEROES[selectedHero].id;treeSelection='origin';$('#home').classList.add('hidden');titleVideo.setVisible(false);const chapter=chapterForAct(selectedAct),cleared=progression.story.actClears.slice(chapter.start,chapter.end+1).every(Boolean);
  $('#chapter-menu').innerHTML=`<div class="chapter-shell">
    <header class="journey-header"><div class="journey-heading">${icon('compass')}<div><small>LUNANECO ADVENTURE</small><h1 id="journey-page-title">ステージ選択</h1></div></div><div class="journey-tools"><button class="journey-party" id="menu-party-open" data-open="party"><span id="journey-party-faces" aria-hidden="true"></span><b>パーティ</b>${icon('chevron')}</button><button class="icon-button" data-open="settings" aria-label="設定">${icon('settings')}</button><button id="menu-title" class="icon-button" aria-label="タイトルへ戻る">${icon('close')}</button></div></header>
    <nav class="menu-tabs" aria-label="メニュー切り替え">${[['adventure','compass','ステージ'],['growth','spark','育成'],['talent','link','成長ツリー'],['missions','trophy','ミッション'],['equipment','gun','装備'],['weapons','star','武器ガチャ']].map(([key,symbol,label])=>`<button data-menu-tab="${key}" aria-pressed="${key==='adventure'}">${icon(symbol)}<span>${label}</span></button>`).join('')}</nav>
    <div id="adventure-panel">
    ${result?.recruited?recruitmentBanner(result.recruited):''}${result?`<section class="chapter-reward" aria-label="クリア報酬"><strong>${actLabel(result.act)}「${actFor(result.act).title}」クリア</strong><span>${result.best?'NEW BEST':'SCORE'} <b>${result.score.toLocaleString()}</b></span>${result.stones?`<span>覚醒の輝石 <b>+${result.stones}</b></span>`:''}<small>${earnedXpText(result.earnedXp)}</small><small class="result-materials">${materialsText(result.earnedMaterials)}</small>${ticketRewardText(result.earnedWeaponTickets,result.clearRewardTickets)}<small>${storageAvailable?'レベル・経験値・クリア報酬を保存しました':'この環境では記録を保存できません'}</small></section>${missionRunSummary(result.earnedMissions)}`:''}
    ${stageSelectionView(chapter.id,progression)}</div>
    <section id="growth-panel" class="growth-panel hidden" aria-label="キャラ育成"><div class="growth-intro"><div><span class="eyebrow">CHARACTER GROWTH</span><h2>冒険は、仲間の力に。</h2><p>冒険でレベルアップ。素材で、さらに強く。</p></div><div class="stone-wallet">${materialArt('limitStone')}<span>覚醒の輝石<b id="limit-stones">${progression.inventory.limitStone}</b></span></div></div><p id="growth-feedback" class="growth-feedback" role="status"></p><div id="growth-cards" class="growth-cards">${growthCards(progression)}</div>${storageAvailable?'':'<p role="status">この環境では記録を保存できません。</p>'}</section>
    <section id="talent-panel" class="talent-panel hidden" aria-label="成長ツリー"><div class="talent-intro"><span class="eyebrow">CONSTELLATION GROWTH</span><h2>星をつなぎ、力を育てる。</h2><p>星を選んで、能力やスキルを解放。</p></div><p id="tree-feedback" class="growth-feedback" role="status"></p><div id="tree-content">${talentView(progression,treeHero,treeSelection,blessingSlot)}</div></section>
    <section id="missions-panel" class="hidden" aria-label="ステージミッション">${missionsView(progression,actFor(selectedAct).extra?chapterForAct(selectedAct).start:selectedAct)}</section><section id="equipment-panel" class="hidden" aria-label="装備"><p id="equipment-feedback" class="equipment-feedback" role="status"></p><div id="equipment-content">${equipmentView(progression,equipmentHero,equipmentCategory)}</div></section><section id="weapons-panel" class="hidden" aria-label="専用武器ガチャ">${weaponGachaView(progression)}</section>
    <footer class="journey-footer"><span>月の旅路</span><div><button data-open="guide">${icon('book')} 遊び方</button><button data-open="records">${icon('trophy')} 記録</button></div></footer></div>`;
  if(result&&actFor(result.act).awakening==='nyanluna'&&hasNyanAwakening(progression))$('#adventure-panel').insertAdjacentHTML('afterbegin',`<section class="rice-result" aria-label="にゃんるな覚醒 習得"><strong>にゃんるなの覚醒を習得！</strong><p>${NYAN_AWAKENING_HELP}</p></section>`);
  if(result&&actFor(result.act).awakening==='rice'&&hasRicePower(progression))$('#adventure-panel').insertAdjacentHTML('afterbegin',`<section class="rice-result" aria-label="ライスの力 習得"><strong>ライスの力を習得！</strong><p>${RICE_HELP}</p><small>効果終了後10秒で再使用。ポーズ・会話・必殺技カットイン中は残り時間が停止します。交代・戦闘終了で反射を解除します。</small></section>`);
  if(result&&actFor(result.act).endgame&&hasFreeSkillLoadout(progression))$('#adventure-panel').insertAdjacentHTML('afterbegin','<section class="rice-result" aria-label="全員のスキル付け替え 解放"><strong>全員のスキル・全3枠の付け替えを解放！</strong><p>どの編成でも、パーティ画面から全員のスキルを自由に設定できます。未解放の上位版も選べます。設定は無料・自動保存です。</p><button class="secondary" data-open="party">パーティでスキルを設定する</button></section>');
  if(chapter.id===6)$('#adventure-panel').insertAdjacentHTML('afterbegin','<p class="chapter-seven-brief">推奨Lv.60 · 各幕の初回はもちにゃふぇ固定。荒らされた村を守り、アンチケモみみ集団と戦います。第1幕の出会いの後、るみがNPC援護。2人編成ではNPCなし。第4幕クリアでるみ正式加入、クリアした幕は自由編成。もちにゃふぇとるみを組むとねこるみになり、レールガンの射程は無限。</p>');
  if(chapter.id===5)$('#adventure-panel').insertAdjacentHTML('afterbegin','<p class="chapter-six-brief">推奨 Lv.60 · 各幕の初回クリアまではオムソロ操作固定。クリアした幕は自由編成。2人編成ではNPCへへりあるは参加しません。第1幕でおむすびを分けた後、へへりあるが援護に参加。第4幕クリアで正式加入。黄金のへへへは各幕で一度だけ20%抽選。</p>');
  updateDifficultyLabels();updatePartyLabels();$('#chapter-menu').classList.remove('hidden');$('#chapter-menu').focus({preventScroll:true});$('#chapter-menu').scrollTop=0;announce(`第${chapter.id+1}章${cleared?'クリア':''}。メニューで編成やステージを選べます。`);
  if(result){voice.cue(winningHero,'victory');if(result.recruited)voice.cue(result.recruited,'recruit');}
}
function axes(){
  let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x;
  let y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+stick.y;
  const pad=navigator.getGamepads?.()[0];if(pad){x+=Math.abs(pad.axes[0])>.17?pad.axes[0]:0;y+=Math.abs(pad.axes[1])>.17?pad.axes[1]:0;}
  const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}return {x:x*.789+y*.614,z:-x*.614+y*.789};
}
function action(kind){audio.init();if(!game||game.phase!=='playing')return;const a=axes();if(kind==='rice'){if(game.activateRice()){handleEvents(game.drainEvents());updateHud();}return;}if(kind==='awakening'){if(game.awakenNyan()){handleEvents(game.drainEvents());updateHud();}return;}if(kind==='predation'){if(game.predate()){handleEvents(game.drainEvents());updateHud();}return;}if(kind==='mount'){if(game.mountPrim()){handleEvents(game.drainEvents());updateHud();}return;}if(kind==='dash')game.dash(a.x,a.z);if(kind==='switch'&&game.switchHero())updateHud();if(kind==='ultimate'){if(ultimatePresentation.start(game)){cutinPointer=null;cutinTap=false;audio.play('ultimateReveal');resetInput();clearTimeout(toastTimer);$('#toast').classList.remove('visible');clearTimeout(bannerTimer);$('#wave-banner').classList.remove('visible');$('#ultimate-banner').classList.remove('visible');updateHud();}else toast(game.ultimateActive(game.player.hero)?'この仲間の必殺技は発動中':`${HEROES[game.player.hero].name}の必殺ゲージをためよう · ${Math.floor(game.player.charge)}%`);}}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.id==='tutorial-next'&&game?.advanceTutorial()){resetInput();handleEvents(game.drainEvents());updateHud();canvas.focus();}
  if(target.id==='tutorial-skip'&&game?.skipTutorial()){handleEvents(game.drainEvents());updateHud();canvas.focus();}
  if(target.id==='tutorial-replay'&&!game){closeDialog();start({withTutorial:true,skipOpening:true});}
  if(target.dataset.open)openDialog(target.dataset.open);
  if(target.hasAttribute('data-prepare-levels')&&!game){treeHero=HEROES[selectedHero].id;treeSelection='limit30';switchMenuTab('talent');$('#talent-panel').scrollIntoView({block:'start',behavior:'instant'});}
  if(target.hasAttribute('data-close'))closeDialog();

  if(target.dataset.partyToggle&&!game){selectedParty=changeParty(selectedParty,target.dataset.partyToggle,unlockedRoster());if(!selectedParty.includes(HEROES[selectedHero].id))selectedHero=HEROES.findIndex(h=>h.id===selectedParty[0]);persistParty();updatePartyLabels();renderPartyDialog();$(`[data-party-toggle="${target.dataset.partyToggle}"]`)?.focus({preventScroll:true});}
  if(target.dataset.partyLead&&!game){const index=Number(target.dataset.partyLead);if(selectedParty.includes(HEROES[index]?.id)){selectedHero=index;persistParty();updatePartyLabels();renderPartyDialog();}}
  if(!game&&activeDialog==='party'&&hasFreeSkillLoadout(progression)){
    if(target.dataset.partySkillHero&&selectedParty.includes(target.dataset.partySkillHero)){partySkillHero=target.dataset.partySkillHero;partySkillSlot=0;renderPartyDialog();$(`[data-party-skill-hero="${partySkillHero}"]`)?.focus({preventScroll:true});}
    if(target.hasAttribute('data-party-skill-slot')){const slot=Number(target.dataset.partySkillSlot);if(Number.isInteger(slot)&&slot>=0&&slot<3){partySkillSlot=slot;renderPartyDialog();$(`[data-party-skill-slot="${slot}"]`)?.focus({preventScroll:true});}}
    const hero=$('#party-skill-loadout [data-blessing-hero]')?.dataset.blessingHero;
    if(target.dataset.partyEquipSkill&&target.dataset.blessingHero===hero&&selectedParty.includes(hero)&&equipSkill(progression,hero,partySkillSlot,target.dataset.partyEquipSkill)){
      persistProgression();renderPartyDialog();audio.play('click');const skill=SKILLS.find(s=>s.id===target.dataset.partyEquipSkill),message=`枠${partySkillSlot+1}に「${skill.name}」をセット。${storageAvailable?'保存しました。':'この環境では保存できません。'}`;$('#party-skill-feedback').textContent=message;announce(message);$(`[data-party-skill-slot="${partySkillSlot}"]`)?.focus({preventScroll:true});
    }
  }
  if(target.dataset.equipWeapon&&!game&&!$('#chapter-menu').classList.contains('hidden')&&(!activeDialog||activeDialog==='weapon-result')){
    const id=target.dataset.equipWeapon,hero=target.dataset.weaponHero;
    if(equipWeapon(progression,hero,id)){voice.cue(hero,'equip');persistProgression();renderRewards();$('#growth-cards').innerHTML=growthCards(progression);const message=`${weaponVariant(id).weapon.name}を装備しました。${storageAvailable?'保存しました。':'この環境では保存できません。'}`;$('#equipment-feedback').textContent=message;announce(message);audio.play('upgrade');if(activeDialog==='weapon-result'&&currentWeaponDraw){weaponSummon.updateResult(weaponResultMarkup());$('#weapon-draw-result [data-close]').focus({preventScroll:true});}else{$(`[data-weapon-option="${id}"]`).scrollIntoView({block:'nearest'});$(`[data-weapon-option="${id}"] summary`)?.focus({preventScroll:true});}}
  }
  if(target.hasAttribute('data-draw-weapon'))summonWeapon();
  if(target.hasAttribute('data-draw-weapons'))summonWeapon(10);
  if(target.hasAttribute('data-summon-skip'))weaponSummon.skip();
  if(target.hasAttribute('data-open-weapons')&&!game){switchMenuTab('weapons');$('#weapons-panel').scrollIntoView({block:'start'});}
  if(target.dataset.equipmentHero&&!game&&isHeroUnlocked(progression,target.dataset.equipmentHero)){equipmentHero=target.dataset.equipmentHero;renderRewards();$('#equipment-feedback').textContent='';$(`[data-equipment-hero="${equipmentHero}"]`).focus({preventScroll:true});}
  if(['weapons','unique'].includes(target.dataset.equipmentCategory)&&!game){equipmentCategory=target.dataset.equipmentCategory;renderRewards();$('#equipment-feedback').textContent='';$(`[data-equipment-category="${equipmentCategory}"]`).focus({preventScroll:true});}
  if(target.dataset.openEquipment&&!game&&isHeroUnlocked(progression,target.dataset.openEquipment)){equipmentHero=target.dataset.openEquipment;equipmentCategory='weapons';switchMenuTab('equipment');$('#equipment-panel').scrollIntoView({block:'start'});}
  if(target.dataset.equipItem&&!game){const heroId=target.dataset.equipHero,id=target.dataset.equipItem,remove=progression.equipment.loadout[heroId]===id;if(isHeroUnlocked(progression,heroId)&&equipUnique(progression.equipment,heroId,remove?'':id,{transfer:true})){persistProgression();renderRewards();$('#growth-cards').innerHTML=growthCards(progression);$('#equipment-feedback').textContent=`${uniqueEquipment(id).name}を${remove?'外しました':'装備しました'}。${storageAvailable?'保存しました。':'この環境では保存できません。'}`;audio.play('upgrade');$(`[data-equip-item="${id}"]`)?.focus({preventScroll:true});}}
  if(target.dataset.showMission&&!game){if(activeDialog==='stage')closeDialog();switchMenuTab('missions');const row=$(`[data-mission="${target.dataset.showMission}"]`);if(row?.closest('details'))row.closest('details').open=true;row?.scrollIntoView({block:'center',behavior:settings.motion?'smooth':'instant'});}
  if(target.hasAttribute('data-prepare-challenge')&&!game){if(actFor(selectedAct).extra){selectedAct=chapterForAct(selectedAct).start;goMenu();}chooseDifficulty('hard');switchMenuTab('adventure');openDialog('stage');}
  if(target.dataset.menuTab)switchMenuTab(target.dataset.menuTab);

  if(target.dataset.openTree&&!game&&isHeroUnlocked(progression,target.dataset.openTree)){chooseTreeHero(target.dataset.openTree);if(target.dataset.treeTarget)treeSelection=target.dataset.treeTarget;switchMenuTab('talent');if(target.dataset.treeTarget)chooseTreeNode(treeSelection);else $('#talent-panel').scrollIntoView({block:'start'});}
  if(target.hasAttribute('data-open-skill-loadout')&&!game){closeDialog();if($('#chapter-menu').classList.contains('hidden'))goMenu();treeHero=HEROES[selectedHero].id;treeSelection='blessing1';blessingSlot=0;switchMenuTab('talent');$('#blessing-loadout').scrollIntoView({block:'start',behavior:'instant'});}
  if(target.hasAttribute('data-edit-blessings')&&!game){if(activeDialog==='talent')closeDialog();$('#blessing-loadout')?.scrollIntoView({block:'start',behavior:'instant'});$(`[data-blessing-slot="${blessingSlot}"]`)?.focus({preventScroll:true});}
  if(target.hasAttribute('data-blessing-slot')&&!game){const slot=Number(target.dataset.blessingSlot);if(Number.isInteger(slot)&&slot>=0&&slot<3){blessingSlot=slot;renderTalent();$(`[data-blessing-slot="${slot}"]`).focus({preventScroll:true});}}
  if(target.dataset.equipBlessing&&!game&&target.dataset.blessingHero===treeHero&&equipSkill(progression,treeHero,blessingSlot,target.dataset.equipBlessing)){
    persistProgression();renderTalent();audio.play('click');const skill=SKILLS.find(s=>s.id===target.dataset.equipBlessing),message=`枠${blessingSlot+1}に「${skill.name}」をセット。${storageAvailable?'保存しました。':'この環境では保存できません。'}`;$('#tree-feedback').textContent=message;announce(message);$(`[data-blessing-slot="${blessingSlot}"]`).focus({preventScroll:true});
  }
  if(target.dataset.treeHero)chooseTreeHero(target.dataset.treeHero);
  if(target.dataset.treeTier&&!game){treeSelection=target.dataset.treeTier==='4'?'demonGate':target.dataset.treeTier==='3'?'blessing1':target.dataset.treeTier==='2'?'ascension':'origin';renderTalent();$(`[data-tree-tier="${target.dataset.treeTier}"]`).focus({preventScroll:true});}
  if(target.dataset.treeNode)chooseTreeNode(target.dataset.treeNode);
  if(target.dataset.unlockNode)applyTalent(target.dataset.unlockHero,target.dataset.unlockNode);
  if(target.dataset.difficulty&&!game){chooseDifficulty(target.dataset.difficulty);if(activeDialog==='difficulty')closeDialog();}
  if(target.dataset.skill){if(game?.chooseSkill(target.dataset.skill)){audio.play('upgrade');$('#modal').close();$('#modal').classList.remove('wide');activeDialog=null;handleEvents(game.drainEvents());updateHud();}}
  if(['retry','chapter-start'].includes(target.id))start();
  if(target.dataset.chapter!==undefined&&!game){const c=CHAPTERS[Number(target.dataset.chapter)];if(c&&isActUnlocked(progression,c.start)){selectedAct=ACTS.find(a=>a.chapter===c.id&&!progression.story.actClears[a.id])?.id??c.start;goMenu();}}
  if(target.dataset.act!==undefined&&!game&&isActUnlocked(progression,Number(target.dataset.act))){selectedAct=Number(target.dataset.act);openDialog('stage');}
  if(target.id==='start'){audio.init();audio.play('click');goMenu();}if(target.id==='menu-title')goHome();
  if(target.id==='chapter-story'){playStory('replay',()=>goMenu());}
  if(target.id==='pause'||target.id==='cutin-pause')pause();if(target.id==='resume')closeDialog();
  if(target.id==='quit'||target.id==='home-button')goMenu();
  if(target.dataset.action&&event.detail===0)action(target.dataset.action);
  if(target.id==='difficulty')openDialog('difficulty');
});
document.addEventListener('pointerdown',event=>{const button=event.target.closest('button[data-action]');if(button&&event.button===0&&game?.phase==='playing'){event.preventDefault();action(button.dataset.action);}});
// Suppress browser selection/image menus without cancelling taps or pointer movement.
for(const type of ['selectstart','dragstart','contextmenu'])document.addEventListener(type,event=>event.preventDefault());
$('#modal').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
$('#modal').addEventListener('keydown',e=>{
  if(activeDialog!=='talent'||e.key!=='Tab')return;
  const buttons=[...$('#modal').querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(document.activeElement);
  if(index<0||(!e.shiftKey&&index===buttons.length-1)||(e.shiftKey&&index===0)){
    e.preventDefault();(e.shiftKey?buttons.at(-1):buttons[0])?.focus();
  }
});
window.addEventListener('keydown',e=>{
  if(e.code==='Escape'){e.preventDefault();if(activeDialog)closeDialog();else pause();return;}
  if(weaponSummon.active){if(!weaponSummon.finished&&['Space','Enter'].includes(e.code)&&!e.target.closest?.('button')){e.preventDefault();if(!e.repeat)weaponSummon.skip();}return;}
  if(ultimatePresentation.active){if(!activeDialog&&['Space','Enter'].includes(e.code)&&e.target.id!=='cutin-pause'){e.preventDefault();if(!e.repeat)ultimatePresentation.skip();}return;}
  if(!game||game.phase!=='playing')return;
  if(e.code==='Enter'&&game.tutorial?.active&&game.tutorial.step.button&&document.activeElement?.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat&&game.advanceTutorial()){handleEvents(game.drainEvents());updateHud();}return;}
  if(['Space','Enter'].includes(e.code)&&document.activeElement?.tagName==='BUTTON')return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);
  if(!e.repeat){if(e.code==='Space')action('dash');if(e.code==='KeyT')action('rice');if(e.code==='KeyG')action('awakening');if(e.code==='KeyF')action('predation');if(e.code==='KeyR')action('mount');if(e.code==='KeyQ')action('switch');if(e.code==='KeyE')action('ultimate');}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{audio.setSuspended(true);voice.suspend();resetInput();if(game?.phase==='playing'||ultimatePresentation.active)pause();});
window.addEventListener('focus',()=>{audio.setSuspended(false);if(activeDialog!=='pause')voice.resume();});
document.addEventListener('visibilitychange',()=>{audio.setSuspended(document.hidden);weaponSummon.setHidden(document.hidden);if(document.hidden){voice.suspend();persistProgression();resetInput();if(game?.phase==='playing'||ultimatePresentation.active)pause();}else if(activeDialog!=='pause')voice.resume();});
window.addEventListener('pagehide',()=>{audio.setSuspended(true);ultimatePresentation.cancel();voice.stop();persistProgression();});
const canvas=$('#scene');
canvas.addEventListener('pointerdown',e=>{
  if(!game||game.phase!=='playing'||game.tutorial?.active&&!game.tutorial.practicing||stick.id!==null||e.button!==0)return;e.preventDefault();audio.init();
  stick.id=e.pointerId;stick.cx=e.clientX;stick.cy=e.clientY;stick.x=stick.y=0;canvas.setPointerCapture(e.pointerId);$('#joystick').classList.remove('hidden');$('#joystick').style.left=`${e.clientX}px`;$('#joystick').style.top=`${e.clientY}px`;$('#joystick i').style.transform='translate(-50%, -50%)';
});
canvas.addEventListener('pointermove',e=>{
  if(e.pointerId!==stick.id)return;const dx=e.clientX-stick.cx,dy=e.clientY-stick.cy,d=Math.hypot(dx,dy),m=Math.min(1,52/(d||1));stick.x=dx*m/52;stick.y=dy*m/52;$('#joystick i').style.transform=`translate(calc(-50% + ${dx*m}px),calc(-50% + ${dy*m}px))`;
});
const endPointer=e=>{if(e.pointerId===stick.id){stick.id=null;stick.x=stick.y=0;$('#joystick').classList.add('hidden');}};
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('lostpointercapture',endPointer);
function handleEvents(events){
  world.handle(events,game);
  let growthChanged=false;
  for(const e of events){
    if(e.type==='predationStart'||e.type==='predationEnd'){lastHero=-1;voice.stop();if(e.type==='predationStart'){toast('へへへに変身！ 攻撃力はそのまま · 戦闘終了まで解除不可');announce('へへりあるがオムソロを取り込み単独で戦います。攻撃力・弓・HP・防御はへへりある自身のものを維持。オムソロ分の攻撃力加算はありません。戦闘終了まで解除できません。');}}
    if(e.type==='tutorialStep'){resetInput();canvas.focus();announce(`にゃんるな：${game.tutorial.step.text}`);}
    if(e.type==='tutorialComplete'){voice.setMode('battle');voice.cue(game.heroId(game.player.hero),'start');growthChanged=true;resetInput();world.reset();canvas.focus();announce('練習終了。星詠みの草原で冒険をはじめよう。');}
    if(e.type==='guestJoin'){lastHero=-1;if(e.heroId==='lumi'){toast('るみと共闘！ 指先の光で村を守ろう');announce('るみがNPC援護に参加。もちにゃふぇとの共闘でねこるみに変わり、射程無限になります。正式加入は第7章クリア後です。');}else if(e.heroId==='hehereal'){toast('へへりあると共闘！ 魔法の弓で援護してくれる');announce('おむすびを食べたへへりあるが援護に参加。NPCとして援護のみを行います。正式加入は第6章クリア後です。');}else{toast('つきねこと共闘！ 交代と連携の祝福が解放');announce('つきねこがボス戦に助っ人参戦。操作を交代できます。正式加入は第1章クリア後です。');}}
    if(e.type==='recruited'){growthChanged=true;selectedParty=normalizeParty([...selectedParty,e.heroId],unlockedRoster());persistParty();}
    if(e.type==='nyanAwakeningLearned'){growthChanged=true;toast('にゃんるなの覚醒を習得！ 覚醒ボタンで月光の力を解放');announce(NYAN_AWAKENING_HELP);}
    if(e.type==='nyanAwakeningStarted'){audio.play('upgrade');toast(`覚醒！ ${NYAN_AWAKENING_RULES.duration}秒間、基本攻撃力${NYAN_AWAKENING_RULES.attackPower}倍・貫通弾＋追尾弾×2`);announce(`にゃんるな覚醒。基本攻撃力が${NYAN_AWAKENING_RULES.attackPower}倍になりました。`);}
    if(e.type==='nyanAwakeningEnded'&&game.phase==='playing'){toast(`覚醒終了 · 再使用まで${NYAN_AWAKENING_RULES.cooldown}秒`);announce('覚醒が終了し、元の姿に戻りました。');}
    if(e.type==='riceAwakened'){growthChanged=true;toast('ライスの力を習得！ ライスボタンで5秒間、敵弾を反射');announce(RICE_HELP);}
    if(e.type==='freeSkillsUnlocked'){growthChanged=true;toast('極宴クリア！ パーティ画面で全員のスキル付け替え解放');announce('全員のスキルと全3枠を自由に付け替えられるようになりました。どの編成でもパーティ画面から設定できます。');}
    if(e.type==='predationPower'){announce(`捕食の舞で敵撃破。攻撃力上昇${e.kills}回、追加攻撃力${Math.round(e.attackBonus)}。幕終了まで維持。`);}
    if(e.type==='riceStarted'){audio.play('switch');announce('ライスの力発動。5秒間、敵の遠距離攻撃を跳ね返します。');}
    if(e.type==='riceEnded'&&game.phase==='playing')announce('ライスの力終了。再使用まで10秒。');
    if(e.type==='weaponTicket'){growthChanged=true;toast(`専用武器ガチャ券 +${e.count}枚！ メニューの武器ガチャで使えます`);announce(`${e.source==='actClear'?'幕クリア報酬として':e.source==='goldenSlime'?'金色のスライムから':'ボスから'}専用武器ガチャ券を${e.count}枚獲得。所持${e.total}枚。`);}
    if(e.type==='missionProgress')growthChanged=true;
    if(e.type==='missionComplete'){growthChanged=true;const mission=STAGE_MISSIONS.find(m=>m.id===e.id);toast(`ミッション達成：${mission.name} · ${missionRewardText(mission)}`);announce(`${mission.name}を達成。${missionRewardText(mission)}を獲得。`);}
    if(e.type==='materials'){growthChanged=true;if(e.amounts.moonPrism||e.amounts.astralCore)toast(`${materialsText({moonPrism:e.amounts.moonPrism,astralCore:e.amounts.astralCore})} · 2段目の素材`);else if(e.amounts.wardenCore)toast(`★1 守護者の欠片 +${e.amounts.wardenCore} · 成長ツリーの素材`);}
    if(e.type==='characterXp'){growthChanged=true;if(e.level>e.before){const name=HEROES.find(h=>h.id===e.heroId)?.name??'仲間';toast(`${name} Lv.${e.level} · 基礎能力アップ`);announce(`${name}がレベル${e.level}になりました。`);}}
    if(e.type==='characterXp'&&e.heroId==='omsolo'&&e.before<RICE_UNLOCK_LEVEL&&e.level>=RICE_UNLOCK_LEVEL&&!hasRicePower(progression)){toast('オムソロの覚醒イベント発生！ 第2章「ライスの力 — 覚醒」へ');announce('レベル50に到達。オムソロのソロ覚醒クエストが解放されました。');}
    if(e.type==='characterXp'&&e.heroId==='nyanluna'&&e.before<NYAN_UNLOCK_LEVEL&&e.level>=NYAN_UNLOCK_LEVEL&&!hasNyanAwakening(progression)){toast('にゃんるな覚醒修行が解放！ 第1章のソロ覚醒イベントへ');announce('レベル50に到達。にゃんるなのソロ覚醒修行が解放されました。');}
    if(e.type==='attack'&&!e.support)audio.play(e.hero===1?'shot':'attack',e);
    if(e.type==='heroDown')toast(`${HEROES[e.hero].name}が戦闘不能`);
    if(e.type==='switch'){if(e.automatic)toast(`${HEROES[game.partnerHero].name}が戦闘不能 · ${HEROES[e.hero].name}へ自動交代`);announce(`${HEROES[e.hero].name}を操作中。${game.hasLivingPartner?HEROES[game.partnerHero].name+'が無敵で援護します。':'相方は戦闘不能です。'}`);}
    if(['collect','dash','switch','hurt','upgrade','victory','defeat'].includes(e.type))audio.play(e.type,e);
    if(e.type==='hit'&&renderFrames%3===0)audio.play('hit',e);
    if(e.type==='upgrade')upgrade();
    if(e.type==='stageClear'){
      clearTimeout(toastTimer);$('#toast').classList.remove('visible');
      const run=game;playStory(e.nextArea===1?'ruins':'sanctuary',()=>{if(game!==run)return;run.advanceStage();handleEvents(run.drainEvents());updateHud();});
    }
    if(e.type==='passageOpen'){clearTimeout(bannerTimer);$('#wave-banner').classList.remove('visible');announce(e.kind==='stairs'?'下階を制圧。青い階段を上って上のフロアへ進もう。':'道が分かれています。左の緑の門は通常ルート。右の赤い門は強ボスと追加素材。歩いて選んでください。');}
    if(e.type==='passageEntered'){toast(e.name);announce(e.kind==='stairs'?'上のフロアに到着しました。祝福とクリスタルを引き継いでいます。':e.route==='elite'?'強ボスルートへ進みました。HPと攻撃威力が通常ボスの2倍です。':'通常ルートへ進みました。');}
    if(e.type==='routeReward')toast('強ボス撃破！ ★2 深星の宝珠 +1・追加素材を獲得');
    if(e.type==='exitOpen'){clearTimeout(bannerTimer);clearTimeout(ultimateBannerTimer);clearTimeout(toastTimer);$('#wave-banner').classList.remove('visible');$('#ultimate-banner').classList.remove('visible');$('#toast').classList.remove('visible');audio.play('upgrade');announce(e.final?'最後の光を、月の門へ届けよう。':'月の門が開きました。光る輪へ進もう。');}
    if(e.type==='wave'){
      const area=game.actConfig.stages[e.area];$('#area-name').textContent=game.layout.name;$('#area-sub').textContent=`CHAPTER 0${game.actConfig.chapter+1} · ${game.actConfig.awakening?'SOLO AWAKENING · Lv.50':game.actConfig.extra?`EXTRA · Lv.${game.actConfig.recommendedLevel}`:`ACT 0${game.actConfig.number}`}`;$('#boss-hud span').textContent=game.actConfig.boss;$('#boss-hud small').textContent=BOSSES[game.actConfig.bossId].subtitle;
      clearTimeout(ultimateBannerTimer);$('#ultimate-banner').classList.remove('visible');$('#wave-banner span').textContent=e.boss?'FINAL ENCOUNTER':`WAVE ${String(e.wave).padStart(2,'0')}`;$('#wave-banner strong').textContent=e.boss?(game.actConfig.apex?'夢蝕王の最終試練':game.actConfig.boss):game.layout.name;$('#wave-banner small').textContent=e.boss?(game.actConfig.apex?'HP半分で夢蝕覚醒。包囲陣と星弾の切れ目へ回避しよう。':game.actConfig.extra?extraCombatHint(game.actConfig):BOSSES[game.actConfig.bossId].hint):fieldSummary(game.act,game.area);$('#wave-banner').classList.add('visible');clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>$('#wave-banner').classList.remove('visible'),2800);audio.play('wave');announce(e.boss?`最終戦、${game.actConfig.boss}が現れました。`:`ウェーブ${e.wave}、${area.name}`);if(e.boss&&storyEnabled&&storyScenesFor(game.act)?.guardian)pendingStory='guardian';
    }
    if(e.type==='rescueSaved'){toast('救出成功！ 月の門へ進んで手当てをしよう');announce('オムソロを救出。最後の月の門を通ると仲間になります。');}
    if(e.type==='ultimateShot')audio.play('shot');
    if(e.type==='ultimate'){clearTimeout(bannerTimer);clearTimeout(ultimateBannerTimer);$('#wave-banner').classList.remove('visible');audio.play(e.hero===1?'ultimateGun':'ultimate');$('#ultimate-banner span').textContent=e.duetKind==='prim'?'つきねこ ＆ プリム · 特殊連携技':e.duet?'にゃんるな ＆ 雫 · 特殊連携技':(game.predation.active&&e.hero===6?'へへへ':HEROES[e.hero].name)+' · 固有必殺技';$('#ultimate-banner strong').textContent=e.abilityName??ultimateFor(e.heroId).name;$('#ultimate-banner').classList.add('visible');ultimateBannerTimer=setTimeout(()=>$('#ultimate-banner').classList.remove('visible'),1600);}
    if(e.type==='hurt'){$('#damage-flash').classList.remove('flash');void $('#damage-flash').offsetWidth;$('#damage-flash').classList.add('flash');}
    if(e.type==='skill'){const skill=SKILLS.find(s=>s.id===e.id);toast(`${skill.name} を獲得`);}
    if(e.type==='victory'||e.type==='defeat')showResult(e.type==='victory');
    if(e.type==='bossAttack'&&!game.exitOpen&&game.phase==='playing')toast(`${e.label} — 光る範囲を避けよう`);
    if(e.type==='bossPhase'){toast(e.label);announce(e.label);}
    if(e.type==='rareSpawn'){audio.play('upgrade');toast(e.rareType===GOLDEN_HEHE.type?'黄金のへへへ出現！ 素材2倍＋★3素材を大量獲得':'金色のスライム出現！ 20秒以内に倒すとガチャ券10枚＋大量の素材・EXP');announce(e.rareType===GOLDEN_HEHE.type?(game.actConfig.endgame?extraCombatHint(game.actConfig):GOLDEN_HEHE.hint):GOLDEN_SLIME.hint);}
    if(e.type==='rareEscape'){const name=e.rareType===GOLDEN_HEHE.type?'黄金のへへへ':'金色のスライム';toast(`${name}は逃げていった…`);announce(`${name}が逃走しました。`);}
    if(e.type==='rareDefeated'){growthChanged=true;audio.play('upgrade');toast(`レア討伐！ ガチャ券 +${e.tickets}枚・覚醒の輝石 +1個・大量の素材・仲間EXPを獲得`);announce(`${e.rareType===GOLDEN_HEHE.type?'黄金のへへへ':'金色のスライム'}討伐。武器ガチャ券${e.tickets}枚、覚醒の輝石1個と大量の素材、仲間の経験値を獲得しました。`);}
    if(e.type==='enemyIntro'){const enemy=ENEMY_TYPES[e.enemyType];toast(`${enemy.name}：${enemy.hint}`);announce(`${enemy.name}が出現。${enemy.hint}`);}
  }
  voice.handle(events,game);
  if(growthChanged)persistProgression();
  if(pendingStory&&!activeDialog&&game?.phase==='playing'){const id=pendingStory;pendingStory=null;playStory(id);}
}
updatePartyLabels();
function updateHud(){
  tutorialView.render(game,!!activeDialog);if(!game)return;const p=game.player;
  const riceHint=$('#rice-control-hint'),riceLearned=hasRicePower(game.progression)&&p.hero===2;
  const riceButton=$('#rice'),riceActive=game.rice.active,riceWait=Math.ceil(game.rice.cooldown);
  riceButton.classList.toggle('hidden',!riceLearned);riceButton.disabled=!game.riceAvailable;riceButton.classList.toggle('reflecting',riceActive);
  $('#rice-label').textContent=riceActive?'反射中':riceWait>0?'準備中':'ライス';
  $('#rice-status').textContent=riceActive?`${Math.ceil(game.rice.remaining)}秒`:riceWait>0?`${riceWait}秒`:'5秒反射';
  riceButton.setAttribute('aria-label',riceActive?`ライスの力で反射中、残り${Math.ceil(game.rice.remaining)}秒`:riceWait>0?`ライスの力、再使用まで${riceWait}秒`:'ライスの力で5秒間、敵の遠距離攻撃を反射（T）');
  riceButton.title=RICE_HELP;
  riceHint.classList.toggle('hidden',!riceLearned||!!activeDialog||game.phase!=='playing');
  riceHint.textContent=riceActive?'ライスの力 · 敵弾を自動反射中':riceWait>0?`ライスの力 · 再使用まで${riceWait}秒`:'ライス（T）· 5秒反射／終了後10秒待機';
  if(lastHero!==p.hero){lastHero=p.hero;$('#switch .portrait').className=`portrait ${HEROES[p.hero].id}`;$('#switch .portrait').setAttribute('aria-label',HEROES[p.hero].name);$('#hero-name').textContent=HEROES[p.hero].name;$('#ultimate').dataset.hero=p.hero;const signature=game.ultimateSpec();$('#ultimate > .icon').outerHTML=icon(signature.icon);$('#ultimate').title=`${signature.name}：${signature.note}`;
    const partner=game.partnerHero,name=partner===null?'':HEROES[partner].name;
    $('.partner-label').innerHTML=game.hasPartner?`<b id="partner-name">${name}</b> <span id="partner-status"></span>`:game.predation.active?'<b id="partner-name">オムソロ取り込み中</b> · 単独変身中':'<b id="partner-name">単独出撃</b> · この仲間で挑戦中';
    const switchable=game.hasPartner&&!['hehereal','lumi'].includes(game.guestHeroId);$('#switch-action').classList.toggle('hidden',!switchable);$('#switch .swap-badge').classList.toggle('hidden',!switchable);$('#switch').disabled=!switchable;
    if(game.hasPartner){$('#switch-action .portrait').className=`portrait ${HEROES[partner].id}`;$('#switch-action .portrait').setAttribute('aria-label',name);$('#switch-target').textContent=`${name}へ`;}
    for(const button of document.querySelectorAll('[data-action="switch"]')){button.setAttribute('aria-label',game.hasPartner?`${name}に操作を切り替え（Q）`:`${HEROES[p.hero].name}・単独出撃`);button.title=game.hasPartner?`${name}に交代 / Q`:'単独出撃';}
  }
  const transformed=game.predation.active;$('#switch .portrait').classList.toggle('hehe-form',transformed);$('#hero-name').textContent=transformed?'へへへ':p.hero===7&&hasNekoLumi(game.party)?'ねこるみ':HEROES[p.hero].name;
  const neko=hasNekoLumi(game.party);$('#switch .portrait').classList.toggle('nekolumi',p.hero===7&&neko);$('#switch-action .portrait').classList.toggle('nekolumi',game.partnerHero===7&&neko);if(game.partnerHero===7){$('#partner-name').textContent=neko?'ねこるみ':'るみ';$('#switch-target').textContent=neko?'ねこるみへ':'るみへ';}
  $('#predation').classList.toggle('hidden',!transformed&&!hasPredationPair(game.party));$('#predation').disabled=!game.predationReady;$('#predation').classList.toggle('consumed',transformed);$('#predation-label').textContent=transformed?'捕食済':'捕食';$('#predation-status').textContent=transformed?'解除不可':'単独変身';$('#predation .portrait').classList.toggle('hehe-form',transformed);if(transformed){$('.partner-label').innerHTML=`<b id="partner-name">オムソロ取り込み中</b> · 捕食の舞 ${game.predation.danceKills}体／攻撃 +${Math.round(game.predation.attackBonus)}`;}
  const awakened=game.nyanAwakening.active,nyanLearned=hasNyanAwakening(game.progression);$('#nyan-awakening').classList.toggle('hidden',!nyanLearned||!game.party.includes('nyanluna'));$('#nyan-awakening').disabled=!game.nyanAwakeningReady;$('#nyan-awakening').classList.toggle('awakened',awakened);$('#nyan-awakening-label').textContent=awakened?'覚醒中':game.nyanAwakening.cooldown>0?'準備中':'覚醒';$('#nyan-awakening-status').textContent=awakened?`${Math.ceil(game.nyanAwakening.remaining)}秒`:game.nyanAwakening.cooldown>0?`${Math.ceil(game.nyanAwakening.cooldown)}秒`:p.hero!==0?'交代して使用':`${NYAN_AWAKENING_RULES.duration}秒`;$('#nyan-awakening').setAttribute('aria-label',awakened?`覚醒中、残り${Math.ceil(game.nyanAwakening.remaining)}秒`:game.nyanAwakening.cooldown>0?`覚醒まで${Math.ceil(game.nyanAwakening.cooldown)}秒`:p.hero!==0?'にゃんるなに交代すると覚醒できます':'にゃんるなが覚醒（G）');$('#switch .portrait').classList.toggle('nyanluna-awakened',awakened&&p.hero===0);$('#switch-action .portrait').classList.toggle('nyanluna-awakened',awakened&&game.partnerHero===0);if(awakened&&p.hero===0)$('#hero-name').textContent='にゃんるな・覚醒';if(game.partnerHero===0)$('#partner-name').textContent=awakened?'にゃんるな・覚醒':'にゃんるな';
  const currentSpec=game.ultimateSpec();$('#ultimate').title=`${currentSpec.name}：${currentSpec.note}`;
  $('#health-fill').style.width=`${p.hp/p.maxHp*100}%`;$('#hp').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;$('.health-track').setAttribute('aria-valuenow',Math.ceil(p.hp));$('.health-track').setAttribute('aria-valuemax',p.maxHp);$('.health-track').classList.toggle('low',p.hp<p.maxHp*.3);
  $('#mount').classList.toggle('hidden',!hasPrimBond(game.party));$('#mount').disabled=!game.mountReady;$('#mount').classList.toggle('riding',game.mount.active);
  $('#mount-label').textContent=game.mount.active?'搭乗中':game.mount.cooldown>0?'準備中':'搭乗';$('#mount-time').textContent=game.mount.active?`${Math.ceil(game.mount.remaining)}秒`:game.mount.cooldown>0?`${Math.ceil(game.mount.cooldown)}秒`:'12秒';
  $('#mount').setAttribute('aria-label',game.mount.active?`搭乗中、残り${Math.ceil(game.mount.remaining)}秒`:game.mount.cooldown>0?`搭乗まで${Math.ceil(game.mount.cooldown)}秒`:'プリムに搭乗（R）');$('.lead-status').textContent=transformed?'単独変身中':awakened&&p.hero===0?'覚醒中':game.mount.active?'二人で操作中':'操作中';
  const progress=game.progressFor(p.hero),cap=levelCap(progress),required=xpRequired(progress.level),atCap=progress.level>=cap;
  $('#xp-fill').style.width=`${atCap?100:progress.xp/required*100}%`;$('.xp-track').setAttribute('aria-valuenow',atCap?required:progress.xp);$('.xp-track').setAttribute('aria-valuemax',required);$('.xp-track').setAttribute('aria-valuetext',atCap?`レベル上限 ${cap}、蓄積経験値 ${progress.xp}`:`経験値 ${progress.xp} / ${required}`);$('#level').textContent=`Lv. ${progress.level}`;
  $('#hero-exp').textContent=progress.level===LEVEL_RULES.maxLevel?'MAX LEVEL':atCap?`上限Lv.${cap} · EXP ${progress.xp} 蓄積`:`EXP ${progress.xp} / ${required}`;
  $('#crystal-count').textContent=`${game.stageCrystals} / ${game.crystalGoal}`;$('#crystal-fill').style.width=`${game.stageCrystals/game.crystalGoal*100}%`;$('.crystal-track').setAttribute('aria-valuenow',game.stageCrystals);$('.crystal-track').setAttribute('aria-valuemax',game.crystalGoal);$('#blessing-count').textContent=`次の祝福まで · 獲得 ${game.blessingTier}回`;
  const stageMissions=missionsFor(game.area,game.act),done=stageMissions.filter(m=>progression.missions.claimed.includes(m.id)).length,trialMission=stageMissions.find(m=>m.equipment&&!progression.missions.claimed.includes(m.id)),trial=trialMission?trialStatus(trialMission,game):null;
  $('#mission-tracker').classList.toggle('hidden',!!game.actConfig.extra||!!game.actConfig.awakening);
  $('#mission-tracker').textContent=game.difficulty==='hard'&&trial?`試練 ${Math.floor(trial.seconds)}/${trialMission.trial.seconds}秒 · 被弾${trial.hits}/${trialMission.trial.hits} ${trial.eligible?'○':'×'} · 詳細は一時停止`:`ミッション ${done}/${stageMissions.length} · 詳細は一時停止`;
  $('#kill-count').textContent=game.kills;$('#timer').textContent=minutes(game.time);
  $('#wave').textContent=`WAVE ${String(game.wave).padStart(2,'0')} / 06`;$('#wave-dots').querySelectorAll('i').forEach((el,i)=>{el.classList.toggle('done',i<game.wave-1);el.classList.toggle('current',i===game.wave-1);});
  $('#objective').classList.toggle('rescue-active',!!game.rescue?.active);$('#objective').classList.toggle('rescue-urgent',!!game.rescue?.active&&game.rescue.remaining<=30);
  $('#remaining').textContent=`${game.waveSpawned-game.enemies.filter(e=>e.hp>0&&!e.rare).length} / ${game.waveGoal}`;
  const rareMarkup=goldenHeheHud(game)||goldenSlimeHud(game),rarePanel=$('#rare-encounter');rarePanel.classList.toggle('hidden',!rareMarkup);if(rarePanel.innerHTML!==rareMarkup)rarePanel.innerHTML=rareMarkup;
  $('#objective span').textContent=game.act===19&&game.wave===6?(game.exitOpen?'虹の道が開いた！ 最後の門でプリムを仲間に':'プリズムドラゴンを浄化し、二人の帰り道をひらこう'):game.act===15&&game.wave===6?(game.exitOpen?'大王の暴走が止まった！ 最後の門で雫を仲間に':'雫と悪魔大王の暴走を止めよう'):game.act===11&&game.wave===6?(game.exitOpen?'もちにゃふぇを救出！ 最後の月の門へ':'闇の王を倒して、もちにゃふぇを救出'):game.rescue?.active?`オムソロを救出 · 残り ${Math.ceil(game.rescue.remaining)}秒`:game.rescue?.saved?'救出成功！ 最後の月の門へ':game.travelOpen==='stairs'?'青い階段から上のフロアへ':game.travelOpen==='branch'?'緑の通常ルート ／ 赤の強ボスルート':game.exitOpen?'光る月の門へ向かう':game.wave===6?'守護者を包む影をはらう':game.waveBreak>0?'次のWAVEへ · HP回復':'現れた魔物をすべて倒す';
  const objectiveBox=$('#objective'),crystalBox=$('#stage-crystal-hud');
  if(getComputedStyle(objectiveBox).display!=='none'){crystalBox.style.width=`${objectiveBox.offsetWidth}px`;crystalBox.style.height=`${objectiveBox.offsetHeight}px`;}
  $('#exit-guide').classList.toggle('hidden',!game.exitOpen);$('#exit-instruction').textContent=game.wave===6?'最後の光を届けよう':'光る輪へ進もう';$('#exit-guide small').textContent=game.wave===6?`月の門へ移動すると、${actLabel(game.act)}クリア・報酬獲得`:'矢印の先へ移動すると、次のステージへ';
  const boss=game.enemies.find(e=>e.type==='boss');$('#boss-hud').classList.toggle('hidden',!boss);if(boss){$('#boss-fill').style.width=`${boss.hp/boss.maxHp*100}%`;$('#boss-hud span').textContent=boss.name;$('#boss-hud small').textContent=boss.mochiWeakenUntil>game.time?`ふぇ〜：攻撃 −${Math.round(boss.mochiAttackDown*100)}% ／ 防御 −${Math.round(boss.mochiDefenseDown*100)}% · ${Math.ceil(boss.mochiWeakenUntil-game.time)}秒`:game.actConfig.apex?(boss.apexAwakened?'夢蝕覚醒 · 包囲魔法と星弾が増加':'Lv.50 EX最難関 · HP半分で夢蝕覚醒'):boss.elite?`DANGER · ${ELITE_BOSS_LABEL}`:boss.enraged?'猛攻 · 連続攻撃が増加':BOSSES[boss.bossId].subtitle;}
  $('#combo').classList.toggle('visible',game.combo>=3);$('#combo strong').textContent=game.combo;
  const signature=game.ultimateSpec(),casting=game.ultimateActive(p.hero),ready=p.charge>=100&&!casting;
  $('#ultimate').style.setProperty('--charge',`${p.charge*3.6}deg`);$('#ultimate').classList.toggle('ready',ready);$('#ultimate').classList.toggle('casting',casting);$('#ult-label').textContent=casting?'発動中':ready?(game.duetReady?'特殊連携':'必殺技'):`${Math.floor(p.charge)}%`;$('#ultimate').setAttribute('aria-label',`${signature.name}（E）${casting?'発動中':`ゲージ${Math.floor(p.charge)}%`}`);$('#ultimate').setAttribute('aria-disabled',String(!ready||game.phase!=='playing'));
  if(game.hasPartner){const health=game.healthFor(game.partnerHero),name=game.partnerHero===0&&awakened?'にゃんるな・覚醒':HEROES[game.partnerHero].name;$('#partner-status').textContent=game.hasLivingPartner?`${game.mount.active?'搭乗・メイン':'援護・無敵'} HP ${Math.ceil(health.hp)}/${health.maxHp}`:'戦闘不能';$('#switch-target').textContent=game.hasLivingPartner?`${name}へ · ${Math.floor(game.chargeFor(game.partnerHero))}%`:`${name} · 戦闘不能`;}
  for(const button of document.querySelectorAll('[data-action="switch"]')){button.disabled=game.mount.active||!game.hasLivingPartner;if(game.hasPartner&&!game.hasLivingPartner){button.title='相方は戦闘不能のため交代できません';button.setAttribute('aria-label',button.title);}}
  $('.health-track').setAttribute('aria-label',`${HEROES[p.hero].name}のHP`);
  $('#dash .cooldown-mask').style.transform=`scaleY(${Math.min(1,p.dashCooldown/Math.max(.65,1.5-game.rank('stride')*.2))})`;$('#dash').classList.toggle('cooling',p.dashCooldown>0);for(const button of document.querySelectorAll('[data-action="switch"]')){button.classList.toggle('cooling',p.switchCooldown>0);button.setAttribute('aria-disabled',String(game.mount.active||!game.hasLivingPartner||p.switchCooldown>0||game.phase!=='playing'));}
  $('#switch-action .cooldown-mask').style.transform=`scaleY(${Math.min(1,p.switchCooldown/.65)})`;
  const skillString=JSON.stringify(game.skills);if(skillString!==lastSkills){lastSkills=skillString;$('#acquired').innerHTML=Object.entries(game.skills).map(([id,rank])=>{const skill=SKILLS.find(s=>s.id===id);return `<span title="${skill.name} Lv.${rank}：${skill.text}">${icon(skill.icon)}<b>${rank}</b></span>`;}).join('');}
  if(game.time>10)$('#control-hint').classList.add('hidden');updateTerrainUi(game);
}
const numberCanvas=$('#numbers'),numberContext=numberCanvas.getContext('2d');
function drawNumbers(){const ctx=numberContext,width=numberCanvas.width,height=numberCanvas.height;ctx.clearRect(0,0,numberCanvas.width,numberCanvas.height);if(!game)return;
  drawFloorLabels(ctx,world,game,width,height);
  if(game.exitOpen){
    const pos=world.project(game.exitPoint.x,game.layout.height+.15,game.exitPoint.z),x=Math.max(40,Math.min(width-40,pos.x)),y=Math.max(215,Math.min(height-230,pos.y));
    ctx.save();ctx.translate(x,y-20);ctx.fillStyle='#ffecae';ctx.strokeStyle='#153747';ctx.lineWidth=4;ctx.save();ctx.rotate(Math.atan2(pos.y-(y-20),pos.x-x)-Math.PI/2);ctx.beginPath();ctx.moveTo(-12,-12);ctx.lineTo(12,-12);ctx.lineTo(0,4);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.strokeText('月の門',0,-23);ctx.fillText('月の門',0,-23);ctx.restore();
  }
  for(const target of game.travelTargets){
    const pos=world.project(target.x,heightAt(game.layout,target.x,target.z)+2.7,target.z),x=Math.max(72,Math.min(width-72,pos.x)),y=Math.max(235,Math.min(height-180,pos.y));
    ctx.save();ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.strokeStyle='#102936';ctx.lineWidth=4;ctx.fillStyle=target.id==='elite'?'#ffacbd':target.id==='stairs'?'#bde6ff':'#a4edcf';ctx.strokeText(target.label,x,y);ctx.fillText(target.label,x,y);ctx.beginPath();ctx.moveTo(x-6,y+8);ctx.lineTo(x+6,y+8);ctx.lineTo(x,y+15);ctx.closePath();ctx.fill();ctx.restore();
  }
  let indicators=0;
  for(const enemy of game.enemies){
    const pos=world.project(enemy.x,game.layout.height+(enemy.type==='boss'?4.7:ENEMY_TYPES[enemy.type]?.barHeight??(enemy.type==='mage'?2.75:['archer','golem'].includes(enemy.type)?2.1:1.7)),enemy.z);
    if(pos.x>15&&pos.x<width-15&&pos.y>90&&pos.y<height-40){
      if(enemy.training){ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#efffd6';ctx.strokeStyle='#183f46';ctx.lineWidth=3;ctx.strokeText('練習用の的',pos.x,pos.y-12);ctx.fillText('練習用の的',pos.x,pos.y-12);}
      if(enemy.hp<enemy.maxHp&&enemy.type!=='boss'){ctx.fillStyle='rgba(13,38,46,.65)';ctx.fillRect(pos.x-17,pos.y-2,34,4);ctx.fillStyle='#f4c19f';ctx.fillRect(pos.x-16,pos.y-1,32*Math.max(0,enemy.hp/enemy.maxHp),2);}
    }else if(indicators<5){
      const dx=pos.x-width/2,dy=pos.y-height/2,sx=(width/2-19)/Math.max(.01,Math.abs(dx)),sy=(height/2-105)/Math.max(.01,Math.abs(dy)),scale=Math.min(sx,sy,1);
      const x=width/2+dx*scale,y=height/2+dy*scale;ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle=enemy.type==='boss'?'#ffd6a0':'#f5ddab';ctx.shadowColor='#153b3a';ctx.shadowBlur=5;ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(-4,-4);ctx.lineTo(-2,0);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();indicators++;
    }
  }
  for(const n of world.numbers){const p=world.project(n.x,n.y,n.z);ctx.globalAlpha=Math.min(1,n.life*3);ctx.font=`${n.crit?'800 25':'700 18'}px system-ui`;ctx.textAlign='center';ctx.strokeStyle='rgba(29,47,52,.65)';ctx.lineWidth=3;ctx.strokeText(n.text,p.x,p.y);ctx.fillStyle=n.crit?'#ffe2a5':'#fffbe8';ctx.fillText(n.text,p.x,p.y);}ctx.globalAlpha=1;}
function resize(){world?.resize();numberCanvas.width=canvas.clientWidth;numberCanvas.height=canvas.clientHeight;numberCanvas.style.width=`${numberCanvas.width}px`;numberCanvas.style.height=`${numberCanvas.height}px`;}
window.addEventListener('resize',resize);
// Safari's dynamic viewport can change with the address bar, without a window
// resize. Observe the actual canvas so projection and overlays stay aligned.
new ResizeObserver(resize).observe(canvas);
function gamepad(){const pad=navigator.getGamepads?.()[0];if(!pad)return;for(const [i,kind] of [[0,'dash'],[1,'switch'],[2,'predation'],[3,'ultimate'],[10,'awakening'],[11,'rice'],[9,'pause']]){const pressed=!!pad.buttons[i]?.pressed;if(pressed&&!previousPad[i]){if(kind==='pause'){if(activeDialog==='pause')closeDialog();else pause();}else if(kind==='dash'&&game?.tutorial?.active&&game.tutorial.step.button){if(game.advanceTutorial()){handleEvents(game.drainEvents());updateHud();}}else action(kind);}previousPad[i]=pressed;}}
function frame(now){
  const dt=Math.min((now-last)/1000,.1);last=now;renderFrames++;gamepad();if(!document.hidden){ultimatePresentation.tick(dt);weaponSummon.tick(dt);}
  if(game?.phase==='playing'){accumulator+=dt;let ticks=0;while(accumulator>=1/60&&ticks<6){game.tick(1/60,axes());accumulator-=1/60;ticks++;if(game.phase!=='playing'){accumulator=0;break;}}handleEvents(game.drainEvents());}else accumulator=0;
  if(world&&game){world.render(game,Math.min(dt,.05));drawNumbers();}if(game&&renderFrames%3===0)updateHud();audio.tick(weaponSummon.active?'summon':musicScene(game),{paused:activeDialog==='pause'});requestAnimationFrame(frame);
}
async function boot(){
  try{world=new World(canvas,settings);document.body.classList.toggle('reduce-motion',!settings.motion);resize();requestAnimationFrame(frame);await Promise.all([world.ready,...[publicUrl('assets/title/adventure-poster.jpg'),publicUrl('assets/nyanluna-reference.png'),publicUrl('assets/tsukineko-reference.png'),publicUrl('assets/meadow.png')].map(src=>new Promise(resolve=>{const img=new Image();img.onload=resolve;img.onerror=resolve;img.src=src;}))]);titleVideo.setVisible(!$('#home').classList.contains('hidden'));$('#loading').classList.add('finished');setTimeout(()=>$('#loading').remove(),650);}
  catch(error){console.error(error);$('#loading').innerHTML=`<div class="loading-moon">☾</div><span>ルナネコの不思議な冒険</span><p>3D画面を起動できませんでした。<br>WebGL対応のブラウザで、ページを再読み込みしてください。</p><button class="primary" id="reload">再読み込み</button>`;$('#reload').onclick=()=>location.reload();}
}
// The audit bridge is excluded from production builds. It exercises the real simulation.
if(import.meta.env.DEV){window.__LUNARIA_TEST__={get state(){return game?.snapshot()??{phase:'home'};},get stats(){return world?.stats();},get game(){return game;},get world(){return world;},get voice(){return voice;},get audio(){return audio;},get ultimatePresentation(){return ultimatePresentation;},get weaponSummon(){return weaponSummon;},get story(){return story;},start(){start({withStory:false});},step(seconds,input={x:0,z:0}){if(!game)return;for(let i=0;i<seconds*60;i++){game.tick(1/60,input);if(game.phase!=='playing')break;}handleEvents(game.drainEvents());updateHud();},skill(id){if(game?.chooseSkill(id)){if($('#modal').open)$('#modal').close();activeDialog=null;$('#modal').classList.remove('wide');handleEvents(game.drainEvents());}},home:goHome};}
if(import.meta.env.PROD&&'serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register(publicUrl('sw.js'),{
    scope:import.meta.env.BASE_URL,updateViaCache:'none',
  }).then(registration=>{
    const check=()=>registration.update().catch(()=>{});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
    window.addEventListener('online',check);
  }).catch(()=>{}));
}
boot();
