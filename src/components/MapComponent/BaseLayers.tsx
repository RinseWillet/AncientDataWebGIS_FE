import { LayersControl, TileLayer, WMSTileLayer } from 'react-leaflet';

interface TileBaseLayer {
  kind: 'tile';
  name: string;
  attribution: string;
  url: string;
  checked?: boolean;
}

interface WmsBaseLayer {
  kind: 'wms';
  name: string;
  url: string;
  layers: string;
  checked?: boolean;
}

type BaseLayerConfig = TileBaseLayer | WmsBaseLayer;

const baseLayers: BaseLayerConfig[] = [
  {
    kind: 'tile',
    name: 'Positron Modern Topographical',
    attribution: ' OpenStreetMap contributors,  CartoDB',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    checked: true,
  },
  {
    kind: 'tile',
    name: 'Open Street Map Topographical',
    attribution: ' OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  {
    kind: 'tile',
    name: 'Satellite',
    attribution: 'Tiles  Esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  {
    kind: 'wms',
    name: '1801–1828: Kartenaufnahme der Rheinlande',
    url: 'https://www.wms.nrw.de/geobasis/wms_nw_tranchot?',
    layers: 'nw_tranchot',
  },
  {
    kind: 'wms',
    name: '1836–1850: Preuische Kartenaufnahme',
    url: 'https://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?',
    layers: 'nw_uraufnahme_rw',
  },
  {
    kind: 'wms',
    name: '1891–1912: Preuische Kartenaufnahme',
    url: 'https://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?',
    layers: 'nw_neuaufnahme',
  },
];

/** Renders the configured set of selectable base layers. */
const BaseLayers = () => (
  <>
    {baseLayers.map((layer) => (
      <LayersControl.BaseLayer key={layer.name} checked={layer.checked} name={layer.name}>
        {layer.kind === 'tile' ? (
          <TileLayer attribution={layer.attribution} url={layer.url} />
        ) : (
          <WMSTileLayer url={layer.url} layers={layer.layers} />
        )}
      </LayersControl.BaseLayer>
    ))}
  </>
);

export default BaseLayers;

