import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage();const results=[];
try{
 await page.goto('http://127.0.0.1:5174');await page.waitForSelector('#loading',{state:'detached',timeout:60000});
 await page.evaluate(async()=>{const {ChapterStory}=await import('/src/chapter.js');document.getElementById('story-dialog').remove();window.__storyLayout=new ChapterStory();});
 for(const [width,height] of [[320,568],[390,844],[844,390]]){
  await page.setViewportSize({width,height});
  const result=await page.evaluate(async()=>{const {SECOND_CHAPTER_SCENES}=await import('/src/chapter-two-story.js');const story=window.__storyLayout,failures=[];let pages=0;for(const act of SECOND_CHAPTER_SCENES)for(const scene of Object.values(act)){story.show(scene,()=>{});for(let i=0;i<scene.lines.length;i++){story.index=i;story.render();await document.querySelector('.story-character-image').decode();const next=document.querySelector('#story-next').getBoundingClientRect(),dialog=document.querySelector('#story-dialog'),cast=document.querySelector('.story-cast').getBoundingClientRect(),text=document.querySelector('.story-dialogue>p').getBoundingClientRect();if(next.bottom>innerHeight+1||next.right>innerWidth+1||next.left<0||cast.height<50||text.left<0||text.right>innerWidth+1||dialog.scrollWidth>dialog.clientWidth+1)failures.push({scene:scene.kicker,page:i,next:next.toJSON(),cast:cast.toJSON()});pages++;}story.finish();}return {pages,failures};});
  results.push({width,height,...result});assert.deepEqual(result.failures,[]);
 }
 console.log(JSON.stringify(results));await writeFile('audit/chapter-two/story-layout.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
