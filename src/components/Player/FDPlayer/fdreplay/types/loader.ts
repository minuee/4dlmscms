import Level from '../loader/level';

export interface LoaderContext {
  // target URL
  url: string
  fixedurl?: string
  // loader response type (arraybuffer or default response type for playlist)
  responseType: string
  // start byte range offset
  rangeStart?: number
  // end byte range offset
  rangeEnd?: number
  // true if onProgress should report partial chunk of loaded content
  progressData?: boolean
}

export interface LoaderConfiguration {
  // Max number of load retries
  maxRetry: number
  // Timeout after which `onTimeOut` callback will be triggered
  // (if loading is still not finished after that delay)
  timeout: number
  // Delay between an I/O error and following connection retry (ms).
  // This to avoid spamming the server
  retryDelay: number
  // max connection retry delay (ms)
  maxRetryDelay: number
}

export interface LoaderResponse {
  url: string,
  // TODO(jstackhouse): SharedArrayBuffer, es2017 extension to TS
  data: string | ArrayBuffer
}

export interface LoaderStats {
  // performance.now() just after load() has been called
  trequest: number
  // performance.now() of first received byte
  tfirst: number
  // performance.now() on load complete
  tload: number
  // performance.now() on parse completion
  tparsed: number
  // number of loaded bytes
  loaded: number
  // total number of bytes
  total: number
}

type LoaderOnSuccess < T extends LoaderContext > = (
  response: LoaderResponse,
  stats: LoaderStats,
  context: T,
  networkDetails: any
) => void;

type LoaderOnProgress < T extends LoaderContext > = (
  stats: LoaderStats,
  context: T,
  data: string | ArrayBuffer,
  networkDetails: any,
) => void;

type LoaderOnError < T extends LoaderContext > = (
  error: {
    // error status code
    code: number,
    // error description
    text: string,
  },
  context: T,
  networkDetails: any,
) => void;

type LoaderOnTimeout < T extends LoaderContext > = (
  stats: LoaderStats,
  context: T,
) => void;

export interface LoaderCallbacks<T extends LoaderContext>{
  onSuccess: LoaderOnSuccess<T>,
  onError: LoaderOnError<T>,
  onTimeout: LoaderOnTimeout<T>,
  onProgress?: LoaderOnProgress<T>,
}

export interface Loader<T extends LoaderContext> {
  destroy(): void
  abort(): void
  load(
    context: LoaderContext,
    config: LoaderConfiguration,
    callbacks: LoaderCallbacks<T>,
  ): void

  context: T
}

export enum PlaylistContextType {
  MANIFEST = 'manifest',
  LEVEL = 'level',
  AUDIO_TRACK = 'audioTrack',
}

export enum PlaylistLevelType {
  MAIN = 'main',
  FRAME = 'frame',
  AUDIO = 'audio',
}

export interface PlaylistLoaderContext extends LoaderContext {
  loader?: Loader<PlaylistLoaderContext>

  type: PlaylistContextType
  // the level index to load
  level: number | null
  // TODO: what is id?
  id: number | null
  // internal reprsentation of a parsed m3u8 level playlist
  levelDetails?: Level
}
