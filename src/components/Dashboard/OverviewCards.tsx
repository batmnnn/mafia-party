type OverviewStat = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export const OverviewCards = ({ stats }: { stats: OverviewStat[] }) => {
  return (
    <section className="grid w-full gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <article
          key={stat.id}
          className="rounded-2xl bg-slate-900 text-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.25)]"
        >
          <p className="text-sm uppercase tracking-wide text-white/60">
            {stat.label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          {stat.hint ? (
            <p className="mt-1 text-xs text-white/70">{stat.hint}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
};
