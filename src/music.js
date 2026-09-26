import {publicUrl} from './public-url.js';

export const MUSIC_TRACKS=Object.freeze({
  field:Object.freeze({file:'assets/music/field-0ed3141cd81c.mp3',volume:.2101}),
  boss:Object.freeze({file:'assets/music/boss-34cad050b0be.mp3',volume:.2564}),
});

export function musicScene(game){
  if(!game)return 'menu';
  if(['victory','defeat'].includes(game.phase))return 'field';
  return game.enemies.some(enemy=>enemy.type==='boss'&&enemy.hp>0)?'boss':'field';
}

// One streaming element avoids decoding two long stereo tracks into mobile memory.
// Reusing that element also preserves the playback permission from the start tap.
export class MusicPlayer{
  constructor({createMedia=()=>new Audio()}={}){
    this.createMedia=createMedia;this.ctx=null;this.media=null;this.gain=null;
    this.scene='menu';this.track=null;this.enabled=true;this.suspended=false;this.ducked=false;
    this.pending=false;this.blocked=false;this.serial=0;this.switchAt=null;this.volume=null;this.lastError=null;
  }
  attach(ctx){
    if(this.media)return;
    const media=this.createMedia();media.loop=true;media.preload='auto';media.playbackRate=1;
    const source=ctx.createMediaElementSource(media),gain=ctx.createGain();gain.gain.value=0;
    source.connect(gain);gain.connect(ctx.destination);
    this.ctx=ctx;this.media=media;this.source=source;this.gain=gain;
    media.addEventListener('error',()=>{this.lastError=`Music media error ${media.error?.code??'unknown'}`;this.blocked=true;this.halt();});
  }
  get active(){return !!this.ctx&&this.ctx.state!=='closed'&&this.enabled&&!this.suspended&&!!MUSIC_TRACKS[this.scene];}
  update({scene=this.scene,enabled=this.enabled,suspended=this.suspended,ducked=this.ducked}={}){
    if(scene!==this.scene){this.scene=scene;this.switchAt=null;this.blocked=false;}
    this.enabled=enabled;this.suspended=suspended;this.ducked=ducked;
    if(!this.media)return;
    if(!this.active){this.halt();if(this.scene==='menu'){this.track=null;this.switchAt=null;}return;}
    if(this.track!==this.scene){
      if(this.track&&!this.media.paused){
        if(this.switchAt===null){this.switchAt=this.ctx.currentTime+.18;this.setVolume(0,.045);}
        if(this.ctx.currentTime<this.switchAt)return;
      }
      this.halt();this.track=this.scene;this.switchAt=null;this.blocked=false;
      this.media.src=publicUrl(MUSIC_TRACKS[this.track].file);this.media.load();
    }else this.switchAt=null;
    this.requestPlay();
    if(!this.media.paused)this.setVolume(MUSIC_TRACKS[this.track].volume*(this.ducked?.28:1),this.ducked?.07:.22);
  }
  setVolume(value,time=.08){
    if(!this.gain||this.volume===value)return;this.volume=value;
    this.gain.gain.setTargetAtTime(value,this.ctx.currentTime,time);
  }
  halt(){
    if(!this.media)return;
    if(this.pending||!this.media.paused){this.serial++;this.pending=false;this.media.pause();}
    this.setVolume(0,.025);
  }
  requestPlay(){
    if(!this.active||this.pending||this.blocked||!this.media.paused)return;
    const token=++this.serial;this.pending=true;
    let playback;
    try{playback=this.media.play();}catch(error){this.pending=false;this.blocked=true;this.lastError=String(error);return;}
    Promise.resolve(playback).then(()=>{
      if(token!==this.serial)return;this.pending=false;
      if(!this.active){this.halt();return;}
      if(this.track!==this.scene)return;
      this.setVolume(MUSIC_TRACKS[this.track].volume*(this.ducked?.28:1),.18);
    }).catch(error=>{
      if(token!==this.serial)return;this.pending=false;this.blocked=true;this.lastError=String(error);
    });
  }
  unlock(){this.blocked=false;this.update();}
}
