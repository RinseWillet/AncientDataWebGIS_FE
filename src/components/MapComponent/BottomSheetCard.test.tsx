import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import BottomSheetCard from './BottomSheetCard';

const getHandle = (container: HTMLElement): HTMLButtonElement => {
  const handle = container.querySelector('.infoCard-dragHandle');
  if (!handle) throw new Error('drag handle not found');
  return handle as HTMLButtonElement;
};

describe('BottomSheetCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders children and a drag handle', () => {
    const { container } = render(
      <BottomSheetCard>
        <p>Card content</p>
      </BottomSheetCard>
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
    const handle = getHandle(container);
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute('aria-label', 'Expand details panel');
  });

  it('starts in the half-height state and toggles to full on handle click', () => {
    const { container } = render(
      <BottomSheetCard>
        <p>Card content</p>
      </BottomSheetCard>
    );

    const card = container.querySelector('.infoCard');
    expect(card).toHaveClass('sheet-half');

    const handle = getHandle(container);
    fireEvent.click(handle);

    expect(card).toHaveClass('sheet-full');
    expect(handle).toHaveAttribute('aria-label', 'Collapse details panel');

    fireEvent.click(handle);
    expect(card).toHaveClass('sheet-half');
    expect(handle).toHaveAttribute('aria-label', 'Expand details panel');
  });

  it('calls onDismiss when the handle is dragged down past the threshold', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <BottomSheetCard onDismiss={onDismiss}>
        <p>Card content</p>
      </BottomSheetCard>
    );

    const handle = getHandle(container);
    fireEvent.pointerDown(handle, { clientY: 0 });
    fireEvent.pointerMove(handle, { clientY: 200 });
    fireEvent.pointerUp(handle, { clientY: 200 });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss or toggle state on a small drag below the threshold', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <BottomSheetCard onDismiss={onDismiss}>
        <p>Card content</p>
      </BottomSheetCard>
    );

    const handle = getHandle(container);
    const card = container.querySelector('.infoCard');
    fireEvent.pointerDown(handle, { clientY: 0 });
    fireEvent.pointerMove(handle, { clientY: 30 });
    fireEvent.pointerUp(handle, { clientY: 30 });

    expect(onDismiss).not.toHaveBeenCalled();
    expect(card).toHaveClass('sheet-half');
  });
});

