import React, { useRef, useState, useEffect } from 'react';
import SiteService from '../../services/SiteService';
import RoadService from '../../services/RoadService';

const siteTypeMap = {
  castellum: 'castellum',
  pos_castellum: 'possible castellum',
  legfort: 'legionary fortress / castra',
  watchtower: 'watchtower',
  city: 'autonomous city',
  cem: '(Roman) cemetery',
  ptum: 'possible barrow',
  tum: '(Prehistoric?) barrow',
  villa: 'villa',
  pvilla: 'possible villa',
  sett: 'settlement',
  settS: 'settlement with stone buildings',
  sanctuary: 'sanctuary',
  ship: 'shipwreck',
  pship: 'possible shipwreck',
  site: 'generic site'
};

const MapInfoCard = ({ searchItem }) => {
  const infoRef = useRef(null);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!searchItem.type || !searchItem.id) return;

    const fetchData = async () => {
      try {
        if (searchItem.type === 'site') {
          const response = await SiteService.findByIdGeoJson(searchItem.id);
          setInfo(response.data);
        } else if (searchItem.type === 'road') {
          const response = await RoadService.findByIdGeoJson(searchItem.id);
          setInfo(response.data);
        }
      } catch (error) {
        console.error('Error loading info card data:', error);
        setInfo({ error: true });
      }
    };

    fetchData();
  }, [searchItem]);

  if (!info) {
    return <div className="infoCard" ref={infoRef}><p>Loading Data</p></div>;
  }

  if (info.error) {
    return <div className="infoCard" ref={infoRef}><p>Error loading data</p></div>;
  }

  const feature = info?.features?.[0];
  const props = feature?.properties;
  
  if (!props) {
    return <div className="infoCard" ref={infoRef}><p>No data available</p></div>;
  }

  if (searchItem.type === 'site') {
    const siteType = siteTypeMap[props.siteType] || 'unknown';
    return (
      <div className="infoCard" ref={infoRef}>
        <b>Identification:</b><br />{siteType}<br />
        <span>
          <b>Description:</b><br />{props.description}
        </span>
      </div>
    );
  }

  if (searchItem.type === 'road') {
    return (
      <div className="infoCard" ref={infoRef}>
        <h2>{props.name}</h2><br />
        <b>Identification:</b><br />
        {props.type} {props.typeDescription && <>– {props.typeDescription}</>}<br />
        <b>Description:</b><br />
        <span>{props.description}</span><br />
        {props.date && (
          <>
            <h4>Date:</h4>
            <span>{props.date}</span>
          </>
        )}
      </div>
    );
  }

  return <div className="infoCard" ref={infoRef}><p>Unknown type</p></div>;
};

export default MapInfoCard;