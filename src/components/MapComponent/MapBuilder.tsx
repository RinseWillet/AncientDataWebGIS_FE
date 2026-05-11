import { useEffect, MutableRefObject } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';
import { fetchRoads } from '../../features/road/roadThunks';
import { fetchSites } from '../../features/site/siteThunks';
import MapContent from './MapContent';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface SearchItem {
  type: string;
  id: string | number;
}

interface QueryItem {
  type: string;
  id: string | number;
}

interface MapBuilderProps {
  setShowInfoCard: (show: boolean) => void;
  setSearchItem: (item: SearchItem) => void;
  queryItem?: QueryItem;
  searchItem?: SearchItem;
  isEditing?: boolean;
  geometry?: string;
  onGeometryChange?: (wkt: string) => void;
  siteMarkersRef: MutableRefObject<Record<string | number, L.Marker>>;
}

const MapBuilder = ({
  setShowInfoCard,
  setSearchItem,
  queryItem,
  searchItem,
  isEditing,
  geometry,
  onGeometryChange,
  siteMarkersRef,
}: MapBuilderProps) => {
  const dispatch = useAppDispatch();

  const { roadData, loading: roadLoading, loaded: roadsLoaded } = useAppSelector(
    (state: RootState) => state.roads,
  );
  const { siteData, loading: siteLoading, loaded: sitesLoaded } = useAppSelector(
    (state: RootState) => state.sites,
  );

  useEffect(() => {
    if (!roadsLoaded) dispatch(fetchRoads());
    if (!sitesLoaded) dispatch(fetchSites());
  }, [dispatch, roadsLoaded, sitesLoaded]);

  if (roadLoading || siteLoading || !roadData || !siteData) {
    return <p>Loading map data...</p>;
  }

  return (
    <MapContent
      siteData={siteData as object}
      roadData={roadData as object}
      setShowInfoCard={setShowInfoCard}
      setSearchItem={setSearchItem}
      queryItem={queryItem}
      searchItem={searchItem}
      isEditing={isEditing}
      geometry={geometry}
      onGeometryChange={onGeometryChange}
      siteMarkersRef={siteMarkersRef}
    />
  );
};

export default MapBuilder;

