type PhaseSummaryProps = {
  phase: 'Lobby' | 'Day' | 'Night' | 'Resolution';
  round: number;
  deadlineLabel: string;
  host: string;
  info?: string;
};

const phaseColors: Record<PhaseSummaryProps['phase'], { bg: string; text: string; icon: string; glow: string }> = {
  Lobby: {
    bg: 'bg-gradient-to-r from-neutral/20 to-neutral/10',
    text: 'text-secondary',
    icon: '🏛️',
    glow: 'shadow-secondary/20'
  },
  Day: {
    bg: 'bg-gradient-to-r from-secondary/20 to-warning/20',
    text: 'text-secondary',
    icon: '☀️',
    glow: 'shadow-secondary/30'
  },
  Night: {
    bg: 'bg-gradient-to-r from-primary/30 to-accent/30',
    text: 'text-accent',
    icon: '🌙',
    glow: 'shadow-accent/30'
  },
  Resolution: {
    bg: 'bg-gradient-to-r from-secondary/30 to-warning/30',
    text: 'text-secondary',
    icon: '⚖️',
    glow: 'shadow-secondary/30'
  },
};

export const PhaseSummary = ({
  phase,
  round,
  deadlineLabel,
  host,
  info,
}: PhaseSummaryProps) => {
  const style = phaseColors[phase];

  return (
    <section className="card-mafia rounded-3xl p-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className={`flex items-center space-x-3 px-4 py-2 rounded-2xl ${style.bg} ${style.glow} shadow-lg`}>
          <span className="text-2xl">{style.icon}</span>
          <span className={`text-sm font-bold uppercase tracking-wider ${style.text}`}>
            {phase} Phase
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-neutral-light">Round</p>
          <p className="text-2xl font-bold text-glow">{round}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="glass rounded-2xl p-6">
          <p className="text-sm uppercase tracking-wider text-neutral-light mb-2">Deadline</p>
          <p className="text-xl font-semibold text-foreground">{deadlineLabel}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <p className="text-sm uppercase tracking-wider text-neutral-light mb-2">Host</p>
          <p className="text-xl font-semibold text-secondary">{host}</p>
        </div>
      </div>

      {info && (
        <div className="glass rounded-2xl p-6 mb-6">
          <p className="text-foreground leading-relaxed">{info}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <button className="btn-mafia py-4 px-6 rounded-2xl text-sm font-semibold transition-all duration-300">
          View Timeline
        </button>
        <button className="btn-gold py-4 px-6 rounded-2xl text-sm font-semibold transition-all duration-300">
          Share Invite
        </button>
      </div>
    </section>
  );
};
