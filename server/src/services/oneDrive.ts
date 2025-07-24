import { Client } from '@microsoft/microsoft-graph-client';
import { CloudProvider, AuthTokens, CloudFile } from '../types';
import logger from '../utils/logger';

export class OneDriveService implements CloudProvider {
  name: 'onedrive' = 'onedrive';

  private getClient(accessToken: string) {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  async authenticate(code: string): Promise<AuthTokens> {
    try {
      const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      
      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
        grant_type: 'authorization_code',
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
      logger.error('OneDrive authentication error:', error);
      throw new Error('Failed to authenticate with OneDrive');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      
      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
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
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      };
    } catch (error) {
      logger.error('OneDrive token refresh error:', error);
      throw new Error('Failed to refresh OneDrive token');
    }
  }

  async uploadFile(accessToken: string, file: Buffer, path: string): Promise<CloudFile> {
    try {
      const client = this.getClient(accessToken);
      const fileName = path.split('/').pop()!;
      const appFolderPath = `/drive/special/approot:/${path}:/content`;

      const response = await client
        .api(appFolderPath)
        .put(file);

      return {
        id: response.id,
        name: response.name,
        size: response.size,
        modifiedTime: new Date(response.lastModifiedDateTime),
      };
    } catch (error) {
      logger.error('OneDrive upload error:', error);
      throw new Error('Failed to upload file to OneDrive');
    }
  }

  async downloadFile(accessToken: string, fileId: string): Promise<Buffer> {
    try {
      const client = this.getClient(accessToken);
      const response = await client
        .api(`/drive/items/${fileId}/content`)
        .get();

      return Buffer.from(response);
    } catch (error) {
      logger.error('OneDrive download error:', error);
      throw new Error('Failed to download file from OneDrive');
    }
  }

  async listFiles(accessToken: string, path?: string): Promise<CloudFile[]> {
    try {
      const client = this.getClient(accessToken);
      const endpoint = path 
        ? `/drive/special/approot:/${path}:/children`
        : '/drive/special/approot/children';

      const response = await client
        .api(endpoint)
        .get();

      return response.value.map((file: any) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        modifiedTime: new Date(file.lastModifiedDateTime),
        isFolder: !!file.folder,
        mimeType: file.file?.mimeType,
      }));
    } catch (error) {
      logger.error('OneDrive list files error:', error);
      throw new Error('Failed to list files from OneDrive');
    }
  }

  async deleteFile(accessToken: string, fileId: string): Promise<void> {
    try {
      const client = this.getClient(accessToken);
      await client
        .api(`/drive/items/${fileId}`)
        .delete();
    } catch (error) {
      logger.error('OneDrive delete error:', error);
      throw new Error('Failed to delete file from OneDrive');
    }
  }

  async createFolder(accessToken: string, name: string, parentId?: string): Promise<CloudFile> {
    try {
      const client = this.getClient(accessToken);
      const endpoint = parentId
        ? `/drive/items/${parentId}/children`
        : '/drive/special/approot/children';

      const response = await client
        .api(endpoint)
        .post({
          name,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        });

      return {
        id: response.id,
        name: response.name,
        isFolder: true,
      };
    } catch (error) {
      logger.error('OneDrive create folder error:', error);
      throw new Error('Failed to create folder in OneDrive');
    }
  }
}