// author: Jinsung Park
// email: jspark@4dreplay.com

import { buildAbsoluteURL } from 'url-toolkit';

import { FDPlayerUtils } from './fdplayer-utils';
import { FDPlayerConfig } from './fdplayer-config';
import { FDPlayerScreen } from './fdplayer-screen';

import { CreateElement } from './common/CreateElement';
import { EventDispatcher } from './common/EventDispatcher';
//import { State } from './normal/controller/base-stream-controller';
//import Events from './normal/events';

import Hls from './normal/hls';
import COMMON_VAL from './common/CommonVariable';

const initConfig = {
    parentId: 'video-player',
    displayType:'responsive',
    playsinline:'yes',
    showPlayerByDefault:'yes',
    maxWidth:1066,
    maxHeight:600,
    volume:.5,
    backgroundColor:'#212121',
    offsetX:0,
	  offsetY:0,    
    //controller settings
    controllerHeight:85,
    controllerHideDelay:3,
    startSpaceBetweenButtons:7,
    spaceBetweenButtons:9,
    timeSliderOffestTop:14,
    slidersOffsetWidth:4,
    timeOffsetLeftWidth:5,
    timeOffsetRightWidth:3,
    volumeSliderWidth:80,
    volumeSliderOffsetRightWidth:0,
}
export class NormalPlayer extends EventDispatcher {  
    
    _playerMain;
    _playerConfig;
    _hls;

    props = initConfig;

    constructor(options) {
        super();

        this.options = options;
        this.utils = new FDPlayerUtils();

        this.initVideoUrl = '';

        this.isFullScreen = false;
        this.isVideoPlayerReady = false;

        this.isPlaying = false;
        this.playPromise = null;

        this.playbackTimer = 0;
        
        this.initPlayer();
    }

    initPlayer = () => {
        if(!Hls.isSupported()) {
            this.handleUnsupported();
            return;
        }        

        if(!this.props.parentId){		
            return;
        } 

        this.utils.createAnimationFrame();
        this.videoContainer = this.utils.getChildById(this.props.parentId);
        this.videoContainer.innerHTML = '';

        this.isShowed = this.utils.convertStrToBool(this.props.showPlayerByDefault);

        //this.hasHTMLHLS = this.utils.hasHTMLHLS();

        this.isHlsLoaded = false;        
        this.isAutoScale = true;

        this.strDisplayType = this.props.displayType;
        this.intMaxWidth = this.props.maxWidth;
        this.intMaxHeight = this.props.maxHeight;      

        this.offsetX = parseInt(this.props.offsetX) || 0;
        this.offsetY = parseInt(this.props.offsetY) || 0;   
        
        this.listeners = { arrEvents: [] };
        this.strBackgroundColor = this.props.backgroundColor || 'transparent';
        this.strVideoBackgroundColor = '#000000';

        this.isMobile = this.utils.isMobile();
        this.isHasPointerEvent = this.utils.hasPointerEvent();
        this.isIE = this.utils.isIE();

        this.setPlayerMainElement();
        //this.setPlayerData();
        this.setConfig();
        this.startResizeHandler();        
    }

    stopLoad = () => {
        this._hls.stopLoad();
    }

    getPlayerUtils = () => {
        return this.utils;
    }

    checkStreamState = () => {
        const video = this.objVideoScreen.nodeVideo;
        if(video.currentTime === video.duration) {
            this.resetVideoStream();            
        }
        return true;
    }

    resetVideoStream = () => {
        if(this._hls) {
            this.setCurrentTimeInfo(0);
            window.callByInBtnReplay(false);
            window.callUpdatePlaybackTime(0);
        }
    }

    checkPlayerReady = () => {
        return this.isVideoPlayerReady;
    }

    setPlayerMainElement() {
        if(this._playerMain) return;
        this._playerMain = new CreateElement(this.utils, 'div', 'relative');

        if(this.isHasPointerEvent) this._playerMain.element.style.touchAction = 'none';
        // Remove Touch Highlight
        this._playerMain.element.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0)';
        this._playerMain.element.style.webkitFocusRingColor = 'rgba(0, 0, 0, 0)';
        this._playerMain.element.className = 'fdplayer';
        this._playerMain.element.style.width = '100%';
        this._playerMain.element.style.height = '100%';
        this._playerMain.setBackgroundColor(this.strBackgroundColor);

        if(this.isMobile || (this.isMobile && this.isHasPointerEvent)) this._playerMain.setSelectable(false);
        this.videoContainer.style.overflow ='hidden';        
        this.videoContainer.appendChild(this._playerMain.element);
    }
    
    setConfig() {
        this._playerConfig = new FDPlayerConfig(this.utils, this.props);        
        this._playerConfig.addListener(COMMON_VAL.PLAYER_EVENT.PRELOADER_LOAD_DONE, this.onPreloaderLoadDone);        
    }

    onPreloaderLoadDone = () => {
        this.resizeHandler();
        window.removeEventListener("scroll", this.onScrollHandler);
        this.setVideoPlayer();
    }

    startResizeHandler() {
        window.addEventListener("resize", this.onResizeHandler);			
        window.addEventListener("orientationchange", this.orientationChange);
        
        this.onResizeHandler(true);
        this.resizeHandlerId_to = setTimeout(() => {this.resizeHandler(true);}, 500);        
    }

    onScrollHandler = (e) => {
        this.scrollHandler();
        let scrollOffsets = this.utils.getScrollOffsets();
        this.scrollOffsets = scrollOffsets;
    };

    scrollHandler = () => {
        let scrollOffsets = this.utils.getScrollOffsets();
        this.pageXOffset = scrollOffsets.x;
        this.pageYOffset = scrollOffsets.y;
        
        if(this.isFullScreen){	
            this._playerMain.setX(scrollOffsets.x);
            this._playerMain.setY(scrollOffsets.y);
        }
    };

    onResizeHandler = () => {
        this.resizeHandler();
        clearTimeout(this.resizeHandler2Id_to);
        this.resizeHandler2Id_to = setTimeout(() => {this.resizeHandler();}, 300);
    };

    orientationChange = () => {
        this.isOrintationChangeComplete = false;	
        clearTimeout(this.resizeHandlerId_to);
        clearTimeout(this.resizeHandler2Id_to);
        clearTimeout(this.orientationChangeId_to);
    
        this.orientationChangeId_to = setTimeout(() => {
            this.isOrintationChangeComplete = true; 
            this.resizeHandler(true);
            }, 150);
        
        this.videoContainer.style.left = "-5000px";
        if(this.objPreloader) this.objPreloader.setX(-5000);	
    };

    resizeHandler = () => {			
        let viewportSize = this.utils.getViewportSize();
        this.ws = viewportSize;

        if(this.isFullScreen) {
            this._playerMain.setX(0);
            this._playerMain.setY(0);
            this.sW = viewportSize.w + 2;
            this.sH = viewportSize.h + 2;
        } else {
            this.videoContainer.style.width = "100%";

            if(this.videoContainer.offsetWidth > this.intMaxWidth){
                this.videoContainer.style.width = this.intMaxWidth + "px";
            }
            this.sW = this.videoContainer.offsetWidth;
            
            if(this.isAutoScale){
                this.sH = parseInt(this.intMaxHeight * (this.sW / this.intMaxWidth));
            } else {
                this.sH = this.intMaxHeight;
            }        
            
            this.videoContainer.style.height = this.sH + "px";
        }
        
        this.tempVideoContainerWidth = this.sW;
        this.tempVideoContainerHeight = this.sH;
        this._playerMain.setWidth(this.sW);
        this._playerMain.setHeight(this.sH);
        
        if(this.objVideoScreen){
            this.objVideoScreen.resizeAndPosition(this.sW, this.sH);
            this.objVideoScreen.setX(0);
            this.objVideoScreen.setY(0);
        }
    };

    resizeDumyHandler() {
        if(this.objClickScreen){            
            this.objClickScreen.setWidth(this.sW);
            this.objClickScreen.setHeight(this.sH);                    
        }
    }

    setVideoPlayer() {
        if(this.isVideoPlayerCreated) return;
        
        this.setVideoScreen();
        this.resizeHandler();

        this.isVideoPlayerCreated = true;
        this.isVideoPlayerReady = true;

        window.callByInPlayerReady(true);
        
    };

    //######################################################################################//
    /* Set Video Screen */
    //######################################################################################//
    setVideoScreen() {
        this.objVideoScreen = new FDPlayerScreen(
            this.utils, 
            this, 
            this.strBackgroundColor, 
            this._playerConfig.fVolume
        );        
        
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.PROMISE, this.videoScreenPromiseHandler)
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.START, this.videoScreenStartHandler);
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.STOP, this.videoScreenStopHandler);
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.PLAY, this.videoScreenPlayHandler);
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.PAUSE, this.videoScreenPauseHandler);
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.UPDATE, this.videoScreenUpdateHandler);
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.UPDATE_TIME, this.videoScreenUpdateTimeHandler);
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.LOAD_PROGRESS, this.videoScreenLoadProgressHandler);
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.START_TO_BUFFER, this.videoScreenStartToBufferHandler);
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.STOP_TO_BUFFER, this.videoScreenStopToBufferHandler);
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.PLAY_COMPLETE, this.videoScreenPlayCompleteHandler);
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.ENABLE_TO_SCRUB, this.videoScreenEnableToScrubHandler);        
        this.objVideoScreen.addListener(COMMON_VAL.PLAYER_EVENT.ERROR, this.videoScreenErrorHandler);
        
        this._playerMain.addChild(this.objVideoScreen);
    }

    videoScreenPromiseHandler = (e) => {
        //console.log('!!!!!!!!!! Video Promise !!!!!!!!!!');
        this.playPromise = e.promise;
        //console.log(e);
    }

    videoScreenStartHandler = () => {
        //console.log('!!!!!!!!!! Video Auto Start !!!!!!!!!!');
        window.callByInLoadingBar(false);
        window.callByInIsPlaying(true);
        this.play();
    }

    videoScreenStopHandler = () => {
        //console.log('!!!!!!!!!! Video Stop !!!!!!!!!!');
    }

    videoScreenPlayHandler = () => {
        //console.log('!!!!!!!!!! Video Play !!!!!!!!!!');
     
    };

    videoScreenPauseHandler = () => {      
        console.log('!!!!!!!!!! Video Pause !!!!!!!!!!');
    };
    
    videoScreenUpdateHandler = (e) => {        
    };

    videoScreenUpdateTimeHandler = (e) => {        
    }

    videoScreenLoadProgressHandler = (e) => {

    }

    videoScreenStartToBufferHandler = () => {
        //console.log('!!!!!!!!!! Video Buffering Start !!!!!!!!!!');
    }

    videoScreenStopToBufferHandler = () => {
        //console.log('!!!!!!!!!! Video Buffering Stop !!!!!!!!!!');
    }

    videoScreenPlayCompleteHandler = () => {
        //console.log('!!!!!!!!!! Video Complete !!!!!!!!!!');
        
        window.callByInBtnReplay(true);
        window.callByInIsPlaying(false);
    }

    videoScreenEnableToScrubHandler = () => {

    }

    videoScreenErrorHandler = () => {
        //console.log('!!!!!!!!!! Video Error !!!!!!!!!!');
    }

    //##########################################################################################//
    /* common player utils */
    //##########################################################################################//
    showFullScreen(player) {
        //if(!this.isVideoPlayerReady) return;
        
        if(document.addEventListener){
            document.addEventListener("fullscreenchange", this.onFullScreenChange);
            document.addEventListener("mozfullscreenchange", this.onFullScreenChange);
            document.addEventListener("webkitfullscreenchange", this.onFullScreenChange);
            document.addEventListener("MSFullscreenChange", this.onFullScreenChange);
        }
        
        if(document.documentElement.requestFullScreen) {
            //this._playerMain.element.documentElement.requestFullScreen();
            player.documentElement.requestFullScreen();
        } else if(document.documentElement.mozRequestFullScreen){ 
            //this._playerMain.element.mozRequestFullScreen();
            player.mozRequestFullScreen();
        } else if(document.documentElement.webkitRequestFullScreen){
            //this._playerMain.element.webkitRequestFullScreen();
            player.webkitRequestFullScreen();
        } else if(document.documentElement.msRequestFullscreen){
            //this._playerMain.element.msRequestFullscreen();
            player.msRequestFullscreen();
        }
        
        //this.disableClick();

        
        this._playerMain.style().position = "fixed";
        document.documentElement.style.overflow = "hidden";
        //this._playerMain.style().zIndex = 9999999999998;  
        this.isFullScreen = true;
        
        let scrollOffsets = this.utils.getScrollOffsets();
        this.lastX = scrollOffsets.x;
        this.lastY = scrollOffsets.y;
        
        window.scrollTo(0,0);
    
        if(this.isMobile) window.addEventListener("touchmove", this.disableFullScreenOnMobileHandler, {passive:false});
        this.resizeHandler();        
    };

    showNormalScreen() {		
        if(!this.isVideoPlayerReady || !this.isFullScreen) return;
        
        if (document.cancelFullScreen) {  
            document.cancelFullScreen();  
        } else  if (document.mozCancelFullScreen) {  
            document.mozCancelFullScreen();  
        } else  if (document.webkitCancelFullScreen) {  
            document.webkitCancelFullScreen();  
        } else  if (document.msExitFullscreen) {  
            document.msExitFullscreen();  
        }   
        
        this.addMainDoToTheOriginalParent();
        this.isFullScreen = false;
    };
    
    addMainDoToTheOriginalParent = (origin) => {
        if(!this.isFullScreen && !origin) return;
        
        if(document.removeEventListener){
            document.removeEventListener("fullscreenchange", this.onFullScreenChange);
            document.removeEventListener("mozfullscreenchange", this.onFullScreenChange);
            document.removeEventListener("webkitfullscreenchange", this.onFullScreenChange);
            document.removeEventListener("MSFullscreenChange", this.onFullScreenChange);
        } 
        
        if(this.strDisplayType === COMMON_VAL.CONST_VAL.RESPONSIVE){        
            document.documentElement.style.overflow = "visible";
            this._playerMain.style().position = "relative";
            this._playerMain.style().zIndex = 0;

            if(this.isMin){
                this._playerMain.style().position = 'fixed';
                this._playerMain.style().zIndex = 9999999999999;
            } else {
                this._playerMain.style().position = "relative";
                this._playerMain.style().zIndex = 0;
            }
        } else {
            this._playerMain.style().position = "absolute";
            this._playerMain.style().zIndex = 9999999999998;
        }
        
        
        this.showCursor();
    
        window.scrollTo(this.lastX, this.lastY);
        
        if(!this.isIE){
            setTimeout(() => {
                window.scrollTo(this.lastX, this.lastY);
            }, 150);
        }

        this.resizeHandler();
        if(this.isMobile) window.removeEventListener("touchmove", this.disableFullScreenOnMobileHandler);
    };
    
    onFullScreenChange = (e) => {        
        if(!(document.fullScreen || document.msFullscreenElement  || document.mozFullScreen || document.webkitIsFullScreen || document.msieFullScreen)){
            window.callBySetBtnFullScreenByESC(false);
            this.isFullScreen = false;
            this.addMainDoToTheOriginalParent(true);            
        }        
    };

    stopVideo() {
        if(!this.isVideoPlayerReady) return;
        this.curDurration = 0;
        this.prevDuration = -1;
        this.stop();
    }    

    updateVolume() {
        if(!this.isVideoPlayerReady) return;
        this.setVolume();
    }

    autoplay = () => {
        if(!this.isVideoPlayerReady) return;
        
        this.isStopped = false;        
        this.isHLSManifestReady = this.getPrevHlsInfo(); 

        if(this.isHLSManifestReady){
            if(this.objVideoScreen) this.objVideoScreen.play(this._hls);
            this.isPlaying = true;
            this._hls.videoIsPlaying = true; 
        }
    };
    
    play = () => {			
        if(!this.isVideoPlayerReady) return;
        
        this.isStopped = false;        
        this.isHLSManifestReady = this.getPrevHlsInfo(); 

        if(this.isHLSManifestReady){
            if(this.objVideoScreen) this.objVideoScreen.play(this._hls);            
            this.isPlaying = true;
        }
    };

    pause = () => {
        if(!this.isVideoPlayerReady) return;
       
        if(this.objVideoScreen) this.objVideoScreen.pause();
        this.isPlaying = false;
    };
    
    resume = () => {
        if(!this.isVideoPlayerReady) return;        
        if(this.objVideoScreen) this.objVideoScreen.resume();
    };		
    
    stop = (source) => {
        if(!this.isVideoPlayerReady) return;

        if(this.playbackTimer) {
            window.cancelAniFrame(this.playbackTimer);
        }

        this.isStopped = true;       
        this.isPlaying = false;        
        this.isHLSManifestReady = false;

        this.destroyHLS();                
        this.objVideoScreen.stop();        
    };
    
    startToScrub = () => {
        if(!this.isVideoPlayerReady) return;
        if(this.objVideoScreen) this.objVideoScreen.startToScrub();        
    };
    
    stopToScrub = () => {
        if(!this.isVideoPlayerReady) return;        
        if(this.objVideoScreen) this.objVideoScreen.stopToScrub();        
    };
    
    scrub = (percent, time) => {
        if(!this.isVideoPlayerReady) return;
        if(isNaN(percent)) return;
        if(percent < 0){
            percent = 0;
        } else  if(percent > 1){
            percent = 1;
        }

        if(this.objVideoScreen) this.objVideoScreen.scrub(percent);
    };
    
    scrubbAtTime = (duration) => {
        if(!this.isVideoPlayerReady || !duration) return;
        if(String(duration).indexOf(":") !== -1) duration = this.utils.getSecondsFromString(duration);        
        if(this.objVideoScreen) this.objVideoScreen.scrubbAtTime(duration);        
    };

    setVolume = (volume, removeAutoPlay) => {
        if(!this.isVideoPlayerReady) return;    
        
        this.volume = volume;        
        this.objVideoScreen.setVolume(this.volume);
    };

    setSource(fixedurl, source) {			
        try{
            if(!this.isVideoPlayerReady) return;

            source = source.replace(/&amp;/g, "&");
            if(!source){
                //console.log('Video URL is not defined!');
                return;
            }

            this.stop();
            window.callUpdatePlaybackTime(0);                    

            this.createObjHls();   
        
            this.resizeHandler();
            
            this.objVideoScreen.setBkColor(this.strBackgroundColor);
            this.objVideoScreen.setX(0)
            this.objVideoScreen.setVisible(true);
            this.objVideoScreen.setSource(source);            
            
            if(this._hls) {       
                this._hls.loadSource(source);
                this._hls.autoLevelCapping = -1;
                this._hls.attachMedia(this.objVideoScreen.nodeVideo);

                this.setHlsAddEventListeners(this._hls);
            } else {
                //console.log('HLS Object is not loaded.');
            }
        } catch(err) {
            console.log(err);
        }
    };

    setCurrentTimeInfo = (time) => {
        const video = this.objVideoScreen.nodeVideo;
        video.currentTime = time;
    }

    //######################################################################################//
    /* Hide / show cursor */
    //######################################################################################//
    hideCursor() {
        document.documentElement.style.cursor = "none";
        document.getElementsByTagName("body")[0].style.cursor = "none";
        //this.objClickScreen.element.style.cursor = "none";
    };
    
    showCursor() {
        document.documentElement.style.cursor = "auto";
        document.getElementsByTagName("body")[0].style.cursor = "auto";
        //this.objClickScreen.element.style.cursor = "auto";            
        //this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.SHOW_CURSOR);
    };

    //######################################################################################//
    /* Set HLS */
    //######################################################################################//
 
    createObjHls = () => {
        if(this._hls) {
            this._hls.destroy();
            clearInterval(this._hls.bufferTimer);
            this._hls = null;
        }

        this.isHlsLoaded = true;
        this._hls = new Hls(); 
    }

    getPrevHlsInfo = () => {
        if(this._hls) {
            return true;
        }
        return false;
    }

    setHlsAddEventListeners = (hls) => {
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        });

        hls.on(Hls.Events.MEDIA_DETACHED, () => {
            //console.log('Media_Detached');
        });

        hls.on(Hls.Events.BUFFER_RESET, () => {
        });

        hls.on(Hls.Events.BUFFER_CREATED, (eventName, data) => {
        });
        
        hls.on(Hls.Events.BUFFER_APPENDING, (eventName, data) => {
        
        });

        hls.on(Hls.Events.LEVEL_SWITCHING, (eventName, data) => {
            this.updateLevelInfo();
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (eventName, data) => {
            this.updateLevelInfo();
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (eventName, data) => {
            // update level info
            this.isHLSManifestReady = true;
            this.updateLevelInfo();       
            
        });

        hls.on(Hls.Events.FRAG_CHANGED, (eventName, data) => {
        });

        hls.on(Hls.Events.FRAG_BUFFERED, (eventName, data) => {
            clearInterval(this._hls.bufferTimer);
            this._hls.bufferTimer = window.self.setInterval(this.checkBuffer, 100);
        });

        hls.on(Hls.Events.FRAG_LOAD_EMERGENCY_ABORTED, (eventName, data) => {
        });

        hls.on(Hls.Events.LEVEL_LOADED, (eventName, data) => {
            //console.log(data);
            if(data) {
                const levelDetails = data.details;
                if(!levelDetails) {
                    return;
                }
                const totalDuration = levelDetails.totalduration;
                window.callUpdateDuration(totalDuration);
            }
        });

        hls.on(Hls.Events.DESTROYING, () => {
            clearInterval(this._hls.bufferTimer);
        });

        hls.on(Hls.Events.ERROR, (eventName, data) => {
            console.log(data);
        });

        hls.on(Hls.Events.PLAY_COMPLETE, () => {
            //console.log('*** play complete ***');
            clearInterval(this._hls.bufferTimer);
        });
    }

    checkBuffer = (isLoop = true) => {
        //console.log('******************** Check Buffer ****************************');
        const video = this.objVideoScreen.nodeVideo;
        const currentTime = video.currentTime;
        window.callUpdatePlaybackTime(currentTime);
    }

    seekBarMouseDownHandler = () => {
        window.callByInBtnReplay(false);
    }

    updateLevelInfo = () => {
        if (!this._hls.levels) {
            return;
        }

        const levels = this._hls.levels;
        const currentLevel = this._hls.currentLevel;
        const currentManualLevel = this._hls.manualLevel;
        const currentLevelHeight = this._hls.currentLevelHeight; 

        window.videoLevelUpdate(levels, currentLevel, currentManualLevel, currentLevelHeight);

        console.log(`%c *** Update Level Info ***`, 'color:orange');
        console.log(`%c Current Level: ${currentLevel}`, 'color:orange');
        console.log(`%c ManualLevel Level: ${currentManualLevel}`, 'color:orange');
        console.log(`%c Current Level Height: ${currentLevelHeight}`, 'color:orange');
    }

    updateLevelAuto = () => {
        this._hls.loadLevel = -1;
    }

    updateLevelManual = (level) => {
        this._hls.loadLevel = level;
    }

    destroyHLS = () => {
        if(this._hls){
            this._hls.destroy();
            this._hls = null;
        }
    }
    //######################################################################################//

    openVideo(url, totalChannel, initChannel) {
        try{
            if(url && totalChannel && initChannel) {
                const pathChannel = '000';
                const master = 'master.m3u8';
                const relurl = pathChannel + '/' + master;
                const videoUrl = buildAbsoluteURL(url, relurl, { alwaysNormalize: true });
                
                //console.log(videoUrl);

                if(this.initVideoUrl !== '') {
                    this._hls.stopLoad();
                    this.objVideoScreen.stop();

                    clearInterval(this._hls.bufferTimer);
                    if(this.playbackTimer) {
                        window.cancelAniFrame(this.playbackTimer);
                    }
            
                    this.isStopped = true;       
                    this.isPlaying = false;        
                    this.isHLSManifestReady = false;

                    window.callUpdatePlaybackTime(0);

                    this._hls.trigger(Hls.Events.MEDIA_DETACHING);


                    setTimeout(() => {
                        this.initVideoUrl = videoUrl;        
                        this.setSource(url, videoUrl);
                    }, 1000);
                } else {
                    this.initVideoUrl = videoUrl;    
                    this.setSource(url, videoUrl);
                }                
            } else {
                console.log('Invalid Video Initialize Data!');
            }
        } catch(err) {
            console.log(err);
        }
    }

    handleUnsupported = () => {
        if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
            console.log('You are using Firefox, it looks like MediaSource is not enabled.');
        } else {
            console.log('Your Browser does not support MediaSourceExtension / MP4 mediasource');
        }
    }
}