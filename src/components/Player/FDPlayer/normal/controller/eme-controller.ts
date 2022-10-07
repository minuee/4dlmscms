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

  return [
    baseConfig
  ];
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

  /**
     * @constructs
     * @param {Hls} hls Our Hls.js instance
     */
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

  /**
   * @param {string} keySystem Identifier for the key-system, see `KeySystems` enum
   * @returns {string} License server URL for key-system (if any configured, otherwise causes error)
   * @throws if a unsupported keysystem is passed
   */
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

    keySystemAccessPromise.catch((err) => {
     console.log(`Failed to obtain key-system "${keySystem}" access:`, err);
    });
  }

  get requestMediaKeySystemAccess () {
    if (!this._requestMediaKeySystemAccess) {
      throw new Error('No requestMediaKeySystemAccess function configured');
    }

    return this._requestMediaKeySystemAccess;
  }

  private _onMediaKeySystemAccessObtained (keySystem: KeySystems, mediaKeySystemAccess: MediaKeySystemAccess): Promise<MediaKeys> {
    console.log(`Access for key-system "${keySystem}" obtained`);
    const mediaKeysListItem: MediaKeysListItem = {
      mediaKeysSessionInitialized: false,
      mediaKeySystemAccess: mediaKeySystemAccess,
      mediaKeySystemDomain: keySystem
    };

    this._mediaKeysList.push(mediaKeysListItem);

    const mediaKeysPromise = Promise.resolve().then(() => mediaKeySystemAccess.createMediaKeys())
      .then((mediaKeys) => {
        mediaKeysListItem.mediaKeys = mediaKeys;

        console.log(`Media-keys created for key-system "${keySystem}"`);

        this._onMediaKeysCreated();

        return mediaKeys;
      });

    mediaKeysPromise.catch((err) => {
      console.error('Failed to create media-keys:', err);
    });

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
    console.log(`New key-system session ${keySession.sessionId}`);

    keySession.addEventListener('message', (event: MediaKeyMessageEvent) => {
      this._onKeySessionMessage(keySession, event.message);
    }, false);
  }

  private _onKeySessionMessage (keySession: MediaKeySession, message: ArrayBuffer) {
    console.log('Got EME message event, creating license request');

    this._requestLicense(message, (data: ArrayBuffer) => {
      console.log(`Received license data (length: ${data ? data.byteLength : data}), updating key-session`);
      keySession.update(data);
    });
  }

  private _onMediaEncrypted = (e: MediaEncryptedEvent) => {
    console.log(`Media is encrypted using "${e.initDataType}" init data type`);

    if (!this.mediaKeysPromise) {
      console.error('Fatal: Media is encrypted but no CDM access or no keys have been requested');
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
        console.error('Fatal: Media is encrypted but no CDM access or no keys have been obtained yet');
        this.hls.trigger(Event.ERROR, {
          type: ErrorTypes.KEY_SYSTEM_ERROR,
          details: ErrorDetails.KEY_SYSTEM_NO_KEYS,
          fatal: true
        });
        return;
      }

      console.log('Setting keys for encrypted media');

      this._media.setMediaKeys(keysListItem.mediaKeys);
      this._hasSetMediaKeys = true;
    }
  }

  /**
   * @private
   */
  private _generateRequestWithPreferredKeySession (initDataType: string, initData: ArrayBuffer | null) {
    // FIXME: see if we can/want/need-to really to deal with several potential key-sessions?
    const keysListItem = this._mediaKeysList[0];
    if (!keysListItem) {
      console.error('Fatal: Media is encrypted but not any key-system access has been obtained yet');
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.KEY_SYSTEM_ERROR,
        details: ErrorDetails.KEY_SYSTEM_NO_ACCESS,
        fatal: true
      });
      return;
    }

    if (keysListItem.mediaKeysSessionInitialized) {
      console.warn('Key-Session already initialized but requested again');
      return;
    }

    const keySession = keysListItem.mediaKeysSession;
    if (!keySession) {
      console.error('Fatal: Media is encrypted but no key-session existing');
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.KEY_SYSTEM_ERROR,
        details: ErrorDetails.KEY_SYSTEM_NO_SESSION,
        fatal: true
      });
      return;
    }

    // initData is null if the media is not CORS-same-origin
    if (!initData) {
      console.warn('Fatal: initData required for generating a key session is null');
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.KEY_SYSTEM_ERROR,
        details: ErrorDetails.KEY_SYSTEM_NO_INIT_DATA,
        fatal: true
      });
      return;
    }

    console.log(`Generating key-session request for "${initDataType}" init data type`);
    keysListItem.mediaKeysSessionInitialized = true;

    keySession.generateRequest(initDataType, initData)
      .then(() => {
        console.debug('Key-session generation succeeded');
      })
      .catch((err) => {
        console.error('Error generating key-session request:', err);
        this.hls.trigger(Event.ERROR, {
          type: ErrorTypes.KEY_SYSTEM_ERROR,
          details: ErrorDetails.KEY_SYSTEM_NO_SESSION,
          fatal: false
        });
      });
  }

  /**
   * @private
   * @param {string} url License server URL
   * @param {ArrayBuffer} keyMessage Message data issued by key-system
   * @param {function} callback Called when XHR has succeeded
   * @returns {XMLHttpRequest} Unsent (but opened state) XHR object
   * @throws if XMLHttpRequest construction failed
   */
  private _createLicenseXhr (url: string, keyMessage: ArrayBuffer, callback: (data: ArrayBuffer) => void): XMLHttpRequest {
    const xhr = new XMLHttpRequest();
    const licenseXhrSetup = this._licenseXhrSetup;

    try {
      if (licenseXhrSetup) {
        try {
          licenseXhrSetup(xhr, url);
        } catch (e) {
          // let's try to open before running setup
          xhr.open('POST', url, true);
          licenseXhrSetup(xhr, url);
        }
      }
      // if licenseXhrSetup did not yet call open, let's do it now
      if (!xhr.readyState) {
        xhr.open('POST', url, true);
      }
    } catch (e) {
      // IE11 throws an exception on xhr.open if attempting to access an HTTP resource over HTTPS
      throw new Error(`issue setting up KeySystem license XHR ${e}`);
    }

    // Because we set responseType to ArrayBuffer here, callback is typed as handling only array buffers
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange =
        this._onLicenseRequestReadyStageChange.bind(this, xhr, url, keyMessage, callback);
    return xhr;
  }

  /**
   * @private
   * @param {XMLHttpRequest} xhr
   * @param {string} url License server URL
   * @param {ArrayBuffer} keyMessage Message data issued by key-system
   * @param {function} callback Called when XHR has succeeded
   */
  private _onLicenseRequestReadyStageChange (xhr: XMLHttpRequest, url: string, keyMessage: ArrayBuffer, callback: (data: ArrayBuffer) => void) {
    switch (xhr.readyState) {
    case 4:
      if (xhr.status === 200) {
        this._requestLicenseFailureCount = 0;
        console.log('License request succeeded');

        if (xhr.responseType !== 'arraybuffer') {
          console.warn('xhr response type was not set to the expected arraybuffer for license request');
        }
        callback(xhr.response);
      } else {
        console.error(`License Request XHR failed (${url}). Status: ${xhr.status} (${xhr.statusText})`);
        this._requestLicenseFailureCount++;
        if (this._requestLicenseFailureCount > MAX_LICENSE_REQUEST_FAILURES) {
          this.hls.trigger(Event.ERROR, {
            type: ErrorTypes.KEY_SYSTEM_ERROR,
            details: ErrorDetails.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
            fatal: true
          });
          return;
        }

        const attemptsLeft = MAX_LICENSE_REQUEST_FAILURES - this._requestLicenseFailureCount + 1;
        console.warn(`Retrying license request, ${attemptsLeft} attempts left`);
        this._requestLicense(keyMessage, callback);
      }
      break;
    }
  }

  /**
   * @private
   * @param {MediaKeysListItem} keysListItem
   * @param {ArrayBuffer} keyMessage
   * @returns {ArrayBuffer} Challenge data posted to license server
   * @throws if KeySystem is unsupported
   */
  private _generateLicenseRequestChallenge (keysListItem: MediaKeysListItem, keyMessage: ArrayBuffer): ArrayBuffer {
    switch (keysListItem.mediaKeySystemDomain) {
    // case KeySystems.PLAYREADY:
    // from https://github.com/MicrosoftEdge/Demos/blob/master/eme/scripts/demo.js
    /*
      if (this.licenseType !== this.LICENSE_TYPE_WIDEVINE) {
        // For PlayReady CDMs, we need to dig the Challenge out of the XML.
        var keyMessageXml = new DOMParser().parseFromString(String.fromCharCode.apply(null, new Uint16Array(keyMessage)), 'application/xml');
        if (keyMessageXml.getElementsByTagName('Challenge')[0]) {
            challenge = atob(keyMessageXml.getElementsByTagName('Challenge')[0].childNodes[0].nodeValue);
        } else {
            throw 'Cannot find <Challenge> in key message';
        }
        var headerNames = keyMessageXml.getElementsByTagName('name');
        var headerValues = keyMessageXml.getElementsByTagName('value');
        if (headerNames.length !== headerValues.length) {
            throw 'Mismatched header <name>/<value> pair in key message';
        }
        for (var i = 0; i < headerNames.length; i++) {
            xhr.setRequestHeader(headerNames[i].childNodes[0].nodeValue, headerValues[i].childNodes[0].nodeValue);
        }
      }
      break;
    */
    case KeySystems.WIDEVINE:
      // For Widevine CDMs, the challenge is the keyMessage.
      return keyMessage;
    }

    throw new Error(`unsupported key-system: ${keysListItem.mediaKeySystemDomain}`);
  }

  /**
   * @private
   * @param keyMessage
   * @param callback
   */
  private _requestLicense (keyMessage: ArrayBuffer, callback: (data: ArrayBuffer) => void) {
    console.log('Requesting content license for key-system');

    const keysListItem = this._mediaKeysList[0];
    if (!keysListItem) {
      console.error('Fatal error: Media is encrypted but no key-system access has been obtained yet');
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
      console.log(`Sending license request to URL: ${url}`);
      const challenge = this._generateLicenseRequestChallenge(keysListItem, keyMessage);
      xhr.send(challenge);
    } catch (e) {
      console.error(`Failure requesting DRM license: ${e}`);
      this.hls.trigger(Event.ERROR, {
        type: ErrorTypes.KEY_SYSTEM_ERROR,
        details: ErrorDetails.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
        fatal: true
      });
    }
  }

  onMediaAttached (data: { media: HTMLMediaElement; }) {
    if (!this._emeEnabled) {
      return;
    }

    const media = data.media;

    // keep reference of media
    this._media = media;

    media.addEventListener('encrypted', this._onMediaEncrypted);
  }

  onMediaDetached () {
    const media = this._media;
    const mediaKeysList = this._mediaKeysList;
    if (!media) {
      return;
    }
    media.removeEventListener('encrypted', this._onMediaEncrypted);
    this._media = null;
    this._mediaKeysList = [];
    // Close all sessions and remove media keys from the video element.
    Promise.all(mediaKeysList.map((mediaKeysListItem) => {
      if (mediaKeysListItem.mediaKeysSession) {
          return mediaKeysListItem.mediaKeysSession.close().catch(() => {
            // Ignore errors when closing the sessions. Closing a session that
            // generated no key requests will throw an error.
          });
      }
    })).then(() => {
      return media.setMediaKeys(null);
    }).catch(() => {
      // Ignore any failures while removing media keys from the video element.
    });
  }

  // TODO: Use manifest types here when they are defined
  onManifestParsed (data: any) {
    if (!this._emeEnabled) {
      return;
    }

    const audioCodecs = data.levels.map((level) => level.audioCodec);
    const videoCodecs = data.levels.map((level) => level.videoCodec);

    this._attemptKeySystemAccess(KeySystems.WIDEVINE, audioCodecs, videoCodecs);
  }
}

export default EMEController;
