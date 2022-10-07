import EventHandler from '../event-handler';
import Event from '../events';

export const FragmentState = {
  NOT_LOADED: 'NOT_LOADED',
  APPENDING: 'APPENDING',
  PARTIAL: 'PARTIAL',
  OK: 'OK'
};

export class FragmentTracker extends EventHandler {
  constructor (hls) {
    super(hls,
      Event.BUFFER_APPENDED,
      Event.FRAG_BUFFERED,
      Event.FRAG_LOADED
    );

    this.bufferPadding = 0.2;

    this.fragments = Object.create(null);
    this.timeRanges = Object.create(null);

    this.config = hls.config;
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
    let fragKey = this.getFragmentKey(fragment);
    let fragmentEntity = this.fragments[fragKey];
    if (fragmentEntity) {
      fragmentEntity.buffered = true;

      Object.keys(this.timeRanges).forEach(elementaryStream => {
        if (fragment.hasElementaryStream(elementaryStream)) {
          let timeRange = this.timeRanges[elementaryStream];
          fragmentEntity.range[elementaryStream] = this.getBufferedTimes(fragment.startPTS, fragment.endPTS, timeRange);
        }
      });
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
    return `${fragment.type}_${fragment.level}_${fragment.urlId}_${fragment.sn}`;
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
    if (!Number.isFinite(fragment.sn) || fragment.bitrateTest) {
      return;
    }

    this.fragments[this.getFragmentKey(fragment)] = {
      body: fragment,
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

  onFragBuffered (e) {
    this.detectPartialFragments(e.frag);
  }

  hasFragment (fragment) {
    const fragKey = this.getFragmentKey(fragment);
    return this.fragments[fragKey] !== undefined;
  }

  removeFragment (fragment) {
    let fragKey = this.getFragmentKey(fragment);
    delete this.fragments[fragKey];
  }

  removeAllFragments () {
    this.fragments = Object.create(null);
  }
}
