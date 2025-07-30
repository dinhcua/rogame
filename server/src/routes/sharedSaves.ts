import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, existsSync } from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'shared-saves');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// In-memory storage for demo (replace with database in production)
interface SharedSave {
  id: string;
  game_id: string;
  game_title: string;
  file_name: string;
  file_path: string;
  description: string;
  uploaded_by: string;
  uploaded_at: string;
  download_count: number;
  size_bytes: number;
  platform: string;
}

let sharedSaves: Map<string, SharedSave[]> = new Map();

// Load data from the new file structure
const loadSavesFromFileSystem = async () => {
  const sharedDir = path.join(process.cwd(), 'uploads', 'shared');
  const indexPath = path.join(sharedDir, 'index.json');
  
  if (existsSync(indexPath)) {
    try {
      const indexData = JSON.parse(readFileSync(indexPath, 'utf-8'));
      const savesMap = new Map<string, SharedSave[]>();
      
      // Load metadata for each save
      for (const saveInfo of indexData.saves) {
        const metadataPath = path.join(sharedDir, saveInfo.metadata_path);
        if (existsSync(metadataPath)) {
          const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
          
          // Convert metadata to SharedSave format
          const sharedSave: SharedSave = {
            id: metadata.save_id,
            game_id: metadata.game_id,
            game_title: metadata.game_title,
            file_name: metadata.save_name,
            file_path: path.join(sharedDir, saveInfo.steam_id, saveInfo.save_id, 'save_files.zip'),
            description: metadata.description,
            uploaded_by: metadata.uploaded_by,
            uploaded_at: metadata.uploaded_at,
            download_count: metadata.download_count,
            size_bytes: metadata.size,
            platform: metadata.platform
          };
          
          // Add to map
          if (!savesMap.has(metadata.game_id)) {
            savesMap.set(metadata.game_id, []);
          }
          savesMap.get(metadata.game_id)!.push(sharedSave);
        }
      }
      
      sharedSaves = savesMap;
      console.log(`Loaded ${savesMap.size} games with ${indexData.saves.length} shared saves from file system`);
    } catch (error) {
      console.error('Failed to load saves from file system:', error);
    }
  }
};

// Get shared saves for a specific game
router.get('/shared-saves/:gameId', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const saves = sharedSaves.get(gameId) || [];
    
    // Sort by upload date (newest first)
    const sortedSaves = saves.sort((a, b) => 
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
    
    res.json(sortedSaves);
  } catch (error) {
    console.error('Error fetching shared saves:', error);
    res.status(500).json({ error: 'Failed to fetch shared saves' });
  }
});

// Upload a new shared save
router.post('/shared-saves/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const {
      game_id,
      game_title,
      description,
      uploaded_by,
      platform
    } = req.body;

    const newSharedSave: SharedSave = {
      id: uuidv4(),
      game_id,
      game_title,
      file_name: req.file.originalname,
      file_path: req.file.path,
      description: description || '',
      uploaded_by: uploaded_by || 'Anonymous',
      uploaded_at: new Date().toISOString(),
      download_count: 0,
      size_bytes: req.file.size,
      platform: platform || 'pc'
    };

    // Add to storage
    if (!sharedSaves.has(game_id)) {
      sharedSaves.set(game_id, []);
    }
    sharedSaves.get(game_id)!.push(newSharedSave);

    res.json(newSharedSave);
  } catch (error) {
    console.error('Error uploading shared save:', error);
    res.status(500).json({ error: 'Failed to upload shared save' });
  }
});

// Download a shared save
router.get('/shared-saves/download/:saveId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { saveId } = req.params;
    
    // Find the save across all games
    let foundSave: SharedSave | null = null;
    for (const saves of sharedSaves.values()) {
      const save = saves.find(s => s.id === saveId);
      if (save) {
        foundSave = save;
        break;
      }
    }

    if (!foundSave) {
      res.status(404).json({ error: 'Shared save not found' });
      return;
    }

    // Check if file exists
    try {
      await fs.access(foundSave.file_path);
    } catch {
      res.status(404).json({ error: 'Save file not found on server' });
      return;
    }

    // Send file with proper filename
    res.download(foundSave.file_path, `${foundSave.file_name}.zip`);
  } catch (error) {
    console.error('Error downloading shared save:', error);
    res.status(500).json({ error: 'Failed to download shared save' });
  }
});

// Update download count
router.post('/shared-saves/download/:saveId/count', async (req: Request, res: Response): Promise<void> => {
  try {
    const { saveId } = req.params;
    
    // Find and update the save
    let updated = false;
    for (const saves of sharedSaves.values()) {
      const save = saves.find(s => s.id === saveId);
      if (save) {
        save.download_count++;
        updated = true;
        break;
      }
    }

    if (!updated) {
      res.status(404).json({ error: 'Shared save not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating download count:', error);
    res.status(500).json({ error: 'Failed to update download count' });
  }
});

// Delete a shared save (for moderation)
router.delete('/shared-saves/:saveId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { saveId } = req.params;
    
    // Find and delete the save
    let deleted = false;
    for (const [, saves] of sharedSaves.entries()) {
      const index = saves.findIndex(s => s.id === saveId);
      if (index !== -1) {
        const save = saves[index];
        
        // Delete the file
        try {
          await fs.unlink(save.file_path);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
        
        // Remove from array
        saves.splice(index, 1);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      res.status(404).json({ error: 'Shared save not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting shared save:', error);
    res.status(500).json({ error: 'Failed to delete shared save' });
  }
});

// Initialize with data from file system
loadSavesFromFileSystem();

export default router;