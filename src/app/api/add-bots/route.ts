import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { lobbyManager } from '@/lib/lobbyManager';

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { lobbyId, botCount }: { lobbyId: string; botCount: number } = body;

  if (!lobbyId || typeof botCount !== 'number' || botCount < 1) {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }

  try {
    const lobby = lobbyManager.getLobby(lobbyId);
    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    if (lobby.hostId !== session.user.walletAddress) {
      return NextResponse.json({ error: 'Only the host can add bots' }, { status: 403 });
    }

    if (lobby.status !== 'waiting') {
      return NextResponse.json({ error: 'Cannot add bots after game has started' }, { status: 400 });
    }

    const success = lobbyManager.addBots(lobbyId, botCount);
    if (!success) {
      return NextResponse.json({ error: 'Cannot add more bots (max 1 less than human players)' }, { status: 400 });
    }

    const updatedLobby = lobbyManager.getLobby(lobbyId);
    return NextResponse.json({
      lobby: updatedLobby,
      botsAdded: botCount,
      message: `Successfully added ${botCount} bot(s)!`
    });
  } catch (error) {
    console.error('Error adding bots:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add bots' },
      { status: 400 }
    );
  }
}