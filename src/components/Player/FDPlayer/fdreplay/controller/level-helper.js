export function addGroupId (level, type, id) {
  if (type === 'audio') {
    if (!level.audioGroupIds) {
      level.audioGroupIds = [];
    }
    level.audioGroupIds.push(id); 
  }
}

export function updatePTS (fragments, fromIdx, toIdx) {
  let fragFrom = fragments[fromIdx], fragTo = fragments[toIdx], fragToPTS = fragTo.startPTS;
  if (Number.isFinite(fragToPTS)) {
    if (toIdx > fromIdx) {
      fragFrom.duration = fragToPTS - fragFrom.start;
      
    } else {
      fragTo.duration = fragFrom.start - fragToPTS;      
    }
  } else {
    if (toIdx > fromIdx) {
      const contiguous = fragFrom.cc === fragTo.cc;
      fragTo.start = fragFrom.start + ((contiguous && fragFrom.minEndPTS) ? fragFrom.minEndPTS - fragFrom.start : fragFrom.duration);
    } else {
      fragTo.start = Math.max(fragFrom.start - fragTo.duration, 0);
    }
  }
}

export function updateFragPTSDTS (details, frag, startPTS, endPTS, startDTS, endDTS) {
  let maxStartPTS = startPTS;
  let minEndPTS = endPTS;
  if (Number.isFinite(frag.startPTS)) {
    let deltaPTS = Math.abs(frag.startPTS - startPTS);
    if (!Number.isFinite(frag.deltaPTS)) {
      frag.deltaPTS = deltaPTS;
    } else {
      frag.deltaPTS = Math.max(deltaPTS, frag.deltaPTS);
    }

    maxStartPTS = Math.max(startPTS, frag.startPTS);
    startPTS = Math.min(startPTS, frag.startPTS);
    minEndPTS = Math.min(endPTS, frag.endPTS);
    endPTS = Math.max(endPTS, frag.endPTS);
    startDTS = Math.min(startDTS, frag.startDTS);
    endDTS = Math.max(endDTS, frag.endDTS);
  }

  const drift = startPTS - frag.start;
  frag.start = frag.startPTS = startPTS;
  frag.maxStartPTS = maxStartPTS;
  frag.endPTS = endPTS;
  frag.minEndPTS = minEndPTS;
  frag.startDTS = startDTS;
  frag.endDTS = endDTS;
  frag.duration = endPTS - startPTS;

  const sn = frag.sn;
  // exit if sn out of range
  if (!details || sn < details.startSN || sn > details.endSN) {
    return 0;
  }

  let fragIdx, fragments, i;
  fragIdx = sn - details.startSN;
  fragments = details.fragments;
  fragments[fragIdx] = frag;
  
  for (i = fragIdx; i > 0; i--) {
    updatePTS(fragments, i, i - 1);
  }

  for (i = fragIdx; i < fragments.length - 1; i++) {
    updatePTS(fragments, i, i + 1);
  }

  details.PTSKnown = true;
  return drift;
}

export function mergeDetails (oldDetails, newDetails) {
  if (newDetails.initSegment && oldDetails.initSegment) {
    newDetails.initSegment = oldDetails.initSegment;
    newDetails.initFrameSegment = oldDetails.initFrameSegment;
  }

  let ccOffset = 0;
  let PTSFrag;

  mapFragmentIntersection(oldDetails, newDetails, (oldFrag, newFrag) => {
    ccOffset = oldFrag.cc - newFrag.cc;
    if (Number.isFinite(oldFrag.startPTS)) {
      newFrag.start = newFrag.startPTS = oldFrag.startPTS;
      newFrag.endPTS = oldFrag.endPTS;
      newFrag.duration = oldFrag.duration;
      newFrag.backtracked = oldFrag.backtracked;
      newFrag.dropped = oldFrag.dropped;
      PTSFrag = newFrag;
    }
    newDetails.PTSKnown = true;
  });

  if (!newDetails.PTSKnown) {
    return;
  }

  if (ccOffset) {
    const newFragments = newDetails.fragments;
    for (let i = 0; i < newFragments.length; i++) {
      newFragments[i].cc += ccOffset;
    }
  }

  if (PTSFrag) {
    updateFragPTSDTS(newDetails, PTSFrag, PTSFrag.startPTS, PTSFrag.endPTS, PTSFrag.startDTS, PTSFrag.endDTS);
  } else {
    adjustSliding(oldDetails, newDetails);
  }
  newDetails.PTSKnown = oldDetails.PTSKnown;
}

export function mapFragmentIntersection (oldPlaylist, newPlaylist, intersectionFn) {
  if (!oldPlaylist || !newPlaylist) {
    return;
  }

  const start = Math.max(oldPlaylist.startSN, newPlaylist.startSN) - newPlaylist.startSN;
  const end = Math.min(oldPlaylist.endSN, newPlaylist.endSN) - newPlaylist.startSN;
  const delta = newPlaylist.startSN - oldPlaylist.startSN;

  for (let i = start; i <= end; i++) {
    const oldFrag = oldPlaylist.fragments[delta + i];
    const newFrag = newPlaylist.fragments[i];
    if (!oldFrag || !newFrag) {
      break;
    }

    // if(!Number.isFinite(oldFrag.startPTS)) {
    //   console.log('newFrag is null');
    // } else {
    //   console.log('newFrag is not null');
    // }

    intersectionFn(oldFrag, newFrag, i);
  }
}

export function adjustSliding (oldPlaylist, newPlaylist) {
  const delta = newPlaylist.startSN - oldPlaylist.startSN;
  const oldFragments = oldPlaylist.fragments;
  const newFragments = newPlaylist.fragments;

  if (delta < 0 || delta > oldFragments.length) {
    return;
  }
  for (let i = 0; i < newFragments.length; i++) {
    //newFragments[i].start += oldFragments[delta].start;
    newFragments[i].start = oldFragments[delta].start;
  }
}

export function computeReloadInterval (currentPlaylist, newPlaylist, lastRequestTime) {
  let reloadInterval = 1000 * (newPlaylist.averagetargetduration ? newPlaylist.averagetargetduration : newPlaylist.targetduration);
  const minReloadInterval = reloadInterval / 2;
  if (currentPlaylist && newPlaylist.endSN === currentPlaylist.endSN) {
    reloadInterval = minReloadInterval;
  }

  if (lastRequestTime) {
    reloadInterval = Math.max(minReloadInterval, reloadInterval - (window.performance.now() - lastRequestTime));
  }
  return Math.round(reloadInterval);
}
