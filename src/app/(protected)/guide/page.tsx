import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';

const guideSections = [
  {
    title: 'Game Loop',
    points: [
      'Lobby → Day Phase → Night Phase → Resolution',
      'Phase timers drive auto-advancement; hosts can fast-forward when everyone is ready',
      'Eliminations and investigations feed into the next day discussion',
    ],
  },
  {
    title: 'Player Toolkit',
    points: [
      'Commit then reveal votes to identify suspects during the day',
      'Night roles grant abilities like Kill, Protect, Investigate, or Roleblock',
      'Track personal notifications (investigation reports, protections, blocks) via the dashboard',
    ],
  },
  {
    title: 'Winning the Game',
    points: [
      'Villagers win when all mafia are eliminated',
      'Mafia wins when they control parity with villagers',
      'Advanced modes can swap in neutral roles with unique victory conditions',
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
