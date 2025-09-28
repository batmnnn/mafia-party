import { GameState } from './gameEngine';

export interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  joinedAt: Date;
}

export interface LobbyState {
  id: string;
  joinCode: string;
  config: {
    minPlayers: number;
    maxPlayers: number;
    isPrivate: boolean;
  };
  players: LobbyPlayer[];
  hostId: string;
  status: 'waiting' | 'starting' | 'in-progress' | 'finished';
  gameState?: GameState;
  phaseStartTime?: Date;
  phaseEndTime?: Date;
  createdAt: Date;
}

export class LobbyManager {
  private lobbies: Map<string, LobbyState> = new Map();

  // Create a new lobby
  createLobby(
    lobbyId: string,
    joinCode: string,
    config: { minPlayers: number; maxPlayers: number; isPrivate: boolean },
    hostId: string,
    hostName: string
  ): LobbyState {
    const lobby: LobbyState = {
      id: lobbyId,
      joinCode,
      config,
      players: [{
        id: hostId,
        name: hostName,
        isHost: true,
        isBot: false,
        joinedAt: new Date(),
      }],
      hostId,
      status: 'waiting',
      createdAt: new Date(),
    };

    this.lobbies.set(lobbyId, lobby);
    return lobby;
  }

  // Join a lobby using join code
  joinLobby(joinCode: string, playerId: string, playerName: string): LobbyState | null {
    const lobby = Array.from(this.lobbies.values()).find(l => l.joinCode === joinCode);

    if (!lobby) return null;

    // Check if player already joined
    if (lobby.players.some(p => p.id === playerId)) {
      return lobby;
    }

    // Check if lobby is full (excluding bots)
    const humanPlayers = lobby.players.filter(p => !p.isBot);
    if (humanPlayers.length >= lobby.config.maxPlayers) {
      return null;
    }

    // Add player
    lobby.players.push({
      id: playerId,
      name: playerName,
      isHost: false,
      isBot: false,
      joinedAt: new Date(),
    });

    return lobby;
  }

  // Add bots to lobby (max 1 less than human players)
  addBots(lobbyId: string, botCount: number): boolean {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return false;

    const humanPlayers = lobby.players.filter(p => !p.isBot);
    const maxBots = Math.max(0, humanPlayers.length - 1);
    const currentBots = lobby.players.filter(p => p.isBot).length;

    if (currentBots + botCount > maxBots) return false;

    // Add bots
    for (let i = 0; i < botCount; i++) {
      lobby.players.push({
        id: `bot_${Date.now()}_${i}`,
        name: `Bot ${currentBots + i + 1}`,
        isHost: false,
        isBot: true,
        joinedAt: new Date(),
      });
    }

    return true;
  }

  // Start game (only host can do this)
  startGame(lobbyId: string, hostId: string): boolean {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.hostId !== hostId || lobby.status !== 'waiting') {
      return false;
    }

    const humanPlayers = lobby.players.filter(p => !p.isBot);
    if (humanPlayers.length < lobby.config.minPlayers) {
      return false;
    }

    lobby.status = 'starting';
    return true;
  }

  // Get lobby by ID
  getLobby(lobbyId: string): LobbyState | undefined {
    return this.lobbies.get(lobbyId);
  }

  // Get lobby by join code
  getLobbyByCode(joinCode: string): LobbyState | undefined {
    return Array.from(this.lobbies.values()).find(l => l.joinCode === joinCode);
  }

  // Update game state
  updateGameState(lobbyId: string, gameState: GameState): void {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      lobby.gameState = gameState;
      if (lobby.status === 'starting') {
        lobby.status = 'in-progress';
        this.startPhaseTimer(lobbyId);
      }
    }
  }

  // Start phase timer (1 minute per phase)
  private startPhaseTimer(lobbyId: string): void {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    lobby.phaseStartTime = new Date();
    lobby.phaseEndTime = new Date(Date.now() + 60000); // 1 minute

    // Auto-advance phase after 1 minute
    setTimeout(() => {
      this.advancePhase(lobbyId);
    }, 60000);
  }

  // Advance to next phase
  private advancePhase(lobbyId: string): void {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || !lobby.gameState) return;

    // Toggle phase
    lobby.gameState.currentPhase = lobby.gameState.currentPhase === 'night' ? 'day' : 'night';

    // Reset phase-specific data
    if (lobby.gameState.currentPhase === 'night') {
      lobby.gameState.nightActions = {};
      lobby.gameState.detectiveResult = undefined;
    } else {
      lobby.gameState.votingResults = { votes: {} };
    }

    // Start new timer
    this.startPhaseTimer(lobbyId);
  }

  // Get remaining time in current phase
  getRemainingTime(lobbyId: string): number {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || !lobby.phaseEndTime) return 0;

    return Math.max(0, lobby.phaseEndTime.getTime() - Date.now());
  }

  // Check if player is in lobby
  isPlayerInLobby(lobbyId: string, playerId: string): boolean {
    const lobby = this.lobbies.get(lobbyId);
    return lobby ? lobby.players.some(p => p.id === playerId) : false;
  }

  // Get all lobbies
  getAllLobbies(): LobbyState[] {
    return Array.from(this.lobbies.values());
  }
}

// Global instance
export const lobbyManager = new LobbyManager();