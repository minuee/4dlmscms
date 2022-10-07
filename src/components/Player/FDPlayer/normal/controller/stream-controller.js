/*
 * Stream Controller
*/

import BinarySearch from '../utils/binary-search';
import { BufferHelper } from '../utils/buffer-helper';
import Demuxer from '../demux/demuxer';
import Event from '../events';
import { FragmentState } from './fragment-tracker';
import { ElementaryStreamTypes } from '../loader/fragment';
import { PlaylistLevelType } from '../types/loader';
import * as LevelHelper from './level-helper';
import TimeRanges from '../utils/time-ranges';
import { ErrorDetails } from '../errors';
import { alignStream } from '../utils/discontinuities';
import { findFragmentByPDT, findFragmentByPTS } from './fragment-finders';
import GapController, { MAX_START_GAP_JUMP } from './gap-controller';
import BaseStreamController, { State } from './base-stream-controller';

const TICK_INTERVAL = 100; // how often to tick in ms

class StreamController extends BaseStreamController {
  constructor (hls, fragmentTracker) {
    super(hls,
      Event.MEDIA_ATTACHED,
      Event.MEDIA_DETACHING,
      Event.MANIFEST_LOADING,
      Event.MANIFEST_PARSED,
      Event.LEVEL_LOADED,
      Event.LEVELS_UPDATED,
      Event.KEY_LOADED,
      Event.FRAG_LOADED,
      Event.FRAG_LOAD_EMERGENCY_ABORTED,
      Event.FRAG_PARSING_INIT_SEGMENT,
      Event.FRAG_PARSING_DATA,
      Event.FRAG_PARSED,
      Event.ERROR,
      Event.AUDIO_TRACK_SWITCHING,
      Event.AUDIO_TRACK_SWITCHED,
      Event.BUFFER_CREATED,
      Event.BUFFER_APPENDED,
      Event.BUFFER_FLUSHED);

    this.fragmentTracker = fragmentTracker;
    this.config = hls.config;
    this.audioCodecSwap = false;
    this._state = State.STOPPED;
    this.stallReported = false;
    this.gapController = null;
    this.altAudio = false;
    this.audioOnly = false;
  }

  startLoad (startPosition) {
    if (this.levels) {
      let lastCurrentTime = this.lastCurrentTime, hls = this.hls;
      this.stopLoad();
      this.setInterval(TICK_INTERVAL);
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

      this.state = State.IDLE;
      this.nextLoadPosition = this.startPosition = this.lastCurrentTime = startPosition;
      this.tick();
    } else {
      this.forceStartLoad = true;
      this.state = State.STOPPED;
    }
  }

  stopLoad () {
    this.forceStartLoad = false;
    super.stopLoad();
  }

  doTick () {
    switch (this.state) {
    case State.BUFFER_FLUSHING:
      this.fragLoadError = 0;
      break;
    case State.IDLE:
      this._doTickIdle();
      break;
    case State.WAITING_LEVEL:
      var details = this.levels[this.level]?.details;
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
    const hls = this.hls,
      config = hls.config,
      media = this.media;

    if (this.levelLastLoaded === undefined || (
      !media && (this.startFragRequested || !config.startFragPrefetch))) {
      return;
    }

    if (this.altAudio && this.audioOnly) {
      this.demuxer.frag = null;
      return;
    }

    let pos;
    if (this.loadedmetadata) {
      pos = media.currentTime;
    } else {
      pos = this.nextLoadPosition;
    }

    let level = hls.nextLoadLevel,
      levelInfo = this.levels[level];

    if (!levelInfo) {
      return;
    }

    let levelBitrate = levelInfo.bitrate,
      maxBufLen;

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

    const levelDetails = levelInfo.details;

    if (!levelDetails || (levelDetails.live && this.levelLastLoaded !== level)) {
      this.state = State.WAITING_LEVEL;
      return;
    }

    if (this._streamEnded(bufferInfo, levelDetails)) {
      const data = {};
      if (this.altAudio) {
        data.type = 'video';
      }

      this.hls.trigger(Event.BUFFER_EOS, data);
      this.state = State.ENDED;
      return;
    }

    this._fetchPayloadOrEos(pos, bufferInfo, levelDetails);
  }

  _fetchPayloadOrEos (pos, bufferInfo, levelDetails) {
    const fragPrevious = this.fragPrevious,
      fragments = levelDetails.fragments,
      fragLen = fragments.length;

    // empty playlist
    if (fragLen === 0) {
      return;
    }

    let start = fragments[0].start,
      end = fragments[fragLen - 1].start + fragments[fragLen - 1].duration,
      bufferEnd = bufferInfo.end,
      frag;

    if (levelDetails.initSegment && !levelDetails.initSegment.data) {
      frag = levelDetails.initSegment;
    } else {
      if (levelDetails.live) {
        let initialLiveManifestSize = this.config.initialLiveManifestSize;
        if (fragLen < initialLiveManifestSize) {
          return;
        }
        frag = this._ensureFragmentAtLivePoint(levelDetails, bufferEnd, start, end, fragPrevious, fragments);
        if (frag === null) {
          return;
        }
      } else {
        if (bufferEnd < start) {
          frag = fragments[0];
        }
      }
    }
    if (!frag) {
      frag = this._findFragment(start, fragPrevious, fragLen, fragments, bufferEnd, end, levelDetails);
    }

    if (frag) {
      if (frag.encrypted) {
        this._loadKey(frag, levelDetails);
      } else {
        this._loadFragment(frag, levelDetails, pos, bufferEnd);
      }
    }
  }

  _ensureFragmentAtLivePoint (levelDetails, bufferEnd, start, end, fragPrevious, fragments) {
    const config = this.hls.config, media = this.media;

    let frag;

    let maxLatency = Infinity;

    if (config.liveMaxLatencyDuration !== undefined) {
      maxLatency = config.liveMaxLatencyDuration;
    } else if (Number.isFinite(config.liveMaxLatencyDurationCount)) {
      maxLatency = config.liveMaxLatencyDurationCount * levelDetails.targetduration;
    }

    if (bufferEnd < Math.max(start - config.maxFragLookUpTolerance, end - maxLatency)) {
      let liveSyncPosition = this.liveSyncPosition = this.computeLivePosition(start, levelDetails);
      bufferEnd = liveSyncPosition;
      if (media && media.readyState && media.duration > liveSyncPosition && liveSyncPosition > media.currentTime) {
        console.warn(`buffer end: ${bufferEnd.toFixed(3)} is located too far from the end of live sliding playlist, reset currentTime to : ${liveSyncPosition.toFixed(3)}`);
        media.currentTime = liveSyncPosition;
      }

      this.nextLoadPosition = liveSyncPosition;
    }

    if (levelDetails.PTSKnown && bufferEnd > end && media && media.readyState) {
      return null;
    }

    if (this.startFragRequested && !levelDetails.PTSKnown) {

      if (fragPrevious) {
        if (levelDetails.hasProgramDateTime) {
          frag = findFragmentByPDT(fragments, fragPrevious.endProgramDateTime, config.maxFragLookUpTolerance);
        } else {
          const targetSN = fragPrevious.sn + 1;
          if (targetSN >= levelDetails.startSN && targetSN <= levelDetails.endSN) {
            const fragNext = fragments[targetSN - levelDetails.startSN];
            if (fragPrevious.cc === fragNext.cc) {
              frag = fragNext;
            }
          }

          if (!frag) {
            frag = BinarySearch.search(fragments, function (frag) {
              return fragPrevious.cc - frag.cc;
            });            
          }
        }
      }
    }

    return frag;
  }

  _findFragment (start, fragPreviousLoad, fragmentIndexRange, fragments, bufferEnd, end, levelDetails) {
    const config = this.hls.config;
    let fragNextLoad;

    if (bufferEnd < end) {
      const lookupTolerance = (bufferEnd > end - config.maxFragLookUpTolerance) ? 0 : config.maxFragLookUpTolerance;
      fragNextLoad = findFragmentByPTS(fragPreviousLoad, fragments, bufferEnd, lookupTolerance);
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
    }

    return fragNextLoad;
  }

  _loadKey (frag, levelDetails) {
    this.state = State.KEY_LOADING;
    this.hls.trigger(Event.KEY_LOADING, { frag });
  }

  _loadFragment (frag, levelDetails, pos, bufferEnd) {
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

      this.hls.trigger(Event.FRAG_LOADING, { frag });

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

  set state (nextState) {
    if (this.state !== nextState) {
      const previousState = this.state;
      this._state = nextState;
      this.hls.trigger(Event.STREAM_STATE_TRANSITION, { previousState, nextState });
    }
  }

  get state () {
    return this._state;
  }

  getBufferedFrag (position) {
    return this.fragmentTracker.getBufferedFrag(position, PlaylistLevelType.MAIN);
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

  followingBufferedFrag (frag) {
    if (frag) {
      return this.getBufferedFrag(frag.endPTS + 0.5);
    }
    return null;
  }

  get nextLevel () {
    const frag = this.nextBufferedFrag;
    if (frag) {
      return frag.level;
    } else {
      return -1;
    }
  }

  _checkFragmentChanged () {
    let fragPlayingCurrent, currentTime, video = this.media;
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
          this.hls.trigger(Event.FRAG_CHANGED, { frag: fragPlaying });
          const fragPlayingLevel = fragPlaying.level;
          if (!this.fragPlaying || this.fragPlaying.level !== fragPlayingLevel) {
            this.hls.trigger(Event.LEVEL_SWITCHED, { level: fragPlayingLevel });
          }

          this.fragPlaying = fragPlaying;
        }
      }
    }
  }

  immediateLevelSwitch () {
    //console.log('immediateLevelSwitch');
    if (!this.immediateSwitch) {
      this.immediateSwitch = true;
      let media = this.media, previouslyPaused;
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
        let nextLevelId = this.hls.nextLoadLevel, nextLevel = this.levels[nextLevelId], fragLastKbps = this.fragLastKbps;
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
    if (this.altAudio) {
      flushScope.type = 'video';
    }

    this.hls.trigger(Event.BUFFER_FLUSHING, flushScope);
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
    if (this.levels && config.autoStartLoad) {
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

    // remove video listeners
    if (media) {
      media.removeEventListener('seeking', this.onvseeking);
      media.removeEventListener('seeked', this.onvseeked);
      media.removeEventListener('ended', this.onvended);
      this.onvseeking = this.onvseeked = this.onvended = null;
    }

    this.fragmentTracker.removeAllFragments();
    this.media = this.mediaBuffer = null;
    this.loadedmetadata = false;
    this.stopLoad();
  }

  onMediaSeeked () {
    this.tick();
  }

  onManifestLoading () {
    this.hls.trigger(Event.BUFFER_RESET);
    this.fragmentTracker.removeAllFragments();
    this.stalled = false;
    this.startPosition = this.lastCurrentTime = 0;
  }

  onManifestParsed (data) {
    let aac = false, heaac = false, codec;
    data.levels.forEach(level => {
      codec = level.audioCodec;
      if (codec) {
        if (codec.indexOf('mp4a.40.2') !== -1) {
          aac = true;
        }

        if (codec.indexOf('mp4a.40.5') !== -1) {
          heaac = true;
        }
      }
    });
    this.audioCodecSwitch = (aac && heaac);    

    this.altAudio = data.altAudio;
    this.levels = data.levels;
    this.startFragRequested = false;
    let config = this.config;
    if (config.autoStartLoad || this.forceStartLoad) {
      this.hls.startLoad(config.startPosition);
    }
  }

  onLevelLoaded (data) {
    const newDetails = data.details;
    const newLevelId = data.level;
    const lastLevel = this.levels[this.levelLastLoaded];
    const curLevel = this.levels[newLevelId];
    const duration = newDetails.totalduration;
    let sliding = 0;

    if (newDetails.live || (curLevel.details && curLevel.details.live)) {
      let curDetails = curLevel.details;
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
    }
    // override level info
    curLevel.details = newDetails;
    this.levelLastLoaded = newLevelId;
    this.hls.trigger(Event.LEVEL_UPDATED, { details: newDetails, level: newLevelId });

    if (this.startFragRequested === false) {
      if (this.startPosition === -1 || this.lastCurrentTime === -1) {
        let startTimeOffset = newDetails.startTimeOffset;
        if (Number.isFinite(startTimeOffset)) {
          if (startTimeOffset < 0) {
            startTimeOffset = sliding + duration + startTimeOffset;
          }
          this.startPosition = startTimeOffset;
        } else {
          if (newDetails.live) {
            this.startPosition = this.computeLivePosition(sliding, newDetails);
          } else {
            this.startPosition = 0;
          }
        }
        this.lastCurrentTime = this.startPosition;
      }
      this.nextLoadPosition = this.startPosition;
    }

    if (this.state === State.WAITING_LEVEL) {
      this.state = State.IDLE;
    }

    this.tick();
  }

  onKeyLoaded () {
    if (this.state === State.KEY_LOADING) {
      this.state = State.IDLE;
      this.tick();
    }
  }

  onFragLoaded (data) {
    const { fragCurrent, hls, levels, media } = this;
    const fragLoaded = data.frag;
    if (this.state === State.FRAG_LOADING &&
        fragCurrent &&
        fragLoaded.type === 'main' &&
        fragLoaded.level === fragCurrent.level &&
        fragLoaded.sn === fragCurrent.sn) {
      const stats = data.stats;
      const currentLevel = levels[fragCurrent.level];
      const details = currentLevel.details;

      this.stats = stats;

      if (fragLoaded.sn === 'initSegment') {
        this.state = State.IDLE;
        stats.tparsed = stats.tbuffered = window.performance.now();
        details.initSegment.data = data.payload;
        hls.trigger(Event.FRAG_BUFFERED, { stats: stats, frag: fragCurrent, id: 'main' });
        this.tick();
      } else {
        this.state = State.PARSING;
        this.pendingBuffering = true;
        this.appended = false;

        const accurateTimeOffset = !(media && media.seeking) && (details.PTSKnown || !details.live);
        const initSegmentData = details.initSegment ? details.initSegment.data : [];
        const audioCodec = this._getAudioCodec(currentLevel);

        // transmux the MPEG-TS data to ISO-BMFF segments
        const demuxer = this.demuxer = this.demuxer || new Demuxer(this.hls, 'main');
        demuxer.push(
          data.payload,
          initSegmentData,
          audioCodec,
          currentLevel.videoCodec,
          fragCurrent,
          details.totalduration,
          accurateTimeOffset
        );
      }
    }
    this.fragLoadError = 0;
  }

  onFragParsingInitSegment (data) {
    const fragCurrent = this.fragCurrent;
    const fragNew = data.frag;

    if (fragCurrent &&
        data.id === 'main' &&
        fragNew.sn === fragCurrent.sn &&
        fragNew.level === fragCurrent.level &&
        this.state === State.PARSING) {
      let tracks = data.tracks, trackName, track;

      this.audioOnly = tracks.audio && !tracks.video;

      if (this.altAudio && !this.audioOnly) {
        delete tracks.audio;
      }

      track = tracks.audio;

      if (track) {
        let audioCodec = this.levels[this.level].audioCodec,
          ua = navigator.userAgent.toLowerCase();
        if (audioCodec && this.audioCodecSwap) {
          if (audioCodec.indexOf('mp4a.40.5') !== -1) {
            audioCodec = 'mp4a.40.2';
          } else {
            audioCodec = 'mp4a.40.5';
          }
        }

        if (this.audioCodecSwitch) {
          if (track.metadata.channelCount !== 1 && ua.indexOf('firefox') === -1) {
            audioCodec = 'mp4a.40.5';
          }
        }

        if (ua.indexOf('android') !== -1 && track.container !== 'audio/mpeg') { // Exclude mpeg audio
          audioCodec = 'mp4a.40.2';
        }
        track.levelCodec = audioCodec;
        track.id = data.id;
      }
      
      track = tracks.video;

      if (track) {
        track.levelCodec = this.levels[this.level].videoCodec;
        track.id = data.id;
      }

      this.hls.trigger(Event.BUFFER_CODECS, tracks);

      for (trackName in tracks) {
        track = tracks[trackName];
        let initSegment = track.initSegment;
        if (initSegment) {
          this.appended = true;
          this.pendingBuffering = true;
          this.hls.trigger(Event.BUFFER_APPENDING, { type: trackName, data: initSegment, parent: 'main', content: 'initSegment' });
        }
      }
      this.tick();
    }
  }

  onFragParsingData (data) {
    const fragCurrent = this.fragCurrent;
    const fragNew = data.frag;
    if (fragCurrent &&
        data.id === 'main' &&
        fragNew.sn === fragCurrent.sn &&
        fragNew.level === fragCurrent.level &&
        !(data.type === 'audio' && this.altAudio) && // filter out main audio if audio track is loaded through audio stream controller
        this.state === State.PARSING) {
      let level = this.levels[this.level],
        frag = fragCurrent;
      if (!Number.isFinite(data.endPTS)) {
        data.endPTS = data.startPTS + fragCurrent.duration;
        data.endDTS = data.startDTS + fragCurrent.duration;
      }

      if (data.hasAudio === true) {
        frag.addElementaryStream(ElementaryStreamTypes.AUDIO);
      }

      if (data.hasVideo === true) {
        frag.addElementaryStream(ElementaryStreamTypes.VIDEO);
      }

      if (data.type === 'video') {
        frag.dropped = data.dropped;
        if (frag.dropped) {
          if (!frag.backtracked) {
            const levelDetails = level.details;
            if (levelDetails && frag.sn === levelDetails.startSN) {
            } else {
              
              this.fragmentTracker.removeFragment(frag);
              frag.backtracked = true;
              this.nextLoadPosition = data.startPTS;
              this.state = State.IDLE;
              this.fragPrevious = frag;
              if (this.demuxer) {
                this.demuxer.destroy();
                this.demuxer = null;
              }
              this.tick();
              return;
            }
          } else {
            //console.log('Already backtracked on this fragment, appending with the gap', frag.sn);
          }
        } else {
          frag.backtracked = false;
        }
      }

      let drift = LevelHelper.updateFragPTSDTS(level.details, frag, data.startPTS, data.endPTS, data.startDTS, data.endDTS), hls = this.hls;
      hls.trigger(Event.LEVEL_PTS_UPDATED, { details: level.details, level: this.level, drift: drift, type: data.type, start: data.startPTS, end: data.endPTS });
      [data.data1, data.data2].forEach(buffer => {
        if (buffer && buffer.length && this.state === State.PARSING) {
          this.appended = true;
          this.pendingBuffering = true;
          hls.trigger(Event.BUFFER_APPENDING, { type: data.type, data: buffer, parent: 'main', content: 'data' });
        }
      });
      this.tick();
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

  onAudioTrackSwitching (data) {
    const fromAltAudio = this.altAudio;
    const altAudio = !!data.url;
    const trackId = data.id;

    if (!altAudio) {
      if (this.mediaBuffer !== this.media) {
        this.mediaBuffer = this.media;
        let fragCurrent = this.fragCurrent;

        if (fragCurrent.loader) {
          fragCurrent.loader.abort();
        }
        this.fragCurrent = null;
        this.fragPrevious = null;

        if (this.demuxer) {
          this.demuxer.destroy();
          this.demuxer = null;
        }
        this.state = State.IDLE;
      }

      let hls = this.hls;
      if (fromAltAudio) {
        hls.trigger(Event.BUFFER_FLUSHING, {
          startOffset: 0,
          endOffset: Number.POSITIVE_INFINITY,
          type: 'audio'
        });
      }
      hls.trigger(Event.AUDIO_TRACK_SWITCHED, {
        id: trackId
      });
    }
  }

  onAudioTrackSwitched (data) {
    let trackId = data.id,
      altAudio = !!this.hls.audioTracks[trackId].url;
    if (altAudio) {
      let videoBuffer = this.videoBuffer;
      if (videoBuffer && this.mediaBuffer !== videoBuffer) {
        this.mediaBuffer = videoBuffer;
      }
    }
    this.altAudio = altAudio;
    this.tick();
  }

  onBufferCreated (data) {
    let tracks = data.tracks, mediaTrack, alternate = false;
    for (let type in tracks) {
      let track = tracks[type];
      if (track.id === 'main') {
        mediaTrack = track;
        // keep video source buffer reference
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
        // check if all buffers have been appended
        this.pendingBuffering = (data.pending > 0);
        this._checkAppendedParsed();
      }
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
        this.hls.trigger(Event.FRAG_BUFFERED, { stats: stats, frag: frag, id: 'main' });
        this.state = State.IDLE;
      }

      if (this.loadedmetadata || this.startPosition <= 0) {
        this.tick();
      }
    }
  }

  onError (data) {
    let frag = data.frag || this.fragCurrent;
    if (frag && frag.type !== 'main') {
      return;
    }

    // 0.5 : tolerance needed as some browsers stalls playback before reaching buffered end
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
      // if in appending state
      if (data.parent === 'main' && (this.state === State.PARSING || this.state === State.PARSED)) {
        // reduce max buf len if current position is buffered
        if (mediaBuffered) {
          this._reduceMaxBufferLength(this.config.maxBufferLength);
          this.state = State.IDLE;
        } else {
          this.fragCurrent = null;
          // flush everything
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
      // reduce max buffer length as it might be too high. we do this to avoid loop flushing ...
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

  onFragLoadEmergencyAborted () {
    this.state = State.IDLE;
    if (!this.loadedmetadata) {
      this.startFragRequested = false;
      this.nextLoadPosition = this.startPosition;
    }
    this.tick();
  }

  onBufferFlushed () {    
    const media = this.mediaBuffer ? this.mediaBuffer : this.media;
    if (media) {
      const elementaryStreamType = this.audioOnly ? ElementaryStreamTypes.AUDIO : ElementaryStreamTypes.VIDEO;
      this.fragmentTracker.detectEvictedFragments(elementaryStreamType, BufferHelper.getBuffered(media));
    }
    // reset reference to frag
    this.fragPrevious = null;
    this.state = State.IDLE;
  }

  onLevelsUpdated (data) {
    this.levels = data.levels;
  }

  swapAudioCodec () {
    this.audioCodecSwap = !this.audioCodecSwap;
  }

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

  _getAudioCodec (currentLevel) {
    let audioCodec = this.config.defaultAudioCodec || currentLevel.audioCodec;
    if (this.audioCodecSwap) {
      if (audioCodec) {
        if (audioCodec.indexOf('mp4a.40.5') !== -1) {
          audioCodec = 'mp4a.40.2';
        } else {
          audioCodec = 'mp4a.40.5';
        }
      }
    }

    return audioCodec;
  }

  get liveSyncPosition () {
    return this._liveSyncPosition;
  }

  set liveSyncPosition (value) {
    this._liveSyncPosition = value;
  }
}
export default StreamController;
