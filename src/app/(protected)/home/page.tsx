import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { OverviewCards } from '@/components/Dashboard/OverviewCards';
import { LobbyHighlights } from '@/components/Dashboard/LobbyHighlights';
import { PendingActions } from '@/components/Dashboard/PendingActions';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  const overviewStats = [
    {
      id: 'active-games',
      label: 'Active Games',
      value: '2',
      hint: 'Including 1 as a host',
    },
    {
      id: 'pending-actions',
      label: 'Pending Actions',
      value: '3',
      hint: 'Vote, investigation, resolve',
    },
    {
      id: 'win-rate',
      label: 'Win Rate',
      value: '62%',
      hint: 'Across the last 10 matches',
    },
  ];

  const lobbyHighlights = [
    {
      id: 'lobby-1',
      title: 'Metropolis Mafia',
      status: 'Night Phase',
      players: '8 / 10 players',
      phase: 'Round 3 • 5m left',
      ctaLabel: 'Open',
      href: '/lobby/metropolis-mafia',
    },
    {
      id: 'lobby-2',
      title: 'Rogue Gallery',
      status: 'Day Phase',
      players: '6 / 8 players',
      phase: 'Round 2 • 12m left',
      ctaLabel: 'View',
      href: '/lobby/rogue-gallery',
    },
  ];

  const pendingActions = [
    {
      id: 'vote',
      title: 'Reveal your vote',
      subtitle: 'Metropolis Mafia • Day phase',
      dueIn: 'Due in 12m',
      accent: 'warning' as const,
    },
    {
      id: 'investigation',
      title: 'Review investigation result',
      subtitle: 'Night resolution summary available',
      dueIn: 'New',
      accent: 'info' as const,
    },
    {
      id: 'ability',
      title: 'Submit night ability',
      subtitle: 'Rogue Gallery • Night phase',
      dueIn: '5m left',
      accent: 'warning' as const,
    },
  ];

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Home"
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize">
                {session?.user.username}
              </p>
              {session?.user.profilePictureUrl ? (
                <Marble src={session.user.profilePictureUrl} className="w-12" />
              ) : null}
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="mb-20 flex flex-col gap-4">
        <section className="rounded-2xl bg-gradient-to-r from-electric-blue to-neon-green p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-3">🎭 Welcome to Mafia Party!</h2>
          <p className="text-sm opacity-90 mb-4">
            A thrilling social deduction game where you must identify mafia members hiding among the villagers.
            Use strategy, deception, and deduction to win!
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">🌙 Night Phase</h3>
              <p className="opacity-80">Mafia eliminates players, special roles use abilities</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">☀️ Day Phase</h3>
              <p className="opacity-80">Discuss suspicions and vote to lynch players</p>
            </div>
          </div>
          <Link
            href="/guide"
            className="inline-block mt-4 bg-soft-gold hover:bg-yellow-500 rounded-full px-4 py-2 font-semibold shadow-md transition-all transform hover:scale-105 text-black"
          >
            📖 Learn How to Play
          </Link>
        </section>

        <OverviewCards stats={overviewStats} />

        <section className="grid w-full gap-4 lg:grid-cols-[2fr,1fr]">
          <LobbyHighlights items={lobbyHighlights} />
          <div className="flex flex-col gap-4">
            <PendingActions items={pendingActions} />
            <section className="rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <h2 className="text-base font-semibold text-slate-900">Quick Actions</h2>
              <div className="mt-3 grid gap-2">
                <Link
                  href="/build"
                  className="rounded-xl bg-indigo-500 py-3 text-center text-sm font-semibold text-white"
                >
                  Deployment Hub
                </Link>
                <Link
                  href="/lobbies"
                  className="rounded-xl border border-indigo-200 py-3 text-center text-sm font-semibold text-indigo-600"
                >
                  Browse Lobbies
                </Link>
                <Link
                  href="/build#funding"
                  className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700"
                >
                  Funding Guide
                </Link>
              </div>
            </section>
          </div>
        </section>
      </Page.Main>
    </>
  );
}
