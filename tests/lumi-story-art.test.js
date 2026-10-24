import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {SEVENTH_CHAPTER_SCENES} from '../src/chapter-seven.js';
import {DARK_PARESIS_SCENES} from '../src/dark-paresis.js';
import {STORY_CAST,storySpeaker} from '../src/story-cast.js';

const order=['opening','ruins','sanctuary','ending'];
const linesOf=acts=>acts.flatMap(act=>order.filter(key=>act[key]).flatMap(key=>act[key].lines));
const file=url=>existsSync('public/'+url.replace(/^\/+/,''));

test('Rumi and Mochinyafe first meet over the meeting illustration, before any other new Rumi art',()=>{
  const lines=linesOf(SEVENTH_CHAPTER_SCENES);
  const first=lines.findIndex(line=>line.who==='lumi');
  assert.ok(first>=0);
  assert.equal(lines[first].cg,'assets/story/lumi-meets-mochinyafe-v1.jpg','her very first line plays over the meeting');
  const firstArt=lines.findIndex(line=>line.cg||line.portrait);
  assert.equal(firstArt,first,'no other new Rumi image comes before the meeting');
  const meeting=lines.filter(line=>line.cg==='assets/story/lumi-meets-mochinyafe-v1.jpg');
  assert.equal(meeting.length,4,'the whole first exchange, up to her cat ears appearing, keeps the meeting on screen');
  assert.match(meeting.at(-1).text,/ねこみみ/);
  const join=lines.find(line=>line.cg==='assets/story/lumi-prism-coat-v1.jpg');
  assert.match(join.text,/るみが仲間に加わった/);
  for(const line of lines.filter(line=>line.cg))assert.ok(file(line.cg)&&line.cgAlt,line.cg);
});

test('Rumi’s expressions follow the feeling of each line and every portrait has its art',()=>{
  const expressions={lumiThink:'lumi-think-v1.png',lumiShy:'lumi-shy-v1.png',lumiJoy:'lumi-joy-v1.png',lumiLaugh:'lumi-laugh-v1.png'};
  for(const [id,name] of Object.entries(expressions)){
    assert.equal(STORY_CAST[id].name,'るみ');
    assert.ok(STORY_CAST[id].image.endsWith('assets/story/'+name));
    assert.ok(file(STORY_CAST[id].image),name);
  }
  const lines=[...linesOf(SEVENTH_CHAPTER_SCENES),...linesOf(DARK_PARESIS_SCENES)].filter(line=>line.who==='lumi'&&line.portrait);
  assert.ok(lines.length>=10);
  for(const line of lines){assert.ok(expressions[line.portrait],line.portrait);assert.equal(storySpeaker(line.portrait).name,'るみ');}
  const of=text=>lines.find(line=>line.text.includes(text))?.portrait;
  assert.equal(of('少し恥ずかしいけれど'),'lumiShy');
  assert.equal(of('うれしいです'),'lumiJoy');
  assert.equal(of('許すかどうかは'),'lumiThink');
  assert.equal(of('手伝ってくれますか'),'lumiLaugh');
});
