import React, { useState } from 'react';
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';
import { CloudProvider } from '../types/cloud';
import { useTranslation } from 'react-i18next';

interface CloudSyncButtonProps {
  gameId: string;
  gameName: string;
  saveFiles: File[];
  className?: string;
}

const CloudSyncButton: React.FC<CloudSyncButtonProps> = ({
  gameId,
  gameName,
  saveFiles,
  className = '',
}) => {
  const { t } = useTranslation();
  const { syncStatus, uploadGameSaves, isProviderConnected, authenticate } = useCloudStorage();
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>('google_drive');
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  const providers: { id: CloudProvider; name: string; icon: string }[] = [
    { id: 'google_drive', name: 'Google Drive', icon: '🔵' },
    { id: 'onedrive', name: 'OneDrive', icon: '🟦' },
    { id: 'dropbox', name: 'Dropbox', icon: '💧' },
  ];

  const handleSync = async () => {
    if (!isProviderConnected(selectedProvider)) {
      try {
        await authenticate(selectedProvider);
      } catch (error) {
        console.error('Authentication failed:', error);
        return;
      }
    }

    try {
      await uploadGameSaves(selectedProvider, gameId, gameName, saveFiles);
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  };

  const getSyncStatusIcon = () => {
    if (syncStatus.status === 'syncing') {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }

    if (syncStatus.status === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    }

    if (syncStatus.lastSync) {
      return <Check className="w-4 h-4 text-green-400" />;
    }

    if (!isProviderConnected(selectedProvider)) {
      return <CloudOff className="w-4 h-4" />;
    }

    return <Cloud className="w-4 h-4" />;
  };

  const getSyncStatusText = () => {
    if (syncStatus.status === 'syncing') {
      return t('cloudSync.syncing');
    }

    if (syncStatus.status === 'error') {
      return t('cloudSync.error');
    }

    if (syncStatus.lastSync) {
      return t('cloudSync.synced');
    }

    if (!isProviderConnected(selectedProvider)) {
      return t('cloudSync.notConnected');
    }

    return t('cloudSync.notSynced');
  };

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('cloudSync.justNow');
    if (diffMins < 60) return t('cloudSync.minutesAgo', { count: diffMins });
    if (diffMins < 1440) return t('cloudSync.hoursAgo', { count: Math.floor(diffMins / 60) });
    return t('cloudSync.daysAgo', { count: Math.floor(diffMins / 1440) });
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowProviderMenu(!showProviderMenu)}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Select cloud provider"
        >
          {providers.find(p => p.id === selectedProvider)?.icon}
        </button>
        
        <button
          onClick={handleSync}
          disabled={syncStatus.status === 'syncing'}
          className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={getSyncStatusText()}
        >
          {getSyncStatusIcon()}
        </button>
        
        {syncStatus.lastSync && (
          <span className="text-xs text-gray-500">
            {formatLastSync(syncStatus.lastSync)}
          </span>
        )}
      </div>

      {showProviderMenu && (
        <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-md shadow-lg z-10 min-w-[150px]">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => {
                setSelectedProvider(provider.id);
                setShowProviderMenu(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center space-x-2 ${
                selectedProvider === provider.id ? 'bg-gray-700' : ''
              }`}
            >
              <span>{provider.icon}</span>
              <span className="text-sm">{provider.name}</span>
              {isProviderConnected(provider.id) && (
                <Check className="w-3 h-3 text-green-400 ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CloudSyncButton;