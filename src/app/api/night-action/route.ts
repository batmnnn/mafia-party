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
  const { action, targetId }: { action: string; targetId: string } = body;

  try {
    const gameState = gameInstance.getGameState();
    const userPlayer = gameInstance.getUserPlayer();

    if (!userPlayer || !userPlayer.isAlive) {
      return NextResponse.json({ error: 'Player not found or dead' }, { status: 400 });
    }

    if (gameState.currentPhase !== 'night') {
      return NextResponse.json({ error: 'Not night phase' }, { status: 400 });
    }

    switch (action) {
      case 'mafia_kill':
        if (userPlayer.role !== 'Mafia') {
          return NextResponse.json({ error: 'Not a mafia' }, { status: 403 });
        }
        gameInstance.setMafiaTarget(targetId);
        break;

      case 'detective_test':
        if (userPlayer.role !== 'Detective') {
          return NextResponse.json({ error: 'Not a detective' }, { status: 403 });
        }
        gameInstance.setDetectiveTarget(targetId);
        break;

      case 'healer_heal':
        if (userPlayer.role !== 'Healer') {
          return NextResponse.json({ error: 'Not a healer' }, { status: 403 });
        }
        gameInstance.setHealerTarget(targetId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Check if all night actions are complete
    const nightActions = gameState.nightActions;
    const hasMafiaAction = nightActions.mafiaTarget || gameState.players.filter(p => p.role === 'Mafia' && p.isAlive).length === 0;
    const hasDetectiveAction = nightActions.detectiveTarget || gameState.players.filter(p => p.role === 'Detective' && p.isAlive).length === 0;
    const hasHealerAction = nightActions.healerTarget || gameState.players.filter(p => p.role === 'Healer' && p.isAlive).length === 0;

    if (hasMafiaAction && hasDetectiveAction && hasHealerAction) {
      // Process night actions and simulate AI actions
      gameInstance.processNightActions();
    }

    return NextResponse.json({
      success: true,
      gameState: gameInstance.getGameState()
    });

  } catch (error) {
    console.error('Error performing night action:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform action' },
      { status: 400 }
    );
  }
}