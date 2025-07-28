import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import useGameStore from '../store/gameStore';
import { Game } from '../types/game';
import { useToast } from './useToast';

interface DeepLinkAction {
  type: 'navigate' | 'backup' | 'restore' | 'scan' | 'oauth-callback';
  payload?: string;
  code?: string;
  state?: string;
}

function parseDeepLink(url: string): DeepLinkAction | null {
  try {
    const urlObj = new URL(url);
    
    // Handle different deep link patterns
    // rogame://game/{gameId} - Navigate to game detail
    // rogame://backup/{gameId} - Trigger backup for a game
    // rogame://restore/{gameId} - Trigger restore for a game
    // rogame://scan - Trigger game scan
    // rogame://oauth-callback?code=...&state=... - OAuth callback
    
    // Check if this is an OAuth callback
    if (urlObj.protocol === 'rogame:' && urlObj.host === 'oauth-callback') {
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      
      if (code) {
        return { type: 'oauth-callback', code, state: state || undefined };
      }
    }
    
    const path = urlObj.pathname.replace(/^\/+/, ''); // Remove leading slashes
    const parts = path.split('/');
    
    switch (parts[0]) {
      case 'game':
        if (parts[1]) {
          return { type: 'navigate', payload: parts[1] };
        }
        break;
      case 'backup':
        if (parts[1]) {
          return { type: 'backup', payload: parts[1] };
        }
        break;
      case 'restore':
        if (parts[1]) {
          return { type: 'restore', payload: parts[1] };
        }
        break;
      case 'scan':
        return { type: 'scan' };
      default:
        console.warn('Unknown deep link pattern:', url);
    }
  } catch (error) {
    console.error('Failed to parse deep link:', error);
  }
  
  return null;
}

interface BackupResponse {
  save_file: SaveFile;
}

interface SaveFile {
  path: string;
  created_at: string;
  size: number;
}

// Cloud provider type
type CloudProvider = 'google_drive' | 'onedrive' | 'dropbox';

const CLOUD_SERVER_URL = import.meta.env.VITE_CLOUD_SERVER_URL || 'http://localhost:3001';

export function useDeepLink() {
  const navigate = useNavigate();
  const { games, setGames, setFoundGames } = useGameStore();
  const { success, error: showError } = useToast();
  
  useEffect(() => {
    let unlistenDeepLink: (() => void) | undefined;
    let unlistenSingleInstance: (() => void) | undefined;
    
    const handleDeepLink = async (url: string) => {
      console.log('Handling deep link:', url);
      const action = parseDeepLink(url);
      
      if (!action) return;
      
      try {
        switch (action.type) {
          case 'navigate':
            if (action.payload) {
              // Game IDs are strings, not numbers
              navigate(`/game/${action.payload}`);
            }
            break;
            
          case 'backup':
            if (action.payload) {
              const gameId = action.payload; // Game IDs are strings
              const game = games.find((g: Game) => g.id === gameId);
              if (game) {
                try {
                  const response = await invoke<BackupResponse>('backup_save', {
                    game_id: game.id,
                  });
                  console.log(`Backup completed for game ${gameId}:`, response);
                } catch (error) {
                  console.error(`Failed to backup game ${gameId}:`, error);
                }
              } else {
                console.warn(`Game with ID ${gameId} not found`);
              }
            }
            break;
            
          case 'restore':
            if (action.payload) {
              // Game IDs are strings, navigate to game detail page where restore can be triggered
              navigate(`/game/${action.payload}`);
            }
            break;
            
          case 'scan':
            try {
              const result = await invoke<Record<string, Game>>('scan_games');
              const foundGamesArray = Object.values(result);
              setFoundGames(foundGamesArray);
              console.log('Game scan completed, found', foundGamesArray.length, 'games');
              // Navigate to the games page to show results
              navigate('/games');
            } catch (error) {
              console.error('Failed to scan games:', error);
            }
            break;
            
          case 'oauth-callback':
            if (action.code && action.state) {
              console.log('OAuth callback received:', { code: action.code, state: action.state });
              
              try {
                // Parse state to get provider
                let provider: CloudProvider | null = null;
                
                try {
                  const stateData = JSON.parse(decodeURIComponent(action.state));
                  provider = stateData.provider;
                } catch {
                  // If state is not JSON, use it as provider directly
                  provider = action.state as CloudProvider;
                }
                
                if (provider) {
                  // Exchange code for tokens
                  const response = await fetch(
                    `${CLOUD_SERVER_URL}/auth/${provider}/callback`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: action.code }),
                    }
                  );
                  
                  if (!response.ok) throw new Error('Failed to exchange code for tokens');
                  
                  const { tokens } = await response.json();
                  console.log('Received tokens:', tokens);
                  
                  // Save tokens to database
                  await invoke('save_cloud_token', {
                    token: {
                      provider,
                      access_token: tokens.accessToken,
                      refresh_token: tokens.refreshToken,
                      expires_at: tokens.expiresIn
                        ? Date.now() + tokens.expiresIn * 1000
                        : null,
                      token_type: tokens.tokenType,
                    },
                  });
                  
                  // Get provider display name
                  let providerName = 'Cloud Storage';
                  if (provider === 'google_drive') {
                    providerName = 'Google Drive';
                  } else if (provider === 'onedrive') {
                    providerName = 'OneDrive';
                  } else if (provider === 'dropbox') {
                    providerName = 'Dropbox';
                  }
                  success(`Successfully connected to ${providerName}`);
                  
                  // Emit a custom event to notify other components
                  window.dispatchEvent(new CustomEvent('cloud-token-updated', { detail: { provider } }));
                  
                  // Navigate back to the previous page or settings
                  const from = window.history.state?.from;
                  if (from && from.includes('/game/')) {
                    navigate(from);
                  } else {
                    navigate('/settings');
                  }
                }
              } catch (error) {
                console.error('Failed to process OAuth callback:', error);
                showError('Failed to connect cloud storage');
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error handling deep link action:', error);
      }
    };
    
    const setupListeners = async () => {
      try {
        // Listen for deep links via the plugin
        unlistenDeepLink = await onOpenUrl((urls) => {
          console.log('Deep link received via plugin:', urls);
          urls.forEach(url => handleDeepLink(url));
        });
        
        // Listen for deep links via single instance (desktop)
        unlistenSingleInstance = await listen<string>('deep-link', (event) => {
          console.log('Deep link received via single instance:', event.payload);
          handleDeepLink(event.payload);
        });
      } catch (error) {
        console.error('Failed to setup deep link listeners:', error);
      }
    };
    
    setupListeners();
    
    // Cleanup
    return () => {
      unlistenDeepLink?.();
      unlistenSingleInstance?.();
    };
  }, [navigate, games, setGames, setFoundGames, success, showError]);
}