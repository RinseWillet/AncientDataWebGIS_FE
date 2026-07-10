export type BackupOutcome = 'SUCCESS' | 'FAILURE';

export interface BackupTypeStatus {
  lastRunAt: string | null; // ISO-8601
  outcome: BackupOutcome | null;
  message: string | null;
  stale: boolean;
}

export interface BackupStatus {
  database: BackupTypeStatus;
  media: BackupTypeStatus;
}

export interface BackupActionResult {
  status: 'ok' | 'error';
  message: string;
}

export interface BackupSyncResponse {
  database: BackupActionResult;
  media: BackupActionResult;
}

