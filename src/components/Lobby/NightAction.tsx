import { Button } from '@worldcoin/mini-apps-ui-kit-react';

interface NightActionProps {
  role: string;
  players: { id: string; name: string; status: string }[];
  onAction: (targetId: string) => void;
}

const roleActions: Record<string, { label: string; color: string }> = {
  Godfather: { label: 'Choose Target to Kill', color: 'bg-red-500 hover:bg-red-600' },
  Mafia: { label: 'Choose Target to Kill', color: 'bg-red-500 hover:bg-red-600' },
  Detective: { label: 'Investigate Player', color: 'bg-teal-500 hover:bg-teal-600' },
  Doctor: { label: 'Save Player', color: 'bg-yellow-500 hover:bg-yellow-600' },
  Insomniac: { label: 'Check for Attack', color: 'bg-purple-500 hover:bg-purple-600' },
  Villager: { label: 'No Action', color: 'bg-gray-500 hover:bg-gray-600' },
};

export function NightAction({ role, players, onAction }: NightActionProps) {
  const action = roleActions[role] || roleActions.Villager;

  const handleAction = (targetId: string) => {
    onAction(targetId);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 p-6 shadow-lg text-white">
      <h3 className="text-lg font-bold mb-4">🌙 Night Action - {role}</h3>
      <p className="mb-4 opacity-90">{action.label}</p>
      <div className="space-y-3">
        {players.filter(p => p.status === 'alive').map(player => (
          <Button
            key={player.id}
            onClick={() => handleAction(player.id)}
            className={`w-full rounded-full py-3 font-semibold shadow-md transition-all transform hover:scale-105 ${action.color}`}
          >
            {player.name}
          </Button>
        ))}
      </div>
    </div>
  );
}