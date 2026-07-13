import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import type { RootState } from '../app/store';
import { selectIsAdmin } from '../features/authentication/authSelectors';
import { fetchRoadById } from '../features/road/roadThunks';
import { fetchModernReferencesByRoadId } from '../features/modref/modRefThunks';
import RoadService from '../services/RoadService';
import { geoJSONtoWKT } from '../utils/geometryUtils';
import MapComponent from '../components/MapComponent/MapComponent';
import ModernReferencePicker from '../components/ModernReferencePicker/ModernReferencePicker';
import MediaGallery from '../components/MediaGallery/MediaGallery';
import './InfoPage.css';

interface ModernReference {
  id: number;
  shortRef: string;
  fullRef: string;
  url: string | null;
}

interface RoadEditFormData {
  name: string;
  type: string;
  typeDescription: string;
  location: string;
  description: string;
  date: string;
  geom: string;
  cat_nr: string;
}

interface FeatureProperties {
  name?: string;
  type?: string;
  typeDescription?: string;
  location?: string;
  description?: string;
  date?: string;
  references?: string;
  historicalReferences?: string;
  cat_nr?: string;
}

interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

interface GeoJsonFeature {
  properties?: FeatureProperties;
  geometry?: GeoJsonGeometry;
}

interface GeoJsonCollection {
  features?: GeoJsonFeature[];
}

const RoadInfo = () => {
  const [isEditing, setIsEditing] = useState(false);
  const isAdmin = useAppSelector(selectIsAdmin);
  const dispatch = useAppDispatch();
  const { selectedRoad, error } = useAppSelector((state: RootState) => state.roads);

  const [editFormData, setEditFormData] = useState<RoadEditFormData>({
    name: '',
    type: '',
    typeDescription: '',
    location: '',
    description: '',
    date: '',
    geom: '',
    cat_nr: '',
  });

  const { id } = useParams<{ id: string }>();

  const { referencesByRoadId } = useAppSelector((state: RootState) => state.modRef);
  const modRef = referencesByRoadId[id ?? ''] as ModernReference[] | undefined;

  const [selectedReferences, setSelectedReferences] = useState<ModernReference[]>([]);
  const [galleryAssets, setGalleryAssets] = useState<MediaAsset[]>([]);

  const navigate = useNavigate();
  const backButtonHandler = () => navigate('/datalist/');

  useEffect(() => {
    if (id) {
      dispatch(fetchRoadById(id));
      dispatch(fetchModernReferencesByRoadId(id));
    }
  }, [dispatch, id]);

  const query = { type: 'road', id: id ?? '' };

  if (!selectedRoad || !modRef) {
    return (
      <div className="roadinfo-card">
        <p>Loading data</p>
      </div>
    );
  } else if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  } else {
    const collection = selectedRoad as GeoJsonCollection;
    const feature = collection.features?.[0];
    if (!feature) return <p>No feature found</p>;

    const { properties = {} } = feature;
    const {
      name, type, typeDescription, location,
      description, date, references, historicalReferences,
    } = properties;

    // MultiLineString coordinates are [lng, lat]; fall back to app default center
    const firstCoord = (feature.geometry?.coordinates as number[][][] | undefined)?.[0]?.[0];
    const initialMapCenter = firstCoord
      ? { lat: firstCoord[1], lng: firstCoord[0] }
      : { lat: 51.8, lng: 5.8 };

    const photoMarkers = galleryAssets
      .filter((asset) => asset.latitude != null && asset.longitude != null)
      .map((asset) => ({
        id: asset.id,
        latitude: asset.latitude as number,
        longitude: asset.longitude as number,
        fullUrl: asset.fullUrl,
        caption: asset.caption,
      }));

    const modernReferenceRenderer = (refs: ModernReference[]) => {
      if (refs.length > 0) {
        return refs.map((ref) =>
          ref.url === null ? (
            <li key={ref.id} className="reference-listitem__nolink">{ref.fullRef}</li>
          ) : (
            <li key={ref.id}><a href={ref.url} className="reference-listitem__link">{ref.fullRef}</a></li>
          ),
        );
      }
      return <span>{references}</span>;
    };

    const handleSave = async () => {
      try {
        const updatedRoadDTO = {
          ...editFormData,
          referenceIds: selectedReferences.map((ref) => ref.id),
        };
        await RoadService.updateRoad(id ?? '', updatedRoadDTO);
        alert('Road updated!');

        await dispatch(fetchRoadById(id ?? ''));

        const refreshedCollection = selectedRoad as GeoJsonCollection;
        const updatedGeom = refreshedCollection?.features?.[0]?.geometry;
        if (updatedGeom) {
          setEditFormData((prev) => ({
            ...prev,
            geom: geoJSONtoWKT(updatedGeom),
          }));
        }

        await dispatch(fetchModernReferencesByRoadId(id ?? ''));
        setIsEditing(false);
      } catch (err) {
        console.error('Update failed:', err);
        alert('Failed to update road.');
      }
    };

    return (
        <div className="pagebox">
          <div className="infopage-box">
            <div className="infopage-card">
              <h4>Information</h4>

              {isEditing ? (
                <>
                  <label className="info-label" htmlFor="road-name">Name</label>
                  <input id="road-name" className="info-input" type="text" value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} placeholder="Name" />
                  <label className="info-label" htmlFor="road-type">Type</label>
                  <input id="road-type" className="info-input" type="text" value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })} placeholder="Type" />
                  <label className="info-label" htmlFor="road-type-description">Type Description</label>
                  <input id="road-type-description" className="info-input" type="text" value={editFormData.typeDescription}
                    onChange={(e) => setEditFormData({ ...editFormData, typeDescription: e.target.value })} placeholder="Type Description" />
                  <label className="info-label" htmlFor="road-location">Location</label>
                  <input id="road-location" className="info-input" type="text" value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })} placeholder="Location" />
                  <label className="info-label" htmlFor="road-description">Description</label>
                  <textarea id="road-description" className="info-input" rows={3} value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} placeholder="Description" />
                  <label className="info-label" htmlFor="road-date">Date</label>
                  <input id="road-date" className="info-input" type="text" value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} placeholder="Date" />

                  <ModernReferencePicker selectedReferences={selectedReferences} onChange={setSelectedReferences} />

                  <div style={{ marginTop: '1rem' }}>
                    <button className="info-btn" onClick={handleSave}>Save</button>
                    <button className="info-btn delete" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <h2>{name}</h2>
                  {isAdmin && (
                    <button className="info-btn" onClick={() => {
                      if (!feature) return;
                      const { properties: p = {}, geometry: g = {} as GeoJsonGeometry } = feature;
                      setEditFormData({
                        name: p.name ?? '',
                        type: p.type ?? '',
                        typeDescription: p.typeDescription ?? '',
                        location: p.location ?? '',
                        description: p.description ?? '',
                        date: p.date ?? '',
                        geom: geoJSONtoWKT(g),
                        cat_nr: p.cat_nr ?? '',
                      });
                      setSelectedReferences(modRef ?? []);
                      setIsEditing(true);
                    }}>Edit</button>
                  )}
                  <h4>Identification:</h4>
                  <span>{type} - {typeDescription}</span>
                  {location && <><h4>Location:</h4><span>{location}</span></>}
                  {description && <><h4>Description:</h4><span>{description}</span></>}
                  {date && <><h4>Date:</h4><span>{date}</span></>}
                  {references && <><h4>References:</h4>{modernReferenceRenderer(modRef)}</>}
                  {historicalReferences && <><h4>Historical references:</h4><span>{historicalReferences}</span></>}
                </>
              )}
            </div>
            <div className="infopage-illustrationbox">
              <div className="infopage-map">
                <MapComponent
                  key={isEditing ? 'editing' : `road-${id}-${editFormData.geom}`}
                  queryItem={query}
                  adjustMapHeight={true}
                  isEditing={isEditing}
                  geometry={editFormData.geom}
                  onGeometryChange={(newWkt) => setEditFormData((prev) => ({ ...prev, geom: newWkt }))}
                  photoMarkers={photoMarkers}
                />
              </div>
              <div className="infopage-image">
                <MediaGallery
                  targetType="ROAD"
                  targetId={id ?? ''}
                  isAdmin={isAdmin}
                  initialMapCenter={initialMapCenter}
                  onAssetsChange={setGalleryAssets}
                />
              </div>
              <button className="back-btn" onClick={backButtonHandler}>BACK</button>
            </div>
          </div>
        </div>
    );
  }
};

export default RoadInfo;

