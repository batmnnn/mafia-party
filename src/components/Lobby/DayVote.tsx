import { Button } from '@worldcoin/mini-apps-ui-kit-react';

interface DayVoteProps {
  players: { id: string; name: string; status: string }[];
  onVote: (targetId: string) => void;
}

export function DayVote({ players, onVote }: DayVoteProps) {
  return (
    <div className="p-4 border rounded">
      <h3 className="mb-2">Day Vote - Lynch a Player</h3>
      <div className="space-y-2">
        {players.filter(p => p.status === 'alive').map(player => (
          <Button
            key={player.id}
            onClick={() => onVote(player.id)}
            className="w-full"
          >
            Vote for {player.name}
          </Button>
        ))}
      </div>
    </div>
  );
}