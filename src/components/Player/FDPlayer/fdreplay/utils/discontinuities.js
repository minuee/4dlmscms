import BinarySearch from './binary-search';

export function findFirstFragWithCC (fragments, cc) {
  let firstFrag = null;

  for (let i = 0; i < fragments.length; i += 1) {
    const currentFrag = fragments[i];
    if (currentFrag && currentFrag.cc === cc) {
      firstFrag = currentFrag;
      break;
    }
  }

  return firstFrag;
}

export function findFragWithCC (fragments, CC) {
  return BinarySearch.search(fragments, (candidate) => {
    if (candidate.cc < CC) {
      return 1;
    } else if (candidate.cc > CC) {
      return -1;
    } else {
      return 0;
    }
  });
}

export function shouldAlignOnDiscontinuities (lastFrag, lastLevel, details) {
  let shouldAlign = false;
  if (lastLevel && lastLevel.details && details) {
    if (details.endCC > details.startCC || (lastFrag && lastFrag.cc < details.startCC)) {
      shouldAlign = true;
    }
  }
  return shouldAlign;
}

export function findDiscontinuousReferenceFrag (prevDetails, curDetails) {
  const prevFrags = prevDetails.fragments;
  const curFrags = curDetails.fragments;

  if (!curFrags.length || !prevFrags.length) {
    return;
  }

  const prevStartFrag = findFirstFragWithCC(prevFrags, curFrags[0].cc);
  if (!prevStartFrag || (prevStartFrag && !prevStartFrag.startPTS)) {
    return;
  }

  return prevStartFrag;
}

export function adjustPts (sliding, details) {
  details.fragments.forEach((frag) => {
    if (frag) {
      let start = frag.start + sliding;
      frag.start = frag.startPTS = start;
      frag.endPTS = start + frag.duration;
    }
  });
  details.PTSKnown = true;
}

export function alignStream (lastFrag, lastLevel, details) {
  alignDiscontinuities(lastFrag, details, lastLevel);
  if (!details.PTSKnown && lastLevel) {
    alignPDT(details, lastLevel.details);
  }
}

export function alignDiscontinuities (lastFrag, details, lastLevel) {
  if (shouldAlignOnDiscontinuities(lastFrag, lastLevel, details)) {
    const referenceFrag = findDiscontinuousReferenceFrag(lastLevel.details, details);
    if (referenceFrag) {
      adjustPts(referenceFrag.start, details);
    }
  }
}

export function alignPDT (details, lastDetails) {
  if (lastDetails && lastDetails.fragments.length) {
    if (!details.hasProgramDateTime || !lastDetails.hasProgramDateTime) {
      return;
    }

    let lastPDT = lastDetails.fragments[0].programDateTime;
    let newPDT = details.fragments[0].programDateTime;
    let sliding = (newPDT - lastPDT) / 1000 + lastDetails.fragments[0].start;
    if (Number.isFinite(sliding)) {
      adjustPts(sliding, details);
    }
  }
}
