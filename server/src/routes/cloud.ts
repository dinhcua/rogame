import { Router } from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { GoogleDriveService } from '../services/googleDrive';
import { OneDriveService } from '../services/oneDrive';
import { DropboxService } from '../services/dropbox';
import logger from '../utils/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const googleDrive = new GoogleDriveService();
const oneDrive = new OneDriveService();
const dropbox = new DropboxService();

// Get cloud provider service
const getCloudService = (provider: string) => {
  switch (provider) {
    case 'google':
    case 'google_drive':
      return googleDrive;
    case 'microsoft':
    case 'onedrive':
      return oneDrive;
    case 'dropbox':
      return dropbox;
    default:
      throw new Error('Unsupported provider');
  }
};

// Upload file
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: 'File path required' });
    }

    const service = getCloudService(req.provider!);
    const result = await service.uploadFile(
      req.accessToken!,
      req.file.buffer,
      path
    );

    return res.json({ file: result });
  } catch (error) {
    logger.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download file
router.get('/download/:fileId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { fileId } = req.params;
    
    const service = getCloudService(req.provider!);
    const fileBuffer = await service.downloadFile(req.accessToken!, fileId);

    res.setHeader('Content-Type', 'application/octet-stream');
    return res.send(fileBuffer);
  } catch (error) {
    logger.error('Download error:', error);
    return res.status(500).json({ error: 'Failed to download file' });
  }
});

// List files
router.get('/files', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { path } = req.query;
    
    const service = getCloudService(req.provider!);
    const files = await service.listFiles(req.accessToken!, path as string);

    return res.json({ files });
  } catch (error) {
    logger.error('List files error:', error);
    return res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete file
router.delete('/files/:fileId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { fileId } = req.params;
    
    const service = getCloudService(req.provider!);
    await service.deleteFile(req.accessToken!, fileId);

    return res.json({ success: true });
  } catch (error) {
    logger.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Create folder
router.post('/folder', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name required' });
    }

    const service = getCloudService(req.provider!);
    const folder = await service.createFolder(req.accessToken!, name, parentId);

    return res.json({ folder });
  } catch (error) {
    logger.error('Create folder error:', error);
    return res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Sync game saves
router.post('/sync/game', authenticateToken, upload.array('files'), async (req: AuthRequest, res) => {
  try {
    const { gameId, gameName } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!gameId || !gameName) {
      return res.status(400).json({ error: 'Game ID and name required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const service = getCloudService(req.provider!);
    
    // Handle rogame folder structure
    let folderPath: string;
    if (gameName.startsWith('rogame/')) {
      // If gameName starts with 'rogame/', use it as is
      folderPath = gameName;
    } else {
      // Otherwise, use the default naming
      folderPath = `${gameName}_${gameId}`;
    }
    
    // Helper function to get existing files in the target folder path
    const getExistingFiles = async (path: string): Promise<any[]> => {
      try {
        // Navigate to the folder path
        const pathParts = path.split('/').filter(p => p);
        let currentPath = '';
        
        // Build the path to check if files exist
        for (let i = 0; i < pathParts.length; i++) {
          currentPath = pathParts.slice(0, i + 1).join('/');
        }
        
        const files = await service.listFiles(req.accessToken!, currentPath);
        return files;
      } catch (error) {
        // If folder doesn't exist, return empty array
        return [];
      }
    };
    
    // Helper function to generate unique filename
    const getUniqueFileName = async (baseName: string, folderPath: string): Promise<string> => {
      const existingFiles = await getExistingFiles(folderPath);
      
      // Extract file extension
      const lastDotIndex = baseName.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex > -1 ? baseName.substring(0, lastDotIndex) : baseName;
      const extension = lastDotIndex > -1 ? baseName.substring(lastDotIndex) : '';
      
      let finalName = baseName;
      let counter = 1;
      
      // Check if file exists
      while (existingFiles.some(f => f.name === finalName && !f.isFolder)) {
        finalName = `${nameWithoutExt}_${counter}${extension}`;
        counter++;
      }
      
      return finalName;
    };
    
    // Upload all save files with unique names
    const uploadedFiles = await Promise.all(
      files.map(async file => {
        const uniqueFileName = await getUniqueFileName(file.originalname, folderPath);
        // The uploadFile method will create the folder structure automatically
        return service.uploadFile(
          req.accessToken!,
          file.buffer,
          `${folderPath}/${uniqueFileName}`
        );
      })
    );

    return res.json({ 
      gameId,
      gameName,
      uploadedFiles,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      syncDate: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Game sync error:', error);
    return res.status(500).json({ error: 'Failed to sync game saves' });
  }
});

export default router;