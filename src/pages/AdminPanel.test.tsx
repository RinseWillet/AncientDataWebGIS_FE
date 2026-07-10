import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdminPanel from '../pages/AdminPanel';
import authReducer from '../features/authentication/authSlice';
import BackupService from '../services/BackupService';
import type { BackupStatus, BackupSyncResponse } from '../types/backup';

vi.mock('../services/BackupService', () => ({
  default: {
    getStatus: vi.fn(),
    triggerSync: vi.fn(),
  },
}));

const renderWithStore = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: { username: 'admin', role: 'ADMIN', token: 'tok' }, loading: false, error: null },
    },
  });

  return render(
    <Provider store={store}>
      <AdminPanel />
    </Provider>
  );
};

describe('AdminPanel backup section', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a stale warning when the last backup is old', async () => {
    const staleStatus: BackupStatus = {
      database: { lastRunAt: '2026-01-01T00:00:00Z', outcome: 'SUCCESS', message: 'ok', stale: true },
      media: { lastRunAt: null, outcome: null, message: null, stale: true },
    };
    vi.mocked(BackupService.getStatus).mockResolvedValue(staleStatus);

    renderWithStore();

    await waitFor(() => {
      expect(screen.getAllByText(/long time since the last backup/i).length).toBeGreaterThan(0);
    });
  });

  it('does not show a stale warning when the backup is recent', async () => {
    const freshStatus: BackupStatus = {
      database: { lastRunAt: new Date().toISOString(), outcome: 'SUCCESS', message: 'ok', stale: false },
      media: { lastRunAt: new Date().toISOString(), outcome: 'SUCCESS', message: 'ok', stale: false },
    };
    vi.mocked(BackupService.getStatus).mockResolvedValue(freshStatus);

    renderWithStore();

    await waitFor(() => {
      expect(screen.getByText('Database')).toBeInTheDocument();
    });
    expect(screen.queryByText(/long time since the last backup/i)).not.toBeInTheDocument();
  });

  it('triggers a backup and refreshes status when "Back up now" is clicked', async () => {
    const initialStatus: BackupStatus = {
      database: { lastRunAt: null, outcome: null, message: null, stale: true },
      media: { lastRunAt: null, outcome: null, message: null, stale: true },
    };
    const syncResult: BackupSyncResponse = {
      database: { status: 'ok', message: 'Backup triggered' },
      media: { status: 'ok', message: 'Backup triggered' },
    };
    vi.mocked(BackupService.getStatus).mockResolvedValue(initialStatus);
    vi.mocked(BackupService.triggerSync).mockResolvedValue(syncResult);

    renderWithStore();

    const button = await screen.findByRole('button', { name: /back up now/i });
    button.click();

    await waitFor(() => {
      expect(BackupService.triggerSync).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(/Backup triggered/)).toBeInTheDocument();
    });
  });
});



