'use client';

import { LobbyHighlights } from '@/components/Dashboard/LobbyHighlights';
import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { useLobbies, LobbyRecord } from '@/hooks/useContracts';
import { useMemo } from 'react';

interface LobbyData {
  id: string;
  title: string;
  status: string;
  players: string;
  phase: string;
  ctaLabel: string;
  href: string;
}

export default function Lobbies() {
  const { lobbies, loading, error } = useLobbies();

  const { openLobbies, inProgress } = useMemo(() => {
    const open: LobbyData[] = [];
    const progress: LobbyData[] = [];

    lobbies.forEach((lobby: LobbyRecord, index: number) => {
      const lobbyData: LobbyData = {
        id: `lobby-${index}`,
        title: lobby.metadataURI || `Lobby ${index + 1}`,
        status: 'Open',
        players: `${lobby.config.minPlayers} / ${lobby.config.maxPlayers} players`,
        phase: lobby.config.isPrivate ? 'Private Lobby' : 'Public Lobby',
        ctaLabel: 'Join',
        href: `/lobby/${lobby.lobbyAddress}`,
      };

      // For now, treat all as open lobbies
      // In the future, check phase state to determine if in progress
      open.push(lobbyData);
    });

    return { openLobbies: open, inProgress: progress };
  }, [lobbies]);

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Lobbies"
        />
      </Page.Header>

      <Page.Main className="space-y-6">
        {loading && (
          <div className="text-center py-8">
            <div className="text-slate-500">Loading lobbies...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-500">Error: {error}</div>
            <div className="text-sm text-slate-500 mt-2">
              Make sure contracts are deployed and addresses are configured
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {openLobbies.length > 0 && (
              <LobbyHighlights
                items={openLobbies}
                heading="Open Lobbies"
              />
            )}

            {inProgress.length > 0 && (
              <LobbyHighlights
                items={inProgress}
                heading="Games in Progress"
              />
            )}

            {openLobbies.length === 0 && inProgress.length === 0 && (
              <div className="text-center py-8">
                <div className="text-slate-500">No lobbies found</div>
                <div className="text-sm text-slate-400 mt-2">
                  Create a new lobby to get started
                </div>
              </div>
            )}
          </>
        )}
      </Page.Main>
    </>
  );
}