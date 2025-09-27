'use client';

import { useState } from 'react';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

interface LobbyConfig {
  minPlayers: number;
  maxPlayers: number;
  isPrivate: boolean;
  joinTimeoutSeconds: number;
}

interface CreateLobbyProps {
  onLobbyCreated?: (lobbyId: string, lobbyAddress: string) => void;
}

export function CreateLobbyForm({ onLobbyCreated }: CreateLobbyProps) {
  const [config, setConfig] = useState<LobbyConfig>({
    minPlayers: 4,
    maxPlayers: 8,
    isPrivate: false,
    joinTimeoutSeconds: 300, // 5 minutes
  });
  
  const [joinCode, setJoinCode] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateLobby = async () => {
    if (!CONTRACT_ADDRESSES.LobbyRegistry || CONTRACT_ADDRESSES.LobbyRegistry === '0x0000000000000000000000000000000000000000') {
      setError('Contracts not deployed. Please deploy contracts first.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Mock successful creation
      onLobbyCreated?.('1', '0x1234567890123456789012345678901234567890');
    } catch (err) {
      console.error('Error creating lobby:', err);
      setError(err instanceof Error ? err.message : 'Failed to create lobby');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Min Players
          </label>
          <input
            type="number"
            min="2"
            max="20"
            value={config.minPlayers}
            onChange={(e) => setConfig(prev => ({ ...prev, minPlayers: parseInt(e.target.value) }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Max Players
          </label>
          <input
            type="number"
            min="2"
            max="20"
            value={config.maxPlayers}
            onChange={(e) => setConfig(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Join Timeout (seconds)
        </label>
        <input
          type="number"
          min="60"
          max="3600"
          value={config.joinTimeoutSeconds}
          onChange={(e) => setConfig(prev => ({ ...prev, joinTimeoutSeconds: parseInt(e.target.value) }))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPrivate"
          checked={config.isPrivate}
          onChange={(e) => setConfig(prev => ({ ...prev, isPrivate: e.target.checked }))}
          className="rounded border-slate-300"
        />
        <label htmlFor="isPrivate" className="text-sm font-medium text-slate-700">
          Private Lobby (requires join code)
        </label>
      </div>

      {config.isPrivate && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Join Code
          </label>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter join code"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Lobby Name (optional)
        </label>
        <input
          type="text"
          value={metadataURI}
          onChange={(e) => setMetadataURI(e.target.value)}
          placeholder="Enter lobby name"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <LiveFeedback
        label={{
          failed: 'Failed to create lobby',
          pending: 'Creating lobby...',
          success: 'Lobby created!',
        }}
        state={isCreating ? 'pending' : undefined}
      >
        <Button
          onClick={handleCreateLobby}
          disabled={isCreating || config.minPlayers >= config.maxPlayers}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Create Lobby
        </Button>
      </LiveFeedback>
    </div>
  );
}
