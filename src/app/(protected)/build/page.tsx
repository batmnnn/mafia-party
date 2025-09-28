'use client';

import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { CreateLobbyForm } from '@/components/Lobby/CreateLobbyForm';
import { useState } from 'react';
import { useLobbies } from '@/hooks/useContracts';

export default function Build() {
  const [createdLobby, setCreatedLobby] = useState<{ id: string; address: string } | null>(null);
  const { addLocalLobby } = useLobbies();

  const handleLobbyCreated = (lobbyId: string, lobbyAddress: string, config: {minPlayers: number, maxPlayers: number, isPrivate: boolean}) => {
    setCreatedLobby({ id: lobbyId, address: lobbyAddress });
    // Also save to local storage for persistence
    addLocalLobby(lobbyId, lobbyAddress, `Lobby ${lobbyId}`, config);
  };

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Create Lobby"
        />
      </Page.Header>

      <Page.Main className="space-y-6">
        {createdLobby ? (
          <div className="rounded-2xl bg-emerald-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-emerald-900 mb-2">
              Lobby Created Successfully!
            </h2>
            <p className="text-sm text-emerald-700 mb-4">
              Your lobby is ready for players to join.
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Lobby ID:</span> {createdLobby.id}
              </div>
              <div>
                <span className="font-medium">Address:</span> {createdLobby.address}
              </div>
            </div>
            <button
              onClick={() => setCreatedLobby(null)}
              className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Create Another Lobby
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Configure Your Lobby
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Set up the rules and settings for your Mafia Party game. Players will be able to join once you create the lobby.
            </p>
            <CreateLobbyForm onLobbyCreated={handleLobbyCreated} />
          </div>
        )}

        <div className="rounded-2xl bg-blue-50 p-6">
          <h3 className="text-base font-semibold text-blue-900 mb-2">
            How to Deploy Contracts
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Before creating lobbies, you need to deploy the smart contracts:
          </p>
          <div className="space-y-2 text-sm text-blue-600">
            <div>1. Set your PRIVATE_KEY environment variable</div>
            <div>2. Run: <code className="bg-blue-100 px-2 py-1 rounded">forge script script/DeployMafiaContracts.s.sol --rpc-url $RPC_URL --broadcast</code></div>
            <div>3. Update CONTRACT_ADDRESSES in src/lib/contracts.ts</div>
            <div>4. Restart the frontend application</div>
          </div>
        </div>
      </Page.Main>
    </>
  );
}