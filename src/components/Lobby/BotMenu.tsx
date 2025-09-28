import { Button } from '@worldcoin/mini-apps-ui-kit-react';

interface BotMenuProps {
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  bots: { id: string; name: string }[];
}

export function BotMenu({ onAddBot, onRemoveBot, bots }: BotMenuProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-soft-gold to-vivid-orange p-6 shadow-lg text-black">
      <h3 className="text-lg font-bold mb-4">🤖 Bot Management</h3>
      <p className="mb-4 opacity-80">Add or remove AI players to fill the lobby.</p>
      <Button
        onClick={onAddBot}
        className="w-full bg-electric-blue hover:bg-blue-600 rounded-full py-3 font-semibold shadow-md transition-all transform hover:scale-105 text-white mb-4"
      >
        ➕ Add Bot
      </Button>
      <div className="space-y-3">
        {bots.map(bot => (
          <div key={bot.id} className="flex justify-between items-center bg-white/20 rounded-full p-3">
            <span className="font-medium">{bot.name}</span>
            <Button
              onClick={() => onRemoveBot(bot.id)}
              className="bg-red-500 hover:bg-red-600 rounded-full px-4 py-2 font-semibold shadow-md transition-all transform hover:scale-105 text-white"
              size="sm"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}