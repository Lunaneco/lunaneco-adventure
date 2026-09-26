import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='audit/limit-tree-v138';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
const key='lunaria-progression-v1',saved=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const check=(name,data={})=>{checks.push({name,...data});console.log('PASS',name,JSON.stringify(data));};
async function open(profile,production=false){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await context.addInitScript(({key,profile})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(profile));localStorage.setItem('lunaria-record-v1',JSON.stringify({...JSON.parse(localStorage.getItem('lunaria-record-v1')||'{}'),chapterOneCleared:true}));localStorage.setItem('lunaria-settings-v1',JSON.stringify({sound:false,music:false,quality:'low',motion:false}));sessionStorage.setItem('seeded','1');}},{key,profile});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(production?(process.env.AUDIT_URL??'http://127.0.0.1:4187/lunaneco-adventure/'):(process.env.LUNARIA_URL??'http://127.0.0.1:5177/'));await page.waitForSelector('#loading',{state:'detached',timeout:60000});await page.click('#chapter-menu-open');return {page,context};
}
const seed={characters:{nyanluna:{level:20,xp:99999,breaks:0,tree:['origin','guard1']},tsukineko:{level:1,xp:0,breaks:0},future_hero:{level:7,xp:15,breaks:0}},inventory:{limitStone:7,starBud:1000,moonDew:100,wardenCore:20,moonPrism:100,astralCore:30}};
try{
 const {page,context}=await open(seed);await page.click('[data-menu-tab="growth"]');assert.equal(await page.locator('[data-limit-break]').count(),0);await page.click('[data-open-tree="nyanluna"][data-tree-target]');
 assert.equal(await page.locator('#talent-panel').isVisible(),true);assert.equal(await page.locator('[data-tree-node="limit30"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.limit-node').count(),3);assert.equal(await page.locator('[data-tree-node]').count(),11);
 assert.equal(await page.locator('[data-material-count="limitStone"]').innerText(),'7');assert.match(await page.locator('#limit-next-level').innerText(),/20.*30/);const initial=await saved(page);assert.deepEqual(initial.characters.nyanluna,seed.characters.nyanluna);
 check('The growth-card shortcut opens the correct cap node within the eleven-node tree');
 for(const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.locator('.limit-branch').scrollIntoViewIfNeeded();
  const boxes=await page.locator('.limit-node').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+20)?.closest('button')===el};}));
  for(const b of boxes)assert.ok(b.x>=0&&b.right<=size.width&&b.width>=44&&b.height>=44&&b.hit,JSON.stringify({size,b}));
  assert.equal(await page.evaluate(()=>document.querySelector('#chapter-menu').scrollWidth>innerWidth),false);
  await page.screenshot({path:`${out}/branch-${size.width}.png`});await page.locator('.talent-unlock').scrollIntoViewIfNeeded();const b=await page.locator('.talent-unlock').boundingBox();assert.ok(b.x>=0&&b.x+b.width<=size.width&&b.height>=44&&b.y+b.height<=size.height);
  assert.equal(await page.locator('#talent-detail').evaluate(el=>el.scrollWidth>el.clientWidth),false);await page.screenshot({path:`${out}/detail-${size.width}.png`});
 }
 check('All three cap nodes, the stone wallet and unlock details remain accessible at four screen sizes');
 await page.setViewportSize({width:390,height:844});await page.click('[data-tree-node="limit50"]');assert.equal(await page.locator('[data-unlock-node="limit50"]').isDisabled(),true);assert.match(await page.locator('.talent-requirements').innerText(),/レベル覚醒 II/);assert.deepEqual(await saved(page),initial);
 check('A future cap cannot skip a previous breakthrough or consume stones early');
 await page.click('[data-tree-node="limit30"]');await page.evaluate(()=>{document.querySelector('[data-unlock-node="limit30"]').click();document.querySelector('[data-unlock-node="limit30"]').click();});
 let p=await saved(page);assert.equal(p.inventory.limitStone,6);assert.equal(p.characters.nyanluna.breaks,1);assert.equal(p.characters.nyanluna.level,30);assert.deepEqual(p.characters.nyanluna.tree,seed.characters.nyanluna.tree);
 assert.equal(await page.locator('[data-unlock-node="limit30"]').isDisabled(),true);assert.equal(await page.locator('[data-tree-node="limit40"]').evaluate(el=>el.classList.contains('available')),true);assert.equal(await page.locator('[data-material-count="limitStone"]').innerText(),'6');
 check('The first cap spends one stone even with a double press and banked XP that reaches Lv.30');
 for(const [id,cap,left] of [['limit40',40,4],['limit50',50,0]]){await page.click(`[data-tree-node="${id}"]`);assert.equal(await page.locator(`[data-unlock-node="${id}"]`).isEnabled(),true);await page.locator(`[data-unlock-node="${id}"]`).tap();p=await saved(page);assert.equal(p.characters.nyanluna.level,cap);assert.equal(p.inventory.limitStone,left);}
 assert.equal(p.characters.nyanluna.xp,0);assert.equal(p.characters.nyanluna.breaks,3);assert.deepEqual(p.characters.tsukineko,initial.characters.tsukineko);assert.deepEqual(p.characters.future_hero,initial.characters.future_hero);assert.deepEqual(p.inventory,{...initial.inventory,limitStone:0,starBud:340,moonDew:88,wardenCore:17,moonPrism:20,astralCore:6});assert.equal(await page.locator('.limit-node.unlocked').count(),3);
 await page.locator('.limit-branch').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/complete-mobile.png`});check('All three cap steps reach Lv.50 while preserving ability stars and the other characters, spending the exact materials');
 await page.click('[data-menu-tab="growth"]');assert.equal(await page.locator('#limit-stones').innerText(),'0');assert.equal(await page.locator('#growth-nyanluna .growth-level b').innerText(),'50');assert.match(await page.locator('#growth-nyanluna .growth-tree-link').innerText(),/5 \/ 22/);
 await page.click('[data-open-tree="nyanluna"][data-tree-target]');assert.equal(await page.locator('[data-tree-node="limit50"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-unlock-node="limit50"]').isDisabled(),true);
 await page.reload();await page.waitForSelector('#loading',{state:'detached'});assert.deepEqual(await saved(page),p);await page.click('#chapter-menu-open');await page.click('[data-menu-tab="talent"]');assert.equal(await page.locator('.limit-node.unlocked').count(),3);await page.click('[data-tree-node="limit30"]');assert.match(await page.locator('.talent-owned-note').innerText(),/現在の上限はLv.50/);
 check('Tree states, cap summaries and the growth-card shortcut agree after reload');await context.close();

 const legacy=await open({characters:{nyanluna:{level:30,xp:20,breaks:1},tsukineko:{level:1}},inventory:{limitStone:0}});await legacy.page.click('[data-menu-tab="growth"]');await legacy.page.click('[data-open-tree="nyanluna"][data-tree-target]');assert.equal(await legacy.page.locator('[data-tree-node="limit40"]').getAttribute('aria-pressed'),'true');assert.equal(await legacy.page.locator('[data-tree-node="limit30"]').evaluate(el=>el.classList.contains('unlocked')),true);assert.match(await legacy.page.locator('.talent-requirements').innerText(),/覚醒の輝石が2個不足/);assert.equal(await legacy.page.locator('[data-unlock-node="limit40"]').isDisabled(),true);
 await legacy.page.click('[data-tree-hero="tsukineko"]');await legacy.page.click('[data-tree-node="limit30"]');assert.equal(await legacy.page.locator('.limit-node.unlocked').count(),0);assert.match(await legacy.page.locator('.talent-requirements').innerText(),/Lv.20が必要/);await legacy.context.close();
 check('Legacy breakthroughs appear as unlocked nodes; insufficient stones and low levels stay locked');

 const live=await open({characters:{nyanluna:{level:20,xp:664,breaks:0}},inventory:{limitStone:1,starBud:60,moonDew:12,wardenCore:3}},true);assert.equal(await live.page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');await live.page.click('[data-menu-tab="talent"]');await live.page.click('[data-tree-node="limit30"]');assert.match(await live.page.locator('#limit-next-level').innerText(),/20.*21/);await live.page.locator('[data-unlock-node="limit30"]').tap();assert.deepEqual((await saved(live.page)).characters.nyanluna,{level:21,xp:136,breaks:1,tree:[]});await live.page.reload();await live.page.waitForSelector('#loading',{state:'detached'});assert.equal((await saved(live.page)).inventory.limitStone,0);await live.context.close();
 check('The production build consumes the stone and restores banked XP without a development bridge');
 assert.deepEqual(errors,[]);check('No JavaScript, shader or resource errors');await writeFile(`${out}/report.json`,JSON.stringify({checks,errors,date:new Date().toISOString()},null,2));
}finally{await browser.close();}
