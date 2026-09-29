import { useCallback, useEffect, useState } from 'react';

export type Theme = 'day' | 'night' | 'hercules';
type Stored = { base: 'day' | 'night' | 'auto'; hercules: boolean };

const KEY = 'ancientdata.theme';
const DEFAULT: Stored = { base: 'auto', hercules: false };

const read = (): Stored => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT; // private mode / blocked storage: just use the defaults
  }
};
const write = (s: Stored) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
};

const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

/**
 * Day follows the device setting until the visitor picks Day or Night by hand;
 * Hercules is a separate switch on top (F9 toggles it). Sets <html data-theme>.
 */
export const useTheme = () => {
  const [stored, setStored] = useState<Stored>(read);
  const [dark, setDark] = useState(systemDark);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq?.addEventListener('change', on);
    return () => mq?.removeEventListener('change', on);
  }, []);

  const base = stored.base === 'auto' ? (dark ? 'night' : 'day') : stored.base;
  const theme: Theme = stored.hercules ? 'hercules' : base;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('crt', theme === 'hercules');
  }, [theme]);

  const update = useCallback((next: Partial<Stored>) => {
    setStored((prev) => {
      const s = { ...prev, ...next };
      write(s);
      return s;
    });
  }, []);

  const toggleNight = () => update({ base: base === 'night' ? 'day' : 'night', hercules: false });
  const toggleHercules = () => update({ hercules: !stored.hercules });

  // F9 switches Hercules on/off (ignored while typing in a form field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === 'F9' && !/INPUT|TEXTAREA|SELECT/.test(t.tagName)) {
        e.preventDefault();
        update({ hercules: !read().hercules });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [update]);

  return { theme, base, toggleNight, toggleHercules };
};
