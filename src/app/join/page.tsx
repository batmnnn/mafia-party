'use client';

import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinLobby() {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoinLobby = async () => {
    if (joinCode.length !== 6) {
      setError('Join code must be 6 digits');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/join-lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      // Redirect to the lobby
      router.push(`/lobby/${data.lobby.id}`);
    } catch (err) {
      console.error('Error joining lobby:', err);
      setError('Failed to join lobby');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Join Lobby"
          startAdornment={
            <Link href="/lobbies" className="text-sm font-semibold text-yellow-300 hover:text-yellow-100">
              ← Lobbies
            </Link>
          }
        />
      </Page.Header>

      <Page.Main className="space-y-8">
        <div className="card-mafia rounded-3xl p-8 text-center animate-fade-in-up">
          <div className="text-6xl mb-6">🎭</div>
          <h1 className="text-3xl font-bold text-glow mb-4 text-shadow">Join Mafia Party</h1>
          <p className="text-neutral-light text-lg mb-8 leading-relaxed">
            Enter the 6-digit join code to join your friends in a game of Mafia Party.
          </p>

          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-light mb-2">
                Join Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full text-center text-2xl font-bold bg-black/20 border-2 border-primary/50 rounded-2xl px-6 py-4 text-primary placeholder-primary/50 focus:border-primary focus:outline-none transition-all"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/50 rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              onClick={handleJoinLobby}
              disabled={joinCode.length !== 6 || isJoining}
              className="btn-mafia w-full py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Joining...' : '🎭 Join Game'}
            </button>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/build"
            className="text-secondary hover:text-primary transition-colors text-lg font-semibold"
          >
            Or create your own lobby →
          </Link>
        </div>
      </Page.Main>
    </>
  );
}