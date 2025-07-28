import { useState, useCallback } from "react";
import { useToast } from "./useToast";
import { invoke } from "@tauri-apps/api/core";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

interface UploadResult {
  id: string;
  originalName: string;
  size: number;
  uploadDate: string;
}

export const useServerUpload = () => {
  const { success, error: showError } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const uploadFile = useCallback(async (filePath: string, fileName: string): Promise<UploadResult | null> => {
    setIsUploading(true);
    setUploadProgress(prev => ({ ...prev, [filePath]: 0 }));

    try {
      console.log(`Starting upload for file: ${fileName} at path: ${filePath}`);
      
      // Read file content using Tauri command
      const fileContent = await invoke<number[]>("read_file_as_bytes", { filePath });
      console.log(`Read ${fileContent.length} bytes from file`);
      
      // Convert number array to Uint8Array and create blob
      const uint8Array = new Uint8Array(fileContent);
      const blob = new Blob([uint8Array]);
      console.log(`Created blob of size: ${blob.size}`);
      
      // Create FormData
      const formData = new FormData();
      formData.append("file", blob, fileName);

      // Upload to server
      console.log(`Uploading to: ${SERVER_URL}/storage/upload`);
      const response = await fetch(`${SERVER_URL}/storage/upload`, {
        method: "POST",
        body: formData,
      });

      console.log(`Server response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      console.log("Upload successful, server response:", result);
      
      setUploadProgress(prev => ({ ...prev, [filePath]: 100 }));
      success(`Successfully uploaded ${fileName} to server`);
      
      return result.file;
    } catch (error) {
      console.error("Upload error details:", {
        error,
        fileName,
        filePath,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined
      });
      showError(`Failed to upload ${fileName}: ${error instanceof Error ? error.message : "Unknown error"}`);
      return null;
    } finally {
      setIsUploading(false);
      // Clean up progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[filePath];
          return newProgress;
        });
      }, 2000);
    }
  }, [success, showError]);

  const uploadMultipleFiles = useCallback(async (files: Array<{ path: string; name: string }>): Promise<UploadResult[]> => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      
      // Read all files and add to FormData
      for (const file of files) {
        const fileContent = await invoke<number[]>("read_file_as_bytes", { filePath: file.path });
        const uint8Array = new Uint8Array(fileContent);
        const blob = new Blob([uint8Array]);
        formData.append("files", blob, file.name);
      }

      // Upload all files at once
      const response = await fetch(`${SERVER_URL}/storage/upload/multiple`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      
      success(`Successfully uploaded ${result.files.length} files to server`);
      
      return result.files;
    } catch (error) {
      console.error("Upload error:", error);
      showError(`Failed to upload files: ${error instanceof Error ? error.message : "Unknown error"}`);
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [success, showError]);

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    uploadProgress,
  };
};