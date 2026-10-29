import { fishSpecies } from '@lurelog/shared';
import { useSyncExternalStore } from 'react';
import polish from './pl.json';

export type Language = 'en' | 'pl';
const key = 'lurelog-language';
const listeners = new Set<() => void>();
function readLanguage(): Language {
  try {
    return localStorage.getItem(key) === 'pl' ? 'pl' : 'en';
  } catch {
    return 'en';
  }
}
let language = readLanguage();
export function getLanguage() {
  return language;
}
export function getLocale() {
  return language === 'pl' ? 'pl-PL' : 'en-GB';
}
export function t(
  source: string | undefined,
  values: Record<string, string | number> = {},
): string {
  if (!source) return '';
  const translated =
    language === 'pl' && Object.hasOwn(polish, source)
      ? (polish as Record<string, string>)[source]
      : source;
  return translated.replace(/{{(\w+)}}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}
export function setLanguage(next: Language) {
  language = next;
  try {
    localStorage.setItem(key, next);
  } catch {
    /* Keep working without storage. */
  }
  document.documentElement.lang = next;
  document.title =
    next === 'pl'
      ? 'LureLog — Każda przynęta ma swoją historię'
      : 'LureLog — Every lure has a story';
  listeners.forEach((listener) => listener());
}
export function initializeLanguage() {
  setLanguage(readLanguage());
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) setLanguage(readLanguage());
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function useTranslation() {
  const selected = useSyncExternalStore(subscribe, getLanguage, () => 'en' as const);
  return { t, language: selected, setLanguage, locale: getLocale() };
}
export const numberLabel = (value: number) =>
  new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 20 }).format(value);
export function countLabel(value: number, noun: 'catch' | 'lure' | 'species') {
  const category = new Intl.PluralRules(getLocale()).select(value);
  const forms =
    language === 'pl'
      ? {
          catch: { one: 'połów', few: 'połowy', many: 'połowów', other: 'połowu' },
          lure: { one: 'przynęta', few: 'przynęty', many: 'przynęt', other: 'przynęty' },
          species: { one: 'gatunek', few: 'gatunki', many: 'gatunków', other: 'gatunku' },
        }
      : {
          catch: { one: 'catch', other: 'catches' },
          lure: { one: 'lure', other: 'lures' },
          species: { one: 'species', other: 'species' },
        };
  const chosen = forms[noun] as Record<string, string>;
  return `${numberLabel(value)} ${chosen[category] ?? chosen.other}`;
}
export function validationMessage(message: string | undefined) {
  if (!message) return '';
  const translated = t(message);
  if (translated !== message) return translated;
  if (/email/i.test(message)) return t('Enter a valid email address');
  const minimum = message.match(/Too small.*string.*>=(\d+)/);
  if (minimum) return t('Use at least {{count}} characters', { count: minimum[1] });
  const maximum = message.match(/Too big.*string.*<=(\d+)/);
  if (maximum) return t('Use at most {{count}} characters', { count: maximum[1] });
  if (/Too small.*number/.test(message)) return t('Enter a number greater than zero.');
  if (/Too big.*number/.test(message)) return t('Enter a smaller number.');
  if (/expected number/.test(message)) return t('Enter a valid number.');
  if (/Invalid input|Invalid option/.test(message)) return t('Check this field.');
  return translated;
}

export function canonicalSpecies(value: string) {
  const entered = value.trim().toLocaleLowerCase('pl-PL');
  return (
    fishSpecies.find(
      (species) =>
        species.toLocaleLowerCase('pl-PL') === entered ||
        (polish as Record<string, string>)[species]?.toLocaleLowerCase('pl-PL') === entered,
    ) ?? value
  );
}
export const speciesLabel = (value: string) => t(canonicalSpecies(value));
