type EventFeedItem = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  accent?: 'success' | 'warning' | 'neutral';
};

const accentClasses: Record<NonNullable<EventFeedItem['accent']>, string> = {
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-700',
  neutral: 'bg-slate-100 text-slate-600',
};

export const EventFeed = ({ items }: { items: EventFeedItem[] }) => {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
      <h2 className="text-base font-semibold text-slate-900">Event Log</h2>
      <p className="mt-1 text-xs text-slate-500">
        Resolver updates land here once the round progresses.
      </p>

      <ol className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"
          >
            <span
              className={`mt-1 inline-flex h-6 min-w-[32px] items-center justify-center rounded-full px-2 text-xs font-semibold ${
                item.accent ? accentClasses[item.accent] : accentClasses.neutral
              }`}
            >
              {item.timestamp}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
