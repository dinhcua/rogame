# Rogame Cloud Storage Server

A Node.js server that handles cloud storage operations for the Rogame save file manager.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure your cloud provider credentials:
```bash
cp .env.example .env
```

3. Configure OAuth2 credentials for each provider:
   - **Google Drive**: Create a project in Google Cloud Console and enable Drive API
   - **OneDrive**: Register an app in Azure Portal
   - **Dropbox**: Create an app in Dropbox App Console

## Running the Server

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `GET /auth/:provider/url` - Get OAuth2 authorization URL
- `POST /auth/:provider/callback` - Exchange authorization code for tokens
- `POST /auth/:provider/refresh` - Refresh access token

### Cloud Operations
- `POST /cloud/upload` - Upload a single file
- `GET /cloud/download/:fileId` - Download a file
- `GET /cloud/files` - List files in cloud storage
- `DELETE /cloud/files/:fileId` - Delete a file
- `POST /cloud/folder` - Create a folder
- `POST /cloud/sync/game` - Sync game save files

## Environment Variables

- `PORT` - Server port (default: 3001)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth2 credentials
- `MICROSOFT_CLIENT_ID/SECRET` - Microsoft OAuth2 credentials
- `DROPBOX_CLIENT_ID/SECRET` - Dropbox OAuth2 credentials