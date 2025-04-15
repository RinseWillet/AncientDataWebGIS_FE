import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSiteById } from '../../features/site/siteThunks';
import { fetchRoadById } from '../../features/road/roadThunks';

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
  const dispatch = useDispatch();

  const { selectedSite } = useSelector((state) => state.sites);
  const { selectedRoad } = useSelector((state) => state.roads);

  useEffect(() => {
    if (!searchItem.type || !searchItem.id) return;

    if (searchItem.type === 'site') {
      dispatch(fetchSiteById(searchItem.id));
    } else if (searchItem.type === 'road') {
      dispatch(fetchRoadById(searchItem.id));
    }
  }, [searchItem, dispatch]);

  const info = searchItem.type === 'site' ? selectedSite : selectedRoad;
  const feature = info?.features?.[0];
  const props = feature?.properties;

  if (!info || !feature || !props) {
    return <div className="infoCard" ref={infoRef}><p>Loading Data...</p></div>;
  }

  if (info.error) {
    return <div className="infoCard" ref={infoRef}><p>Error loading data</p></div>;
  } 
  
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