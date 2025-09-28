import { Button } from '@worldcoin/mini-apps-ui-kit-react';

interface DayVoteProps {
  players: { id: string; name: string; status: string }[];
  onVote: (targetId: string) => void;
}

export function DayVote({ players, onVote }: DayVoteProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-neon-green to-electric-blue p-6 shadow-lg text-white">
      <h3 className="text-lg font-bold mb-4">☀️ Day Vote - Lynch a Player</h3>
      <p className="mb-4 opacity-90">Discuss and vote to eliminate a suspected Mafia member.</p>
      <div className="space-y-3">
        {players.filter(p => p.status === 'alive').map(player => (
          <Button
            key={player.id}
            onClick={() => onVote(player.id)}
            className="w-full bg-vivid-orange hover:bg-orange-600 rounded-full py-3 font-semibold shadow-md transition-all transform hover:scale-105 text-black"
          >
            Vote for {player.name}
          </Button>
        ))}
      </div>
    </div>
  );
}