import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import L from 'leaflet';

// jsdom has no WebGL context, so the real @maplibre/maplibre-gl-leaflet layer
// throws on mount. Every test that renders a real Leaflet map (MapContent,
// BaseLayers, useLayerPanelControl) can hit the Positron vector base layer,
// so this is mocked globally rather than per test file. The fake still
// renders a placeholder div into the tile pane so DOM assertions that count
// base-layer elements keep working.
vi.mock('@maplibre/maplibre-gl-leaflet', () => {
  const MockMaplibreLayer = L.Layer.extend({
    onAdd(map) {
      this._container = L.DomUtil.create('div', 'leaflet-layer maplibre-gl-mock', map.getPane('tilePane'));
    },
    onRemove() {
      L.DomUtil.remove(this._container);
    },
  });
  return { maplibreGL: () => new MockMaplibreLayer() };
});

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
