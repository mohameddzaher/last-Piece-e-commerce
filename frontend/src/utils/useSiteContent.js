import { useEffect, useState } from 'react';
import { siteContentAPI } from './endpoints';
import { useI18n } from './i18n';
import { useSocketEvent } from './socket';

/**
 * Fetch all public CMS entries and return a keyed map with current-language values.
 * Re-fetches when the language changes or when the CMS updates in real-time.
 */
export const useSiteContent = () => {
  const lang = useI18n((s) => s.lang);
  const [map, setMap] = useState({});

  const load = async () => {
    try {
      const r = await siteContentAPI.getAll({ lang });
      const next = {};
      (r.data.data || []).forEach((it) => {
        next[it.key] = it.value;
      });
      setMap(next);
    } catch (e) {
      // silent — component can fall back to defaults
    }
  };

  useEffect(() => { load(); }, [lang]);
  useSocketEvent('site-content:updated', () => load(), [lang]);
  useSocketEvent('site-content:deleted', () => load(), [lang]);

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
