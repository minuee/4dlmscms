
type BufferTimeRange = {
  start: number
  end: number
};

type Bufferable = {
  buffered: TimeRanges
};

const noopBuffered: TimeRanges = {
  length: 0,
  start: () => 0,
  end: () => 0
};

export class BufferHelper {
  static isBuffered (media: Bufferable, position: number): boolean {
    try {
      if (media) {
        let buffered = BufferHelper.getBuffered(media);
        for (let i = 0; i < buffered.length; i++) {
          if (position >= buffered.start(i) && position <= buffered.end(i)) {
            return true;
          }
        }
      }
    } catch (error) {     
    }
    return false;
  }

  static bufferInfo (
    media: Bufferable,
    pos: number,
    maxHoleDuration: number
  ): {
    len: number,
    start: number,
    end: number,
    nextStart?: number,
  } {
    try {
      if (media) {
        let vbuffered = BufferHelper.getBuffered(media);
        let buffered: BufferTimeRange[] = [];
        let i: number;
        for (i = 0; i < vbuffered.length; i++) {
          buffered.push({ start: vbuffered.start(i), end: vbuffered.end(i) });
        }

        return this.bufferedInfo(buffered, pos, maxHoleDuration);
      }
    } catch (error) {     
    }
    return { len: 0, start: pos, end: pos, nextStart: undefined };
  }

  static bufferedInfo (
    buffered: BufferTimeRange[],
    pos: number,
    maxHoleDuration: number
  ): {
    len: number,
    start: number,
    end: number,
    nextStart?: number,
  } {
    buffered.sort(function (a, b) {
      let diff = a.start - b.start;
      if (diff) {
        return diff;
      } else {
        return b.end - a.end;
      }
    });

    let buffered2: BufferTimeRange[] = [];
    if (maxHoleDuration) {
      for (let i = 0; i < buffered.length; i++) {
        let buf2len = buffered2.length;
        if (buf2len) {
          let buf2end = buffered2[buf2len - 1].end;
          if ((buffered[i].start - buf2end) < maxHoleDuration) {            
            if (buffered[i].end > buf2end) {
              buffered2[buf2len - 1].end = buffered[i].end;
            }
          } else {
            // big hole
            buffered2.push(buffered[i]);
          }
        } else {
          // first value
          buffered2.push(buffered[i]);
        }
      }
    } else {
      buffered2 = buffered;
    }

    let bufferLen = 0;
    let bufferStartNext: number | undefined;
    let bufferStart: number = pos;
    let bufferEnd: number = pos;
    
    for (let i = 0; i < buffered2.length; i++) {
      let start = buffered2[i].start,
        end = buffered2[i].end;
      // logger.log('buf start/end:' + buffered.start(i) + '/' + buffered.end(i));
      if ((pos + maxHoleDuration) >= start && pos < end) {
        // play position is inside this buffer TimeRange, retrieve end of buffer position and buffer length
        bufferStart = start;
        bufferEnd = end;
        bufferLen = bufferEnd - pos;
      } else if ((pos + maxHoleDuration) < start) {
        bufferStartNext = start;
        break;
      }
    }
    return { len: bufferLen, start: bufferStart, end: bufferEnd, nextStart: bufferStartNext };
  }

  static getBuffered (media: Bufferable): TimeRanges {
    try {
      return media.buffered;
    } catch (e) {
      return noopBuffered;
    }
  }
}
