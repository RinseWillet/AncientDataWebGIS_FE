import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { useReducedMotion } from './useReducedMotion';
import './scanImage.css';

/**
 * Hercules only: an image that "loads line by line" in green.
 * The scan runs once, when the image has actually arrived (no artificial delay):
 * images that are already cached (img.complete on mount) appear at once.
 * 24 bands over `ms` milliseconds; reduced motion → no scan.
 */
export const ScanImage = ({ ms = 900, className = '', ...img }: ImgHTMLAttributes<HTMLImageElement> & { ms?: number }) => {
  const ref = useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();
  const [state, setState] = useState<'waiting' | 'scanning' | 'done'>('waiting');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced || (el.complete && el.naturalWidth > 0)) setState('done');
  }, [reduced]);

  return (
    <span className={`scan-image scan-image--${state} ${className}`} style={{ ['--scan-ms' as string]: `${ms}ms` }}>
      <img
        ref={ref}
        {...img}
        onLoad={(e) => {
          img.onLoad?.(e);
          setState((s) => (s === 'done' ? s : 'scanning'));
        }}
      />
      <span className="scan-image__line" aria-hidden="true" />
    </span>
  );
};
