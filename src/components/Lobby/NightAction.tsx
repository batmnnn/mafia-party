interface Player {
  id: string;
  name: string;
  role: string;
  hp: number;
  isAlive: boolean;
  isUser: boolean;
}

interface NightActionProps {
  role: string;
  players: Player[];
  onAction: (targetId: string) => void;
}

const roleActions: Record<string, { label: string; description: string; bg: string; icon: string }> = {
  Mafia: {
    label: 'Choose Your Target',
    description: 'Select a player to eliminate tonight. Choose wisely - suspicion falls on the village.',
    bg: 'bg-gradient-to-br from-primary via-primary-dark to-accent',
    icon: '🔪'
  },
  Detective: {
    label: 'Investigate a Player',
    description: 'Uncover the truth about one player. Is your target friend or foe?',
    bg: 'bg-gradient-to-br from-secondary via-secondary-dark to-warning',
    icon: '🕵️‍♂️'
  },
  Healer: {
    label: 'Save a Player',
    description: 'Protect one player from elimination tonight. Your healing touch defies death.',
    bg: 'bg-gradient-to-br from-success via-success/80 to-warning',
    icon: '⚕️'
  },
  Commoner: {
    label: 'No Action Required',
    description: 'Rest tonight. The shadows will reveal their secrets to others.',
    bg: 'bg-gradient-to-br from-neutral via-neutral-light to-secondary/60',
    icon: '😴'
  },
};

export function NightAction({ role, players, onAction }: NightActionProps) {
  const action = roleActions[role] || roleActions.Commoner;
  const isActiveRole = role !== 'Commoner';

  const handleAction = (targetId: string) => {
    onAction(targetId);
  };

  return (
    <div className="card-mafia rounded-3xl p-8 animate-fade-in-up shadow-accent/20">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${action.bg} mb-4 shadow-lg`}>
          <span className="text-3xl">{action.icon}</span>
        </div>
        <h3 className="text-2xl font-bold text-glow mb-2 text-shadow">🌙 Night Action</h3>
        <p className="text-lg text-secondary font-semibold">{role}</p>
      </div>

      <div className="glass rounded-2xl p-6 mb-8">
        <p className="text-foreground leading-relaxed">{action.description}</p>
      </div>

      {isActiveRole ? (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground mb-4">Select Target:</h4>
          {players.filter(p => p.isAlive).map(player => (
            <button
              key={player.id}
              onClick={() => handleAction(player.id)}
              className="w-full glass rounded-2xl p-4 border border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:transform hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-neutral to-neutral-light rounded-xl flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-semibold text-foreground group-hover:text-secondary transition-colors">
                      {player.name}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-neutral-light">
                      <span>HP: {player.hp}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        player.isUser ? 'bg-secondary/20 text-secondary' : 'bg-neutral/20 text-neutral-light'
                      }`}>
                        {player.isUser ? 'You' : 'Player'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">😴</div>
          <p className="text-neutral-light text-lg">Rest tonight. The night belongs to others.</p>
        </div>
      )}
    </div>
  );
}