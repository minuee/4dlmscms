import TaskLoop from '../task-loop';
import { FragmentState } from './fragment-tracker';
import { BufferHelper } from '../utils/buffer-helper';

export const State = {
  STOPPED: 'STOPPED',
  STARTING: 'STARTING',
  IDLE: 'IDLE',
  PAUSED: 'PAUSED',
  SEEK: 'SEEK',
  KEY_LOADING: 'KEY_LOADING',
  FRAG_LOADING: 'FRAG_LOADING',
  FRAG_LOADING_WAITING_RETRY: 'FRAG_LOADING_WAITING_RETRY',
  WAITING_TRACK: 'WAITING_TRACK',
  PARSING: 'PARSING',
  PARSED: 'PARSED',
  BUFFER_FLUSHING: 'BUFFER_FLUSHING',
  ENDED: 'ENDED',
  ERROR: 'ERROR',
  WAITING_INIT_PTS: 'WAITING_INIT_PTS',
  WAITING_LEVEL: 'WAITING_LEVEL',
  SWITCHING: 'SWITCHING',
  SWITCHING_CHANNEL: 'SWITCHING_CHANNEL',
  SWITCHING_FRAME: 'SWITCHING_FRAME',
  SWITCHING_LIVE_ON: 'SWITCHING_LIVE_ON',
  SWITCHING_LIVE_OFF: 'SWITCHING_LIVE_OFF'
};

export const SegmentType = {
  SEEKING: 'SEEKING',
  CONTINUE: 'CONTINUE'
}

export const FrameType = {
  SWITCH: 'SWITCH',
  SEEK: 'SEEK',
  CONTINUE: 'CONTINUE',
  TIMESLICE: 'TIMESLICE',
  TIMEMACHINE: 'TIMEMACHINE'
}

export const FramePosition = {
  START: 'START',
  MIDDLE: 'MIDDLE',
  END: 'END'
}

export default class BaseStreamController extends TaskLoop {
  doTick () {}

  startLoad () {}

  stopLoad () {
    let frag = this.fragCurrent;
    let frame = this.frameCurrent;

    if (frag) {
      if (frag.loader) {
        frag.loader.abort();
      }
      //this.fragmentTracker.removeFragment(frag);
    }

    if (frame) {
      if (frame.loader) {
        frame.loader.abort();
      }
      //this.fragmentTracker.removeFrame(frame);
    }

    if (this.demuxer) {
      this.demuxer.destroy();
      this.demuxer = null;
    }

    this.fragCurrent = null;
    this.fragPrevious = null;

    this.frameCurrent = null;
    this.framePrevious = null;

    this.clearInterval();
    this.clearNextTick();

    if(this.state !== State.SWITCHING_CHANNEL && 
       this.state !== State.SWITCHING_FRAME &&
       this.state !== State.SEEK &&
       this.state!== State.ENDED) {
      this.state = State.STOPPED;
    }
  }

  _isStreamEnded (bufferInfo, levelDetails) {
    const { fragCurrent, fragmentTracker } = this;
    if (!levelDetails.live && fragCurrent && !fragCurrent.backtracked && fragCurrent.sn === levelDetails.endSN && !bufferInfo.nextStart) {
      const fragState = fragmentTracker.getState(fragCurrent);
      return fragState === FragmentState.PARTIAL || fragState === FragmentState.OK;
    }
    return false;
  }

  onMediaSeeking () {
    const { config, media, mediaBuffer, state } = this;
    const currentTime = media ? media.currentTime : null;
    const bufferInfo = BufferHelper.bufferInfo(mediaBuffer || media, currentTime, this.config.maxBufferHole);

    if (state === State.FRAG_LOADING) {
      let fragCurrent = this.fragCurrent;
      if (bufferInfo.len === 0 && fragCurrent) {
        const tolerance = config.maxFragLookUpTolerance;
        const fragStartOffset = fragCurrent.start - tolerance;
        const fragEndOffset = fragCurrent.start + fragCurrent.duration + tolerance;

        if (currentTime < fragStartOffset || currentTime > fragEndOffset) {
          if (fragCurrent.loader) {
            fragCurrent.loader.abort();
          }
          this.fragCurrent = null;
          this.fragPrevious = null;
          this.state = State.IDLE;
        } 
      }
    } else if (state === State.ENDED) {
      // if seeking to unbuffered area, clean up fragPrevious
      if (bufferInfo.len === 0) {
        this.fragPrevious = null;
        this.fragCurrent = null;
      }

      // switch to IDLE state to check for potential new fragment
      this.state = State.IDLE;
    }
    if (media) {
      this.lastCurrentTime = currentTime;
    }

    // in case seeking occurs although no media buffered, adjust startPosition and nextLoadPosition to seek target
    if (!this.loadedmetadata) {
      this.nextLoadPosition = this.startPosition = currentTime;
    }

    // tick to speed up processing
    //this.tick();
  }

  onMediaEnded () {
    this.startPosition = this.lastCurrentTime = 0;
  }

  onHandlerDestroying () {
    this.stopLoad();
    super.onHandlerDestroying();
  }

  onHandlerDestroyed () {
    this.state = State.STOPPED;
    this.fragmentTracker = null;
  }

  computeLivePosition (sliding, levelDetails) {
    let targetLatency = this.config.liveSyncDuration !== undefined ? this.config.liveSyncDuration : this.config.liveSyncDurationCount * levelDetails.targetduration;
    return sliding + Math.max(0, levelDetails.totalduration - targetLatency);
  }
}
