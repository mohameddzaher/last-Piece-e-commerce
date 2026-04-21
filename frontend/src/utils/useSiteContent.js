import { useEffect, useState } from 'react';
import { siteContentAPI } from './endpoints';
import { useI18n } from './i18n';
import { useSocketEvent } from './socket';

/**
 * Fetch all public CMS entries keyed by `key`, in the active language.
 *
 * Stale-while-revalidate pattern:
 *  1. On mount, pre-populate state from a localStorage cache keyed by lang,
 *     so the FIRST render already has the correct content — no more flicker
 *     where the page renders defaults, then swaps to CMS data a moment later.
 *  2. Kick off a network fetch in the background. When it returns, update
 *     state AND the cache so the next visit is even fresher.
 *
 * Also re-fetches when the language changes or when CMS updates arrive over
 * socket.io — so admins editing copy see their changes live across tabs.
 */
const CACHE_KEY = (lang) => `lp_cms_cache_${lang}`;

const readCache = (lang) => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY(lang));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCache = (lang, map) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY(lang), JSON.stringify(map));
  } catch {}
};

export const useSiteContent = () => {
  const lang = useI18n((s) => s.lang);
  // Initial state is empty on BOTH server and first client render (SSR safe).
  // We hydrate from cache in the first effect — this avoids a hydration
  // mismatch while still making the content available ~immediately.
  const [map, setMap] = useState({});

  const load = async (currentLang) => {
    try {
      const r = await siteContentAPI.getAll({ lang: currentLang });
      const next = {};
      (r.data.data || []).forEach((it) => {
        next[it.key] = it.value;
      });
      setMap(next);
      writeCache(currentLang, next);
    } catch {
      // Silent — components fall back to defaults if cache is empty too.
    }
  };

  useEffect(() => {
    // Synchronously pull cache for this lang → one quick re-render with the
    // content the user saw last time (usually accurate). Then fetch fresh.
    const cached = readCache(lang);
    if (Object.keys(cached).length) setMap(cached);
    load(lang);
  }, [lang]);

  useSocketEvent('site-content:updated', () => load(lang), [lang]);
  useSocketEvent('site-content:deleted', () => load(lang), [lang]);

  return map;
};

/**
 * Helper: safely resolve a CMS value with a default fallback.
 * Supports dot-path access into the value object.
 *
 * Also treats empty string / empty array as "not set" so pages don't
 * render blank when a placeholder CMS entry exists but hasn't been edited yet.
 */
export const pick = (obj, path, fallback) => {
  if (!obj) return fallback;
  if (!path) return obj;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return fallback;
    cur = cur[p];
  }
  if (cur == null) return fallback;
  if (typeof cur === 'string' && cur.trim() === '') return fallback;
  if (Array.isArray(cur) && cur.length === 0) return fallback;
  return cur;
};
