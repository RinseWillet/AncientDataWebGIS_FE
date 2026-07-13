import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { MediaAsset } from '../../types/media';
import MediaService, { type MediaUpdateParams } from '../../services/MediaService';
import MediaUploadForm from './MediaUploadForm';
import PhotoLocationPicker from './PhotoLocationPicker';
import './MediaGallery.css';

interface MediaGalleryProps {
  targetType: 'ROAD' | 'SITE';
  targetId: string;
  isAdmin?: boolean;
  initialMapCenter: { lat: number; lng: number };
  onAssetsChange?: (assets: MediaAsset[]) => void;
}

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Approved',
  PENDING: 'Pending',
  HIDDEN: 'Hidden',
};

const MediaGallery = ({ targetType, targetId, isAdmin = false, initialMapCenter, onAssetsChange }: MediaGalleryProps) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [editForm, setEditForm] = useState<MediaUpdateParams>({});
  const [editShowLocationPicker, setEditShowLocationPicker] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setError(null);
      const data = isAdmin
        ? await MediaService.findByTargetAdmin(targetType, targetId)
        : await MediaService.findByTarget(targetType, targetId);
      setAssets(data);
      onAssetsChange?.(data);
    } catch {
      setError('Could not load images.');
    }
  }, [targetType, targetId, isAdmin, onAssetsChange]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setError(null);
        const data = isAdmin
          ? await MediaService.findByTargetAdmin(targetType, targetId)
          : await MediaService.findByTarget(targetType, targetId);
        if (!cancelled) {
          setAssets(data);
          onAssetsChange?.(data);
        }
      } catch {
        if (!cancelled) setError('Could not load images.');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [targetType, targetId, isAdmin, onAssetsChange]);

  const openLightbox = useCallback((asset: MediaAsset) => {
    setSelected(asset);
    if (typeof dialogRef.current?.showModal === 'function') {
      dialogRef.current.showModal();
    }
  }, []);

  const closeLightbox = useCallback(() => {
    if (typeof dialogRef.current?.close === 'function') {
      dialogRef.current.close();
    }
    setSelected(null);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !selected) return;
    const handleBackdropClick = (e: MouseEvent) => {
      if (e.target === dialog) closeLightbox();
    };
    dialog.addEventListener('click', handleBackdropClick);
    return () => dialog.removeEventListener('click', handleBackdropClick);
  }, [selected, closeLightbox]);

  const startEdit = (asset: MediaAsset) => {
    setEditing(asset);
    setEditForm({
      caption: asset.caption ?? '',
      author: asset.author ?? '',
      source: asset.source ?? '',
      license: asset.license ?? '',
      dateTaken: asset.dateTaken ?? '',
      latitude: asset.latitude ?? undefined,
      longitude: asset.longitude ?? undefined,
      isCover: asset.isCover,
      visibilityStatus: asset.visibilityStatus,
    });
    setEditShowLocationPicker(asset.latitude != null && asset.longitude != null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await MediaService.updateMetadata(editing.id, editForm);
      setEditing(null);
      await fetchAssets();
    } catch {
      setError('Failed to update metadata.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await MediaService.deleteMedia(id);
      setDeleteConfirmId(null);
      closeLightbox();
      await fetchAssets();
    } catch {
      setError('Failed to delete image.');
    }
  };

  if (error && !isAdmin) {
    return <p className="media-gallery__error">{error}</p>;
  }

  if (assets.length === 0 && !isAdmin && !error) {
    return <p className="media-gallery__empty">No images available.</p>;
  }

  return (
    <div className="media-gallery">
      <h4 className="media-gallery__title">Photos</h4>

      {isAdmin && (
        <MediaUploadForm
          targetType={targetType}
          targetId={targetId}
          onUploadSuccess={fetchAssets}
          initialMapCenter={initialMapCenter}
        />
      )}

      {error && <p className="media-gallery__error">{error}</p>}

      {assets.length === 0 && !error && (
        <p className="media-gallery__empty">No images uploaded yet.</p>
      )}

      <ul className="media-gallery__grid">
        {assets.map((asset) => (
          <li key={asset.id} className="media-gallery__item">
            <button
              type="button"
              className="media-gallery__button"
              onClick={() => openLightbox(asset)}
              aria-label={asset.caption ?? `Photo of ${targetType.toLowerCase()} ${targetId}`}
            >
              <img src={asset.fullUrl} alt={asset.caption ?? ''} loading="lazy" />
            </button>
            {isAdmin && asset.visibilityStatus !== 'APPROVED' && (
              <span className={`media-gallery__badge media-gallery__badge--${asset.visibilityStatus.toLowerCase()}`}>
                {STATUS_LABELS[asset.visibilityStatus] ?? asset.visibilityStatus}
              </span>
            )}
            {isAdmin && asset.isCover && (
              <span className="media-gallery__badge media-gallery__badge--cover">Cover</span>
            )}
          </li>
        ))}
      </ul>

      {/* Lightbox */}
      {selected && (
        <dialog
          className="media-lightbox"
          ref={dialogRef}
          aria-label="Image viewer"
          onClose={() => setSelected(null)}
        >
          <button
            className="media-lightbox__close"
            onClick={closeLightbox}
            aria-label="Close image viewer"
          >
            ×
          </button>
          <img
            className="media-lightbox__img"
            src={selected.fullUrl}
            alt={selected.caption ?? ''}
          />
          <div className="media-lightbox__caption">
            {selected.caption && <p>{selected.caption}</p>}
            {(selected.author || selected.license) && (
              <p className="attribution">
                {selected.author && <span>© {selected.author}</span>}
                {selected.author && selected.license && <span> · </span>}
                {selected.license && <span>{selected.license}</span>}
              </p>
            )}
            {(selected.source || selected.dateTaken) && (
              <p className="media-lightbox__meta">
                {selected.source && <span>Source: {selected.source}</span>}
                {selected.source && selected.dateTaken && <span> · </span>}
                {selected.dateTaken && <span>Date: {selected.dateTaken}</span>}
              </p>
            )}
          </div>

          {/* Admin controls in lightbox */}
          {isAdmin && (
            <div className="media-lightbox__admin">
              <button type="button" className="info-btn" onClick={() => startEdit(selected)}>
                Edit
              </button>
              {deleteConfirmId === selected.id ? (
                <span className="media-lightbox__confirm">
                  <span>Delete this photo?</span>
                  <button type="button" className="info-btn delete" onClick={() => handleDelete(selected.id)}>
                    Confirm
                  </button>
                  <button type="button" className="info-btn" onClick={() => setDeleteConfirmId(null)}>
                    Cancel
                  </button>
                </span>
              ) : (
                <button type="button" className="info-btn delete" onClick={() => setDeleteConfirmId(selected.id)}>
                  Delete
                </button>
              )}
            </div>
          )}
        </dialog>
      )}

      {/* Edit metadata modal */}
      {editing && (
        <dialog className="media-lightbox media-edit-dialog" open aria-label="Edit media metadata">
          <form className="media-edit-form" onSubmit={handleEditSubmit}>
            <h4>Edit Metadata</h4>

            <label className="info-label" htmlFor="edit-caption">Caption</label>
            <input id="edit-caption" className="info-input" type="text" value={editForm.caption ?? ''}
              onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })} />

            <label className="info-label" htmlFor="edit-author">Author</label>
            <input id="edit-author" className="info-input" type="text" value={editForm.author ?? ''}
              onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} />

            <label className="info-label" htmlFor="edit-source">Source</label>
            <input id="edit-source" className="info-input" type="text" value={editForm.source ?? ''}
              onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} />

            <label className="info-label" htmlFor="edit-license">License</label>
            <input id="edit-license" className="info-input" type="text" value={editForm.license ?? ''}
              onChange={(e) => setEditForm({ ...editForm, license: e.target.value })} />

            <label className="info-label" htmlFor="edit-date">Date Taken</label>
            <input id="edit-date" className="info-input" type="date" value={editForm.dateTaken ?? ''}
              onChange={(e) => setEditForm({ ...editForm, dateTaken: e.target.value })} />

            <label className="media-upload__checkbox-label">
              <input
                type="checkbox"
                checked={editShowLocationPicker}
                onChange={(e) => {
                  setEditShowLocationPicker(e.target.checked);
                  if (!e.target.checked) {
                    setEditForm({ ...editForm, latitude: undefined, longitude: undefined });
                  }
                }}
              />
              <span>Pin location on map</span>
            </label>

            {editShowLocationPicker && (
              <PhotoLocationPicker
                value={
                  editForm.latitude != null && editForm.longitude != null
                    ? { lat: editForm.latitude, lng: editForm.longitude }
                    : null
                }
                onChange={(loc) => setEditForm({ ...editForm, latitude: loc.lat, longitude: loc.lng })}
                initialCenter={initialMapCenter}
              />
            )}

            <label className="info-label" htmlFor="edit-visibility">Visibility</label>
            <select id="edit-visibility" className="info-input" value={editForm.visibilityStatus ?? 'APPROVED'}
              onChange={(e) => setEditForm({ ...editForm, visibilityStatus: e.target.value })}>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="HIDDEN">Hidden</option>
              <option value="REJECTED">Reject &amp; Delete</option>
            </select>

            <label className="media-upload__checkbox-label">
              <input
                type="checkbox"
                checked={editForm.isCover ?? false}
                onChange={(e) => setEditForm({ ...editForm, isCover: e.target.checked })}
              />
              <span>Set as cover image</span>
            </label>

            <div style={{ marginTop: '1rem' }}>
              <button type="submit" className="info-btn">Save</button>
              <button type="button" className="info-btn delete" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default MediaGallery;

