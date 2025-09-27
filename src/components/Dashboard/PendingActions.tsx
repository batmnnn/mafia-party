type PendingAction = {
  id: string;
  title: string;
  subtitle: string;
  dueIn: string;
  accent?: 'warning' | 'info';
};

const accentStyles: Record<NonNullable<PendingAction['accent']>, string> = {
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-sky-100 text-sky-700',
};

export const PendingActions = ({
  items,
}: {
  items: PendingAction[];
}) => {
  return (
    <section className="w-full rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
      <h2 className="text-base font-semibold text-slate-900">Pending Actions</h2>
      <p className="mt-1 text-xs text-slate-500">
        Track what you need to do before the phase timer expires.
      </p>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between rounded-xl border border-slate-100 p-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
            </div>
            <span
              className={`ml-2 rounded-full px-3 py-1 text-xs font-semibold ${
                item.accent ? accentStyles[item.accent] : 'bg-slate-100 text-slate-600'
              }`}
            >
              {item.dueIn}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
