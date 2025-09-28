import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { lobbyManager } from '@/lib/lobbyManager';

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { joinCode }: { joinCode: string } = body;

  if (!joinCode || joinCode.length !== 6) {
    return NextResponse.json({ error: 'Invalid join code' }, { status: 400 });
  }

  try {
    const lobby = lobbyManager.joinLobby(
      joinCode,
      session.user.walletAddress,
      session.user.username || 'Anonymous Player'
    );

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found or full' }, { status: 404 });
    }

    return NextResponse.json({
      lobby,
      joined: true,
      message: 'Successfully joined lobby!'
    });
  } catch (error) {
    console.error('Error joining lobby:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join lobby' },
      { status: 400 }
    );
  }
}