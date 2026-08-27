import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';
import { fetchSiteById } from '../../features/site/siteThunks';
import { fetchRoadById } from '../../features/road/roadThunks';
import MediaService from '../../services/MediaService';
import type { MediaAsset } from '../../types/media';
import BottomSheetCard from './BottomSheetCard';
import { SearchItem } from './mapTypes';
import { siteTypeConverter } from '../../utils/siteTypesConfig';
import './MapInfoCard.css';


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
  const [coverImage, setCoverImage] = useState<MediaAsset | null>(null);

  useEffect(() => {
    if (!searchItem.type || !searchItem.id) return;
    if (searchItem.type === 'site') {
      dispatch(fetchSiteById(searchItem.id as string));
    } else if (searchItem.type === 'road') {
      dispatch(fetchRoadById(searchItem.id as string));
    }
  }, [searchItem, dispatch]);

  useEffect(() => {
    if (searchItem.type !== 'site' && searchItem.type !== 'road') {
      return;
    }
    let cancelled = false;
    const targetType = searchItem.type === 'site' ? 'SITE' : 'ROAD';
    MediaService.findByTarget(targetType, searchItem.id)
      .then((assets) => {
        if (cancelled) return;
        const cover = assets.find((asset) => asset.isCover) ?? assets[0] ?? null;
        setCoverImage(cover);
      })
      .catch(() => {
        if (!cancelled) setCoverImage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [searchItem]);

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
    const siteType = siteTypeConverter(details.siteType);
    return (
      <BottomSheetCard onDismiss={clearSelection}>
        <button className="closeBtn" onClick={clearSelection}>
          ✖
        </button>
        {coverImage && (
          <img
            className="infoCard-coverImage"
            src={coverImage.fullUrl}
            alt={coverImage.caption ?? details.name ?? 'Site photo'}
          />
        )}
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
      </BottomSheetCard>
    );
  }

  if (searchItem.type === 'road') {
    return (
      <BottomSheetCard onDismiss={clearSelection}>
        <button className="closeBtn" onClick={clearSelection}>
          ✖
        </button>
        {coverImage && (
          <img
            className="infoCard-coverImage"
            src={coverImage.fullUrl}
            alt={coverImage.caption ?? details.name ?? 'Road photo'}
          />
        )}
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
      </BottomSheetCard>
    );
  }

  return (
    <div className="infoCard">
      <p>Unknown type</p>
    </div>
  );
};

export default MapInfoCard;
