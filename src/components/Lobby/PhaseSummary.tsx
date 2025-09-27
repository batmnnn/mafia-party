type PhaseSummaryProps = {
  phase: 'Lobby' | 'Day' | 'Night' | 'Resolution';
  round: number;
  deadlineLabel: string;
  host: string;
  info?: string;
};

const phaseColors: Record<PhaseSummaryProps['phase'], string> = {
  Lobby: 'bg-slate-100 text-slate-600',
  Day: 'bg-amber-100 text-amber-700',
  Night: 'bg-indigo-100 text-indigo-600',
  Resolution: 'bg-emerald-100 text-emerald-600',
};

export const PhaseSummary = ({
  phase,
  round,
  deadlineLabel,
  host,
  info,
}: PhaseSummaryProps) => {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${phaseColors[phase]}`}>
          {phase} phase
        </span>
        <p className="text-xs uppercase tracking-wide text-slate-400">Round {round}</p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Deadline</p>
          <p className="text-lg font-semibold text-slate-900">{deadlineLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Host</p>
          <p className="text-lg font-semibold text-slate-900">{host}</p>
        </div>
      </div>

      {info ? <p className="mt-3 text-sm text-slate-600">{info}</p> : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button className="rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white">
          View phase timeline
        </button>
        <button className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700">
          Share lobby invite
        </button>
      </div>
    </section>
  );
};
