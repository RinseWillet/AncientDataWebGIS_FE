import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import './BottomSheetCard.css';

export type SheetState = 'half' | 'full';

interface BottomSheetCardProps {
  children: ReactNode;
  /** Called when the user drags the sheet down past the dismiss threshold (mobile only). */
  onDismiss?: () => void;
}

/** How far (px) the sheet must be dragged down before it counts as a dismiss gesture. */
const DRAG_DISMISS_THRESHOLD_PX = 120;
/** How far (px) the sheet must move before a pointer interaction counts as a drag, not a tap. */
const DRAG_MOVE_THRESHOLD_PX = 8;

/**
 * Wraps the map info card content in a shell that behaves as a fixed side panel on
 * desktop/tablet, and as a mobile bottom-sheet (drag handle + tap-to-expand/collapse +
 * swipe-down-to-dismiss) on narrow screens. On desktop the drag handle is hidden via CSS
 * and this component behaves exactly like a plain `.infoCard` wrapper.
 */
const BottomSheetCard = ({ children, onDismiss }: BottomSheetCardProps) => {
  const [sheetState, setSheetState] = useState<SheetState>('half');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const hasDraggedRef = useRef(false);

  const toggleSheetState = () => {
    setSheetState((prev) => (prev === 'half' ? 'full' : 'half'));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    dragStartY.current = event.clientY;
    hasDraggedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragStartY.current === null) return;
    const offset = event.clientY - dragStartY.current;
    if (Math.abs(offset) > DRAG_MOVE_THRESHOLD_PX) {
      hasDraggedRef.current = true;
    }
    // Only allow dragging downward (dismiss gesture); ignore upward drag past 0.
    setDragOffset(Math.max(offset, 0));
  };

  const endDrag = () => {
    if (dragStartY.current === null) return;
    const finalOffset = dragOffset;
    dragStartY.current = null;
    setIsDragging(false);
    setDragOffset(0);

    if (finalOffset > DRAG_DISMISS_THRESHOLD_PX) {
      onDismiss?.();
    }
  };

  const handleClick = () => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    toggleSheetState();
  };

  const dragStyle = isDragging
    ? { transform: `translateY(${dragOffset}px)`, transition: 'none' }
    : undefined;

  return (
    <div className={`infoCard sheet-${sheetState}`} style={dragStyle}>
      <button
        type="button"
        className="infoCard-dragHandle"
        aria-label={sheetState === 'half' ? 'Expand details panel' : 'Collapse details panel'}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="infoCard-dragHandle-bar" />
      </button>
      {children}
    </div>
  );
};

export default BottomSheetCard;





