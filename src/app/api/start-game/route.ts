import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MafiaGameEngine } from '@/lib/gameEngine';
import { lobbyManager } from '@/lib/lobbyManager';

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { lobbyId }: { lobbyId: string } = body;

  if (!lobbyId) {
    return NextResponse.json({ error: 'Lobby ID required' }, { status: 400 });
  }

  try {
    const lobby = lobbyManager.getLobby(lobbyId);
    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    if (lobby.hostId !== session.user.walletAddress) {
      return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 });
    }

    // Start the game
    const success = lobbyManager.startGame(lobbyId, session.user.walletAddress);
    if (!success) {
      return NextResponse.json({ error: 'Cannot start game' }, { status: 400 });
    }

    // Create game engine with all players (including bots)
    const playerCount = lobby.players.length;
    const gameEngine = new MafiaGameEngine(playerCount);

    // Update lobby with game state
    lobbyManager.updateGameState(lobbyId, gameEngine.getGameState());

    return NextResponse.json({
      gameState: gameEngine.getGameState(),
      gameStarted: true,
      message: 'Game started successfully!'
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start game' },
      { status: 400 }
    );
  }
}