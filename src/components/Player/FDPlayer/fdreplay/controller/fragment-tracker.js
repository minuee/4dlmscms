import EventHandler from '../event-handler';
import Events from '../events';
import EmsgParser from '../loader/emsg-parser';
import { FrameType, FramePosition } from './base-stream-controller';


export const FragmentState = {
  NOT_LOADED: 'NOT_LOADED',
  APPENDING: 'APPENDING',
  PARTIAL: 'PARTIAL',
  OK: 'OK'
};

export class FragmentTracker extends EventHandler {
  constructor (hls) {
    super(hls,
      Events.BUFFER_APPENDED,
      Events.FRAG_BUFFERED,
      Events.FRAG_LOADED,
      Events.FRAG_SEEKED,
      Events.BUFFER_FRAME_APPENDING,
    );

    this.bufferPadding = 0.02;

    this.fragments = Object.create(null);
    this.frames = Object.create(null);
    this.timeRanges = Object.create(null);

    this._lastBufferedFragment = null;
    this._lastBufferedFrame = null;

    this.config = hls.config;
  }

  get lastBufferedFragment () {
    return this._lastBufferedFragment;
  }

  set lastBufferedFragment (fragment) {
    this._lastBufferedFragment = fragment;
  }

  get lastBufferedFrame () {
    return this._lastBufferedFrame;
  }

  set lastBufferedFrame (frame) {
    this._lastBufferedFrame = frame;
  }

  destroy () {
    this.fragments = Object.create(null);
    this.timeRanges = Object.create(null);
    this.config = null;
    EventHandler.prototype.destroy.call(this);
    super.destroy();
  }

  getBufferedFrag (position, levelType) {
    const fragments = this.fragments;
    const bufferedFrags = Object.keys(fragments).filter(key => {
      const fragmentEntity = fragments[key];
      if (fragmentEntity.body.type !== levelType) {
        return false;
      }

      if (!fragmentEntity.buffered) {
        return false;
      }

      const frag = fragmentEntity.body;
      return frag.startPTS <= position && position <= frag.endPTS;
    });
    if (bufferedFrags.length === 0) {
      return null;
    } else {
      const bufferedFragKey = bufferedFrags.pop();
      return fragments[bufferedFragKey].body;
    }
  }

  detectEvictedFragments (elementaryStream, timeRange) {
    Object.keys(this.fragments).forEach(key => {
      const fragmentEntity = this.fragments[key];
      if (!fragmentEntity || !fragmentEntity.buffered) {
        return;
      }
      const esData = fragmentEntity.range[elementaryStream];
      if (!esData) {
        return;
      }
      const fragmentTimes = esData.time;
      for (let i = 0; i < fragmentTimes.length; i++) {
        const time = fragmentTimes[i];
        if (!this.isTimeBuffered(time.startPTS, time.endPTS, timeRange)) {
          this.removeFragment(fragmentEntity.body);
          break;
        }
      }
    });
  }

  detectPartialFragments (fragment) {
    if (fragment) {
      let fragKey = this.getFragmentKey(fragment);
      let fragmentEntity = this.fragments[fragKey];

      if (fragmentEntity) {
        fragmentEntity.buffered = true;
        this._lastBufferedFragment = fragment;

        Object.keys(this.timeRanges).forEach(elementaryStream => {
          if (fragment.hasElementaryStream(elementaryStream)) {
            let timeRange = this.timeRanges[elementaryStream];         
            fragmentEntity.range[elementaryStream] = this.getBufferedTimes(fragment.startPTS, fragment.endPTS, timeRange);
          }
        });
      }
    }
  }

  getBufferedTimes (startPTS, endPTS, timeRange) {
    let fragmentTimes = [];
    let startTime, endTime;
    let fragmentPartial = false;
    for (let i = 0; i < timeRange.length; i++) {
      startTime = timeRange.start(i) - this.bufferPadding;
      endTime = timeRange.end(i) + this.bufferPadding;
      if (startPTS >= startTime && endPTS <= endTime) {        
        fragmentTimes.push({
          startPTS: Math.max(startPTS, timeRange.start(i)),
          endPTS: Math.min(endPTS, timeRange.end(i))
        });
        break;
      } else if (startPTS < endTime && endPTS > startTime) {        
        fragmentTimes.push({
          startPTS: Math.max(startPTS, timeRange.start(i)),
          endPTS: Math.min(endPTS, timeRange.end(i))
        });
        fragmentPartial = true;
      } else if (endPTS <= startTime) {
        break;
      }
    }

    return {
      time: fragmentTimes,
      partial: fragmentPartial
    };
  }

  getFragmentKey (fragment) {
    //return `${fragment.type}_${fragment.level}_${fragment.urlId}_${fragment.sn}`;
    return `${fragment.type}_${fragment.channel}_${fragment.level}_${fragment.sn}`;
  }

  getFrameKey (frame) {
    return `${frame.type}_${frame.channel}_${frame.level}_${frame.sn}`;
  }

  getPartialFragment (time) {
    let timePadding, startTime, endTime;
    let bestFragment = null;
    let bestOverlap = 0;
    Object.keys(this.fragments).forEach(key => {
      const fragmentEntity = this.fragments[key];
      if (this.isPartial(fragmentEntity)) {
        startTime = fragmentEntity.body.startPTS - this.bufferPadding;
        endTime = fragmentEntity.body.endPTS + this.bufferPadding;
        if (time >= startTime && time <= endTime) {
          timePadding = Math.min(time - startTime, endTime - time);
          if (bestOverlap <= timePadding) {
            bestFragment = fragmentEntity.body;
            bestOverlap = timePadding;
          }
        }
      }
    });
    return bestFragment;
  }

  getCurrentFragment(time, level) {
    let bestFragment = null;
    let timePadding = 0;
    let startTime = 0;
    let endTime = 0;
    let bestOverlap = 0;
    const { bufferPadding, fragments } = this;
    Object.keys(fragments).forEach((key) => {
      const fragmentEntity = fragments[key];
      if (!fragmentEntity) {
        return;
      }

      if(fragmentEntity.body.level !== level) {
        return;
      }

      if (this.hls.mediaStartSeq > -1) {
        // LIVE
        startTime = fragmentEntity.body.liveStartTime - bufferPadding;
        endTime = fragmentEntity.body.liveEndTime + bufferPadding;
      } else {
        // VOD
        startTime = fragmentEntity.body.start - bufferPadding;
        endTime = fragmentEntity.body.end + bufferPadding;
      }      

      //startTime = fragmentEntity.body.start - bufferPadding;
      //endTime = fragmentEntity.body.end + bufferPadding;
      //startTime = fragmentEntity.body.start;
      //endTime = fragmentEntity.body.end;

      if (time >= startTime && time <= endTime) {
        // Use the fragment that has the most padding from start and end time
        timePadding = Math.min(time - startTime, endTime - time);
        if (bestOverlap <= timePadding) {
          bestFragment = fragmentEntity.body;
          bestOverlap = timePadding;
        }
      }      
    });
    return bestFragment;
  }

  getCurrentFrame(key) {
    const fragKey = this.getFrameKey(key);
    return this.frames[fragKey];
  }

  getState (fragment) {
    let fragKey = this.getFragmentKey(fragment);
    let fragmentEntity = this.fragments[fragKey];
    let state = FragmentState.NOT_LOADED;

    if (fragmentEntity !== undefined) {
      if (!fragmentEntity.buffered) {
        state = FragmentState.APPENDING;
      } else if (this.isPartial(fragmentEntity) === true) {
        state = FragmentState.PARTIAL;
      } else {
        state = FragmentState.OK;
      }
    }

    return state;
  }

  isPartial (fragmentEntity) {
    return fragmentEntity.buffered === true &&
      ((fragmentEntity.range.video !== undefined && fragmentEntity.range.video.partial === true) ||
        (fragmentEntity.range.audio !== undefined && fragmentEntity.range.audio.partial === true));
  }

  isTimeBuffered (startPTS, endPTS, timeRange) {
    let startTime, endTime;
    for (let i = 0; i < timeRange.length; i++) {
      startTime = timeRange.start(i) - this.bufferPadding;
      endTime = timeRange.end(i) + this.bufferPadding;
      if (startPTS >= startTime && endPTS <= endTime) {
        return true;
      }

      if (endPTS <= startTime) {
        return false;
      }
    }

    return false;
  }

  onFragLoaded (e) {
    const fragment = e.frag;
    const stats = e.stats;
    const payload = e.payload;

    if (!Number.isFinite(fragment.sn)) {
      return;
    }

    const segmentsEmsg = EmsgParser.parseSegment(payload);
    if(segmentsEmsg && segmentsEmsg.length > 0) {
      fragment.emsg = segmentsEmsg;
    } else {
      console.log(`%c [ ** Error ** ]: Fragment Emsg is NULL -> ${fragment.channelName} - ${fragment.sn} - ${fragment.relurl}`, 'color:blue');
    }

    this.fragments[this.getFragmentKey(fragment)] = {
      seq: fragment.sn,
      body: fragment,
      stats: stats,
      range: Object.create(null),
      buffered: false
    };
  }

  onBufferAppended (e) {
    this.timeRanges = e.timeRanges;
    Object.keys(this.timeRanges).forEach(elementaryStream => {
      let timeRange = this.timeRanges[elementaryStream];
      this.detectEvictedFragments(elementaryStream, timeRange);
    });
  }

  onBufferFrameAppending (data) {
    if(data.type !== 'init') {
      const fragment = data.frag;
      const payload = data.payload;
      const context = data.context;

      if (!Number.isFinite(fragment.sn)) {
        return;
      }

      try {
        if(!fragment.emsg) {
          ////console.log(`Frame Emsg is parsing!!!`);
          const segmentsEmsg = EmsgParser.parseFrame(payload);
          if(segmentsEmsg && segmentsEmsg.length > 0) {
            fragment.emsg = segmentsEmsg;
            fragment.payload = payload;
          } else {
            console.log(`!!!!! [ Error ]: Frame Emsg is NULL -> ${fragment.channelName} - ${fragment.sn} - ${fragment.relurl}`);
            return;
          }
        } 

        if(!this.hasFrame(fragment)){ 
          this.frames[this.getFrameKey(fragment)] = {
            body: fragment      
          };
        }

        this._lastBufferedFrame = fragment;   
        ////console.log(`[ Change PlaybackChannel ]: ${this.hls.playbackChannel} -----> ${fragment.channel}`);      
        this.hls.playbackChannel = fragment.channel;
        
        ////console.log(`[ Push Loaded Frame to Memory ]: ${fragment.channelName} - ${fragment.sn} - ${fragment.start} - ${fragment.relurl}`);      
        
        //let currentTime = this.hls.currentTime;
        switch(data.type) {
          case FrameType.TIMESLICE:
            if(context.position === FramePosition.START) {
              this.hls.trigger(Events.RESET_PREVIOUS_DATA);
            } else {
              if(this.hls.videoIsPlaying) {                
                //this.hls.currentTime = fragment.start;
                window.callUpdatePlaybackTime(fragment.start, this.hls.mediaStartSeq);
                console.log(`%c Timeslice Time: ${fragment.start}`, 'color:orange');
              }

              //this.hls.trigger(Events.TIMESLICE_EMSG_PARSED);
            }
            break;
          case FrameType.CONTINUE:            
            break;
          case FrameType.SEEK:
            break;
          case FrameType.TIMEMACHINE:
            if(context.position === FramePosition.START) {
              this.hls.trigger(Events.RESET_PREVIOUS_DATA);
            } else {
              this.hls.currentTime = fragment.start;
              window.callUpdatePlaybackTime(fragment.start, this.hls.mediaStartSeq);              
            }
            break;
          default:
            break;
        }

        //this.hls.state = State.IDLE;

      } catch(err) {
        //console.log('tracker_onFrameLoaded', err);
      }
    }
  }

  onFragBuffered (e) {
    this.detectPartialFragments(e.frag);
  }

  onFragSeeked (e) {
    this.detectPartialFragments(e.frag);
  }

  hasFragment (fragment) {
    const fragKey = this.getFragmentKey(fragment);
    return this.fragments[fragKey] !== undefined;
  }

  hasFrame (frame) {
    const fragKey = this.getFrameKey(frame);
    return this.frames[fragKey] !== undefined;
  }

  removeFragment (fragment) {
    let fragKey = this.getFragmentKey(fragment);
    delete this.fragments[fragKey];
  }

  removeAllFragments () {
    this.fragments = Object.create(null);
  }

  removeAllFrames () {
    this.frames = Object.create(null);
  }

  removeLastBufferedFragment () {
    this._lastBufferedFragment = null;    
  }

  removeLastBufferedFrame () {
    this._lastBufferedFrame = null;
  }
}
