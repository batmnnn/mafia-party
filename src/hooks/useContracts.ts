'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContractName } from '@/lib/contracts';
import { contractService } from '@/lib/contractService';

export interface LobbyRecord {
  lobbyAddress: string;
  creator: string;
  config: {
    minPlayers: number;
    maxPlayers: number;
    isPrivate: boolean;
    joinTimeoutSeconds: number;
  };
  metadataURI: string;
  createdAt: bigint;
}

export interface PhaseState {
  currentPhase: number;
  round: number;
  deadline: bigint;
  scheduledPhase: number;
  autoAdvanceEnabled: boolean;
}

export function useLobbies() {
  const [lobbies, setLobbies] = useState<LobbyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLobbies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });
      
      const lobbyCountPromise = contractService.getLobbyCount();
      const lobbyCount = await Promise.race([lobbyCountPromise, timeoutPromise]) as bigint;
      const lobbyPromises: Promise<LobbyRecord>[] = [];
      
      for (let i = 0; i < Number(lobbyCount); i++) {
        lobbyPromises.push(contractService.getLobbyRecord(BigInt(i)) as Promise<LobbyRecord>);
      }
      
      const lobbyData = await Promise.all(lobbyPromises) as LobbyRecord[];
      setLobbies(lobbyData);
    } catch (err) {
      console.error('Error fetching lobbies:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lobbies';
      setError(errorMessage);
      // Fallback to mock data for MVP testing
      const mockLobbies: LobbyRecord[] = [
        {
          lobbyAddress: '0x1234567890123456789012345678901234567890',
          creator: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          config: {
            minPlayers: 4,
            maxPlayers: 8,
            isPrivate: false,
            joinTimeoutSeconds: 300,
          },
          metadataURI: 'Mock Lobby 1',
          createdAt: BigInt(Math.floor(Date.now() / 1000)),
        },
        {
          lobbyAddress: '0x0987654321098765432109876543210987654321',
          creator: '0xfedcba0987654321fedcba0987654321fedcba0987',
          config: {
            minPlayers: 3,
            maxPlayers: 6,
            isPrivate: true,
            joinTimeoutSeconds: 600,
          },
          metadataURI: 'Mock Lobby 2',
          createdAt: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
        },
      ];

      // Add any locally created lobbies
      const localLobbies = JSON.parse(localStorage.getItem('mafia-party-lobbies') || '[]');
      const allLobbies = [...mockLobbies, ...localLobbies.map((lobby: {id: string, address: string, name: string, config: {minPlayers: number, maxPlayers: number, isPrivate: boolean}}) => ({
        lobbyAddress: lobby.address,
        creator: '0x' + '0'.repeat(40), // mock creator
        config: {
          minPlayers: lobby.config.minPlayers,
          maxPlayers: lobby.config.maxPlayers,
          isPrivate: lobby.config.isPrivate,
          joinTimeoutSeconds: 300,
        },
        metadataURI: lobby.name || `Lobby ${lobby.id}`,
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
      }))];

      setLobbies(allLobbies);
    } finally {
      setLoading(false);
    }
  };

  const addLocalLobby = (id: string, address: string, name: string, config: {minPlayers: number, maxPlayers: number, isPrivate: boolean}) => {
    const localLobbies = JSON.parse(localStorage.getItem('mafia-party-lobbies') || '[]');
    localLobbies.push({ id, address, name, config });
    localStorage.setItem('mafia-party-lobbies', JSON.stringify(localLobbies));
    fetchLobbies(); // Refresh the list
  };

  useEffect(() => {
    fetchLobbies();
  }, []);

  return { lobbies, loading, error, refetch: fetchLobbies, addLocalLobby };
}

export function useLobbyPhase(lobbyAddress: string | null) {
  const [phaseState, setPhaseState] = useState<PhaseState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhaseState = useCallback(async () => {
    if (!lobbyAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const state = await contractService.getPhaseState(lobbyAddress) as PhaseState;
      setPhaseState(state);
    } catch (err) {
      console.error('Error fetching phase state:', err);
      // Fallback to mock phase state for MVP testing
      const mockPhaseState: PhaseState = {
        currentPhase: 1, // Day phase
        round: 1,
        deadline: BigInt(Date.now() + 600000), // 10 minutes from now
        scheduledPhase: 2, // Next is Night
        autoAdvanceEnabled: true,
      };
      setPhaseState(mockPhaseState);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [lobbyAddress]);

  useEffect(() => {
    fetchPhaseState();
  }, [fetchPhaseState]);

  return { phaseState, loading, error, refetch: fetchPhaseState };
}

export function useContractRead<T>(
  contractName: ContractName,
  functionName: string,
  args: unknown[] = [],
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await contractService.readContract(contractName, functionName, args) as T;
      setData(result);
    } catch (err) {
      console.error(`Error reading ${contractName}.${functionName}:`, err);
      setError(err instanceof Error ? err.message : 'Contract read failed');
    } finally {
      setLoading(false);
    }
  }, [contractName, functionName, args, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
