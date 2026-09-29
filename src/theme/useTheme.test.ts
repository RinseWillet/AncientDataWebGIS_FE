import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from './useTheme';

const KEY = 'ancientdata.theme';

/** Installs a controllable `window.matchMedia('(prefers-color-scheme: dark)')` stub and
 * returns a `trigger` helper to simulate the OS switching light/dark mode. */
const installMatchMedia = (initialMatches: boolean) => {
  let listener: ((e: MediaQueryListEvent) => void) | undefined;
  const mql = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_event: string, cb: (e: MediaQueryListEvent) => void) => {
      listener = cb;
    },
    removeEventListener: () => {
      listener = undefined;
    },
  } as unknown as MediaQueryList;
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return {
    trigger(matches: boolean) {
      (mql as { matches: boolean }).matches = matches;
      act(() => {
        listener?.({ matches } as MediaQueryListEvent);
      });
    },
  };
};

const dispatchF9 = (target: HTMLElement) => {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'F9', bubbles: true }));
  });
};

describe('useTheme (E5-2)', () => {
  beforeEach(() => {
    localStorage.clear();
    installMatchMedia(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete document.documentElement.dataset.theme;
    document.documentElement.classList.remove('crt');
  });

  it('reads a stored { base, hercules } preference and applies it to document.documentElement.dataset.theme on mount', () => {
    localStorage.setItem(KEY, JSON.stringify({ base: 'night', hercules: false }));

    renderHook(() => useTheme());

    expect(document.documentElement.dataset.theme).toBe('night');
  });

  it('applies hercules from the stored preference, overriding base', () => {
    localStorage.setItem(KEY, JSON.stringify({ base: 'day', hercules: true }));

    renderHook(() => useTheme());

    expect(document.documentElement.dataset.theme).toBe('hercules');
  });

  it('toggleNight writes the exact { base, hercules } shape back to localStorage', () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleNight());

    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ base: 'night', hercules: false });
  });

  it('toggleHercules writes the exact { base, hercules } shape back to localStorage', () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleNight());
    act(() => result.current.toggleHercules());

    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ base: 'night', hercules: true });
  });

  it('falls back to DEFAULT when the stored value is corrupt/unparseable, without throwing', () => {
    localStorage.setItem(KEY, '{not valid json');
    const media = installMatchMedia(false);

    expect(() => renderHook(() => useTheme())).not.toThrow();

    // DEFAULT is { base: 'auto', hercules: false }: resolves off the system
    // preference (not stuck on some invalid leftover) and hercules is off.
    expect(document.documentElement.dataset.theme).toBe('day');
    media.trigger(true);
    expect(document.documentElement.dataset.theme).toBe('night');
  });

  it('falls back to DEFAULT without crashing when localStorage is unavailable (private mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked');
    });
    const media = installMatchMedia(false);

    let hook: ReturnType<typeof renderHook<ReturnType<typeof useTheme>, unknown>>;
    expect(() => {
      hook = renderHook(() => useTheme());
    }).not.toThrow();

    expect(document.documentElement.dataset.theme).toBe('day');
    media.trigger(true);
    expect(document.documentElement.dataset.theme).toBe('night');

    expect(() => act(() => hook!.result.current.toggleNight())).not.toThrow();
  });

  it('follows prefers-color-scheme while base is auto, until the visitor picks a theme by hand', () => {
    const media = installMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    expect(document.documentElement.dataset.theme).toBe('day');

    media.trigger(true);
    expect(document.documentElement.dataset.theme).toBe('night');

    media.trigger(false);
    expect(document.documentElement.dataset.theme).toBe('day');

    act(() => result.current.toggleNight());
    expect(document.documentElement.dataset.theme).toBe('night');

    // base is no longer 'auto' after a manual pick, so system changes stop mattering
    media.trigger(true);
    expect(document.documentElement.dataset.theme).toBe('night');
    media.trigger(false);
    expect(document.documentElement.dataset.theme).toBe('night');
  });

  it('F9 toggles Hercules', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.dataset.theme).toBe('day');

    dispatchF9(document.body);
    expect(document.documentElement.dataset.theme).toBe('hercules');

    dispatchF9(document.body);
    expect(document.documentElement.dataset.theme).toBe('day');
  });

  it.each(['INPUT', 'TEXTAREA', 'SELECT'])(
    'F9 is ignored while a %s is focused',
    (tagName) => {
      renderHook(() => useTheme());
      const field = document.createElement(tagName.toLowerCase()) as HTMLElement;
      document.body.appendChild(field);
      field.focus();

      dispatchF9(field);

      expect(document.documentElement.dataset.theme).toBe('day');
      document.body.removeChild(field);
    }
  );
});
