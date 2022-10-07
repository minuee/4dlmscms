import Event from '../events';
import TaskLoop from '../task-loop';
import { logger } from '../utils/logger';
import { ErrorTypes, ErrorDetails } from '../errors';

class AudioTrackController extends TaskLoop {
  constructor (hls) {
    super(hls,
      Event.MANIFEST_LOADING,
      Event.MANIFEST_PARSED,
      Event.AUDIO_TRACK_LOADED,
      Event.AUDIO_TRACK_SWITCHED,
      Event.LEVEL_LOADED,
      Event.ERROR
    );

    this._trackId = -1;
    this._selectDefaultTrack = true;
    this.tracks = [];
    this.trackIdBlacklist = Object.create(null);
    this.audioGroupId = null;
  }

  onManifestLoading () {
    this.tracks = [];
    this._trackId = -1;
    this._selectDefaultTrack = true;
    this.audioGroupId = null;
  }

  onManifestParsed (data) {
    const tracks = this.tracks = data.audioTracks || [];
    this.hls.trigger(Event.AUDIO_TRACKS_UPDATED, { audioTracks: tracks });

    this._selectAudioGroup(this.hls.nextLoadLevel);
  }

  onAudioTrackLoaded (data) {
    if (data.id >= this.tracks.length) {
      return;
    }

    this.tracks[data.id].details = data.details;

    if (data.details.live && !this.hasInterval()) {
      const updatePeriodMs = data.details.targetduration * 1000;
      this.setInterval(updatePeriodMs);
    }

    if (!data.details.live && this.hasInterval()) {
      this.clearInterval();
    }
  }

  onAudioTrackSwitched (data) {
    const audioGroupId = this.tracks[data.id].groupId;
    if (audioGroupId && (this.audioGroupId !== audioGroupId)) {
      this.audioGroupId = audioGroupId;
    }
  }

  onLevelLoaded (data) {
    this._selectAudioGroup(data.level);
  }

  onError (data) {
    // Only handle network errors
    if (data.type !== ErrorTypes.NETWORK_ERROR) {
      return;
    }

    // If fatal network error, cancel update task
    if (data.fatal) {
      this.clearInterval();
    }

    // If not an audio-track loading error don't handle further
    if (data.details !== ErrorDetails.AUDIO_TRACK_LOAD_ERROR) {
      return;
    }

    this._handleLoadError();
  }

  get audioTracks () {
    return this.tracks;
  }

  get audioTrack () {
    return this._trackId;
  }

  set audioTrack (newId) {
    this._setAudioTrack(newId);
    this._selectDefaultTrack = false;
  }

  _setAudioTrack (newId) {
    // noop on same audio track id as already set
    if (this._trackId === newId && this.tracks[this._trackId].details) {
      return;
    }

    // check if level idx is valid
    if (newId < 0 || newId >= this.tracks.length) {
      return;
    }

    const audioTrack = this.tracks[newId];

    this.clearInterval();
    this._trackId = newId;

    const { url, type, id } = audioTrack;
    this.hls.trigger(Event.AUDIO_TRACK_SWITCHING, { id, type, url });
    this._loadTrackDetailsIfNeeded(audioTrack);
  }

  doTick () {
    this._updateTrack(this._trackId);
  }

  _selectAudioGroup (levelId) {
    const levelInfo = this.hls.levels[levelId];

    if (!levelInfo || !levelInfo.audioGroupIds) {
      return;
    }

    const audioGroupId = levelInfo.audioGroupIds[levelInfo.urlId];
    if (this.audioGroupId !== audioGroupId) {
      this.audioGroupId = audioGroupId;
      this._selectInitialAudioTrack();
    }
  }

  _selectInitialAudioTrack () {
    let tracks = this.tracks;
    if (!tracks.length) {
      return;
    }

    const currentAudioTrack = this.tracks[this._trackId];

    let name = null;
    if (currentAudioTrack) {
      name = currentAudioTrack.name;
    }

    if (this._selectDefaultTrack) {
      const defaultTracks = tracks.filter((track) => track.default);
      if (defaultTracks.length) {
        tracks = defaultTracks;
      }  
    }

    let trackFound = false;

    const traverseTracks = () => {
      tracks.forEach((track) => {
        if (trackFound) {
          return;
        }
        if ((!this.audioGroupId || track.groupId === this.audioGroupId) &&
          (!name || name === track.name)) {
          this._setAudioTrack(track.id);
          trackFound = true;
        }
      });
    };

    traverseTracks();

    if (!trackFound) {
      name = null;
      traverseTracks();
    }

    if (!trackFound) {
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.MEDIA_ERROR,
        details: ErrorDetails.AUDIO_TRACK_LOAD_ERROR,
        fatal: true
      });
    }
  }

  _needsTrackLoading (audioTrack) {
    const { details, url } = audioTrack;

    if (!details || details.live) {
      return !!url;
    }

    return false;
  }

  _loadTrackDetailsIfNeeded (audioTrack) {
    if (this._needsTrackLoading(audioTrack)) {
      const { url, id } = audioTrack;
      this.hls.trigger(Event.AUDIO_TRACK_LOADING, { url, id });
    }
  }

  _updateTrack (newId) {
    if (newId < 0 || newId >= this.tracks.length) {
      return;
    }

    this.clearInterval();
    this._trackId = newId;
    const audioTrack = this.tracks[newId];
    this._loadTrackDetailsIfNeeded(audioTrack);
  }

  _handleLoadError () {
    this.trackIdBlacklist[this._trackId] = true;

    const previousId = this._trackId;
    const { name, language } = this.tracks[previousId];
    let newId = previousId;

    for (let i = 0; i < this.tracks.length; i++) {
      if (this.trackIdBlacklist[i]) {
        continue;
      }
      const newTrack = this.tracks[i];
      if (newTrack.name === name) {
        newId = i;
        break;
      }
    }

    if (newId === previousId) {
      return;
    }

    this._setAudioTrack(newId);
  }
}

export default AudioTrackController;
