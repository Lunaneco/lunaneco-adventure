import {seedRecruitedRoster} from './recruited-browser-fixture.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const out='audit/hero-switch';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],checks=[];
const check=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
const watch=page=>{page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const ready=page=>page.waitForFunction(()=>document.querySelector('#switch-action').getAttribute('aria-disabled')==='false');
const lead=page=>page.evaluate(()=>window.__LUNARIA_TEST__.game.player.hero);
try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await seedRecruitedRoster(context);
const page=await context.newPage();watch(page);
 await page.goto('http://127.0.0.1:5174/');await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.click('#start');await page.click('#chapter-start');await page.click('#story-skip');
 await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;g.player.invincible=100;g.waveSpawned=g.waveGoal;g.waveBreak=-1000;g.enemies=[];});
 assert.equal(await lead(page),0);assert.match(await page.locator('#switch-target').innerText(),/^つきねこへ · \d+%$/);
 await page.locator('#switch-action').tap();await page.waitForFunction(()=>document.querySelector('#hero-name').textContent==='つきねこ');
 assert.equal(await lead(page),1);assert.match(await page.locator('#switch-target').innerText(),/^にゃんるなへ · \d+%$/);
 assert.match(await page.locator('#switch-action .portrait').getAttribute('class'),/nyanluna/);
 assert.match(await page.locator('#switch .portrait').getAttribute('class'),/tsukineko/);
 check('Visible switch button hands control to Tsukineko and updates both portraits');
 await ready(page);
 // Deliver two presses in the same browser turn, so inspection round trips
 // cannot accidentally outlast the short cooldown being tested.
 const duplicate=await page.evaluate(()=>{const button=document.querySelector('#switch-action');for(let i=0;i<2;i++)button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}));return window.__LUNARIA_TEST__.game.player.hero;});
 assert.equal(duplicate,0);await page.waitForFunction(()=>document.querySelector('#hero-name').textContent==='にゃんるな');
 check('The same button switches back to Nyanluna and rejects duplicate presses during cooldown');
 await ready(page);
 const session=await context.newCDPSession(page);
 await page.evaluate(()=>{window.__pointerLog=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>window.__pointerLog.push({type,id:e.pointerId,target:e.target.id}),true);});
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:60,y:590,id:1}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:105,y:590,id:1}]});
 await page.waitForTimeout(180);
 const before=await page.evaluate(()=>{const g=window.__LUNARIA_TEST__.game;g.player.hp=120;return {...g.player,partnerHp:g.healthFor(g.partnerHero).hp,time:g.time};});
 const box=await page.locator('#switch-action').boundingBox();
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:105,y:590,id:1},{x:box.x+box.width/2,y:box.y+box.height/2,id:2}]});
 // Update the active set to lift only the second finger. touchEnd would
 // release the supplied first finger and invalidate this continuity check.
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:105,y:590,id:1}]});
 await page.waitForFunction(time=>window.__LUNARIA_TEST__.game.time>time+.3,before.time);
 const after=await page.evaluate(()=>({...window.__LUNARIA_TEST__.game.player}));
 assert.equal(after.hero,1);assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.5,JSON.stringify({before,after,events:await page.evaluate(()=>window.__pointerLog)}));assert.equal(after.hp,before.partnerHp);assert.equal(await page.evaluate(()=>window.__LUNARIA_TEST__.game.healthFor(0).hp),120);
 assert.equal(await page.locator('#joystick').isVisible(),true);
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.locator('#joystick').isVisible(),false);
 check('Real two-finger input switches the controlled hero without interrupting movement or individual HP');
 await ready(page);await page.locator('#switch').tap();assert.equal(await lead(page),0);check('Existing portrait shortcut still switches both ways');
 for(const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);await ready(page);
  const layout=await page.evaluate(()=>{
   const buttons=[...document.querySelectorAll('.controls>button')].map(el=>{const r=el.getBoundingClientRect();return {id:el.id,x:r.x,y:r.y,width:r.width,height:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===el};});
   const name=document.querySelector('#switch-target').getBoundingClientRect();
   return {buttons,target:{x:name.x,y:name.y,right:name.right,bottom:name.bottom},overflow:document.body.scrollWidth>innerWidth};
  });
  for(const b of layout.buttons)assert.ok(b.width>=44&&b.height>=44&&b.x>=0&&b.y>=0&&b.x+b.width<=size.width&&b.y+b.height<=size.height&&b.hit,JSON.stringify({size,b}));
  assert.ok(layout.target.x>=0&&layout.target.right<=size.width&&layout.target.bottom<=size.height);assert.equal(layout.overflow,false);
  await page.screenshot({path:`${out}/${size.width}x${size.height}.png`});check(`Switch, dash and ultimate are accessible at ${size.width}×${size.height}`,layout);
 }
 await page.keyboard.press('KeyQ');assert.equal(await lead(page),1);await ready(page);
 await page.locator('#switch-action').focus();await page.keyboard.press('Enter');assert.equal(await lead(page),0);await ready(page);
 await page.keyboard.press('Space');assert.equal(await lead(page),1);check('Q, focused Enter and focused Space each perform one switch');
 await page.click('#pause');const paused=await lead(page);await page.keyboard.press('KeyQ');assert.equal(await lead(page),paused);await page.click('#resume');
 check('Pause prevents hero switching');
 await context.close();
 const prod=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await seedRecruitedRoster(prod);const live=await prod.newPage();watch(live);
 await live.goto('http://127.0.0.1:4173/?v=hero-switch-20260920');await live.waitForSelector('#loading',{state:'detached',timeout:60000});await live.locator('#start').tap();await live.locator('#chapter-start').tap();await live.click('#story-skip');
 await live.locator('#switch-action').tap();await live.waitForFunction(()=>document.querySelector('#hero-name').textContent==='つきねこ');
 assert.equal(await live.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');
 await ready(live);await live.locator('#switch-action').tap();await live.waitForFunction(()=>document.querySelector('#hero-name').textContent==='にゃんるな');
 await live.screenshot({path:`${out}/production-mobile.png`});check('The production build switches both heroes without a developer bridge');
 await prod.close();assert.deepEqual(errors,[]);check('No JavaScript, shader or resource errors');
 await writeFile(`${out}/report.json`,JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));
}finally{await browser.close();}
