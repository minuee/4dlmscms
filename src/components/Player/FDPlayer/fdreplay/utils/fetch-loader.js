class FetchLoader {
  constructor (config) {
    this.fetchSetup = config.fetchSetup;
  }

  destroy () {}

  abort () {}

  load (context, config, callbacks) {
    let stats = {
      trequest: window.performance.now(),
      retry: 0
    };

    let targetURL = context.url;
    let request;

    const initParams = {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin'
    };

    const headersObj = {};

    if (context.rangeEnd) {
      headersObj['Range'] = 'bytes=' + context.rangeStart + '-' + String(context.rangeEnd - 1);
    } /* jshint ignore:line */

    initParams.headers = new window.Headers(headersObj);

    if (this.fetchSetup) {
      request = this.fetchSetup(context, initParams);
    } else {
      request = new window.Request(context.url, initParams);
    }

    let fetchPromise = window.fetch(request, initParams);

    // process fetchPromise
    let responsePromise = fetchPromise.then(function (response) {
      if (response.ok) {
        stats.tfirst = Math.max(stats.trequest, window.performance.now());
        targetURL = response.url;
        if (context.responseType === 'arraybuffer') {
          return response.arrayBuffer();
        } else {
          return response.text();
        }
      } else {
        callbacks.onError({ text: 'fetch, bad network response' }, context);
      }
    }).catch(function (error) {
      callbacks.onError({ text: error.message }, context);
    });
    // process response Promise
    responsePromise.then(function (responseData) {
      if (responseData) {
        stats.tload = Math.max(stats.tfirst, window.performance.now());
        let len;
        if (typeof responseData === 'string') {
          len = responseData.length;
        } else {
          len = responseData.byteLength;
        }

        stats.loaded = stats.total = len;
        let response = { url: targetURL, data: responseData };
        callbacks.onSuccess(response, stats, context);
      }
    });
  }
}

export default FetchLoader;