import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

const url=process.env.RICE_URL??'http://localhost:5187/',out='audit/rice-awakening';
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
async function setupTargets(kind){
  return page.evaluate(kind=>{
    const t=window.__LUNARIA_TEST__,g=t.game,w=t.world;g.cancelRice();g.rice.cooldown=0;g.phase='playing';g.enemies=[];g.projectiles=[];g.hazards=[];g.orbs=[];g.pendingBlessings=0;g.exitOpen=false;g.player.x=g.player.z=0;g.player.attack=999;g.waveSpawned=g.waveGoal;g.waveBreak=-999;g.player.invincible=100;
    const other=g.spawnEnemy('reaper',7,0);Object.assign(other,{hp:10000,maxHp:10000,speed:0,special:999,attack:999});
    let object;
    if(kind==='enemy'){object=g.spawnEnemy('reaper',2,0);Object.assign(object,{hp:10000,maxHp:10000,speed:0,special:999,attack:999});}
    else if(kind==='bullet'){object={id:g.ids++,owner:'enemy',kind:'arrow',x:2,z:0,vx:0,vz:0,damage:40,radius:.2,life:100};g.projectiles.push(object);}
    else{object={id:g.ids++,shape:'circle',x:2,z:0,damage:40,radius:1,timer:100,total:100};g.hazards.push(object);}
    w.render(g,.01);const rect=w.canvas.getBoundingClientRect();
    const from=w.project(object.x,g.layout.height+(kind==='enemy'?1.2:kind==='bullet'?.9:.12),object.z);
    // Preserve the initial grab offset when converting pointer drag into stage coordinates.
    const plane=w.stagePoint(from.x+rect.left,from.y+rect.top,g),offset={x:object.x-plane.x,z:object.z-plane.z};
    const to=w.project(7-offset.x,g.layout.height+1.3,-offset.z);
    return {id:object.id,target:other.id,from:{x:from.x+rect.left,y:from.y+rect.top},to:{x:to.x+rect.left,y:to.y+rect.top},player:{x:g.player.x,z:g.player.z}};
  },kind);
}
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
  for(const kind of ['enemy','bullet','hazard']){
    const p=await setupTargets(kind);await page.mouse.move(p.from.x,p.from.y);await page.mouse.down();
    assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.rice.held?.kind),kind);
    assert.equal(await page.locator('#joystick').isVisible(),false);
    await page.screenshot({path:`${out}/grab-${kind}.png`});
    await page.mouse.move(p.to.x,p.to.y,{steps:8});await page.mouse.up();
    const result=await page.evaluate(id=>{const g=window.__LUNARIA_TEST__.game,e=g.enemies.find(e=>e.id===id);return {damage:e.maxHp-e.hp,held:!!g.rice.held,x:g.player.x,z:g.player.z};},p.target);
    assert.ok(result.damage>0,kind);assert.equal(result.held,false);assert.equal(result.x,p.player.x);assert.equal(result.z,p.player.z);
  }
  const bossAttack=await setupTargets('bullet');
  const bossPoint=await page.evaluate(id=>{const t=window.__LUNARIA_TEST__,g=t.game;g.enemies=[];const boss=g.spawnEnemy('boss',7,0);Object.assign(boss,{hp:10000,maxHp:10000,speed:0,special:999,attack:999});g.projectiles.find(b=>b.id===id).sourceId=boss.id;t.world.render(g,.01);const rect=t.world.canvas.getBoundingClientRect(),p=t.world.project(boss.x,g.layout.height+2,boss.z);return {x:p.x+rect.left,y:p.y+rect.top,id:boss.id};},bossAttack.id);
  assert.equal(await page.evaluate(p=>window.__LUNARIA_TEST__.world.pickRice(p.x,p.y,window.__LUNARIA_TEST__.game)?.kind,bossPoint),undefined);
  assert.equal(await page.evaluate(id=>window.__LUNARIA_TEST__.game.grabRice('enemy',id),bossPoint.id),false);
  await page.mouse.move(bossAttack.from.x,bossAttack.from.y);await page.mouse.down();assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.rice.held?.kind),'bullet');
  await page.mouse.move(bossAttack.to.x,bossAttack.to.y,{steps:8});await page.mouse.up();assert.ok(await page.evaluate(id=>window.__LUNARIA_TEST__.game.enemies.find(e=>e.id===id).hp<10000,bossPoint.id));
  // Native touch dispatch exercises the same Pointer Events path used on phones.
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>{const w=window.__LUNARIA_TEST__.world;return Math.abs(w.camera.aspect-w.canvas.clientWidth/w.canvas.clientHeight)<1e-6;});
  const touch=await setupTargets('enemy'),cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touch.from.x,y:touch.from.y,id:1}]});
  assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.rice.held?.kind),'enemy');
  await page.screenshot({path:`${out}/touch-grab.png`});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touch.to.x,y:touch.to.y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.ok(await page.evaluate(id=>window.__LUNARIA_TEST__.game.enemies.find(e=>e.id===id).hp<10000,touch.target));
  const cancelling=await setupTargets('enemy');await page.mouse.move(cancelling.from.x,cancelling.from.y);await page.mouse.down();
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.rice.held),null);await page.mouse.up();await page.locator('#resume').click();
  await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;g.enemies=[];g.projectiles=[];g.hazards=[];g.rice.cooldown=0;g.waveBreak=-999;});
  const blank=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,r=t.world.canvas.getBoundingClientRect(),p=t.world.project(-5,t.game.layout.height,-3);return {x:p.x+r.left,y:p.y+r.top};});
  await page.mouse.move(blank.x,blank.y);await page.mouse.down();assert.equal(await page.locator('#joystick').isVisible(),true);await page.mouse.move(blank.x+35,blank.y);await page.mouse.up();
  assert.equal(await page.locator('#joystick').isVisible(),false);assert.deepEqual(await party(),originalParty);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({checks:['Lv.49 locked / Lv.50 unlocked','solo deployment and replay, saved party preserved','story transitions and durable clear reward','four viewport layouts','mouse grabs enemies / bullets / telegraphs','boss body ungrabbable, boss ranged attack returned','native touch enemy collision','pause cancels held object','empty-ground movement unchanged'],screenshots:out,errors},null,2));
}finally{await browser.close();}
