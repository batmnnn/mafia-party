import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { lobbyManager } from '@/lib/lobbyManager';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lobbyId = searchParams.get('lobbyId');

  if (!lobbyId) {
    return NextResponse.json({ error: 'Lobby ID required' }, { status: 400 });
  }

  try {
    const lobby = lobbyManager.getLobby(lobbyId);
    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Check if user is in the lobby
    if (!lobbyManager.isPlayerInLobby(lobbyId, session.user.walletAddress)) {
      return NextResponse.json({ error: 'You are not in this lobby' }, { status: 403 });
    }

    // Add remaining time for current phase
    const remainingTime = lobbyManager.getRemainingTime(lobbyId);

    return NextResponse.json({
      ...lobby,
      remainingTime,
    });
  } catch (error) {
    console.error('Error getting lobby:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get lobby' },
      { status: 400 }
    );
  }
}