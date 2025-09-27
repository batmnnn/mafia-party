import Link from 'next/link';

type LobbyHighlight = {
  id: string;
  title: string;
  status: string;
  players: string;
  phase: string;
  ctaLabel?: string;
  href?: string;
};

export const LobbyHighlights = ({
  items,
  heading = 'Active Lobbies',
}: {
  items: LobbyHighlight[];
  heading?: string;
}) => {
  return (
    <section className="w-full rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {items.length} lobbies
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">
                {item.players} • {item.phase}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase text-emerald-500">
                {item.status}
              </p>
              {item.ctaLabel ? (
                <Link
                  href={item.href ?? '/lobbies'}
                  className="mt-1 inline-flex text-xs font-semibold text-indigo-500"
                >
                  {item.ctaLabel}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
