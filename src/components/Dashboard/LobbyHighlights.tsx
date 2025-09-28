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
    <section className="card-mafia rounded-3xl p-8 w-full animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-glow text-shadow">{heading}</h2>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-accent rounded-full animate-pulse-glow"></div>
          <span className="text-sm text-neutral-light uppercase tracking-wider">
            {items.length} active
          </span>
        </div>
      </div>

      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="glass rounded-2xl p-6 border border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:transform hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                    <span className="text-lg">🎭</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-neutral-light">
                      {item.players} • {item.phase}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-3">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-success/20 border border-success/30">
                  <span className="text-xs font-semibold text-success uppercase tracking-wider">
                    {item.status}
                  </span>
                </div>
                {item.ctaLabel && (
                  <Link
                    href={item.href ?? '/lobbies'}
                    className="btn-gold inline-block px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg"
                  >
                    {item.ctaLabel}
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🌙</div>
          <p className="text-neutral-light text-lg mb-2">No active games</p>
          <p className="text-sm text-neutral">The shadows are quiet tonight...</p>
        </div>
      )}
    </section>
  );
};
