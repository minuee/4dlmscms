// author: Jinsung Park
// email: jspark@4dreplay.com

import { buildAbsoluteURL } from 'url-toolkit';

import { FDPlayerUtils } from './fdplayer-utils';
import { FDPlayerConfig } from './fdplayer-config';
import { FDPlayerScreen } from './fdplayer-screen';

import { CreateElement } from './common/CreateElement';
import { EventDispatcher } from './common/EventDispatcher';
import { State } from './fdreplay/controller/base-stream-controller';

import Hls from './fdreplay/hls';
import COMMON_VAL from './common/CommonVariable';

const initConfig = {
    parentId: 'video-player',
    displayType:'responsive',
    playsinline:'yes',
    showPlayerByDefault:'yes',    
    maxWidth:1066,
    maxHeight:600,
    volume:.3,
    backgroundColor:'#212121',
    offsetX:0,
	offsetY:0,    
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

const FRAME_DURATION = 1.001/30;
const FRAME_LOOP_TIME_TM = 70;
export class FDPlayer extends EventDispatcher {  
    
    _playerMain;
    _playerConfig;
    _hls;

    props = initConfig;

    constructor(options) {
        super();

        this.options = options;
        this.utils = new FDPlayerUtils();

        this.initUrl = '';
        this.initVideoUrl = '';
        this.initChannel = 0;
        this.initTotalChannel = 0;
        this.startChannel = 0;
        this.endChannel = 0;       

        this.isFullScreen = false;
        this.isVideoComplete = false;
        this.isVideoPlayerReady = false;
        this.isSwitchBuffering = false;

        this.isStopTimeslice = false;
        this.isRemoveRemainingBuffer = false;

        this.requestAniFrameForFrame = false;
        this.isFramePauseAndContinue = false;
        this.frameTimer = 0;
        this.playbackTimer = 0;

        this.playPromise = null;
        this.pausedBufferFrame = null;   
        
        this.eventTarget = 'PC';
        
        this.initConfig();
        this.initPlayer();
    }

    initConfig = () => {
        this.currentFrameForChannel = 0;
        this.currentFrameTimeForChannel = 0; 
        this.currentFrameForFrame = 0;
        this.currentFrameTimeForFrame = 0;

        this.previousChannel = -1;
        this.previousContinueFrameSn = -1;        
        this.previousFrame = -1;
        
        this.isRequestAniFrameForChannel = true;
        this.isRequestAniFrameForFrame = true;
        this.channelDirection = '';
        this.frameDirection = '';
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
        this.isShowed = this.utils.convertStrToBool(this.props.showPlayerByDefault);
        this.videoContainer.innerHTML = '';

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
        this.setConfig();
        this.startResizeHandler();        
    }

    openVideo(url, totalChannel, initChannel, startChannel, endChannel) {
        try{
            if(url && totalChannel && initChannel) {
                const pathChannel = initChannel.toString().padStart(3, "0");
                const master = 'master.m3u8';
                const relurl = pathChannel + '/' + master;
                const videoUrl = buildAbsoluteURL(url, relurl, { alwaysNormalize: true });

                window.callByInBtnReplay(false);
                
                if(this.initVideoUrl !== '') {
                    this.resetVideo(url, videoUrl, totalChannel, initChannel, startChannel, endChannel);
                } else {
                    this.initUrl = url;
                    this.initVideoUrl = videoUrl;
                    this.initTotalChannel = totalChannel;
                    this.initChannel = initChannel;
                    this.startChannel = startChannel;
                    this.endChannel = endChannel;
    
                    this.setSource(url, videoUrl, this.initChannel);
                } 
            } else {
                window.callByError('Invalid Video Initialize Data!');
            }
        } catch(err) {
            window.callByError(err);
        }
    }

    stopLoad = () => {
        this._hls.stopLoad();
    }

    startLoadLiveLevel = () => {
		this._hls.startLoadLiveLevel();
	}

	stopLoadLiveLevel = () => {
		this._hls.stopLoadLiveLevel();
	}

    getPlayerUtils = () => {
        return this.utils;
    }

    resetVideoStream = () => {
        if(this._hls) {
            if(this.playbackTimer) {
                window.cancelAniFrame(this.playbackTimer);
                this.playbackTimer = null;
            }

            if(this.channelHandler) {
                window.cancelAniFrame(this.channelHandler);
                this.channelHandler = null;
            }

            clearInterval(this._hls.bufferTimer);

            this.setCurrentTimeInfo(0);
            window.callUpdatePlaybackTime(0);

            this._hls.removeBufferAll();
            this._hls.removeLastBufferedFragment();
            this._hls.removeLastBufferedFrame();
            this._hls.removeAllFrames();
            this._hls.removeAllFragments();
        }
    }

    checkStreamState = () => {
        if(this._hls) {
			const startSeq = this._hls.mediaStartSeq;

			if (startSeq > 0) {
				// LIVE
			} else {
				// VOD
				const currentState = this._hls.state;
				const video = this.objVideoScreen.nodeVideo;				
				let remainTime = video.duration - video.currentTime;
				if(remainTime <= FRAME_DURATION*2 && (currentState === State.ENDED || this.isVideoComplete)) {
					this.isVideoComplete = false;
					this.setCurrentTimeInfo(0);
					window.callUpdatePlaybackTime(0, 0);
					this._hls.state = State.IDLE;

					if(this._hls.mediaVariantState) {
						this._hls.mediaVariantState = false;
						this._hls.removeBufferAll();
						return false;
					}
				}
			}
		}
        return true;
    }

    resetVideoState = () => {
        this.setCurrentTimeInfo(0);
        this._hls.removeLastBufferedFragment();
        this._hls.removeLastBufferedFrame();
        this._hls.removeAllFrames();
        this._hls.removeAllFragments();

        const startPosition = this._hls.currentTime;            
        this._hls.addInitFrameSegment = false;
        this._hls.startLoad(startPosition);

        window.callByInLoadingBar(false);
        window.callByInIsPlaying(true);

        this.play();
        return;
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

        if(window.Android) {
            window.Android.onPlayerLoadComplete();
        } else {
            window.callByInPlayerReady(true);
        }
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
        this.playPromise = e.promise;
    }

    videoScreenStartHandler = () => {
        window.callByInLoadingBar(false);
        window.callByInIsPlaying(true);
        this.play();
    }

    videoScreenStopHandler = () => {
    }

    videoScreenPlayHandler = () => {
    };

    videoScreenPauseHandler = () => {      
        if(this.isFramePauseAndContinue) {
            this.isFramePauseAndContinue = false;
        }
    };
    
    videoScreenUpdateHandler = (e) => {        
    };

    videoScreenUpdateTimeHandler = (e) => {        
    }

    videoScreenLoadProgressHandler = (e) => {
    }

    videoScreenStartToBufferHandler = () => {
        if(this.isVideoComplete) {
            const video = this.objVideoScreen.nodeVideo;
            this._hls.currentTime = video.duration;
        }
    }

    videoScreenStopToBufferHandler = () => {
    }

    videoScreenPlayCompleteHandler = () => {
        this.isVideoComplete = true;
    }

    videoScreenEnableToScrubHandler = () => {
    }

    videoScreenErrorHandler = () => {
    }

    //##########################################################################################//
    /* common player utils */
    //##########################################################################################//
    showFullScreen(player) {
        if(document.addEventListener){
            document.addEventListener("fullscreenchange", this.onFullScreenChange);
            document.addEventListener("mozfullscreenchange", this.onFullScreenChange);
            document.addEventListener("webkitfullscreenchange", this.onFullScreenChange);
            document.addEventListener("MSFullscreenChange", this.onFullScreenChange);
        }
        
        if(document.documentElement.requestFullScreen) {
            player.documentElement.requestFullScreen();
        } else if(document.documentElement.mozRequestFullScreen){ 
            player.mozRequestFullScreen();
        } else if(document.documentElement.webkitRequestFullScreen){
            player.webkitRequestFullScreen();
        } else if(document.documentElement.msRequestFullscreen){
            player.msRequestFullscreen();
        }
        
        this._playerMain.style().position = "fixed";
        document.documentElement.style.overflow = "hidden";
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
        this.mediaPlay();       
    };
    
    play = () => {			
        this.mediaPlay();
    };

    mediaPlay = () => {
        if(!this.isVideoPlayerReady) return;
        
        this.isHLSManifestReady = this.getPrevHlsInfo(); 

        if(this.isHLSManifestReady){            
            if(this.objVideoScreen) {
                window.cancelAniFrame(this.playbackTimer);
                this.playbackTimer = window.requestAniFrame(this.checkPlayback);
                this.objVideoScreen.play(this._hls);
            }
            
            // Initialize Value
            this.isRemoveRemainingBuffer = false;
            this._hls.pausedBufferFrame = null;
            this._hls.videoIsPlaying = true;
            this._hls.videoIsPause = false;

            if(
				this._hls.state === State.SWITCHING_CHANNEL || 
				this._hls.state === State.SWITCHING_FRAME ||
				this._hls.state === State.SWITCHING_LIVE_ON
				) {
				this._hls.state = State.IDLE;				
			}

			if (this._hls.state === State.IDLE) {
				this._hls.startLoad(this._hls.currentTime);
			}
        }
    };

    pause = () => {
        if(!this.isVideoPlayerReady) return;

        if(this.playbackTimer) {
            window.cancelAniFrame(this.playbackTimer);
        }

        if(this.objVideoScreen) {
			this.objVideoScreen.pause(this.playPromise);
		}

		this._hls.videoIsPlaying = false;  
		this._hls.videoIsPause = true;
		
		this.setMediaLiveOff(false);
    };    
	
    
    stop = (source) => {
        if(!this.isVideoPlayerReady) return;

        if(this._hls) {
            this._hls.videoIsPlaying = false;
            if(this.playbackTimer) {
                window.cancelAniFrame(this.playbackTimer);
            }
        }
               
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
    
        if(this.objController) this.objController.updateVolume(volume, true);
        if(volume && removeAutoPlay){
            this._playerConfig.isAutoPlay = false;
        } 
        this.volume = volume;        
        this.objVideoScreen.setVolume(this.volume);
    };

    setSource(fixedurl, source, initChannel, overwrite) {			
        try{
            if(!this.isVideoPlayerReady) return;

            source = source.replace(/&amp;/g, "&");
            if(!source){
                window.callByError('Video URL is not defined!');
                return;
            }

            this.stop();
            window.callUpdatePlaybackTime(0);                    

            this.createObjHls();   
            this._hls.playbackChannel = initChannel;            
        
            this.resizeHandler();
            
            this.objVideoScreen.setBkColor(this.strBackgroundColor);
            this.objVideoScreen.setX(0)
            this.objVideoScreen.setVisible(true);
            this.objVideoScreen.setSource(source);            
            
            if(this._hls) {       
                this._hls.loadSource(fixedurl, source);
                this._hls.autoLevelCapping = -1;
                this._hls.attachMedia(this.objVideoScreen.nodeVideo);

                this.setHlsAddEventListeners(this._hls);
            } else {
                window.callByError('HLS Object is not loaded.');
            }
        } catch(err) {
            console.log(err);
        }
    };

    setPlaybackRate(rate) {
        if(this.objVideoScreen){
            this.objVideoScreen.setPlaybackRate(rate);
        }
    }

    seekBarMouseDownHandler = () => {
        if(!this.isVideoPlayerReady) return;

        try {
			this._hls.stopLoad();
			this._hls.removeLastBufferedFragment();
			this._hls.removeLastBufferedFrame();
			
			clearInterval(this._hls.bufferTimer);        
			if(this._hls.videoIsPlaying) {
				if(this.playbackTimer) {
					window.cancelAniFrame(this.playbackTimer);
				}

				if(this.objVideoScreen) {
					if(this.playPromise !== undefined) {
						this.playPromise.then(_ => {                        
								this.objVideoScreen.nodeVideo.pause();
						})
						.catch(error => {});
					}
				}
			}
			
			if(this.objVideoScreen) this.objVideoScreen.startToScrub();
		} catch (err) {
			console.log(err);
		}
    }

    seekBarMouseUpHandler = (startPosition) => {
        if(!this.isVideoPlayerReady) return;

		const { _hls } = this;

		try {
			if(this.objVideoScreen) this.objVideoScreen.stopToScrub();
			if(this.objVideoScreen) {
				if(this.playPromise !== undefined) {
					this.playPromise.then(_ => {                        
							this.objVideoScreen.nodeVideo.pause();
					})
					.catch(error => {});
				}
			}       

			_hls.seekStartPosition = startPosition;
			_hls.addInitFrameSegment = false;

            if(this.isVideoComplete) {
				this.isVideoComplete = false;
			}
			
			if(_hls.mediaVariantState) {
				_hls.state = State.SEEK;
				_hls.switchingGOP(30);
				_hls.removeAllFrames();
				_hls.removeAllFragments();            
				_hls.removeBufferAll();
			} else {
				if (_hls.mediaStartSeq > -1) {
					// LIVE
					_hls.state = State.SEEK;
					_hls.switchingGOP(30);
					_hls.removeAllFrames();
					_hls.removeAllFragments();            
					_hls.removeBufferAll();
				} else {
					// VOD
					this.setCurrentTimeInfo(startPosition);
					this.seekBarActionComplete(); 
				}
			}
			//this._hls.currentTime = 1;
		} catch (err) {
			console.log(err);
		}
    }

    seekBarActionComplete = () => {
        const { _hls } = this;		
		if (_hls.videoIsPlaying) {
			setTimeout(() => {
				this.playPromise = this.objVideoScreen.nodeVideo.play();
				this.playbackTimer = window.requestAniFrame(this.checkPlayback);
			}, 200);
		} 

		_hls.startLoad(_hls.seekStartPosition);
    }

    //######################################################################################//
    /* Hide / show cursor */
    //######################################################################################//
    hideCursor() {
        document.documentElement.style.cursor = "none";
        document.getElementsByTagName("body")[0].style.cursor = "none";
    };
    
    showCursor() {
        document.documentElement.style.cursor = "auto";
        document.getElementsByTagName("body")[0].style.cursor = "auto";
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
        });

        hls.on(Hls.Events.BUFFER_RESET, () => {
        });

        hls.on(Hls.Events.BUFFER_RESET_FOR_CHANNEL, () => {
            clearInterval(this._hls.bufferTimer);
            this.checkBuffer(false);
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
        });

        hls.on(Hls.Events.DESTROYING, () => {
            clearInterval(this._hls.bufferTimer);
        });

        hls.on(Hls.Events.ERROR, (eventName, data) => {
        });

        hls.on(Hls.Events.PLAY_CHANNEL_BUFFER, () => {
            if(this.objVideoScreen) {
                hls.frameIsPlaying = true;
                this.playPromise = this.objVideoScreen.nodeVideo.play();
            } 
        });        

        hls.on(Hls.Events.MEDIA_PAUSE, () => {
            if(this.objVideoScreen) {
                if(this.playPromise !== undefined) {
                    this.playPromise.then(_ => {                        
                        this.objVideoScreen.nodeVideo.pause();
                    })
                    .catch(error => {});
                }                
            } 
        });

        hls.on(Hls.Events.PLAY_COMPLETE, () => {
            clearInterval(this._hls.bufferTimer);
        });

        hls.on(Hls.Events.RESET_PREVIOUS_DATA, () => {
            this.previousFrame = -1;
            this.previousChannel = -1;
            this.previousContinueFrameSn = -1;
        });

        hls.on(Hls.Events.RESET_VIDEO_STATE, () => {
            switch(this._hls.state) {			
				case State.SEEK:
					this.seekBarActionComplete();
					break;
				case State.SWITCHING_LIVE_ON:
					this.startLiveOnNow();
					break;
				default:
					this.resetVideoState();
					break;
			}
        });

        hls.on(Hls.Events.PLAY_MOBILE_CHANNEL_BUFFER, () => {
            if(this.objVideoScreen) {
                if(this._hls.videoIsPlaying) {
                    hls.frameIsPlaying = true;
                    this.stopChannelSwitch();
                } else {
                    this.stopChannelSwitch();
                }
            } 
        });        

        hls.on(Hls.Events.BUFFER_REMOVE_RANGE, (eventName, data) => {
            switch(this._hls.state) {
				case State.SWITCHING_CHANNEL:
				case State.ENDED:
					if(data.isTest) {
						this.executeChannelSwitchTest();
					} else {
						this.executeChannelSwitch()
					}
					break;
				case State.SEEK:
					this.seekBarActionComplete();
					break;
				default:
					break;
			}
        });

        hls.on(Hls.Events.TIMESLICE_EMSG_PARSED, () => {
            if(!this.isStopTimeslice) {
                this.executeChannelSwitch();
            }
        });

        hls.on(Hls.Events.STREAM_STATE_TRANSITION, (eventName, data) => {
        });

        hls.on(Hls.Events.MEDIA_LIVE_ON, (eventName, data) => {
			window.callUpdateIsLive(true);
			window.callUpdateIsNow(true);
			this._hls.liveIsNow = true;
			this._hls.playlistDownload = data.download;
		});

		hls.on(Hls.Events.MEDIA_LIVE_OFF, (eventName, data) => {
			window.callUpdateIsLive(true);
			window.callUpdateIsNow(false);
			this._hls.liveIsNow = false;
			this._hls.playlistDownload = data.download;
		});

		hls.on(Hls.Events.START_LIVE_ON_NOW, (eventName, data) => {
			window.callByInLoadingBar(false);
			window.callByInIsPlaying(true);
			this.play();
		});
    }

    checkBuffer = (isLoop = true) => {
        const startSeq = this._hls.mediaStartSeq;
		try {
			if(this._hls.videoIsPlaying && this.isSwitchBuffering) {
				this.isSwitchBuffering = false;
				if(this.objVideoScreen) {
					this.playPromise = this.objVideoScreen.nodeVideo.play();
				}
				window.cancelAniFrame(this.playbackTimer);
				this.playbackTimer = window.requestAniFrame(this.checkPlayback);
			}  
			
			if(this.objVideoScreen) {
				window.callUpdateDuration(this.objVideoScreen.nodeVideo.duration, startSeq);
				if (!this._hls.videoIsPlaying) {
					window.callUpdatePlaybackTime(this.objVideoScreen.nodeVideo.currentTime, startSeq);
				}
			}
			
			if(isLoop) {
			}
		} catch(err) {
			console.log(`checkBuffer Error: ${err}`);
		}
    }

    checkPlayback = () => {  
		let mediaStartSeq = this._hls.mediaStartSeq;
		let currentTime = this.objVideoScreen.nodeVideo.currentTime;
		let totalDuration = this.objVideoScreen.nodeVideo.duration;			
		try {
			if(currentTime >= totalDuration) { 
				currentTime = totalDuration;
				window.callByInIsPlaying(false);

				if(this._hls.videoIsPlaying) {
					if(this.objVideoScreen) {
						if(this.playPromise) {
							this.playPromise.then(_ => {                        
								this.objVideoScreen.nodeVideo.pause();
							})
							.catch(error => {});
						}
					}
				}

				this._hls.videoIsPlaying = false;

				window.cancelAniFrame(this.playbackTimer);
				window.callUpdatePlaybackTime(currentTime, mediaStartSeq);
				return;
			} else {            
				window.callUpdatePlaybackTime(currentTime, mediaStartSeq);
			}

			window.cancelAniFrame(this.playbackTimer);

			if(currentTime <= totalDuration) {
				this.playbackTimer = window.requestAniFrame(this.checkPlayback);
			}
		} catch(err) {
			console.log(`checkPlayback Error: ${err}`);
		}       
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

    setCurrentTimeInfo = (time) => {        
        this._hls.currentTime = time;        
    }

    setEventTarget = (target) => {
		this.eventTarget = target;
	}

    setInitFrameSegment = () => {
        this._hls.addInitFrameSegment = false;
    }

    setChannelDirection = (direction) => {
        this.previousChannel = -1;
        this.previousContinueFrameSn = -1;
        this.channelDirection = direction;
    }

    setMediaLiveOn = (download) => {
		let mediaStartSeq = this._hls.mediaStartSeq;
		if (mediaStartSeq > -1) {
			this._hls.trigger(Hls.Events.MEDIA_LIVE_ON, {download: download});
		}
	}

	setMediaLiveOff = (download) => {
		let mediaStartSeq = this._hls.mediaStartSeq;
		if (mediaStartSeq > -1) {
			this._hls.trigger(Hls.Events.MEDIA_LIVE_OFF, {download: download});
		}
	}

    changeStateRequestAniFrameForChannel = (value) => {
        this.isRequestAniFrameForChannel = value;   // preventing too fast
    }

    removeRemainingBuffer = (isTest) => {

        this._hls.state = State.SWITCHING_CHANNEL;

        const curTime = this._hls.currentTime;
        const isPlaying = this._hls.videoIsPlaying;

        let lastBufferedFrame , curFrameSn, reqFrameSn, reqFrameTime;    
        if(this._hls.pausedBufferFrame) {
            lastBufferedFrame = this._hls.pausedBufferFrame;
        } else {
            lastBufferedFrame = this._hls.lastBufferedFrame;
        }

        if(lastBufferedFrame) {
            curFrameSn = lastBufferedFrame.sn;
        } else {
            curFrameSn = Math.floor(curTime / FRAME_DURATION);
        }

        if(isPlaying) {
            reqFrameSn = curFrameSn + 1;
        } else {
            reqFrameSn = curFrameSn;
        }

        reqFrameTime = reqFrameSn * FRAME_DURATION;
        this._hls.removeBufferStartToAll(reqFrameTime, isTest);
    }

    executeChannelSwitch = () => {        
        if(!this.isVideoPlayerReady) return;

		this.isStopTimeslice = false;
		const startChannel = this._hls.playbackChannel;
		
		let channel = 0;
		switch(this.channelDirection) {
			case 'R':
				channel = startChannel + 1;
				break;
			case 'L':
				channel = startChannel - 1;
				break;
			default:
				return;
		}
		
		if(channel > this.endChannel ||  channel < this.startChannel) { 
			if(this._hls.videoIsPlaying) {
				const lastBufferedFrame = this._hls.lastBufferedFrame;
				if(lastBufferedFrame && this.previousContinueFrameSn !== lastBufferedFrame.sn) {
					this.previousContinueFrameSn = lastBufferedFrame.sn;
					this._hls.continueChannel(this.channelDirection);
				}
			}             
		} else {				
			this.previousContinueFrameSn = -1;

			if(this.playbackTimer) {
				window.cancelAniFrame(this.playbackTimer);
				this.playbackTimer = null;
			}

			if(this.objVideoScreen) {
				if(this.playPromise) {
					this.playPromise.then(_ => {                        
						this.objVideoScreen.nodeVideo.pause();
					})
					.catch(error => {});
				}                      
			}			
			
			if(this.previousChannel !== startChannel) {
				this.previousChannel = startChannel;
				this._hls.switchChannel(startChannel, this.channelDirection, this._hls.videoIsPlaying);
			} 
		}
    }       

    stopChannelSwitch = () => {   
        const { _hls } = this;

		if(_hls) {            
			if(!_hls.videoIsPlaying) {
				if(this.objVideoScreen) {
					if(this.playPromise) {
						this.playPromise.then(_ => {                        
							this.objVideoScreen.nodeVideo.pause();
						})
						.catch(error => {});
					}
				}
			}            

			if(this.playbackTimer) {
				window.cancelAniFrame(this.playbackTimer);
			}
			if(this.channelHandler) {
				window.cancelAniFrame(this.channelHandler);
			}
			
			this.channelHandler = null;
			this.currentFrameForChannel = 0;
			this.currentFrameTimeForChannel = 0;
			this.isSwitchBuffering = true;

			_hls.removeAllFragments();
			_hls.removeLastBufferedFragment();

			if(_hls.videoIsPlaying) {
				_hls.pausedBufferFrame = null;
			} else {
				_hls.pausedBufferFrame = _hls.lastBufferedFrame;
			}
			
			if(_hls.videoIsPlaying) {
				_hls.state = State.IDLE;
				_hls.addInitFrameSegment = false;
				_hls.startLoad(_hls.currentTime);
			} else {
				if (_hls.mediaStartSeq > -1) {
					// startLoad Playlist after switching channel (Timeslice)
					_hls.levelStartLoad();
				}
			}

			this.isStopTimeslice = true;
			this.isRemoveRemainingBuffer = false;
		}        
        
        return;
    }

    continueNextFrame = () => {
        if(!this.isFramePauseAndContinue) {            
            this.requestAniFrameForFrame = false;
            window.cancelAniFrame(this.frameTimer);

            let startPosition = this._hls.currentTime;
            this._hls.addInitFrameSegment = false;        
            this._hls.startLoad(startPosition);
        }

        if(this.requestAniFrameForFrame) {
            window.cancelAniFrame(this.frameTimer);
            this.frameTimer = window.requestAniFrame(this.continueNextFrame);
        }
    }

    executeChannelSwitchLeft = () => {
        if(!this.isVideoPlayerReady) return;        

		this.isStopTimeslice = true;
		const startChannel = this._hls.playbackChannel;
		if(startChannel - 1 < this.startChannel) {
			if(this._hls.videoIsPlaying) {
				const lastBufferedFrame = this._hls.lastBufferedFrame;
				if(lastBufferedFrame && this.previousContinueFrameSn !== lastBufferedFrame.sn) {
					this.previousContinueFrameSn = lastBufferedFrame.sn;
					this._hls.continueChannel(this.channelDirection);
				}
			}
		} else {
			if(this.playbackTimer) {
				window.cancelAniFrame(this.playbackTimer);
				this.playbackTimer = null;
			}

			if(this.objVideoScreen) {
				if(this.playPromise !== undefined) {
					this.playPromise.then(_ => {                        
							this.objVideoScreen.nodeVideo.pause();
					})
					.catch(error => {});
				}
			}            

			if(this.previousChannel !== startChannel) {
				this.previousChannel = startChannel;
				this._hls.switchChannel(startChannel, this.channelDirection, this._hls.videoIsPlaying);
			} else {

			}
		}            
    }

    executeChannelSwitchRight = () => {
        if(!this.isVideoPlayerReady) return;

		this.isStopTimeslice = true;
		const startChannel = this._hls.playbackChannel;
		if(startChannel + 1 > this.endChannel) { 
			if(this._hls.videoIsPlaying) {
				const lastBufferedFrame = this._hls.lastBufferedFrame;
				if(lastBufferedFrame && this.previousContinueFrameSn !== lastBufferedFrame.sn) {
					this.previousContinueFrameSn = lastBufferedFrame.sn;
					this._hls.continueChannel(this.channelDirection);
				}
			}
		} else {            
			if(this.playbackTimer) {
				window.cancelAniFrame(this.playbackTimer);
				this.playbackTimer = null;
			}

			if(this.objVideoScreen) {
				if(this.playPromise !== undefined) {
					this.playPromise.then(_ => {                        
							this.objVideoScreen.nodeVideo.pause();
					})
					.catch(error => {});
				}
			}

			if(this.previousChannel !== startChannel) {
				this.previousChannel = startChannel;
				this._hls.switchChannel(startChannel, this.channelDirection, this._hls.videoIsPlaying);
			} else {

			}
		}
    }
    
    checkTimemachineAvailable = (direction) => {
		if (this._hls && this.isVideoPlayerReady) {
			if (this._hls.liveIsNow && direction === 'F') {
				return false;
			} else {
				return true;
			}
		}
		return false;
	}

    setFrameDirection = (direction) => {
        this.frameDirection = direction;
    }

    changeStateRequestAniFrameForFrame = (value) => {
        this.isRequestAniFrameForFrame = value;   // preventing too fast
    }

    executeFrameSwitch = () => {        

        if(!this.isVideoPlayerReady) return;

		this._hls.pausedBufferFrame = null;

		let frameTime = Math.round((1/60)*1000);
		this.currentFrameTimeForFrame += frameTime;

		let tempFrame; 
		if(this.isMobile) {
			tempFrame = Math.floor(this.currentFrameTimeForFrame / FRAME_LOOP_TIME_TM);
		} else {
			tempFrame = Math.floor(this.currentFrameTimeForFrame / FRAME_LOOP_TIME_TM);
		}
		
		if(this.currentFrameForFrame < tempFrame) {
            const totalFrame = this._hls.totalFrame;
			this.currentFrameForFrame = tempFrame;						
			let startFrame = Math.floor(this._hls.currentTime / this._hls.config.FRAME_DURATION);

            if(this.isVideoComplete) {
				this.isVideoComplete = false;
			}

			if(this.frameDirection === 'B') {
				if(startFrame - 1 < 0) {                
					return;
				}
			}

			if(this.frameDirection === 'F') {
				if(startFrame + 1 > totalFrame) {                
					return;
				}
			}

			if(this.playbackTimer) {
				window.cancelAniFrame(this.playbackTimer);
				this.playbackTimer = null;
			}

			if(this._hls.videoIsPlaying) {
				if(this.objVideoScreen) {
					if(this.playPromise !== undefined) {
						this.playPromise.then(_ => {                        
							this.objVideoScreen.nodeVideo.pause();
						})
						.catch(error => {});
					}
				}
			}

			this._hls.switchFrame(startFrame, this.frameDirection, this._hls.videoIsPlaying);          
		}

		if(this.isRequestAniFrameForFrame) {
            window.cancelAniFrame(this.frameHandler);
            this.frameHandler = window.requestAniFrame(this.executeFrameSwitch);
		}
    }

    stopFrameSwitch = () => {
        if(this._hls) {
            if(this.playbackTimer) {
                window.cancelAniFrame(this.playbackTimer);
            }
            if(this.frameHandler) {
                window.cancelAniFrame(this.frameHandler);
            }
            
            this.frameHandler = null;
            this.currentFrameForFrame = 0;
            this.currentFrameTimeForFrame = 0;
            this.isSwitchBuffering = true;            
            
            this._hls.removeAllFrames();
            this._hls.removeLastBufferedFrame();

            const startPosition = this._hls.currentTime;
        
            this._hls.state = State.IDLE;
            this._hls.addInitFrameSegment = false; 
            this._hls.startLoad(startPosition);
        }
        
        return;
    }

    executeFrameSwitchForward = () => {
        if(!this.isVideoPlayerReady) return;
		const totalDuration = this._hls.totalDuration;
		const totalFrame = totalDuration * 30;
		let startFrame = Math.floor(this._hls.currentTime / this._hls.config.FRAME_DURATION);
		if(startFrame + 1 > totalFrame) {   
			return;
		} else {
			if(this.playbackTimer) {
				window.cancelAniFrame(this.playbackTimer);
				this.playbackTimer = null;
			}

			this.previousFrame = startFrame;
			this._hls.switchFrame(startFrame, this.frameDirection, this._hls.videoIsPlaying);
		}
    }

    executeFrameSwitchBackward = () => {
        if(!this.isVideoPlayerReady) return;
		if(this.playbackTimer) {
			window.cancelAniFrame(this.playbackTimer);
			this.playbackTimer = null;
		}

		let startFrame = Math.floor(this._hls.currentTime / this._hls.config.FRAME_DURATION);
		if(startFrame - 1 < 0) {               
			return;
		} else {
			this.previousFrame = startFrame;
			this._hls.switchFrame(startFrame, this.frameDirection, this._hls.videoIsPlaying);
		}
    }

    resetVideo = (url, videoUrl, totalChannel, initChannel, startChannel, endChannel) => {
        this._hls.stopLoad();
        this.objVideoScreen.stop();

        clearInterval(this._hls.bufferTimer);
        if(this.playbackTimer) {
            window.cancelAniFrame(this.playbackTimer);
        }

        this._hls.videoIsPlaying = false;        
        this.isHLSManifestReady = false;

        window.callUpdatePlaybackTime(0, 0);

        this._hls.trigger(Hls.Events.MEDIA_DETACHING);

        setTimeout(() => {
            this.initUrl = url;
            this.initVideoUrl = videoUrl;
            this.initTotalChannel = totalChannel;
            this.initChannel = initChannel;
            this.startChannel = startChannel;
            this.endChannel = endChannel;      
            this.setSource(url, videoUrl, this.initChannel);
        }, 1000);
    }

    clearVideo = () => {
        this._hls.stopLoad();
        this.objVideoScreen.stop();

        clearInterval(this._hls.bufferTimer);
        if(this.playbackTimer) {
            window.cancelAniFrame(this.playbackTimer);
        }

        this._hls.videoIsPlaying = false;        
        this.isHLSManifestReady = false;

        window.callUpdatePlaybackTime(0, 0);

        this._hls.trigger(Hls.Events.MEDIA_DETACHING);        
    }

    handleUnsupported = () => {
        if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
            window.callByError('You are using Firefox, it looks like MediaSource is not enabled.');
        } else {
            window.callByError('Your Browser does not support MediaSourceExtension / MP4 mediasource');
        }
    }

    useMediaStorage = (state) => {
        //this._hls.useMediaStorage = state;
    }

    clearBufferForLiveOnNow = () => {
		const { _hls } = this;		
		_hls.state = State.SWITCHING_LIVE_ON;

		// BufferClear
		_hls.removeAllFragments();
		_hls.removeLastBufferedFragment();
		_hls.removeAllFrames();
		_hls.removeLastBufferedFrame();

		_hls.removeBufferAll();
	}

	startLiveOnNow = () => {
		const { _hls } = this;		
		const startPostion = _hls.liveCurrentSeq;

		_hls.videoIsPause = false;
		_hls.startLiveOnNow = false;

		this.clearBufferForLiveOnNow();
		
		if (_hls.currentGOP === 1) {
			_hls.switchingGOP(30);
		}

		if (
			_hls.state === State.SWITCHING_CHANNEL || 
			_hls.state === State.SWITCHING_FRAME ||
			_hls.state === State.SWITCHING_LIVE_ON
			) {
			_hls.state = State.IDLE;
		}

		_hls.startLoad(startPostion);
	}

    destroyHLS = () => {
        if(this._hls){
            this._hls.destroy();
            this._hls = null;
        }
    }
}