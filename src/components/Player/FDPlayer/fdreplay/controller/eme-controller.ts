import EventHandler from '../event-handler';
import Event from '../events';
import { ErrorTypes, ErrorDetails } from '../errors';

import { DRMSystemOptions, EMEControllerConfig } from '../config';
import { KeySystems, MediaKeyFunc } from '../utils/mediakeys-helper';

const MAX_LICENSE_REQUEST_FAILURES = 3;

const createWidevineMediaKeySystemConfigurations = function (
  audioCodecs: string[],
  videoCodecs: string[],
  drmSystemOptions: DRMSystemOptions
): MediaKeySystemConfiguration[] { /* jshint ignore:line */
  const baseConfig: MediaKeySystemConfiguration = {
    audioCapabilities: [], // { contentType: 'audio/mp4; codecs="mp4a.40.2"' }
    videoCapabilities: [] // { contentType: 'video/mp4; codecs="avc1.42E01E"' }
  };

  audioCodecs.forEach((codec) => {
    baseConfig.audioCapabilities!.push({
      contentType: `audio/mp4; codecs="${codec}"`,
      robustness: drmSystemOptions.audioRobustness || ''
    });
  });

  videoCodecs.forEach((codec) => {
    baseConfig.videoCapabilities!.push({
      contentType: `video/mp4; codecs="${codec}"`,
      robustness: drmSystemOptions.videoRobustness || ''
    });
  });

  return [ baseConfig ];
};

const getSupportedMediaKeySystemConfigurations = function (
  keySystem: KeySystems,
  audioCodecs: string[],
  videoCodecs: string[],
  drmSystemOptions: DRMSystemOptions
): MediaKeySystemConfiguration[] {
  switch (keySystem) {
    case KeySystems.WIDEVINE:
      return createWidevineMediaKeySystemConfigurations(audioCodecs, videoCodecs, drmSystemOptions);
    default:
      throw new Error(`Unknown key-system: ${keySystem}`);
  }
};

interface MediaKeysListItem {
  mediaKeys?: MediaKeys,
  mediaKeysSession?: MediaKeySession,
  mediaKeysSessionInitialized: boolean;
  mediaKeySystemAccess: MediaKeySystemAccess;
  mediaKeySystemDomain: KeySystems;
}

class EMEController extends EventHandler {
  private _widevineLicenseUrl?: string;
  private _licenseXhrSetup?: (xhr: XMLHttpRequest, url: string) => void;
  private _emeEnabled: boolean;
  private _requestMediaKeySystemAccess: MediaKeyFunc | null;
  private _drmSystemOptions: DRMSystemOptions;

  private _config: EMEControllerConfig;
  private _mediaKeysList: MediaKeysListItem[] = [];
  private _media: HTMLMediaElement | null = null;
  private _hasSetMediaKeys: boolean = false;
  private _requestLicenseFailureCount: number = 0;

  private mediaKeysPromise: Promise<MediaKeys> | null = null;

  constructor (hls) {
    super(hls,
      Event.MEDIA_ATTACHED,
      Event.MEDIA_DETACHED,
      Event.MANIFEST_PARSED
    );
    this._config = hls.config;

    this._widevineLicenseUrl = this._config.widevineLicenseUrl;
    this._licenseXhrSetup = this._config.licenseXhrSetup;
    this._emeEnabled = this._config.emeEnabled;
    this._requestMediaKeySystemAccess = this._config.requestMediaKeySystemAccessFunc;
    this._drmSystemOptions = hls.config.drmSystemOptions;
  }

  getLicenseServerUrl (keySystem: KeySystems): string {
    switch (keySystem) {
      case KeySystems.WIDEVINE:
        if (!this._widevineLicenseUrl) {
          break;
        }
        return this._widevineLicenseUrl;
      }

      throw new Error(`no license server URL configured for key-system "${keySystem}"`);
  }

  private _attemptKeySystemAccess (keySystem: KeySystems, audioCodecs: string[], videoCodecs: string[]) {
    const mediaKeySystemConfigs = getSupportedMediaKeySystemConfigurations(keySystem, audioCodecs, videoCodecs, this._drmSystemOptions);
    const keySystemAccessPromise = this.requestMediaKeySystemAccess(keySystem, mediaKeySystemConfigs);

    this.mediaKeysPromise = keySystemAccessPromise.then((mediaKeySystemAccess) =>
      this._onMediaKeySystemAccessObtained(keySystem, mediaKeySystemAccess));

    // keySystemAccessPromise.catch((err) => {
    //   logger.error(`Failed to obtain key-system "${keySystem}" access:`, err);
    // });
  }

  get requestMediaKeySystemAccess () {
    if (!this._requestMediaKeySystemAccess) {
      throw new Error('No requestMediaKeySystemAccess function configured');
    }

    return this._requestMediaKeySystemAccess;
  }

  private _onMediaKeySystemAccessObtained (keySystem: KeySystems, mediaKeySystemAccess: MediaKeySystemAccess): Promise<MediaKeys> {
    const mediaKeysListItem: MediaKeysListItem = {
      mediaKeysSessionInitialized: false,
      mediaKeySystemAccess: mediaKeySystemAccess,
      mediaKeySystemDomain: keySystem
    };

    this._mediaKeysList.push(mediaKeysListItem);

    const mediaKeysPromise = Promise.resolve().then(() => mediaKeySystemAccess.createMediaKeys())
      .then((mediaKeys) => {
        mediaKeysListItem.mediaKeys = mediaKeys;
        this._onMediaKeysCreated();
        return mediaKeys;
      });

    // mediaKeysPromise.catch((err) => {
    //   logger.error('Failed to create media-keys:', err);
    // });

    return mediaKeysPromise;
  }

  private _onMediaKeysCreated () {
    this._mediaKeysList.forEach((mediaKeysListItem) => {
      if (!mediaKeysListItem.mediaKeysSession) {
        mediaKeysListItem.mediaKeysSession = mediaKeysListItem.mediaKeys!.createSession();
        this._onNewMediaKeySession(mediaKeysListItem.mediaKeysSession);
      }
    });
  }

  private _onNewMediaKeySession (keySession: MediaKeySession) {
    keySession.addEventListener('message', (event: MediaKeyMessageEvent) => {
      this._onKeySessionMessage(keySession, event.message);
    }, false);
  }

  private _onKeySessionMessage (keySession: MediaKeySession, message: ArrayBuffer) {
    this._requestLicense(message, (data: ArrayBuffer) => {
      keySession.update(data);
    });
  }

  private _onMediaEncrypted = (e: MediaEncryptedEvent) => {
    if (!this.mediaKeysPromise) {
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.KEY_SYSTEM_ERROR,
        details: ErrorDetails.KEY_SYSTEM_NO_KEYS,
        fatal: true
      });
      return;
    }

    const finallySetKeyAndStartSession = (mediaKeys) => {
      if (!this._media) {
        return;
      }
      this._attemptSetMediaKeys(mediaKeys);
      this._generateRequestWithPreferredKeySession(e.initDataType, e.initData);
    };

    this.mediaKeysPromise.then(finallySetKeyAndStartSession).catch(finallySetKeyAndStartSession);
  }

  private _attemptSetMediaKeys (mediaKeys?: MediaKeys) {
    if (!this._media) {
      throw new Error('Attempted to set mediaKeys without first attaching a media element');
    }

    if (!this._hasSetMediaKeys) {
      const keysListItem = this._mediaKeysList[0];
      if (!keysListItem || !keysListItem.mediaKeys) {
        this.hls.trigger(Event.ERROR, {
          type: ErrorTypes.KEY_SYSTEM_ERROR,
          details: ErrorDetails.KEY_SYSTEM_NO_KEYS,
          fatal: true
        });
        return;
      }

      this._media.setMediaKeys(keysListItem.mediaKeys);
      this._hasSetMediaKeys = true;
    }
  }

  private _generateRequestWithPreferredKeySession (initDataType: string, initData: ArrayBuffer | null) {
    const keysListItem = this._mediaKeysList[0];
    if (!keysListItem) {
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.KEY_SYSTEM_ERROR,
        details: ErrorDetails.KEY_SYSTEM_NO_ACCESS,
        fatal: true
      });
      return;
    }

    if (keysListItem.mediaKeysSessionInitialized) {
      return;
    }

    const keySession = keysListItem.mediaKeysSession;
    if (!keySession) {
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.KEY_SYSTEM_ERROR,
        details: ErrorDetails.KEY_SYSTEM_NO_SESSION,
        fatal: true
      });
      return;
    }

    if (!initData) {
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.KEY_SYSTEM_ERROR,
        details: ErrorDetails.KEY_SYSTEM_NO_INIT_DATA,
        fatal: true
      });
      return;
    }

    keysListItem.mediaKeysSessionInitialized = true;

    keySession.generateRequest(initDataType, initData)
      .catch((err) => {
        this.hls.trigger(Event.ERROR, {
          type: ErrorTypes.KEY_SYSTEM_ERROR,
          details: ErrorDetails.KEY_SYSTEM_NO_SESSION,
          fatal: false
        });
      });
  }

  private _createLicenseXhr (url: string, keyMessage: ArrayBuffer, callback: (data: ArrayBuffer) => void): XMLHttpRequest {
    const xhr = new XMLHttpRequest();
    const licenseXhrSetup = this._licenseXhrSetup;

    try {
      if (licenseXhrSetup) {
        try {
          licenseXhrSetup(xhr, url);
        } catch (e) {
          xhr.open('POST', url, true);
          licenseXhrSetup(xhr, url);
        }
      }

      if (!xhr.readyState) {
        xhr.open('POST', url, true);
      }
    } catch (e) {
      throw new Error(`issue setting up KeySystem license XHR ${e}`);
    }

    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange =
        this._onLicenseRequestReadyStageChange.bind(this, xhr, url, keyMessage, callback);
    return xhr;
  }

  private _onLicenseRequestReadyStageChange (xhr: XMLHttpRequest, url: string, keyMessage: ArrayBuffer, callback: (data: ArrayBuffer) => void) {
    switch (xhr.readyState) {
    case 4:
      if (xhr.status === 200) {
        this._requestLicenseFailureCount = 0;
        callback(xhr.response);
      } else {
        this._requestLicenseFailureCount++;
        if (this._requestLicenseFailureCount > MAX_LICENSE_REQUEST_FAILURES) {
          this.hls.trigger(Event.ERROR, {
            type: ErrorTypes.KEY_SYSTEM_ERROR,
            details: ErrorDetails.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
            fatal: true
          });
          return;
        }
        this._requestLicense(keyMessage, callback);
      }
      break;
    }
  }

  private _generateLicenseRequestChallenge (keysListItem: MediaKeysListItem, keyMessage: ArrayBuffer): ArrayBuffer {
    switch (keysListItem.mediaKeySystemDomain) {
    case KeySystems.WIDEVINE:
      return keyMessage;
    }

    throw new Error(`unsupported key-system: ${keysListItem.mediaKeySystemDomain}`);
  }

  private _requestLicense (keyMessage: ArrayBuffer, callback: (data: ArrayBuffer) => void) {

    const keysListItem = this._mediaKeysList[0];
    if (!keysListItem) {
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.KEY_SYSTEM_ERROR,
        details: ErrorDetails.KEY_SYSTEM_NO_ACCESS,
        fatal: true
      });
      return;
    }

    try {
      const url = this.getLicenseServerUrl(keysListItem.mediaKeySystemDomain);
      const xhr = this._createLicenseXhr(url, keyMessage, callback);
      const challenge = this._generateLicenseRequestChallenge(keysListItem, keyMessage);
      xhr.send(challenge);
    } catch (e) {
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.KEY_SYSTEM_ERROR,
        details: ErrorDetails.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
        fatal: true
      });
    }
  }

  onMediaAttached (data: { media: HTMLMediaElement; }) {
    // if (!this._emeEnabled) {
    //   return;
    // }

    // const media = data.media;
    // this._media = media;
    // media.addEventListener('encrypted', this._onMediaEncrypted);
  }

  onMediaDetached () {
    // const media = this._media;
    // const mediaKeysList = this._mediaKeysList;
    // if (!media) {
    //   return;
    // }
    // media.removeEventListener('encrypted', this._onMediaEncrypted);
    // this._media = null;
    // this._mediaKeysList = [];

    // Promise.all(mediaKeysList.map((mediaKeysListItem) => {
    //   if (mediaKeysListItem.mediaKeysSession) {
    //       return mediaKeysListItem.mediaKeysSession.close().catch(() => {
    //       });
    //   }
    // })).then(() => {
    //   return media.setMediaKeys(null);
    // }).catch(() => {
    //   // Ignore any failures while removing media keys from the video element.
    // });
  }

  onManifestParsed (data: any) {
    // if (!this._emeEnabled) {
    //   return;
    // }

    // const audioCodecs = data.levels.map((level) => level.audioCodec);
    // const videoCodecs = data.levels.map((level) => level.videoCodec);

    // this._attemptKeySystemAccess(KeySystems.WIDEVINE, audioCodecs, videoCodecs);
  }
}

export default EMEController;
