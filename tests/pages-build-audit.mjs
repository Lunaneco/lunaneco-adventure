import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {MUSIC_TRACKS} from '../src/music.js';
import {createHash} from 'node:crypto';
import {CACHE_MODEL_NAMES as HERO_MODEL_NAMES,heroModelPath} from '../src/hero-model-paths.js';

const prefixes=[];
for(const [directory,base] of [['dist','/'],['dist-pages','/lunaneco-adventure/']]){
  const html=await readFile(`${directory}/index.html`,'utf8');
  assert.match(html,/Content-Security-Policy/);
  for(const [,path] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    assert.ok(path.startsWith(base),`HTML asset outside ${base}: ${path}`);
    assert.ok((await stat(resolve(directory,path.slice(base.length)))).isFile());
  }
  const manifest=JSON.parse(await readFile(`${directory}/manifest.webmanifest`,'utf8'));
  const origin='https://game.example',manifestUrl=origin+base+'manifest.webmanifest';
  for(const key of ['id','start_url','scope'])assert.equal(new URL(manifest[key],manifestUrl).href,origin+base);
  for(const icon of manifest.icons)assert.ok(new URL(icon.src,manifestUrl).href.startsWith(origin+base));

  const handlers={},deleted=[],matches=[];let installed;
  const cache={addAll:async files=>{installed=files.map(request=>{assert.equal(request.cache,'reload');return new URL(request.url).pathname;});},match:async request=>{
    const url=typeof request==='string'?request:request.url;
    matches.push(url);if(url===origin+base+MUSIC_TRACKS.field.file)return new Response('0123456789',{headers:{'Content-Type':'audio/mpeg'}});return url===base+'index.html'?new Response('offline game'):undefined;
  }};
  let config;
  const sandbox={URL,Request,Response,Headers,self:{location:{origin},skipWaiting:async()=>{},clients:{claim:async()=>{}},
    addEventListener:(type,handler)=>{handlers[type]=handler;}},
    caches:{open:async()=>cache,keys:async()=>[config.CACHE,config.PREFIX+'previous','unrelated-app','lunaria-v1-other-path-current','lunaria-v1-0123456789ab'],delete:async key=>{deleted.push(key);}},
    fetch:async()=>{throw new Error('network offline');}};
  vm.runInNewContext(await readFile(`${directory}/sw.js`,'utf8')+';globalThis.config={BASE,PREFIX,CACHE,FILES};',sandbox);
  config=sandbox.config;prefixes.push(config.PREFIX);
  assert.equal(config.BASE,base);
  let pending;
  handlers.install({waitUntil:promise=>{pending=promise;}});await pending;
  assert.ok(installed.includes(base+'index.html'));
  for(const name of HERO_MODEL_NAMES){
    const bytes=await readFile(resolve('public',heroModelPath(name,{})));
    const revision=createHash('sha256').update(bytes).digest('hex').slice(0,12);
    const path=heroModelPath(name,{[name]:revision});
    assert.ok(installed.includes(base+path),`Offline cache includes the current ${name} revision`);
    assert.ok(!installed.includes(base+heroModelPath(name,{})),'Old canonical paths cannot shadow updated models');
    assert.deepEqual(await readFile(resolve(directory,path)),bytes,'Published model matches the source asset');
  }
  assert.ok(installed.includes(base+'assets/title/adventure-loop.mp4'));
  assert.ok(installed.includes(base+'assets/title/adventure-poster.jpg'));
  for(const track of Object.values(MUSIC_TRACKS))assert.ok(installed.includes(base+track.file));
  for(const path of installed){
    assert.ok(path.startsWith(base),`Offline URL outside ${base}: ${path}`);
    if(path!==base)assert.ok((await stat(resolve(directory,path.slice(base.length)))).isFile());
    assert.doesNotMatch(path,/\/(?:src|tests|audit|backups|node_modules|\.git)\//);
  }
  handlers.activate({waitUntil:promise=>{pending=promise;}});await pending;
  assert.deepEqual(deleted.sort(),[config.PREFIX+'previous',...(base==='/'?['lunaria-v1-0123456789ab']:[])].sort());
  const fetchEvent=(url,mode='navigate',method='GET')=>{
    let response;
    handlers.fetch({request:{url,mode,method},respondWith:value=>{response=value;}});
    return response;
  };
  assert.equal(fetchEvent('https://other.example'+base),undefined);
  assert.equal(fetchEvent(origin+base,'navigate','POST'),undefined);
  if(base!=='/')assert.equal(fetchEvent(origin+'/another-game/'),undefined);
  assert.equal(await(await fetchEvent(origin+base+'?offline=1')).text(),'offline game');
  assert.equal(matches.at(-1),base+'index.html');
  let mediaResponse;
  handlers.fetch({request:new Request(origin+base+MUSIC_TRACKS.field.file,{headers:{Range:'bytes=2-5'}}),respondWith:r=>mediaResponse=r});
  const part=await mediaResponse;assert.equal(part.status,206);assert.equal(part.headers.get('Content-Range'),'bytes 2-5/10');assert.equal(await part.text(),'2345');
  console.log(`PASS ${directory}: HTML/PWA paths, ${installed.length} offline URLs, scoped cache cleanup and offline navigation`);
}
assert.notEqual(prefixes[0],prefixes[1]);
console.log('PASS root and Pages builds use separate offline caches');
