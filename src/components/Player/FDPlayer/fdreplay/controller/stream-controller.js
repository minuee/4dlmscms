import Events from '../events';
import BinarySearch from '../utils/binary-search';
import { BufferHelper } from '../utils/buffer-helper';
import Demuxer from '../demux/demuxer';
import Fragment from '../loader/fragment';

import { FragmentState } from './fragment-tracker';
import { ElementaryStreamTypes } from '../loader/fragment';
import { PlaylistLevelType } from '../types/loader';
import * as LevelHelper from './level-helper';
import TimeRanges from '../utils/time-ranges';
import { ErrorDetails } from '../errors';
import { logger } from '../utils/logger';
import { alignStream } from '../utils/discontinuities';
import { findFragmentByPDT, findFragmentByPTS } from './fragment-finders';
import GapController, { MAX_START_GAP_JUMP } from './gap-controller';
import BaseStreamController, { State, SegmentType, FrameType, FramePosition } from './base-stream-controller';

import FrameLoader from '../loader/frame-loader';
import FrameMetaLoader from '../loader/frame-meta-loader';
class StreamController extends BaseStreamController {
  constructor (hls, fragmentTracker) {
    super(hls,
      Events.MEDIA_ATTACHED,
      Events.MEDIA_DETACHING,
      Events.MANIFEST_LOADING,
      Events.MANIFEST_PARSED,
      Events.LEVEL_LOADED,
      Events.LEVELS_UPDATED,
      Events.KEY_LOADED,
      Events.FRAG_LOADED,
      Events.FRAG_LOAD_EMERGENCY_ABORTED,
      Events.FRAG_PARSING_INIT_SEGMENT,
      Events.FRAG_PARSING_DATA,
      Events.FRAG_PARSED,
      Events.FRAG_SEEKED,      
      // Events.AUDIO_TRACK_SWITCHING,
      // Events.AUDIO_TRACK_SWITCHED,
      Events.BUFFER_CREATED,
      Events.BUFFER_APPENDED,
      Events.BUFFER_FLUSHED,
      Events.CHANNEL_SWITCHING,
      Events.GOP_LEVEL_SWITCHING,
      Events.TIMESLICE_FRAG_LOADED,
      Events.TIMEMACHINE_FRAG_LOADED,
      Events.FRAME_FRAG_LOADED,
      Events.FRAME_META_LOADED,
      Events.FRAME_SWITCHING,
      Events.CHANNEL_CONTINUING,
      Events.ERROR,
    );

    this.fragmentTracker = fragmentTracker;
    this.config = hls.config;
    this.media = undefined;
    //this.audioCodecSwap = false;
    this._state = State.STOPPED;
    this.stallReported = false;
    this.gapController = null;
    //this.altAudio = false;
    //this.audioOnly = false;

    this._liveStartSeq = -1;    // 처음 접속한 seq
    this._liveCurrentSeq = -1;  // 현재 Live seq
    this._liveInitStart = false;

    this._fixedurl = undefined;
    this._url = undefined;
    this._levels = [];
    this._levels_GOP = [];
    this._levels_FRAME = [];

    this._totalFrame = 0;
    this._totalDuration = 0;
    this._currentChannel = 0;
    this._currentGop = 30;
    this._seekStartPosition = 0;
    this._pauseBufferFrame = undefined;   

    this._isPlaying = false;
    this._isPause = false;
    this._isNow = false;
    this._isPlaylistDownload = false;
    this._isVariantMedia = false;
    this._isAddInitFrameSegment = false;
    this._frameIsPlaying = false;
    this._isUseMediaStorage = false;
    this._isStartLiveOnNow = false;

    this.fragPrevious = undefined;
    this.fragCurrent = undefined;
    this.framePrevious = undefined;
    this.frameCurrent = undefined;

    this.frameTimer = 0;
    this.tempFrameMS = 0;
    this.tempCurrentFrame = 0;
    this.isRequestAniFrameForFrame = false;    
  }

  startLoad (startPosition) {
    if (this._levels && this._levels.length > 0) {
      
      let lastCurrentTime = this.lastCurrentTime; 
      let hls = this.hls;

      this.stopLoad();
      
      if (this._currentGop === 30) {
        if(this.state !== State.SEEK) {
          this.setInterval(this.config.TICK_INTERVAL);
        }
        this.level = -1;
        this.fragLoadError = 0;

        if (!this.startFragRequested) {
          let startLevel = hls.startLevel;
          if (startLevel === -1) {          
            startLevel = hls.nextAutoLevel;          
          }
          this.level = hls.nextLoadLevel = startLevel;
          this.loadedmetadata = false;
        }

        if (lastCurrentTime > 0 && startPosition === -1) {
          startPosition = lastCurrentTime;
        }

        if(
          this.state !== State.SWITCHING_CHANNEL && 
          this.state !== State.SWITCHING_FRAME &&
          this.state !== State.SEEK) {
          
          this.state = State.IDLE;
          this.nextLoadPosition = this.startPosition = this.lastCurrentTime = startPosition;        
          this.tick();
        } else {
          this.doFragmentSeek(startPosition);
        }        
      } else {
        this.clearInterval();

        this.tempFrameMS = 0;
        this.tempCurrentFrame = 0;
        this.requestAniFrameForFrame = true;

        this.doFrame();
      }
    } else {
      this.forceStartLoad = true;
      this.state = State.STOPPED;
    }
  }

  stopLoad () {
    this.forceStartLoad = false;

    // Stop Frame Load
    this.tempFrameMS = 0;
    this.tempCurrentFrame = 0;
    this.isRequestAniFrameForFrame = false;
    window.cancelAniFrame(this.frameTimer);

    super.stopLoad();
  }

  doTick () {
    switch (this.state) {
    case State.BUFFER_FLUSHING:
      this.fragLoadError = 0;
      break;
    case State.SWITCHING_CHANNEL:
    case State.SWITCHING_FRAME:
      break;  
    case State.SEEK:
      break;  
    case State.IDLE:
      this._doTickIdle();
      break;
    case State.WAITING_LEVEL:
      var details = this._levels[this.level]?.details;
      if (details && (!details.live || this.levelLastLoaded === this.level)) {
        this.state = State.IDLE;
      }

      break;
    case State.FRAG_LOADING_WAITING_RETRY:
      var now = window.performance.now();
      var retryDate = this.retryDate;
      if (!retryDate || (now >= retryDate) || (this.media && this.media.seeking)) {
        this.state = State.IDLE;
      }
      break;
    case State.ERROR:
    case State.STOPPED:
    case State.FRAG_LOADING:
    case State.PARSING:
    case State.PARSED:
    case State.ENDED:
      break;
    default:
      break;
    }
    // check buffer
    this._checkBuffer();
    // check/update current fragment
    this._checkFragmentChanged();
  }  

  _doTickIdle () {
    const hls = this.hls;
    const config = hls.config;
    const media = this.media;

    if (this.videoIsPause) {
      return;
    }

    if (this.levelLastLoaded === undefined || (
      !media && (this.startFragRequested || !config.startFragPrefetch))) {
      return;
    }

    // if (this.altAudio && this.audioOnly) {
    //   this.demuxer.frag = null;
    //   return;
    // }

    let pos;
    if (this.loadedmetadata) {
      if(this.seekStartPosition > 0) {
        pos = this.seekStartPosition;
      } else {
        pos = media.currentTime;        
      }
    } else {
      pos = this.nextLoadPosition;
    }

    let level = hls.nextLoadLevel;
    //let level = 2;
    let levelInfo = this._levels[level];

    if (!levelInfo) {
      return;
    }

    let levelBitrate = levelInfo.bitrate;
    let maxBufLen;

    if (levelBitrate) {
      maxBufLen = Math.max(8 * config.maxBufferSize / levelBitrate, config.maxBufferLength);
    } else {
      maxBufLen = config.maxBufferLength;
    }

    maxBufLen = Math.min(maxBufLen, config.maxMaxBufferLength);

    const maxBufferHole = pos < config.maxBufferHole ? Math.max(MAX_START_GAP_JUMP, config.maxBufferHole) : config.maxBufferHole;
    const bufferInfo = BufferHelper.bufferInfo(this.mediaBuffer ? this.mediaBuffer : media, pos, maxBufferHole);
    const bufferLen = bufferInfo.len;

    if (bufferLen >= maxBufLen) {
      return;
    }

    this.level = hls.nextLoadLevel = level;
    //this.level = hls.nextLoadLevel = 2;

    //this.level = level;

    const levelDetails = levelInfo.details;
    if (!levelDetails || (levelDetails.live && this.levelLastLoaded !== level)) {
      this.state = State.WAITING_LEVEL;
      return;
    }

    if (this._isStreamEnded(bufferInfo, levelDetails)) {
      const data = {};
      //if (this.altAudio) {
        data.type = 'video';
      //}

      this.hls.trigger(Events.BUFFER_EOS, data);
      this.state = State.ENDED;
      return;
    }
    this._fetchFragmentInfo(pos, bufferInfo, levelInfo, levelDetails);
  }

  _fetchFragmentInfo (pos, bufferInfo, levelInfo, levelDetails) {
    
    const { config } = this;
    let fragPrevious = this.fragPrevious;

    let bufferEnd = bufferInfo.end;      
    let frag, fragSn, fragStart, fragStartTime, fragRelurl;
    
    try {
      if (levelDetails.live && !this.playlistDownload) {
        const lastBufferedFrame = this.fragmentTracker.lastBufferedFrame;
        if(lastBufferedFrame) {
          const currentSn = (lastBufferedFrame.sn + 1) / config.VIDEO_FPS;
          this.fragmentTracker.removeLastBufferedFrame();          
          fragSn = currentSn;
          fragStart = currentSn * config.FRAGMENT_DURATION;
          fragStartTime = fragStart;
          fragRelurl = fragSn.toString().padStart(10, "0") + '.m4s'; 
        } else {
          if (!fragPrevious) {            
            this.fragPrevious = fragPrevious = this.fragmentTracker.lastBufferedFragment;
          }

          if (fragPrevious) {
            fragSn = fragPrevious.sn + 1;
            fragStart = fragPrevious.start + config.FRAGMENT_DURATION; 
            fragStartTime = fragSn * config.FRAGMENT_DURATION;
            fragRelurl = fragSn.toString().padStart(10, "0") + '.m4s';
          }
        }

        if (fragSn <= this.liveCurrentSeq) {
          frag = new Fragment();
          frag.type = PlaylistLevelType.MAIN;
          frag.fixedurl = this._fixedurl;
          frag.level = levelInfo.level;
          frag.channelName = this._currentChannel.toString().padStart(3, "0");
          frag.channel = this._currentChannel;
          frag.levelName = levelInfo.height + config.ADAPT_NAME;;          
          frag.timeOffset = config.FRAGMENT_DURATION;
          frag.duration = config.FRAGMENT_DURATION;
          frag.cc = 0;
          frag.sn = fragSn;
          frag.start = fragStart;
          frag.end = fragStart + config.FRAGMENT_DURATION;
          frag.liveStartTime = fragStartTime;
          frag.liveEndTime = fragStartTime + config.FRAGMENT_DURATION;
          frag.relurl = fragRelurl;
          frag.url = frag.fixedurl + frag.channelName + '/' + levelInfo.height + this.hls.config.URL_PATH + frag.relurl;
        } else {
          console.log('%c xxxxxxxxxxxxxxxxxxxxx', 'color:red');
          return;
        }

      } else {

        const fragments = levelDetails.fragments;
        const fragLen = fragments.length;

        if (fragLen === 0) {
          return;
        }

        let start = fragments[0].start;
        let end = fragments[fragLen - 1].start + fragments[fragLen - 1].duration;              

        if (levelDetails.initSegment && !levelDetails.initSegment.data) {
          frag = levelDetails.initSegment;
        } else if (levelDetails.initFrameSegment && !levelDetails.initFrameSegment.data) {
          frag = levelDetails.initFrameSegment;
        } else {
          if (levelDetails.live) {
            let initialLiveManifestSize = this.config.initialLiveManifestSize;
            if (fragLen < initialLiveManifestSize) {
              return;
            }
          } else {
            if (this.currentTime === 0 && (!fragPrevious || bufferEnd < start)) {
              frag = fragments[0];
              frag.channel = this._currentChannel;
              frag.channelName = this._currentChannel.toString().padStart(3, "0");
              frag.url = frag.fixedurl + frag.channelName + '/' + levelInfo.height + this.hls.config.URL_PATH + frag.relurl;        
            }
          }
        }

        if (!frag) {
          frag = this._findFragment(start, fragPrevious, fragLen, fragments, bufferEnd, end, levelDetails);
          if (frag) {
            if (!frag.fixedurl) {
              console.log(frag.url);
            }
            frag.channel = this._currentChannel;
            frag.channelName = this._currentChannel.toString().padStart(3, "0");
            frag.url = frag.fixedurl + frag.channelName + '/' + levelInfo.height + this.hls.config.URL_PATH + frag.relurl;
          }
        }        

        // if (frag) {
        //   if (frag.encrypted) {
        //     this._loadKey(frag, levelDetails);
        //   } else {
        //     this._loadFragment(frag, levelDetails, pos, bufferEnd);
        //   }
        // }
      }

      if (frag) {
        if (frag.encrypted) {
          this._loadKey(frag, levelDetails);
        } else {
          this._loadFragment(frag, levelDetails, pos, bufferEnd);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  _loadFragment (frag, levelDetails, pos, bufferEnd) {
    //console.log('this._loadFragment');
    let fragState = this.fragmentTracker.getState(frag);

    this.fragCurrent = frag;
    if (frag.sn !== 'initSegment') {
      this.startFragRequested = true;
    }

    if (Number.isFinite(frag.sn)) {
      this.nextLoadPosition = frag.start + frag.duration;
    }

    if (frag.backtracked || fragState === FragmentState.NOT_LOADED || fragState === FragmentState.PARTIAL) {
      frag.autoLevel = this.hls.autoLevelEnabled;
      this.hls.trigger(Events.FRAG_LOADING, { frag, type: SegmentType.CONTINUE });
      if (!this.demuxer) {
        this.demuxer = new Demuxer(this.hls, 'main');
      }
      this.state = State.FRAG_LOADING;
    } else if (fragState === FragmentState.APPENDING) {
      if (this._reduceMaxBufferLength(frag.duration)) {
        this.fragmentTracker.removeFragment(frag);
      }
    }
  }

  _findFragment (start, fragPreviousLoad, fragmentIndexRange, fragments, bufferEnd, end, levelDetails) {
    const config = this.hls.config;
    let fragNextLoad;

    if (bufferEnd < end) {
      const lookupTolerance = (bufferEnd > end - config.maxFragLookUpTolerance) ? 0 : config.maxFragLookUpTolerance;
      fragNextLoad = findFragmentByPTS(fragPreviousLoad, fragments, bufferEnd, lookupTolerance);
      if(!fragNextLoad) {
        console.log(fragNextLoad);
      }
    } else {
      fragNextLoad = fragments[fragmentIndexRange - 1];
    }

    if (fragNextLoad) {
      const curSNIdx = fragNextLoad.sn - levelDetails.startSN;
      const sameLevel = fragPreviousLoad && fragNextLoad.level === fragPreviousLoad.level;
      const prevSnFrag = fragments[curSNIdx - 1];
      const nextSnFrag = fragments[curSNIdx + 1];

      if (fragPreviousLoad && fragNextLoad.sn === fragPreviousLoad.sn) {
        if (sameLevel && !fragNextLoad.backtracked) {
          if (fragNextLoad.sn < levelDetails.endSN) {
            let deltaPTS = fragPreviousLoad.deltaPTS;
            
            if (deltaPTS && deltaPTS > config.maxBufferHole && fragPreviousLoad.dropped && curSNIdx) {
              fragNextLoad = prevSnFrag;
            } else {
              fragNextLoad = nextSnFrag;              
            }
          } else {
            fragNextLoad = null;
          }
        } else if (fragNextLoad.backtracked) {
          if (nextSnFrag && nextSnFrag.backtracked) {
            fragNextLoad = nextSnFrag;
          } else {            
            fragNextLoad.dropped = 0;
            if (prevSnFrag) {
              fragNextLoad = prevSnFrag;
              fragNextLoad.backtracked = true;
            } else if (curSNIdx) {
              fragNextLoad = null;
            }
          }
        }
      }
    } else {
      console.log(fragNextLoad);
    }

    return fragNextLoad;
  }

  _loadKey (frag, levelDetails) {
    this.state = State.KEY_LOADING;
    this.hls.trigger(Events.KEY_LOADING, { frag });
  }  

  _checkFragmentChanged () {
    let fragPlayingCurrent; let currentTime; let video = this.media;
    if (video && video.readyState && video.seeking === false) {
      currentTime = video.currentTime;
      if (currentTime > this.lastCurrentTime) {
        this.lastCurrentTime = currentTime;
      }

      if (BufferHelper.isBuffered(video, currentTime)) {
        fragPlayingCurrent = this.getBufferedFrag(currentTime);
      } else if (BufferHelper.isBuffered(video, currentTime + 0.1)) {
        fragPlayingCurrent = this.getBufferedFrag(currentTime + 0.1);
      }
      if (fragPlayingCurrent) {
        let fragPlaying = fragPlayingCurrent;
        if (fragPlaying !== this.fragPlaying) {
          this.hls.trigger(Events.FRAG_CHANGED, { frag: fragPlaying });
          const fragPlayingLevel = fragPlaying.level;
          if (!this.fragPlaying || this.fragPlaying.level !== fragPlayingLevel) {
            this.hls.trigger(Events.LEVEL_SWITCHED, { level: fragPlayingLevel });
          }

          this.fragPlaying = fragPlaying;
        }
      }
    }
  }




  doFrame = () => {
    let frameTime = Math.round((1/60)*1000);
    this.tempFrameMS += frameTime;
    let tempFrame = Math.floor(this.tempFrameMS / 33);

    if(this.tempCurrentFrame < tempFrame) {
      this.tempCurrentFrame = tempFrame;
      this._doTickFrame();
    }

    if(this.requestAniFrameForFrame) {
      window.cancelAniFrame(this.frameTimer);
      this.frameTimer = window.requestAniFrame(this.doFrame);
    } else {
      window.cancelAniFrame(this.frameTimer);
    }
  }

  _doTickFrame() {
    const config = this.hls.config;
    const totalFrame = this.totalFrame - 1;
    const lastFrame = this.hls.lastBufferedFrame;

    if(!lastFrame) {
      this.tempFrameMS = 0;
      this.tempCurrentFrame = 0;
      this.requestAniFrameForFrame = false;      
      this._switchingGOP(30);
      this.startLoad(this.media.currentTime);
      return;
    }

    if(totalFrame > 0 && lastFrame.sn === totalFrame) {
      window.cancelAniFrame(this.frameTimer);
      this.requestAniFrameForFrame = false;
      return;
    }

    if(this.framePrevious === lastFrame) {
      return;
    }

    this.framePrevious = lastFrame;

    const restFrame = config.VIDEO_FPS - ((lastFrame.sn + 1) % config.VIDEO_FPS); // Check FPS
    if(restFrame === config.VIDEO_FPS) {
      this.tempFrameMS = 0;
      this.tempCurrentFrame = 0;
      this.requestAniFrameForFrame = false;

      if (this.liveStartSeq > -1) {
        // LIVE
        console.log('Current Live');
      } else {
        // VOD
        this.hls.removeLastBufferedFrame();
      }
      
      this._switchingGOP(30);
      this.startLoad(lastFrame.start + config.FRAME_DURATION);   
      return;
    } 

    //let level = this.hls.nextLoadLevel;
    //let level = 2;
    let level = this.hls.currentLevel;
    let levelInfo = this._levels[level];

    if(!levelInfo) {
      return;
    }

    this._fetchFrameInfo(lastFrame, level, levelInfo);
  }

  _fetchFrameInfo(lastFrame, level, levelInfo) {

    const config = this.hls.config;

    if(lastFrame && lastFrame.type === 'frame') {

      const nextFrameKey = {
        type: PlaylistLevelType.FRAME,
        channel: lastFrame.channel, 
        level: level,
        sn: lastFrame.sn + 1
      }

      const isHasNextFrame = this.fragmentTracker.hasFrame(nextFrameKey);
      if(isHasNextFrame) {
        const nextLoadedFrame = this.fragmentTracker.getCurrentFrame(nextFrameKey);
        if(nextLoadedFrame.body.payload) {
          const nextFragment = nextLoadedFrame.body;
          const nextPayload = nextLoadedFrame.body.payload;    

          this.hls.trigger(
            Events.BUFFER_FRAME_APPENDING, 
            {
              type: FrameType.CONTINUE,
              frag: nextFragment,
              payload: nextPayload
            }
          );
          return;
        }
      } else {
        const frameKey = {
          type: PlaylistLevelType.FRAME,
          channel: lastFrame.channel,
          level: level,
          sn: lastFrame.sn
        }

        const isHasFrame = this.fragmentTracker.hasFrame(frameKey);

        let emsgIndex = -1;    
        let nextFrameEmsg = null;
        let eventMessage = null;

        if(isHasFrame) {
          const loadedFrame = this.fragmentTracker.getCurrentFrame(frameKey);
          const loadedFrag = loadedFrame.body;    
          if(loadedFrag.emsg && loadedFrag.emsg.length > 0) {
            emsgIndex = 4;  // Next Frame Byterange
            nextFrameEmsg = loadedFrag.emsg[0];
            eventMessage = nextFrameEmsg ? nextFrameEmsg.messages[emsgIndex] : null;
            
          }
        } 

        if(eventMessage) {
          let byteRange = eventMessage.offset + '@' + eventMessage.size;
          console.log(`Frame byteRange: ${byteRange}`);
          if(this._fixedurl) {
            const levelName = levelInfo.height + config.ADAPT_NAME;

            let frag = new Fragment();
            frag.type = PlaylistLevelType.FRAME;
            frag.fixedurl = this._fixedurl;
            frag.url = this._fixedurl;
            frag.level = level;
            frag.channelName = lastFrame.channelName;
            frag.channel = lastFrame.channel;
            frag.levelName = levelName;
            frag.start = lastFrame.start + config.FRAME_DURATION;
            frag.timeOffset = config.FRAME_DURATION;
            frag.duration = config.FRAME_DURATION;
            frag.cc = 0;
            frag.sn = lastFrame.sn + 1;
            frag.relurl = lastFrame.relurl;
            frag.setByteRange(byteRange);

            this.frameCurrent = frag;
         
            const frameLoader = new FrameLoader(this.hls);
            frameLoader.onFrameFragLoading({
              type: FrameType.CONTINUE,
              frag, 
              index: this._currentChannel,
              gop: this._currentGop,
              height: levelInfo.height
            });
          }
        } else {
          ////console.log('##### EventMessage is nothing. #####');
          return;
        }
      }
    }
  }

  doFragmentSeek (startPosition) {
    switch (this.state) {
      case State.SWITCHING_CHANNEL:
      case State.SWITCHING_FRAME:
        break;
      case State.SEEK:
        this.fetchFragmentInfoForSeeking(startPosition);
        break;
      default:
        break;  
    }
  }

  

  immediateLevelSwitch () {
    if (!this.immediateSwitch) {
      this.immediateSwitch = true;
      let media = this.media; let previouslyPaused;
      if (media) {
        previouslyPaused = media.paused;
        if (!previouslyPaused) {
          media.pause();
        }
      } else {
        previouslyPaused = true;
      }
      this.previouslyPaused = previouslyPaused;
    }
    let fragCurrent = this.fragCurrent;
    if (fragCurrent && fragCurrent.loader) {
      fragCurrent.loader.abort();
    }

    this.fragCurrent = null;
    this.flushMainBuffer(0, Number.POSITIVE_INFINITY);
  }

  immediateLevelSwitchEnd () {
    const media = this.media;
    if (media && BufferHelper.getBuffered(media).length) {
      this.immediateSwitch = false;
      if (media.currentTime > 0 && BufferHelper.isBuffered(media, media.currentTime)) {
        media.currentTime -= 0.0001;
      }
      if (!this.previouslyPaused) {
        media.play();
      }
    }
  }

  nextLevelSwitch () {
    const media = this.media;

    if (media && media.readyState) {
      let fetchdelay;
      const fragPlayingCurrent = this.getBufferedFrag(media.currentTime);
      if (fragPlayingCurrent && fragPlayingCurrent.startPTS > 1) {        
        this.flushMainBuffer(0, fragPlayingCurrent.startPTS - 1);
      }

      if (!media.paused) {
        let nextLevelId = this.hls.nextLoadLevel; 
        let nextLevel = this._levels[nextLevelId]; 
        let fragLastKbps = this.fragLastKbps;

        if (fragLastKbps && this.fragCurrent) {
          fetchdelay = this.fragCurrent.duration * nextLevel.bitrate / (1000 * fragLastKbps) + 1;
        } else {
          fetchdelay = 0;
        }
      } else {
        fetchdelay = 0;
      }
      
      const bufferedFrag = this.getBufferedFrag(media.currentTime + fetchdelay);
      if (bufferedFrag) {
        const nextBufferedFrag = this.followingBufferedFrag(bufferedFrag);
        if (nextBufferedFrag) {
          let fragCurrent = this.fragCurrent;
          if (fragCurrent && fragCurrent.loader) {
            fragCurrent.loader.abort();
          }

          this.fragCurrent = null;
          
          const startPts = Math.max(bufferedFrag.endPTS, nextBufferedFrag.maxStartPTS + Math.min(this.config.maxFragLookUpTolerance, nextBufferedFrag.duration));
          this.flushMainBuffer(startPts, Number.POSITIVE_INFINITY);
        }
      }
    }
  }

  flushMainBuffer (startOffset, endOffset) {
    this.state = State.BUFFER_FLUSHING;
    let flushScope = { startOffset: startOffset, endOffset: endOffset };
    //if (this.altAudio) {
      flushScope.type = 'video';
    //}

    this.hls.trigger(Events.BUFFER_FLUSHING, flushScope);
  }

  onMediaAttached (data) {
    let media = this.media = this.mediaBuffer = data.media;

    this.onvseeking = this.onMediaSeeking.bind(this);
    this.onvseeked = this.onMediaSeeked.bind(this);
    this.onvended = this.onMediaEnded.bind(this);

    media.addEventListener('seeking', this.onvseeking);
    media.addEventListener('seeked', this.onvseeked);
    media.addEventListener('ended', this.onvended);

    let config = this.config;
    if (this._levels && this._levels.length > 0 && config.autoStartLoad) {
      this.hls.startLoad(config.startPosition);
    }

    this.gapController = new GapController(config, media, this.fragmentTracker, this.hls);
  }

  onMediaDetaching () {
    let media = this.media;
    if (media && media.ended) {
      this.startPosition = this.lastCurrentTime = 0;
    }

    let levels = this.levels;

    if (levels) {
      levels.forEach(level => {
        if (level.details) {
          level.details.fragments.forEach(fragment => {
            fragment.backtracked = undefined;
          });
        }
      });
    }

    if (media) {
      media.removeEventListener('seeking', this.onvseeking);
      media.removeEventListener('seeked', this.onvseeked);
      media.removeEventListener('ended', this.onvended);
      this.onvseeking = this.onvseeked = this.onvended = null;
    }

    this.removeAllFragments();
    this.media = this.mediaBuffer = null;
    this.loadedmetadata = false;
    this.stopLoad();
  }

  onMediaSeeked () {
    //this.tick();
  }

  onManifestLoading (data) {
    this.hls.trigger(Events.BUFFER_RESET);
    this.removeAllFragments();
    this.stalled = false;
    this.startPosition = this.lastCurrentTime = 0;
    this._url = data.url;
    this._fixedurl = data.fixedurl;
  }

  onManifestParsed (data) {
    //let aac = false; let heaac = false; let codec;
    // data.levels.forEach(level => {
    //   // detect if we have different kind of audio codecs used amongst playlists
    //   codec = level.audioCodec;
    //   if (codec) {
    //     if (codec.indexOf('mp4a.40.2') !== -1) {
    //       aac = true;
    //     }

    //     if (codec.indexOf('mp4a.40.5') !== -1) {
    //       heaac = true;
    //     }
    //   }
    // });

    // this.audioCodecSwitch = (aac && heaac);    

    // this.altAudio = data.altAudio;
    this._levels = this._levels_GOP = data.levels;
    this._levels_FRAME = data.frameLevels;
    this.startFragRequested = false;
    let config = this.config;

    if (config.autoStartLoad || this.forceStartLoad) {
      this.hls.startLoad(config.startPosition);
    }
  }

  onLevelLoaded (data) {
    const newDetails = data.details;
    const newLevelId = data.level;
    const lastLevel = this._levels[this.levelLastLoaded];
    const curLevel = this._levels[newLevelId];
    const duration = newDetails.totalduration;    

    let sliding = 0;

    if (newDetails.live || (curLevel.details && curLevel.details.live)) {
      let curDetails = curLevel.details;

      if (this.liveStartSeq < 0) {
        this.liveStartSeq = newDetails.startSN;
        this.hls.trigger(Events.MEDIA_LIVE_ON, {download: true});
      }
      
      this.liveCurrentSeq = newDetails.startSN;
      console.log(`%c Current Live Seq: ${this.liveCurrentSeq}`, 'color: orange');

      if (curDetails && newDetails.fragments.length > 0) {
        LevelHelper.mergeDetails(curDetails, newDetails);
        sliding = newDetails.fragments[0].start;
        this.liveSyncPosition = this.computeLivePosition(sliding, curDetails);

        if (newDetails.PTSKnown && Number.isFinite(sliding)) {
        } else if (!sliding) {
          alignStream(this.fragPrevious, lastLevel, newDetails);
        }
      } else {
        newDetails.PTSKnown = false;
        alignStream(this.fragPrevious, lastLevel, newDetails);
      }
    } else {      
      newDetails.PTSKnown = false;
      this.totalDuration = duration;
      this.totalFrame = Math.ceil(duration / this.config.FRAME_DURATION);
    }

    curLevel.details = newDetails;
    if(this._levels_FRAME && this._levels_FRAME.length > 0) {
      this._levels_FRAME[newLevelId].details = newDetails;
    }

    this.levelLastLoaded = newLevelId;
    this.hls.trigger(Events.LEVEL_UPDATED, { details: newDetails, level: newLevelId });

    if (this.startFragRequested === false) {
      if (this.startPosition === -1 || this.lastCurrentTime === -1) {

        let startTimeOffset = newDetails.startTimeOffset;

        if (Number.isFinite(startTimeOffset)) {
          if (startTimeOffset < 0) {
            startTimeOffset = sliding + duration + startTimeOffset;
          }
          this.startPosition = startTimeOffset;
        } else {
          /*
          if (newDetails.live) {
            this.startPosition = this.computeLivePosition(sliding, newDetails);
          } else {
            this.startPosition = 0;
          }
          */         
          
          this.startPosition = 0;
        }
        this.lastCurrentTime = this.startPosition;
      }
      this.nextLoadPosition = this.startPosition;
    }

    if (this.state === State.WAITING_LEVEL) {
      this.state = State.IDLE;
    }

    //this.tick();
  }

  onKeyLoaded () {
    if (this.state === State.KEY_LOADING) {
      this.state = State.IDLE;
      //this.tick();
    }
  }

  onFragLoaded (data) {
    const { fragCurrent, hls, _levels, media } = this;
    const loadedFrag = data.frag;
    const payload = data.payload;
    const fragType = data.fragType;

    if(fragType === 'CONTINUE') {

      if(!this.hls.videoIsPlaying && this._frameIsPlaying) {
        hls.trigger(Events.MEDIA_PAUSE, {});
      }

      if (this.state === State.FRAG_LOADING &&
        fragCurrent &&
        (loadedFrag.type === 'main' || loadedFrag.type === 'frame') &&
        loadedFrag.level === fragCurrent.level &&
        loadedFrag.sn === fragCurrent.sn) {

        const stats = data.stats;
        const currentLevel = _levels[fragCurrent.level];
        const details = currentLevel.details;

        this.stats = stats;

        if (loadedFrag.sn === 'initSegment') {
          this.state = State.IDLE;
          stats.tparsed = stats.tbuffered = window.performance.now();

          if(loadedFrag.type === 'frame') {
            details.initFrameSegment.data = payload;
          } else {
            details.initSegment.data = payload;
            hls.trigger(Events.FRAG_BUFFERED, { stats: stats, frag: fragCurrent, id: 'main' });
          }
          //this.tick();
        } else {
          this.state = State.PARSING;
          this.pendingBuffering = true;
          this.appended = false;

          const accurateTimeOffset = !(media && media.seeking) && (details.PTSKnown || !details.live);
          const initSegmentData = details.initSegment ? details.initSegment.data : [];
          //const audioCodec = this._getAudioCodec(currentLevel);

          const demuxer = this.demuxer = this.demuxer || new Demuxer(this.hls, 'main');
          demuxer.push(
            data.payload,
            initSegmentData,
            //audioCodec,
            '',
            currentLevel.videoCodec,
            fragCurrent,
            details.totalduration,
            accurateTimeOffset,
            fragType
          );
        }
      }
      this.fragLoadError = 0;
    } else {
      if (fragCurrent &&
        loadedFrag.type === 'main' &&
        loadedFrag.level === fragCurrent.level &&
        loadedFrag.sn === fragCurrent.sn) {
        
        const stats = data.stats;
        const currentLevel = _levels[fragCurrent.level];
        const details = currentLevel.details;

        this.state = State.PARSING;
        this.stats = stats;
        this.pendingBuffering = true;
        this.appended = false;

        const accurateTimeOffset = !(media && media.seeking) && (details.PTSKnown || !details.live);
        const initSegmentData = details.initSegment ? details.initSegment.data : [];
        //const audioCodec = this._getAudioCodec(currentLevel);

        const demuxer = this.demuxer = this.demuxer || new Demuxer(this.hls, 'main');
        demuxer.push(
          data.payload,
          initSegmentData,
          //audioCodec,
          '',
          currentLevel.videoCodec,
          fragCurrent,
          details.totalduration,
          accurateTimeOffset,
          fragType
        );
      }
    }
  }  

  onFragParsingInitSegment (data) {
    const fragCurrent = this.fragCurrent;
    const fragNew = data.frag;
    const fragType = data.fragType;

    if (fragCurrent &&
        data.id === 'main' &&
        fragNew.sn === fragCurrent.sn &&
        fragNew.level === fragCurrent.level &&
        this.state === State.PARSING) {

      let tracks = data.tracks; let trackName; let track;

      //this.audioOnly = tracks.audio && !tracks.video;

      // if (this.altAudio && !this.audioOnly) {
      //   delete tracks.audio;
      // }

      // include levelCodec in audio and video tracks
      // track = tracks.audio;
      // if (track) {
      //   let audioCodec = this.levels[this.level].audioCodec;
      //   let ua = navigator.userAgent.toLowerCase();
        
      //   if (audioCodec && this.audioCodecSwap) {
      //     if (audioCodec.indexOf('mp4a.40.5') !== -1) {
      //       audioCodec = 'mp4a.40.2';
      //     } else {
      //       audioCodec = 'mp4a.40.5';
      //     }
      //   }

      //   if (this.audioCodecSwitch) {
      //     if (track.metadata.channelCount !== 1 &&
      //       ua.indexOf('firefox') === -1) {
      //       audioCodec = 'mp4a.40.5';
      //     }
      //   }

      //   if (ua.indexOf('android') !== -1 && track.container !== 'audio/mpeg') { // Exclude mpeg audio
      //     audioCodec = 'mp4a.40.2';
      //   }
      //   track.levelCodec = audioCodec;
      //   track.id = data.id;
      // }
      track = tracks.video;
      if (track) {
        //track.levelCodec = this._levels[this.level].videoCodec;
        track.levelCodec = this._levels[fragNew.level].videoCodec;
        track.id = data.id;
      }
      this.hls.trigger(Events.BUFFER_CODECS, tracks);
      for (trackName in tracks) {
        track = tracks[trackName];
        let initSegment = track.initSegment;
        if (initSegment) {
          this.appended = true;
          this.pendingBuffering = true;
          this.hls.trigger(
            Events.BUFFER_APPENDING, 
            { 
              type: trackName, 
              data: initSegment, 
              parent: 'main', 
              content: 'initSegment' 
            }
          );
        }
      }

      if (fragType !== 'SEEKING') {
        //this.tick();
      }
    }
  }

  onFragParsingData (data) {
    const fragCurrent = this.fragCurrent;
    const fragNew = data.frag;
    const fragNewType = data.fragType;

    if (fragCurrent &&
        data.id === 'main' &&
        fragNew.sn === fragCurrent.sn &&
        fragNew.level === fragCurrent.level &&
        //!(data.type === 'audio' && this.altAudio) && // filter out main audio if audio track is loaded through audio stream controller
        this.state === State.PARSING) {

      //let level = this._levels[this.level];
      let level = this._levels[fragNew.level];
      let frag = fragCurrent;

      if (!Number.isFinite(data.endPTS)) {
        data.endPTS = data.startPTS + fragCurrent.duration;
        data.endDTS = data.startDTS + fragCurrent.duration;
      }

      // if (data.hasAudio === true) {
      //   frag.addElementaryStream(ElementaryStreamTypes.AUDIO);
      // }

      if (data.hasVideo === true) {
        frag.addElementaryStream(ElementaryStreamTypes.VIDEO);
      }

      if (data.type === 'video') {
        frag.dropped = data.dropped;
        if (frag.dropped) {
          if (!frag.backtracked) {
            const levelDetails = level.details;
            if (levelDetails && frag.sn !== levelDetails.startSN) {
              this.fragmentTracker.removeFragment(frag);
              frag.backtracked = true;
              this.nextLoadPosition = data.startPTS;
              this.state = State.IDLE;
              this.fragPrevious = frag;

              if (this.demuxer) {
                this.demuxer.destroy();
                this.demuxer = null;
              }
              //this.tick();
              return;
            }
          } 
        } else {
          frag.backtracked = false;
        }
      }

      let drift = LevelHelper.updateFragPTSDTS(level.details, frag, data.startPTS, data.endPTS, data.startDTS, data.endDTS);
      let hls = this.hls;
      
      //hls.trigger(Events.LEVEL_PTS_UPDATED, { details: level.details, level: this.level, drift: drift, type: data.type, start: data.startPTS, end: data.endPTS });
      hls.trigger(Events.LEVEL_PTS_UPDATED, { details: level.details, level: fragNew.level, drift: drift, type: data.type, start: data.startPTS, end: data.endPTS });
      [data.data1, data.data2].forEach(buffer => {
        if (buffer && buffer.length && this.state === State.PARSING) {
          this.appended = true;
          this.pendingBuffering = true;
          hls.trigger(
            Events.BUFFER_APPENDING, 
            { 
              type: data.type, 
              data: buffer, 
              parent: 'main', 
              content: 'data',
              url: fragNew.relurl,
              frag: fragNew,
              fragType: fragNewType
            }
          );
        }
      });
      
      //this.tick();
    }
  }

  onFragParsed (data) {
    const fragCurrent = this.fragCurrent;
    const fragNew = data.frag;
    if (fragCurrent &&
        data.id === 'main' &&
        fragNew.sn === fragCurrent.sn &&
        fragNew.level === fragCurrent.level &&
        this.state === State.PARSING) {
      this.stats.tparsed = window.performance.now();
      this.state = State.PARSED;
      this._checkAppendedParsed();
    }
  }

  // onAudioTrackSwitching (data) {
  //   const fromAltAudio = this.altAudio;
  //   const altAudio = !!data.url;
  //   const trackId = data.id;

  //   if (!altAudio) {
  //     if (this.mediaBuffer !== this.media) {
  //       this.mediaBuffer = this.media;
  //       let fragCurrent = this.fragCurrent;

  //       if (fragCurrent.loader) {
  //         fragCurrent.loader.abort();
  //       }
  //       this.fragCurrent = null;
  //       this.fragPrevious = null;

  //       if (this.demuxer) {
  //         this.demuxer.destroy();
  //         this.demuxer = null;
  //       }

  //       this.state = State.IDLE;
  //     }
  //     let hls = this.hls;
  //     if (fromAltAudio) {
  //       hls.trigger(Events.BUFFER_FLUSHING, {
  //         startOffset: 0,
  //         endOffset: Number.POSITIVE_INFINITY,
  //         type: 'audio'
  //       });
  //     }
  //     hls.trigger(Events.AUDIO_TRACK_SWITCHED, {
  //       id: trackId
  //     });
  //   }
  // }

  // onAudioTrackSwitched (data) {
  //   let trackId = data.id;
  //     let altAudio = !!this.hls.audioTracks[trackId].url;
  //   if (altAudio) {
  //     let videoBuffer = this.videoBuffer;
  //     if (videoBuffer && this.mediaBuffer !== videoBuffer) {
  //       this.mediaBuffer = videoBuffer;
  //     }
  //   }
  //   this.altAudio = altAudio;
  //   this.tick();
  // }

  onBufferCreated (data) {
    let tracks = data.tracks; let mediaTrack; let alternate = false;
    for (let type in tracks) {
      let track = tracks[type];
      if (track.id === 'main') {
        mediaTrack = track;
        if (type === 'video') {
          this.videoBuffer = tracks[type].buffer;
        }
      } else {
        alternate = true;
      }
    }
    if (alternate && mediaTrack) {
      this.mediaBuffer = mediaTrack.buffer;
    } else {
      this.mediaBuffer = this.media;
    }
  }

  onBufferAppended (data) {
    if (data.parent === 'main') {
      const state = this.state;
      if (state === State.PARSING || state === State.PARSED) {
        this.pendingBuffering = (data.pending > 0);
        this._checkAppendedParsed();
      }
    }

    // if (this.liveStartSeq > -1 && !this._liveInitStart) { 
    //   this._liveInitStart = true;
    //   this.currentTime = this.liveStartSeq * this.config.FRAGMENT_DURATION + 0.5;
    //   this.hls.trigger(Events.START_LIVE_ON_NOW, {});
    // }
  }

  onGopLevelSwitching (data) {
    switch(data.gop) {
      case 30:
        this._levels = this._levels_GOP;
        break;
      case 1:
        this._levels = this._levels_FRAME;
        break;
      default:
        break;
    }
  }

  _checkAppendedParsed () {
    if (this.state === State.PARSED && (!this.appended || !this.pendingBuffering)) {
      const frag = this.fragCurrent;

      if (frag) {
        this.fragPrevious = frag;
        const stats = this.stats;
        stats.tbuffered = window.performance.now();
        this.fragLastKbps = Math.round(8 * stats.total / (stats.tbuffered - stats.tfirst));
        this.hls.trigger(Events.FRAG_BUFFERED, { stats: stats, frag: frag, id: 'main' });
        this.state = State.IDLE;
      }

      if (this.loadedmetadata || this.startPosition <= 0) {
        //this.tick();
      }

      // Setting currenttime after seeking
      if(this.seekStartPosition > 0) {
        this.currentTime = this.seekStartPosition;
        this.seekStartPosition = 0;
      }
    }
  }

  onError (data) {
    let frag = data.frag || this.fragCurrent;
    if (frag && frag.type !== 'main') {
      return;
    }

    let mediaBuffered = !!this.media && BufferHelper.isBuffered(this.media, this.media.currentTime) && BufferHelper.isBuffered(this.media, this.media.currentTime + 0.5);

    switch (data.details) {
    case ErrorDetails.FRAG_LOAD_ERROR:
    case ErrorDetails.FRAG_LOAD_TIMEOUT:
    case ErrorDetails.KEY_LOAD_ERROR:
    case ErrorDetails.KEY_LOAD_TIMEOUT:
      if (!data.fatal) {
        if ((this.fragLoadError + 1) <= this.config.fragLoadingMaxRetry) {
          let delay = Math.min(Math.pow(2, this.fragLoadError) * this.config.fragLoadingRetryDelay, this.config.fragLoadingMaxRetryTimeout);
          this.retryDate = window.performance.now() + delay;
          
          if (!this.loadedmetadata) {
            this.startFragRequested = false;
            this.nextLoadPosition = this.startPosition;
          }

          this.fragLoadError++;
          this.state = State.FRAG_LOADING_WAITING_RETRY;
        } else {
          data.fatal = true;
          this.state = State.ERROR;
        }
      }
      break;
    case ErrorDetails.LEVEL_LOAD_ERROR:
    case ErrorDetails.LEVEL_LOAD_TIMEOUT:
      if (this.state !== State.ERROR) {
        if (data.fatal) {
          this.state = State.ERROR;
        } else {
          if (!data.levelRetry && this.state === State.WAITING_LEVEL) {
            this.state = State.IDLE;
          }
        }
      }
      break;
    case ErrorDetails.BUFFER_FULL_ERROR:
      if (data.parent === 'main' && (this.state === State.PARSING || this.state === State.PARSED)) {
        if (mediaBuffered) {
          this._reduceMaxBufferLength(this.config.maxBufferLength);
          this.state = State.IDLE;
        } else {
          this.fragCurrent = null;
          this.flushMainBuffer(0, Number.POSITIVE_INFINITY);
        }
      }
      break;
    default:
      break;
    }
  }

  _reduceMaxBufferLength (minLength) {
    let config = this.config;
    if (config.maxMaxBufferLength >= minLength) {
      config.maxMaxBufferLength /= 2;
      return true;
    }
    return false;
  }

  _checkBuffer () {
    const { media } = this;
    if (!media || media.readyState === 0) {
      return;
    }

    const mediaBuffer = this.mediaBuffer ? this.mediaBuffer : media;
    const buffered = BufferHelper.getBuffered(mediaBuffer);

    if (!this.loadedmetadata && buffered.length) {
      this.loadedmetadata = true;
      this._seekToStartPos();
    } else if (this.immediateSwitch) {
      this.immediateLevelSwitchEnd();
    } else {
      this.gapController.poll(this.lastCurrentTime, buffered);
    }
  }

  _switchingGOP (gop) {
    switch(gop) {
      case 1:
        this._currentGop = 1;
        this.hls.trigger(Events.GOP_LEVEL_SWITCHING, {gop: 1});        
        break;
      case 30:
        this._currentGop = 30;
        this.hls.trigger(Events.GOP_LEVEL_SWITCHING, {gop: 30});                
        break;
      default:
        break;
    }

    this.fragCurrent = null;
    //this.fragPrevious = null;
    this.frameCurrent = undefined;
    this.framePrevious = undefined;
    this._isAddInitFrameSegment = false;
  }

  onFragLoadEmergencyAborted () {
    this.state = State.IDLE;
    if (!this.loadedmetadata) {
      this.startFragRequested = false;
      this.nextLoadPosition = this.startPosition;
    }
    //this.tick();
  }

  onBufferFlushed () {
    const media = this.mediaBuffer ? this.mediaBuffer : this.media;
    if (media) {
      //const elementaryStreamType = this.audioOnly ? ElementaryStreamTypes.AUDIO : ElementaryStreamTypes.VIDEO;
      const elementaryStreamType = ElementaryStreamTypes.VIDEO;
      this.fragmentTracker.detectEvictedFragments(elementaryStreamType, BufferHelper.getBuffered(media));
    }
    this.fragPrevious = null;
    this.state = State.IDLE;
  }

  onLevelsUpdated (data) {
    this._levels = data.levels;
  }

  // swapAudioCodec () {
  //   this.audioCodecSwap = !this.audioCodecSwap;
  // }

  _seekToStartPos () {
    const { media } = this;
    const currentTime = media.currentTime;
    let startPosition = this.startPosition;

    if (currentTime !== startPosition && startPosition >= 0) {
      if (media.seeking) {
        return;
      }
      const buffered = BufferHelper.getBuffered(media);
      const bufferStart = buffered.length ? buffered.start(0) : 0;
      const delta = bufferStart - startPosition;
      if (delta > 0 && delta < this.config.maxBufferHole) {
        startPosition += delta;
        this.startPosition = startPosition;
      }
      media.currentTime = startPosition;
    }
  }

  // _getAudioCodec (currentLevel) {
  //   let audioCodec = this.config.defaultAudioCodec || currentLevel.audioCodec;
  //   if (this.audioCodecSwap) {
  //     logger.log('swapping playlist audio codec');
  //     if (audioCodec) {
  //       if (audioCodec.indexOf('mp4a.40.5') !== -1) {
  //         audioCodec = 'mp4a.40.2';
  //       } else {
  //         audioCodec = 'mp4a.40.5';
  //       }
  //     }
  //   }

  //   return audioCodec;
  // }

  getBufferedFrag (position) {
    return this.fragmentTracker.getBufferedFrag(position, PlaylistLevelType.MAIN);
  }

  followingBufferedFrag (frag) {
    if (frag) {
      return this.getBufferedFrag(frag.endPTS + 0.5);
    }
    return null;
  }  

  // ***********************************************************************************||
  // Channel Switching
  // ***********************************************************************************||

  onChannelSwitching (data) {    
    this.clearInterval();

    this._isVariantMedia = true;

    const { hls, config } = this;
    const { startChannel, channelDirection } = data;

    let curTime = this.currentTime; 
    let isPlaying = data.isPlaying;
    let lastBufferedFrame;

    if(this.hls.pausedBufferFrame) {
      lastBufferedFrame = this.hls.pausedBufferFrame;
      this.hls.pausedBufferFrame = null;
    } else {
       lastBufferedFrame = this.hls.lastBufferedFrame;
    }    

    //console.log(`Current MediaSource Duration: ${msDuration}`);
    //console.log(`Current Seek Time : ${curTime} `);
    //console.log(`Current Media Time: ${this.media.currentTime}`);

    let curFrameSn;
    if(lastBufferedFrame) {
      curFrameSn = lastBufferedFrame.sn;
    } else {
      curFrameSn = Math.floor(curTime / config.FRAME_DURATION);

      // if (this.liveStartSeq > -1) {
      //   curFrameSn += this.liveStartSeq * config.VIDEO_FPS;
      // }
    }
    
    let framePosition, reqChannel, reqFrameSn, reqFrameTime;
 
    try {
      if(this._currentGop !== 1) {
        this._switchingGOP(1);
      }

      //let level = 2;
      let level = hls.currentLevel;
      let levelInfo = this._levels[level];

      console.log(`%c Frame Current Level: ${level}`, 'color:red');

      if(!levelInfo) {
        return;
      }

      const levelDetails = levelInfo.details;
      if(!levelDetails) {
        return;
      }

      switch(channelDirection) {
        case config.DIRECT_RIGHT:
          reqChannel = startChannel + 1;
          break;
        case config.DIRECT_LEFT:
          reqChannel = startChannel - 1;
          break;
        default:
          return;
      }

      if(isPlaying) {
        reqFrameSn = curFrameSn + 1;  
        if (this.liveStartSeq < 0) {
          // VOD
          if(this.totalFrame > 0 && reqFrameSn >= this.totalFrame) {
            reqFrameSn = curFrameSn;
            this.state = State.ENDED;
            window.callByInIsPlaying(false);
            this.hls.videoIsPlaying = false;
            isPlaying = false;
          }
        }     
      } else {
        reqFrameSn = curFrameSn;
      }
      reqFrameTime = reqFrameSn * config.FRAME_DURATION;

      // const nextFrameKey = {
      //   type: PlaylistLevelType.FRAME,
      //   channel: reqChannel,
      //   level: level,
      //   sn: reqFrameSn
      // }

      //const isHasNextFrame = this.fragmentTracker.hasFrame(nextFrameKey);
      // const isHasNextFrame = false;
      // if(isHasNextFrame) {                
      //   const nextLoadedFrame = this.fragmentTracker.getCurrentFrame(nextFrameKey);
      //   if(nextLoadedFrame.body.payload) {
      //     const nextFragment = nextLoadedFrame.body;
      //     const nextPayload = nextLoadedFrame.body.payload;

      //     if(!this._isAddInitFrameSegment) {
      //       this.onAppendInitFrameSegment(nextFragment);
      //     }

      //     this.hls.trigger(
      //       Events.BUFFER_FRAME_APPENDING, 
      //       { 
      //         type: FrameType.TIMESLICE,             
      //         frag: nextFragment,
      //         payload: nextPayload,
      //         context: {
      //           direction: channelDirection,
      //           position: FramePosition.MIDDLE,
      //         }              
      //     });              
      //   }     

      // } else {

        const frameKey = {
          type: PlaylistLevelType.FRAME,
          channel: startChannel,
          level: level,
          sn: curFrameSn
        };

        const isHasFrame = this.fragmentTracker.hasFrame(frameKey);

        let emsgIndex = -1;    
        let switchingEmsg = null;
        let frameEmsg = null;
        let eventMessage = null;
        let relurl = null;

        if(isHasFrame) {
          const curFrame = this.fragmentTracker.getCurrentFrame(frameKey);
          const curFrag = curFrame.body;    
          if(curFrag.emsg && curFrag.emsg.length > 0) {
            if(isPlaying) {              
              switch(channelDirection) {
                case config.DIRECT_RIGHT:
                  emsgIndex = 7;
                  break;
                case config.DIRECT_LEFT:
                  emsgIndex = 2;
                  break;
                default:
                  return;
              }

              if(reqFrameSn % config.VIDEO_FPS === 0) {
                const second = parseInt(reqFrameSn / config.VIDEO_FPS);
                //const newRelurl = levelDetails.fragments[second];
                //relurl = this.getIFramePath() + newRelurl.relurl;
                relurl = this.getIFramePath() + second.toString().padStart(10, "0") + '.m4s';;
              } else {
                relurl = curFrag.relurl;
              }
            } else {
              switch(channelDirection) {
                case config.DIRECT_RIGHT:
                  emsgIndex = 6;
                  break;
                case config.DIRECT_LEFT:
                  emsgIndex = 1;
                  break;
                default:
                  return;
              }
              relurl = curFrag.relurl;             
            }

            if(emsgIndex > -1) {
              switchingEmsg = curFrag.emsg[0];
              eventMessage = switchingEmsg ? switchingEmsg.messages[emsgIndex] : null;
              framePosition = FramePosition.MIDDLE;              
            }
          }          
        } else {
          /*
          if (levelDetails.live) {
            curTime += (this._liveStartSeq * config.FRAGMENT_DURATION);
            //let segNum = curTime / config.FRAGMENT_DURATION;
            //console.log(segNum);
          }
          */

          if (!levelDetails.live) {
            const curFragment = this.fragmentTracker.getCurrentFragment(curTime, level); 
            let nextFrameIndex = reqFrameSn % config.VIDEO_FPS;

            if(curFragment && curFragment.emsg && curFragment.emsg.length > 0) { 
              if(isPlaying) {
                const nextTime = reqFrameTime;
                //const fragIndex = parseInt(nextTime / 1);
                const fragIndex = parseInt(nextTime / config.FRAGMENT_DURATION);
                const nextfragment = levelDetails.fragments[fragIndex];

                switch(channelDirection) {
                  case config.DIRECT_RIGHT:
                    if(curFragment.sn !== nextfragment.sn) {
                      emsgIndex = 8;
                    } else {
                      emsgIndex = 7; 
                    }
                    break;
                  case config.DIRECT_LEFT:
                    if(curFragment.sn !== nextfragment.sn) {
                      emsgIndex = 2;
                    } else {
                      emsgIndex = 1;
                    }
                    break;
                  default:
                    return;
                }

                if(curFragment.sn !== nextfragment.sn) {
                  relurl = this.getIFramePath() + nextfragment.relurl;
                } else {
                  relurl = this.getIFramePath() + curFragment.relurl;
                }
              } else {
                switch(channelDirection) {
                  case config.DIRECT_RIGHT:
                    emsgIndex = 7;
                    break;
                  case config.DIRECT_LEFT:
                    emsgIndex = 1;
                    break;
                  default:
                    return;
                }
                relurl = this.getIFramePath() + curFragment.relurl;
              }

              if(emsgIndex > -1) {
                switchingEmsg = curFragment.emsg[emsgIndex];
                frameEmsg = switchingEmsg ? switchingEmsg.messages[nextFrameIndex] : null; 

                if(frameEmsg && frameEmsg.messages) {
                  eventMessage = frameEmsg.messages;
                  framePosition = FramePosition.MIDDLE;

                  console.log(`Emsg Index: ${emsgIndex}`, switchingEmsg);
                  console.log(`Frame emsg: ${nextFrameIndex}`, frameEmsg);
                  console.log(`frame url: ${relurl}`);
                }
              }
            } 
          }
        }

        if(eventMessage) {         
          const byteRange = eventMessage.offset + '@' + eventMessage.size;
          const txtChannel = reqChannel.toString().padStart(3, "0");
          const levelName = levelInfo.height + config.ADAPT_NAME;

          console.log(`byteRange: ${byteRange} - ${eventMessage.offset + eventMessage.size}`);
      
          if(this._fixedurl) {
            let frag = new Fragment();
            frag.type = PlaylistLevelType.FRAME;
            frag.fixedurl = this._fixedurl;
            frag.url = this._fixedurl;
            frag.level = level;
            frag.channelName = txtChannel;
            frag.channel = reqChannel;
            frag.levelName = levelName;            
            frag.timeOffset = config.FRAME_DURATION;
            frag.duration = config.FRAME_DURATION;
            frag.cc = 0;
            frag.sn = reqFrameSn;
            frag.relurl = relurl;
            frag.setByteRange(byteRange);

            if (this.hls.mediaStartSeq > -1) {
              // LIVE
              //frag.start = (reqFrameSn - (this.hls.mediaStartSeq * config.VIDEO_FPS)) * config.FRAME_DURATION;
              frag.start = reqFrameTime;
              frag.liveStartTime = reqFrameTime;
            } else {
              // VOD
              frag.start = reqFrameTime;
            }

            this.frameCurrent = frag;
         
            const frameLoader = new FrameLoader(hls);
            frameLoader.onFrameFragLoading({
              type: FrameType.TIMESLICE,
              frag, 
              index: reqChannel,
              gop: this._currentGop,
              height: levelInfo.height,
              direction: channelDirection,
              position: framePosition,
            });
            return;
          }
        } else {
          const nextTime = reqFrameTime;
          const fragIndex = parseInt(nextTime / config.FRAGMENT_DURATION);
          const nextFrameIndex = reqFrameSn % config.VIDEO_FPS;

          let jsonRelurl, mediaRelurl;

          if (levelDetails.live) {
            jsonRelurl = fragIndex.toString().padStart(10, "0") + '.json';
            mediaRelurl = fragIndex.toString().padStart(10, "0") + '.m4s';
          } else {
            const fragment = levelDetails.fragments[fragIndex];
            jsonRelurl = fragment.relurl.substring(0, fragment.relurl.lastIndexOf(".")) + '.json';
            mediaRelurl = fragment.relurl;
          }  
          
          const url = this._fixedurl + reqChannel.toString().padStart(3, "0") + '/' + levelInfo.height + config.URL_PATH + this.getIFramePath() + jsonRelurl;
  
          const frameMetaLoader = new FrameMetaLoader(this.hls);
          frameMetaLoader.onFrameMetaLoading({
            type: FrameType.TIMESLICE,
            position: FramePosition.MIDDLE,
            url: url,
            second: fragIndex,
            channel: reqChannel,
            level: level,
            frame: nextFrameIndex,
            relurl: mediaRelurl,
            time: nextTime,
            sn: reqFrameSn,
            target: 'WEB'
          }); 
          
          return;

          /*
          const nextTime = reqFrameTime;
          //const fragIndex = parseInt(nextTime / 1);
          const fragIndex = parseInt(nextTime / config.FRAGMENT_DURATION);
          const fragment = levelDetails.fragments[fragIndex];
          const nextFrameIndex = reqFrameSn % config.VIDEO_FPS;
  
          let relurl = fragment.relurl;
          relurl = relurl.substring(0, relurl.lastIndexOf(".")) + '.json';
  
          const url = this._fixedurl + reqChannel.toString().padStart(3, "0") + '/' + levelInfo.height + config.URL_PATH + this.getIFramePath() + relurl;
  
          const frameMetaLoader = new FrameMetaLoader(this.hls);
          frameMetaLoader.onFrameMetaLoading({
            type: FrameType.TIMESLICE,
            position: FramePosition.MIDDLE,
            url: url,
            second: fragIndex,
            channel: reqChannel,
            level: level,
            frame: nextFrameIndex,
            relurl: fragment.relurl,
            time: nextTime,
            sn: reqFrameSn,
            target: 'WEB'
          }); 
          
          return;
          */
        }
      //}
    } catch(err) {
      console.log(err);
    }
  }

  onTimesliceFragLoaded (data) {
    ////console.log(`onTimesliceFragLoaded`);
    const context = data.context;
    const payload = data.payload;

    if(!this._isAddInitFrameSegment) {    
      this.onAppendInitFrameSegment(context.frag);
    }

    this.hls.trigger(
      Events.BUFFER_FRAME_APPENDING, 
      {
        type: context.type,
        frag: context.frag,
        payload: payload,
        context: context
      }
    );
  }

  onFrameFragLoaded(data) {
    const context = data.context;
    const payload = data.payload;    
    const frag = context.frag;
    const framePrevious = this.framePrevious;

    if(!framePrevious || frag.level !== framePrevious.level) {
      this.onAppendInitFrameSegment(frag);
    }    

    this.hls.trigger(
      Events.BUFFER_FRAME_APPENDING, 
      {
        type: context.type,
        frag: frag,
        payload: payload,
        context: context
      }
    );
  }

  onAppendInitFrameSegment (data) {
    const frame = data;
    const frameLevel = this._levels[frame.level];
    const initSegment = frameLevel.details.initFrameSegment; 
    
    // 채널변경 시 bitrate 체크가 필요한 경우 해제함.
    const tracks = {};
    tracks.video = { 
      id: 'main',
      container: 'video/mp4', 
      codec: frameLevel.videoCodec, 
      initSegment: initSegment.data,
      levelCodec: frameLevel.videoCodec,
      url: initSegment.relurl
    };
          
    let trackName, track;
    for (trackName in tracks) {
      track = tracks[trackName];
      let initSegment = track.initSegment;
      if (initSegment) {
        this.hls.trigger(
          Events.BUFFER_FRAME_APPENDING, 
          { 
            type: 'init', 
            payload: initSegment,             
          }
        );      
      }
    }    

    this._isAddInitFrameSegment = true;
  }

  onChannelContinuing (data) {
    this.clearInterval();

    const { hls, config } = this;
    const { channelDirection } = data;
    this.state = State.SWITCHING_CHANNEL;

    const lastBufferedFrame = this.hls.lastBufferedFrame;

    try {

      let level = hls.currentLevel;
      let levelInfo = this._levels[level];

      if(!levelInfo) {
        return;
      }

      const levelDetails = levelInfo.details;
      if(!levelDetails) {
        return;
      }

      const frameKey = {
        type: PlaylistLevelType.FRAME,
        channel: lastBufferedFrame.channel,
        level: level,
        sn: lastBufferedFrame.sn
      };

      const isHasFrame = this.fragmentTracker.hasFrame(frameKey);

      let reqFrameSn = lastBufferedFrame.sn + 1;
      let reqFrameTime = lastBufferedFrame.start + config.FRAME_DURATION;
      let emsgIndex = -1;    
      let continuingEmsg = null;
      let eventMessage = null;
      let relurl = null;

      if(isHasFrame) {
        const loadedFrame = this.fragmentTracker.getCurrentFrame(frameKey);
        const loadedFrag = loadedFrame.body;    
        if(loadedFrag.emsg && loadedFrag.emsg.length > 0) {
          emsgIndex = 4;

          if(reqFrameSn % config.VIDEO_FPS === 0) {
            const second = parseInt(reqFrameSn / config.VIDEO_FPS);
            const newRelurl = levelDetails.fragments[second];
            relurl = this.getIFramePath() + newRelurl.relurl;
          } else {
            relurl = loadedFrag.relurl;
          }

          continuingEmsg = loadedFrag.emsg[0];
          eventMessage = continuingEmsg ? continuingEmsg.messages[emsgIndex] : null;

          if(eventMessage) {
            let byteRange = eventMessage.offset + '@' + eventMessage.size;
            console.log(`Frame byteRange: ${byteRange}`);
            if(this._fixedurl) {
              const levelName = levelInfo.height + config.ADAPT_NAME;
  
              let frag = new Fragment();
              frag.type = PlaylistLevelType.FRAME;
              frag.fixedurl = this._fixedurl;
              frag.url = this._fixedurl;
              frag.level = level;
              frag.channelName = lastBufferedFrame.channelName;
              frag.channel = lastBufferedFrame.channel;
              frag.levelName = levelName;
              frag.timeOffset = config.FRAME_DURATION;
              frag.duration = config.FRAME_DURATION;
              frag.cc = 0;
              frag.sn = reqFrameSn;
              frag.relurl = relurl;
              frag.setByteRange(byteRange);

              if (this.hls.mediaStartSeq > -1) {
                // LIVE
                //frag.start = (reqFrameSn - (this.hls.mediaStartSeq * config.VIDEO_FPS)) * config.FRAME_DURATION;
                frag.start = reqFrameTime;
                frag.liveStartTime = reqFrameTime;
              } else {
                // VOD
                frag.start = reqFrameTime;
              }
  
              this.frameCurrent = frag;
           
              const frameLoader = new FrameLoader(this.hls);
              frameLoader.onFrameFragLoading({
                type: FrameType.TIMESLICE,
                frag, 
                index: this._currentChannel,
                gop: this._currentGop,
                height: levelInfo.height,
                direction: channelDirection,
                position: FramePosition.MIDDLE,
              });
            }
          } 
        }
      }

    } catch(err) {

    }
  }

  onFrameMetaLoaded (data) {
    const { config } = this;  
    const metaData = data.payload.offset_list;
    const context = data.context;

    if(metaData && metaData.length > 0) {
      const frameIndex = parseInt(context.frame);
      let start = 0, end = 0;
      if(frameIndex === 0 ) {
        start = 0;
        end = metaData[frameIndex];
      } else {
        start = metaData[frameIndex - 1];
        end = metaData[frameIndex];
      }

      const byteRange = start + '@' + (end - start);
      const levelInfo = this._levels[context.level];
      const txtChannel = context.channel.toString().padStart(3, "0");
      const levelName = levelInfo.height + config.ADAPT_NAME;

      if(this._fixedurl) {
        let frag = new Fragment();
        frag.type = PlaylistLevelType.FRAME;
        frag.fixedurl = this._fixedurl;
        frag.url = this._fixedurl;
        frag.level = context.level;
        frag.channelName = txtChannel;
        frag.channel = context.channel;
        frag.levelName = levelName;        
        frag.timeOffset = config.FRAME_DURATION;
        frag.duration = config.FRAME_DURATION;
        frag.cc = 0;
        frag.sn = context.sn;
        frag.relurl = this.getIFramePath() + context.relurl;
        frag.setByteRange(byteRange);

        if (this.hls.mediaStartSeq > -1) {
          // LIVE
          //frag.start = (context.sn - (this.hls.mediaStartSeq * config.VIDEO_FPS)) * config.FRAME_DURATION;
          frag.start = context.time;          
          frag.liveStartTime = context.time;
        } else {
          // VOD
          frag.start = context.time;
        }

        this.frameCurrent = frag;
        ////console.log(`[ Frame Request ]: ${frag.channelName} -  ${frag.sn} -  ${frag.relurl}`)
        const frameLoader = new FrameLoader(this.hls);
       
        frameLoader.onFrameFragLoading({
          type: context.type,
          frag, 
          index: data.channel,
          gop: this._currentGop,
          height: levelInfo.height,
          position: context.position,
          target: context.target,
        });
        return;
      }
    }    
  }

  // ***********************************************************************************||
  // Frame Switching
  // ***********************************************************************************||

  onFrameSwitching (data) {
    this.clearInterval();
    const { frameDirection } = data;
    let reqFrameTime = this.currentTime;
    let checkFrameTime;
    //let level = this.hls.nextLoadLevel;
    let level = this.hls.currentLevel;
 
    try {

      let levelInfo = this._levels[level];
      if(!levelInfo) {
        return;
      }

      const levelDetails = levelInfo.details;
      if(!levelDetails) {
        return;
      }

      switch(frameDirection) {
        case 'F':
          reqFrameTime += this.config.FRAME_DURATION;
          break;
        case 'B':
          reqFrameTime -= this.config.FRAME_DURATION;
          break;
        default:
          return;
      }

      if (levelDetails.live) {
        //checkFrameTime = reqFrameTime + (this.liveStartSeq * this.config.FRAGMENT_DURATION);
        checkFrameTime = reqFrameTime;
      } else {
        checkFrameTime = reqFrameTime;
      }
      
      const curFragment = this.fragmentTracker.getCurrentFragment(checkFrameTime, level);
      
      if(curFragment) {
        
        if (!this.mediaVariantState) {
          this.currentTime = reqFrameTime;
          window.callUpdatePlaybackTime(this.currentTime, this.hls.mediaStartSeq);
          return;
        }

        const remainTime = reqFrameTime % 1;
        
        let reqNextFrameTime = -1;
        switch(frameDirection) {
          case 'F':
            if(remainTime > 0.2) {
              reqNextFrameTime = reqFrameTime + 1;
            }
            break;
          case 'B':
            if(remainTime < 0.8) {
              reqNextFrameTime = reqFrameTime - 1;
            }
            break;
          default:
            return;
        }

        if(reqNextFrameTime !== -1 && this.state !== State.FRAG_SEEKING) {
          if (levelDetails.live) {
            //checkFrameTime = reqNextFrameTime + (this.liveStartSeq * this.config.FRAGMENT_DURATION);
            checkFrameTime = reqNextFrameTime;
          } else {
            checkFrameTime = reqNextFrameTime;
          }

          const nextFragment = this.fragmentTracker.getCurrentFragment(checkFrameTime, level);
          if(!nextFragment) {
            this.state = State.FRAG_SEEKING;
            this.fetchFragmentInfoForSeeking(reqNextFrameTime);
            return;
          }
        }

        if(remainTime < 0.033) {
          if(this.state === State.FRAG_SEEKING) {
            return; 
          }
          this.state = State.SWITCHING_FRAME;
          this.currentTime = reqFrameTime;
          window.callUpdatePlaybackTime(this.currentTime, this.hls.mediaStartSeq);
        } else {
          this.currentTime = reqFrameTime;
          window.callUpdatePlaybackTime(this.currentTime, this.hls.mediaStartSeq);
        }

      } else {
        if(this.state !== State.FRAG_SEEKING) {
          this.state = State.FRAG_SEEKING;
          this.fetchFragmentInfoForSeeking(reqFrameTime);
        }
      }
    } catch(err) {
      console.log(err);
    }
  }

  fetchFragmentInfoForSeeking (reqFrameTime) {

    //let level = this.hls.nextLoadLevel;
    //let level = 0;
    const { config } = this;
    let level = this.hls.currentLevel;
    let levelInfo = this._levels[level];

    if(!levelInfo) {
      return;
    }

    const levelDetails = levelInfo.details;
    if(!levelDetails) {
      return;
    }

    if (levelDetails.live) {
      //reqFrameTime += this.liveStartSeq * this.config.FRAGMENT_DURATION;
      const fragSn = parseInt(reqFrameTime / config.FRAGMENT_DURATION);
      //const fragStart = (fragSn - this.hls.liveStartSeq) * config.FRAGMENT_DURATION;
      const fragStart = fragSn * config.FRAGMENT_DURATION;
      const fragStartTime = fragSn * config.FRAGMENT_DURATION;
      const fragRelurl = fragSn.toString().padStart(10, "0") + '.m4s';

      if(this._fixedurl) {

        let frag = new Fragment();
        frag.type = PlaylistLevelType.FRAME;

        frag.type = PlaylistLevelType.MAIN;
        frag.fixedurl = this._fixedurl;
        frag.level = levelInfo.level;
        frag.channelName = this._currentChannel.toString().padStart(3, "0");
        frag.channel = this._currentChannel;
        frag.levelName = levelInfo.height + config.ADAPT_NAME;;          
        frag.timeOffset = config.FRAGMENT_DURATION;
        frag.duration = config.FRAGMENT_DURATION;
        frag.cc = 0;
        frag.sn = fragSn;
        frag.start = fragStart;
        frag.liveStartTime = fragStartTime;
        frag.liveEndTime = fragStartTime + config.FRAGMENT_DURATION;
        frag.relurl = fragRelurl;
        frag.url = frag.fixedurl + frag.channelName + '/' + levelInfo.height + config.URL_PATH + frag.relurl;

        this.fragCurrent = frag;

        this.hls.trigger(Events.FRAG_LOADING, { frag, type: SegmentType.SEEKING });
      }
    } else {
      const fragments = levelDetails.fragments;
      let startPosition = Math.floor(reqFrameTime / this.config.FRAGMENT_DURATION);
      let frag = fragments[startPosition];

      if(frag) {
        this.fragCurrent = frag;
        frag.channel = this._currentChannel;
        frag.channelName = this._currentChannel.toString().padStart(3, "0");
        frag.url = frag.fixedurl + frag.channelName + '/' + levelInfo.height + this.config.URL_PATH + frag.relurl;
        frag.autoLevel = this.hls.autoLevelEnabled;

        this.hls.trigger(Events.FRAG_LOADING, { frag, type: SegmentType.SEEKING });
      }
    }
  }

  onFragSeeked () {
    //this.state = State.SWITCHING_FRAME;
    if(this.videoIsPlaying) {
      this.hls.startLoad(this.seekStartPosition);
      if (this.liveStartSeq > -1) {
        // LIVE
        console.log('Current Live');
      } else {
        // VOD
      }
    }
    return;
  }

  removeAllFragments () {
    this.fragmentTracker.removeAllFragments();
  }

  removeAllFrames () {
    this.fragmentTracker.removeAllFrames();
  }

  removeLastBufferedFragment () {
    this.fragmentTracker.lastBufferedFragment = null;
  }

  removeLastBufferedFrame () {
    this.fragmentTracker.lastBufferedFrame = null;
  }

  getIFramePath () {
    let iFramePath = this.config.S3_IFRAME_PATH;
    if(this._isUseMediaStorage) {
      iFramePath = this.config.MS_IFRAME_PATH;
    } 
    return iFramePath
  }

  set state (nextState) {
    if (this.state !== nextState) {
      const previousState = this.state;
      this._state = nextState;
      this.hls.trigger(Events.STREAM_STATE_TRANSITION, { previousState, nextState });
    }
  }

  get state () {
    return this._state;
  }  

  get currentLevel () {
    let media = this.media;
    if (media) {
      const frag = this.getBufferedFrag(media.currentTime);
      if (frag) {
        return frag.level;
      }
    }
    return -1;
  }

  get nextBufferedFrag () {
    let media = this.media;
    if (media) {
      return this.followingBufferedFrag(this.getBufferedFrag(media.currentTime));
    } else {
      return null;
    }
  }  

  get nextLevel () {
    const frag = this.nextBufferedFrag;
    if (frag) {
      return frag.level;
    } else {
      return -1;
    }
  }

  get liveStartSeq () {
    return this._liveStartSeq;
  }

  set liveStartSeq (seq) {
    this._liveStartSeq = seq;
  }

  get liveCurrentSeq () {
    return this._liveCurrentSeq;
  }

  set liveCurrentSeq (seq) {
    this._liveCurrentSeq = seq;
  }

  get liveIsNow () {
    return this._isNow;
  }

  set liveIsNow (isValue) {
    this._isNow = isValue;
  }

  get liveSyncPosition () {
    return this._liveSyncPosition;
  }

  set liveSyncPosition (value) {
    this._liveSyncPosition = value;
  }

  get totalDuration () {
    return this._totalDuration;
  }

  set totalDuration (duration) {
    this._totalDuration = duration;
  }

  set currentTime (currentTime) {    
    let media = this.media;
    if (media) {
      media.currentTime = currentTime;
    }    
  }

  get currentTime () {    
    let media = this.media;
    if (media) {
      return media.currentTime;
    }
    return -1;
  }

  set playbackChannel (channel) {
    this._currentChannel = channel;
  }

  get playbackChannel() {
    return this._currentChannel;
  }

  get mediaVariantState () {
    return this._isVariantMedia;
  }

  set mediaVariantState (state) {
    this._isVariantMedia = state;
  }

  set addInitFrameSegment (state) {
    this._isAddInitFrameSegment = state;
  }

  get lastBufferedFragment() {
    return this.fragmentTracker.lastBufferedFragment;
  }

  get lastBufferedFrame() {
    return this.fragmentTracker.lastBufferedFrame;
  }

  set videoIsPlaying (state) {
    this._isPlaying = state;
  }

  get videoIsPlaying () {
    return this._isPlaying;
  }

  set videoIsPause (state) {
    this._isPause = state;
  }

  get videoIsPause () {
    return this._isPause;
  }

  set frameIsPlaying (state) {
    this._frameIsPlaying = state;
  }

  get frameIsPlaying () {
    return this._frameIsPlaying;
  }

  get totalFrame () {
    return this._totalFrame;
  }

  set totalFrame (frame) {
    this._totalFrame = frame;
  }

  set playlistDownload (state) {
    this._isPlaylistDownload = state;
  }

  get playlistDownload () {
    return this._isPlaylistDownload;
  }

  set seekStartPosition (position) {
    this._seekStartPosition = position;
  }

  get seekStartPosition() {
    return this._seekStartPosition;
  }

  get useMediaStorage () {
    return this._isUseMediaStorage;
  }

  set useMediaStorage (state) {
    this._isUseMediaStorage = state;
  }

  get startLiveOnNow() {
    return this._isStartLiveOnNow;
  }

  set startLiveOnNow (state) {
    this._isStartLiveOnNow = state;
  }

  get currentGOP () {
    return this._currentGop;
  }

  set currentGOP (gop) {
    this._currentGop = gop;
  }

  get pausedBufferFrame () {
    return this._pausedBufferFrame;
  }

  set pausedBufferFrame (buffer) {
    this._pausedBufferFrame = buffer;
  }
}

export default StreamController;
