'use client';
import { walletAuth } from '@/auth/wallet';
import { LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useCallback, useEffect, useState } from 'react';

/**
 * This component is an example of how to authenticate a user
 * We will use Next Auth for this example, but you can use any auth provider
 * Read More: https://docs.world.org/mini-apps/commands/wallet-auth
 */
export const AuthButton = () => {
  const [isPending, setIsPending] = useState(false);
  const { isInstalled } = useMiniKit();

  const onClick = useCallback(async () => {
    if (!isInstalled || isPending) {
      return;
    }
    setIsPending(true);
    try {
      await walletAuth();
    } catch (error) {
      console.error('Wallet authentication button error', error);
      setIsPending(false);
      return;
    }

    setIsPending(false);
  }, [isInstalled, isPending]);

  useEffect(() => {
    const authenticate = async () => {
      if (isInstalled && !isPending) {
        setIsPending(true);
        try {
          await walletAuth();
        } catch (error) {
          console.error('Auto wallet authentication error', error);
        } finally {
          setIsPending(false);
        }
      }
    };

    authenticate();
  }, [isInstalled, isPending]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="card-mafia rounded-3xl p-12 max-w-md w-full text-center animate-fade-in-up">
        <div className="mb-8">
          <div className="text-6xl mb-4">🎭</div>
          <h1 className="text-3xl font-bold text-glow mb-2 text-shadow">Mafia Party</h1>
          <p className="text-neutral-light text-lg">Enter the shadows of intrigue</p>
        </div>

        <LiveFeedback
          label={{
            failed: 'Authentication failed',
            pending: 'Connecting to wallet...',
            success: 'Welcome to the family',
          }}
          state={isPending ? 'pending' : undefined}
        >
          <button
            onClick={onClick}
            disabled={isPending}
            className="btn-mafia w-full py-4 px-8 rounded-2xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Connecting...' : 'Enter the Game'}
          </button>
        </LiveFeedback>

        <div className="mt-8 text-sm text-neutral-light">
          <p>By entering, you accept the code of silence</p>
          <div className="flex justify-center mt-4 space-x-2">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse-glow"></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
