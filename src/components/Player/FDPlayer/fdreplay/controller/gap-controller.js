import { BufferHelper } from '../utils/buffer-helper';
import { ErrorTypes, ErrorDetails } from '../errors';
import Event from '../events';

export const STALL_MINIMUM_DURATION_MS = 250;
export const MAX_START_GAP_JUMP = 2.0;
export const SKIP_BUFFER_HOLE_STEP_SECONDS = 0.1;
export const SKIP_BUFFER_RANGE_START = 0.05;

export default class GapController {
  constructor (config, media, fragmentTracker, hls) {
    this.config = config;
    this.media = media;
    this.fragmentTracker = fragmentTracker;
    this.hls = hls;
    this.nudgeRetry = 0;
    this.stallReported = false;
    this.stalled = null;
    this.moved = false;
    this.seeking = false;
  }

  poll (lastCurrentTime) {
    const { config, media, stalled } = this;
    const { currentTime, seeking } = media;
    const seeked = this.seeking && !seeking;
    const beginSeek = !this.seeking && seeking;

    this.seeking = seeking;

    if (currentTime !== lastCurrentTime) {
      this.moved = true;
      if (stalled !== null) {
        if (this.stallReported) {
          this.stallReported = false;
        }
        this.stalled = null;
        this.nudgeRetry = 0;
      }
      return;
    }

    if (beginSeek || seeked) {
      this.stalled = null;
    }

    if (media.paused || media.ended || media.playbackRate === 0 || !BufferHelper.getBuffered(media).length) {
      return;
    }

    const bufferInfo = BufferHelper.bufferInfo(media, currentTime, 0);
    const isBuffered = bufferInfo.len > 0;
    const nextStart = bufferInfo.nextStart || 0;

    if (!isBuffered && !nextStart) {
      return;
    }

    if (seeking) {
      const hasEnoughBuffer = bufferInfo.len > MAX_START_GAP_JUMP;
      const noBufferGap = !nextStart ||
        (nextStart - currentTime > MAX_START_GAP_JUMP && !this.fragmentTracker.getPartialFragment(currentTime));
      if (hasEnoughBuffer || noBufferGap) {
        return;
      }
      this.moved = false;
    }

    if (!this.moved && this.stalled) {
      const startJump = Math.max(nextStart, bufferInfo.start || 0) - currentTime;     
      const level = this.hls.levels ? this.hls.levels[this.hls.currentLevel] : null;
      const isLive = level?.details?.live;
      const maxStartGapJump = isLive ? level.details.targetduration * 2 : MAX_START_GAP_JUMP;
      if (startJump > 0 && startJump <= maxStartGapJump) {
        this._trySkipBufferHole(null);
        return;
      }
    }

    // Start tracking stall time
    const tnow = window.self.performance.now();
    if (stalled === null) {
      this.stalled = tnow;
      return;
    }

    const stalledDuration = tnow - stalled;
    if (!seeking && stalledDuration >= STALL_MINIMUM_DURATION_MS) {
      this._reportStall(bufferInfo.len);
    }

    const bufferedWithHoles = BufferHelper.bufferInfo(media, currentTime, config.maxBufferHole);
    this._tryFixBufferStall(bufferedWithHoles, stalledDuration);
  }

  _tryFixBufferStall (bufferInfo, stalledDurationMs) {
    const { config, fragmentTracker, media } = this;
    const currentTime = media.currentTime;

    const partial = fragmentTracker.getPartialFragment(currentTime);
    if (partial) {
      const targetTime = this._trySkipBufferHole(partial);      
      if (targetTime) {
        return;
      }
    }
   
    if (bufferInfo.len > config.maxBufferHole &&
      stalledDurationMs > config.highBufferWatchdogPeriod * 1000) {      
      this.stalled = null;
      this._tryNudgeBuffer();
    }
  }
 
  _reportStall (bufferLen) {
    const { hls, stallReported } = this;
    if (!stallReported) {
      this.stallReported = true;
      hls.trigger(Event.ERROR, {
        type: ErrorTypes.MEDIA_ERROR,
        details: ErrorDetails.BUFFER_STALLED_ERROR,
        fatal: false,
        buffer: bufferLen
      });
    }
  }

  _trySkipBufferHole (partial) {
    const { config, hls, media } = this;
    const currentTime = media.currentTime;
    let lastEndTime = 0;

    const buffered = BufferHelper.getBuffered(media);
    for (let i = 0; i < buffered.length; i++) {
      const startTime = buffered.start(i);
      if (currentTime + config.maxBufferHole >= lastEndTime && currentTime < startTime) {
        const targetTime = Math.max(startTime + SKIP_BUFFER_RANGE_START, media.currentTime + SKIP_BUFFER_HOLE_STEP_SECONDS);
        this.moved = true;
        this.stalled = null;
        media.currentTime = targetTime;

        if (partial) {
          hls.trigger(Event.ERROR, {
            type: ErrorTypes.MEDIA_ERROR,
            details: ErrorDetails.BUFFER_SEEK_OVER_HOLE,
            fatal: false,
            reason: `fragment loaded with buffer holes, seeking from ${currentTime} to ${targetTime}`,
            frag: partial
          });
        }
        return targetTime;
      }
      lastEndTime = buffered.end(i);
    }
    return 0;
  }

  _tryNudgeBuffer () {
    const { config, hls, media } = this;
    const currentTime = media.currentTime;
    const nudgeRetry = (this.nudgeRetry || 0) + 1;
    this.nudgeRetry = nudgeRetry;

    if (nudgeRetry < config.nudgeMaxRetry) {
      const targetTime = currentTime + nudgeRetry * config.nudgeOffset;

      media.currentTime = targetTime;

      hls.trigger(Event.ERROR, {
        type: ErrorTypes.MEDIA_ERROR,
        details: ErrorDetails.BUFFER_NUDGE_ON_STALL,
        fatal: false
      });
    } else {
      hls.trigger(Event.ERROR, {
        type: ErrorTypes.MEDIA_ERROR,
        details: ErrorDetails.BUFFER_STALLED_ERROR,
        fatal: true
      });
    }
  }
}
