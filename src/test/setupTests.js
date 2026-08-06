import '@testing-library/jest-dom/vitest';

if (!window.matchMedia) {
  window.matchMedia = function matchMedia(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

// jsdom does not implement PointerEvent (https://github.com/jsdom/jsdom/issues/2527),
// so testing-library's fireEvent.pointer* helpers fall back to a plain Event and drop
// properties like clientY/pointerId. Polyfill it as a thin MouseEvent subclass so
// pointer-based drag interactions (e.g. BottomSheetCard) can be tested with real coordinates.
if (!window.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type, params = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
      this.isPrimary = params.isPrimary ?? true;
    }
  }
  window.PointerEvent = PointerEvent;
}
