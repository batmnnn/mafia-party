interface RoleRevealProps {
  role: string;
  isRevealed: boolean;
  onReveal: () => void;
}

export function RoleReveal({ role, isRevealed, onReveal }: RoleRevealProps) {
  return (
    <div className="p-4 border rounded">
      <h3 className="mb-2">Your Role</h3>
      {isRevealed ? (
        <p>{role}</p>
      ) : (
        <button onClick={onReveal} className="bg-blue-500 text-white px-4 py-2 rounded">
          Reveal Role
        </button>
      )}
    </div>
  );
}