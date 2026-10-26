import { useSyncExternalStore } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
const storageKey = 'lurelog-theme';
const changeEvent = 'lurelog:theme';
function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}
let preference = readPreference();
function systemIsDark() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}
function applyTheme() {
  document.documentElement.classList.toggle(
    'dark',
    preference === 'dark' || (preference === 'system' && systemIsDark()),
  );
  window.dispatchEvent(new Event(changeEvent));
}

/** Start once at the app entry point, including on pages with no theme controls. */
export function initializeTheme() {
  preference = readPreference();
  const media =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : undefined;
  const onSystemChange = () => applyTheme();
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      preference = readPreference();
      applyTheme();
    }
  };
  media?.addEventListener('change', onSystemChange);
  window.addEventListener('storage', onStorage);
  applyTheme();
  return () => {
    media?.removeEventListener('change', onSystemChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function setThemePreference(next: ThemePreference) {
  preference = next;
  try {
    if (next === 'system') localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, next);
  } catch {
    // The current tab can still change appearance when browser storage is unavailable.
  }
  applyTheme();
}
function subscribe(listener: () => void) {
  window.addEventListener(changeEvent, listener);
  return () => window.removeEventListener(changeEvent, listener);
}
export function useThemePreference() {
  const selected = useSyncExternalStore(
    subscribe,
    () => preference,
    () => 'system' as const,
  );
  const resolved = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
    () => 'light' as const,
  );
  return { preference: selected, resolved, setPreference: setThemePreference };
}
