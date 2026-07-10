import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import type { RootState } from '../app/store';
import BackupService from '../services/BackupService';
import type { BackupStatus, BackupTypeStatus } from '../types/backup';
import './AdminPanel.css';

const formatTimestamp = (value: string | null): string =>
  value ? new Date(value).toLocaleString() : 'Never';

const BackupTypeRow = ({ label, status }: { label: string; status: BackupTypeStatus }) => {
  const stateClass = status.stale ? 'backup-status--stale' : 'backup-status--fresh';
  const outcomeLabel = status.outcome ?? 'NONE';

  return (
    <div className={`backup-status-row ${stateClass}`}>
      <span className="backup-status-label">{label}</span>
      <span className="backup-status-time">Last backup: {formatTimestamp(status.lastRunAt)}</span>
      <span className="backup-status-outcome">{outcomeLabel}</span>
      {status.stale && (
        <span className="backup-status-warning">⚠️ It has been a long time since the last backup</span>
      )}
    </div>
  );
};

const AdminPanel = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => BackupService.getStatus(), []);

  const refreshStatus = useCallback(async () => {
    try {
      const result = await fetchStatus();
      setStatus(result);
      setStatusError(null);
    } catch (err) {
      console.error('Failed to fetch backup status:', err);
      setStatusError('Failed to load backup status.');
    }
  }, [fetchStatus]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialStatus = async () => {
      try {
        const result = await fetchStatus();
        if (isMounted) {
          setStatus(result);
          setStatusError(null);
        }
      } catch (err) {
        console.error('Failed to fetch backup status:', err);
        if (isMounted) {
          setStatusError('Failed to load backup status.');
        }
      }
    };

    void loadInitialStatus();

    return () => {
      isMounted = false;
    };
  }, [fetchStatus]);

  const handleBackupNow = useCallback(async () => {
    setIsBackingUp(true);
    setSyncMessage(null);
    try {
      const result = await BackupService.triggerSync();
      const parts = [`Database: ${result.database.message}`, `Media: ${result.media.message}`];
      setSyncMessage(parts.join(' | '));
      await refreshStatus();
    } catch (err) {
      console.error('Failed to trigger backup:', err);
      setSyncMessage('Failed to trigger backup. Please try again.');
    } finally {
      setIsBackingUp(false);
    }
  }, [refreshStatus]);

  return (
    <div className="pagebox">
      <div className="admin-panel">
        <h1>Admin Panel</h1>
        <p>Welcome, <strong>{user?.username}</strong>!</p>
        <p>You have administrative access to manage the dataset.</p>

        <div className="admin-actions">
          <p>Coming soon: manage users, delete entries, view logs, etc.</p>
        </div>

        <div className="backup-panel">
          <h2>Backups</h2>

          {statusError && <p className="backup-status-error">{statusError}</p>}

          {status && (
            <div className="backup-status-list">
              <BackupTypeRow label="Database" status={status.database} />
              <BackupTypeRow label="Media" status={status.media} />
            </div>
          )}

          <button onClick={() => void handleBackupNow()} disabled={isBackingUp}>
            {isBackingUp ? 'Backing up…' : 'Back up now'}
          </button>

          {syncMessage && <p className="backup-sync-message">{syncMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;




