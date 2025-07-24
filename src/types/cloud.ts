export type CloudProvider = 'google_drive' | 'dropbox' | 'onedrive';

export type SyncStatus = 'synced' | 'syncing' | 'pending' | { error: string };

export type SyncFrequency = 'every_save' | 'hourly' | 'daily' | 'manual';

export interface CloudSyncStatus {
  provider: string;
  status: 'idle' | 'syncing' | 'error';
  lastSync?: Date;
  totalFiles: number;
  totalSize: number;
  error?: string;
}

export interface CloudAccount {
  id: string;
  provider: CloudProvider;
  email: string;
  access_token: string;
  refresh_token: string;
  expires_at: string; // ISO8601 format
  is_active: boolean;
}

export interface CloudSyncSettings {
  enabled: boolean;
  frequency: SyncFrequency;
  keep_local_copy: boolean;
  max_storage_gb: number;
}

export interface CloudSyncRecord {
  id: string;
  game_id: string;
  save_file_id: string;
  provider: CloudProvider;
  cloud_path: string;
  local_path: string;
  file_size: number;
  checksum: string;
  status: SyncStatus;
  last_synced: string; // ISO8601 format
}

export interface CloudProviderInfo {
  provider: CloudProvider;
  name: string;
  icon: string;
  isConnected: boolean;
  account?: CloudAccount;
}