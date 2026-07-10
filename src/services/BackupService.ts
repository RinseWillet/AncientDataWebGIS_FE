import apiClient from '../api/config';
import type { BackupStatus, BackupSyncResponse } from '../types/backup';

const BackupService = {
  async getStatus(): Promise<BackupStatus> {
    const response = await apiClient.get<BackupStatus>('/backup/status');
    return response.data;
  },

  async triggerSync(): Promise<BackupSyncResponse> {
    const response = await apiClient.post<BackupSyncResponse>('/backup/sync');
    return response.data;
  },
};

export default BackupService;

