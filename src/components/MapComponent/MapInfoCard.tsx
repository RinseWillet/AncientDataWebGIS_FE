import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';
import { fetchSiteById } from '../../features/site/siteThunks';
import { fetchRoadById } from '../../features/road/roadThunks';
import './MapInfoCard.css';

const siteTypeMap: Record<string, string> = {
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
  site: 'generic site',
};

interface SearchItem {
  type: string;
  id: string | number;
}

interface MapInfoCardProps {
  searchItem: SearchItem;
  clearSelection: () => void;
}

interface FeatureProperties {
  id?: string | number;
  name?: string;
  siteType?: string;
  description?: string;
  type?: string;
  typeDescription?: string;
  date?: string;
}

interface GeoJsonFeature {
  properties?: FeatureProperties;
}

interface GeoJsonCollection {
  features?: GeoJsonFeature[];
  error?: string;
}

const MapInfoCard = ({ searchItem, clearSelection }: MapInfoCardProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { selectedSite } = useAppSelector((state: RootState) => state.sites);
  const { selectedRoad } = useAppSelector((state: RootState) => state.roads);

  useEffect(() => {
    if (!searchItem.type || !searchItem.id) return;
    if (searchItem.type === 'site') {
      dispatch(fetchSiteById(searchItem.id as string));
    } else if (searchItem.type === 'road') {
      dispatch(fetchRoadById(searchItem.id as string));
    }
  }, [searchItem, dispatch]);

  const selectedRoadId = String(
    (selectedRoad as GeoJsonCollection | null)?.features?.[0]?.properties?.id
  );
  const isRoadMatch = selectedRoadId === String(searchItem.id);

  let info: GeoJsonCollection | null;
  if (searchItem.type === 'site') {
    info = selectedSite;
  } else if (isRoadMatch) {
    info = selectedRoad;
  } else {
    info = null;
  }

  const feature = info?.features?.[0];
  const details = feature?.properties;

  if (!info || !feature || !details) {
    return (
      <div className="infoCard">
        <p>Loading Data...</p>
      </div>
    );
  }

  if (info.error) {
    return (
      <div className="infoCard">
        <p>Error loading data</p>
      </div>
    );
  }

  const detailsId = details.id ?? searchItem.id;

  const viewDetails = () => {
    if (searchItem.type === 'site') {
      navigate(`/datalist/siteinfo/${detailsId}`);
    } else if (searchItem.type === 'road') {
      navigate(`/datalist/roadinfo/${detailsId}`);
    }
  };

  if (searchItem.type === 'site') {
    const siteType = siteTypeMap[details.siteType ?? ''] ?? 'unknown';
    return (
      <div className="infoCard">
        <button className="closeBtn" onClick={clearSelection}>
          ✖
        </button>
        <h2>{details.name}</h2>
        <br />
        <b>Identification:</b>
        <br />
        {siteType}
        <button className="infoCard-detailsBtn" onClick={viewDetails}>
          View full details
        </button>
        <span>
          <b>Description:</b>
          <br />
          {details.description}
        </span>
      </div>
    );
  }

  if (searchItem.type === 'road') {
    return (
      <div className="infoCard">
        <button className="closeBtn" onClick={clearSelection}>
          ✖
        </button>
        <h2>{details.name}</h2>
        <br />
        <b>Identification:</b>
        <br />
        {details.type} {details.typeDescription && <>– {details.typeDescription}</>}
        <button className="infoCard-detailsBtn" onClick={viewDetails}>
          View full details
        </button>
        <b>Description:</b>
        <br />
        <span>{details.description}</span>
        <br />
        {details.date && (
          <>
            <h4>Date:</h4>
            <span>{details.date}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="infoCard">
      <p>Unknown type</p>
    </div>
  );
};

export default MapInfoCard;
