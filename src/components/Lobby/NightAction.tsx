import { Button } from '@worldcoin/mini-apps-ui-kit-react';

interface NightActionProps {
  role: string;
  players: { id: string; name: string; status: string }[];
  onAction: (targetId: string) => void;
}

export function NightAction({ role, players, onAction }: NightActionProps) {
  const handleAction = (targetId: string) => {
    onAction(targetId);
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="mb-2">Night Action - {role}</h3>
      <div className="space-y-2">
        {players.filter(p => p.status === 'alive').map(player => (
          <Button
            key={player.id}
            onClick={() => handleAction(player.id)}
            className="w-full"
          >
            {player.name}
          </Button>
        ))}
      </div>
    </div>
  );
}