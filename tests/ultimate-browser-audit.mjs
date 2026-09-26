import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {ULTIMATE_ART} from '../src/ultimate-art.js';
const BASE=process.env.LUNARIA_URL||'http://127.0.0.1:5177/';
const OUT=process.env.VOICE_AUDIT_DIR||'audit/ultimate-v132';await mkdir(OUT,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
const pass=text=>{checks.push(text);console.log('PASS',text);};
async function setup(hero=0,{muted=false,motion=true,width=390,height=844}={}){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true});
 await context.addInitScript(({hero,muted,motion})=>{
  const heroes=['nyanluna','tsukineko','omsolo'];
  localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:true,voice:!muted,voiceVolume:.44,music:false,quality:'low',motion}));
  localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(8).fill(true),tsukinekoUnlocked:true,omsoloUnlocked:true}}));
  localStorage.setItem('lunaria-party-v1',JSON.stringify({members:[heroes[hero],heroes[(hero+1)%3]],lead:heroes[hero]}));
 },{hero,muted,motion});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE);await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.locator('[data-open=settings]').click();await page.locator('#modal .primary[data-close]').click();
 await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;t.start();const g=t.game;g.enemies=[];g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.player.attack=g.partner.attack=999;g.player.charge=100;g.player.hp=50;g.time=0;const e=g.spawnEnemy('boss',g.player.x,g.player.z+1);e.hp=e.maxHp=10000;e.speed=0;e.attack=e.special=999;g.drainEvents();t.voice.stop();
  window.__ultimateAudit=[];const emit=g.emit.bind(g);g.emit=(type,data)=>{if(type==='ultimate')window.__ultimateAudit.push({type:'cast',hero:g.player.hero,time:performance.now(),charge:g.player.charge});return emit(type,data);};
  const play=t.voice.play.bind(t.voice);t.voice.play=(id,options={})=>{if(options.onStart?.auditWrapped)return play(id,options);const onStart=duration=>{if(id.includes('-ultimate-'))window.__ultimateAudit.push({type:'voice-start',id,time:performance.now(),visible:!document.querySelector('#ultimate-cutin').classList.contains('hidden'),charge:g.player.charge});options.onStart?.(duration);};onStart.auditWrapped=true;return play(id,{...options,onStart,onFinish:reason=>{if(id.includes('-ultimate-'))window.__ultimateAudit.push({type:'voice-'+reason,id,time:performance.now()});options.onFinish?.(reason);}});};
 });
 await page.evaluate(async()=>{const t=window.__LUNARIA_TEST__;await t.voice.load(t.game.heroId(t.game.player.hero)+'-ultimate-1');});
 return {page,context};
}
try{
 for(let hero=0;hero<3;hero++){
  const {page,context}=await setup(hero,hero===2?{width:844,height:390}:{});
  assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.player.hero),hero);
  const before=await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;return {time:g.time,hp:g.player.hp,enemy:g.enemies[0].hp};});
  await page.locator('#ultimate').tap();await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source&&window.__LUNARIA_TEST__.voice.mode==='ultimate');
  const state=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__,g=t.game;return {phase:g.phase,charge:g.player.charge,effects:g.ultimateEffects.length,hp:g.player.hp,time:g.time,enemy:g.enemies[0].hp,image:document.querySelector('.cutin-face').naturalWidth,overflow:document.body.scrollWidth>innerWidth};});
  assert.equal(state.phase,'ultimateIntro');assert.equal(state.charge,100);assert.equal(state.effects,0);assert.equal(state.hp,before.hp);assert.equal(state.enemy,before.enemy);assert.ok(state.image>0);assert.equal(state.overflow,false);
  assert.ok((await page.locator('.cutin-face').getAttribute('src')).endsWith(ULTIMATE_ART[['nyanluna','tsukineko','omsolo'][hero]].file));
  const frozen=state.time;await page.keyboard.press('KeyE');await page.keyboard.press('KeyQ');
  await page.screenshot({path:`${OUT}/ultimate-${hero}.png`});
  if(hero===0){
   await page.locator('#cutin-pause').tap();await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.time),frozen);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.current),null);await page.locator('#resume').tap();await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source);assert.ok(await page.evaluate(()=>window.__LUNARIA_TEST__.voice.current.offset>0));
   pass('Pause resumes the ultimate line from its playback position, with combat frozen');
  }
  await page.waitForFunction(()=>!window.__LUNARIA_TEST__.ultimatePresentation.active,{},{timeout:20000});
  const audit=await page.evaluate(()=>window.__ultimateAudit),cast=audit.filter(e=>e.type==='cast'),ended=audit.find(e=>e.type==='voice-ended');
  assert.equal(cast.length,1);assert.equal(cast[0].hero,hero);assert.ok(ended);assert.ok(cast[0].time>ended.time);assert.ok(audit.filter(e=>e.type==='voice-start').every(e=>e.visible&&e.charge===100));assert.equal(audit.filter(e=>e.type==='voice-start').length,hero===0?2:1);
  pass(`Hero ${hero}: dedicated ability art → complete voice → exactly one ultimate, without duplicate call`);await context.close();
 }
 for(let hero=0;hero<3;hero++){
  const size=hero===0?{width:1440,height:900}:hero===1?{width:320,height:568}:{};
  const {page,context}=await setup(hero,size);
  await page.locator('#ultimate').tap();await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source&&window.__LUNARIA_TEST__.voice.mode==='ultimate');
  await page.waitForTimeout(400);
  const layout=await page.evaluate(()=>{const title=document.querySelector('.cutin-ability').getBoundingClientRect(),skip=document.querySelector('#cutin-skip').getBoundingClientRect();return {overflow:document.body.scrollWidth>innerWidth,title:{left:title.left,right:title.right,bottom:title.bottom},skip:{top:skip.top,bottom:skip.bottom},width:innerWidth,height:innerHeight};});
  assert.equal(layout.overflow,false);assert.ok(layout.title.left>=0&&layout.title.right<=layout.width);assert.ok(layout.title.bottom<layout.skip.top);assert.ok(layout.skip.bottom<=layout.height);
  await page.screenshot({path:`${OUT}/ultimate-skip-${hero}.png`});
  if(hero===2){await page.locator('#cutin-pause').tap();assert.equal((await page.evaluate(()=>window.__ultimateAudit)).filter(e=>e.type==='cast').length,0);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.ultimatePresentation.skip()),false);await page.locator('#resume').tap();await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source);}
  await page.locator('.cutin-face').tap();
  assert.equal(await page.locator('#ultimate-cutin').isVisible(),false);
  const state=await page.evaluate(()=>{const t=window.__LUNARIA_TEST__;return {phase:t.game.phase,charge:t.game.player.charge,voice:t.voice.current?.id,hero:t.game.player.hero,audit:window.__ultimateAudit};});
  assert.equal(state.phase,'playing');assert.equal(state.charge,0);assert.equal(state.hero,hero);assert.ok(!state.voice?.includes('-ultimate-'));assert.equal(state.audit.filter(e=>e.type==='cast').length,1);assert.equal(state.audit.filter(e=>e.type==='voice-cancelled').length,1);
  await page.waitForTimeout(350);assert.equal((await page.evaluate(()=>window.__ultimateAudit)).filter(e=>e.type==='cast').length,1);
  pass(`Hero ${hero}: fresh screen tap stops the voice and casts once; activation tap and pause never skip`);await context.close();
 }
 for(const input of ['button','Enter','Space','loading']){
  const {page,context}=await setup(0);
  if(input==='loading')await page.evaluate(()=>{const v=window.__LUNARIA_TEST__.voice,fetcher=v.fetcher;v.cache.delete('nyanluna-ultimate-1');v.fetcher=(...args)=>String(args[0]).includes('nyanluna-ultimate-')?new Promise(resolve=>window.__releaseUltimate=()=>fetcher(...args).then(resolve)):fetcher(...args);});
  await page.locator('#ultimate').tap();
  if(input==='loading')await page.waitForFunction(()=>!!window.__releaseUltimate);else await page.waitForFunction(()=>window.__LUNARIA_TEST__.voice.current?.source&&window.__LUNARIA_TEST__.voice.mode==='ultimate');
  if(input==='button'||input==='loading')await page.locator('#cutin-skip').tap();else await page.keyboard.press(input);
  assert.equal(await page.locator('#ultimate-cutin').isVisible(),false);
  if(input==='loading'){await page.evaluate(()=>window.__releaseUltimate());await page.waitForTimeout(500);}
  const audit=await page.evaluate(()=>window.__ultimateAudit);assert.equal(audit.filter(e=>e.type==='cast').length,1);
  if(input==='loading')assert.equal(audit.filter(e=>e.type==='voice-start').length,0);
  pass(`${input}: skip is immediate and late audio does not restart`);await context.close();
 }
 for(const mode of ['muted','failed','stalled','cancel']){
  const {page,context}=await setup(0,{muted:mode==='muted',motion:false,width:320,height:568});
  let release;await page.evaluate(()=>{const v=window.__LUNARIA_TEST__.voice;v.cache.delete('nyanluna-ultimate-1');});
  if(mode==='failed')await page.route('**/assets/voices/nyanluna/nyanluna-ultimate-*',route=>route.fulfill({status:404,body:'audit failure'}));
  if(mode==='stalled')await page.evaluate(()=>{const v=window.__LUNARIA_TEST__.voice,fetcher=v.fetcher;v.cache.delete('nyanluna-ultimate-1');v.fetcher=(...args)=>String(args[0]).includes('nyanluna-ultimate-')?new Promise(resolve=>window.__releaseUltimate=()=>fetcher(...args).then(resolve)):fetcher(...args);});
  await page.locator('#ultimate').tap();await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.player.charge),100);
  if(mode==='muted'){await page.screenshot({path:`${OUT}/ultimate-small-reduced-motion.png`});assert.equal(await page.locator('.cutin-flash').evaluate(e=>getComputedStyle(e).animationName),'none');}
  if(mode==='cancel'){await page.locator('#cutin-pause').tap();await page.locator('#quit').tap();await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game),null);assert.equal(await page.locator('#ultimate-cutin').isVisible(),false);assert.equal((await page.evaluate(()=>window.__ultimateAudit)).filter(e=>e.type==='cast').length,0);}
  else{await page.waitForFunction(()=>!window.__LUNARIA_TEST__.ultimatePresentation.active,{},{timeout:10000});if(mode==='stalled'){await page.evaluate(()=>window.__releaseUltimate?.());await page.waitForTimeout(500);}const audit=await page.evaluate(()=>window.__ultimateAudit);assert.equal(audit.filter(e=>e.type==='cast').length,1);if(mode==='muted'||mode==='stalled')assert.equal(audit.filter(e=>e.type==='voice-start').length,0);}
  pass(`${mode}: no stuck overlay, premature cast or late duplicate voice`);await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${OUT}/ultimate-browser-report.json`,JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
