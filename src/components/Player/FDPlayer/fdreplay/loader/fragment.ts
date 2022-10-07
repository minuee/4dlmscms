
import { buildAbsoluteURL } from 'url-toolkit';
import LevelKey from './level-key';
import { PlaylistLevelType } from '../types/loader';

export enum ElementaryStreamTypes {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export default class Fragment {
  private _url: string | null = null;
  private _frameurl: string | null = null;
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

  public cc!: number;
  public type!: PlaylistLevelType;
  public relurl!: string;
  public baseurl!: string;
  public fixedurl?: string;
  public duration!: number;
  public start!: number;
  public end!: number;
  public sn: number | 'initSegment' = 0;
  public timeOffset: number = 0;
  public urlId: number = 0;
  public level: number = 0;
  public levelName?: string;
  public channelName?: string;
  public channel?: number;  
  public levelkey?: LevelKey;
  public loader: any;
  public liveStartTime?: number;
  public liveEndTime?: number;

  setByteRange (value: string, previousFrag?: Fragment) {
    const params = value.split('@', 2);
    const byteRange: number[] = [];
    if (params.length === 1) {
      byteRange[0] = previousFrag ? previousFrag.byteRangeEndOffset : 0;
    } else {
      //byteRange[0] = parseInt(params[1]);
      byteRange[0] = parseInt(params[0]);
    }
    //byteRange[1] = parseInt(params[0]) + byteRange[0];
    byteRange[1] = byteRange[0] + parseInt(params[1]);
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

  get frameurl () {
    if (!this._frameurl && this._url && this.channelName && this.levelName && this.relurl) {
      let framePath = this.channelName + '/' + this.levelName + '/' + this.relurl;
      this._frameurl = buildAbsoluteURL(this._url, framePath, {
        alwaysNormalize: true,
      });
    }
    return this._frameurl || '';
  }

  set frameurl (value) {
    this._frameurl = value;
  }

  get byteRange (): number[] {
    if (!this._byteRange) {
      return [];
    }
    return this._byteRange;
  }

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
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
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
