import { Router } from 'express';
import { GoogleDriveService } from '../services/googleDrive';
import { OneDriveService } from '../services/oneDrive';
import { DropboxService } from '../services/dropbox';
import logger from '../utils/logger';

const router = Router();

// Lazy initialization to ensure env vars are loaded
let googleDrive: GoogleDriveService | null = null;
let oneDrive: OneDriveService | null = null;
let dropbox: DropboxService | null = null;

const getGoogleDrive = () => {
  if (!googleDrive) {
    googleDrive = new GoogleDriveService();
  }
  return googleDrive;
};

const getOneDrive = () => {
  if (!oneDrive) {
    oneDrive = new OneDriveService();
  }
  return oneDrive;
};

const getDropbox = () => {
  if (!dropbox) {
    dropbox = new DropboxService();
  }
  return dropbox;
};

// OAuth flow initiation
router.get('/:provider/url', (req, res) => {
  const { provider } = req.params;

  try {
    let authUrl: string;

    switch (provider) {
      case 'google':
      case 'google_drive':
        const scopes = ['https://www.googleapis.com/auth/drive.file'];
        const googleState = encodeURIComponent(JSON.stringify({ provider: 'google_drive' }));
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${process.env.GOOGLE_CLIENT_ID}` +
          `&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}` +
          `&response_type=code` +
          `&scope=${scopes.join(' ')}` +
          `&access_type=offline` +
          `&prompt=consent` +
          `&state=${googleState}`;
        break;
      
      case 'microsoft':
      case 'onedrive':
        const microsoftState = encodeURIComponent(JSON.stringify({ provider: 'onedrive' }));
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
          `client_id=${process.env.MICROSOFT_CLIENT_ID}` +
          `&redirect_uri=${process.env.MICROSOFT_REDIRECT_URI}` +
          `&response_type=code` +
          `&scope=files.readwrite.appfolder offline_access` +
          `&state=${microsoftState}`;
        break;
      
      case 'dropbox':
        const dropboxState = encodeURIComponent(JSON.stringify({ provider: 'dropbox' }));
        authUrl = `https://www.dropbox.com/oauth2/authorize?` +
          `client_id=${process.env.DROPBOX_CLIENT_ID}` +
          `&redirect_uri=${process.env.DROPBOX_REDIRECT_URI}` +
          `&response_type=code` +
          `&token_access_type=offline` +
          `&state=${dropboxState}`;
        break;
      
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    res.json({ authUrl });
  } catch (error) {
    logger.error('Auth URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// OAuth callback handling - GET request without provider in path
router.get('/callback', (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  // Detect provider from state parameter or referer
  let provider = 'google'; // default
  if (state) {
    // Parse state to get provider info
    try {
      const stateData = JSON.parse(decodeURIComponent(state as string));
      provider = stateData.provider || provider;
    } catch {
      // If state is not JSON, use it as provider directly
      provider = state as string;
    }
  }

  // Build the deep link URL
  const deepLinkUrl = `rogame://oauth-callback?code=${encodeURIComponent(code as string)}&state=${encodeURIComponent(state as string)}`;
  
  // Return HTML that redirects to the deep link
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Callback - Rogame</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #1a1a1a;
          color: #fff;
        }
        .container {
          text-align: center;
          padding: 20px;
        }
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .success {
          color: #4CAF50;
        }
        .button {
          background-color: #3498db;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin-top: 20px;
        }
        .button:hover {
          background-color: #2980b9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Authentication Successful!</h2>
        <div class="spinner"></div>
        <p id="status" class="success">Returning to Rogame...</p>
        <a href="${deepLinkUrl}" class="button" id="openAppBtn">Open Rogame</a>
      </div>
      <script>
        // Attempt to open the deep link automatically
        window.location.href = '${deepLinkUrl}';
        
        // Show the manual button after a delay in case auto-redirect fails
        setTimeout(() => {
          document.getElementById('openAppBtn').style.display = 'inline-block';
          document.getElementById('status').textContent = 'Click below if the app doesn\'t open automatically';
        }, 2000);
      </script>
    </body>
    </html>
  `);
});

// OAuth callback handling - GET request from OAuth providers with provider in path
router.get('/:provider/callback', (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  // Build the deep link URL
  const deepLinkUrl = `rogame://oauth-callback?code=${encodeURIComponent(code as string)}&state=${encodeURIComponent(state as string)}`;
  
  // Return HTML that redirects to the deep link
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Callback - Rogame</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #1a1a1a;
          color: #fff;
        }
        .container {
          text-align: center;
          padding: 20px;
        }
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .success {
          color: #4CAF50;
        }
        .button {
          background-color: #3498db;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin-top: 20px;
        }
        .button:hover {
          background-color: #2980b9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Authentication Successful!</h2>
        <div class="spinner"></div>
        <p id="status" class="success">Returning to Rogame...</p>
        <a href="${deepLinkUrl}" class="button" id="openAppBtn">Open Rogame</a>
      </div>
      <script>
        // Attempt to open the deep link automatically
        window.location.href = '${deepLinkUrl}';
        
        // Show the manual button after a delay in case auto-redirect fails
        setTimeout(() => {
          document.getElementById('openAppBtn').style.display = 'inline-block';
          document.getElementById('status').textContent = 'Click below if the app doesn\'t open automatically';
        }, 2000);
      </script>
    </body>
    </html>
  `);
});

// OAuth callback handling - POST for programmatic use
router.post('/:provider/callback', async (req, res) => {
  const { provider } = req.params;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    let tokens;

    switch (provider) {
      case 'google':
      case 'google_drive':
        tokens = await getGoogleDrive().authenticate(code);
        break;
      
      case 'microsoft':
      case 'onedrive':
        tokens = await getOneDrive().authenticate(code);
        break;
        
      case 'dropbox':
        tokens = await getDropbox().authenticate(code);
        break;
      
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    return res.json({ tokens });
  } catch (error) {
    logger.error('OAuth callback error:', error);
    return res.status(500).json({ error: 'Failed to authenticate' });
  }
});

// Token refresh
router.post('/:provider/refresh', async (req, res) => {
  const { provider } = req.params;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    let tokens;

    switch (provider) {
      case 'google':
      case 'google_drive':
        tokens = await getGoogleDrive().refreshToken(refreshToken);
        break;
      
      case 'microsoft':
      case 'onedrive':
        tokens = await getOneDrive().refreshToken(refreshToken);
        break;
        
      case 'dropbox':
        tokens = await getDropbox().refreshToken(refreshToken);
        break;
      
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    return res.json({ tokens });
  } catch (error) {
    logger.error('Token refresh error:', error);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router;