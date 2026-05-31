import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaAsset } from '../../types/media';
import MediaService from '../../services/MediaService';
import './MediaGallery.css';

interface MediaGalleryProps {
  targetType: 'ROAD' | 'SITE';
  targetId: string;
}

const MediaGallery = ({ targetType, targetId }: MediaGalleryProps) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchMedia = async () => {
      try {
        setError(null);
        const data = await MediaService.findByTarget(targetType, targetId);
        if (!cancelled) setAssets(data);
      } catch {
        if (!cancelled) setError('Could not load images.');
      }
    };

    fetchMedia();
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  const openLightbox = useCallback((asset: MediaAsset) => {
    setSelected(asset);
    dialogRef.current?.showModal();
  }, []);

  const closeLightbox = useCallback(() => {
    dialogRef.current?.close();
    setSelected(null);
  }, []);

  if (error) {
    return <p className="media-gallery__error">{error}</p>;
  }

  if (assets.length === 0) {
    return <p className="media-gallery__empty">No images available.</p>;
  }

  return (
    <div className="media-gallery">
      <h4 className="media-gallery__title">Photos</h4>
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
          </li>
        ))}
      </ul>

      {selected && (
        <dialog className="media-lightbox" ref={dialogRef} aria-label="Image viewer" onClose={() => setSelected(null)}>
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
          </div>
        </dialog>
      )}
    </div>
  );
};

export default MediaGallery;

