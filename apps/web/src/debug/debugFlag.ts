const STORAGE_KEY = 'ssa-debug';

/**
 * `?debug=1` turns the debug panel on and `?debug=0` turns it off. The choice is remembered for
 * the browser tab (sessionStorage) so it survives in-app navigation, which drops the query.
 */
export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  const param = new URLSearchParams(window.location.search).get('debug');
  try {
    if (param === '1') window.sessionStorage.setItem(STORAGE_KEY, '1');
    if (param === '0') window.sessionStorage.removeItem(STORAGE_KEY);
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return param === '1';
  }
}
