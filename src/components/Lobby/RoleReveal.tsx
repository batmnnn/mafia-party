interface RoleRevealProps {
  role: string;
  isRevealed: boolean;
  onReveal: () => void;
}

const roleStyles: Record<string, { bg: string; text: string; icon: string }> = {
  Godfather: { bg: 'bg-gradient-to-r from-red-500 to-red-700', text: 'text-white', icon: '👑' },
  Mafia: { bg: 'bg-gradient-to-r from-red-400 to-red-600', text: 'text-white', icon: '🔪' },
  Detective: { bg: 'bg-gradient-to-r from-teal-400 to-teal-600', text: 'text-white', icon: '🕵️‍♂️' },
  Doctor: { bg: 'bg-gradient-to-r from-soft-gold to-yellow-500', text: 'text-black', icon: '⚕️' },
  Insomniac: { bg: 'bg-gradient-to-r from-purple-400 to-purple-600', text: 'text-white', icon: '😴' },
  Villager: { bg: 'bg-gradient-to-r from-green-400 to-green-600', text: 'text-white', icon: '👤' },
};

export function RoleReveal({ role, isRevealed, onReveal }: RoleRevealProps) {
  const style = roleStyles[role] || { bg: 'bg-gray-500', text: 'text-white', icon: '❓' };

  return (
    <div className={`rounded-2xl p-6 shadow-lg ${style.bg} ${style.text} transition-all transform hover:scale-105`}>
      <div className="text-center">
        <div className="text-4xl mb-2">{style.icon}</div>
        <h3 className="text-lg font-bold mb-2">Your Role</h3>
        {isRevealed ? (
          <div>
            <p className="text-xl font-semibold">{role}</p>
            <p className="text-sm opacity-90 mt-2">
              {role === 'Godfather' && 'Lead the Mafia to victory!'}
              {role === 'Mafia' && 'Eliminate the villagers with your allies.'}
              {role === 'Detective' && 'Investigate players each night.'}
              {role === 'Doctor' && 'Save players from elimination.'}
              {role === 'Insomniac' && 'Check if Mafia targeted you.'}
              {role === 'Villager' && 'Work with others to find the Mafia.'}
            </p>
          </div>
        ) : (
          <button
            onClick={onReveal}
            className="bg-white text-black px-6 py-2 rounded-full font-semibold shadow-md hover:bg-gray-100 transition-colors"
          >
            Reveal Role
          </button>
        )}
      </div>
    </div>
  );
}