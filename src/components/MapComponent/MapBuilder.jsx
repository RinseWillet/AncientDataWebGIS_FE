import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoads } from "../../features/road/roadThunks";
import { fetchSites } from "../../features/site/siteThunks";
import MapContent from "./MapContent";
import 'leaflet/dist/leaflet.css';

const MapBuilder = ({ setShowInfoCard, setSearchItem, queryItem, isEditing, geometry, onGeometryChange }) => {
  const dispatch = useDispatch();

  const { roadData, loading: roadLoading, loaded: roadsLoaded } = useSelector(state => state.roads);
  const { siteData, loading: siteLoading, loaded: sitesLoaded } = useSelector(state => state.sites);
  
  useEffect(() => {
    if (!roadsLoaded) dispatch(fetchRoads());
    if (!sitesLoaded) dispatch(fetchSites());
  }, [dispatch, roadsLoaded, sitesLoaded]);

  if (roadLoading || siteLoading || !roadData || !siteData) {
    return <p>Loading map data...</p>;
  }

  return (
    <MapContent
      siteData={siteData}
      roadData={roadData}
      setShowInfoCard={setShowInfoCard}
      setSearchItem={setSearchItem}
      queryItem={queryItem}
      isEditing={isEditing}
      geometry={geometry}
      onGeometryChange={onGeometryChange}
    />
  );
};

export default MapBuilder;