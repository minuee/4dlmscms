class XhrLoader {
  constructor (config) {
    if (config && config.xhrSetup) {
      this.xhrSetup = config.xhrSetup;
    }
  }  

  load (context, config, callbacks) {
    this.context = context;
    this.config = config;
    this.callbacks = callbacks;
    this.stats = { trequest: window.performance.now(), retry: 0 };
    this.retryDelay = config.retryDelay;
    this.loadInternal();
  }

  loadInternal () {
    let xhr, context = this.context;
    xhr = this.loader = new window.XMLHttpRequest();

    this.stats.tfirst = 0;
    this.stats.loaded = 0;

    const xhrSetup = this.xhrSetup;

    try {
      const url = context.url;
      if (xhrSetup) {
        try {
          xhrSetup(xhr, url);
        } catch (e) {
          xhr.open('GET', url, true);
          xhrSetup(xhr, url);
        }
      }
      if (!xhr.readyState) {
        xhr.open('GET', url, true);
      }
    } catch (e) {
      this.callbacks.onError({ code: xhr.status, text: e.message }, context, xhr);
      return;
    }

    if (context.rangeEnd) {
      xhr.setRequestHeader('Range', 'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1));
    }

    xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    xhr.onreadystatechange = this.readystatechange.bind(this);
    //xhr.onprogress = this.loadprogress.bind(this);
    xhr.responseType = context.responseType;

    this.requestTimeout = window.setTimeout(this.loadtimeout.bind(this), this.config.timeout);
    xhr.send();
  }

  readystatechange (event) {
    let xhr = this.loader,
      readyState = xhr.readyState,
      stats = this.stats,
      context = this.context,
      config = this.config;

    if (stats.aborted) {
      return;
    }

    if (readyState >= 2) {
      window.clearTimeout(this.requestTimeout);
      if (stats.tfirst === 0) {
        stats.tfirst = Math.max(window.performance.now(), stats.trequest);
      }

      if (readyState === 4) {
        let status = xhr.status;
        if (status >= 200 && status < 300) {
          if(xhr.status !== 204) {
            stats.tload = Math.max(stats.tfirst, window.performance.now());
            let data, len;
            if (context.responseType === 'arraybuffer') {
              data = xhr.response;
              len = data.byteLength;
            } else if(context.responseType === 'json') {
              data = xhr.response;
              len = JSON.stringify(data).length;                      
            } else {
              data = xhr.responseText;
              len = data.length;
            }
            stats.loaded = stats.total = len;
            let response = { url: xhr.responseURL, data: data };
            this.callbacks.onSuccess(response, stats, context, xhr);
          }
        } else {
          if (stats.retry >= config.maxRetry || (status >= 400 && status < 499)) {
            this.callbacks.onError({ code: status, text: xhr.statusText }, context, xhr);
          } else {
            this.destroy();
            this.retryTimeout = window.setTimeout(this.loadInternal.bind(this), this.retryDelay);
            this.retryDelay = Math.min(2 * this.retryDelay, config.maxRetryDelay);
            stats.retry++;
          }
        }
      } else {
        this.requestTimeout = window.setTimeout(this.loadtimeout.bind(this), config.timeout);
      }
    }
  }

  loadtimeout () {
    this.callbacks.onTimeout(this.stats, this.context, null);
  }

  // loadprogress (event) {
  //   let xhr = event.currentTarget,
  //     stats = this.stats;

  //   stats.loaded = event.loaded;
  //   if (event.lengthComputable) {
  //     stats.total = event.total;
  //   }

  //   let onProgress = this.callbacks.onProgress;
  //   if (onProgress) {
  //     onProgress(stats, this.context, null, xhr);
  //   }
  // }

  destroy () {
    this.abort();
    this.loader = null;
  }

  abort () {
    let loader = this.loader;
    if (loader && loader.readyState !== 4) {
      this.stats.aborted = true;
      loader.abort();
    }

    window.clearTimeout(this.requestTimeout);
    this.requestTimeout = null;
    window.clearTimeout(this.retryTimeout);
    this.retryTimeout = null;
  }
}

export default XhrLoader;
