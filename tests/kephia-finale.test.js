import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,HEROES} from '../src/model.js';
import {normalizeProgression} from '../src/progression.js';
import {ACTS} from '../src/acts.js';
import {createEnemy} from '../src/characters.js';
import {ENEMY_REWARDS} from '../src/progression.js';
import {KEPHIA_SCRIPTS,kephiaBand} from '../src/chapter-dark-paresis-combat.js';

const profile=()=>normalizeProgression({story:{version:2,actClears:Array(50).fill(false),characters:Object.fromEntries(HEROES.map(h=>[h.id,{level:80,breaks:6}]))}},HEROES);
const unlockBefore=(p,id)=>{for(const act of ACTS){if(act.id===id)break;p.story.actClears[act.id]=true;}};
function finale(act=46){
 const ready=profile();unlockBefore(ready,act);
 ready.story.kephiaPairs=[['nyanluna','tsukineko'],['omsolo','mochinyafe'],['shizuku','prim'],['hehereal','lumi']];
 const g=new Adventure({act,seed:4,progression:ready,party:['lumi']});g.player.invincible=999;return g;
}
function strike(g){
 const boss=g.enemies.find(e=>e.type==='boss');
 boss.special=0;boss.cast=null;boss.rush=null;boss.recovery=0;boss.salvo=null;g.player.attack=999;if(g.partner)g.partner.attack=999;g.drainEvents();g.tick(1/60);
 return g.drainEvents().find(e=>e.type==='bossAttack')?.label;
}

test('each kephia form and health band uses a different attack cycle',()=>{
 assert.deepEqual(Object.keys(KEPHIA_SCRIPTS[0].high).length?KEPHIA_SCRIPTS[0].high:null,['curtain','fan','mark']);
 for(const form of [0,1,2,3]){
  const bands=[KEPHIA_SCRIPTS[form].high,KEPHIA_SCRIPTS[form].mid,KEPHIA_SCRIPTS[form].low];
  assert.equal(new Set(bands.map(row=>row.join('|'))).size,3,form);
 }
 assert.equal(kephiaBand(1),'high');assert.equal(kephiaBand(.5),'mid');assert.equal(kephiaBand(.2),'low');
 const g=finale();
 assert.deepEqual([strike(g),strike(g),strike(g)],['開幕の幕','笑い声の三方','足元の拍手']);
 assert.equal(g.enemies.some(e=>e.type!=='boss'),false);
 const boss=g.enemies.find(e=>e.type==='boss');boss.hp=boss.maxHp*.5;
 assert.deepEqual([strike(g),strike(g),strike(g)],['裏返る輪','ずれる扇','横なぎの幕']);
 boss.hp=boss.maxHp*.2;
 const low=[];for(let i=0;i<4;i++)low.push(strike(g));
 assert.ok(low.includes('合唱を呼ぶ'));
 const guest=g.enemies.find(e=>e.summoned);assert.equal(guest.type,'paresisChorister');
 assert.ok(guest.maxHp<400);assert.ok(guest.damage<80);
 g.hit(guest,guest.maxHp+10,guest.x,guest.z);
 assert.equal(g.orbs.at(-1).value,ENEMY_REWARDS.paresisChorister.crystals);
 const last=finale(49);const end=last.enemies.find(e=>e.type==='boss');end.hp=end.maxHp*.2;
 const names=[];for(let i=0;i<3;i++)names.push(strike(last));
 assert.ok(names.includes('間を置かない終幕'));
 assert.ok(last.enemies.some(e=>e.type==='lanternWarden'||e.type==='paresisChorister'));
});

test('story bosses in the tower keep their own pattern and do not summon guests',()=>{
 const ready=profile();unlockBefore(ready,34);
 const g=new Adventure({act:34,seed:2,progression:ready,party:['nyanluna']});g.player.invincible=999;
 assert.equal(g.act,34);g.spawnEnemy('boss',0,-11);
 for(let i=0;i<3;i++)strike(g);
 assert.equal(g.enemies.some(e=>e.summoned),false);
});

test('kephia forms have separate silhouettes',()=>{
 const forms=['kephia1','kephia2','kephia3','kephia4'].map(id=>createEnemy('boss',id));
 assert.deepEqual(forms.map(root=>root.userData.demonScale),[1.02,1.24,1.34,1.68]);
 assert.deepEqual(forms.map(root=>root.userData.wings.length),[0,0,2,4]);
});
