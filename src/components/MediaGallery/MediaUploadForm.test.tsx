import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MediaUploadForm from './MediaUploadForm';
import MediaService from '../../services/MediaService';

vi.mock('../../services/MediaService', () => ({
  default: {
    upload: vi.fn(),
  },
}));

vi.mock('./PhotoLocationPicker', () => ({
  default: ({ onChange }: { onChange: (v: { lat: number; lng: number }) => void }) => (
    <button type="button" data-testid="mock-location-picker" onClick={() => onChange({ lat: 52.09, lng: 5.12 })}>
      Mock Location Picker
    </button>
  ),
}));

const CENTER = { lat: 51.8, lng: 5.8 };

describe('MediaUploadForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows "Add Photo" button initially', () => {
    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} initialMapCenter={CENTER} />);
    expect(screen.getByText('Add Photo')).toBeInTheDocument();
  });

  it('opens upload form when "Add Photo" is clicked', () => {
    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} initialMapCenter={CENTER} />);
    fireEvent.click(screen.getByText('Add Photo'));
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    expect(screen.getByLabelText('File *')).toBeInTheDocument();
    expect(screen.getByLabelText('Caption')).toBeInTheDocument();
    expect(screen.getByLabelText('Author')).toBeInTheDocument();
    expect(screen.getByLabelText('Source')).toBeInTheDocument();
    expect(screen.getByLabelText('License')).toBeInTheDocument();
    expect(screen.getByLabelText('Date Taken')).toBeInTheDocument();
  });

  it('closes form when cancel is clicked', () => {
    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} initialMapCenter={CENTER} />);
    fireEvent.click(screen.getByText('Add Photo'));
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Add Photo')).toBeInTheDocument();
    expect(screen.queryByText('Upload Photo')).not.toBeInTheDocument();
  });

  it('shows error when submitting without a file', async () => {
    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} initialMapCenter={CENTER} />);
    fireEvent.click(screen.getByText('Add Photo'));
    fireEvent.click(screen.getByText('Upload'));
    await waitFor(() => {
      expect(screen.getByText('Please select a file.')).toBeInTheDocument();
    });
  });

  it('calls upload service and triggers success callback', async () => {
    vi.mocked(MediaService.upload).mockResolvedValue({
      id: 99,
      targetType: 'SITE',
      targetId: 42,
      fullUrl: 'http://localhost:8080/api/media/files/site/42/new.jpg',
      caption: 'Test',
      author: null,
      source: null,
      license: null,
      dateTaken: null,
      latitude: null,
      longitude: null,
      isCover: false,
      visibilityStatus: 'APPROVED',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} initialMapCenter={CENTER} />);
    fireEvent.click(screen.getByText('Add Photo'));

    const file = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('File *');
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.change(screen.getByLabelText('Caption'), { target: { value: 'Test caption' } });

    fireEvent.click(screen.getByText('Upload'));

    await waitFor(() => {
      expect(MediaService.upload).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error message on upload failure', async () => {
    vi.mocked(MediaService.upload).mockRejectedValue(new Error('Server error'));

    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} initialMapCenter={CENTER} />);
    fireEvent.click(screen.getByText('Add Photo'));

    const file = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('File *'), { target: { files: [file] } });
    fireEvent.click(screen.getByText('Upload'));

    await waitFor(() => {
      expect(screen.getByText('Upload failed. Please try again.')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('does not show location picker until the pin-location checkbox is checked', () => {
    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} initialMapCenter={CENTER} />);
    fireEvent.click(screen.getByText('Add Photo'));
    expect(screen.queryByTestId('mock-location-picker')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Pin location on map (overrides photo EXIF GPS, if any)'));
    expect(screen.getByTestId('mock-location-picker')).toBeInTheDocument();
  });

  it('includes the manually pinned coordinates in the upload call', async () => {
    vi.mocked(MediaService.upload).mockResolvedValue({
      id: 99,
      targetType: 'SITE',
      targetId: 42,
      fullUrl: 'http://localhost:8080/api/media/files/site/42/new.jpg',
      caption: null,
      author: null,
      source: null,
      license: null,
      dateTaken: null,
      latitude: 52.09,
      longitude: 5.12,
      isCover: false,
      visibilityStatus: 'APPROVED',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} initialMapCenter={CENTER} />);
    fireEvent.click(screen.getByText('Add Photo'));

    const file = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('File *'), { target: { files: [file] } });

    fireEvent.click(screen.getByText('Pin location on map (overrides photo EXIF GPS, if any)'));
    fireEvent.click(screen.getByTestId('mock-location-picker'));

    fireEvent.click(screen.getByText('Upload'));

    await waitFor(() => {
      expect(MediaService.upload).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 52.09, longitude: 5.12 }),
      );
    });
  });
});

