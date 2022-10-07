import Events from '../events';
import EventHandler from '../event-handler';
import { ErrorTypes, ErrorDetails } from '../errors';
import { isCodecSupportedInMp4 } from '../utils/codecs';
import { addGroupId, computeReloadInterval } from './level-helper';

//let chromeOrFirefox;
export default class LevelController extends EventHandler {
  constructor (hls) {
    super(hls,
      Events.MANIFEST_LOADED,
      Events.LEVEL_LOADED,
      //Events.AUDIO_TRACK_SWITCHED,
      Events.FRAG_LOADED,
      Events.GOP_LEVEL_SWITCHING,
      Events.ERROR
    );

    this.canload = false;
    this.currentLevelIndex = null;
    this.currentLevelHeight = null;
    this.manualLevelIndex = -1;
    this.timer = null;

    this._levels = [];
    this._levels_GOP = [];
    this._levels_FRAME = [];

    //chromeOrFirefox = /chrome|firefox/.test(navigator.userAgent.toLowerCase());
  }

  onHandlerDestroying () {
    this.clearTimer();
    this.manualLevelIndex = -1;
  }

  clearTimer () {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  startLoad () {
    let levels = this._levels;

    this.canload = true;
    this.levelRetryCount = 0;

    if (levels) {
      levels.forEach(level => {
        level.loadError = 0;
      });
    }

    if (this.timer !== null) {
      this.loadLevel();
    }
  }

  stopLoad () {
    this.canload = false;
  }

  onManifestLoaded (data) {
    let levels = [];
    let frameLevels = [];
    //let audioTracks = [];
    let bitrateStart;
    let levelSet = {};
    let levelFromSet = null;
    let videoCodecFound = false;
    //let audioCodecFound = false;

    // regroup redundant levels together
    data.levels.forEach(level => {
      level.loadError = 0;
      level.fragmentError = false;

      videoCodecFound = videoCodecFound || !!level.videoCodec;
      //audioCodecFound = audioCodecFound || !!level.audioCodec;

      // if (chromeOrFirefox && level.audioCodec && level.audioCodec.indexOf('mp4a.40.34') !== -1) {
      //   level.audioCodec = undefined;
      // }

      levelFromSet = levelSet[level.bitrate]; // FIXME: we would also have to match the resolution here

      if (!levelFromSet) {
        level.url = [level.url];
        level.urlId = 0;
        levelSet[level.bitrate] = level;
        levels.push(level);
      } else {
        levelFromSet.url.push(level.url);
      }

      // if (attributes) {
      //   if (attributes.AUDIO) {
      //     addGroupId(levelFromSet || level, 'audio', attributes.AUDIO);
      //   }       
      // }
    });

    //if (videoCodecFound && audioCodecFound) {
    if (videoCodecFound) {
      levels = levels.filter(({ videoCodec }) => !!videoCodec);
    }

    //levels = levels.filter(({ audioCodec, videoCodec }) => {
    levels = levels.filter(({ videoCodec }) => {
      //return (!audioCodec || isCodecSupportedInMp4(audioCodec, 'audio')) && (!videoCodec || isCodecSupportedInMp4(videoCodec, 'video'));
      return (!videoCodec || isCodecSupportedInMp4(videoCodec, 'video'));
    });

    // if (data.audioTracks) {
    //   audioTracks = data.audioTracks.filter(track => !track.audioCodec || isCodecSupportedInMp4(track.audioCodec, 'audio'));
    //   audioTracks.forEach((track, index) => {
    //     track.id = index;
    //   });
    // }

    // IFrame Levels Start ****************************************************************************||
    if(data.frameLevels && data.frameLevels.length > 0) {
      frameLevels = this.setFrameLevels(data);      
    }
    // IFrame Levels Start ****************************************************************************||

    if (levels.length > 0) {
      bitrateStart = levels[0].bitrate;
      levels.sort((a, b) => a.bitrate - b.bitrate);
      this._levels = this._levels_GOP = levels;

      for (let i = 0; i < levels.length; i++) {
        if (levels[i].bitrate === bitrateStart) {
          this._firstLevel = i;
          break;
        }
      }

      // const audioOnly = audioCodecFound && !videoCodecFound;
      // this.hls.trigger(Events.MANIFEST_PARSED, {
      //   levels,
      //   audioTracks,
      //   firstLevel: this._firstLevel,
      //   stats: data.stats,
      //   audio: audioCodecFound,
      //   video: videoCodecFound,
      //   altAudio: !audioOnly && audioTracks.some(t => !!t.url)
      // });

      if (frameLevels && frameLevels.length > 0) {
        frameLevels.sort((a, b) => a.bitrate - b.bitrate);
        this._levels_FRAME = frameLevels;
      }

      this.hls.trigger(Events.MANIFEST_PARSED, {
        levels,
        frameLevels,
        firstLevel: this._firstLevel,
        stats: data.stats,
        video: videoCodecFound,
      });
    } else {
      this.hls.trigger(Events.ERROR, {
        type: ErrorTypes.MEDIA_ERROR,
        details: ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR,
        fatal: true,
        url: this.hls.url,
        reason: 'no level with compatible codecs found in manifest'
      });
    }
  }  

  setLevelAuto() {
    this.hls.trigger(Event.LEVEL_SWITCHING, {});
  }

  setLevelInternal (newLevel) {
    const levels = this._levels;
    const hls = this.hls;

    if (newLevel >= 0 && newLevel < levels.length) {
      this.clearTimer();

      const level = levels[newLevel];
      const levelDetails = level.details;

      if (this.currentLevelIndex !== newLevel) {
        this.currentLevelIndex = newLevel;
        this.currentLevelHeight = level.height;
        const levelProperties = levels[newLevel];
        levelProperties.level = newLevel;
        hls.trigger(Events.LEVEL_SWITCHING, levelProperties);
      }      

      if (!levelDetails || levelDetails.live) {
        let urlId = level.urlId;
        hls.trigger(
          Events.LEVEL_LOADING, 
          { 
            url: level.url[urlId], 
            fixedurl: level.fixedurl,
            level: newLevel, 
            id: urlId,
            levelDetails: levelDetails
          }
        );
      }
    } else {
      hls.trigger(Events.ERROR, {
        type: ErrorTypes.OTHER_ERROR,
        details: ErrorDetails.LEVEL_SWITCH_ERROR,
        level: newLevel,
        fatal: false,
        reason: 'invalid level idx'
      });
    }
  }  

  onError (data) {
    if (data.fatal) {
      if (data.type === ErrorTypes.NETWORK_ERROR) {
        this.clearTimer();
      }
      return;
    }

    let levelError = false, fragmentError = false;
    let levelIndex;

    switch (data.details) {
      case ErrorDetails.FRAG_LOAD_ERROR:
      case ErrorDetails.FRAG_LOAD_TIMEOUT:
      case ErrorDetails.KEY_LOAD_ERROR:
      case ErrorDetails.KEY_LOAD_TIMEOUT:
        levelIndex = data.frag.level;
        fragmentError = true;
        break;
      case ErrorDetails.LEVEL_LOAD_ERROR:
      case ErrorDetails.LEVEL_LOAD_TIMEOUT:
        levelIndex = data.context.level;
        levelError = true;
        break;
      case ErrorDetails.REMUX_ALLOC_ERROR:
        levelIndex = data.level;
        levelError = true;
        break;
      default:
        break;
    }

    if (levelIndex !== undefined) {
      this.recoverLevel(data, levelIndex, levelError, fragmentError);
    }
  }

  recoverLevel (errorEvent, levelIndex, levelError, fragmentError) {
    let { config } = this.hls;
    let { details: errorDetails } = errorEvent;
    let level = this._levels[levelIndex];
    let redundantLevels, delay, nextLevel;

    level.loadError++;
    level.fragmentError = fragmentError;

    if (levelError) {
      if ((this.levelRetryCount + 1) <= config.levelLoadingMaxRetry) {
        delay = Math.min(Math.pow(2, this.levelRetryCount) * config.levelLoadingRetryDelay, config.levelLoadingMaxRetryTimeout);
        this.timer = setTimeout(() => this.loadLevel(), delay);
        errorEvent.levelRetry = true;
        this.levelRetryCount++;
      } else {
        this.currentLevelIndex = null;
        this.clearTimer();
        errorEvent.fatal = true;
        return;
      }
    }

    if (levelError || fragmentError) {
      redundantLevels = level.url.length;

      if (redundantLevels > 1 && level.loadError < redundantLevels) {
        level.urlId = (level.urlId + 1) % redundantLevels;
        level.details = undefined;
      } else {
        if (this.manualLevelIndex === -1) {
          nextLevel = (levelIndex === 0) ? this._levels.length - 1 : levelIndex - 1;
          this.hls.nextAutoLevel = this.currentLevelIndex = nextLevel;
        } else if (fragmentError) {
          this.currentLevelIndex = null;
        }
      }
    }
  }

  onFragLoaded ({ frag }) {
    if (frag !== undefined && frag.type === 'main') {
      const level = this._levels[frag.level];
      if (level !== undefined) {
        level.fragmentError = false;
        level.loadError = 0;
        this.levelRetryCount = 0;
      }
    }
  }

  onLevelLoaded (data) {
    const { level, details } = data;
    if (level !== this.currentLevelIndex) {
      return;
    }

    const curLevel = this._levels[level];
    if (!curLevel.fragmentError) {
      curLevel.loadError = 0;
      this.levelRetryCount = 0;
    }

    if (details.live) {
      const reloadInterval = computeReloadInterval(curLevel.details, details, data.stats.trequest);
      this.timer = setTimeout(() => this.loadLevel(), reloadInterval);
    } else {
      this.clearTimer();
    }
  }

  // onAudioTrackSwitched (data) {
  //   const audioGroupId = this.hls.audioTracks[data.id].groupId;

  //   const currentLevel = this.hls.levels[this.currentLevelIndex];
  //   if (!currentLevel) {
  //     return;
  //   }

  //   if (currentLevel.audioGroupIds) {
  //     let urlId = -1;

  //     for (let i = 0; i < currentLevel.audioGroupIds.length; i++) {
  //       if (currentLevel.audioGroupIds[i] === audioGroupId) {
  //         urlId = i;
  //         break;
  //       }
  //     }

  //     if (urlId !== currentLevel.urlId) {
  //       currentLevel.urlId = urlId;
  //       this.startLoad();
  //     }
  //   }
  // }

  onGopLevelSwitching (data) {
    switch(data.gop) {
      case 30:
        this._levels = this._levels_GOP;
        break;
      case 1:
        this._levels = this._levels_FRAME;
        break;
      default:
        break;
    }
  }

  loadLevel () {
    if (this.currentLevelIndex !== null && this.canload) {
      // Timeslice and Timemachine is used levels_FRAME
      //const levelObject = this._levels[this.currentLevelIndex];
      const levelObject = this._levels_GOP[this.currentLevelIndex];

      if (typeof levelObject === 'object' && levelObject.url.length > 0) {
        const level = this.currentLevelIndex;
        const id = levelObject.urlId;
        const url = levelObject.url[id];
        const fixedurl = levelObject.fixedurl;
        const levelDetails = levelObject.details;

        this.hls.trigger(
          Events.LEVEL_LOADING, 
          { 
            url,
            fixedurl,
            level, 
            id,
            levelDetails
          }
        );
      }
    }
  }  

  removeLevel (levelIndex, urlId) {
    const levels = this.levels.filter((level, index) => {
      if (index !== levelIndex) {
        return true;
      }

      if (level.url.length > 1 && urlId !== undefined) {
        level.url = level.url.filter((url, id) => id !== urlId);
        level.urlId = 0;
        return true;
      }
      return false;
    }).map((level, index) => {
      const { details } = level;
      if (details && details.fragments) {
        details.fragments.forEach((fragment) => {
          fragment.level = index;
        });
      }
      return level;
    });

    this._levels = levels;

    this.hls.trigger(Events.LEVELS_UPDATED, { levels });
  }

  setFrameLevels (data) {
    let levelSet = {};
    let levelFromSet = null;
    let videoCodecFound = false;
    let frameLevels = [];

    data.frameLevels.forEach(level => {
      level.loadError = 0;
      level.fragmentError = false;

      videoCodecFound = videoCodecFound || !!level.videoCodec;

      levelFromSet = levelSet[level.bitrate]; // FIXME: we would also have to match the resolution here

      if (!levelFromSet) {
        level.url = [level.url];
        level.urlId = 0;
        levelSet[level.bitrate] = level;
        frameLevels.push(level);
      } else {
        levelFromSet.url.push(level.url);
      }
    });

    /* Exists Same VideoCodec 
    if (videoCodecFound) {
      frameLevels = frameLevels.filter(({ videoCodec }) => !!videoCodec);
    }
    */

    frameLevels = frameLevels.filter(({ videoCodec }) => {
      return (!videoCodec || isCodecSupportedInMp4(videoCodec, 'video'));
    });

    return frameLevels;
  }

  get levels () {
    return this._levels;
  }

  get level () {
    return this.currentLevelIndex;
  }

  get levelHeight () {
    return this.currentLevelHeight;
  }

  set level (newLevel) {
    let levels = this._levels;
    if (levels) {
      newLevel = Math.min(newLevel, levels.length - 1);
      if (this.currentLevelIndex !== newLevel || !levels[newLevel].details) {
        this.setLevelInternal(newLevel);
      }
    }
  }

  get manualLevel () {
    return this.manualLevelIndex;
  }

  set manualLevel (newLevel) {
    this.manualLevelIndex = newLevel;
    if (this._startLevel === undefined) {
      this._startLevel = newLevel;
    }

    if (newLevel !== -1) {
      this.level = newLevel;
    } else {
      this.setLevelAuto();
    }
  }

  get firstLevel () {
    return this._firstLevel;
  }

  set firstLevel (newLevel) {
    this._firstLevel = newLevel;
  }

  get startLevel () {
    if (this._startLevel === undefined) {
      let configStartLevel = this.hls.config.startLevel;
      if (configStartLevel !== undefined) {
        return configStartLevel;
      } else {
        return this._firstLevel;
      }
    } else {
      return this._startLevel;
    }
  }

  set startLevel (newLevel) {
    this._startLevel = newLevel;
  }

  get nextLoadLevel () {
    if (this.manualLevelIndex !== -1) {
      return this.manualLevelIndex;
    } else {
      return this.hls.nextAutoLevel;
    }
  }

  set nextLoadLevel (nextLevel) {
    this.level = nextLevel;
    if (this.manualLevelIndex === -1) {
      this.hls.nextAutoLevel = nextLevel;
    }
  }
}
