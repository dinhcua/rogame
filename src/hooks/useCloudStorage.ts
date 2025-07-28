import { useState, useCallback, useEffect } from "react";
import { CloudProvider, CloudSyncStatus } from "../types/cloud";
import { useToast } from "./useToast";
import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";

const CLOUD_SERVER_URL =
  import.meta.env.VITE_CLOUD_SERVER_URL || "http://localhost:3001";

interface CloudTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

interface CloudFile {
  id: string;
  name: string;
  size?: number;
  modifiedTime?: Date;
  isFolder?: boolean;
}

export const useCloudStorage = () => {
  const { success, error: showError } = useToast();
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>({
    provider: "",
    status: "idle",
    totalFiles: 0,
    totalSize: 0,
  });

  const [tokens, setTokens] = useState<
    Record<CloudProvider, CloudTokens | null>
  >({
    google_drive: null,
    onedrive: null,
    dropbox: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [tokensLoaded, setTokensLoaded] = useState(false);

  // Function to load tokens from database
  const loadTokens = useCallback(async () => {
    setTokensLoaded(false);
    try {
      const providers: CloudProvider[] = [
        "google_drive",
        "onedrive",
        "dropbox",
      ];

      for (const provider of providers) {
        try {
          const token = await invoke<any>("get_cloud_token", { provider });

          console.log(`Token for ${provider}:`, token);

          if (token && token.access_token) {
            setTokens((prev) => ({
              ...prev,
              [provider]: {
                accessToken: token.access_token,
                refreshToken: token.refresh_token,
                expiresIn: token.expires_at
                  ? Math.floor((token.expires_at - Date.now()) / 1000)
                  : undefined,
                tokenType: token.token_type,
              },
            }));
          } else {
            // Clear token if none exists
            setTokens((prev) => ({
              ...prev,
              [provider]: null,
            }));
          }
        } catch (error) {
          console.error(`Failed to load token for ${provider}:`, error);
          // Clear token on error
          setTokens((prev) => ({
            ...prev,
            [provider]: null,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to load tokens:", error);
    } finally {
      setTokensLoaded(true);
    }
  }, []);

  // Load tokens from database on mount and when window gains focus
  useEffect(() => {
    loadTokens();

    // Reload tokens when window gains focus (e.g., returning from OAuth)
    const handleFocus = () => {
      console.log("Window focused, reloading tokens...");
      loadTokens();
    };

    window.addEventListener("focus", handleFocus);

    // Also listen for visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, reloading tokens...");
        loadTokens();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen for custom cloud token update events
    const handleCloudTokenUpdate = (event: CustomEvent) => {
      console.log("Cloud token updated for provider:", event.detail.provider);
      loadTokens();
    };

    window.addEventListener("cloud-token-updated" as any, handleCloudTokenUpdate);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("cloud-token-updated" as any, handleCloudTokenUpdate);
    };
  }, [loadTokens]);

  // Helper function to get provider display name
  const getProviderName = useCallback((provider: CloudProvider): string => {
    switch (provider) {
      case "google_drive":
        return "Google Drive";
      case "dropbox":
        return "Dropbox";
      case "onedrive":
        return "OneDrive";
      default:
        return provider;
    }
  }, []);

  // OAuth callback deep links are now handled in useDeepLink.ts to avoid conflicts
  // The useDeepLink hook will handle all deep links including OAuth callbacks
  // This prevents duplicate toast notifications when OAuth completes

  const getAuthUrl = async (provider: CloudProvider): Promise<string> => {
    try {
      const response = await fetch(`${CLOUD_SERVER_URL}/auth/${provider}/url`);
      if (!response.ok) throw new Error("Failed to get auth URL");

      const { authUrl } = await response.json();
      return authUrl;
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      throw error;
    }
  };

  const authenticate = async (provider: CloudProvider): Promise<void> => {
    try {
      setIsLoading(true);
      const authUrl = await getAuthUrl(provider);

      console.log("Opening auth URL:", authUrl);

      // Store current location to return after OAuth
      window.history.replaceState({ from: window.location.pathname }, '');

      // Open auth URL in the default browser using Tauri
      await openUrl(authUrl);

      // Show user instructions
      success(
        `Please complete the authentication in your browser. The app will automatically detect when you're done.`
      );

      // The OAuth callback will be handled by the useDeepLink hook
    } catch (error) {
      console.error("Authentication failed:", error);
      showError(`Failed to connect to ${getProviderName(provider)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadGameSaves = async (
    provider: CloudProvider,
    gameId: string,
    gameName: string,
    saveFiles: File[]
  ): Promise<void> => {
    const providerTokens = tokens[provider];
    if (!providerTokens) throw new Error("Not authenticated");

    setSyncStatus((prev) => ({ ...prev, status: "syncing", provider }));
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("gameId", gameId);
      formData.append("gameName", gameName);

      saveFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${CLOUD_SERVER_URL}/cloud/sync/game`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${providerTokens.accessToken}`,
          "X-Cloud-Provider": provider,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          await refreshToken(provider);
          // Retry the upload
          return uploadGameSaves(provider, gameId, gameName, saveFiles);
        }
        throw new Error("Failed to upload game saves");
      }

      const result = await response.json();

      setSyncStatus({
        provider,
        status: "idle",
        lastSync: new Date(),
        totalFiles: result.uploadedFiles.length,
        totalSize: result.totalSize,
      });

      success("Game saves synced to cloud");
    } catch (error) {
      setSyncStatus((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      showError("Failed to sync saves to cloud");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (provider: CloudProvider): Promise<void> => {
    const providerTokens = tokens[provider];
    if (!providerTokens?.refreshToken)
      throw new Error("No refresh token available");

    try {
      const response = await fetch(
        `${CLOUD_SERVER_URL}/auth/${provider}/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: providerTokens.refreshToken }),
        }
      );

      if (!response.ok) throw new Error("Failed to refresh token");

      const { tokens: newTokens } = await response.json();
      setTokens((prev) => ({ ...prev, [provider]: newTokens }));
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  };

  const listCloudFiles = async (
    provider: CloudProvider
  ): Promise<CloudFile[]> => {
    const providerTokens = tokens[provider];
    if (!providerTokens) throw new Error("Not authenticated");

    try {
      const response = await fetch(`${CLOUD_SERVER_URL}/cloud/files`, {
        headers: {
          Authorization: `Bearer ${providerTokens.accessToken}`,
          "X-Cloud-Provider": provider,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await refreshToken(provider);
          return listCloudFiles(provider);
        }
        throw new Error("Failed to list files");
      }

      const { files } = await response.json();
      return files;
    } catch (error) {
      console.error("Failed to list files:", error);
      throw error;
    }
  };

  const downloadFile = async (
    provider: CloudProvider,
    fileId: string
  ): Promise<Blob> => {
    const providerTokens = tokens[provider];
    if (!providerTokens) throw new Error("Not authenticated");

    try {
      const response = await fetch(
        `${CLOUD_SERVER_URL}/cloud/download/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${providerTokens.accessToken}`,
            "X-Cloud-Provider": provider,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await refreshToken(provider);
          return downloadFile(provider, fileId);
        }
        throw new Error("Failed to download file");
      }

      return await response.blob();
    } catch (error) {
      console.error("Failed to download file:", error);
      throw error;
    }
  };

  const isAuthenticated = useCallback(
    (provider: CloudProvider): boolean => {
      return !!tokens[provider];
    },
    [tokens]
  );

  const disconnectProvider = async (provider: CloudProvider) => {
    try {
      setTokens((prev) => ({ ...prev, [provider]: null }));

      // Delete from database
      try {
        await invoke("delete_cloud_token", { provider });
      } catch (error) {
        console.error("Failed to delete token from database:", error);
      }

      success(`Disconnected from ${getProviderName(provider)}`);
    } catch (error) {
      console.error("Failed to disconnect:", error);
      showError(`Failed to disconnect from ${getProviderName(provider)}`);
    }
  };

  const isProviderConnected = (provider: CloudProvider): boolean => {
    return !!tokens[provider];
  };

  return {
    syncStatus,
    tokens,
    isLoading,
    tokensLoaded,
    authenticate,
    uploadGameSaves,
    listCloudFiles,
    downloadFile,
    isAuthenticated,
    disconnectProvider,
    getProviderName,
    isProviderConnected,
    refreshTokens: loadTokens,
  };
};
