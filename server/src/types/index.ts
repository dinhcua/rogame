export interface CloudProvider {
  name: 'google_drive' | 'onedrive' | 'dropbox';
  authenticate(code: string): Promise<AuthTokens>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  uploadFile(accessToken: string, file: Buffer, path: string): Promise<CloudFile>;
  downloadFile(accessToken: string, fileId: string): Promise<Buffer>;
  listFiles(accessToken: string, path?: string): Promise<CloudFile[]>;
  deleteFile(accessToken: string, fileId: string): Promise<void>;
  createFolder(accessToken: string, name: string, parentId?: string): Promise<CloudFile>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface CloudFile {
  id: string;
  name: string;
  path?: string;
  size?: number;
  mimeType?: string;
  modifiedTime?: Date;
  isFolder?: boolean;
  parentId?: string;
}

export interface SaveFile {
  gameId: string;
  gameName: string;
  files: {
    path: string;
    size: number;
    lastModified: Date;
  }[];
  totalSize: number;
  backupDate: Date;
}

export interface CloudSyncStatus {
  provider: string;
  lastSync?: Date;
  totalFiles: number;
  totalSize: number;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
}