export function getSelfScope () {
  // see https://stackoverflow.com/a/11237259/589493
  if (typeof window === 'undefined') {
    /* eslint-disable-next-line no-undef */
    return window.self;
  } else {
    return window;
  }
}
