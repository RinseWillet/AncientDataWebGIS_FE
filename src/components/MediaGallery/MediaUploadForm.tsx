import { useState, type FormEvent } from 'react';
import MediaService from '../../services/MediaService';
import './MediaUploadForm.css';

interface MediaUploadFormProps {
  targetType: 'ROAD' | 'SITE';
  targetId: string;
  onUploadSuccess: () => void;
}

const MediaUploadForm = ({ targetType, targetId, onUploadSuccess }: MediaUploadFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [license, setLicense] = useState('');
  const [dateTaken, setDateTaken] = useState('');
  const [isCover, setIsCover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFile(null);
    setCaption('');
    setAuthor('');
    setSource('');
    setLicense('');
    setDateTaken('');
    setIsCover(false);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file.');
      return;
    }

    setUploading(true);
    setError(null);

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
        isCover,
      });
      resetForm();
      setIsOpen(false);
      onUploadSuccess();
    } catch {
      setError('Upload failed. Please try again.');
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

      {error && <p className="media-upload__error">{error}</p>}

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
    </form>
  );
};

export default MediaUploadForm;

