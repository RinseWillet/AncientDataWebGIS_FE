import { useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import type { RootState } from '../app/store';
import { selectIsAdmin } from '../features/authentication/authSelectors';
import { fetchSiteById } from '../features/site/siteThunks';
import { fetchModernReferencesBySiteId } from '../features/modref/modRefThunks';
import SiteService from '../services/SiteService';
import MapComponent from '../components/MapComponent/MapComponent';
import { geoJSONtoWKT } from '../utils/geometryUtils';
import ModernReferencePicker from '../components/ModernReferencePicker/ModernReferencePicker';
import ModernReferenceList from '../components/ModernReferenceList/ModernReferenceList';
import MediaGallery from '../components/MediaGallery/MediaGallery';
import type { MediaAsset } from '../types/media';
import type { GeoJsonFeatureCollection, GeoJsonGeometry, ModernReference, SiteProperties } from '../types/geoJson';
import { siteTypeConverter } from '../utils/siteTypesConfig';
import { assetsToPhotoMarkers } from '../utils/photoMarkers';
import './InfoPage.css';

interface SiteEditFormData {
  name: string;
  siteType: string;
  status: string;
  description: string;
  references: string;
  province: string;
  pleiadesId: string;
  geom: string;
}


const SiteInfo = () => {
  const isAdmin = useAppSelector(selectIsAdmin);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedSite, selectedLoading } = useAppSelector((state: RootState) => state.sites);
  const [selectedReferences, setSelectedReferences] = useState<ModernReference[]>([]);
  const [galleryAssets, setGalleryAssets] = useState<MediaAsset[]>([]);
  const { referencesBySiteId } = useAppSelector((state: RootState) => state.modRef);
  const modRef = referencesBySiteId[id ?? ''] as ModernReference[] | undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<SiteEditFormData>({
    name: '',
    siteType: '',
    status: '',
    description: '',
    references: '',
    province: '',
    pleiadesId: '',
    geom: '',
  });

  const backButtonHandler = () => navigate('/datalist/');
  const viewOnMapHandler = () => navigate('/atlas/site_' + id);

  useEffect(() => {
    if (id) {
      dispatch(fetchSiteById(id));
      dispatch(fetchModernReferencesBySiteId(id));
    }
  }, [dispatch, id]);


  if (selectedLoading || !selectedSite || !modRef) {
    return (
      <div className="pagebox">
        <div className="roadinfo-card"><p>Loading data...</p></div>
      </div>
    );
  }

  const collection = selectedSite as GeoJsonFeatureCollection;
  const feature = collection?.features?.[0];
  if (!feature) return <p>No feature found</p>;

  const properties = (feature.properties ?? {}) as SiteProperties;
  const geometry = (feature.geometry ?? {}) as GeoJsonGeometry;

  // Point coordinates are [lng, lat]; fall back to app default center
  const pointCoord = geometry.coordinates as number[] | undefined;
  const initialMapCenter = pointCoord
    ? { lat: pointCoord[1], lng: pointCoord[0] }
    : { lat: 51.8, lng: 5.8 };

  const photoMarkers = assetsToPhotoMarkers(galleryAssets);

  const handleSave = async () => {
    try {
      const updatedDTO = {
        ...editFormData,
        referenceIds: selectedReferences.map((ref) => ref.id),
      };
      await SiteService.updateSite(id ?? '', updatedDTO);
      alert('Site updated!');

      await dispatch(fetchSiteById(id ?? ''));

      const refreshed = await SiteService.findByIdGeoJson(id ?? '');
      const refreshedFeature = (refreshed.data as GeoJsonFeatureCollection)?.features?.[0];
      const refreshedGeometry = refreshedFeature?.geometry;
      if (refreshedGeometry) {
        setEditFormData((prev) => ({
          ...prev,
          geom: geoJSONtoWKT(refreshedGeometry),
        }));
      }

      await dispatch(fetchSiteById(id ?? ''));
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update site.');
    }
  };

  return (
    <div className="pagebox">
      <div className="infopage-box">
        <div className="infopage-card">
          <h4>Information</h4>

          {isEditing ? (
            <>
              <label className="info-label" htmlFor="site-name">Name</label>
              <input id="site-name" className="info-input" type="text" value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
              <label className="info-label" htmlFor="site-type">Type</label>
              <input id="site-type" className="info-input" type="text" value={editFormData.siteType}
                onChange={(e) => setEditFormData({ ...editFormData, siteType: e.target.value })} />
              <label className="info-label" htmlFor="site-status">Status</label>
              <input id="site-status" className="info-input" type="text" value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })} />
              <label className="info-label" htmlFor="site-description">Description</label>
              <textarea id="site-description" className="info-input" rows={3} value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
              <label className="info-label" htmlFor="site-province">Province</label>
              <input id="site-province" className="info-input" type="text" value={editFormData.province}
                onChange={(e) => setEditFormData({ ...editFormData, province: e.target.value })} />
              <label className="info-label" htmlFor="site-pleiadesid">Pleiades</label>
              <input id="site-pleiadesid" className="info-input" type="text" value={editFormData.pleiadesId}
                onChange={(e) => setEditFormData({ ...editFormData, pleiadesId: e.target.value })} />

              <ModernReferencePicker selectedReferences={selectedReferences} onChange={setSelectedReferences} />

              <div style={{ marginTop: '1rem' }}>
                <button className="info-btn" onClick={handleSave}>Save</button>
                <button className="info-btn delete" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <h2>{properties.name}</h2>
              {isAdmin && (
                <button className="info-btn" onClick={() => {
                   setEditFormData({
                     name: properties.name ?? '',
                     siteType: properties.siteType ?? '',
                     status: properties.status ?? '',
                     description: properties.description ?? '',
                     references: properties.references ?? '',
                     province: properties.province ?? '',
                     pleiadesId: properties.pleiadesId ?? '',
                     geom: geoJSONtoWKT(geometry),
                   });
                  setSelectedReferences(modRef ?? []);
                  setIsEditing(true);
                }}>Edit</button>
              )}
              <h4>Identification:</h4>
              <span>{siteTypeConverter(properties.siteType)}</span>
              {properties.description && <><h4>Description:</h4><span>{properties.description}</span></>}
              {properties.status && <><h4>Status:</h4><span>{properties.status}</span></>}
              {properties.references && <><h4>References:</h4><ModernReferenceList references={modRef} fallback={properties.references} /></>}
              {properties.province && <><h4>Province:</h4><span>{properties.province}</span></>}
              {properties.pleiadesId && <><h4>Pleiades:</h4><span>{properties.pleiadesId}</span></>}
            </>
          )}
        </div>
        <div className="infopage-illustrationbox">
          <div className="infopage-map">
            <MapComponent
              key={isEditing ? 'editing' : `site-${id}-${editFormData.geom}`}
              queryItem={{ type: 'site', id: id ?? '' }}
              adjustMapHeight={true}
              isEditing={isEditing}
              geometry={editFormData.geom}
              onGeometryChange={(newWkt) => setEditFormData((prev) => ({ ...prev, geom: newWkt }))}
              photoMarkers={photoMarkers}
              selectable={false}
            />
          </div>
          <div className="infopage-image">
            <MediaGallery
              targetType="SITE"
              targetId={id ?? ''}
              isAdmin={isAdmin}
              initialMapCenter={initialMapCenter}
              onAssetsChange={setGalleryAssets}
            />
          </div>
          <div className="infopage-actions">
            <button className="back-btn" onClick={backButtonHandler}>BACK</button>
            <button className="map-btn" onClick={viewOnMapHandler}>View on Map</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteInfo;

