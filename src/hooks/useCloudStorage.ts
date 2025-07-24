import { useState, useCallback, useEffect } from "react";
import { CloudProvider, CloudSyncStatus } from "../types/cloud";
import { useToast } from "./useToast";
import { openUrl } from "@tauri-apps/plugin-opener";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
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

  // Load tokens from database on mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const providers: CloudProvider[] = [
          "google_drive",
          "onedrive",
          "dropbox",
        ];

        for (const provider of providers) {
          try {
            const token = await invoke<any>("get_cloud_token", { provider });

            console.log("token", token);

            if (token) {
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
            }
          } catch (error) {
            console.error(`Failed to load token for ${provider}:`, error);
          }
        }
      } catch (error) {
        console.error("Failed to load tokens:", error);
      }
    };

    loadTokens();
  }, []);

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

  // Define processAuthCode early using useCallback to avoid dependency issues
  const processAuthCode = useCallback(
    async (provider: CloudProvider, code: string): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${CLOUD_SERVER_URL}/auth/${provider}/callback`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          }
        );

        if (!response.ok) throw new Error("Failed to exchange code for tokens");

        const { tokens: newTokens } = await response.json();
        console.log("Received tokens:", newTokens);
        setTokens((prev) => ({ ...prev, [provider]: newTokens }));

        // Save tokens to database
        try {
          await invoke("save_cloud_token", {
            token: {
              provider,
              access_token: newTokens.accessToken,
              refresh_token: newTokens.refreshToken,
              expires_at: newTokens.expiresIn
                ? Date.now() + newTokens.expiresIn * 1000
                : null,
              token_type: newTokens.tokenType,
            },
          });
        } catch (error) {
          console.error("Failed to save tokens to database:", error);
        }

        const message = `Successfully connected to ${getProviderName(
          provider
        )}`;
        console.log("Showing success message:", message);
        success(message);
      } catch (error) {
        console.error("Failed to process auth code:", error);
        showError(`Failed to connect to ${getProviderName(provider)}`);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [success, showError, getProviderName]
  );

  // Listen for OAuth callback deep links
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupDeepLinkListener = async () => {
      try {
        unsubscribe = await onOpenUrl((urls) => {
          console.log("Received deep link URLs:", urls);

          urls.forEach((url) => {
            try {
              // Parse the deep link URL
              const urlObj = new URL(url);

              // Check if this is an OAuth callback
              if (
                urlObj.protocol === "rogame:" &&
                urlObj.host === "oauth-callback"
              ) {
                const code = urlObj.searchParams.get("code");
                const state = urlObj.searchParams.get("state");

                console.log("OAuth callback received:", { code, state });

                if (code && state) {
                  // Parse state to get provider
                  try {
                    const stateData = JSON.parse(decodeURIComponent(state));
                    const provider = stateData.provider;

                    if (provider) {
                      processAuthCode(provider as CloudProvider, code);
                    }
                  } catch {
                    // If state is not JSON, use it as provider directly
                    processAuthCode(state as CloudProvider, code);
                  }
                }
              }
            } catch (error) {
              console.error("Failed to parse deep link URL:", error);
            }
          });
        });
      } catch (error) {
        console.error("Failed to setup deep link listener:", error);
      }
    };

    setupDeepLinkListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [processAuthCode]);

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

      // Open auth URL in the default browser using Tauri
      await openUrl(authUrl);

      // Show user instructions
      success(
        `Please complete the authentication in your browser. The app will automatically detect when you're done.`
      );

      // The OAuth callback will be handled by the message listener or localStorage polling
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
    authenticate,
    processAuthCode,
    uploadGameSaves,
    listCloudFiles,
    downloadFile,
    isAuthenticated,
    disconnectProvider,
    getProviderName,
    isProviderConnected,
  };
};
