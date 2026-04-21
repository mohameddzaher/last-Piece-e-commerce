'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * Thin top-of-page progress bar that shows during route transitions.
 * Gives the "smooth professional" feel on navigation.
 */
export default function RouteProgress() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer;
    const start = () => {
      setVisible(true);
      setProgress(10);
      let p = 10;
      timer = setInterval(() => {
        p = Math.min(p + Math.random() * 10, 80);
        setProgress(p);
      }, 200);
    };
    const done = () => {
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    };

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', done);
    router.events.on('routeChangeError', done);
    return () => {
      clearInterval(timer);
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', done);
      router.events.off('routeChangeError', done);
    };
  }, [router.events]);

  if (!visible) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
