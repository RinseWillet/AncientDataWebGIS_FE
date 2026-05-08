import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSiteById } from '../../features/site/siteThunks';
import { fetchRoadById } from '../../features/road/roadThunks';
import './MapInfoCard.css';

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

const MapInfoCard = ({ searchItem, clearSelection }) => {
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

  const info =
    searchItem.type === 'site'
      ? selectedSite
      : String(selectedRoad?.features?.[0]?.properties?.id) === String(searchItem.id)
        ? selectedRoad
        : null;

  const feature = info?.features?.[0];
  const details = feature?.properties;


  if (!info || !feature || !details) {
    return <div className="infoCard" ref={infoRef}><p>Loading Data...</p></div>;
  }

  if (info.error) {
    return <div className="infoCard" ref={infoRef}><p>Error loading data</p></div>;
  }

  if (searchItem.type === 'site') {
    const siteType = siteTypeMap[details.siteType] || 'unknown';
    return (
      <div className="infoCard" ref={infoRef}>
        <button className="closeBtn" onClick={clearSelection}>✖</button>
        <h2>{details.name}</h2><br />
        <b>Identification:</b><br />{siteType}<br />
        <span>
          <b>Description:</b><br />{details.description}
        </span>
      </div>
    );
  }

  if (searchItem.type === 'road') {
    return (
      <div className="infoCard" ref={infoRef}>
        <button className="closeBtn" onClick={clearSelection}>✖</button>
        <h2>{details.name}</h2><br />
        <b>Identification:</b><br />
        {details.type} {details.typeDescription && <>– {details.typeDescription}</>}<br />
        <b>Description:</b><br />
        <span>{details.description}</span><br />
        {details.date && (
          <>
            <h4>Date:</h4>
            <span>{details.date}</span>
          </>
        )}
      </div>
    );
  }

  return <div className="infoCard" ref={infoRef}><p>Unknown type</p></div>;
};

MapInfoCard.propTypes = {
  searchItem: PropTypes.shape({
    type: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  clearSelection: PropTypes.func.isRequired,
};

export default MapInfoCard;
