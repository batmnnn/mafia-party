export type PlayerRole = 'Mafia' | 'Detective' | 'Healer' | 'Commoner';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  hp: number;
  isAlive: boolean;
  isUser: boolean;
}

export interface GameState {
  players: Player[];
  currentPhase: 'night' | 'day';
  round: number;
  gameEnded: boolean;
  winner: 'Mafia' | 'Villagers' | null;
  nightActions: {
    mafiaTarget?: string;
    detectiveTarget?: string;
    healerTarget?: string;
  };
  detectiveResult?: {
    targetId: string;
    isMafia: boolean;
  };
  votingResults?: {
    votes: Record<string, number>;
    eliminatedPlayer?: string;
  };
}

export class MafiaGameEngine {
  private gameState: GameState;

  constructor(playerCount: number, userRole?: PlayerRole) {
    this.gameState = this.initializeGame(playerCount, userRole);
  }

  private initializeGame(playerCount: number, userRole?: PlayerRole): GameState {
    if (playerCount < 6) {
      throw new Error('Minimum 6 players required');
    }

    // Calculate role distribution
    const mafiaCount = Math.max(1, Math.floor(playerCount * 0.2));
    const detectiveCount = Math.max(1, Math.floor(playerCount * 0.2));
    const healerCount = Math.max(1, Math.floor(playerCount * 0.1));
    const commonerCount = playerCount - mafiaCount - detectiveCount - healerCount;

    // Create roles array
    const roles: PlayerRole[] = [
      ...Array(mafiaCount).fill('Mafia'),
      ...Array(detectiveCount).fill('Detective'),
      ...Array(healerCount).fill('Healer'),
      ...Array(commonerCount).fill('Commoner'),
    ];

    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // If user specified a role, ensure they get it
    if (userRole) {
      const userRoleIndex = roles.findIndex(role => role === userRole);
      if (userRoleIndex !== -1) {
        // Swap user role to first position
        [roles[0], roles[userRoleIndex]] = [roles[userRoleIndex], roles[0]];
      }
    }

    // Create players
    const players: Player[] = roles.map((role, index) => ({
      id: `player_${index + 1}`,
      name: index === 0 ? 'You' : `Player ${index + 1}`,
      role,
      hp: this.getInitialHP(role),
      isAlive: true,
      isUser: index === 0,
    }));

    return {
      players,
      currentPhase: 'night',
      round: 1,
      gameEnded: false,
      winner: null,
      nightActions: {},
    };
  }

  private getInitialHP(role: PlayerRole): number {
    switch (role) {
      case 'Mafia': return 2500;
      case 'Detective':
      case 'Healer': return 800;
      case 'Commoner': return 1000;
      default: return 1000;
    }
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  // Night Phase Actions
  setMafiaTarget(targetId: string): void {
    if (this.gameState.currentPhase !== 'night') return;

    const target = this.gameState.players.find(p => p.id === targetId);
    const mafias = this.gameState.players.filter(p => p.role === 'Mafia' && p.isAlive);

    if (!target || !target.isAlive || mafias.some(m => m.id === targetId)) {
      throw new Error('Invalid target');
    }

    this.gameState.nightActions.mafiaTarget = targetId;
  }

  setDetectiveTarget(targetId: string): void {
    if (this.gameState.currentPhase !== 'night') return;

    const target = this.gameState.players.find(p => p.id === targetId);
    const detectives = this.gameState.players.filter(p => p.role === 'Detective' && p.isAlive);

    if (!target || !target.isAlive || detectives.some(d => d.id === targetId)) {
      throw new Error('Invalid target');
    }

    this.gameState.nightActions.detectiveTarget = targetId;
  }

  setHealerTarget(targetId: string): void {
    if (this.gameState.currentPhase !== 'night') return;

    const target = this.gameState.players.find(p => p.id === targetId);

    if (!target || !target.isAlive) {
      throw new Error('Invalid target');
    }

    this.gameState.nightActions.healerTarget = targetId;
  }

  // Process night actions
  processNightActions(): void {
    if (this.gameState.currentPhase !== 'night') return;

    const { mafiaTarget, detectiveTarget, healerTarget } = this.gameState.nightActions;

    // Process detective action
    if (detectiveTarget) {
      const target = this.gameState.players.find(p => p.id === detectiveTarget);
      if (target) {
        this.gameState.detectiveResult = {
          targetId: detectiveTarget,
          isMafia: target.role === 'Mafia',
        };

        // If detective finds mafia, eliminate them immediately
        if (target.role === 'Mafia') {
          target.isAlive = false;
          this.gameState.votingResults = {
            votes: {},
            eliminatedPlayer: detectiveTarget,
          };
          this.checkWinCondition();
          return; // Skip voting phase
        }
      }
    }

    // Process mafia action
    if (mafiaTarget) {
      this.processMafiaAttack(mafiaTarget);
    }

    // Process healer action
    if (healerTarget) {
      this.processHealerAction(healerTarget);
    }

    // Move to day phase
    this.gameState.currentPhase = 'day';
    this.gameState.nightActions = {};
  }

  private processMafiaAttack(targetId: string): void {
    const target = this.gameState.players.find(p => p.id === targetId);
    const mafias = this.gameState.players.filter(p => p.role === 'Mafia' && p.isAlive && p.hp > 0);

    if (!target || !target.isAlive || mafias.length === 0) return;

    const combinedMafiaHP = mafias.reduce((sum, mafia) => sum + mafia.hp, 0);
    const initialTargetHP = target.hp;

    if (combinedMafiaHP >= target.hp) {
      // Target dies
      target.hp = 0;
      target.isAlive = false;
    } else {
      // Reduce target HP
      target.hp -= combinedMafiaHP;
    }

    // Damage to mafias
    const damagePerMafia = initialTargetHP / mafias.length;
    mafias.forEach(mafia => {
      const damage = Math.min(mafia.hp, damagePerMafia);
      mafia.hp -= damage;
      if (mafia.hp < 0) mafia.hp = 0;
    });
  }

  private processHealerAction(targetId: string): void {
    const target = this.gameState.players.find(p => p.id === targetId);
    const healers = this.gameState.players.filter(p => p.role === 'Healer' && p.isAlive && p.hp > 0);

    if (!target || !target.isAlive || healers.length === 0) return;

    // If target was killed this round and healer chooses them, revive with 500 HP
    if (target.hp === 0) {
      target.hp = 500;
      target.isAlive = true;
    } else {
      // Otherwise, boost HP by 500
      target.hp += 500;
    }
  }

  // Day Phase Voting
  castVote(voterId: string, targetId: string): void {
    if (this.gameState.currentPhase !== 'day') return;

    const voter = this.gameState.players.find(p => p.id === voterId);
    const target = this.gameState.players.find(p => p.id === targetId);

    if (!voter || !voter.isAlive || !target || !target.isAlive) {
      throw new Error('Invalid vote');
    }

    if (!this.gameState.votingResults) {
      this.gameState.votingResults = { votes: {} };
    }

    this.gameState.votingResults.votes[targetId] = (this.gameState.votingResults.votes[targetId] || 0) + 1;
  }

  processVoting(): void {
    if (this.gameState.currentPhase !== 'day' || !this.gameState.votingResults) return;

    const { votes } = this.gameState.votingResults;
    const maxVotes = Math.max(...Object.values(votes));
    const candidates = Object.keys(votes).filter(id => votes[id] === maxVotes);

    if (candidates.length === 1) {
      // Clear winner
      const eliminatedId = candidates[0];
      const eliminated = this.gameState.players.find(p => p.id === eliminatedId);
      if (eliminated) {
        eliminated.isAlive = false;
        this.gameState.votingResults.eliminatedPlayer = eliminatedId;
        this.checkWinCondition();
        this.advanceToNextRound();
      }
    } else {
      // Tie - reset voting for next round
      this.gameState.votingResults = { votes: {} };
    }
  }

  private checkWinCondition(): void {
    const alivePlayers = this.gameState.players.filter(p => p.isAlive);
    const aliveMafias = alivePlayers.filter(p => p.role === 'Mafia');
    const aliveNonMafias = alivePlayers.filter(p => p.role !== 'Mafia');

    // Mafia wins if ratio is 1:1 or better
    if (aliveMafias.length >= aliveNonMafias.length && aliveNonMafias.length > 0) {
      this.gameState.gameEnded = true;
      this.gameState.winner = 'Mafia';
    }
    // Villagers win if all mafias are eliminated
    else if (aliveMafias.length === 0) {
      this.gameState.gameEnded = true;
      this.gameState.winner = 'Villagers';
    }
  }

  private advanceToNextRound(): void {
    if (this.gameState.gameEnded) return;

    this.gameState.round++;
    this.gameState.currentPhase = 'night';
    this.gameState.nightActions = {};
    this.gameState.detectiveResult = undefined;
    this.gameState.votingResults = undefined;
  }

  // Get available targets for different actions
  getAvailableTargets(excludeRole?: PlayerRole): string[] {
    return this.gameState.players
      .filter(p => p.isAlive && (!excludeRole || p.role !== excludeRole))
      .map(p => p.id);
  }

  getAlivePlayers(): Player[] {
    return this.gameState.players.filter(p => p.isAlive);
  }

  getUserPlayer(): Player | undefined {
    return this.gameState.players.find(p => p.isUser);
  }

  isUserTurn(): boolean {
    const user = this.getUserPlayer();
    if (!user || !user.isAlive) return false;

    if (this.gameState.currentPhase === 'night') {
      const { mafiaTarget, detectiveTarget, healerTarget } = this.gameState.nightActions;

      switch (user.role) {
        case 'Mafia':
          return !mafiaTarget;
        case 'Detective':
          return !detectiveTarget;
        case 'Healer':
          return !healerTarget;
        default:
          return false;
      }
    }

    return this.gameState.currentPhase === 'day' && !this.gameState.votingResults?.eliminatedPlayer;
  }
}