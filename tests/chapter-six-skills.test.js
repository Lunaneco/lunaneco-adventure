import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {SKILLS,skillsForParty,blessingSource,equippedSkills,OPEN_AS_COMMON} from '../src/blessings.js';

const cleared=()=>normalizeProgression({story:{version:2,actClears:Array.from({length:50},(_,i)=>i<28)}},HEROES);
const skill=id=>SKILLS.find(s=>s.id===id);

test('after chapter 6, party-wide skills are common and weapon-specific skills stay personal',()=>{
 const p=cleared();assert.equal(p.story.chapterSixCleared,true);
 const pool=skillsForParty(['lumi'],p),ids=pool.map(s=>s.id);
 for(const id of ['haste','focus','crit','reach','nova','orbit','saberGuard','vitality','ward','stride','leech'])assert.ok(ids.includes(id),id);
 assert.equal(ids.includes('penetration'),false);assert.equal(ids.includes('moonFrost'),false);assert.equal(ids.includes('preciseAim'),false);
 assert.ok(ids.includes('lumiPower'));assert.equal(ids.includes('saberPower'),false);
 assert.equal(blessingSource(skill('haste'),HEROES,p),'共通');assert.equal(blessingSource(skill('crit'),HEROES,p),'共通');
 assert.equal(blessingSource(skill('penetration'),HEROES,p),'つきねこの祝福');
 assert.match(skill('penetration').text,/つきねこ専用/);assert.match(skill('haste').text,/出撃中の全員/);
 assert.match(skill('moonFrost').text,/にゃんるな専用/);assert.match(skill('focus').text,/攻撃した本人/);
 assert.deepEqual(equippedSkills(p,'tsukineko'),[]);
 p.characters.tsukineko.level=15;p.characters.tsukineko.tree=['origin','blessing1','blessing2'];
 assert.ok(skillsForParty(['lumi'],p).some(s=>s.id==='preciseAim'));
 assert.equal(skillsForParty(['lumi'],normalizeProgression({story:{version:2,actClears:[true]}},HEROES)).some(s=>s.id==='haste'),false);
 assert.ok(OPEN_AS_COMMON.has('counterGuard'));assert.equal(OPEN_AS_COMMON.has('penetration'),false);
});
