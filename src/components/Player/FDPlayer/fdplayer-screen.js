// author: Jinsung Park
// email: jspark@4dreplay.com

import { gsap } from 'gsap';

import { CreateElement } from './common/CreateElement';
import { EventDispatcher } from './common/EventDispatcher';
import COMMON_VAL from './common/CommonVariable';

export class FDPlayerScreen extends EventDispatcher {

  constructor(utils, parent, strBkColor, volume) {
    super();

    this.utils = utils;
    this.parent = parent;
    this.strBkColor = strBkColor;
		this.controllerHeight = parent._playerMain.controllerHeight;
		this.sW = 0;
		this.sH = 0;
		this.volume = volume;
		this.isHasError = true;
		this.isStopped = true;
    this.isMobile = this.utils.isMobile();

    this.isAutoPlayStart = true;

    this.__proto__ = new CreateElement(this.utils, 'div');
    
    this.init();
  }  
		
  //################################################################//
  /* init */
  //################################################################//
  init = () => {
    this.setVideo();
    this.setBkColor(this.strBkColor);
    this.style().width = '100%';
    this.style().height = '100%';
  };

  //################################################################//
  /* Set Video Element */
  //################################################################//
  setVideo = () => {
    if(!this.nodeVideo){
      this.nodeVideo = document.createElement('video');
      this.element.className = 'video-screen-holder';
      this.element.appendChild(this.nodeVideo);
      this.nodeVideo.controls = false;
      
      this.nodeVideo.WebKitPlaysInline = true;
      this.nodeVideo.playsinline = true;
      this.nodeVideo.setAttribute('playsinline', '');
      this.nodeVideo.setAttribute('webkit-playsinline', '');

      this.nodeVideo.muted = false;
      this.nodeVideo.autoplay = true;      

      this.nodeVideo.style.position = 'relative';
      this.nodeVideo.style.left = '0px';
      this.nodeVideo.style.top = '0px';
      this.nodeVideo.style.width = '100%';
      this.nodeVideo.style.height = '100%';
      this.nodeVideo.style.margin = '0px';
      this.nodeVideo.style.padding = '0px';
      this.nodeVideo.style.maxWidth = 'none';
      this.nodeVideo.style.maxHeight = 'none';
      this.nodeVideo.style.border = 'none';
      this.nodeVideo.style.lineHeight = '0';
      this.nodeVideo.style.msTouchAction = 'none';
      
      this.element.appendChild(this.nodeVideo);
    }
    
    this.nodeVideo.addEventListener('play', this.onPlayHandler);    
    this.nodeVideo.addEventListener('playing', this.onStopToBuffer);
    this.nodeVideo.addEventListener('pause', this.onPauseHandler);
    this.nodeVideo.addEventListener('canplay', this.onCanplayHandler);
    this.nodeVideo.addEventListener('suspend', this.onSuspendHandler);
    this.nodeVideo.addEventListener('seeking', this.onSeekingHandler);
    this.nodeVideo.addEventListener('seeked', this.onSeekedHandler);
    this.nodeVideo.addEventListener('timeupdate', this.onUpdateVideoHandler);
    this.nodeVideo.addEventListener('loadeddata', this.onLoadedDataHandler);
    this.nodeVideo.addEventListener('durationchange', this.onDurationChange);
    this.nodeVideo.addEventListener('ended', this.onEndedHandler);    
    this.nodeVideo.addEventListener('error', this.onErrorHandler);

    if(!this.utils.isIE()){
      this.nodeVideo.addEventListener('waiting', this.onStartToBuffer);
    }
  };	

  //################################################################//
  /* Set Video Event */
  //################################################################//

  onCanplayHandler = () => {
    //console.log('!!!!!!!!!! Video Canplay !!!!!!!!!!');
  };

  onLoadedDataHandler = () => {
    //console.log('!!!!!!!!!! Video Loaded Data !!!!!!!!!!');
  };

  onSuspendHandler = () => {
    //console.log('!!!!!!!!!! Video Suspend !!!!!!!!!!');
  };

  onSeekingHandler = () => {
    //console.log('!!!!!!!!!! Video Seeking !!!!!!!!!!');
  };

  onSeekedHandler = (e) => {
    //console.log('!!!!!!!!!! Video Seeked !!!!!!!!!!');
  };

  onUpdateVideoHandler = (e) => {
    //console.log('!!!!!!!!!! Video Timeupdate !!!!!!!!!!');
  };

  onPauseHandler = () => {
    if(this.isAllowScrubbing) return;
    this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.PAUSE);
  };
  
  onPlayHandler = () => {
    if(this.isAllowScrubbing) return;
    this.isPlayHLS = true;
    if(this.isAutoPlayStart){
      this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.START);
      this.isAutoPlayStart = false;
    }
   
    this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.PLAY);
  };
  
  onEndedHandler = () => {
    this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.PLAY_COMPLETE);
  };

  onStartToBuffer = (overwrite) => {
    this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.START_TO_BUFFER);
  };
  
  onStopToBuffer = () => {
    this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.STOP_TO_BUFFER);
  };

  onDurationChange = () => {
    //console.log('!!!!!!!!!! Video Duration Change !!!!!!!!!!');
  }

  onErrorHandler = (e) => {
    let strErrorMessage;
    this.isHasError = true;
    
    if(this.nodeVideo.networkState === 0){
      strErrorMessage = 'Error - networkState = 0';
    }else if(this.nodeVideo.networkState === 1){
      strErrorMessage = 'Error networkState = 1';
    }else if(this.nodeVideo.networkState === 3){
      strErrorMessage = 'Source not found';
    } else {
      strErrorMessage = e;
    }
    
    if(window.console) window.console.log(this.nodeVideo.networkState);
    this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.ERROR, { text:strErrorMessage });
  };

  destroyVideo = () => {
    if(this.nodeVideo){   
      this.nodeVideo.removeEventListener('play', this.onPlayHandler);    
      this.nodeVideo.removeEventListener('playing', this.onStopToBuffer);
      this.nodeVideo.removeEventListener('pause', this.onPauseHandler);
      this.nodeVideo.removeEventListener('canplay', this.onCanplayHandler);
      this.nodeVideo.removeEventListener('suspend', this.onSuspendHandler);
      this.nodeVideo.removeEventListener('seeking', this.onSeekingHandler);
      this.nodeVideo.removeEventListener('seeked', this.onSeekedHandler);
      this.nodeVideo.removeEventListener('timeupdate', this.onUpdateVideoHandler);
      this.nodeVideo.removeEventListener('loadeddata', this.onLoadedDataHandler);
      this.nodeVideo.removeEventListener('ended', this.onEndedHandler);    
      this.nodeVideo.removeEventListener('error', this.onErrorHandler);

      if(!this.utils.isIE()){
        this.nodeVideo.removeEventListener('waiting', this.onStartToBuffer);
      }      
     
      gsap.killTweensOf(this.element);
      this.setAlpha(0);
      gsap.to(this.element, {alpha:1, delay:.4, duration: .6});		
    }
  }; 
  
  //################################################################//
  /* Resize and Position */
  //################################################################//
  resizeAndPosition = (width, height) => {
    if(width){
      this.sW = width;
      this.sH = height;
    }
    
    this.setWidth(this.sW);
    this.setHeight(this.sH);
    
    if(this.nodeVideo) this.nodeVideo.style.width = '100%';   
  };
  
  //################################################################//
  /* Set Source */
  //################################################################//
  setSource = (sourcePath) => {    
    if(this.nodeVideo) this.stop();
    this.initVideo();
  };

  //################################################################//
  /* Play / pause / stop methods */
  //################################################################//
  initVideo = () => {
    
    this.isPlaying = false;
    this.isHasError = false;
    this.isAllowScrubbing = false;
    this.isStopped = false;
    this.setVideo();
    this.nodeVideo.style.visibility = 'visible';
    this.setVolume();

    gsap.killTweensOf(this.element);
    this.setAlpha(0);
    gsap.to(this.element, {alpha:1, delay:.4, duration: .6});		
  }

  play = (hls) =>{

    if (!this.nodeVideo.ended){
      try {
        this.isHasError = false;
        this.isStopped = false;
        this.isPlaying = true;
        this.isPlayHLS = true;        
        let playPromise = this.nodeVideo.play();
        this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.PROMISE, {promise: playPromise});
        this.setVolume();
        if(this.utils.isIE()) this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.PLAY);
      } catch(e) {        
      };
    } else {
      this.setVideo();
      hls.detachMedia();
      hls.attachMedia(this.nodeVideo);
    }
  };

  pause = (playPromise) => {
    if(this === null || this.isStopped || this.isHasError) return;
    if(!this.nodeVideo.ended){
      try{
        if(playPromise !== undefined) {
          playPromise.then(_ => {                        
              this.nodeVideo.pause();
          })
          .catch(error => {});
        }
        this.isPlaying = false;
        if(this.utils.isIE()) this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.PAUSE);
      }catch(e){};
    }
  };

  resume = () => {
    if(this.isStopped) return;
    this.play();
  };
  
  stop = (overwrite) => {
    if((this === null || this.nodeVideo === null || this.isStopped) && !overwrite) return;
    
    this.isPlaying = false;
    this.isStopped = true;
    this.isPlayHLS = false;

    this.destroyVideo();
    // this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.LOAD_PROGRESS, {percent:0});
    // this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.UPDATE_TIME, {curTime:'00:00' , totalTime:'00:00'});
    // this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.STOP);
    // this.onStopToBuffer();
  };
  
  //################################################################//
  /* Scrub */
  //################################################################//
  startToScrub = () => {
    this.isAllowScrubbing = true;
  };
  
  stopToScrub = () => {
    this.isAllowScrubbing = false;
  };
  
  scrubbAtTime = (duration) => {
    this.nodeVideo.currentTime = duration;
    let totalTime = this.utils.formatTime(this.nodeVideo.duration);
    let curTime = this.utils.formatTime(this.nodeVideo.currentTime);
    this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.UPDATE_TIME, {curTime: curTime, totalTime:totalTime});
  }
  
  scrub = (percent, e) => {
    if(e) this.startToScrub();
    try{
      this.nodeVideo.currentTime = this.nodeVideo.duration * percent;
      let totalTime = this.utils.formatTime(Math.round(this.nodeVideo.duration));
      let curTime = this.utils.formatTime(Math.round(this.nodeVideo.currentTime));
      this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.UPDATE_TIME, {curTime: curTime, totalTime:totalTime});
    } catch(e){}
  };
  
  //################################################################//
  /* Replay */
  //################################################################//
  replay() {
    this.scrub(0);
    this.play();
  };

  setPlaybackRate = (rate) => {
    if(!this.nodeVideo) return;
    this.nodeVideo.defaultPlaybackRate = rate;
    this.nodeVideo.playbackRate = rate;
  }
  
  //################################################################//
  /* Volume */
  //################################################################//
  setVolume = (vol) => {
    if(vol !==  undefined) this.volume = vol;
    if(this.nodeVideo){
      this.nodeVideo.volume = this.volume;
      if(vol) this.nodeVideo.muted = false;
    }
  };
}