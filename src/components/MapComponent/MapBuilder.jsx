// React
import { useEffect, useState } from "react";

// Services
import SiteService from "../../services/SiteService";
import RoadService from "../../services/RoadService";
import MapContent from "./MapContent";

// Style
import 'leaflet/dist/leaflet.css';

const MapBuilder = ({ setShowInfoCard, setSearchItem, queryItem, isEditing, geometry, onGeometryChange }) => {
  const [siteData, setSiteData] = useState(null);
  const [roadData, setRoadData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllData() {
      try {
        const [siteResponse, roadResponse] = await Promise.all([
          SiteService.findAllGeoJson(),
          RoadService.findAllGeoJson(),
        ]);

        setSiteData(siteResponse.data);
        setRoadData(roadResponse.data);
      } catch (error) {
        console.error("Error loading map data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, []);

  if (loading || !siteData || !roadData) {
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