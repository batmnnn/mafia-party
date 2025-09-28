import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';

const guideSections = [
  {
    title: '🎭 How to Play Mafia Party',
    points: [
      'Mafia Party is a social deduction game where villagers try to identify and eliminate mafia members before they take over.',
      'Players are assigned secret roles: Villagers (townsfolk), Mafia (criminals), Detective (investigator), Doctor (protector), etc.',
      'The game alternates between Night and Day phases with different actions for each role.',
    ],
  },
  {
    title: '🎯 Game Phases',
    points: [
      '🌙 NIGHT PHASE: Mafia eliminates a player, Detective investigates, Doctor protects, etc.',
      '☀️ DAY PHASE: All players discuss suspicions and vote to lynch one player.',
      '🔄 PHASES REPEAT until Mafia are eliminated OR Mafia outnumber villagers.',
    ],
  },
  {
    title: '👥 Player Roles',
    points: [
      '👤 VILLAGER: No special abilities, votes during day phase.',
      '🔫 MAFIA: Eliminates one player each night, wins when they outnumber villagers.',
      '🕵️ DETECTIVE: Investigates one player each night to learn their alignment.',
      '👩‍⚕️ DOCTOR: Protects one player each night from elimination.',
      '🎭 SPECIAL ROLES: Jester, Serial Killer, etc. (varies by game setup).',
    ],
  },
  {
    title: '🎮 Getting Started',
    points: [
      '1. Create or join a lobby from the Lobbies page.',
      '2. Wait for the host to start the game when enough players join.',
      '3. Receive your secret role assignment.',
      '4. Follow the phase instructions and use your abilities wisely!',
    ],
  },
  {
    title: '💡 Strategy Tips',
    points: [
      'Stay silent during night phases to avoid revealing your role.',
      'Use day discussions to gather information without revealing your role.',
      'Mafia should coordinate secretly while appearing trustworthy.',
      'Detectives should investigate suspicious players without revealing findings immediately.',
    ],
  },
];

export default function Guide() {
  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="How to Play" />
      </Page.Header>
      <Page.Main className="mb-20 flex flex-col gap-4">
        <section className="rounded-2xl bg-indigo-50 p-4 text-slate-900">
          <h2 className="text-base font-semibold">Welcome to Mafia Party</h2>
          <p className="mt-1 text-sm text-slate-600">
            A social deduction game powered by on-chain logic. Learn the basics so you
            can survive the night and unmask the villains.
          </p>
        </section>

        {guideSections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
          >
            <h3 className="text-base font-semibold text-slate-900">
              {section.title}
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ))}
      </Page.Main>
    </>
  );
}
