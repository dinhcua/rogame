# Cloud Storage Setup Guide

This guide will help you set up cloud storage synchronization for Rogame.

## Architecture Overview

The cloud storage feature consists of three components working together:

1. **React Frontend** - User interface for cloud sync operations
2. **Node.js Server** - Handles OAuth authentication and cloud API operations (Required for security)
3. **Tauri Backend** - Manages local game saves and database

⚠️ **Important**: The server is required for cloud upload functionality. Direct upload from the app is not supported for security reasons.

## Prerequisites

- Node.js 18+ installed
- OAuth2 credentials for cloud providers you want to use

## Setup Steps

### 1. Configure Cloud Provider Credentials

1. Copy the environment template:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Set up OAuth2 applications for each provider:

   **Google Drive:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3001/auth/google/callback` as redirect URI
   - Copy Client ID and Secret to `.env`

   **Microsoft OneDrive:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Register a new application
   - Add `http://localhost:3001/auth/microsoft/callback` as redirect URI
   - Create a client secret
   - Copy Application ID and Secret to `.env`

   **Dropbox:**
   - Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
   - Create a new app
   - Add `http://localhost:3001/auth/dropbox/callback` as redirect URI
   - Copy App key and Secret to `.env`

### 2. Install Dependencies

```bash
# Install main project dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Run the Development Environment

Use the provided startup script:

```bash
./start-dev.sh
```

Or run services manually:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Cloud Server
cd server && npm run dev

# Terminal 3: Tauri
npm run tauri dev
```

## Using Cloud Storage

1. **Connect a Cloud Provider:**
   - Click the cloud icon in the game details page
   - Select a provider (Google Drive, OneDrive, or Dropbox)
   - Authenticate in the popup window

2. **Sync Game Saves:**
   - Once authenticated, click the sync button
   - Your game saves will be uploaded to the cloud
   - The sync status will be displayed

3. **Manage Cloud Storage:**
   - View sync status for each game
   - Re-sync saves after playing
   - Disconnect providers when needed

## Security Notes

- OAuth tokens are stored in memory only (not persisted)
- All cloud operations use OAuth2 for secure authentication
- Game saves are stored in app-specific folders (not accessible by other apps)
- HTTPS should be used in production

## Troubleshooting

**500 Internal Server Error when uploading:**
- Check that the server is running (`cd server && npm run dev`)
- Verify OAuth credentials are correctly set in server/.env
- Check server console for detailed error messages
- Ensure ALLOWED_ORIGINS in .env includes your app URL

**Authentication fails:**
- Check that redirect URIs match exactly in your OAuth app settings
- Ensure `.env` file has correct credentials
- Check browser console for errors

**Server won't start:**
- Verify Node.js version is 18+
- Check that port 3001 is available
- Look for error messages in server logs

**Can't connect to cloud:**
- Ensure the Node.js server is running
- Check CORS settings if running on different ports
- Verify network connectivity

## Why Server is Required

The cloud upload feature requires a server for several reasons:

1. **Security**: OAuth credentials should never be exposed in client applications
2. **Token Management**: Server handles token refresh and secure storage
3. **CORS**: Cloud provider APIs don't allow direct browser access
4. **Rate Limiting**: Server can implement proper rate limiting and retry logic

Direct upload from the Tauri app without the server is not recommended and would require:
- Embedding OAuth secrets in the app (major security risk)
- Complex OAuth flow implementation in Rust
- Handling CORS and authentication headers
- Managing token refresh in the client

## Production Deployment

For production:
1. Use HTTPS for all endpoints
2. Store credentials securely (use environment variables)
3. Implement token persistence with encryption
4. Set up proper CORS origins
5. Use a process manager like PM2 for the Node.js server