interface Player {
  id: string;
  name: string;
  role: string;
  hp: number;
  isAlive: boolean;
  isUser: boolean;
}

interface DayVoteProps {
  players: Player[];
  onVote: (targetId: string) => void;
}

export function DayVote({ players, onVote }: DayVoteProps) {
  return (
    <div className="card-mafia rounded-3xl p-8 animate-fade-in-up shadow-secondary/20">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary via-secondary-dark to-warning mb-4 shadow-lg">
          <span className="text-3xl">☀️</span>
        </div>
        <h3 className="text-2xl font-bold text-glow mb-2 text-shadow">☀️ Day Vote</h3>
        <p className="text-lg text-secondary font-semibold">Lynch a Player</p>
      </div>

      <div className="glass rounded-2xl p-6 mb-8">
        <p className="text-foreground leading-relaxed">
          Discuss and vote to eliminate a suspected Mafia member. The village must decide who to sacrifice to the gallows.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-foreground mb-4">Cast Your Vote:</h4>
        {players.filter(p => p.isAlive).map(player => (
          <button
            key={player.id}
            onClick={() => onVote(player.id)}
            className="w-full glass rounded-2xl p-4 border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:transform hover:scale-[1.02] group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🎯</span>
                </div>
                <div className="text-left">
                  <p className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                    Vote for {player.name}
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
                <span className="text-2xl">⚖️</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-neutral-light">
          <span>⚠️</span>
          <span>Choose wisely - the accused cannot defend themselves</span>
        </div>
      </div>
    </div>
  );
}