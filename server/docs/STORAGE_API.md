# Storage API Documentation

The local storage API allows you to upload, download, and manage files directly on the server.

## Base URL

```
http://localhost:3001/storage
```

## Endpoints

### 1. Upload Single File

**POST** `/upload`

Upload a single file to the server.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: 
  - `file`: The file to upload

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "a1b2c3d4e5f6...",
    "originalName": "example.txt",
    "size": 1024,
    "uploadDate": "2024-01-10T12:00:00.000Z"
  }
}
```

### 2. Upload Multiple Files

**POST** `/upload/multiple`

Upload multiple files at once (max 10 files).

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: 
  - `files`: Array of files to upload

**Response:**
```json
{
  "message": "Files uploaded successfully",
  "files": [
    {
      "id": "a1b2c3d4e5f6...",
      "originalName": "file1.txt",
      "size": 1024,
      "uploadDate": "2024-01-10T12:00:00.000Z"
    },
    {
      "id": "b2c3d4e5f6a7...",
      "originalName": "file2.txt",
      "size": 2048,
      "uploadDate": "2024-01-10T12:00:01.000Z"
    }
  ]
}
```

### 3. Download File

**GET** `/download/:fileId`

Download a file by its ID.

**Request:**
- Method: `GET`
- URL Parameter: `fileId` - The unique file identifier

**Response:**
- Binary file data with appropriate headers

### 4. Get File Information

**GET** `/file/:fileId`

Get metadata about a specific file.

**Request:**
- Method: `GET`
- URL Parameter: `fileId` - The unique file identifier

**Response:**
```json
{
  "id": "a1b2c3d4e5f6...",
  "originalName": "example.txt",
  "size": 1024,
  "mimetype": "text/plain",
  "uploadDate": "2024-01-10T12:00:00.000Z"
}
```

### 5. Delete File

**DELETE** `/file/:fileId`

Delete a file from the server.

**Request:**
- Method: `DELETE`
- URL Parameter: `fileId` - The unique file identifier

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

### 6. List All Files

**GET** `/files`

Get a list of all uploaded files.

**Request:**
- Method: `GET`

**Response:**
```json
{
  "files": [
    {
      "id": "a1b2c3d4e5f6...",
      "originalName": "file1.txt",
      "size": 1024,
      "mimetype": "text/plain",
      "uploadDate": "2024-01-10T12:00:00.000Z"
    },
    {
      "id": "b2c3d4e5f6a7...",
      "originalName": "file2.jpg",
      "size": 204800,
      "mimetype": "image/jpeg",
      "uploadDate": "2024-01-10T12:00:01.000Z"
    }
  ]
}
```

## Storage Structure

Files are organized in the following structure:

```
storage/
├── uploads/
│   ├── 2024/
│   │   ├── 01/
│   │   │   ├── 10/
│   │   │   │   ├── file1-timestamp-random.txt
│   │   │   │   └── file2-timestamp-random.jpg
│   │   │   └── 11/
│   │   └── 02/
│   └── metadata/
│       ├── a1b2c3d4e5f6.json
│       └── b2c3d4e5f6a7.json
```

## Configuration

### Environment Variables

- `STORAGE_DIR`: Path to the storage directory (default: `./storage`)
- `PORT`: Server port (default: 3001)

### File Size Limits

- Maximum file size: 100MB
- Maximum files per multi-upload: 10

## Testing

Use the provided `test-upload.html` file to test the storage functionality:

```bash
# Start the server
npm run dev

# Open test-upload.html in a browser
# Upload, download, and manage files through the UI
```

## Security Considerations

1. **File ID Validation**: All file IDs are validated to be 32-character hexadecimal strings
2. **Path Traversal Protection**: Files are stored with generated names to prevent path traversal attacks
3. **File Size Limits**: Enforced to prevent storage exhaustion
4. **MIME Type Handling**: Files are served with their original MIME types

## Future Enhancements

1. **Authentication**: Add user authentication and file ownership
2. **Compression**: Support for automatic file compression
3. **Thumbnails**: Generate thumbnails for image files
4. **Expiration**: Add file expiration and automatic cleanup
5. **Chunked Uploads**: Support for large file uploads with resumable chunks