import Events from '../events';
import EventHandler from '../event-handler';
import { BufferHelper } from '../utils/buffer-helper';
import { ErrorTypes, ErrorDetails } from '../errors';
import { getMediaSource } from '../utils/mediasource-helper';
import { SegmentType, FrameType } from './base-stream-controller';

import { TrackSet } from '../types/track';
import { BufferControllerConfig } from '../config';
import Fragment from '../loader/fragment';

// Add extension properties to SourceBuffers from the DOM API.
type ExtendedSourceBuffer = SourceBuffer & { // eslint-disable-line no-restricted-globals
  ended?: boolean
};

type SourceBufferName = 'video' | 'audio';
type SourceBuffers = Partial<Record<SourceBufferName, ExtendedSourceBuffer>>;

interface SourceBufferFlushRange {
  start: number;
  end: number;
  type: SourceBufferName
}

interface Segment {
  type: string;
  data: ArrayBuffer;
  parent: string;
  content: string;
  url: string;
  frag: Fragment;
  fragType: string;
}

interface Frame {
  type: string;
  data: ArrayBuffer;
  frag?: Fragment | undefined;
  frameType?: string | undefined;
  context?: any | undefined;
}

const MediaSource = getMediaSource();

class BufferController extends EventHandler {
  private config: BufferControllerConfig;

  private _msDuration: number | null = null;
  private _levelDuration: number | null = null;
  private _levelTargetDuration: number = 10;
  private _live: boolean | null = null;
  private _objectUrl: string | null = null;

  private _needsFlush: boolean = false;
  private _needsEos: boolean = false;

  private _isTest: boolean = false;
  private _bufferRangeReset: boolean = false;  
  private _bufferAllReset: boolean = false;
  private _bufferSegmentFrag: Fragment | undefined;
  private _bufferSegmentType: string | undefined;
  private _bufferFrame: boolean = false;
  private _bufferFrameFrag: Fragment | undefined;  
  private _bufferFrameType: string | undefined;
  private _bufferFrameContext: any;

  public audioTimestampOffset?: number;
  public bufferCodecEventsExpected: number = 0;

  private _bufferCodecEventsTotal: number = 0;

  public media: HTMLMediaElement | null = null;
  public mediaSource: MediaSource | null = null;

  public segments: Segment[] = [];
  public frames: Frame[] = [];
  public parent?: string;
  public appending: boolean = false;

  // counters
  public appended: number = 0;
  public appendError: number = 0;
  public flushBufferCounter: number = 0;

  public tracks: TrackSet = {};
  public pendingTracks: TrackSet = {};
  public sourceBuffer: SourceBuffers = {};
  public flushRange: SourceBufferFlushRange[] = [];
  
  constructor (hls: any) {
    super(hls,
      Events.MEDIA_ATTACHING,
      Events.MEDIA_DETACHING,
      Events.MANIFEST_PARSED,
      Events.BUFFER_RESET,
      Events.BUFFER_FRAME_APPENDING,
      Events.BUFFER_APPENDING,
      Events.BUFFER_CODECS,
      Events.BUFFER_EOS,
      Events.BUFFER_FLUSHING,
      Events.LEVEL_PTS_UPDATED,
      Events.LEVEL_UPDATED,      
    );

    this.config = hls.config;
  }

  destroy () {
    EventHandler.prototype.destroy.call(this);
  }

  onLevelPtsUpdated (data: { details, type: SourceBufferName, start: number }) {
    let type = data.type;
    let audioTrack = this.tracks.audio;

    if (type === 'audio' && audioTrack && audioTrack.container === 'audio/mpeg') { // Chrome audio mp3 track
      let audioBuffer = this.sourceBuffer.audio;
      if (!audioBuffer) {
        throw Error('Level PTS Updated and source buffer for audio uninitalized');
      }

      let delta = Math.abs(audioBuffer.timestampOffset - data.start);

      if (delta > 0.1) {
        let updating = audioBuffer.updating;

        try {
          audioBuffer.abort();
        } catch (err) {
        }

        if (!updating) {
          audioBuffer.timestampOffset = data.start;
        } else {
          this.audioTimestampOffset = data.start;
        }
      }
    }

    if (this.config.liveDurationInfinity) {
      this.updateSeekableRange(data.details);
    }
  }

  onManifestParsed (data: { altAudio: boolean, audio: boolean, video: boolean }) {
    // let codecEvents: number = 2;
    // if (data.audio && (!data.video || !data.altAudio)) {
    //   codecEvents = 1;
    // }
    //this.bufferCodecEventsExpected = this._bufferCodecEventsTotal = codecEvents;
    this.bufferCodecEventsExpected = this._bufferCodecEventsTotal = 1;
  }

  onMediaAttaching (data: { media: HTMLMediaElement }) {
    let media = this.media = data.media;
    if (media && MediaSource) {
      // setup the media source
      let ms = this.mediaSource = new MediaSource();
      // Media Source listeners
      ms.addEventListener('sourceopen', this._onMediaSourceOpen);
      ms.addEventListener('sourceended', this._onMediaSourceEnded);
      ms.addEventListener('sourceclose', this._onMediaSourceClose);
      media.src = window.URL.createObjectURL(ms);
      this._objectUrl = media.src;
    }
  }

  onMediaDetaching () {
    let ms = this.mediaSource;
    if (ms) {
      if (ms.readyState === 'open') {
        try {
          ms.endOfStream();
        } catch (err) {
        }
      }
      ms.removeEventListener('sourceopen', this._onMediaSourceOpen);
      ms.removeEventListener('sourceended', this._onMediaSourceEnded);
      ms.removeEventListener('sourceclose', this._onMediaSourceClose);

      if (this.media) {
        if (this._objectUrl) {
          window.URL.revokeObjectURL(this._objectUrl);
        }

        if (this.media.src === this._objectUrl) {
          this.media.removeAttribute('src');
          this.media.load();
        } 
      }

      this.mediaSource = null;
      this.media = null;
      this._objectUrl = null;
      this.bufferCodecEventsExpected = this._bufferCodecEventsTotal;
      this.pendingTracks = {};
      this.tracks = {};
      this.sourceBuffer = {};
      this.flushRange = [];
      this.segments = [];
      this.appended = 0;
    }

    this.hls.trigger(Events.MEDIA_DETACHED);
  }

  checkPendingTracks () {
    let { bufferCodecEventsExpected, pendingTracks } = this;
    const pendingTracksCount = Object.keys(pendingTracks).length;

    if ((pendingTracksCount && !bufferCodecEventsExpected) || pendingTracksCount === 2) {
      this.createSourceBuffers(pendingTracks);
      this.pendingTracks = {};
      this.doAppending();
    }
  }

  private _onMediaSourceOpen = () => {
    this.hls.trigger(Events.MEDIA_ATTACHED, { media: this.media });
    let mediaSource = this.mediaSource;
    if (mediaSource) {
      mediaSource.removeEventListener('sourceopen', this._onMediaSourceOpen);
    }
    this.checkPendingTracks();
  }

  private _onMediaSourceClose = () => {
    console.log('media source closed');
  }

  private _onMediaSourceEnded = () => {
    console.log('media source ended');
  }

  private _onSBUpdateEnd = () => {
    //console.log(`$$ Media State : ${this.media?.readyState}`);
    if(!this._bufferFrame) {

      if(this._bufferAllReset) {
        this.removeBufferAll();
        //this._bufferAllReset = false;
        //this.hls.trigger(Events.RESET_VIDEO_STATE);
        return;      
      }

      if(this._bufferRangeReset) {
        this._bufferRangeReset = false;
        this.hls.trigger(Events.BUFFER_REMOVE_RANGE, {isTest: this._isTest});
        return;
      }

      if (this._needsFlush) {
        this.doFlush();
      }

      if(this._needsEos) {
        this.checkEos();
      }

      ////console.log(`[ Appended Fragment ]: ***** Buffered ***** `);  
      if(this.media) {    
        console.log(`After Media duration: ${this.media.duration}`);
        ////console.log(`After Media Time: ${this.media.currentTime}`);
      }
      let parent = this.parent;
      let pending = this.segments.reduce((counter, segment) => (segment.parent === parent) ? counter++ : counter, 0);

      const timeRanges: Partial<Record<SourceBufferName, TimeRanges>> = {};
      const arrSb = this.sourceBuffer;
      for(let streamType in arrSb) {
        const sb = arrSb[streamType as SourceBufferName];
        if(sb) {
          if(sb.mode && sb.mode !== 'sequence') {
            sb.mode = 'sequence';
          }
          timeRanges[streamType as SourceBufferName] = BufferHelper.getBuffered(sb);
        }               
      }

      this.appending = false;

      if(this._bufferSegmentType === SegmentType.SEEKING) {
        const sb = this.sourceBuffer['video'];
        if(sb) {
          sb.timestampOffset = 0;
        }
        this.hls.trigger(Events.FRAG_SEEKED, { frag: this._bufferSegmentFrag });

        this._bufferSegmentType = undefined;
        this._bufferSegmentFrag = undefined;
        return;
      }
      
      this.hls.trigger(Events.BUFFER_APPENDED, { parent, pending, timeRanges });
      
      //this.doAppending();      
      if (!this._needsFlush) {
        this.doAppending();
      }

      this.updateMediaElementDuration();

      if (this.media && this.media.duration > 0 && this.hls.mediaStartSeq > -1 && !this.hls.startLiveOnNow) { 
        this.hls.startLiveOnNow = true;
        //this.media.currentTime = this.hls.mediaStartSeq * 1.001;
        this.media.currentTime = this.hls.liveCurrentSeq * 1.001;
        this.hls.trigger(Events.START_LIVE_ON_NOW, {});
      }

    } else {      
      
      const sourceBuffer = this.sourceBuffer;
      const sb = sourceBuffer['video'];
            
      if(sb) { 
        if(sb.mode && sb.mode !== 'sequence') {
          sb.mode = 'sequence';
        }

        if(this._bufferFrameFrag) {
          console.log(`[ Appended Frame]: ${this._bufferFrameFrag.channelName} - ${this._bufferFrameFrag.sn} - ${this._bufferFrameFrag.relurl}`);
        }

        if(!sb.updating){
          switch(this._bufferFrameType) {
            case FrameType.TIMESLICE:
              if (sb.buffered.length > 0) {  
                if(this.media && this._bufferFrameFrag) {                  
                  this.hls.trigger(Events.TIMESLICE_EMSG_PARSED);                    
                }
              }              
              break;
            case FrameType.TIMEMACHINE:              
              break;            
            case FrameType.SEEK:             
              break;
            case FrameType.CONTINUE:
              if(!this.hls.videoIsPlaying && this.hls.frameIsPlaying) {
                this.hls.trigger(Events.MEDIA_PAUSE, {});
              }
              break;
            default:
              break;
          }                
        }        
      }

      this.appending = false;

      if(this.frames && this.frames.length > 0) {
        this.updateMediaElementDuration();
        this.doFrameAppending();        
      } else {
        this._bufferFrame = false;
      }      
    }
  }

  private _onSBUpdateError = (event: Event) => {
    this.hls.trigger(Events.ERROR, { type: ErrorTypes.MEDIA_ERROR, details: ErrorDetails.BUFFER_APPENDING_ERROR, fatal: false });
  }

  onBufferReset () {
    const sourceBuffer = this.sourceBuffer;
    for (let type in sourceBuffer) {
      const sb = sourceBuffer[type];
      try {
        if (sb) {
          if (this.mediaSource) {
            this.mediaSource.removeSourceBuffer(sb);
          }
          sb.removeEventListener('updateend', this._onSBUpdateEnd);
          sb.removeEventListener('error', this._onSBUpdateError);
        }
      } catch (err) {
      }
    }
    this.sourceBuffer = {};
    this.flushRange = [];
    this.segments = [];
    this.appended = 0;
  }

  onBufferCodecs (tracks: TrackSet) {
    if (Object.keys(this.sourceBuffer).length) {
      return;
    }

    Object.keys(tracks).forEach(trackName => {
      this.pendingTracks[trackName] = tracks[trackName];
    });

    this.bufferCodecEventsExpected = Math.max(this.bufferCodecEventsExpected - 1, 0);
    if (this.mediaSource && this.mediaSource.readyState === 'open') {
      this.checkPendingTracks();
    }
  }

  createSourceBuffers (tracks: TrackSet) {
    const { sourceBuffer, mediaSource } = this;
    if (!mediaSource) {
      throw Error('createSourceBuffers called when mediaSource was null');
    }

    for (let trackName in tracks) {
      if (!sourceBuffer[trackName]) {
        let track = tracks[trackName as keyof TrackSet];
        if (!track) {
          throw Error(`source buffer exists for track ${trackName}, however track does not`);
        }

        let codec = track.levelCodec || track.codec;
        let mimeType = `${track.container};codecs=${codec}`;

        try {
          let sb = sourceBuffer[trackName] = mediaSource.addSourceBuffer(mimeType);
          sb.addEventListener('updateend', this._onSBUpdateEnd);
          sb.addEventListener('error', this._onSBUpdateError);
          this.tracks[trackName] = {
            buffer: sb,
            codec: codec,
            id: track.id,
            container: track.container,
            levelCodec: track.levelCodec
          };
        } catch (err) {
          this.hls.trigger(Events.ERROR, { type: ErrorTypes.MEDIA_ERROR, details: ErrorDetails.BUFFER_ADD_CODEC_ERROR, fatal: false, err: err, mimeType: mimeType });
        }
      }
    }
    this.hls.trigger(Events.BUFFER_CREATED, { tracks: this.tracks });
  }

  onBufferAppending (data: Segment) {
    if (!this._needsFlush) {
      if (!this.segments) {
        this.segments = [ data ];
      } else {
        this.segments.push(data);
      }

      this.doAppending();
    }
  }

  onBufferEos (data: { type?: SourceBufferName }) {
    for (const type in this.sourceBuffer) {
      if (!data.type || data.type === type) {
        const sb = this.sourceBuffer[type as SourceBufferName];
        if (sb && !sb.ended) {
          sb.ended = true;
        }
      }
    }

    this.checkEos();
  }

  checkEos () {
    const { sourceBuffer, mediaSource } = this;
    if (!mediaSource || mediaSource.readyState !== 'open') {
      this._needsEos = false;
      return;
    }

    for (let type in sourceBuffer) {
      const sb = sourceBuffer[type as SourceBufferName];
      if (!sb) continue;

      if (!sb.ended) {
        return;
      }

      if (sb.updating) {
        this._needsEos = true;
        return;
      }
    }

    try {
      mediaSource.endOfStream();
    } catch (e) {
    }
    this._needsEos = false;
  }

  onBufferFlushing (data: { startOffset: number, endOffset: number, type?: SourceBufferName }) {
    if (data.type) {
      this.flushRange.push({ start: data.startOffset, end: data.endOffset, type: data.type });
    } else {
      this.flushRange.push({ start: data.startOffset, end: data.endOffset, type: 'video' });
      this.flushRange.push({ start: data.startOffset, end: data.endOffset, type: 'audio' });
    }

    this.flushBufferCounter = 0;
    this.doFlush();
  }

  flushLiveBackBuffer () {
    if (!this._live) {
      return;
    }

    const liveBackBufferLength = this.config.liveBackBufferLength;
    if (!isFinite(liveBackBufferLength) || liveBackBufferLength < 0) {
      return;
    }

    if (!this.media) {
      return;
    }

    const currentTime = this.media.currentTime;
    const sourceBuffer = this.sourceBuffer;
    const bufferTypes = Object.keys(sourceBuffer);
    const targetBackBufferPosition = currentTime - Math.max(liveBackBufferLength, this._levelTargetDuration);

    for (let index = bufferTypes.length - 1; index >= 0; index--) {
      const bufferType = bufferTypes[index];
      const sb = sourceBuffer[bufferType as SourceBufferName];
      if (sb) {
        const buffered = BufferHelper.getBuffered(sb);
        if (buffered.length > 0 && targetBackBufferPosition > buffered.start(0)) {         
          if (this.removeBufferRange(bufferType, sb, 0, targetBackBufferPosition)) {
            this.hls.trigger(Events.LIVE_BACK_BUFFER_REACHED, { bufferEnd: targetBackBufferPosition });
          }
        }
      }
    }
  }

  onLevelUpdated ({ details }: { details: { totalduration: number, targetduration?: number, averagetargetduration?: number, live: boolean, fragments: any[] } }) {
    if (details.fragments.length > 0) {
      this._live = details.live;
      if (this._live) {
        //this._levelDuration = (this.hls.mediaStartSeq * this.hls.config.FRAGMENT_DURATION) + details.totalduration + details.fragments[0].start;      
        this._levelDuration = (this.hls.liveCurrentSeq * this.hls.config.FRAGMENT_DURATION) + details.totalduration;      
      } else {
        this._levelDuration = details.totalduration + details.fragments[0].start;
      }
      this._levelTargetDuration = details.averagetargetduration || details.targetduration || 10;
      
      //console.log(`%c LevelDuration: ${this._levelDuration}`, 'color:blue');
      this.updateMediaElementDuration();
      if (this.config.liveDurationInfinity) {
        this.updateSeekableRange(details);
      }
    }
  }

  updateMediaElementDuration () {
    let { config } = this;
    let duration: number;

    if (this._levelDuration === null ||
      !this.media ||
      !this.mediaSource ||
      !this.sourceBuffer ||
      this.media.readyState === 0 ||
      this.mediaSource.readyState !== 'open') {
      return;
    }

    for (let type in this.sourceBuffer) {
      const sb = this.sourceBuffer[type];
      if (sb && sb.updating === true) {
        return;
      }
    }

    duration = this.media.duration;

    if (this._msDuration === null) {
      this._msDuration = this.mediaSource.duration;
    }

    if (this._live === true && config.liveDurationInfinity) {
      //this._msDuration = this.mediaSource.duration = Infinity;
    } else if ((this._levelDuration > this._msDuration && this._levelDuration > duration) || !Number.isFinite(duration)) {
      this._msDuration = this.mediaSource.duration = this._levelDuration;
    }
  }

  updateSeekableRange (levelDetails) {
    const mediaSource = this.mediaSource;
    const fragments = levelDetails.fragments;
    const len = fragments.length;
    if (len && mediaSource?.setLiveSeekableRange) {
      const start = fragments[0]?.start;
      const end = fragments[len - 1].start + fragments[len - 1].duration;
      mediaSource.setLiveSeekableRange(start, end);
    }
  }

  doFlush () {
    while (this.flushRange.length) {
      let range = this.flushRange[0];
      if (this.flushBuffer(range.start, range.end, range.type)) {
        this.flushRange.shift();
        this.flushBufferCounter = 0;
      } else {
        this._needsFlush = true;
        return;
      }
    }
    if (this.flushRange.length === 0) {
      this._needsFlush = false;

      let appended = 0;
      let sourceBuffer = this.sourceBuffer;
      for (let type in sourceBuffer) {
        const sb = sourceBuffer[type];
        if (sb) {
          appended += BufferHelper.getBuffered(sb).length;
        }
      }
      this.appended = appended;
      this.hls.trigger(Events.BUFFER_FLUSHED);
    }
  }

  doAppending () {
    let { config, hls, segments, sourceBuffer } = this;

    if (!Object.keys(sourceBuffer).length) {
      return;
    }

    if (!this.media || this.media.error) {
      this.segments = [];
      return;
    }

    if (this.appending) {
      return;
    }

    const segment = segments.shift();
    if (!segment) { 
      return;
    }

    try {
      const sb = sourceBuffer[segment.type];

      if(sb && sb.mode && sb.mode !== 'sequence') {
        sb.mode = 'sequence';
      }

      if (!sb) {
        this._onSBUpdateEnd();
        return;
      }

      if (sb.updating) {
        segments.unshift(segment);
        return;
      }

      if(segment.content !== 'initSegment') {
        sb.timestampOffset = segment.frag.start;
        this._bufferSegmentType = segment.fragType;
        this._bufferSegmentFrag = segment.frag;     
      }

      if(this.media) {    
        console.log(`Before Media duration: ${this.media.duration}`);
        console.log(`Before Media Time: ${this.media.currentTime}`);
      }

      sb.ended = false;
      this.parent = segment.parent;
      sb.appendBuffer(segment.data);      

      this.appendError = 0;
      this.appended++;
      this.appending = true;

      if(segment.content !== 'initSegment') {
        console.log(`%c [ Appending Segment ]: ${segment.frag.channelName} - ${segment.frag.sn} - ${segment.url} `, 'color:green');
      } else {
        console.log(`%c [ Appending Segment ]: Init Segment - ${segment.url}`, 'color:red');
      }
      
    } catch (err) {
      segments.unshift(segment);
      let event = { type: ErrorTypes.MEDIA_ERROR, parent: segment.parent, details: '', fatal: false };
      if (err.code === 22) {
        this.segments = [];
        event.details = ErrorDetails.BUFFER_FULL_ERROR;
      } else {
        this.appendError++;
        event.details = ErrorDetails.BUFFER_APPEND_ERROR;
        if (this.appendError > config.appendErrorMaxRetry) {
          this.segments = [];
          event.fatal = true;
        }
      }
      hls.trigger(Events.ERROR, event);
    }
  }

  flushBuffer (startOffset: number, endOffset: number, sbType: SourceBufferName): boolean {
    const sourceBuffer = this.sourceBuffer;
    if (!Object.keys(sourceBuffer).length) {
      return true;
    }

    if (this.flushBufferCounter >= this.appended) {
      return true;
    }

    const sb = sourceBuffer[sbType];
    if (sb) {
      sb.ended = false;
      if (!sb.updating) {
        if (this.removeBufferRange(sbType, sb, startOffset, endOffset)) {
          this.flushBufferCounter++;
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  }


  removeBufferRange (type: string, sb: ExtendedSourceBuffer, startOffset: number, endOffset: number): boolean {
    try {
      const buffered = BufferHelper.getBuffered(sb);
      for (let i = 0; i < buffered.length; i++) {
        let bufStart = buffered.start(i);
        let bufEnd = buffered.end(i);
        let removeStart = Math.max(bufStart, startOffset);
        let removeEnd = Math.min(bufEnd, endOffset);

        if (Math.min(removeEnd, bufEnd) - removeStart > 0.5) {
          sb.remove(removeStart, removeEnd);
          return true;
        }
      }
    } catch (error) {
    }

    return false;
  }

  removeBufferStartToAll (startPos: number, isTest: boolean): boolean {
    const sourceBuffer = this.sourceBuffer;
    const sb = sourceBuffer['video'];

    try {
      if(sb && !sb.updating) {
        const buffered = BufferHelper.getBuffered(sb);
        for (let i = 0; i < buffered.length; i++) {
          let bufStart = buffered.start(i);
          let removeEnd = buffered.end(i);
          let removeStart = Math.max(bufStart, startPos);

          if (removeEnd - removeStart > 0.5) {
            sb.remove(removeStart, removeEnd);
            this._bufferRangeReset = true;
            this._isTest = isTest;
            return true;
          }
        }

        if(!this._bufferRangeReset) {
          this.hls.trigger(Events.BUFFER_REMOVE_RANGE, {isTest});
        }
        return true;
      }
    } catch (error) {
      console.log('removeBufferRange failed', error);
    }
    return false;
  }

  onBufferFrameAppending(data: any) { 
    if(data.type === 'init') {
      this.frames.push(
        {
          type: 'video',
          data: data.payload,           
          frameType: data.type,                     
        }
      );
    } else { 
      //console.log(`@@@ Frame Array Before Count: ${this.frames.length}`);
      //console.log(`@@@ Push Frame Data: ${data.frag.channelName} -- ${data.frag.sn}`) 
      this.frames.push(
        {
          type: 'video',
          data: data.payload, 
          frag: data.frag,
          frameType: data.type,
          context: data.context            
        }
      );
      //////console.log(`@@@ Frame Array after Count: ${this.frames.length}`);
    }

    this.doFrameAppending();   
  }

  doFrameAppending() {
    let { config, hls, frames, sourceBuffer } = this;
    
    if (!Object.keys(sourceBuffer).length) {
      return;
    }

    if (!this.media || this.media.error) {
      this.frames = [];
      return;
    }

    if (this.appending) {
      return;
    }
    
    const frame = frames.shift();
    if(!frame) {
      return;
    }

    try {
      const sb = sourceBuffer[frame.type];

      if(sb && sb.mode && sb.mode !== 'sequence') {
        sb.mode = 'sequence';
      }
      
      if(!sb) {
        this._onSBUpdateEnd();
        return;
      }

      if(sb.updating) {
        frames.unshift(frame);
        return;
      }

      let msDuration = sb.buffered.end(0);
      console.log(`media source duration: ${msDuration}`);

      if(hls.videoIsPlaying) {
        if(frame.frag) {
          sb.timestampOffset = frame.frag.start;
          this.media.currentTime = frame.frag.start - 0.01;
          console.log(`media currentTime: ${this.media.currentTime}`);
        }
      } else  {
        if(frame.frag) {
          switch(frame.frameType) { 
            case FrameType.TIMESLICE:
            case FrameType.TIMEMACHINE:                           
              let targetTime = msDuration - (frame.frag.timeOffset);
              sb.timestampOffset = targetTime + 0.00001;
              this.media.currentTime = targetTime + 0.000005;
              console.log(`media currentTime: ${this.media.currentTime}`);
              break;
            case FrameType.CONTINUE:
            case FrameType.SEEK:
              sb.timestampOffset = frame.frag.start;
              break;
            default:
              break;
          }          
        }
      }      

      sb.ended = false;      
      sb.appendBuffer(frame.data);

      this.appendError = 0;
      this.appending = true;

      this._bufferFrameType = frame.frameType;
      this._bufferFrame = true; 

      if(frame.frameType !== 'init') {
        this._bufferFrameFrag = frame.frag;           
        this._bufferFrameContext = frame.context;
        if(frame.frag) {
          console.log(`[ Appending Frame]: ${frame.frag.channelName} - ${frame.frag.sn} - ${frame.frag.relurl}`);
        }
      } else {
        console.log(`%c [ Appending Frame ]: Init Frame`, 'color:green');
      }

    } catch(err) {
      frames.unshift(frame);
      let event = { type: ErrorTypes.MEDIA_ERROR, details: '', fatal: false };
      if (err.code === 22) {
        this.segments = [];
        event.details = ErrorDetails.BUFFER_FULL_ERROR;
      } else {
        this.appendError++;
        event.details = ErrorDetails.BUFFER_APPEND_ERROR;

        if (this.appendError > config.appendErrorMaxRetry) {
          this.frames = [];
          event.fatal = true;
        }
      }
      hls.trigger(Events.ERROR, event);
    }
  }

  removeBufferAll () {    
    const sourceBuffer = this.sourceBuffer;
    const bufferTypes = Object.keys(sourceBuffer);

    for (let index = bufferTypes.length - 1; index >= 0; index--) {
      const bufferType = bufferTypes[index];
      const sb = sourceBuffer[bufferType as SourceBufferName];
      if (sb) {
        const buffered = BufferHelper.getBuffered(sb);
        if (buffered.length > 0) {
          for(let i = 0; i < buffered.length; i++) {
            let bufStart = buffered.start(i);
            let bufEnd = buffered.end(i);
            if(!sb.updating) {
              sb.remove(bufStart, bufEnd);
              this._bufferAllReset = true;
              return;
            }
          }
        }
      }
    }
    
    if (this._bufferAllReset) {
      this._bufferAllReset = false;
      this.hls.trigger(Events.RESET_VIDEO_STATE);
    }
  }
}

export default BufferController;
