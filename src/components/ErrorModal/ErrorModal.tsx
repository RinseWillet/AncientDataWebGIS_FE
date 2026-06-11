import { useEffect, useRef } from 'react';
import './ErrorModal.css';

interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

const ErrorModal = ({ isOpen, title = 'Error', message, onClose }: ErrorModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="error-modal-overlay"
    >
      <div
        className="error-modal-container"
        role="alertdialog"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-message"
      >
        <div className="error-modal-header">
          <h2 id="error-modal-title" className="error-modal-title">
            {title}
          </h2>
          <button
            className="error-modal-close"
            onClick={onClose}
            aria-label="Close error dialog"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="error-modal-body">
          <p id="error-modal-message" className="error-modal-message">
            {message}
          </p>
        </div>
        <div className="error-modal-footer">
          <button
            className="error-modal-btn-primary"
            onClick={onClose}
            type="button"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;


