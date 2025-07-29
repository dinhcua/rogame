# Google Drive Authentication Guide

## Problem
The Google Drive access token you're using is invalid or expired. This is why the upload is failing with a 500 error.

## Solution

### Option 1: Use the App's OAuth Flow (Recommended)

1. **Make sure your server is configured correctly**:
   ```bash
   cd server
   cat .env  # Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
   ```

2. **Start the Rogame app**:
   ```bash
   npm run dev
   ```

3. **Connect Google Drive through the app**:
   - Open a game detail page
   - Click on the Cloud Storage section
   - Click "Connect" for Google Drive
   - Complete the OAuth flow in your browser
   - The app will automatically save the valid token

4. **Test the upload**:
   - Click on a backup item's menu (three dots)
   - Select "Upload to Google Drive"

### Option 2: Get a Fresh Token for Testing

1. **Use the OAuth Playground**:
   - Go to https://developers.google.com/oauthplayground/
   - Select "Drive API v3" from the list
   - Check "https://www.googleapis.com/auth/drive.file"
   - Click "Authorize APIs"
   - Complete the OAuth flow
   - Click "Exchange authorization code for tokens"
   - Copy the access token

2. **Update your test script**:
   ```bash
   # Edit test-cloud-api.sh and replace the FAKE_TOKEN with the new token
   vim test-cloud-api.sh
   ```

### Option 3: Use the Web Test Interface

1. **Open the test interface**:
   ```bash
   open test-cloud-upload.html
   ```

2. **Click "Connect Google Drive"**

3. **Complete OAuth in the popup**

4. **Test upload with the web interface**

## Token Information

Google Drive access tokens typically expire after 1 hour. The token in your test script has expired. 

For persistent access, the app uses refresh tokens which are stored securely in the SQLite database and can be used to get new access tokens automatically.

## Verifying Server Configuration

Check that your server has the correct OAuth credentials:

```bash
cd server
grep GOOGLE .env
```

You should see:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI

If these are not set, you need to:
1. Go to https://console.cloud.google.com/
2. Create or select a project
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Add the credentials to server/.env