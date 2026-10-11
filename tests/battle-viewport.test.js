import test from 'node:test';
import assert from 'node:assert/strict';
import {configureBattleViewport} from '../src/battle-viewport.js';

function fixture(){
  const documentTarget=new EventTarget();let playing=false;
  documentTarget.body={classList:{contains:className=>className==='playing'&&playing}};
  const dispose=configureBattleViewport({documentTarget});
  const dispatch=(type,properties={},cancelable=true)=>{
    const event=new Event(type,{cancelable});Object.assign(event,properties);documentTarget.dispatchEvent(event);return event.defaultPrevented;
  };
  return {dispatch,dispose,play:()=>{playing=true;},menu:()=>{playing=false;}};
}
test('battle blocks multi-touch zoom, Safari gestures and double-click zoom',()=>{
  const f=fixture();f.play();
  assert.equal(f.dispatch('touchmove',{touches:[{},{}]}),true);
  for(const type of ['gesturestart','gesturechange','gestureend','dblclick'])assert.equal(f.dispatch(type),true,type);
});
test('battle permits single-finger scrolling, taps, simultaneous pointer input and ordinary wheels',()=>{
  const f=fixture();f.play();
  assert.equal(f.dispatch('touchmove',{touches:[{}]}),false);
  for(const type of ['touchstart','touchend','pointerdown','pointermove','pointerup','click'])assert.equal(f.dispatch(type,{touches:[{},{}]}),false,type);
  assert.equal(f.dispatch('wheel',{ctrlKey:false,metaKey:false}),false);
});
test('battle blocks browser zoom shortcuts but retains reset zoom, game keys and other shortcuts',()=>{
  const f=fixture();f.play();
  for(const modifier of ['ctrlKey','metaKey']){
    assert.equal(f.dispatch('wheel',{[modifier]:true}),true);
    for(const key of ['+','-','=','_'])assert.equal(f.dispatch('keydown',{[modifier]:true,key}),true);
    for(const code of ['NumpadAdd','NumpadSubtract'])assert.equal(f.dispatch('keydown',{[modifier]:true,code}),true);
    for(const key of ['0','r','c'])assert.equal(f.dispatch('keydown',{[modifier]:true,key}),false);
  }
  assert.equal(f.dispatch('keydown',{key:'+','ctrlKey':false}),false);
});
test('zoom is unrestricted outside battle, including after leaving a battle',()=>{
  const f=fixture();
  for(const playing of [false,true,false]){
    playing?f.play():f.menu();
    for(const type of ['gesturestart','gesturechange','gestureend','dblclick'])assert.equal(f.dispatch(type),playing,type);
    assert.equal(f.dispatch('touchmove',{touches:[{},{}]}),playing);
    assert.equal(f.dispatch('wheel',{ctrlKey:true}),playing);
    assert.equal(f.dispatch('keydown',{ctrlKey:true,key:'+'}),playing);
  }
});
test('guard can be removed and ignores noncancelable browser notifications',()=>{
  const f=fixture();f.play();assert.equal(f.dispatch('gesturestart',{},false),false);
  f.dispose();assert.equal(f.dispatch('gesturestart'),false);assert.equal(f.dispatch('touchmove',{touches:[{},{}]}),false);
});
