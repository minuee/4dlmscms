import { getMediaSource } from './utils/mediasource-helper';

export function isSupported (): boolean {
  const mediaSource = getMediaSource();
  if (!mediaSource) {
    return false;
  }
  const sourceBuffer = window.self.SourceBuffer ||
    (self as any).WebKitSourceBuffer as SourceBuffer; // eslint-disable-line no-restricted-globals

  const isTypeSupported = mediaSource &&
    typeof mediaSource.isTypeSupported === 'function' &&
    mediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');

  const sourceBufferValidAPI = !sourceBuffer ||
    (sourceBuffer.prototype &&
      typeof sourceBuffer.prototype.appendBuffer === 'function' &&
      typeof sourceBuffer.prototype.remove === 'function');
  return !!isTypeSupported && !!sourceBufferValidAPI;
}
