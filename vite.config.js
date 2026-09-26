import {defineConfig} from 'vite';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {cachedMediaResponse} from './src/offline-range.js';
import {CONTENT_SECURITY_POLICY,SECURITY_HEADERS} from './security.config.js';
function browserSecurity(){return {
  name:'lunaria-browser-security',apply:'build',
  transformIndexHtml(){return [
    {tag:'meta',attrs:{'http-equiv':'Content-Security-Policy',content:CONTENT_SECURITY_POLICY},injectTo:'head-prepend'},
    {tag:'meta',attrs:{name:'referrer',content:'no-referrer'},injectTo:'head-prepend'},
  ];},
};}
function offlineBundle(){let config;return {name:'lunaria-offline-bundle',apply:'build',configResolved(value){config=value;},async closeBundle(){
  const base=config.base,dir=resolve(config.root,config.build.outDir);const files=[];
  async function visit(folder){for(const e of await readdir(folder,{withFileTypes:true})){const p=resolve(folder,e.name);if(e.isDirectory())await visit(p);else if(e.name!=='sw.js')files.push(p);}}
  await visit(dir);files.sort();const hash=createHash('sha256');hash.update('scoped-offline-v5-media-range'+base);for(const p of files){hash.update(relative(dir,p));hash.update(await readFile(p));}
  const prefix='lunaria-v1-'+createHash('sha256').update(base).digest('hex').slice(0,12)+'-';
  const cache=prefix+hash.digest('hex').slice(0,12);const urls=[base,...files.map(p=>base+relative(dir,p).replaceAll('\\','/'))];
  const worker=`const BASE=${JSON.stringify(base)};const PREFIX=${JSON.stringify(prefix)};const CACHE=${JSON.stringify(cache)};const FILES=${JSON.stringify(urls)};
${cachedMediaResponse.toString()}
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(url=>new Request(new URL(url,self.location.origin),{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&(k.startsWith(PREFIX)||(BASE==='/'&&/^lunaria-v1-[a-f0-9]{12}$/.test(k)))).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match(BASE+'index.html',{ignoreVary:true}))));return;}event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(request,{ignoreSearch:true,ignoreVary:true});return cached?cachedMediaResponse(request,cached):fetch(request);}));});`;
  await writeFile(resolve(dir,'sw.js'),worker);
}};}
export default defineConfig({
  plugins:[browserSecurity(),offlineBundle()],
  server:{host:'127.0.0.1',fs:{strict:true,allow:[resolve('.')],deny:[
    '**/.env', '**/.env.*', '**/*.{crt,pem,key}', '**/.git/**',
    ...['backups','audit','models','videos','out','art','docs'].map(dir=>`${resolve(dir)}/**`),
  ]}},
  preview:{host:'127.0.0.1',headers:SECURITY_HEADERS},
  build:{rolldownOptions:{output:{codeSplitting:{groups:[{name:'three-math',test:/node_modules\/three\/build\/three.core.js/,priority:30},{name:'three-renderer',test:/node_modules\/three\/build/,priority:20},{name:'three-effects',test:/node_modules\/three\/examples/,priority:10}]}}}},
});
