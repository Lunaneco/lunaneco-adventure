import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {WEAPON_CATALOG,weaponImage} from '../src/weapons.js';
import {ultimateArtUrl} from '../src/ultimate-art.js';
import {HEROES} from '../src/model.js';

// Every gacha weapon through the dev preview page (weapon-summon-preview.html): the full summon at
// 390x844 with the cosmetic routes spread over the catalogue, then the settled result of every weapon
// for each result variant and screen size, plus contact sheets. Needs a dev server (LUNARIA_URL).
const BASE=process.env.LUNARIA_URL||'http://127.0.0.1:5189/',PAGE=new URL('weapon-summon-preview.html',BASE).href,out='audit/weapon-summon-catalog';
await mkdir(out,{recursive:true});
const ITEMS=WEAPON_CATALOG.filter(item=>item.rarity.rank>1),FAMILIES=[...new Set(ITEMS.map(item=>item.weapon))];
const heroName=id=>HEROES.find(h=>h.id===id).name,slug=item=>`${item.weapon.id}-r${item.rarity.rank}`;
const RANK={blue:2,purple:3,gold:4};
// ★3 alternates straight purple and a promotion; ★4 cycles gold, promotion and omen within each hero.
const routeOf=item=>{const f=FAMILIES.indexOf(item.weapon);return item.rarity.rank===3?['direct','promote'][f%2]:item.rarity.rank===4?['direct','promote','omen'][f%3]:'direct';};
const EXPECTED={2:{direct:{colors:['blue']}},3:{direct:{colors:['purple']},promote:{colors:['blue','purple']}},4:{direct:{colors:['gold']},promote:{colors:['blue','gold']},omen:{colors:['gold'],omen:true}}};
const SIZES=[[320,568],[375,667],[390,844],[768,1024],[844,390],[1440,900]];
const VARIANTS=[{name:'new',duplicate:'false',locked:'false'},{name:'duplicate',duplicate:'true',locked:'false'},{name:'locked',duplicate:'false',locked:'true'}];
const PLAYER_VIEW='.preview-bar{visibility:hidden!important}';
const later=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const errors=[],failures=[],report={full:[],layout:[]},labels={};

const browser=await chromium.launch({channel:'chrome',headless:true});
async function open(viewport){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(`${m.text()} ${m.location().url}`);});
  await page.goto(PAGE,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>{const v=document.querySelector('.summon-video');return v.readyState>=3&&v.buffered.length&&v.buffered.end(v.buffered.length-1)>=6.2;},null,{timeout:120000,polling:250});
  await page.waitForFunction(()=>[...document.querySelectorAll('.preview img')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:30000});
  // Full-page captures paint off-screen decoding="async" images blank unless they are decoded first.
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('.preview img')].map(img=>img.decode())));
  await page.evaluate(()=>{
    const root=document.querySelector('.summon-root'),video=root.querySelector('.summon-video'),voice=window.__LUNARIA_SUMMON_PREVIEW__.voice,play=voice.play.bind(voice);
    window.__log=[];window.__voices=[];
    new MutationObserver(()=>window.__log.push({phase:root.dataset.phase,signal:root.dataset.signal,video:video.currentTime,live:root.classList.contains('video-live'),noVideo:root.classList.contains('no-video')})).observe(root,{attributes:true,attributeFilter:['data-phase']});
    voice.play=async(id,options)=>{const ok=await play(id,options);window.__voices.push({id,ok});return ok;};
  });
  return page;
}
const choose=async(page,settings)=>{for(const [name,value] of Object.entries(settings))await page.locator(`input[name="${name}"][value="${value}"]`).check();};
const reached=(page,phase,timeout=25000)=>page.waitForFunction(p=>{const root=document.querySelector('.summon-root');return p==='final'?root.classList.contains('is-final'):root.classList.contains(`at-${p}`);},phase,{polling:'raf',timeout});
const shot=(page,name)=>page.screenshot({path:`${out}/${name}.png`,style:PLAYER_VIEW});
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const measure=page=>page.evaluate(()=>{
  const q=s=>document.querySelector(s),box=s=>q(s).getBoundingClientRect(),loaded=img=>img.complete&&img.naturalWidth>0?new URL(img.currentSrc).pathname:null;
  const stage=box('.summon-stage'),weapon=box('.summon-weapon'),sheet=box('.draw-sheet'),close=box('#weapon-draw-result [data-close]'),root=q('.summon-root'),card=q('#weapon-draw-result');
  const halo={x:stage.left+stage.width*.52,y:stage.top+stage.height*.368};
  return {art:loaded(q('.summon-weapon-art')),cutin:loaded(q('.summon-cutin-band img')),cutinName:q('.summon-cutin-copy strong').textContent,
    weaponOffset:Math.hypot(weapon.left+weapon.width/2-halo.x,weapon.top+weapon.height/2-halo.y),overflow:document.documentElement.scrollWidth>innerWidth,scrolled:root.scrollLeft+root.scrollTop,
    cardScroll:card.scrollHeight-card.clientHeight,close:{top:close.top,bottom:close.bottom,height:close.height},sheet:{left:sheet.left,right:sheet.right},titleTop:box('.draw-title').top,
    ringBottom:halo.y+stage.width*.25,stageRight:stage.right,width:innerWidth,height:innerHeight,lit:document.querySelectorAll('.draw-stars i.lit').length,text:card.innerText,
    bar:!q('.preview-bar').classList.contains('hidden'),label:q('.preview-label').textContent,focusClose:!!document.activeElement?.matches('#weapon-draw-result [data-close]')};
});
function layoutProblems(l){
  const p=[],portrait=l.width<l.height;
  if(l.overflow)p.push('page overflows sideways');
  if(l.scrolled)p.push(`stage scrolled ${l.scrolled}px`);
  if(l.cardScroll>1)p.push(`result needs ${Math.round(l.cardScroll)}px of scrolling`);
  if(l.close.top<0||l.close.bottom>l.height+1)p.push(`close button off screen (${Math.round(l.close.top)}-${Math.round(l.close.bottom)})`);
  if(l.close.height<44)p.push(`close button ${Math.round(l.close.height)}px tall`);
  if(l.sheet.left<0||l.sheet.right>l.width)p.push('result sheet off screen');
  if(portrait&&l.titleTop<l.ringBottom-4)p.push(`title overlaps the halo by ${Math.round(l.ringBottom-l.titleTop)}px`);
  if(!portrait&&l.sheet.left<l.stageRight-1)p.push('result overlaps the altar');
  if(l.weaponOffset>=2)p.push(`weapon ${l.weaponOffset.toFixed(1)}px off the halo centre`);
  return p;
}

try{
  const page=await open({width:390,height:844});
  await page.screenshot({path:`${out}/gallery-390.png`,fullPage:true});
  for(const item of ITEMS){
    const route=routeOf(item),want=EXPECTED[item.rarity.rank][route],name=slug(item),issues=[];
    await page.locator(`input[name="route"][value="${route}"]`).check();
    await page.evaluate(()=>{window.__log=[];window.__voices=[];});
    const started=Date.now();await page.locator(`[data-play="${item.id}"]`).tap();
    const moments=[...(want.omen?[['omen',350]]:[]),...(want.colors.length>1?[['crack',420]]:[]),...(item.rarity.rank===4?[['cutin',420]]:[]),['reveal',650]];
    for(const [phase,wait] of moments){await reached(page,phase);await later(wait);await shot(page,`${name}-${phase}`);}
    if(!await page.evaluate(()=>document.querySelector('.preview-bar').classList.contains('hidden')))issues.push('preview bar shown during the summon');
    await reached(page,'final');const seconds=Number(((Date.now()-started)/1000).toFixed(1));await later(900);await shot(page,`${name}-final`);
    if(item===ITEMS[0])await page.screenshot({path:`${out}/preview-bar.png`});
    const l=await measure(page),log=await page.evaluate(()=>window.__log),voices=await page.evaluate(()=>window.__voices),signals=log.map(e=>e.signal),ranks=signals.map(s=>RANK[s]);
    issues.push(...layoutProblems(l));
    if(!ranks.every((rank,i)=>rank<=item.rarity.rank&&(i===0||rank>=ranks[i-1])))issues.push(`colours ${signals.join('>')} exceed ★${item.rarity.rank} or step down`);
    for(const color of want.colors)if(!signals.includes(color))issues.push(`never showed ${color}`);
    if(log.some(e=>e.phase==='omen')!==!!want.omen)issues.push('omen mismatch');
    if(log.some(e=>e.phase==='crack')!==want.colors.length>1)issues.push('promotion mismatch');
    if(!log.some(e=>e.live)||log.some(e=>e.noVideo))issues.push('the clip did not play through');
    if(l.art!==weaponImage(item))issues.push(`weapon art ${l.art} instead of ${weaponImage(item)}`);
    if(item.rarity.rank===4){
      if(l.cutin!==ultimateArtUrl(item.heroId))issues.push(`cut-in art ${l.cutin}`);
      if(l.cutinName!==heroName(item.heroId))issues.push(`cut-in name ${l.cutinName}`);
      if(!voices.some(v=>v.id===`${item.heroId}-treasure-1`&&v.ok))issues.push(`legendary voice ${JSON.stringify(voices)}`);
    }else if(voices.length)issues.push(`unexpected voice ${JSON.stringify(voices)}`);
    if(l.lit!==item.rarity.rank)issues.push(`${l.lit} stars lit`);
    for(const text of [item.weapon.name,`${heroName(item.heroId)}専用`,`★${item.rarity.rank}`])if(!l.text.includes(text))issues.push(`result lacks ${text}`);
    if(!l.bar||!l.label.includes(item.weapon.name))issues.push('preview bar missing at the result');
    if(!l.focusClose)issues.push('focus did not move to the close button');
    labels[name]=l.label.split('　').at(-1);
    await later(400);await page.locator('#weapon-draw-result [data-close]').tap();await page.waitForFunction(()=>!document.querySelector('#weapon-summon').open);
    if(!await page.evaluate(id=>document.activeElement?.dataset.play===id,item.id))issues.push('focus did not return to its button');
    report.full.push({weapon:name,route:labels[name],seconds,issues});failures.push(...issues.map(issue=>`${name} full summon: ${issue}`));
    console.log(`${issues.length?'FAIL':'ok  '} ${name.padEnd(18)} ${labels[name].padEnd(12)} ${seconds}s${issues.length?' '+issues.join('; '):''}`);
  }
  console.log(`${report.full.every(r=>!r.issues.length)?'PASS':'FAIL'} full summons: ${ITEMS.length} weapons at 390x844`);

  await page.addStyleTag({content:'*,*::before,*::after{transition:none!important}'});
  await choose(page,{route:'auto'});
  for(const [width,height] of SIZES){
    const size=`${width}x${height}`;await page.setViewportSize({width,height});
    for(const variant of VARIANTS){
      await choose(page,{duplicate:variant.duplicate,locked:variant.locked});
      await page.locator(`[data-play="${ITEMS[0].id}"]`).click();
      for(const [i,item] of ITEMS.entries()){
        if(i)await page.keyboard.press('ArrowRight');
        await page.evaluate(()=>window.__LUNARIA_SUMMON_PREVIEW__.summon.skip());await reached(page,'final');await settle(page);
        const l=await measure(page),issues=layoutProblems(l),name=slug(item);
        if(!l.label.includes(item.weapon.name)||!l.text.includes(item.weapon.name))issues.push(`showed ${l.label} instead`);
        if(variant.name==='duplicate'&&!/DUPLICATE REWARD[\s\S]*星の芽/.test(l.text))issues.push('duplicate reward missing');
        if(variant.name==='locked'&&item.heroId!=='nyanluna'&&!/加入後に使えるよう保管しました/.test(l.text))issues.push('locked note missing');
        if(issues.length||variant.name==='new'&&['320x568','844x390'].includes(size))await shot(page,`layout-${size}-${variant.name}-${name}`);
        report.layout.push({size,variant:variant.name,weapon:name,issues});failures.push(...issues.map(issue=>`${name} ${size} ${variant.name}: ${issue}`));
      }
      await later(400);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#weapon-summon').open);
      const bad=report.layout.filter(r=>r.size===size&&r.variant===variant.name&&r.issues.length);
      console.log(`${bad.length?'FAIL':'ok  '} ${size.padEnd(9)} ${variant.name.padEnd(9)} ${bad.length?bad.map(r=>`${r.weapon}: ${r.issues.join(', ')}`).join(' | '):'all 27 fit'}`);
    }
  }
  console.log(`${report.layout.every(r=>!r.issues.length)?'PASS':'FAIL'} layouts: ${ITEMS.length} weapons x ${VARIANTS.length} result variants x ${SIZES.length} sizes`);
  await page.setViewportSize({width:1280,height:900});await page.screenshot({path:`${out}/gallery-1280.png`,fullPage:true});

  // Contact sheets: columns are hero x rarity, rows are each hero's three weapon types.
  const grid=[0,1,2].flatMap(row=>[0,1,2].flatMap(hero=>[2,3,4].map(rank=>ITEMS.find(item=>item.weapon===FAMILIES[hero*3+row]&&item.rarity.rank===rank))));
  const failed=new Set(failures.map(f=>f.split(' ')[0]));
  const caption=(item,route=true)=>`${item.weapon.name} ★${item.rarity.rank}${route?`<br><small>${labels[slug(item)]}</small>`:''}`;
  async function sheet(name,title,cells,{columns,width,crop}){
    const scale=width/crop.w,frame=`width:${width}px;height:${Math.round(crop.h*scale)}px`,img=`width:${Math.round(crop.vw*scale)}px;left:${-Math.round(crop.x*scale)}px;top:${-Math.round(crop.y*scale)}px`;
    const html=`<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:20px;width:max-content;background:#0b0f1a;color:#e8e2d0;font:12px/1.45 "Hiragino Kaku Gothic ProN",sans-serif}h1{margin:0 0 14px;font-size:16px;font-weight:600}.grid{display:grid;grid-template-columns:repeat(${columns},${width}px);gap:14px 10px}figure{margin:0}.frame{position:relative;overflow:hidden;border-radius:6px;background:#000;${frame}}.frame img{position:absolute;${img}}.bad .frame{outline:3px solid #ff5a5a}figcaption{margin-top:5px}small{color:#9fb0c2}</style><h1>${title}</h1><div class="grid">${cells.map(c=>`<figure class="${c.bad?'bad':''}"><div class="frame"><img src="${c.file}"></div><figcaption>${c.caption}</figcaption></figure>`).join('')}</div>`;
    await writeFile(`${out}/${name}.html`,html);
    const sheetPage=await browser.newPage({viewport:{width:800,height:600}});
    await sheetPage.goto(pathToFileURL(resolve(out,`${name}.html`)).href);await sheetPage.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
    await sheetPage.screenshot({path:`${out}/${name}.png`,fullPage:true});await sheetPage.close();
  }
  const phone={x:0,y:0,w:390,h:844,vw:390};
  await sheet('sheet-reveal','武器の出現（390×844・天輪部分）',grid.map(item=>({file:`${slug(item)}-reveal.png`,caption:caption(item),bad:failed.has(slug(item))})),{columns:9,width:180,crop:{x:45,y:160,w:300,h:300,vw:390}});
  await sheet('sheet-final','結果画面（390×844）',grid.map(item=>({file:`${slug(item)}-final.png`,caption:caption(item),bad:failed.has(slug(item))})),{columns:9,width:180,crop:phone});
  await sheet('sheet-cutin','★4 カットイン（390×844）',grid.filter(item=>item.rarity.rank===4).map(item=>({file:`${slug(item)}-cutin.png`,caption:caption(item)})),{columns:9,width:180,crop:phone});
  await sheet('sheet-final-320x568','結果画面（320×568）',grid.map(item=>({file:`layout-320x568-new-${slug(item)}.png`,caption:caption(item,false)})),{columns:9,width:180,crop:{x:0,y:0,w:320,h:568,vw:320}});
  await sheet('sheet-final-844x390','結果画面（844×390）',ITEMS.map(item=>({file:`layout-844x390-new-${slug(item)}.png`,caption:caption(item,false)})),{columns:3,width:420,crop:{x:0,y:0,w:844,h:390,vw:844}});
  console.log('Contact sheets written');
}finally{
  await writeFile(`${out}/report.json`,JSON.stringify({date:new Date().toISOString(),page:PAGE,failures,errors,...report},null,2));
  await browser.close();
}
assert.deepEqual(errors,[],'browser errors');
assert.deepEqual(failures,[],`${failures.length} problems`);
console.log('PASS catalog: every gacha weapon summons, reveals and fits');
