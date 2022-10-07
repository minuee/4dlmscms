import Events from '../events';
import EventHandler from '../event-handler';
import { FrameType } from '../controller/base-stream-controller';

import { ErrorTypes, ErrorDetails } from '../errors';

class FrameLoader extends EventHandler {
  constructor(hls) {
    super(hls);
    this.loader = undefined;
  }
  
  onFrameFragLoading (data) {    
    const frag = data.frag;    
    const config = this.hls.config;
    const DefaultILoader = config.loader;

    let loaderContext, loaderConfig, loaderCallbacks, start, end;

    frag.loaded = 0;

    if(this.loader) {
      this.loader.abort();
    }

    this.loader = frag.loader = new DefaultILoader(config);
    
    switch(data.type) {
      case FrameType.SEEK:      
      case FrameType.CONTINUE:
        loaderContext = {
          type: data.type,
          url: frag.frameurl, 
          frag: frag, 
          responseType: 'arraybuffer', 
          progressData: false,
          gop: data.gop,
          height: data.height,
          index: data.index || 0,
        };
        break;
      case FrameType.TIMESLICE:
      case FrameType.TIMEMACHINE:
        loaderContext = {
          type: data.type,
          url: frag.frameurl, 
          frag: frag, 
          responseType: 'arraybuffer', 
          progressData: false,
          gop: data.gop,
          height: data.height,
          index: data.index || 0,
          direction: data.direction,
          position: data.position,
          target: data.target,
        };
        break;
      default:
        break;
    }
    

    start = frag.byteRangeStartOffset;
    end = frag.byteRangeEndOffset;

    if (Number.isFinite(start) && Number.isFinite(end)) {
      loaderContext.rangeStart = start;
      loaderContext.rangeEnd = end;
    }

    loaderConfig = {
      timeout: config.fragLoadingTimeOut,
      maxRetry: 0,
      retryDelay: 0,
      maxRetryDelay: config.fragLoadingMaxRetryTimeout
    };

    loaderCallbacks = {
      onSuccess: this.loadsuccess.bind(this),
      onError: this.loaderror.bind(this), 
      onTimeout: this.loadtimeout.bind(this),
    };

    ////console.log(`[ -> Request Frame ] : ${frag.channelName} - ${frag.sn} - ${frag.relurl}`);
    this.loader.load(loaderContext, loaderConfig, loaderCallbacks);
  }

  loadsuccess (response, stats, context, networkDetails = null) {
    let payload = response.data;
    let type = context.type;    
    let frag = context.frag;

    frag.loader = undefined;
    this.loader = undefined;

    const data = {
      payload: payload, 
      context: context,
      stats: stats,
      networkDetails: networkDetails
    }
    
    switch(type) {      
      case FrameType.TIMESLICE:
        this.hls.trigger(Events.TIMESLICE_FRAG_LOADED, data);
        break;
      case FrameType.TIMEMACHINE:
        this.hls.trigger(Events.TIMEMACHINE_FRAG_LOADED, data);
        break;
      case FrameType.CONTINUE:
        this.hls.trigger(Events.FRAME_FRAG_LOADED, data);
        break;
      case FrameType.SEEK:
        this.hls.trigger(Events.FRAME_FRAG_LOADED, data);
        break;      
      default:
        break;
    }
  }

  loaderror (response, context, networkDetails = null) {
    const frag = context.frag;
    let loader = frag.loader;
    if (loader) {
      loader.abort();
    }
    this.loader = undefined;
    this.hls.trigger(Events.ERROR, { type: ErrorTypes.NETWORK_ERROR, details: ErrorDetails.FRAG_LOAD_ERROR, fatal: false, frag: context.frag, response: response, networkDetails: networkDetails });
  }

  loadtimeout (stats, context, networkDetails = null) {
    const frag = context.frag;
    let loader = frag.loader;
    if (loader) {
      loader.abort();
    }
    this.loader = undefined;
    this.hls.trigger(Events.ERROR, { type: ErrorTypes.NETWORK_ERROR, details: ErrorDetails.FRAG_LOAD_TIMEOUT, fatal: false, frag: context.frag, networkDetails: networkDetails });
  }

  destroy () {    
    this.loader.destory();
    super.destroy();
  }
}

export default FrameLoader;