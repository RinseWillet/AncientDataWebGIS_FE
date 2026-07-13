import { useState, type FormEvent } from 'react';
import MediaService from '../../services/MediaService';
import ErrorModal from '../ErrorModal/ErrorModal';
import PhotoLocationPicker from './PhotoLocationPicker';
import './MediaUploadForm.css';

interface MediaUploadFormProps {
  targetType: 'ROAD' | 'SITE';
  targetId: string;
  onUploadSuccess: () => void;
  initialMapCenter: { lat: number; lng: number };
}

const extractErrorMessage = (error: unknown): string => {
  const defaultMessage = 'Upload failed. Please try again.';

  if (!(error instanceof Error)) {
    return defaultMessage;
  }

  if (!('response' in error)) {
    return defaultMessage;
  }

  const axiosError = error as { response?: { data?: unknown } };
  if (!axiosError.response?.data) {
    return defaultMessage;
  }

  const data = axiosError.response.data;
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const msgData = data as { message?: unknown };
    if (typeof msgData.message === 'string') {
      return msgData.message;
    }
  }

  if (typeof data === 'string') {
    return data;
  }

  return defaultMessage;
};

const MediaUploadForm = ({ targetType, targetId, onUploadSuccess, initialMapCenter }: MediaUploadFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [license, setLicense] = useState('');
  const [dateTaken, setDateTaken] = useState('');
  const [isCover, setIsCover] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const resetForm = () => {
    setFile(null);
    setCaption('');
    setAuthor('');
    setSource('');
    setLicense('');
    setDateTaken('');
    setIsCover(false);
    setShowLocationPicker(false);
    setLocation(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a file.');
      setIsErrorModalOpen(true);
      return;
    }

    setUploading(true);

    try {
      await MediaService.upload({
        file,
        targetType,
        targetId,
        caption: caption || undefined,
        author: author || undefined,
        source: source || undefined,
        license: license || undefined,
        dateTaken: dateTaken || undefined,
        latitude: location?.lat,
        longitude: location?.lng,
        isCover,
      });
      resetForm();
      setIsOpen(false);
      onUploadSuccess();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setIsErrorModalOpen(true);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="info-btn media-upload__toggle"
        onClick={() => setIsOpen(true)}
      >
        Add Photo
      </button>
    );
  }

  return (
    <form className="media-upload" onSubmit={handleSubmit}>
      <h4 className="media-upload__title">Upload Photo</h4>

      <label className="info-label" htmlFor="media-file">File *</label>
      <input
        id="media-file"
        className="info-input"
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <label className="info-label" htmlFor="media-caption">Caption</label>
      <input
        id="media-caption"
        className="info-input"
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <label className="info-label" htmlFor="media-author">Author</label>
      <input
        id="media-author"
        className="info-input"
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />

      <label className="info-label" htmlFor="media-source">Source</label>
      <input
        id="media-source"
        className="info-input"
        type="text"
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />

      <label className="info-label" htmlFor="media-license">License</label>
      <input
        id="media-license"
        className="info-input"
        type="text"
        value={license}
        onChange={(e) => setLicense(e.target.value)}
        placeholder="e.g. CC-BY-4.0"
      />

      <label className="info-label" htmlFor="media-date">Date Taken</label>
      <input
        id="media-date"
        className="info-input"
        type="date"
        value={dateTaken}
        onChange={(e) => setDateTaken(e.target.value)}
      />

      <label className="media-upload__checkbox-label">
        <input
          type="checkbox"
          checked={isCover}
          onChange={(e) => setIsCover(e.target.checked)}
        />
        <span>Set as cover image</span>
      </label>

      <label className="media-upload__checkbox-label">
        <input
          type="checkbox"
          checked={showLocationPicker}
          onChange={(e) => {
            setShowLocationPicker(e.target.checked);
            if (!e.target.checked) setLocation(null);
          }}
        />
        <span>Pin location on map (overrides photo EXIF GPS, if any)</span>
      </label>

      {showLocationPicker && (
        <PhotoLocationPicker
          value={location}
          onChange={setLocation}
          initialCenter={initialMapCenter}
        />
      )}

      <div style={{ marginTop: '1rem' }}>
        <button type="submit" className="info-btn" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <button
          type="button"
          className="info-btn delete"
          onClick={() => { resetForm(); setIsOpen(false); }}
          disabled={uploading}
        >
          Cancel
        </button>
      </div>

      <ErrorModal
        isOpen={isErrorModalOpen}
        title="Upload Error"
        message={errorMessage}
        onClose={() => setIsErrorModalOpen(false)}
      />
    </form>
  );
};

export default MediaUploadForm;

