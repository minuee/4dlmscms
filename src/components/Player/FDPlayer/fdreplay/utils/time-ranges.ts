const TimeRanges = {
  toString: function (r: TimeRanges) {
    let log = '';
    let len = r.length;
    for (let i = 0; i < len; i++) {
      log += '[' + r.start(i).toFixed(3) + ',' + r.end(i).toFixed(3) + ']';
    }

    return log;
  }
};

export default TimeRanges;
