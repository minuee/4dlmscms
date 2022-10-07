import BinarySearch from '../utils/binary-search';
import Fragment from '../loader/fragment';

export function fragmentWithinToleranceTest (bufferEnd = 0, maxFragLookUpTolerance = 0, candidate: Fragment) {
  let candidateLookupTolerance = Math.min(maxFragLookUpTolerance, candidate.duration + (candidate.deltaPTS ? candidate.deltaPTS : 0));
  if (candidate.start + candidate.duration - candidateLookupTolerance <= bufferEnd) {
    return 1;
  } else if (candidate.start - candidateLookupTolerance > bufferEnd && candidate.start) {
    return -1;
  }

  return 0;
}

export function pdtWithinToleranceTest (pdtBufferEnd: number, maxFragLookUpTolerance: number, candidate: Fragment): boolean {
  let candidateLookupTolerance = Math.min(maxFragLookUpTolerance, candidate.duration + (candidate.deltaPTS ? candidate.deltaPTS : 0)) * 1000;

  const endProgramDateTime = candidate.endProgramDateTime || 0;
  return endProgramDateTime - candidateLookupTolerance > pdtBufferEnd;
}

export function findFragmentByPDT (fragments: Array<Fragment>, PDTValue: number | null, maxFragLookUpTolerance: number): Fragment | null {
  if (PDTValue === null || !Array.isArray(fragments) || !fragments.length || !Number.isFinite(PDTValue)) {
    return null;
  }

  const startPDT = fragments[0].programDateTime;
  if (PDTValue < (startPDT || 0)) {
    return null;
  }

  const endPDT = fragments[fragments.length - 1].endProgramDateTime;
  if (PDTValue >= (endPDT || 0)) {
    return null;
  }

  maxFragLookUpTolerance = maxFragLookUpTolerance || 0;
  for (let seg = 0; seg < fragments.length; ++seg) {
    let frag = fragments[seg];
    if (pdtWithinToleranceTest(PDTValue, maxFragLookUpTolerance, frag)) {
      return frag;
    }
  }

  return null;
}

export function findFragmentByPTS (fragPrevious: Fragment, fragments: Array<Fragment>, bufferEnd: number = 0, maxFragLookUpTolerance: number = 0): Fragment | null {
  let fragNext: Fragment | null = null;
  if (fragPrevious) {
    fragNext = fragments[fragPrevious.sn as number - (fragments[0].sn as number) + 1];
  } else if (bufferEnd === 0 && fragments[0].start === 0) {
    fragNext = fragments[0];
  }
  // Prefer the next fragment if it's within tolerance
  if (fragNext && fragmentWithinToleranceTest(bufferEnd, maxFragLookUpTolerance, fragNext) === 0) {
    return fragNext;
  }
  // We might be seeking past the tolerance so find the best match
  const foundFragment = BinarySearch.search(fragments, fragmentWithinToleranceTest.bind(null, bufferEnd, maxFragLookUpTolerance));
  if (foundFragment) {
    return foundFragment;
  }
  // If no match was found return the next fragment after fragPrevious, or null
  return fragNext;
}
