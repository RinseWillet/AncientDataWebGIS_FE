import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ErrorModal from './ErrorModal';

describe('ErrorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render when isOpen is false', () => {
    const mockOnClose = vi.fn();
    render(
      <ErrorModal
        isOpen={false}
        title="Test Error"
        message="This is a test error"
        onClose={mockOnClose}
      />
    );
    expect(screen.queryByText('Test Error')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    const mockOnClose = vi.fn();
    render(
      <ErrorModal
        isOpen={true}
        title="Test Error"
        message="This is a test error"
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('This is a test error')).toBeInTheDocument();
  });

  it('calls onClose when OK button is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <ErrorModal
        isOpen={true}
        title="Test Error"
        message="This is a test error"
        onClose={mockOnClose}
      />
    );
    fireEvent.click(screen.getByText('OK'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <ErrorModal
        isOpen={true}
        title="Test Error"
        message="This is a test error"
        onClose={mockOnClose}
      />
    );
    fireEvent.click(screen.getByLabelText('Close error dialog'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when overlay backdrop is clicked (only via button or Escape)', () => {
    const mockOnClose = vi.fn();
    const { container } = render(
      <ErrorModal
        isOpen={true}
        title="Test Error"
        message="This is a test error"
        onClose={mockOnClose}
      />
    );
    const overlay = container.querySelector('.error-modal-overlay');
    if (overlay) {
      fireEvent.click(overlay);
    }
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const mockOnClose = vi.fn();
    render(
      <ErrorModal
        isOpen={true}
        title="Test Error"
        message="This is a test error"
        onClose={mockOnClose}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('uses default title when not provided', () => {
    const mockOnClose = vi.fn();
    render(
      <ErrorModal isOpen={true} message="This is a test error" onClose={mockOnClose} />
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});

