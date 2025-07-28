import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import logger from "../utils/logger";

const router = Router();

// Configure storage directory
const STORAGE_DIR =
  process.env.STORAGE_DIR || path.join(__dirname, "../../storage");

// Ensure storage directory exists
(async () => {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    logger.error("Failed to create storage directory:", error);
  }
})();

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Create subdirectories based on date
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      const uploadDir = path.join(
        STORAGE_DIR,
        "uploads",
        String(year),
        month,
        day
      );
      await fs.mkdir(uploadDir, { recursive: true });

      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, "");
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Optional: Add file type restrictions here
    cb(null, true);
  },
});

// Upload single file
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    console.log(req.file);

    const fileInfo = {
      id: crypto.randomBytes(16).toString("hex"),
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
      uploadDate: new Date().toISOString(),
    };

    // Store file metadata (in production, use a database)
    const metadataPath = path.join(
      STORAGE_DIR,
      "metadata",
      `${fileInfo.id}.json`
    );
    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(fileInfo, null, 2));

    res.json({
      message: "File uploaded successfully",
      file: {
        id: fileInfo.id,
        originalName: fileInfo.originalName,
        size: fileInfo.size,
        uploadDate: fileInfo.uploadDate,
      },
    });
  } catch (error) {
    logger.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Upload multiple files
router.post("/upload/multiple", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const filesInfo = await Promise.all(
      req.files.map(async (file) => {
        const fileInfo = {
          id: crypto.randomBytes(16).toString("hex"),
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path,
          uploadDate: new Date().toISOString(),
        };

        // Store file metadata
        const metadataPath = path.join(
          STORAGE_DIR,
          "metadata",
          `${fileInfo.id}.json`
        );
        await fs.mkdir(path.dirname(metadataPath), { recursive: true });
        await fs.writeFile(metadataPath, JSON.stringify(fileInfo, null, 2));

        return {
          id: fileInfo.id,
          originalName: fileInfo.originalName,
          size: fileInfo.size,
          uploadDate: fileInfo.uploadDate,
        };
      })
    );

    res.json({
      message: "Files uploaded successfully",
      files: filesInfo,
    });
  } catch (error) {
    logger.error("Multiple upload error:", error);
    res.status(500).json({ error: "Failed to upload files" });
  }
});

// Download file
router.get("/download/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate file ID format
    if (!/^[a-f0-9]{32}$/.test(fileId)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    // Read file metadata
    const metadataPath = path.join(STORAGE_DIR, "metadata", `${fileId}.json`);
    const metadataContent = await fs.readFile(metadataPath, "utf-8");
    const metadata = JSON.parse(metadataContent);

    // Check if file exists
    await fs.access(metadata.path);

    // Set headers
    res.setHeader(
      "Content-Type",
      metadata.mimetype || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${metadata.originalName}"`
    );
    res.setHeader("Content-Length", metadata.size.toString());

    // Stream file
    const fileStream = require("fs").createReadStream(metadata.path);
    fileStream.pipe(res);
  } catch (error) {
    logger.error("Download error:", error);
    if ((error as any).code === "ENOENT") {
      res.status(404).json({ error: "File not found" });
    } else {
      res.status(500).json({ error: "Failed to download file" });
    }
  }
});

// Get file info
router.get("/file/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate file ID format
    if (!/^[a-f0-9]{32}$/.test(fileId)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    // Read file metadata
    const metadataPath = path.join(STORAGE_DIR, "metadata", `${fileId}.json`);
    const metadataContent = await fs.readFile(metadataPath, "utf-8");
    const metadata = JSON.parse(metadataContent);

    res.json({
      id: metadata.id,
      originalName: metadata.originalName,
      size: metadata.size,
      mimetype: metadata.mimetype,
      uploadDate: metadata.uploadDate,
    });
  } catch (error) {
    logger.error("Get file info error:", error);
    if ((error as any).code === "ENOENT") {
      res.status(404).json({ error: "File not found" });
    } else {
      res.status(500).json({ error: "Failed to get file info" });
    }
  }
});

// Delete file
router.delete("/file/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate file ID format
    if (!/^[a-f0-9]{32}$/.test(fileId)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    // Read file metadata
    const metadataPath = path.join(STORAGE_DIR, "metadata", `${fileId}.json`);
    const metadataContent = await fs.readFile(metadataPath, "utf-8");
    const metadata = JSON.parse(metadataContent);

    // Delete file and metadata
    await fs.unlink(metadata.path);
    await fs.unlink(metadataPath);

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    logger.error("Delete error:", error);
    if ((error as any).code === "ENOENT") {
      res.status(404).json({ error: "File not found" });
    } else {
      res.status(500).json({ error: "Failed to delete file" });
    }
  }
});

// List files
router.get("/files", async (req, res) => {
  try {
    const metadataDir = path.join(STORAGE_DIR, "metadata");

    // Check if metadata directory exists
    try {
      await fs.access(metadataDir);
    } catch {
      return res.json({ files: [] });
    }

    // Read all metadata files
    const metadataFiles = await fs.readdir(metadataDir);
    const files = await Promise.all(
      metadataFiles
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => {
          const content = await fs.readFile(
            path.join(metadataDir, file),
            "utf-8"
          );
          const metadata = JSON.parse(content);
          return {
            id: metadata.id,
            originalName: metadata.originalName,
            size: metadata.size,
            mimetype: metadata.mimetype,
            uploadDate: metadata.uploadDate,
          };
        })
    );

    // Sort by upload date (newest first)
    files.sort(
      (a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    res.json({ files });
  } catch (error) {
    logger.error("List files error:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
});

export default router;
