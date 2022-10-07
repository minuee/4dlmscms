import * as URLToolkit from 'url-toolkit';
import * as Lodash from 'lodash';

import Fragment from './fragment';
import Level from './level';
import LevelKey from './level-key';

import AttrList from '../utils/attr-list';
import { isCodecType, CodecType } from '../utils/codecs';
import { MediaPlaylist, AudioGroup, MediaPlaylistType } from '../types/media-playlist';
import { PlaylistLevelType } from '../types/loader';

const MASTER_PLAYLIST_REGEX = /(?:#EXT-X-STREAM-INF:([^\n\r]*)[\r\n]+([^\r\n]+)|#EXT-X-SESSION-DATA:([^\n\r]*)[\r\n]+)/g;
const MASTER_FRAME_PLAYLIST_REGEX = /#EXT-X-I-FRAME-STREAM-INF:([^\r\n]*)(?:[\r\n](?:#[^\r\n]*)?)*([^\r\n]+)|#EXT-X-SESSION-DATA:([^\r\n]*)[\r\n]+/g;
const MASTER_PLAYLIST_MEDIA_REGEX = /#EXT-X-MEDIA:(.*)/g;

const LEVEL_PLAYLIST_REGEX_FAST = new RegExp([
  /#EXTINF:\s*(\d*(?:\.\d+)?)(?:,(.*)\s+)?/.source, // duration (#EXTINF:<duration>,<title>), group 1 => duration, group 2 => title
  /|(?!#)([\S+ ?]+)/.source, // segment URI, group 3 => the URI (note newline is not eaten)
  /|#EXT-X-BYTERANGE:*(.+)/.source, // next segment's byterange, group 4 => range spec (x@y)
  /|#EXT-X-PROGRAM-DATE-TIME:(.+)/.source, // next segment's program date/time group 5 => the datetime spec
  /|#.*/.source // All other non-segment oriented tags will match with all groups empty
].join(''), 'g');

const LEVEL_PLAYLIST_REGEX_SLOW = /(?:(?:#(EXTM3U))|(?:#EXT-X-(PLAYLIST-TYPE):(.+))|(?:#EXT-X-(MEDIA-SEQUENCE): *(\d+))|(?:#EXT-X-(TARGETDURATION): *(\d+))|(?:#EXT-X-(KEY):(.+))|(?:#EXT-X-(START):(.+))|(?:#EXT-X-(ENDLIST))|(?:#EXT-X-(DISCONTINUITY-SEQ)UENCE:(\d+))|(?:#EXT-X-(DIS)CONTINUITY))|(?:#EXT-X-(VERSION):(\d+))|(?:#EXT-X-(MAP):(.+))|(?:(#)([^:]*):(.*))|(?:(#)(.*))(?:.*)\r?\n?/;

const MP4_REGEX_SUFFIX = /\.(mp4|m4s|m4v|m4a)$/i;

function backfillProgramDateTimes (fragments, startIndex) {
  let fragPrev = fragments[startIndex];
  for (let i = startIndex - 1; i >= 0; i--) {
    const frag = fragments[i];
    frag.programDateTime = fragPrev.programDateTime - (frag.duration * 1000);
    fragPrev = frag;
  }
}

function assignProgramDateTime (frag, prevFrag) {
  if (frag.rawProgramDateTime) {
    frag.programDateTime = Date.parse(frag.rawProgramDateTime);
  } else if (prevFrag?.programDateTime) {
    frag.programDateTime = prevFrag.endProgramDateTime;
  }

  if (!Number.isFinite(frag.programDateTime)) {
    frag.programDateTime = null;
    frag.rawProgramDateTime = null;
  }
}

export default class M3U8Parser {
  static findGroup (groups: Array<AudioGroup>, mediaGroupId: string): AudioGroup | undefined {
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (group.id === mediaGroupId) {
        return group;
      }
    }
  }

  static convertAVC1ToAVCOTI (codec) {
    let avcdata = codec.split('.');
    let result;
    if (avcdata.length > 2) {
      result = avcdata.shift() + '.';
      result += parseInt(avcdata.shift()).toString(16);
      result += ('000' + parseInt(avcdata.shift()).toString(16)).substr(-4);
    } else {
      result = codec;
    }
    return result;
  }

  static resolve (url, baseUrl) {
    return URLToolkit.buildAbsoluteURL(baseUrl, url, { alwaysNormalize: true });
  }

  static parseMasterPlaylist (string: string, baseurl: string, fixedurl: string) {
    let levels: Array<any> = [];
    let sessionData: Record<string, AttrList> = {};
    let hasSessionData = false;
    MASTER_PLAYLIST_REGEX.lastIndex = 0;

    function setCodecs (codecs: Array<string>, level: any) {
      ['video', 'audio'].forEach((type: CodecType) => {
        const filtered = codecs.filter((codec) => isCodecType(codec, type));
        if (filtered.length) {
          const preferred = filtered.filter((codec) => {
            return codec.lastIndexOf('avc1', 0) === 0 || codec.lastIndexOf('mp4a', 0) === 0;
          });
          level[`${type}Codec`] = preferred.length > 0 ? preferred[0] : filtered[0];

          codecs = codecs.filter((codec) => filtered.indexOf(codec) === -1);
        }
      });

      level.unknownCodecs = codecs;
    }

    let result: RegExpExecArray | null;
    while ((result = MASTER_PLAYLIST_REGEX.exec(string)) != null) {
      if (result[1]) {
        const level: any = {};

        const attrs = level.attrs = new AttrList(result[1]);
        level.url = M3U8Parser.resolve(result[2], baseurl);
        level.fixedurl = fixedurl;

        const resolution = attrs.decimalResolution('RESOLUTION');
        if (resolution) {
          level.width = resolution.width;
          level.height = resolution.height;
        }
        level.bitrate = attrs.decimalInteger('AVERAGE-BANDWIDTH') || attrs.decimalInteger('BANDWIDTH');
        level.name = attrs.NAME;

        setCodecs([].concat((attrs.CODECS || '').split(/[ ,]+/)), level);

        if (level.videoCodec && level.videoCodec.indexOf('avc1') !== -1) {
          level.videoCodec = M3U8Parser.convertAVC1ToAVCOTI(level.videoCodec);
        }

        levels.push(level);
      } else if (result[3]) {
        let sessionAttrs = new AttrList(result[3]);
        if (sessionAttrs['DATA-ID']) {
          hasSessionData = true;
          sessionData[sessionAttrs['DATA-ID']] = sessionAttrs;
        }
      }
    }
    return {
      levels,
      sessionData: hasSessionData ? sessionData : null
    };
  }

  static parseMasterFramePlaylist (string: string, fixedurl: string) {
    let levels: Array<any> = [];
    let sessionData: Record<string, AttrList> = {};
    MASTER_FRAME_PLAYLIST_REGEX.lastIndex = 0;

    function setCodecs (codecs: Array<string>, level: any) {
      ['video', 'audio'].forEach((type: CodecType) => {
        const filtered = codecs.filter((codec) => isCodecType(codec, type));

        if (filtered.length) {
          const preferred = filtered.filter((codec) => {
            return codec.lastIndexOf('avc1', 0) === 0 || codec.lastIndexOf('mp4a', 0) === 0;
          });
          level[`${type}Codec`] = preferred.length > 0 ? preferred[0] : filtered[0];
          codecs = codecs.filter((codec) => filtered.indexOf(codec) === -1);
        }
      });

      level.unknownCodecs = codecs;
    }

    let result: RegExpExecArray | null;
    while ((result = MASTER_FRAME_PLAYLIST_REGEX.exec(string)) != null) {
      if (result[1]) {
        const level: any = {};
        const attrs = level.attrs = new AttrList(result[1]);

        level.url = '';
        level.baseUrl = fixedurl;

        const resolution = attrs.decimalResolution('RESOLUTION');
        if (resolution) {
          level.width = resolution.width;
          level.height = resolution.height;
        }
        level.bitrate = attrs.decimalInteger('AVERAGE-BANDWIDTH') || attrs.decimalInteger('BANDWIDTH');
        level.name = attrs.NAME;

        setCodecs([].concat((attrs.CODECS || '').split(/[ ,]+/)), level);

        if (level.videoCodec && level.videoCodec.indexOf('avc1') !== -1) {
          level.videoCodec = M3U8Parser.convertAVC1ToAVCOTI(level.videoCodec);
        }

        levels.push(level);
      } else if (result[3]) {
        let sessionAttrs = new AttrList(result[3]);
        if (sessionAttrs['DATA-ID']) {
          sessionData[sessionAttrs['DATA-ID']] = sessionAttrs;
        }
      }
    }
    return { frameLevels: levels };
  }

  static parseMasterPlaylistMedia (string: string, baseurl: string, type: MediaPlaylistType, audioGroups: Array<AudioGroup> = []): Array<MediaPlaylist> {
    let result: RegExpExecArray | null;
    let medias: Array<MediaPlaylist> = [];
    let id = 0;
    MASTER_PLAYLIST_MEDIA_REGEX.lastIndex = 0;
    while ((result = MASTER_PLAYLIST_MEDIA_REGEX.exec(string)) !== null) {
      const attrs = new AttrList(result[1]);
      if (attrs.TYPE === type) {
        const media: MediaPlaylist = {
          attrs,
          id: id++,
          groupId: attrs['GROUP-ID'],
          instreamId: attrs['INSTREAM-ID'],
          name: attrs.NAME || attrs.LANGUAGE,
          type,
          default: (attrs.DEFAULT === 'YES'),
          autoselect: (attrs.AUTOSELECT === 'YES'),
          forced: (attrs.FORCED === 'YES'),
          lang: attrs.LANGUAGE
        };

        if (attrs.URI) {
          media.url = M3U8Parser.resolve(attrs.URI, baseurl);
        }

        if (audioGroups.length) {
          const groupCodec = M3U8Parser.findGroup(audioGroups, media.groupId as string);
          media.audioCodec = groupCodec ? groupCodec.codec : audioGroups[0].codec;
        }

        medias.push(media);
      }
    }
    return medias;
  }

  static parseLevelPlaylist (string: string, baseurl: string, id: number, type: PlaylistLevelType, levelUrlId: number, fixedurl: string, channel: number, iFramePath: string) {
    let currentSN = 0;
    let totalduration = 0;
    let level = new Level(baseurl);
    let discontinuityCounter = 0;
    let prevFrag: Fragment | null = null;
    let frag: Fragment | null = new Fragment();
    let result: RegExpExecArray | RegExpMatchArray | null;
    let i: number;
    let levelkey: LevelKey | undefined;

    let firstPdtIndex = null;

    LEVEL_PLAYLIST_REGEX_FAST.lastIndex = 0;

    while ((result = LEVEL_PLAYLIST_REGEX_FAST.exec(string)) !== null) {
      const duration = result[1];
      if (duration) { // INF
        frag.duration = parseFloat(duration);
        const title = (' ' + result[2]).slice(1);
        frag.title = title || null;
        frag.tagList.push(title ? [ 'INF', duration, title ] : [ 'INF', duration ]);
      } else if (result[3]) { // url
        if (Number.isFinite(frag.duration)) {
          const sn = currentSN++;
          frag.type = type;
          frag.start = totalduration;
          //frag.start = (sn * frag.duration) + totalduration;
          //frag.start = sn * frag.duration;
          //console.log(`%c Fragment Start: ${frag.start}`, 'color:orange');
          frag.end = frag.start + frag.duration;
          frag.liveStartTime = sn * frag.duration;
          frag.liveEndTime = frag.liveStartTime + frag.duration;
          if (levelkey) {
            frag.levelkey = levelkey;
          }
          frag.sn = sn;
          frag.level = id;
          frag.cc = discontinuityCounter;
          frag.urlId = levelUrlId;
          frag.baseurl = baseurl;
          frag.fixedurl = fixedurl;
          frag.channel = channel;
          frag.channelName = channel.toString().padStart(3, "0");
          frag.relurl = (' ' + result[3]).slice(1);
          assignProgramDateTime(frag, prevFrag);

          level.fragments.push(frag);
          prevFrag = frag;
          totalduration += frag.duration;

          frag = new Fragment();
        }
      } else if (result[4]) { // X-BYTERANGE
        const data = (' ' + result[4]).slice(1);
        if (prevFrag) {
          frag.setByteRange(data, prevFrag);
        } else {
          frag.setByteRange(data);
        }
      } else if (result[5]) { // PROGRAM-DATE-TIME
        frag.rawProgramDateTime = (' ' + result[5]).slice(1);
        frag.tagList.push(['PROGRAM-DATE-TIME', frag.rawProgramDateTime]);
        if (firstPdtIndex === null) {
          firstPdtIndex = level.fragments.length;
        }
      } else {
        result = result[0].match(LEVEL_PLAYLIST_REGEX_SLOW);
        if (!result) {
          continue;
        }
        for (i = 1; i < result.length; i++) {
          if (typeof result[i] !== 'undefined') {
            break;
          }
        }

        const value1 = (' ' + result[i + 1]).slice(1);
        const value2 = (' ' + result[i + 2]).slice(1);

        switch (result[i]) {
        case '#':
          frag.tagList.push(value2 ? [ value1, value2 ] : [ value1 ]);
          break;
        case 'PLAYLIST-TYPE':
          level.type = value1.toUpperCase();
          break;
        case 'MEDIA-SEQUENCE':
          currentSN = level.startSN = parseInt(value1);
          break;
        case 'TARGETDURATION':
          level.targetduration = parseFloat(value1);
          break;
        case 'VERSION':
          level.version = parseInt(value1);
          break;
        case 'EXTM3U':
          break;
        case 'ENDLIST':
          level.live = false;
          break;
        case 'DIS':
          discontinuityCounter++;
          frag.tagList.push(['DIS']);
          break;
        case 'DISCONTINUITY-SEQ':
          discontinuityCounter = parseInt(value1);
          break;
        case 'KEY': {
          const decryptparams = value1;
          const keyAttrs = new AttrList(decryptparams);
          const decryptmethod = keyAttrs.enumeratedString('METHOD');
          const decrypturi = keyAttrs.URI;
          const decryptiv = keyAttrs.hexadecimalInteger('IV');
          const decryptkeyformat = keyAttrs.KEYFORMAT || 'identity';

          if (decryptkeyformat === 'com.apple.streamingkeydelivery') {
            continue;
          }

          if (decryptmethod) {
            levelkey = new LevelKey(baseurl, decrypturi);
            if ((decrypturi) && (['AES-128', 'SAMPLE-AES', 'SAMPLE-AES-CENC'].indexOf(decryptmethod) >= 0)) {
              levelkey.method = decryptmethod;
              levelkey.key = null;
              levelkey.iv = decryptiv;
            }
          }
          break;
        }
        case 'START': {
          const startAttrs = new AttrList(value1);
          const startTimeOffset = startAttrs.decimalFloatingPoint('TIME-OFFSET');
          if (Number.isFinite(startTimeOffset)) {
            level.startTimeOffset = startTimeOffset;
          }
          break;
        }
        case 'MAP': {
          const mapAttrs = new AttrList(value1);
          frag.relurl = mapAttrs.URI;
          if (mapAttrs.BYTERANGE) {
            frag.setByteRange(mapAttrs.BYTERANGE);
          }
          frag.baseurl = baseurl;
          frag.level = id;
          frag.type = type;
          frag.sn = 'initSegment';
          level.initSegment = frag;

          // Deep Clone
          let frameFrag = Lodash.cloneDeep(frag);
          frameFrag.type = PlaylistLevelType.FRAME;
          frameFrag.relurl = iFramePath + frameFrag.relurl;
          level.initFrameSegment = frameFrag;

          frag = new Fragment();
          frag.rawProgramDateTime = level.initSegment.rawProgramDateTime;
          break;
        }
        default:
          break;
        }
      }
    }

    frag = prevFrag;

    if (frag && !frag.relurl) {
      level.fragments.pop();
      totalduration -= frag.duration;
    }
    level.totalduration = totalduration;
    level.averagetargetduration = totalduration / level.fragments.length;
    level.endSN = currentSN - 1;
    level.startCC = level.fragments[0] ? level.fragments[0].cc : 0;
    level.endCC = discontinuityCounter;

    if (!level.initSegment && level.fragments.length) {
      if (level.fragments.every((frag) => MP4_REGEX_SUFFIX.test(frag.relurl))) {
        frag = new Fragment();
        frag.relurl = level.fragments[0].relurl;
        frag.baseurl = baseurl;
        frag.level = id;
        frag.type = type;
        frag.sn = 'initSegment';

        level.initSegment = frag;
      }
    }

    if (firstPdtIndex) {
      backfillProgramDateTimes(level.fragments, firstPdtIndex);
    }

    return level;
  }
}
