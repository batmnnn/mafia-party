import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';

interface BotMenuProps {
  onAddBot: (count: number) => void;
  onRemoveBot: (botId: string) => void;
  bots: { id: string; name: string }[];
  maxBots?: number;
}

export function BotMenu({ onAddBot, onRemoveBot, bots, maxBots = 3 }: BotMenuProps) {
  const [botCount, setBotCount] = useState(1);

  return (
    <div className="rounded-2xl bg-gradient-to-r from-yellow-600 to-amber-700 p-6 shadow-lg text-yellow-100">
      <h3 className="text-lg font-bold mb-4">🤖 Bot Management</h3>
      <p className="mb-4 opacity-80">Add AI players to fill the lobby (max {maxBots}).</p>

      <div className="flex items-center space-x-2 mb-4">
        <label className="text-sm">Count:</label>
        <select
          value={botCount}
          onChange={(e) => setBotCount(parseInt(e.target.value))}
          className="bg-white/20 rounded px-2 py-1 text-sm"
        >
          {Array.from({ length: maxBots }, (_, i) => i + 1).map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      <Button
        onClick={() => onAddBot(botCount)}
        className="w-full bg-electric-blue hover:bg-blue-600 rounded-full py-3 font-semibold shadow-md transition-all transform hover:scale-105 text-white mb-4"
      >
        ➕ Add {botCount} Bot{botCount > 1 ? 's' : ''}
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