import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';

const achievements = [
  {
    id: 'streak',
    title: 'Winning Streak',
    description: '3 consecutive victories as a villager',
  },
  {
    id: 'detective',
    title: 'Ace Detective',
    description: 'Solved 5 mafia identities with investigations',
  },
];

export default async function Profile() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Profile" />
      </Page.Header>
      <Page.Main className="mb-20 flex flex-col gap-4">
        <section className="rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-4">
            <Marble src={session?.user.profilePictureUrl} className="h-16 w-16" />
            <div>
              <p className="text-lg font-semibold capitalize text-slate-900">
                {session?.user.username ?? 'Detective'}
              </p>
              <p className="text-sm text-slate-500">World ID verified</p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-slate-900 p-3 text-white">
              <dt className="text-xs uppercase text-white/70">Games</dt>
              <dd className="text-lg font-semibold">24</dd>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <dt className="text-xs uppercase text-slate-500">Wins</dt>
              <dd className="text-lg font-semibold text-slate-900">15</dd>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <dt className="text-xs uppercase text-slate-500">Roles</dt>
              <dd className="text-lg font-semibold text-slate-900">Mafia 9x</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
          <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
          <p className="mt-1 text-sm text-slate-600">
            Control how you hear about phase changes and personal events.
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <span className="text-sm text-slate-700">Phase reminders</span>
              <input type="checkbox" defaultChecked className="h-5 w-5" />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <span className="text-sm text-slate-700">Investigation results</span>
              <input type="checkbox" defaultChecked className="h-5 w-5" />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <span className="text-sm text-slate-700">Lobby invitations</span>
              <input type="checkbox" className="h-5 w-5" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
          <h2 className="text-base font-semibold text-slate-900">Achievements</h2>
          <ul className="mt-3 space-y-2">
            {achievements.map((achievement) => (
              <li
                key={achievement.id}
                className="rounded-xl border border-slate-100 p-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {achievement.title}
                </p>
                <p className="text-xs text-slate-500">{achievement.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <button className="rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600">
          Log out
        </button>
      </Page.Main>
    </>
  );
}
