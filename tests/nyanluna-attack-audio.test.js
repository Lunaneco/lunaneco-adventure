import test from 'node:test';
import assert from 'node:assert/strict';
import {Soundscape} from '../src/audio.js';
import {Adventure} from '../src/model.js';
import {battleVoiceCues} from '../src/voice-policy.js';
import {maxedHeheProfile} from './chapter-six-extra-fixtures.js';

test('Nyanluna normal/awakened attacks and impacts omit synthetic thumps while other combat effects remain',()=>{
 const audio=new Soundscape(),tones=[];audio.tone=(...args)=>tones.push(args);
 for(const detail of [{hero:0},{hero:0,awakened:true},{heroId:'nyanluna'}]){audio.play('attack',detail);audio.play('hit',detail);}assert.equal(tones.length,0);
 audio.play('shot',{hero:1});audio.play('hit',{heroId:'tsukineko'});audio.play('attack',{hero:6});assert.equal(tones.length,4);audio.play('hurt',{hero:0});assert.equal(tones.length,5);audio.play('ultimate');assert.equal(tones.length,12);
});
test('hit sound attribution follows the attacking hero even during support or after switching, and voices stay enabled',()=>{
 const g=new Adventure({act:0,progression:maxedHeheProfile(),party:['nyanluna','tsukineko'],hero:1});g.enemies=[];const enemy=g.spawnEnemy('moss',0,-5);g.drainEvents();g.hit(enemy,1,0,0,false,false,'nyanluna');assert.equal(g.drainEvents().find(e=>e.type==='hit').heroId,'nyanluna');
 const cues=battleVoiceCues([{type:'attack',hero:0,support:false}],g);assert.equal(cues[0].who,'nyanluna');assert.equal(cues[0].event,'attack');
});
