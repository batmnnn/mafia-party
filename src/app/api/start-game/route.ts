import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const roles = ['Godfather', 'Mafia', 'Mafia', 'Detective', 'Doctor', 'Insomniac', 'Villager', 'Villager'];

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // const body = await request.json();

  // Simulate role assignment: shuffle roles and assign to players + bots
  const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
  const players = [
    { id: 'user1', name: 'User1', role: shuffledRoles[0] },
    { id: 'bot1', name: 'Bot1', role: shuffledRoles[1] },
    { id: 'bot2', name: 'Bot2', role: shuffledRoles[2] },
    // Add more as needed up to 8
  ];

  // Store in a mock DB or Supabase later
  // For now, return the assigned roles

  return NextResponse.json({ players, gameStarted: true });
}