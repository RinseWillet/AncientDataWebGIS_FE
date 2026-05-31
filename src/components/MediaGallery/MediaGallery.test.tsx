import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MediaGallery from './MediaGallery';
import MediaService from '../../services/MediaService';
import type { MediaAsset } from '../../types/media';
vi.mock('../../services/MediaService', () => ({
  default: {
    findByTarget: vi.fn(),
  },
}));
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
    render(<MediaGallery targetType="SITE" targetId="42" />);
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
    render(<MediaGallery targetType="SITE" targetId="42" />);
    await waitFor(() => {
      expect(screen.getByText('No images available.')).toBeInTheDocument();
    });
  });
  it('shows error message on fetch failure', async () => {
    vi.mocked(MediaService.findByTarget).mockRejectedValue(new Error('fail'));
    render(<MediaGallery targetType="ROAD" targetId="10" />);
    await waitFor(() => {
      expect(screen.getByText('Could not load images.')).toBeInTheDocument();
    });
  });
  it('opens lightbox when image is clicked', async () => {
    vi.mocked(MediaService.findByTarget).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    fireEvent.click(screen.getAllByRole('listitem')[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('A Roman temple')).toBeInTheDocument();
    expect(screen.getByText('CC-BY-4.0')).toBeInTheDocument();
  });
  it('closes lightbox on close button click', async () => {
    vi.mocked(MediaService.findByTarget).mockResolvedValue(mockAssets);
    render(<MediaGallery targetType="SITE" targetId="42" />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    fireEvent.click(screen.getAllByRole('listitem')[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close image viewer'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('calls MediaService with correct parameters', async () => {
    vi.mocked(MediaService.findByTarget).mockResolvedValue([]);
    render(<MediaGallery targetType="ROAD" targetId="7" />);
    await waitFor(() => {
      expect(MediaService.findByTarget).toHaveBeenCalledWith('ROAD', '7');
    });
  });
});
