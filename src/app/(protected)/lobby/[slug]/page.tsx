'use client';

import { GameState } from '@/lib/gameEngine';
import { Page } from '@/components/PageLayout';
import { ActionPanel } from '@/components/Lobby/ActionPanel';
import { EventFeed } from '@/components/Lobby/EventFeed';
import { PhaseSummary } from '@/components/Lobby/PhaseSummary';
import { PlayerRoster } from '@/components/Lobby/PlayerRoster';
import { RoleReveal } from '@/components/Lobby/RoleReveal';
import { NightAction } from '@/components/Lobby/NightAction';
import { DayVote } from '@/components/Lobby/DayVote';
import { BotMenu } from '@/components/Lobby/BotMenu';
import { ChatPanel } from '@/components/Lobby/ChatPanel';
import { Marble, TopBar, Button } from '@worldcoin/mini-apps-ui-kit-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { LobbyState } from '@/lib/lobbyManager';

const abilityCards = [
  {
    id: 'vote',
    title: 'Reveal vote',
    description: 'Disclose your encrypted vote to finalize the day tally.',
    actionLabel: 'Reveal vote',
    hint: 'Day phase',
  },
  {
    id: 'investigate',
    title: 'Use investigation',
    description: 'Select a target to reveal their alignment at night.',
    actionLabel: 'Select target',
  },
  {
    id: 'roleblock',
    title: 'Roleblock attempt queued',
    description: 'You already blocked Edward for this night cycle.',
    actionLabel: 'Submitted',
    disabled: true,
    hint: 'Night action',
  },
];

const eventFeed = [
  {
    id: 'e1',
    title: 'Night 3 resolved',
    detail: 'Oswald was eliminated. Pamela was protected by Gordon.',
    timestamp: '2m ago',
    accent: 'warning' as const,
  },
  {
    id: 'e2',
    title: 'Investigation result',
    detail: 'Edward appears aligned with the mafia.',
    timestamp: '10m ago',
    accent: 'success' as const,
  },
  {
    id: 'e3',
    title: 'Phase advanced',
    detail: 'Host moved the lobby into Day phase (Round 4).',
    timestamp: '15m ago',
  },
];

export default function LobbyDetail() {
  const { data: session } = useSession();
  const params = useParams();
  const lobbyId = params.slug as string;

  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'Oracle',
      content: 'Welcome to Mafia Party! Discuss strategy and vote wisely.',
      isBot: true,
      timestamp: new Date(),
    },
  ]);

  // Fetch lobby data on mount
  useEffect(() => {
    const fetchLobby = async () => {
      if (!lobbyId || !session) return;

      try {
        const response = await fetch(`/api/get-lobby?lobbyId=${lobbyId}`);
        const data = await response.json();

        if (data.error) {
          console.error('Error fetching lobby:', data.error);
          return;
        }

        setLobby(data);
        setGameState(data.gameState);
        setRemainingTime(data.remainingTime);

        // Set user role if game has started
        if (data.gameState?.players) {
          const userPlayer = data.gameState.players.find((p: { isUser: boolean }) => p.isUser);
          if (userPlayer) setUserRole(userPlayer.role);
        }
      } catch (error) {
        console.error('Error fetching lobby:', error);
      }
    };

    fetchLobby();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchLobby, 5000);
    return () => clearInterval(interval);
  }, [lobbyId, session]);

  const handleStartGame = async () => {
    if (!lobbyId) return;

    const response = await fetch('/api/start-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyId }),
    });
    const data = await response.json();

    if (data.error) {
      console.error('Error starting game:', data.error);
      return;
    }

    setGameState(data.gameState);
    setLobby(prev => prev ? { ...prev, status: 'in-progress', gameState: data.gameState } : null);

    // Set user role
    const userPlayer = data.gameState.players.find((p: { isUser: boolean }) => p.isUser);
    if (userPlayer) setUserRole(userPlayer.role);
  };

  const handleAddBot = async (botCount: number) => {
    if (!lobbyId) return;

    const response = await fetch('/api/add-bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyId, botCount }),
    });
    const data = await response.json();

    if (data.error) {
      console.error('Error adding bots:', data.error);
      return;
    }

    setLobby(data.lobby);
  };

  const handleRemoveBot = (botId: string) => {
    // TODO: Implement bot removal
    console.log('Remove bot:', botId);
  };

  const handleNightAction = async (targetId: string, actionType: string) => {
    if (!gameState) return;

    const response = await fetch('/api/night-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionType, targetId }),
    });
    const data = await response.json();
    if (data.success) {
      setGameState(data.gameState);
    }
  };

  const handleDayVote = async (targetId: string) => {
    if (!gameState) return;

    const response = await fetch('/api/cast-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    });
    const data = await response.json();
    if (data.success) {
      setGameState(data.gameState);
    }
  };

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: session?.user.username || 'You',
      content,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <>
            <Page.Header className="p-0 bg-gradient-to-r from-amber-900 to-yellow-800">
        <TopBar
          title="Mafia Party"
          startAdornment={
            <Link href="/lobbies" className="text-sm font-semibold text-yellow-300 hover:text-yellow-100">
              ← Lobbies
            </Link>
          }
          endAdornment={
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setChatOpen(true)}
                className="bg-yellow-600 hover:bg-yellow-500 rounded-full px-3 py-1 font-semibold shadow-md transition-all transform hover:scale-105 text-amber-900 text-sm"
              >
                💬 Chat
              </Button>
              <p className="text-sm font-semibold capitalize text-amber-100">
                {session?.user.username}
              </p>
              {session?.user.profilePictureUrl ? (
                <Marble src={session.user.profilePictureUrl} className="w-12 border-2 border-neon-green" />
              ) : null}
            </div>
          }
        />
      </Page.Header>

      <Page.Main className="mb-20 flex flex-col gap-4">
        {!gameState ? (
          <>
            {/* Lobby Info */}
            {lobby && (
              <div className="card-mafia rounded-3xl p-6 text-center animate-fade-in-up">
                <h2 className="text-2xl font-bold text-glow mb-4">🎭 Lobby #{lobby.id.slice(-4)}</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/20 rounded-xl p-4">
                    <p className="text-sm text-neutral-light">Join Code</p>
                    <p className="text-3xl font-bold text-primary">{lobby.joinCode}</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4">
                    <p className="text-sm text-neutral-light">Players</p>
                    <p className="text-2xl font-bold text-secondary">
                      {lobby.players.filter(p => !p.isBot).length}/{lobby.config.maxPlayers}
                    </p>
                  </div>
                </div>
                <p className="text-neutral-light text-sm">
                  Share the join code with friends to let them join your game!
                </p>
              </div>
            )}

            <BotMenu
              onAddBot={handleAddBot}
              onRemoveBot={handleRemoveBot}
              bots={lobby?.players.filter(p => p.isBot).map(p => ({ id: p.id, name: p.name })) || []}
              maxBots={lobby ? Math.max(0, lobby.players.filter(p => !p.isBot).length - 1) : 3}
            />

            {lobby && lobby.hostId === session?.user.walletAddress && (
              <button
                onClick={handleStartGame}
                disabled={lobby.players.filter(p => !p.isBot).length < lobby.config.minPlayers}
                className="btn-mafia w-full py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎮 Start Game ({lobby.players.filter(p => !p.isBot).length}/{lobby.config.minPlayers} players needed)
              </button>
            )}
          </>
        ) : (
          <>
            <RoleReveal role={userRole} isRevealed={roleRevealed} onReveal={() => setRoleRevealed(true)} />

            {/* Phase Timer */}
            {remainingTime > 0 && (
              <div className="card-mafia rounded-2xl p-4 text-center animate-pulse-glow">
                <div className="text-2xl font-bold text-primary mb-1">
                  {Math.ceil(remainingTime / 1000)}s
                </div>
                <div className="text-sm text-neutral-light capitalize">
                  {gameState.currentPhase} Phase
                </div>
              </div>
            )}

            {gameState.currentPhase === 'night' && (
              <NightAction role={userRole} players={gameState.players} onAction={(targetId) => {
                const actionType = userRole === 'Mafia' ? 'mafia_kill' :
                                 userRole === 'Detective' ? 'detective_test' :
                                 userRole === 'Healer' ? 'healer_heal' : '';
                handleNightAction(targetId, actionType);
              }} />
            )}
            {gameState.currentPhase === 'day' && (
              <DayVote players={gameState.players} onVote={handleDayVote} />
            )}
          </>
        )}

        {gameState && (
          <PhaseSummary
            phase={gameState.currentPhase === 'night' ? 'Night' : gameState.currentPhase === 'day' ? 'Day' : 'Lobby'}
            round={gameState.round}
            deadlineLabel={gameState ? 'Ends in 11m' : ''}
            host="Oracle"
            info={gameState.currentPhase === 'night' ? 'Perform night actions' : gameState.currentPhase === 'day' ? 'Discuss and vote' : 'Waiting to start'}
          />
        )}

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="flex flex-col gap-4">
            {gameState && <PlayerRoster players={gameState.players} />}
            <ActionPanel heading="Tonight's toolkit" cards={abilityCards} />
          </div>

          <EventFeed items={eventFeed} />
        </div>
      </Page.Main>

      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUser={session?.user.username || 'You'}
      />
    </>
  );
}
