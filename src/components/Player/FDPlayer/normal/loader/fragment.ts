
import { buildAbsoluteURL } from 'url-toolkit';
import LevelKey from './level-key';
import { PlaylistLevelType } from '../types/loader';

export enum ElementaryStreamTypes {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export default class Fragment {
  private _url: string | null = null;
  private _byteRange: number[] | null = null;
  private _decryptdata: LevelKey | null = null;

  private _elementaryStreams: Record<ElementaryStreamTypes, boolean> = {
    [ElementaryStreamTypes.AUDIO]: false,
    [ElementaryStreamTypes.VIDEO]: false
  };

  public deltaPTS: number = 0;

  public rawProgramDateTime: string | null = null;
  public programDateTime: number | null = null;
  public title: string | null = null;
  public tagList: Array<string[]> = [];

  // Discontinuity Counter
  public cc!: number;

  public type!: PlaylistLevelType;
  // relurl is the portion of the URL that comes from inside the playlist.
  public relurl!: string;
  // baseurl is the URL to the playlist
  public baseurl!: string;
  // EXTINF has to be present for a m3u8 to be considered valid
  public duration!: number;
  // When this segment starts in the timeline
  public start!: number;
  // sn notates the sequence number for a segment, and if set to a string can be 'initSegment'
  public sn: number | 'initSegment' = 0;

  public urlId: number = 0;
  // level matches this fragment to a index playlist
  public level: number = 0;
  // levelkey is the EXT-X-KEY that applies to this segment for decryption
  // core difference from the private field _decryptdata is the lack of the initialized IV
  // _decryptdata will set the IV for this segment based on the segment number in the fragment
  public levelkey?: LevelKey;

  // TODO(typescript-xhrloader)
  public loader: any;

  // setByteRange converts a EXT-X-BYTERANGE attribute into a two element array
  setByteRange (value: string, previousFrag?: Fragment) {
    const params = value.split('@', 2);
    const byteRange: number[] = [];
    if (params.length === 1) {
      byteRange[0] = previousFrag ? previousFrag.byteRangeEndOffset : 0;
    } else {
      byteRange[0] = parseInt(params[1]);
    }
    byteRange[1] = parseInt(params[0]) + byteRange[0];
    this._byteRange = byteRange;
  }

  get url () {
    if (!this._url && this.relurl) {
      this._url = buildAbsoluteURL(this.baseurl, this.relurl, { alwaysNormalize: true });
    }

    return this._url;
  }

  set url (value) {
    this._url = value;
  }

  get byteRange (): number[] {
    if (!this._byteRange) {
      return [];
    }

    return this._byteRange;
  }

  /**
   * @type {number}
   */
  get byteRangeStartOffset () {
    return this.byteRange[0];
  }

  get byteRangeEndOffset () {
    return this.byteRange[1];
  }

  get decryptdata (): LevelKey | null {
    if (!this.levelkey && !this._decryptdata) {
      return null;
    }

    if (!this._decryptdata && this.levelkey) {
      let sn = this.sn;
      if (typeof sn !== 'number') {
        sn = 0;
      }
      this._decryptdata = this.setDecryptDataFromLevelKey(this.levelkey, sn);
    }

    return this._decryptdata;
  }

  get endProgramDateTime () {
    if (this.programDateTime === null) {
      return null;
    }

    if (!Number.isFinite(this.programDateTime)) {
      return null;
    }

    let duration = !Number.isFinite(this.duration) ? 0 : this.duration;

    return this.programDateTime + (duration * 1000);
  }

  get encrypted () {
    return !!((this.decryptdata && this.decryptdata.uri !== null) && (this.decryptdata.key === null));
  }

  addElementaryStream (type: ElementaryStreamTypes) {
    this._elementaryStreams[type] = true;
  }

  hasElementaryStream (type: ElementaryStreamTypes) {
    return this._elementaryStreams[type] === true;
  }

  createInitializationVector (segmentNumber: number): Uint8Array {
    let uint8View = new Uint8Array(16);

    for (let i = 12; i < 16; i++) {
      uint8View[i] = (segmentNumber >> 8 * (15 - i)) & 0xff;
    }

    return uint8View;
  }

  setDecryptDataFromLevelKey (levelkey: LevelKey, segmentNumber: number): LevelKey {
    let decryptdata = levelkey;

    if (levelkey?.method && levelkey.uri && !levelkey.iv) {
      decryptdata = new LevelKey(levelkey.baseuri, levelkey.reluri);
      decryptdata.method = levelkey.method;
      decryptdata.iv = this.createInitializationVector(segmentNumber);
    }

    return decryptdata;
  }
}
