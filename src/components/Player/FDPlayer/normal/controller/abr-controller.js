import Event from '../events';
import EventHandler from '../event-handler';
import { BufferHelper } from '../utils/buffer-helper';
import { ErrorDetails } from '../errors';
import EwmaBandWidthEstimator from '../utils/ewma-bandwidth-estimator';

const { performance } = window;

class AbrController extends EventHandler {
  constructor (hls) {
    super(hls, Event.FRAG_LOADING,
      Event.FRAG_LOADED,
      Event.FRAG_BUFFERED,
      Event.ERROR);
    this.lastLoadedFragLevel = 0;
    this._nextAutoLevel = -1;
    this.hls = hls;
    this.timer = null;
    this._bwEstimator = null;
    this.onCheck = this._abandonRulesCheck.bind(this);
  }

  destroy () {
    this.clearTimer();
    EventHandler.prototype.destroy.call(this);
  }

  onFragLoading (data) {
    const frag = data.frag;
    if (frag.type === 'main') {
      if (!this.timer) {
        this.fragCurrent = frag;
        this.timer = setInterval(this.onCheck, 100);
      }

      if (!this._bwEstimator) {
        const hls = this.hls;
        const config = hls.config;
        const level = frag.level;
        const isLive = hls.levels[level].details.live;

        let ewmaFast;
        let ewmaSlow;
        if (isLive) {
          ewmaFast = config.abrEwmaFastLive;
          ewmaSlow = config.abrEwmaSlowLive;
        } else {
          ewmaFast = config.abrEwmaFastVoD;
          ewmaSlow = config.abrEwmaSlowVoD;
        }
        this._bwEstimator = new EwmaBandWidthEstimator(hls, ewmaSlow, ewmaFast, config.abrEwmaDefaultEstimate);
      }
    }
  }

  _abandonRulesCheck () {

    const hls = this.hls;
    const video = hls.media;
    const frag = this.fragCurrent;

    if (!frag) {
      return;
    }

    const loader = frag.loader;

    if (!loader || (loader.stats && loader.stats.aborted)) {
      this.clearTimer();
      this._nextAutoLevel = -1;
      return;
    }
    let stats = loader.stats;

    if (video && stats && ((!video.paused && (video.playbackRate !== 0)) || !video.readyState) && frag.autoLevel && frag.level) {
      const requestDelay = performance.now() - stats.trequest;
      const playbackRate = Math.abs(video.playbackRate);

      if (requestDelay > (500 * frag.duration / playbackRate)) {
        const levels = hls.levels;
        const loadRate = Math.max(1, stats.bw ? stats.bw / 8 : stats.loaded * 1000 / requestDelay); // byte/s; at least 1 byte/s to avoid division by zero

        const level = levels[frag.level];
        if (!level) {
          return;
        }
        const levelBitrate = level.realBitrate ? Math.max(level.realBitrate, level.bitrate) : level.bitrate;
        const expectedLen = stats.total ? stats.total : Math.max(stats.loaded, Math.round(frag.duration * levelBitrate / 8));
        const pos = video.currentTime;
        const fragLoadedDelay = (expectedLen - stats.loaded) / loadRate;
        const bufferStarvationDelay = (BufferHelper.bufferInfo(video, pos, hls.config.maxBufferHole).end - pos) / playbackRate;

        if ((bufferStarvationDelay < (2 * frag.duration / playbackRate)) && (fragLoadedDelay > bufferStarvationDelay)) {
          const minAutoLevel = hls.minAutoLevel;
          let fragLevelNextLoadedDelay;
          let nextLoadLevel;

          for (nextLoadLevel = frag.level - 1; nextLoadLevel > minAutoLevel; nextLoadLevel--) {
            const levelNextBitrate = levels[nextLoadLevel].realBitrate
              ? Math.max(levels[nextLoadLevel].realBitrate, levels[nextLoadLevel].bitrate)
              : levels[nextLoadLevel].bitrate;

            const fragLevelNextLoadedDelay = frag.duration * levelNextBitrate / (8 * 0.8 * loadRate);

            if (fragLevelNextLoadedDelay < bufferStarvationDelay) {
              break;
            }
          }

          if (fragLevelNextLoadedDelay < fragLoadedDelay) {
            hls.nextLoadLevel = nextLoadLevel;
            this._bwEstimator.sample(requestDelay, stats.loaded);
            loader.abort();
            this.clearTimer();
            hls.trigger(Event.FRAG_LOAD_EMERGENCY_ABORTED, { frag: frag, stats: stats });
          }
        }
      }
    }
  }

  onFragLoaded (data) {
    const frag = data.frag;
    if (frag.type === 'main' && Number.isFinite(frag.sn)) {
      this.clearTimer();
      this.lastLoadedFragLevel = frag.level;
      this._nextAutoLevel = -1;

      if (this.hls.config.abrMaxWithRealBitrate) {
        const level = this.hls.levels[frag.level];
        let loadedBytes = (level.loaded ? level.loaded.bytes : 0) + data.stats.loaded;
        let loadedDuration = (level.loaded ? level.loaded.duration : 0) + data.frag.duration;
        level.loaded = { bytes: loadedBytes, duration: loadedDuration };
        level.realBitrate = Math.round(8 * loadedBytes / loadedDuration);
      }
    }
  }

  onFragBuffered (data) {
    const stats = data.stats;
    const frag = data.frag;

    if (stats.aborted !== true && frag.type === 'main' && Number.isFinite(frag.sn) && (stats.tload === stats.tbuffered)) {

      let fragLoadingProcessingMs = stats.tparsed - stats.trequest;
      this._bwEstimator.sample(fragLoadingProcessingMs, stats.loaded);
      stats.bwEstimate = this._bwEstimator.getEstimate();
    }
  }

  onError (data) {
    switch (data.details) {
    case ErrorDetails.FRAG_LOAD_ERROR:
    case ErrorDetails.FRAG_LOAD_TIMEOUT:
      this.clearTimer();
      break;
    default:
      break;
    }
  }

  clearTimer () {
    clearInterval(this.timer);
    this.timer = null;
  }

  // return next auto level
  get nextAutoLevel () {
    const forcedAutoLevel = this._nextAutoLevel;
    const bwEstimator = this._bwEstimator;
    if (forcedAutoLevel !== -1 && (!bwEstimator || !bwEstimator.canEstimate())) {
      return forcedAutoLevel;
    }

    let nextABRAutoLevel = this._nextABRAutoLevel;
    if (forcedAutoLevel !== -1) {
      nextABRAutoLevel = Math.min(forcedAutoLevel, nextABRAutoLevel);
    }

    return nextABRAutoLevel;
  }
  get _nextABRAutoLevel () {
    let hls = this.hls;
    const { maxAutoLevel, levels, config, minAutoLevel } = hls;
    const video = hls.media;
    const currentLevel = this.lastLoadedFragLevel;
    const currentFragDuration = this.fragCurrent ? this.fragCurrent.duration : 0;
    const pos = (video ? video.currentTime : 0);

    const playbackRate = ((video && (video.playbackRate !== 0)) ? Math.abs(video.playbackRate) : 1.0);
    const avgbw = this._bwEstimator ? this._bwEstimator.getEstimate() : config.abrEwmaDefaultEstimate;
    const bufferStarvationDelay = (BufferHelper.bufferInfo(video, pos, config.maxBufferHole).end - pos) / playbackRate;

    let bestLevel = this._findBestLevel(currentLevel, currentFragDuration, avgbw, minAutoLevel, maxAutoLevel, bufferStarvationDelay, config.abrBandWidthFactor, config.abrBandWidthUpFactor, levels);
    if (bestLevel >= 0) {
      return bestLevel;
    } else {
      let maxStarvationDelay = currentFragDuration ? Math.min(currentFragDuration, config.maxStarvationDelay) : config.maxStarvationDelay;
      let bwFactor = config.abrBandWidthFactor;
      let bwUpFactor = config.abrBandWidthUpFactor;

      bestLevel = this._findBestLevel(currentLevel, currentFragDuration, avgbw, minAutoLevel, maxAutoLevel, bufferStarvationDelay + maxStarvationDelay, bwFactor, bwUpFactor, levels);
      return Math.max(bestLevel, 0);
    }
  }

  _findBestLevel (currentLevel, currentFragDuration, currentBw, minAutoLevel, maxAutoLevel, maxFetchDuration, bwFactor, bwUpFactor, levels) {
    for (let i = maxAutoLevel; i >= minAutoLevel; i--) {
      let levelInfo = levels[i];

      if (!levelInfo) {
        continue;
      }

      const levelDetails = levelInfo.details;
      const avgDuration = levelDetails ? levelDetails.totalduration / levelDetails.fragments.length : currentFragDuration;
      const live = levelDetails ? levelDetails.live : false;

      let adjustedbw;

      if (i <= currentLevel) {
        adjustedbw = bwFactor * currentBw;
      } else {
        adjustedbw = bwUpFactor * currentBw;
      }

      const bitrate = levels[i].realBitrate ? Math.max(levels[i].realBitrate, levels[i].bitrate) : levels[i].bitrate;
      const fetchDuration = bitrate * avgDuration / adjustedbw;

      if (adjustedbw > bitrate &&
        (!fetchDuration || live || fetchDuration < maxFetchDuration)) {
        return i;
      }
    }
    return -1;
  }

  set nextAutoLevel (nextLevel) {
    this._nextAutoLevel = nextLevel;
  }
}

export default AbrController;
