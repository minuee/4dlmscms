import Event from '../events';
import EventHandler from '../event-handler';
import { ErrorTypes, ErrorDetails } from '../errors';
import { Loader, PlaylistContextType, PlaylistLoaderContext, PlaylistLevelType, LoaderCallbacks, LoaderResponse, LoaderStats, LoaderConfiguration } from '../types/loader';
import MP4Demuxer from '../demux/mp4demuxer';
import M3U8Parser from './m3u8-parser';
import { AudioGroup } from '../types/media-playlist';

const { performance } = window;

class PlaylistLoader extends EventHandler {
  private loaders: Partial<Record<PlaylistContextType, Loader<PlaylistLoaderContext>>> = {};

  constructor (hls) {
    super(hls,
      Event.MANIFEST_LOADING,
      Event.LEVEL_LOADING,
      Event.AUDIO_TRACK_LOADING,
      Event.SUBTITLE_TRACK_LOADING);
  }

  static canHaveQualityLevels (type: PlaylistContextType): boolean {
    return (type !== PlaylistContextType.AUDIO_TRACK &&
      type !== PlaylistContextType.SUBTITLE_TRACK);
  }

  static mapContextToLevelType (context: PlaylistLoaderContext): PlaylistLevelType {
    const { type } = context;

    switch (type) {
    case PlaylistContextType.AUDIO_TRACK:
      return PlaylistLevelType.AUDIO;
    case PlaylistContextType.SUBTITLE_TRACK:
      return PlaylistLevelType.SUBTITLE;
    default:
      return PlaylistLevelType.MAIN;
    }
  }

  static getResponseUrl (response: LoaderResponse, context: PlaylistLoaderContext): string {
    let url = response.url;
    if (url === undefined || url.indexOf('data:') === 0) {
      url = context.url;
    }
    return url;
  }

  createInternalLoader (context: PlaylistLoaderContext): Loader<PlaylistLoaderContext> {
    const config = this.hls.config;
    const PLoader = config.pLoader;
    const Loader = config.loader;
    const InternalLoader = PLoader || Loader;

    const loader = new InternalLoader(config);

    context.loader = loader;
    this.loaders[context.type] = loader;

    return loader;
  }

  getInternalLoader (context: PlaylistLoaderContext): Loader<PlaylistLoaderContext> | undefined {
    return this.loaders[context.type];
  }

  resetInternalLoader (contextType: PlaylistContextType) {
    if (this.loaders[contextType]) {
      delete this.loaders[contextType];
    }
  }

  destroyInternalLoaders () {
    for (let contextType in this.loaders) {
      let loader = this.loaders[contextType];
      if (loader) {
        loader.destroy();
      }

      this.resetInternalLoader(contextType as PlaylistContextType);
    }
  }

  destroy () {
    this.destroyInternalLoaders();

    super.destroy();
  }

  onManifestLoading (data: { url: string; }) {
    this.load({
      url: data.url,
      type: PlaylistContextType.MANIFEST,
      level: 0,
      id: null,
      responseType: 'text'
    });
  }

  onLevelLoading (data: { url: string; level: number | null; id: number | null; }) {
    this.load({
      url: data.url,
      type: PlaylistContextType.LEVEL,
      level: data.level,
      id: data.id,
      responseType: 'text'
    });
  }

  onAudioTrackLoading (data: { url: string; id: number | null; }) {
    this.load({
      url: data.url,
      type: PlaylistContextType.AUDIO_TRACK,
      level: null,
      id: data.id,
      responseType: 'text'
    });
  }

  load (context: PlaylistLoaderContext): boolean {
    const config = this.hls.config;
    let loader = this.getInternalLoader(context);

    if (loader) {
      const loaderContext = loader.context;
      if (loaderContext && loaderContext.url === context.url) { // same URL can't overlap
        return false;
      } else {
        loader.abort();
      }
    }

    let maxRetry: number;
    let timeout: number;
    let retryDelay: number;
    let maxRetryDelay: number;

    switch (context.type) {
    case PlaylistContextType.MANIFEST:
      maxRetry = config.manifestLoadingMaxRetry;
      timeout = config.manifestLoadingTimeOut;
      retryDelay = config.manifestLoadingRetryDelay;
      maxRetryDelay = config.manifestLoadingMaxRetryTimeout;
      break;
    case PlaylistContextType.LEVEL:
      maxRetry = 0;
      maxRetryDelay = 0;
      retryDelay = 0;
      timeout = config.levelLoadingTimeOut;
      break;
    default:
      maxRetry = config.levelLoadingMaxRetry;
      timeout = config.levelLoadingTimeOut;
      retryDelay = config.levelLoadingRetryDelay;
      maxRetryDelay = config.levelLoadingMaxRetryTimeout;
      break;
    }

    loader = this.createInternalLoader(context);

    const loaderConfig: LoaderConfiguration = {
      timeout,
      maxRetry,
      retryDelay,
      maxRetryDelay
    };

    const loaderCallbacks: LoaderCallbacks<PlaylistLoaderContext> = {
      onSuccess: this.loadsuccess.bind(this),
      onError: this.loaderror.bind(this),
      onTimeout: this.loadtimeout.bind(this)
    };

    loader.load(context, loaderConfig, loaderCallbacks);
    return true;
  }

  loadsuccess (response: LoaderResponse, stats: LoaderStats, context: PlaylistLoaderContext, networkDetails: unknown = null) {
    if (context.isSidxRequest) {
      this._handleSidxRequest(response, context);
      this._handlePlaylistLoaded(response, stats, context, networkDetails);
      return;
    }

    this.resetInternalLoader(context.type);
    if (typeof response.data !== 'string') {
      throw new Error('expected responseType of "text" for PlaylistLoader');
    }

    const string = response.data;

    stats.tload = performance.now();

    if (string.indexOf('#EXTM3U') !== 0) {
      this._handleManifestParsingError(response, context, 'no EXTM3U delimiter', networkDetails);
      return;
    }

    if (string.indexOf('#EXTINF:') > 0 || string.indexOf('#EXT-X-TARGETDURATION:') > 0) {
      this._handleTrackOrLevelPlaylist(response, stats, context, networkDetails);
    } else {
      this._handleMasterPlaylist(response, stats, context, networkDetails);
    }
  }

  loaderror (response: LoaderResponse, context: PlaylistLoaderContext, networkDetails = null) {
    this._handleNetworkError(context, networkDetails, false, response);
  }

  loadtimeout (stats: LoaderStats, context: PlaylistLoaderContext, networkDetails = null) {
    this._handleNetworkError(context, networkDetails, true);
  }

  _handleMasterPlaylist (response: LoaderResponse, stats: LoaderStats, context: PlaylistLoaderContext, networkDetails: unknown) {
    const hls = this.hls;
    const string = response.data as string;

    const url = PlaylistLoader.getResponseUrl(response, context);
    const { levels, sessionData } = M3U8Parser.parseMasterPlaylist(string, url);
    if (!levels.length) {
      this._handleManifestParsingError(response, context, 'no level found in manifest', networkDetails);
      return;
    }

    const audioGroups: Array<AudioGroup> = levels.map(level => ({
      id: level.attrs.AUDIO,
      codec: level.audioCodec
    }));

    const audioTracks = M3U8Parser.parseMasterPlaylistMedia(string, url, 'AUDIO', audioGroups);

    if (audioTracks.length) {
      let embeddedAudioFound = false;
      audioTracks.forEach(audioTrack => {
        if (!audioTrack.url) {
          embeddedAudioFound = true;
        }
      });

      if (embeddedAudioFound === false && levels[0].audioCodec && !levels[0].attrs.AUDIO) {
        audioTracks.unshift({
          type: 'main',
          name: 'main',
          default: false,
          autoselect: false,
          forced: false,
          id: -1,
          attrs: {},
          url: ''
        });
      }
    }

    hls.trigger(Event.MANIFEST_LOADED, {
      levels,
      audioTracks,
      url,
      stats,
      networkDetails,
      sessionData
    });
  }

  _handleTrackOrLevelPlaylist (response: LoaderResponse, stats: LoaderStats, context: PlaylistLoaderContext, networkDetails: unknown) {
    const hls = this.hls;

    const { id, level, type } = context;

    const url = PlaylistLoader.getResponseUrl(response, context);

    const levelUrlId = Number.isFinite(id as number) ? id as number : 0;
    const levelId = Number.isFinite(level as number) ? level as number : levelUrlId;
    const levelType = PlaylistLoader.mapContextToLevelType(context);
    const levelDetails = M3U8Parser.parseLevelPlaylist(response.data as string, url, levelId, levelType, levelUrlId);

    (levelDetails as any).tload = stats.tload;

    if (!levelDetails.fragments.length) {
      hls.trigger(Event.ERROR, {
        type: ErrorTypes.NETWORK_ERROR,
        details: ErrorDetails.LEVEL_EMPTY_ERROR,
        fatal: false,
        url: url,
        reason: 'no fragments found in level',
        level: typeof context.level === 'number' ? context.level : undefined
      });
      return;
    }

    if (type === PlaylistContextType.MANIFEST) {
      const singleLevel = {
        url,
        details: levelDetails
      };

      hls.trigger(Event.MANIFEST_LOADED, {
        levels: [singleLevel],
        audioTracks: [],
        url,
        stats,
        networkDetails,
        sessionData: null
      });
    }

    stats.tparsed = performance.now();

    if (levelDetails.needSidxRanges) {
      const sidxUrl = levelDetails.initSegment.url;
      this.load({
        url: sidxUrl,
        isSidxRequest: true,
        type,
        level,
        levelDetails,
        id,
        rangeStart: 0,
        rangeEnd: 2048,
        responseType: 'arraybuffer'
      });
      return;
    }

    context.levelDetails = levelDetails;

    this._handlePlaylistLoaded(response, stats, context, networkDetails);
  }

  _handleSidxRequest (response: LoaderResponse, context: PlaylistLoaderContext) {
    if (typeof response.data === 'string') {
      throw new Error('sidx request must be made with responseType of array buffer');
    }

    const sidxInfo = MP4Demuxer.parseSegmentIndex(new Uint8Array(response.data));
    // if provided fragment does not contain sidx, early return
    if (!sidxInfo) {
      return;
    }
    const sidxReferences = sidxInfo.references;
    const levelDetails = context.levelDetails;
    sidxReferences.forEach((segmentRef, index) => {
      const segRefInfo = segmentRef.info;
      if (!levelDetails) {
        return;
      }
      const frag = levelDetails.fragments[index];
      if (frag.byteRange.length === 0) {
        frag.setByteRange(String(1 + segRefInfo.end - segRefInfo.start) + '@' + String(segRefInfo.start));
      }
    });

    if (levelDetails) {
      levelDetails.initSegment.setByteRange(String(sidxInfo.moovEndOffset) + '@0');
    }
  }

  _handleManifestParsingError (response: LoaderResponse, context: PlaylistLoaderContext, reason: string, networkDetails: unknown) {
    this.hls.trigger(Event.ERROR, {
      type: ErrorTypes.NETWORK_ERROR,
      details: ErrorDetails.MANIFEST_PARSING_ERROR,
      fatal: true,
      url: response.url,
      reason,
      networkDetails
    });
  }

  _handleNetworkError (context: PlaylistLoaderContext, networkDetails: unknown, timeout: boolean = false, response: LoaderResponse | null = null) {

    let details;
    let fatal;

    const loader = this.getInternalLoader(context);

    switch (context.type) {
    case PlaylistContextType.MANIFEST:
      details = (timeout ? ErrorDetails.MANIFEST_LOAD_TIMEOUT : ErrorDetails.MANIFEST_LOAD_ERROR);
      fatal = true;
      break;
    case PlaylistContextType.LEVEL:
      details = (timeout ? ErrorDetails.LEVEL_LOAD_TIMEOUT : ErrorDetails.LEVEL_LOAD_ERROR);
      fatal = false;
      break;
    case PlaylistContextType.AUDIO_TRACK:
      details = (timeout ? ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT : ErrorDetails.AUDIO_TRACK_LOAD_ERROR);
      fatal = false;
      break;
    default:
      fatal = false;
    }

    if (loader) {
      loader.abort();
      this.resetInternalLoader(context.type);
    }

    let errorData: any = {
      type: ErrorTypes.NETWORK_ERROR,
      details,
      fatal,
      url: context.url,
      loader,
      context,
      networkDetails
    };

    if (response) {
      errorData.response = response;
    }

    this.hls.trigger(Event.ERROR, errorData);
  }

  _handlePlaylistLoaded (response: LoaderResponse, stats: LoaderStats, context: PlaylistLoaderContext, networkDetails: unknown) {
    const { type, level, id, levelDetails } = context;

    if (!levelDetails || !levelDetails.targetduration) {
      this._handleManifestParsingError(response, context, 'invalid target duration', networkDetails);
      return;
    }

    const canHaveLevels = PlaylistLoader.canHaveQualityLevels(context.type);
    if (canHaveLevels) {
      this.hls.trigger(Event.LEVEL_LOADED, {
        details: levelDetails,
        level: level || 0,
        id: id || 0,
        stats,
        networkDetails
      });
    } else {
      switch (type) {
        case PlaylistContextType.AUDIO_TRACK:
          this.hls.trigger(Event.AUDIO_TRACK_LOADED, {
            details: levelDetails,
            id,
            stats,
            networkDetails
          });
          break;     
      }
    }
  }
}

export default PlaylistLoader;
