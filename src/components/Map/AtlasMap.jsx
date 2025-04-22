import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoads } from '../../features/road/roadThunks';
import { fetchSites } from '../../features/site/siteThunks';
import { useEffect } from 'react';
import BaseMapContainer from './BaseMapContainer';
import MapContent from './MapContent';
import MapInfoCard from './MapInfoCard';

const AtlasMap = ({ queryItem }) => {
  const dispatch = useDispatch();
  const [searchItem, setSearchItem] = useState(null);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const siteMarkersRef = useRef({});

  const { roadData, loaded: roadsLoaded } = useSelector(state => state.roads);
  const { siteData, loaded: sitesLoaded } = useSelector(state => state.sites);

  useEffect(() => {
    if (!roadsLoaded) dispatch(fetchRoads());
    if (!sitesLoaded) dispatch(fetchSites());
  }, [dispatch, roadsLoaded, sitesLoaded]);

  if (!roadData || !siteData) {
    return <p>Loading map data...</p>;
  }

  return (
    <div className="wrapper">
      <div className="infoMap">
        <BaseMapContainer>
          <MapContent
            siteData={siteData}
            roadData={roadData}
            setShowInfoCard={setShowInfoCard}
            setSearchItem={setSearchItem}
            queryItem={queryItem}
            searchItem={searchItem}
            siteMarkersRef={siteMarkersRef}
          />
        </BaseMapContainer>
      </div>

      {showInfoCard && searchItem && (
        <MapInfoCard
          searchItem={searchItem}
          clearSelection={() => {
            setSearchItem(null);
            setShowInfoCard(false);
          }}
        />
      )}
    </div>
  );
};

export default AtlasMap;