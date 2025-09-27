'use client';

import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { ActionPanel } from '@/components/Lobby/ActionPanel';
import { EventFeed } from '@/components/Lobby/EventFeed';
import { PhaseSummary } from '@/components/Lobby/PhaseSummary';
import { PlayerRoster } from '@/components/Lobby/PlayerRoster';
import { RoleReveal } from '@/components/Lobby/RoleReveal';
import { NightAction } from '@/components/Lobby/NightAction';
import { DayVote } from '@/components/Lobby/DayVote';
import { BotMenu } from '@/components/Lobby/BotMenu';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const samplePlayers = [
  { id: '1', name: 'Selina', status: 'alive' as const },
  { id: '2', name: 'Harvey', status: 'alive' as const },
  { id: '3', name: 'Pamela', status: 'protected' as const, note: 'Guarded last night' },
  { id: '4', name: 'Edward', status: 'roleblocked' as const, note: 'Blocked by Falcone' },
  { id: '5', name: 'Oswald', status: 'eliminated' as const, note: 'Voted out Day 2' },
  { id: 'self', name: 'Bruce', status: 'alive' as const, isSelf: true, note: 'Detective role' },
];

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

export default function LobbyDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string>('');
interface SessionType {
  user: {
    username: string;
    profilePictureUrl?: string;
  };
}

  const [session, setSession] = useState<SessionType | null>(null);
  const [gamePhase, setGamePhase] = useState<'lobby' | 'night' | 'day'>('lobby');
  const [players, setPlayers] = useState(samplePlayers);
  const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [roleRevealed, setRoleRevealed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const s = await auth();
      setSession(s);
      const p = await params;
      setSlug(p.slug);
    };
    fetchData();
  }, [params]);

  const handleStartGame = async () => {
    const response = await fetch('/api/start-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyId: slug }),
    });
    const data = await response.json();
    setPlayers(data.players);
    setGamePhase('night');
    // Assign user role
    const userPlayer = data.players.find((p: { id: string; role: string }) => p.id === 'user1');
    if (userPlayer) setUserRole(userPlayer.role);
  };

  const handleAddBot = () => {
    const newBot = { id: `bot${bots.length + 1}`, name: `Bot${bots.length + 1}` };
    setBots([...bots, newBot]);
  };

  const handleRemoveBot = (botId: string) => {
    setBots(bots.filter(b => b.id !== botId));
  };

  const handleNightAction = (targetId: string) => {
    // Simulate night action
    console.log(`${userRole} targets ${targetId}`);
    setGamePhase('day');
  };

  const handleDayVote = (targetId: string) => {
    // Simulate vote
    console.log(`Voted for ${targetId}`);
    // Advance to next round or end
  };

  return (
    <>
            <Page.Header className="p-0 bg-gradient-to-r from-purple-900 to-blue-900">
        <TopBar
          title="Mafia Party"
          startAdornment={
            <Link href="/lobbies" className="text-sm font-semibold text-electric-blue">
              ← Lobbies
            </Link>
          }
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize text-white">
                {/* @ts-expect-error */}
                {session?.user.username}
              </p>
              {/* @ts-expect-error */}
              {session?.user.profilePictureUrl ? (
                <Marble src={session.user.profilePictureUrl} className="w-12 border-2 border-neon-green" />
              ) : null}
            </div>
          }
        />
      </Page.Header>

      <Page.Main className="mb-20 flex flex-col gap-4">
        {gamePhase === 'lobby' && (
          <>
            <BotMenu onAddBot={handleAddBot} onRemoveBot={handleRemoveBot} bots={bots} />
            <button onClick={handleStartGame} className="bg-green-500 text-white px-4 py-2 rounded">
              Start Game
            </button>
          </>
        )}

        {gamePhase !== 'lobby' && (
          <>
            <RoleReveal role={userRole} isRevealed={roleRevealed} onReveal={() => setRoleRevealed(true)} />
            {gamePhase === 'night' && (
              <NightAction role={userRole} players={players} onAction={handleNightAction} />
            )}
            {gamePhase === 'day' && (
              <DayVote players={players} onVote={handleDayVote} />
            )}
          </>
        )}

        <PhaseSummary
          phase={gamePhase === 'lobby' ? 'Lobby' : gamePhase === 'night' ? 'Night' : 'Day'}
          round={1}
          deadlineLabel={gamePhase === 'lobby' ? '' : 'Ends in 11m'}
          host="Oracle"
          info={gamePhase === 'lobby' ? 'Waiting to start' : gamePhase === 'night' ? 'Perform night actions' : 'Discuss and vote'}
        />

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="flex flex-col gap-4">
            <PlayerRoster players={players} />
            <ActionPanel heading="Tonight's toolkit" cards={abilityCards} />
          </div>

          <EventFeed items={eventFeed} />
        </div>
      </Page.Main>
    </>
  );
}
