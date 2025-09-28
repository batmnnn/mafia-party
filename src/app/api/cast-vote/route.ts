import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MafiaGameEngine } from '@/lib/gameEngine';

// In a real app, this would be stored in a database or cache
const gameInstance: MafiaGameEngine | null = null;

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!gameInstance) {
    return NextResponse.json({ error: 'No active game' }, { status: 404 });
  }

  const body = await request.json();
  const { targetId }: { targetId: string } = body;

  try {
    const gameState = gameInstance.getGameState();
    const userPlayer = gameInstance.getUserPlayer();

    if (!userPlayer || !userPlayer.isAlive) {
      return NextResponse.json({ error: 'Player not found or dead' }, { status: 400 });
    }

    if (gameState.currentPhase !== 'day') {
      return NextResponse.json({ error: 'Not day phase' }, { status: 400 });
    }

    // Cast user's vote
    gameInstance.castVote(userPlayer.id, targetId);

    // Simulate other players' votes
    const alivePlayers = gameInstance.getAlivePlayers().filter(p => !p.isUser);
    alivePlayers.forEach(player => {
      // Simple AI: vote randomly
      const availableTargets = gameInstance!.getAvailableTargets();
      const randomTarget = availableTargets[Math.floor(Math.random() * availableTargets.length)];
      gameInstance!.castVote(player.id, randomTarget);
    });

    // Process voting results
    gameInstance.processVoting();

    return NextResponse.json({
      success: true,
      gameState: gameInstance.getGameState()
    });

  } catch (error) {
    console.error('Error casting vote:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cast vote' },
      { status: 400 }
    );
  }
}