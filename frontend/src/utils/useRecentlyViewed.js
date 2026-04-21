'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'lp_recently_viewed_v1';
const MAX = 12;

const read = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

const write = (ids) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
  } catch {}
};

/**
 * Track the last N products the user visited. Used to populate
 * "Customers also viewed" / "Recently viewed" rails.
 */
export const useRecentlyViewed = () => {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    setIds(read());
  }, []);

  const push = useCallback((productId) => {
    if (!productId) return;
    const next = [productId, ...read().filter((x) => x !== productId)].slice(0, MAX);
    write(next);
    setIds(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setIds([]);
  }, []);

  return { ids, push, clear };
};
