import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MediaUploadForm from './MediaUploadForm';
import MediaService from '../../services/MediaService';

vi.mock('../../services/MediaService', () => ({
  default: {
    upload: vi.fn(),
  },
}));

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
    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} />);
    expect(screen.getByText('Add Photo')).toBeInTheDocument();
  });

  it('opens upload form when "Add Photo" is clicked', () => {
    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} />);
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
    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByText('Add Photo'));
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Add Photo')).toBeInTheDocument();
    expect(screen.queryByText('Upload Photo')).not.toBeInTheDocument();
  });

  it('shows error when submitting without a file', async () => {
    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} />);
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
      isCover: false,
      visibilityStatus: 'APPROVED',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} />);
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

    render(<MediaUploadForm targetType="SITE" targetId="42" onUploadSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByText('Add Photo'));

    const file = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('File *'), { target: { files: [file] } });
    fireEvent.click(screen.getByText('Upload'));

    await waitFor(() => {
      expect(screen.getByText('Upload failed. Please try again.')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});

