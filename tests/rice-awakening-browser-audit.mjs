import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const url=process.env.RICE_URL??'http://localhost:5187/',out=process.env.RICE_AUDIT_OUT??'audit/rice-awakening';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},hasTouch:true});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
  if(!localStorage.getItem('lunaria-progression-v1')){
    localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array.from({length:20},(_,i)=>i<8)},characters:{omsolo:{level:49,breaks:3}},tutorial:{firstBattleCompleted:true}}));
    localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['nyanluna','tsukineko'],lead:'tsukineko'}));
  }
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));
  if(sessionStorage.getItem('rice-audit-level')==='50'){
    const p=JSON.parse(localStorage.getItem('lunaria-progression-v1'));p.characters.omsolo.level=50;localStorage.setItem('lunaria-progression-v1',JSON.stringify(p));sessionStorage.removeItem('rice-audit-level');
  }
});
const boot=async()=>{await page.goto(url);await page.waitForSelector('#loading',{state:'detached',timeout:120000});};
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-progression-v1')));
const party=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lunaria-party-v1')));
const menu=async()=>{await page.locator('#start').click();await page.locator('[data-chapter="1"]').click();};
const skip=async()=>{await page.locator('#story-dialog[open] #story-skip').click();};
async function ready(){
  await page.evaluate(()=>{
    const t=window.__LUNARIA_TEST__,g=t.game;g.cancelRice();g.rice.cooldown=0;g.phase='playing';g.enemies=[];g.projectiles=[];g.hazards=[];g.orbs=[];g.pendingBlessings=0;g.exitOpen=false;g.travelOpen=null;
    g.player.x=g.player.z=0;g.player.attack=g.partner.attack=999;g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.invincible=0;t.step(0);
  });
}
const checks=[];
const pass=label=>{checks.push(label);console.log('PASS',label);};
try{
  await boot();await menu();assert.equal(await page.locator('[data-act="23"]').isDisabled(),true);
  await page.evaluate(()=>sessionStorage.setItem('rice-audit-level','50'));
  await boot();await menu();const originalParty=await party();assert.equal(await page.locator('[data-act="23"]').isDisabled(),false);
  await page.locator('[data-act="23"]').click();assert.match(await page.locator('.brief-party-rule').innerText(),/オムソロ1人/);
  assert.equal(await page.locator('#stage-difficulty [data-difficulty]').count(),0);
  for(const [width,height] of [[320,640],[390,844],[844,390],[1440,900]]){
    await page.setViewportSize({width,height});
    assert.equal(await page.locator('.stage-briefing').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
    await page.screenshot({path:`${out}/brief-${width}.png`});
  }
  await page.locator('#chapter-start').click();await page.waitForSelector('#story-dialog[open]');assert.match(await page.locator('#story-dialog').innerText(),/置いてきた一粒/);await skip();
  assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.game.party),['omsolo']);assert.equal((await saved()).awakenings.rice,false);assert.deepEqual(await party(),originalParty);
  assert.equal(await page.locator('#rice').isVisible(),false);
  for(const area of [0,1,2]){
    await page.evaluate(area=>{const t=window.__LUNARIA_TEST__,g=t.game;g.phase='playing';g.area=area;g.wave=area*2+2;g.enemies=[];g.orbs=[];g.pendingBlessings=0;g.exitOpen=true;g.exitDelay=0;Object.assign(g.player,g.exitPoint);g.crossExit();t.step(0);},area);
    await page.waitForSelector('#story-dialog[open]');
    if(area<2)assert.equal((await saved()).awakenings.rice,false);else assert.equal((await saved()).awakenings.rice,true);
    await skip();
  }
  await page.waitForSelector('.rice-result');assert.match(await page.locator('.rice-result').innerText(),/ライスの力を習得/);assert.deepEqual(await party(),originalParty);
  await boot();await menu();assert.match(await page.locator('[data-act="23"]').innerText(),/習得済み/);
  await page.locator('[data-act="23"]').click();await page.locator('#chapter-start').click();await skip();
  assert.deepEqual(await page.evaluate(()=>window.__LUNARIA_TEST__.game.party),['omsolo']);
  assert.match(await page.locator('#rice').innerText(),/ライス/);await ready();await page.locator('#rice').click();
  assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.rice.active),true);assert.equal(await page.locator('#rice').isDisabled(),true);
  assert.match(await page.locator('#rice-status').innerText(),/秒/);pass('Mouse button activation, active countdown and disabled reactivation');
  const reflection=await page.evaluate(()=>{
    const t=window.__LUNARIA_TEST__,g=t.game,boss=g.spawnEnemy('boss',7,0);Object.assign(boss,{hp:10000,maxHp:10000,speed:0,special:999,attack:999});
    const hp=g.player.hp,hits=g.runHits,b={id:g.ids++,owner:'enemy',sourceId:boss.id,kind:'arrow',x:2,z:0,vx:-10,vz:0,speed:10,homing:2,turnRate:3,damage:40,radius:.2,life:4};
    g.projectiles.push(b);t.step(.5);const result={returned:b.life===0,bossDamage:10000-boss.hp,hpUnchanged:g.player.hp===hp,hitsUnchanged:g.runHits===hits};
    g.phase='paused';t.step(0);return result;
  });assert.ok(reflection.returned);assert.ok(reflection.bossDamage>0);assert.ok(reflection.hpUnchanged);assert.ok(reflection.hitsUnchanged);pass('Boss homing shot returns to shooter without HP loss or damage-count credit');
  await page.screenshot({path:`${out}/reflect-desktop.png`});
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.phase='playing';t.step(0);});
  await page.keyboard.press('Escape');const frozen=await page.evaluate(()=>({...window.__LUNARIA_TEST__.game.rice}));
  await page.waitForTimeout(300);assert.deepEqual(await page.evaluate(()=>({...window.__LUNARIA_TEST__.game.rice})),frozen);assert.equal(frozen.active,true);
  await page.locator('#resume').click();pass('Pause freezes the effect and resuming retains reflection');
  const timing=await page.evaluate(()=>{
    const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];g.projectiles=[];g.hazards=[];g.rice.remaining=5;g.waveBreak=-999;t.step(5);
    const ended={...g.rice},blocked=g.activateRice();t.step(9.9);const blockedNearEnd=g.activateRice();t.step(.1);const ready=g.riceAvailable;g.phase='paused';t.step(0);
    return {ended,blocked,blockedNearEnd,ready};
  });assert.deepEqual(timing.ended,{active:false,remaining:0,cooldown:10});assert.equal(timing.blocked,false);assert.equal(timing.blockedNearEnd,false);assert.equal(timing.ready,true);
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.phase='playing';t.step(0);});await page.keyboard.press('KeyT');
  assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.rice.active),true);pass('Exact 5-second effect + 10-second post-effect cooldown and keyboard T');
  await ready();await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.game.activateRice();t.game.cancelRice();t.step(0);});
  assert.equal(await page.locator('#rice').isDisabled(),true);assert.equal(await page.locator('#rice-label').innerText(),'準備中');assert.match(await page.locator('#rice-status').innerText(),/10秒/);
  await page.screenshot({path:`${out}/cooldown.png`});pass('Cooldown is visible and button cannot restart it');
  // Include the separately learned awakening button to detect overlap in a real duo HUD.
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.party=Object.freeze(['omsolo','nyanluna']);g.partyHeroes=[2,0];g.progression.characters.nyanluna.level=50;g.progression.awakenings.nyanluna=true;g.activateHero(0);t.step(0);g.activateHero(2);t.step(0);});
  for(const [width,height] of [[320,640],[390,844],[844,390],[1440,900]]){
    await page.setViewportSize({width,height});await ready();await page.waitForTimeout(100);
    const bounds=await page.locator('#rice').evaluate(e=>{const r=e.getBoundingClientRect();const ids=['nyan-awakening','dash','ultimate','switch-action'];return {x:r.x,y:r.y,w:r.width,h:r.height,overflow:document.documentElement.scrollWidth>innerWidth+1,overlaps:ids.filter(id=>{const a=document.getElementById(id);if(a.classList.contains('hidden'))return false;const s=a.getBoundingClientRect();return r.left<s.right&&r.right>s.left&&r.top<s.bottom&&r.bottom>s.top;})};});
    assert.ok(bounds.w>=44&&bounds.h>=44);assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.w<=width+1&&bounds.y+bounds.h<=height+1);assert.equal(bounds.overflow,false);assert.deepEqual(bounds.overlaps,[]);
    await page.screenshot({path:`${out}/button-${width}.png`});
  }pass('320/390 portrait, 844 landscape and desktop: 44px tap target, no overflow or other-action overlap');
  await page.setViewportSize({width:390,height:844});await ready();await page.locator('#rice').tap();
  assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.rice.active),true);pass('Native touch tap activates reflection');
  await ready();await page.evaluate(()=>Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{axes:[0,0],buttons:Array.from({length:12},(_,i)=>({pressed:i===11}))}]}));
  await page.waitForFunction(()=>window.__LUNARIA_TEST__.game.rice.active);
  await page.evaluate(()=>Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{axes:[0,0],buttons:Array.from({length:12},()=>({pressed:false}))}]}));
  pass('Gamepad R3 triggers reflection through the frame input handler');
  const p=await page.evaluate(()=>{
    const t=window.__LUNARIA_TEST__,g=t.game,e=g.spawnEnemy('reaper',-4,0);Object.assign(e,{hp:10000,maxHp:10000,speed:0,attack:999,special:999});t.world.render(g,.01);
    const r=t.world.canvas.getBoundingClientRect(),p=t.world.project(e.x,g.layout.height+1.2,e.z);return {id:e.id,x:p.x+r.left,y:p.y+r.top};
  });
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1}]});
  assert.equal(await page.locator('#joystick').isVisible(),true);assert.equal(await page.evaluate(id=>window.__LUNARIA_TEST__.game.enemies.find(e=>e.id===id).riceHeld,p.id),undefined);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+30,y:p.y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.locator('#joystick').isVisible(),false);
  pass('Dragging a visible enemy uses movement only; obsolete grabbing is removed');
  await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;g.player.switchCooldown=0;g.switchHero();t.step(0);});
  assert.equal(await page.locator('#rice').isVisible(),false);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.rice.active),false);
  pass('Changing control to another hero ends reflection and hides the Omsolo-only button');
  assert.deepEqual(await party(),originalParty);assert.deepEqual(errors,[]);
  await writeFile(`${out}/browser-report.json`,JSON.stringify({url,checks,reflection,timing,errors},null,2));
}finally{await browser.close();}
