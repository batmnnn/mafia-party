type Player = {
  id: string;
  name: string;
  role: string;
  hp: number;
  isAlive: boolean;
  isUser: boolean;
};

const statusStyles: Record<string, string> = {
  alive: 'bg-emerald-50 text-emerald-600',
  dead: 'bg-rose-50 text-rose-600',
};

export const PlayerRoster = ({ players }: { players: Player[] }) => {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Players</h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {players.length} joined
        </span>
      </header>

      <ul className="mt-4 space-y-3">
        {players.map((player) => (
          <li
            key={player.id}
            className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {player.name}
                {player.isUser ? (
                  <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                    You
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-slate-500">HP: {player.hp} | Role: {player.role}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[player.isAlive ? 'alive' : 'dead']}`}
            >
              {player.isAlive ? 'Alive' : 'Dead'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
