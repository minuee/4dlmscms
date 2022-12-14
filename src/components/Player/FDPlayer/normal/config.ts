/**
 * HLS config
 */

import AbrController from './controller/abr-controller';
import BufferController from './controller/buffer-controller';
import CapLevelController from './controller/cap-level-controller';
import FPSController from './controller/fps-controller';
import XhrLoader from './utils/xhr-loader';
// import FetchLoader from './utils/fetch-loader';

import AudioTrackController from './controller/audio-track-controller';
import AudioStreamController from './controller/audio-stream-controller';

import EMEController from './controller/eme-controller';
import { requestMediaKeySystemAccess, MediaKeyFunc } from './utils/mediakeys-helper';

type ABRControllerConfig = {
  abrEwmaFastLive: number,
  abrEwmaSlowLive: number,
  abrEwmaFastVoD: number,
  abrEwmaSlowVoD: number,
  abrEwmaDefaultEstimate: number,
  abrBandWidthFactor: number,
  abrBandWidthUpFactor: number,
  abrMaxWithRealBitrate: boolean,
  maxStarvationDelay: number,
  maxLoadingDelay: number,
};

export type BufferControllerConfig = {
  appendErrorMaxRetry: number,
  liveDurationInfinity: boolean,
  liveBackBufferLength: number,
};

type CapLevelControllerConfig = {
  capLevelToPlayerSize: boolean
};

export type DRMSystemOptions = {
  audioRobustness?: string,
  videoRobustness?: string,
}

export type EMEControllerConfig = {
  licenseXhrSetup?: (xhr: XMLHttpRequest, url: string) => void,
  emeEnabled: boolean,
  widevineLicenseUrl?: string,
  drmSystemOptions: DRMSystemOptions,
  requestMediaKeySystemAccessFunc: MediaKeyFunc | null,
};

type FragmentLoaderConfig = {
  fLoader: any, // TODO(typescript-loader): Once Loader is typed fill this in

  fragLoadingTimeOut: number,
  fragLoadingMaxRetry: number,
  fragLoadingRetryDelay: number,
  fragLoadingMaxRetryTimeout: number,
};

type FPSControllerConfig = {
  capLevelOnFPSDrop: boolean,
  fpsDroppedMonitoringPeriod: number,
  fpsDroppedMonitoringThreshold: number,
};

type LevelControllerConfig = {
  startLevel?: number
};

type MP4RemuxerConfig = {
  stretchShortVideoTrack: boolean,
  maxAudioFramesDrift: number,
};

type PlaylistLoaderConfig = {
  pLoader: any, // TODO(typescript-loader): Once Loader is typed fill this in

  manifestLoadingTimeOut: number,
  manifestLoadingMaxRetry: number,
  manifestLoadingRetryDelay: number,
  manifestLoadingMaxRetryTimeout: number,

  levelLoadingTimeOut: number,
  levelLoadingMaxRetry: number,
  levelLoadingRetryDelay: number,
  levelLoadingMaxRetryTimeout: number
};

type StreamControllerConfig = {
  autoStartLoad: boolean,
  startPosition: number,
  defaultAudioCodec?: string,
  initialLiveManifestSize: number,
  maxBufferLength: number,
  maxBufferSize: number,
  maxBufferHole: number,

  lowBufferWatchdogPeriod: number,
  highBufferWatchdogPeriod: number,
  nudgeOffset: number,
  nudgeMaxRetry: number,
  maxFragLookUpTolerance: number,
  liveSyncDurationCount: number,
  liveMaxLatencyDurationCount: number,
  liveSyncDuration?: number,
  liveMaxLatencyDuration?: number,
  maxMaxBufferLength: number,

  startFragPrefetch: boolean,
  testBandwidth: boolean
};

type TSDemuxerConfig = {
  forceKeyFrameOnDiscontinuity: boolean,
};

export type HlsConfig =
  {
    debug: boolean,
    enableWorker: boolean,
    enableSoftwareAES: boolean,
    minAutoBitrate: number,
    loader: any, // TODO(typescript-xhrloader): Type once XHR is done
    xhrSetup?: (xhr: XMLHttpRequest, url: string) => void,

    // Alt Audio
    audioStreamController?: any, // TODO(typescript-audiostreamcontroller): Type once file is done
    audioTrackController?: any, // TODO(typescript-audiotrackcontroller): Type once file is done
    // EME
    emeController?: typeof EMEController,

    abrController: any, // TODO(typescript-abrcontroller): Type once file is done
    bufferController: typeof BufferController,
    capLevelController: any, // TODO(typescript-caplevelcontroller): Type once file is done
    fpsController: any, // TODO(typescript-fpscontroller): Type once file is done
  } &
  ABRControllerConfig &
  BufferControllerConfig &
  CapLevelControllerConfig &
  EMEControllerConfig &
  FPSControllerConfig &
  FragmentLoaderConfig &
  LevelControllerConfig &
  MP4RemuxerConfig &
  PlaylistLoaderConfig &
  StreamControllerConfig &
  TSDemuxerConfig;

export const hlsDefaultConfig: HlsConfig = {
  autoStartLoad: true, // used by stream-controller
  startPosition: -1, // used by stream-controller
  defaultAudioCodec: void 0, // used by stream-controller
  debug: false, // used by logger
  capLevelOnFPSDrop: false, // used by fps-controller
  capLevelToPlayerSize: false, // used by cap-level-controller
  initialLiveManifestSize: 1, // used by stream-controller
  maxBufferLength: 30, // used by stream-controller
  maxBufferSize: 60 * 1000 * 1000, // used by stream-controller
  maxBufferHole: 0.5, // used by stream-controller

  lowBufferWatchdogPeriod: 0.5, // used by stream-controller
  highBufferWatchdogPeriod: 3, // used by stream-controller
  nudgeOffset: 0.1, // used by stream-controller
  nudgeMaxRetry: 3, // used by stream-controller
  maxFragLookUpTolerance: 0.25, // used by stream-controller
  liveSyncDurationCount: 3, // used by stream-controller
  liveMaxLatencyDurationCount: Infinity, // used by stream-controller
  liveSyncDuration: void 0, // used by stream-controller
  liveMaxLatencyDuration: void 0, // used by stream-controller
  liveDurationInfinity: false, // used by buffer-controller
  liveBackBufferLength: Infinity, // used by buffer-controller
  maxMaxBufferLength: 600, // used by stream-controller
  enableWorker: false, // used by demuxer
  enableSoftwareAES: true, // used by decrypter
  manifestLoadingTimeOut: 10000, // used by playlist-loader
  manifestLoadingMaxRetry: 1, // used by playlist-loader
  manifestLoadingRetryDelay: 1000, // used by playlist-loader
  manifestLoadingMaxRetryTimeout: 64000, // used by playlist-loader
  startLevel: void 0, // used by level-controller
  levelLoadingTimeOut: 10000, // used by playlist-loader
  levelLoadingMaxRetry: 4, // used by playlist-loader
  levelLoadingRetryDelay: 1000, // used by playlist-loader
  levelLoadingMaxRetryTimeout: 64000, // used by playlist-loader
  fragLoadingTimeOut: 20000, // used by fragment-loader
  fragLoadingMaxRetry: 6, // used by fragment-loader
  fragLoadingRetryDelay: 1000, // used by fragment-loader
  fragLoadingMaxRetryTimeout: 64000, // used by fragment-loader
  startFragPrefetch: false, // used by stream-controller
  fpsDroppedMonitoringPeriod: 5000, // used by fps-controller
  fpsDroppedMonitoringThreshold: 0.2, // used by fps-controller
  appendErrorMaxRetry: 3, // used by buffer-controller
  loader: XhrLoader,
  // loader: FetchLoader,
  fLoader: void 0, // used by fragment-loader
  pLoader: void 0, // used by playlist-loader
  xhrSetup: void 0, // used by xhr-loader
  licenseXhrSetup: void 0, // used by eme-controller
  // fetchSetup: void 0,
  abrController: AbrController,
  bufferController: BufferController,
  capLevelController: CapLevelController,
  fpsController: FPSController,
  stretchShortVideoTrack: false, // used by mp4-remuxer
  maxAudioFramesDrift: 1, // used by mp4-remuxer
  forceKeyFrameOnDiscontinuity: true, // used by ts-demuxer
  abrEwmaFastLive: 3, // used by abr-controller
  abrEwmaSlowLive: 9, // used by abr-controller
  abrEwmaFastVoD: 3, // used by abr-controller
  abrEwmaSlowVoD: 9, // used by abr-controller
  abrEwmaDefaultEstimate: 5e5, // 500 kbps  // used by abr-controller
  abrBandWidthFactor: 0.95, // used by abr-controller
  abrBandWidthUpFactor: 0.7, // used by abr-controller
  abrMaxWithRealBitrate: false, // used by abr-controller
  maxStarvationDelay: 4, // used by abr-controller
  maxLoadingDelay: 4, // used by abr-controller
  minAutoBitrate: 0, // used by hls
  emeEnabled: false, // used by eme-controller
  widevineLicenseUrl: void 0, // used by eme-controller
  drmSystemOptions: {}, // used by eme-controller
  requestMediaKeySystemAccessFunc: requestMediaKeySystemAccess, // used by eme-controller
  testBandwidth: true,

  // Dynamic Modules
  audioStreamController: AudioStreamController,
  audioTrackController: AudioTrackController,
  emeController: EMEController
};
