interface RoleRevealProps {
  role: string;
  isRevealed: boolean;
  onReveal: () => void;
}

const roleStyles: Record<string, { bg: string; text: string; icon: string; border: string; glow: string; description: string }> = {
  Mafia: {
    bg: 'bg-gradient-to-br from-primary via-primary-dark to-accent',
    text: 'text-foreground',
    icon: '�',
    border: 'border-accent/50',
    glow: 'shadow-accent/30',
    description: 'Eliminate the villagers with your allies. Strike in the night, conceal in the day.'
  },
  Detective: {
    bg: 'bg-gradient-to-br from-secondary via-secondary-dark to-warning',
    text: 'text-neutral',
    icon: '🕵️‍♂️',
    border: 'border-secondary/50',
    glow: 'shadow-secondary/30',
    description: 'Investigate players each night. Uncover the truth hidden in shadows.'
  },
  Healer: {
    bg: 'bg-gradient-to-br from-success via-success/80 to-warning',
    text: 'text-neutral',
    icon: '⚕️',
    border: 'border-success/50',
    glow: 'shadow-success/30',
    description: 'Save players from elimination. Your healing touch defies death itself.'
  },
  Commoner: {
    bg: 'bg-gradient-to-br from-neutral via-neutral-light to-secondary/60',
    text: 'text-foreground',
    icon: '�',
    border: 'border-secondary/50',
    glow: 'shadow-secondary/20',
    description: 'Work with others to find the Mafia. Trust is your greatest weapon.'
  },
};

export function RoleReveal({ role, isRevealed, onReveal }: RoleRevealProps) {
  const style = roleStyles[role] || roleStyles.Commoner;

  return (
    <div className={`card-mafia rounded-3xl p-8 animate-fade-in-up ${style.glow} shadow-2xl`}>
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${style.bg} mb-6 ${style.glow} shadow-lg`}>
          <span className="text-3xl">{style.icon}</span>
        </div>

        <h3 className="text-2xl font-bold text-glow mb-4 text-shadow">Your Role</h3>

        {isRevealed ? (
          <div className="space-y-6">
            <div className={`inline-block px-6 py-3 rounded-2xl ${style.bg} border-2 ${style.border} ${style.glow}`}>
              <p className={`text-2xl font-bold ${style.text}`}>{role}</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <p className="text-foreground leading-relaxed text-lg">{style.description}</p>
            </div>

            <div className="flex justify-center">
              <div className="text-sm text-neutral-light">
                Remember: In this game of shadows, trust no one.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-8 border-2 border-secondary/30">
              <div className="text-6xl mb-4">❓</div>
              <p className="text-neutral-light text-lg mb-6">
                Your role awaits in the shadows. Are you ready to discover your destiny?
              </p>
              <button
                onClick={onReveal}
                className="btn-gold w-full py-4 px-8 rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-xl"
              >
                Reveal My Role
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}