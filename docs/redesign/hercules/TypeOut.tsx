import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Hercules only: types a text out with a block cursor.
 * - ~40 characters/second, but never longer than `maxMs` — after that the rest appears at once
 * - only the first time a given `id` is shown in this browser session
 * - Space / Enter / click / tap skips to the end
 * - prefers-reduced-motion: text appears immediately, no cursor blink
 * Screen readers always get the full text (aria-label), never the partial one.
 */
interface Props {
  id: string;            // e.g. `road-142-description`
  text: string;
  cps?: number;
  maxMs?: number;
  className?: string;
}

const SEEN = 'ancientdata.typed';
const seen = (id: string) => {
  try { return (JSON.parse(sessionStorage.getItem(SEEN) ?? '[]') as string[]).includes(id); } catch { return false; }
};
const markSeen = (id: string) => {
  try {
    const all = new Set(JSON.parse(sessionStorage.getItem(SEEN) ?? '[]') as string[]);
    all.add(id);
    sessionStorage.setItem(SEEN, JSON.stringify([...all]));
  } catch { /* ignore */ }
};

export const TypeOut = ({ id, text, cps = 40, maxMs = 1500, className }: Props) => {
  const reduced = useReducedMotion();
  const instant = reduced || seen(id);
  const [shown, setShown] = useState(instant ? text.length : 0);
  const done = shown >= text.length;
  const start = useRef<number>(0);

  useEffect(() => {
    if (instant) return;
    start.current = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start.current;
      const n = elapsed >= maxMs ? text.length : Math.floor((elapsed / 1000) * cps);
      setShown(Math.min(n, text.length));
      if (n < text.length) raf = requestAnimationFrame(tick);
      else markSeen(id);
    };
    raf = requestAnimationFrame(tick);
    const skip = (e: KeyboardEvent | PointerEvent) => {
      if (e instanceof KeyboardEvent && e.key !== ' ' && e.key !== 'Enter') return;
      setShown(text.length);
      markSeen(id);
      cancelAnimationFrame(raf);
    };
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [id, text, cps, maxMs, instant]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      {!done && <span className="cursor" aria-hidden="true" />}
    </span>
  );
};

/* Usage: in Hercules render <TypeOut id={`road-${id}-description`} text={description} />,
   in Day/Night render <CitedText …/> as usual. For long texts, type only the first
   paragraph and show the rest instantly — maxMs already caps the wait. */
