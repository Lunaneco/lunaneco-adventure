import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {HEHE_FORM_VOICE_MANIFEST} from '../src/hehe-form-voice-manifest.js';
const url=process.env.LUNARIA_URL??'http://127.0.0.1:4176/lunaneco-adventure/';
const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
await page.addInitScript(()=>{
 localStorage.setItem('lunaria-progression-v1',JSON.stringify({story:{version:2,actClears:Array(28).fill(true)},characters:{omsolo:{level:60,breaks:4},hehereal:{level:60,breaks:4}},tutorial:{firstBattleCompleted:true}}));
 localStorage.setItem('lunaria-party-v1',JSON.stringify({members:['omsolo','hehereal'],lead:'omsolo'}));
 localStorage.setItem('lunaria-settings-v1',JSON.stringify({quality:'low',sound:false,music:false,voice:false,motion:false}));
});
const pass=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));};
try{
 await page.goto(url+`?release-check=${version}`);await page.waitForSelector('#loading',{state:'detached',timeout:120000});
 assert.equal(await page.locator('.version').innerText(),`Ver. ${version}`);assert.equal(await page.evaluate(()=>typeof window.__LUNARIA_TEST__),'undefined');pass('Current production release loads without a development bridge',{version});
 await page.locator('#start').click();await page.locator('[data-chapter="5"]').click();await page.locator('[data-act="25"]').click();assert.match(await page.locator('.stage-briefing').innerText(),/推奨 Lv.60/);
 assert.match(await page.locator('.brief-party-rule').innerText(),/クリア後の自由編成/);
 await page.locator('#chapter-start').click();await page.locator('#story-skip').click();assert.equal(await page.locator('#hero-name').innerText(),'オムソロ');assert.equal(await page.locator('#switch-action').isVisible(),true);assert.equal(await page.locator('#predation').isEnabled(),true);await page.locator('#switch-action').click();assert.equal(await page.locator('#hero-name').innerText(),'へへりある');const hp=await page.locator('#hp').innerText();
 await page.locator('#predation').click();assert.equal(await page.locator('#hero-name').innerText(),'へへへ');assert.equal(await page.locator('#predation').isEnabled(),false);assert.equal(await page.locator('#predation-status').innerText(),'解除不可');assert.equal(await page.locator('#switch-action').isVisible(),false);assert.match(await page.locator('.partner-label').innerText(),/オムソロ取り込み中/);assert.equal(await page.locator('#damage-flash').evaluate(e=>e.classList.contains('flash')),false);
 assert.match(await page.locator('#switch .portrait').evaluate(e=>getComputedStyle(e).backgroundImage),/hehe-form-face-v1.png/);await page.keyboard.press('KeyF');assert.equal(await page.locator('#hero-name').innerText(),'へへへ');pass('Chapter six free duo supports switching and irreversible, damage-free capture with the bow',{beforeHp:hp,afterHp:await page.locator('#hp').innerText()});
 await page.locator('#pause').click();await page.screenshot({path:'audit/chapter-six/predation-production.png'});await page.locator('#quit').click();assert.equal(await page.locator('#chapter-menu').isVisible(),true);assert.equal(await page.locator('.portrait.hehe-form').filter({visible:true}).count(),0);pass('Returning to the chapter menu restores the normal selection and game remains responsive');
 for(const [id,item] of Object.entries(HEHE_FORM_VOICE_MANIFEST)){const ok=await page.evaluate(async path=>{const r=await fetch(path);return r.ok&&(await r.arrayBuffer()).byteLength>1000;},new URL(item.file,url).href);assert.equal(ok,true,id);}
 pass('All three supplied form voices are published under the Pages prefix');assert.deepEqual(errors,[]);await writeFile('audit/chapter-six/predation-production-report.json',JSON.stringify({url,checks,errors},null,2));
}finally{await browser.close();}
