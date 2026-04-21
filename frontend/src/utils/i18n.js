/**
 * i18n store.
 *
 * Synchronous boot: translations are bundled directly in the JS, so the
 * first render already has the correct text — no async fetch, no flash,
 * no hang on refresh.
 *
 * Custom (not next-i18next) because the Pages Router here uses plain JSX
 * pages without per-page getStaticProps; rather than retrofit every page,
 * we keep one tiny store + a `t()` helper. This can be swapped for
 * next-i18next later without changing call sites.
 */
import { create } from 'zustand';
import en from '@/translations/en.json';
import ar from '@/translations/ar.json';

const TRANSLATIONS = { en, ar };
const SUPPORTED = ['en', 'ar'];
const DEFAULT_LANG = 'en';
const RTL_LANGS = ['ar', 'he', 'fa', 'ur'];

// Always start with DEFAULT_LANG on both server and client initial render —
// reading localStorage here would cause an SSR/hydration mismatch. The saved
// lang is applied in useEffect via the `init()` method below.
const initialLang = DEFAULT_LANG;

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

export const useI18n = create((set, getState) => ({
  lang: initialLang,
  dir: RTL_LANGS.includes(initialLang) ? 'rtl' : 'ltr',
  translations: TRANSLATIONS[initialLang] || TRANSLATIONS[DEFAULT_LANG],
  ready: true,

  setLanguage: (lang) => {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
    const translations = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', dir);
      document.body.classList.toggle('font-arabic', lang === 'ar');
    }
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('lang', lang); } catch {}
    }

    set({ lang, dir, translations, ready: true });
  },

  // Re-applies `lang` and `dir` to the <html> element. Called once on mount
  // to sync the DOM with the already-initialized store state.
  applyDom: () => {
    if (typeof document === 'undefined') return;
    const { lang, dir } = getState();
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    document.body.classList.toggle('font-arabic', lang === 'ar');
  },

  // Called after mount in _app. Reads the saved lang from localStorage (safe
  // only on client) and applies it. If English, just syncs DOM attrs.
  init: () => {
    if (typeof window === 'undefined') return;
    let saved = DEFAULT_LANG;
    try {
      const v = localStorage.getItem('lang');
      if (SUPPORTED.includes(v)) saved = v;
    } catch {}
    if (saved !== getState().lang) {
      getState().setLanguage(saved);
    } else {
      getState().applyDom();
    }
  },

  t: (key, fallback) => {
    const { translations } = getState();
    const v = get(translations, key);
    return v != null ? v : fallback != null ? fallback : key;
  },
}));

export const t = (key, fallback) => useI18n.getState().t(key, fallback);
