import Event from '../events';
import EventHandler from '../event-handler';
import { ErrorTypes, ErrorDetails } from '../errors';
class FrameMetaLoader extends EventHandler {
  constructor(hls) {
    super(hls);
    this.loader = undefined;
  }

  onFrameMetaLoading (data) {    
    const config = this.hls.config;
    const DefaultILoader = config.loader;

    let loaderContext, loaderConfig, loaderCallbacks;

    if(this.loader) {
      this.loader.abort();
    }

    this.loader = new DefaultILoader(config);
    
    loaderContext = { 
      type: data.type,
      position: data.position,
      url: data.url,
      second: data.second,
      channel: data.channel,
      level: data.level, 
      frame: data.frame, 
      relurl: data.relurl,
      time: data.time,
      sn: data.sn,
      target: data.target,
      responseType: 'json',
      loader: this.loader
    };

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

    //console.log(`[ -> Request MetaData ] : ${data.channel} - ${data.second} - ${data.relurl}`);
    this.loader.load(loaderContext, loaderConfig, loaderCallbacks);
  }

  loadsuccess (response, stats, context, networkDetails = null) {
    let payload = response.data;  

    this.loader = undefined;
    
    this.hls.trigger(
      Event.FRAME_META_LOADED, 
      {
        payload: payload,
        context: context,
        stats: stats, 
        networkDetails: networkDetails 
      }
    );
  }

  loaderror (response, context, networkDetails = null) {
    //const frag = context.frag;
    let loader = context.loader;
    if (loader) {
      loader.abort();
    }
    this.loader = undefined;
    this.hls.trigger(Event.ERROR, { type: ErrorTypes.NETWORK_ERROR, details: ErrorDetails.FRAG_LOAD_ERROR, fatal: false, frag: context.frag, response: response, networkDetails: networkDetails });
  }

  loadtimeout (stats, context, networkDetails = null) {
    //const frag = context.frag;
    let loader = context.loader;
    if (loader) {
      loader.abort();
    }
    this.loader = undefined;
    this.hls.trigger(Event.ERROR, { type: ErrorTypes.NETWORK_ERROR, details: ErrorDetails.FRAG_LOAD_TIMEOUT, fatal: false, frag: context.frag, networkDetails: networkDetails });
  }

  destroy () {
    this.loader.destory();
    super.destroy();
  }
}

export default FrameMetaLoader;