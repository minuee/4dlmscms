import { sliceUint8 } from './typed-array';
import { ElementaryStreamTypes } from '../loader/fragment';

type Mp4BoxData = {
  data: Uint8Array;
  start: number;
  end: number;
};

const UINT32_MAX = Math.pow(2, 32) - 1;
const push = [].push;

export function bin2str(data: Uint8Array): string {
  return String.fromCharCode.apply(null, data);
}

export function readUint16(
  buffer: Uint8Array | Mp4BoxData,
  offset: number
): number {
  if ('data' in buffer) {
    offset += buffer.start;
    buffer = buffer.data;
  }

  const val = (buffer[offset] << 8) | buffer[offset + 1];

  return val < 0 ? 65536 + val : val;
}

export function readUint32(
  buffer: Uint8Array | Mp4BoxData,
  offset: number
): number {
  if ('data' in buffer) {
    offset += buffer.start;
    buffer = buffer.data;
  }

  const val =
    (buffer[offset] << 24) |
    (buffer[offset + 1] << 16) |
    (buffer[offset + 2] << 8) |
    buffer[offset + 3];
  return val < 0 ? 4294967296 + val : val;
}

export function writeUint32(
  buffer: Uint8Array | Mp4BoxData,
  offset: number,
  value: number
) {
  if ('data' in buffer) {
    offset += buffer.start;
    buffer = buffer.data;
  }
  buffer[offset] = value >> 24;
  buffer[offset + 1] = (value >> 16) & 0xff;
  buffer[offset + 2] = (value >> 8) & 0xff;
  buffer[offset + 3] = value & 0xff;
}

export function findBox(
  input: Uint8Array | Mp4BoxData,
  path: Array<string>
): Array<Mp4BoxData> {
  const results = [] as Array<Mp4BoxData>;
  if (!path.length) {
    return results;
  }

  let data: Uint8Array;
  let start;
  let end;
  if ('data' in input) {
    data = input.data;
    start = input.start;
    end = input.end;
  } else {
    data = input;
    start = 0;
    end = data.byteLength;
  }

  for (let i = start; i < end - 4; ) {
    const size = readUint32(data, i);
    const type = bin2str(data.subarray(i + 4, i + 8));    
    const endbox = size > 1 ? i + size : end;
    if (type === path[0]) {
      if (path.length === 1) {
        results.push({ data: data, start: i + 8, end: endbox });
      } else {
        const subresults = findBox(
          { data: data, start: i + 8, end: endbox },
          path.slice(1)
        );
        if (subresults.length) {
          push.apply(results, subresults);
        }
      }
    }
    i = endbox;
  }

  if(results && results.length > 1) {
    ////console.log('');
  }

  if(!results || results.length === 0) {
    let data: Uint8Array;
    let start;
    let end;
    if ('data' in input) {
      data = input.data;
      start = input.start;
      end = input.end;
    } else {
      data = input;
      start = 0;
      end = data.byteLength;
    }
  
    for (let i = start; i < end - 4; ) {
      const size = readUint32(data, i);
      const type = bin2str(data.subarray(i + 4, i + 8));
      const endbox = size > 1 ? i + size : end;
  
      if (type === path[0]) {
        if (path.length === 1) {
          results.push({ data: data, start: i + 8, end: endbox });
        } else {
          const subresults = findBox(
            { data: data, start: i + 8, end: endbox },
            path.slice(1)
          );
          if (subresults.length) {
            push.apply(results, subresults);
          }
        }
      }
      i = endbox;
    }
  }
  
  if(results && results.length > 1) {
    ////console.log('');
  }
  return results;
}

export interface InitDataTrack {
  timescale: number;
  id: number;
  codec: string;
}

type HdlrType = ElementaryStreamTypes.AUDIO | ElementaryStreamTypes.VIDEO;

export interface InitData extends Array<any> {
  [index: number]:
    | {
        timescale: number;
        type: HdlrType;
        default?: {
          duration: number;
          flags: number;
        };
      }
    | undefined;
  audio?: InitDataTrack;
  video?: InitDataTrack;
}

export function parseInitSegment(initSegment: Uint8Array): InitData {
  const result: InitData = [];
  const traks = findBox(initSegment, ['moov', 'trak']);
  for (let i = 0; i < traks.length; i++) {
    const trak = traks[i];
    const tkhd = findBox(trak, ['tkhd'])[0];
    if (tkhd) {
      let version = tkhd.data[tkhd.start];
      let index = version === 0 ? 12 : 20;
      const trackId = readUint32(tkhd, index);
      const mdhd = findBox(trak, ['mdia', 'mdhd'])[0];
      if (mdhd) {
        version = mdhd.data[mdhd.start];
        index = version === 0 ? 12 : 20;
        const timescale = readUint32(mdhd, index);
        const hdlr = findBox(trak, ['mdia', 'hdlr'])[0];
        if (hdlr) {
          const hdlrType = bin2str(
            hdlr.data.subarray(hdlr.start + 8, hdlr.start + 12)
          );
          const type: HdlrType | undefined = {
            soun: ElementaryStreamTypes.AUDIO as const,
            vide: ElementaryStreamTypes.VIDEO as const,
          }[hdlrType];
          if (type) {
            // Parse codec details
            const stsd = findBox(trak, ['mdia', 'minf', 'stbl', 'stsd'])[0];
            let codec;
            if (stsd) {
              codec = bin2str(
                stsd.data.subarray(stsd.start + 12, stsd.start + 16)
              );
            }
            result[trackId] = { timescale, type };
            result[type] = { timescale, id: trackId, codec };
          }
        }
      }
    }
  }

  const trex = findBox(initSegment, ['moov', 'mvex', 'trex']);
  trex.forEach((trex) => {
    const trackId = readUint32(trex, 4);
    const track = result[trackId];
    if (track) {
      track.default = {
        duration: readUint32(trex, 12),
        flags: readUint32(trex, 20),
      };
    }
  });

  return result;
}

export function getStartDTS(initData: InitData, fmp4: Uint8Array): number {
  return (
    findBox(fmp4, ['moof', 'traf']).reduce((result: number | null, traf) => {
      const tfdt = findBox(traf, ['tfdt'])[0];
      const version = tfdt.data[tfdt.start];
      const start = findBox(traf, ['tfhd']).reduce(
        (result: number | null, tfhd) => {
          const id = readUint32(tfhd, 4);
          const track = initData[id];
          if (track) {
            let baseTime = readUint32(tfdt, 4);
            if (version === 1) {
              baseTime *= Math.pow(2, 32);
              baseTime += readUint32(tfdt, 8);
            }

            const scale = track.timescale || 90e3;
            const startTime = baseTime / scale;
            if (
              isFinite(startTime) &&
              (result === null || startTime < result)
            ) {
              return startTime;
            }
          }
          return result;
        },
        null
      );
      if (
        start !== null &&
        isFinite(start) &&
        (result === null || start < result)
      ) {
        return start;
      }
      return result;
    }, null) || 0
  );
}

export function getDuration(data: Uint8Array, initData: InitData) {
  let rawDuration = 0;
  let videoDuration = 0;
  let audioDuration = 0;
  const trafs = findBox(data, ['moof', 'traf']);
  for (let i = 0; i < trafs.length; i++) {
    const traf = trafs[i];
    const tfhd = findBox(traf, ['tfhd'])[0];
    const id = readUint32(tfhd, 4);
    const track = initData[id];
    if (!track) {
      continue;
    }
    const trackDefault = track.default;
    const tfhdFlags = readUint32(tfhd, 0) | trackDefault?.flags!;
    let sampleDuration: number | undefined = trackDefault?.duration;
    if (tfhdFlags & 0x000008) {
      if (tfhdFlags & 0x000002) {
        sampleDuration = readUint32(tfhd, 12);
      } else {
        sampleDuration = readUint32(tfhd, 8);
      }
    }

    const timescale = track.timescale || 90e3;
    const truns = findBox(traf, ['trun']);
    for (let j = 0; j < truns.length; j++) {
      if (sampleDuration) {
        const sampleCount = readUint32(truns[j], 4);
        rawDuration = sampleDuration * sampleCount;
      } else {
        rawDuration = computeRawDurationFromSamples(truns[j]);
      }
      if (track.type === ElementaryStreamTypes.VIDEO) {
        videoDuration += rawDuration / timescale;
      } else if (track.type === ElementaryStreamTypes.AUDIO) {
        audioDuration += rawDuration / timescale;
      }
    }
  }

  if (videoDuration) {
    return videoDuration;
  }
  return audioDuration;
}


export function computeRawDurationFromSamples(trun): number {
  const flags = readUint32(trun, 0);
  let offset = 8;
  if (flags & 0x000001) {
    offset += 4;
  }
  if (flags & 0x000004) {
    offset += 4;
  }

  let duration = 0;
  const sampleCount = readUint32(trun, 4);
  for (let i = 0; i < sampleCount; i++) {
    if (flags & 0x000100) {
      const sampleDuration = readUint32(trun, offset);
      duration += sampleDuration;
      offset += 4;
    }
    if (flags & 0x000200) {
      offset += 4;
    }
    if (flags & 0x000400) {
      offset += 4;
    }
    if (flags & 0x000800) {
      offset += 4;
    }
  }
  return duration;
}

export function offsetStartDTS(
  initData: InitData,
  fmp4: Uint8Array,
  timeOffset: number
) {
  findBox(fmp4, ['moof', 'traf']).forEach(function (traf) {
    findBox(traf, ['tfhd']).forEach(function (tfhd) {
      // get the track id from the tfhd
      const id = readUint32(tfhd, 4);
      const track = initData[id];
      if (!track) {
        return;
      }
      const timescale = track.timescale || 90e3;
      findBox(traf, ['tfdt']).forEach(function (tfdt) {
        const version = tfdt.data[tfdt.start];
        let baseMediaDecodeTime = readUint32(tfdt, 4);
        if (version === 0) {
          writeUint32(tfdt, 4, baseMediaDecodeTime - timeOffset * timescale);
        } else {
          baseMediaDecodeTime *= Math.pow(2, 32);
          baseMediaDecodeTime += readUint32(tfdt, 8);
          baseMediaDecodeTime -= timeOffset * timescale;
          baseMediaDecodeTime = Math.max(baseMediaDecodeTime, 0);
          const upper = Math.floor(baseMediaDecodeTime / (UINT32_MAX + 1));
          const lower = Math.floor(baseMediaDecodeTime % (UINT32_MAX + 1));
          writeUint32(tfdt, 4, upper);
          writeUint32(tfdt, 8, lower);
        }
      });
    });
  });
}

// TODO: Check if the last moof+mdat pair is part of the valid range
export function segmentValidRange(data: Uint8Array): SegmentedRange {
  const segmentedRange: SegmentedRange = {
    valid: null,
    remainder: null,
  };

  const moofs = findBox(data, ['moof']);
  if (!moofs) {
    return segmentedRange;
  } else if (moofs.length < 2) {
    segmentedRange.remainder = data;
    return segmentedRange;
  }
  const last = moofs[moofs.length - 1];
  // Offset by 8 bytes; findBox offsets the start by as much
  segmentedRange.valid = sliceUint8(data, 0, last.start - 8);
  segmentedRange.remainder = sliceUint8(data, last.start - 8);
  return segmentedRange;
}

export interface SegmentedRange {
  valid: Uint8Array | null;
  remainder: Uint8Array | null;
}

export function appendUint8Array(
  data1: Uint8Array,
  data2: Uint8Array
): Uint8Array {
  const temp = new Uint8Array(data1.length + data2.length);
  temp.set(data1);
  temp.set(data2, data1.length);

  return temp;
}
