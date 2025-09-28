type PhaseSummaryProps = {
  phase: 'Lobby' | 'Day' | 'Night' | 'Resolution';
  round: number;
  deadlineLabel: string;
  host: string;
  info?: string;
};

const phaseColors: Record<PhaseSummaryProps['phase'], string> = {
  Lobby: 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700',
  Day: 'bg-gradient-to-r from-neon-green to-electric-blue text-white',
  Night: 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white',
  Resolution: 'bg-gradient-to-r from-vivid-orange to-soft-gold text-white',
};

export const PhaseSummary = ({
  phase,
  round,
  deadlineLabel,
  host,
  info,
}: PhaseSummaryProps) => {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)] border-2 border-transparent hover:border-electric-blue transition-all">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${phaseColors[phase]} shadow-lg`}>
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
