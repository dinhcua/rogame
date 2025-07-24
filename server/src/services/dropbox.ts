import { Dropbox } from 'dropbox';
import { CloudProvider, AuthTokens, CloudFile } from '../types';
import logger from '../utils/logger';

export class DropboxService implements CloudProvider {
  name: 'dropbox' = 'dropbox';

  private getClient(accessToken: string) {
    return new Dropbox({ accessToken });
  }

  async authenticate(code: string): Promise<AuthTokens> {
    try {
      const tokenEndpoint = 'https://api.dropboxapi.com/oauth2/token';
      
      const params = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.DROPBOX_CLIENT_ID!,
        client_secret: process.env.DROPBOX_CLIENT_SECRET!,
        redirect_uri: process.env.DROPBOX_REDIRECT_URI!,
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      };
    } catch (error) {
      logger.error('Dropbox authentication error:', error);
      throw new Error('Failed to authenticate with Dropbox');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const tokenEndpoint = 'https://api.dropboxapi.com/oauth2/token';
      
      const params = new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: process.env.DROPBOX_CLIENT_ID!,
        client_secret: process.env.DROPBOX_CLIENT_SECRET!,
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      };
    } catch (error) {
      logger.error('Dropbox token refresh error:', error);
      throw new Error('Failed to refresh Dropbox token');
    }
  }

  async uploadFile(accessToken: string, file: Buffer, path: string): Promise<CloudFile> {
    try {
      const dbx = this.getClient(accessToken);
      const fullPath = `/Apps/Rogame/${path}`;

      const response = await dbx.filesUpload({
        path: fullPath,
        contents: file,
        mode: { '.tag': 'overwrite' },
      });

      return {
        id: response.result.id,
        name: response.result.name,
        path: response.result.path_display,
        size: response.result.size,
        modifiedTime: new Date(response.result.server_modified),
      };
    } catch (error) {
      logger.error('Dropbox upload error:', error);
      throw new Error('Failed to upload file to Dropbox');
    }
  }

  async downloadFile(accessToken: string, fileId: string): Promise<Buffer> {
    try {
      const dbx = this.getClient(accessToken);
      
      // In Dropbox, we use path as ID for simplicity
      const response = await dbx.filesDownload({ path: fileId });
      
      // @ts-ignore - fileBinary exists but not in types
      return Buffer.from(response.result.fileBinary);
    } catch (error) {
      logger.error('Dropbox download error:', error);
      throw new Error('Failed to download file from Dropbox');
    }
  }

  async listFiles(accessToken: string, path?: string): Promise<CloudFile[]> {
    try {
      const dbx = this.getClient(accessToken);
      const fullPath = path ? `/Apps/Rogame/${path}` : '/Apps/Rogame';

      const response = await dbx.filesListFolder({
        path: fullPath,
        recursive: false,
      });

      return response.result.entries.map(entry => ({
        id: entry.path_display || entry.id,
        name: entry.name,
        path: entry.path_display,
        size: entry['.tag'] === 'file' ? (entry as any).size : undefined,
        modifiedTime: entry['.tag'] === 'file' ? new Date((entry as any).server_modified) : undefined,
        isFolder: entry['.tag'] === 'folder',
      }));
    } catch (error) {
      logger.error('Dropbox list files error:', error);
      throw new Error('Failed to list files from Dropbox');
    }
  }

  async deleteFile(accessToken: string, fileId: string): Promise<void> {
    try {
      const dbx = this.getClient(accessToken);
      await dbx.filesDeleteV2({ path: fileId });
    } catch (error) {
      logger.error('Dropbox delete error:', error);
      throw new Error('Failed to delete file from Dropbox');
    }
  }

  async createFolder(accessToken: string, name: string, parentId?: string): Promise<CloudFile> {
    try {
      const dbx = this.getClient(accessToken);
      const basePath = parentId || '/Apps/Rogame';
      const fullPath = `${basePath}/${name}`;

      const response = await dbx.filesCreateFolderV2({
        path: fullPath,
      });

      return {
        id: response.result.metadata.path_display || response.result.metadata.id,
        name: response.result.metadata.name,
        path: response.result.metadata.path_display,
        isFolder: true,
      };
    } catch (error) {
      logger.error('Dropbox create folder error:', error);
      throw new Error('Failed to create folder in Dropbox');
    }
  }
}