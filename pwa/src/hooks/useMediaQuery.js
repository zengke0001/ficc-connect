import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 768px)');
}
