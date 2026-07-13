import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MediaGallery from './MediaGallery';
import MediaService from '../../services/MediaService';
import type { MediaAsset } from '../../types/media';
vi.mock('../../services/MediaService', () => ({
  default: {
    findByTarget: vi.fn(),
    findByTargetAdmin: vi.fn(),
    upload: vi.fn(),
    updateMetadata: vi.fn(),
    deleteMedia: vi.fn(),
  },
}));

vi.mock('./MediaUploadForm', () => ({
  default: ({ onUploadSuccess }: { onUploadSuccess: () => void }) => (
    <button data-testid="mock-upload" onClick={onUploadSuccess}>Mock Upload</button>
  ),
}));

vi.mock('./PhotoLocationPicker', () => ({
  default: ({ onChange }: { onChange: (v: { lat: number; lng: number }) => void }) => (
    <button type="button" data-testid="mock-edit-location-picker" onClick={() => onChange({ lat: 1, lng: 2 })}>
      Mock Location Picker
    </button>
  ),
}));

const CENTER = { lat: 51.8, lng: 5.8 };

const mockAssets: MediaAsset[] = [
  {
    id: 1,
    targetType: 'SITE',
    targetId: 42,
    fullUrl: 'http://localhost:8080/api/media/files/site/42/abc.jpg',
    caption: 'A Roman temple',
    author: 'John',
    source: 'fieldwork',
    license: 'CC-BY-4.0',
    dateTaken: '2025-06-15',
    latitude: 52.09,
    longitude: 5.12,
    isCover: true,
    visibilityStatus: 'APPROVED',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    targetType: 'SITE',
    targetId: 42,
    fullUrl: 'http://localhost:8080/api/media/files/site/42/def.jpg',
    caption: null,
    author: null,
    source: null,
    license: null,
    dateTaken: null,
    latitude: null,
    longitude: null,
    isCover: false,
    visibilityStatus: 'APPROVED',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];
describe('MediaGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  it('renders images when assets are available', async () => {
    vi.mocked(MediaService.findByTarget).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getByText('Photos')).toBeInTheDocument();
    });
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    const firstImg = listItems[0].querySelector('img');
    expect(firstImg).toHaveAttribute('alt', 'A Roman temple');
  });
  it('shows empty message when no assets', async () => {
    vi.mocked(MediaService.findByTarget).mockResolvedValue([]);
    render(<MediaGallery targetType="SITE" targetId="42" initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getByText('No images available.')).toBeInTheDocument();
    });
  });
  it('shows error message on fetch failure', async () => {
    vi.mocked(MediaService.findByTarget).mockRejectedValue(new Error('fail'));
    render(<MediaGallery targetType="ROAD" targetId="10" initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getByText('Could not load images.')).toBeInTheDocument();
    });
  });
  it('opens lightbox when image button is clicked', async () => {
    vi.mocked(MediaService.findByTarget).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    const buttons = screen.getAllByRole('button');
    const imageButton = buttons.find(b => b.classList.contains('media-gallery__button'));
    fireEvent.click(imageButton!);
    expect(screen.getByLabelText('Image viewer')).toBeInTheDocument();
    expect(screen.getByText('A Roman temple')).toBeInTheDocument();
    expect(screen.getByText('CC-BY-4.0')).toBeInTheDocument();
  });
  it('closes lightbox on close button click', async () => {
    vi.mocked(MediaService.findByTarget).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    const imageButton = screen.getAllByRole('button').find(b => b.classList.contains('media-gallery__button'));
    fireEvent.click(imageButton!);
    expect(screen.getByLabelText('Image viewer')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close image viewer'));
    expect(screen.queryByLabelText('Image viewer')).not.toBeInTheDocument();
  });
  it('calls MediaService with correct parameters', async () => {
    vi.mocked(MediaService.findByTarget).mockResolvedValue([]);
    render(<MediaGallery targetType="ROAD" targetId="7" initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(MediaService.findByTarget).toHaveBeenCalledWith('ROAD', '7');
    });
  });

  // Admin feature tests
  it('uses admin endpoint when isAdmin is true', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(MediaService.findByTargetAdmin).toHaveBeenCalledWith('SITE', '42');
    });
    expect(MediaService.findByTarget).not.toHaveBeenCalled();
  });
  it('shows upload form when isAdmin is true', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getByTestId('mock-upload')).toBeInTheDocument();
    });
  });
  it('does not show upload form when isAdmin is false', async () => {
    vi.mocked(MediaService.findByTarget).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getByText('Photos')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('mock-upload')).not.toBeInTheDocument();
  });
  it('shows status badges for non-APPROVED media when admin', async () => {
    const mixedAssets: MediaAsset[] = [
      { ...mockAssets[0], visibilityStatus: 'PENDING', isCover: false },
      { ...mockAssets[1], visibilityStatus: 'HIDDEN' },
    ];
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue(mixedAssets);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Hidden')).toBeInTheDocument();
    });
  });
  it('shows cover badge for cover images when admin', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getByText('Cover')).toBeInTheDocument();
    });
  });
  it('shows admin controls in lightbox when isAdmin is true', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    const imageButton = screen.getAllByRole('button').find(b => b.classList.contains('media-gallery__button'));
    fireEvent.click(imageButton!);
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
  it('shows delete confirmation when delete is clicked', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    const imageButton = screen.getAllByRole('button').find(b => b.classList.contains('media-gallery__button'));
    fireEvent.click(imageButton!);
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Delete this photo?')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });
  it('deletes media on confirm', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue(mockAssets);
    vi.mocked(MediaService.deleteMedia).mockResolvedValue(undefined);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    const imageButton = screen.getAllByRole('button').find(b => b.classList.contains('media-gallery__button'));
    fireEvent.click(imageButton!);
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(MediaService.deleteMedia).toHaveBeenCalledWith(1);
    });
  });
  it('opens edit form when edit is clicked', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    const imageButton = screen.getAllByRole('button').find(b => b.classList.contains('media-gallery__button'));
    fireEvent.click(imageButton!);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByLabelText('Edit media metadata')).toBeInTheDocument();
    expect(screen.getByLabelText('Caption')).toHaveValue('A Roman temple');
    expect(screen.getByLabelText('Author')).toHaveValue('John');
  });
  it('shows empty state with upload option for admin when no assets', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue([]);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getByText('No images uploaded yet.')).toBeInTheDocument();
    });
    expect(screen.getByTestId('mock-upload')).toBeInTheDocument();
  });
  it('shows upload form even when fetch fails for admin', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockRejectedValue(new Error('fail'));
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getByText('Could not load images.')).toBeInTheDocument();
    });
    expect(screen.getByTestId('mock-upload')).toBeInTheDocument();
  });

  // Geotagging tests (E2-GEO-1)
  it('reports fetched assets via onAssetsChange', async () => {
    vi.mocked(MediaService.findByTarget).mockResolvedValue(mockAssets);
    const onAssetsChange = vi.fn();
    render(
      <MediaGallery targetType="SITE" targetId="42" initialMapCenter={CENTER} onAssetsChange={onAssetsChange} />,
    );
    await waitFor(() => {
      expect(onAssetsChange).toHaveBeenCalledWith(mockAssets);
    });
  });

  it('pre-checks the location picker toggle when editing a geotagged photo', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    const imageButton = screen.getAllByRole('button').find(b => b.classList.contains('media-gallery__button'));
    fireEvent.click(imageButton!);
    fireEvent.click(screen.getByText('Edit'));
    // mockAssets[0] (shown first, the cover image) has a latitude/longitude set
    expect(screen.getByTestId('mock-edit-location-picker')).toBeInTheDocument();
  });

  it('updates latitude/longitude when the edit location picker changes', async () => {
    vi.mocked(MediaService.findByTargetAdmin).mockResolvedValue(mockAssets);
    vi.mocked(MediaService.updateMetadata).mockResolvedValue(mockAssets[0]);
    render(<MediaGallery targetType="SITE" targetId="42" isAdmin initialMapCenter={CENTER} />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    const imageButton = screen.getAllByRole('button').find(b => b.classList.contains('media-gallery__button'));
    fireEvent.click(imageButton!);
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByTestId('mock-edit-location-picker'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(MediaService.updateMetadata).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ latitude: 1, longitude: 2 }),
      );
    });
  });
});
