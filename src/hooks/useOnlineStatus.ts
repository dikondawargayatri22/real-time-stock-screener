'use client';

import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  // Keep the server render and the browser's first render identical. Reading
  // navigator.onLine here can otherwise make an offline browser choose a
  // different branch while React is hydrating the server HTML.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  return isOnline;
}
