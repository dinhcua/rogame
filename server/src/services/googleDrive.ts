import { google } from 'googleapis';
import { CloudProvider, AuthTokens, CloudFile } from '../types';
import logger from '../utils/logger';

export class GoogleDriveService implements CloudProvider {
  name: 'google_drive' = 'google_drive';
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async authenticate(code: string): Promise<AuthTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : undefined,
        tokenType: tokens.token_type!,
      };
    } catch (error) {
      logger.error('Google Drive authentication error:', error);
      throw new Error('Failed to authenticate with Google Drive');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return {
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token!,
        expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : undefined,
        tokenType: credentials.token_type!,
      };
    } catch (error) {
      logger.error('Google Drive token refresh error:', error);
      throw new Error('Failed to refresh Google Drive token');
    }
  }

  async uploadFile(accessToken: string, file: Buffer, path: string): Promise<CloudFile> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

      // Create folder structure if needed
      const pathParts = path.split('/');
      const fileName = pathParts.pop()!;
      let parentId = 'root';

      // Create nested folders
      for (const folderName of pathParts) {
        if (folderName) {
          parentId = await this.ensureFolder(drive, folderName, parentId);
        }
      }

      const fileMetadata = {
        name: fileName,
        parents: [parentId],
      };

      const media = {
        body: file,
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, size, modifiedTime',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        size: parseInt(response.data.size || '0'),
        modifiedTime: new Date(response.data.modifiedTime!),
      };
    } catch (error) {
      logger.error('Google Drive upload error:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }

  async downloadFile(accessToken: string, fileId: string): Promise<Buffer> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
      logger.error('Google Drive download error:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  }

  async listFiles(accessToken: string, path?: string): Promise<CloudFile[]> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

      let query = 'trashed = false';
      let parentId = 'root';

      if (path) {
        // Navigate to the specified path
        const pathParts = path.split('/').filter(p => p);
        for (const folderName of pathParts) {
          const folderResponse = await drive.files.list({
            q: `name = '${folderName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id)',
          });
          
          if (folderResponse.data.files && folderResponse.data.files.length > 0) {
            parentId = folderResponse.data.files[0].id!;
          } else {
            return []; // Path doesn't exist
          }
        }
      }

      query += ` and '${parentId}' in parents`;

      const response = await drive.files.list({
        q: query,
        fields: 'files(id, name, size, modifiedTime, mimeType)',
        pageSize: 1000,
      });

      return (response.data.files || []).map(file => ({
        id: file.id!,
        name: file.name!,
        size: parseInt(file.size || '0'),
        modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
        mimeType: file.mimeType!,
        isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      }));
    } catch (error) {
      logger.error('Google Drive list files error:', error);
      throw new Error('Failed to list files from Google Drive');
    }
  }

  async deleteFile(accessToken: string, fileId: string): Promise<void> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

      await drive.files.delete({ fileId });
    } catch (error) {
      logger.error('Google Drive delete error:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }

  async createFolder(accessToken: string, name: string, parentId?: string): Promise<CloudFile> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

      const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId || 'root'],
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        isFolder: true,
      };
    } catch (error) {
      logger.error('Google Drive create folder error:', error);
      throw new Error('Failed to create folder in Google Drive');
    }
  }

  private async ensureFolder(drive: any, folderName: string, parentId: string): Promise<string> {
    try {
      // Check if folder already exists
      const searchResponse = await drive.files.list({
        q: `name = '${folderName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
      });

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        return searchResponse.data.files[0].id!;
      }

      // Create folder if it doesn't exist
      const createResponse = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
        fields: 'id',
      });

      return createResponse.data.id!;
    } catch (error) {
      logger.error('Google Drive ensure folder error:', error);
      throw error;
    }
  }
}