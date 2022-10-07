import * as URLToolkit from 'url-toolkit';

import {
  ErrorTypes,
  ErrorDetails
} from './errors';

import PlaylistLoader from './loader/playlist-loader';
import FragmentLoader from './loader/fragment-loader';
import KeyLoader from './loader/key-loader';

import { FragmentTracker } from './controller/fragment-tracker';
import StreamController from './controller/stream-controller';
import LevelController from './controller/level-controller';

import { isSupported } from './is-supported';
import { hlsDefaultConfig, HlsConfig } from './config';

import HlsEvents from './events';

import { Observer } from './observer';

export default class Hls extends Observer {
  public static defaultConfig?: HlsConfig;
  public config: HlsConfig;

  private _autoLevelCapping: number;
  private abrController: any;
  private capLevelController: any;
  private levelController: LevelController;
  private streamController: StreamController;
  private networkControllers: any[];
  private audioTrackController: any;
  private emeController: any;
  private coreComponents: any[];
  private media: HTMLMediaElement | null = null;
  private url: string | null = null;

  static get version (): string {
    return __VERSION__;
  }

  static isSupported (): boolean {
    return isSupported();
  }

  static get Events () {
    return HlsEvents;
  }

  static get ErrorTypes () {
    return ErrorTypes;
  }

  static get ErrorDetails () {
    return ErrorDetails;
  }

  static get DefaultConfig (): HlsConfig {
    if (!Hls.defaultConfig) {
      return hlsDefaultConfig;
    }

    return Hls.defaultConfig;
  }

  static set DefaultConfig (defaultConfig: HlsConfig) {
    Hls.defaultConfig = defaultConfig;
  }

  constructor (userConfig: Partial<HlsConfig> = {}) {
    super();

    const defaultConfig = Hls.DefaultConfig;

    if ((userConfig.liveSyncDurationCount || userConfig.liveMaxLatencyDurationCount) && (userConfig.liveSyncDuration || userConfig.liveMaxLatencyDuration)) {
      throw new Error('Illegal hls.js config: don\'t mix up liveSyncDurationCount/liveMaxLatencyDurationCount and liveSyncDuration/liveMaxLatencyDuration');
    }

    // Shallow clone
    this.config = {
      ...defaultConfig,
      ...userConfig
    };

    const { config } = this;

    if (config.liveMaxLatencyDurationCount !== void 0 && config.liveMaxLatencyDurationCount <= config.liveSyncDurationCount) {
      throw new Error('Illegal hls.js config: "liveMaxLatencyDurationCount" must be gt "liveSyncDurationCount"');
    }

    if (config.liveMaxLatencyDuration !== void 0 && (config.liveSyncDuration === void 0 || config.liveMaxLatencyDuration <= config.liveSyncDuration)) {
      throw new Error('Illegal hls.js config: "liveMaxLatencyDuration" must be gt "liveSyncDuration"');
    }

    this._autoLevelCapping = -1;

    const abrController = this.abrController = new config.abrController(this); // eslint-disable-line new-cap
    const bufferController = new config.bufferController(this); // eslint-disable-line new-cap
    const capLevelController = this.capLevelController = new config.capLevelController(this); // eslint-disable-line new-cap
    const fpsController = new config.fpsController(this); // eslint-disable-line new-cap
    const playListLoader = new PlaylistLoader(this);
    const fragmentLoader = new FragmentLoader(this);
    const keyLoader = new KeyLoader(this);
 
    const levelController = this.levelController = new LevelController(this);

    const fragmentTracker = new FragmentTracker(this);
    const streamController = this.streamController = new StreamController(this, fragmentTracker);

    let networkControllers = [levelController, streamController];
 
    let Controller = config.audioStreamController;
    if (Controller) {
      networkControllers.push(new Controller(this, fragmentTracker));
    }
    this.networkControllers = networkControllers;

    const coreComponents = [
      playListLoader,
      fragmentLoader,
      keyLoader,
      abrController,
      bufferController,
      capLevelController,
      fpsController,
      fragmentTracker
    ];

    Controller = config.audioTrackController;
    if (Controller) {
      const audioTrackController = new Controller(this);
      this.audioTrackController = audioTrackController;
      coreComponents.push(audioTrackController);
    }

    Controller = config.emeController;
    if (Controller) {
      const emeController = new Controller(this); 
      this.emeController = emeController;
      coreComponents.push(emeController);
    }

    this.coreComponents = coreComponents;
  }

  destroy () {
    this.trigger(HlsEvents.DESTROYING);
    this.detachMedia();
    this.coreComponents.concat(this.networkControllers).forEach(component => {
      component.destroy();
    });
    this.url = null;
    this.removeAllListeners();
    this._autoLevelCapping = -1;
  }

  attachMedia (media: HTMLMediaElement) {
    this.media = media;
    this.trigger(HlsEvents.MEDIA_ATTACHING, { media: media });
  }

  detachMedia () {
    this.trigger(HlsEvents.MEDIA_DETACHING);
    this.media = null;
  }

  loadSource (url: string) {
    this.stopLoad();
    const media = this.media;
    if (media && this.url) {
      this.detachMedia();
      this.attachMedia(media);
    }
    url = URLToolkit.buildAbsoluteURL(window.location.href, url, { alwaysNormalize: true });
    this.url = url;
    this.trigger(HlsEvents.MANIFEST_LOADING, { url: url });
  }

  startLoad (startPosition: number = -1) {
    this.networkControllers.forEach(controller => {
      controller.startLoad(startPosition);
    });
  }

  stopLoad () {
    this.networkControllers.forEach(controller => {
      controller.stopLoad();
    });
  }

  swapAudioCodec () {
    this.streamController.swapAudioCodec();
  }

  recoverMediaError () {
    let media = this.media;
    this.detachMedia();
    if (media) {
      this.attachMedia(media);
    }
  }

  removeLevel (levelIndex, urlId = 0) {
    this.levelController.removeLevel(levelIndex, urlId);
  }

  get levels (): any[] {
    return this.levelController.levels;
  }

  get currentLevel (): number {
    return this.streamController.currentLevel;
  }

  set currentLevel (newLevel: number) {
    this.loadLevel = newLevel;
    this.streamController.immediateLevelSwitch();
  }

  get currentLevelHeight(): string {
    return this.levelController.levelHeight;
  }

  get nextLevel (): number {
    return this.streamController.nextLevel;
  }

  set nextLevel (newLevel: number) {
    this.levelController.manualLevel = newLevel;
    this.streamController.nextLevelSwitch();
  }

  get loadLevel (): number {
    return this.levelController.level;
  }

  set loadLevel (newLevel: number) {
    this.levelController.manualLevel = newLevel;
  }

  get nextLoadLevel (): number {
    return this.levelController.nextLoadLevel;
  }

  set nextLoadLevel (level: number) {
    this.levelController.nextLoadLevel = level;
  }

  get firstLevel (): number {
    return Math.max(this.levelController.firstLevel, this.minAutoLevel);
  }

  set firstLevel (newLevel: number) {
    this.levelController.firstLevel = newLevel;
  }

  get startLevel (): number {
    return this.levelController.startLevel;
  }

  set startLevel (newLevel: number) {
    if (newLevel !== -1) {
      newLevel = Math.max(newLevel, this.minAutoLevel);
    }

    this.levelController.startLevel = newLevel;
  }

  get capLevelToPlayerSize (): boolean {
    return this.config.capLevelToPlayerSize;
  }

  set capLevelToPlayerSize (shouldStartCapping: boolean) {
    const newCapLevelToPlayerSize = !!shouldStartCapping;

    if (newCapLevelToPlayerSize !== this.config.capLevelToPlayerSize) {
      if (newCapLevelToPlayerSize) {
        this.capLevelController.startCapping(); // If capping occurs, nextLevelSwitch will happen based on size.
      } else {
        this.capLevelController.stopCapping();
        this.autoLevelCapping = -1;
        this.streamController.nextLevelSwitch(); // Now we're uncapped, get the next level asap.
      }

      this.config.capLevelToPlayerSize = newCapLevelToPlayerSize;
    }
  }

  get autoLevelCapping (): number {
    return this._autoLevelCapping;
  }

  get bandwidthEstimate (): number {
    const bwEstimator = this.abrController._bwEstimator;
    return bwEstimator ? bwEstimator.getEstimate() : NaN;
  }

  set autoLevelCapping (newLevel: number) {
    this._autoLevelCapping = newLevel;
  }

  get autoLevelEnabled (): boolean {
    return (this.levelController.manualLevel === -1);
  }

  get manualLevel (): number {
    return this.levelController.manualLevel;
  }

  get minAutoLevel (): number {
    const { levels, config: { minAutoBitrate } } = this;
    const len = levels ? levels.length : 0;

    for (let i = 0; i < len; i++) {
      const levelNextBitrate = levels[i].realBitrate
        ? Math.max(levels[i].realBitrate, levels[i].bitrate)
        : levels[i].bitrate;

      if (levelNextBitrate > minAutoBitrate) {
        return i;
      }
    }

    return 0;
  }

  get maxAutoLevel (): number {
    const { levels, autoLevelCapping } = this;

    let maxAutoLevel;
    if (autoLevelCapping === -1 && levels && levels.length) {
      maxAutoLevel = levels.length - 1;
    } else {
      maxAutoLevel = autoLevelCapping;
    }

    return maxAutoLevel;
  }

  get nextAutoLevel (): number {
    return Math.min(Math.max(this.abrController.nextAutoLevel, this.minAutoLevel), this.maxAutoLevel);
  }

  set nextAutoLevel (nextLevel: number) {
    this.abrController.nextAutoLevel = Math.max(this.minAutoLevel, nextLevel);
  }

  get audioTracks (): any[] {
    const audioTrackController = this.audioTrackController;
    return audioTrackController ? audioTrackController.audioTracks : [];
  }

  get audioTrack (): number {
    const audioTrackController = this.audioTrackController;
    return audioTrackController ? audioTrackController.audioTrack : -1;
  }

  set audioTrack (audioTrackId: number) {
    const audioTrackController = this.audioTrackController;
    if (audioTrackController) {
      audioTrackController.audioTrack = audioTrackId;
    }
  }

  get liveSyncPosition (): number {
    return this.streamController.liveSyncPosition;
  }

}
