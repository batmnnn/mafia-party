import { Button } from '@worldcoin/mini-apps-ui-kit-react';

interface BotMenuProps {
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  bots: { id: string; name: string }[];
}

export function BotMenu({ onAddBot, onRemoveBot, bots }: BotMenuProps) {
  return (
    <div className="p-4 border rounded">
      <h3 className="mb-2">Bot Management</h3>
      <Button onClick={onAddBot} className="mb-2">Add Bot</Button>
      <div className="space-y-1">
        {bots.map(bot => (
          <div key={bot.id} className="flex justify-between">
            <span>{bot.name}</span>
            <Button onClick={() => onRemoveBot(bot.id)} size="sm">Remove</Button>
          </div>
        ))}
      </div>
    </div>
  );
}