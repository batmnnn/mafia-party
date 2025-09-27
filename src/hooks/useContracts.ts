'use client';

import { useState, useEffect, useCallback } from 'react';
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
      
      const lobbyCount = await contractService.getLobbyCount();
      const lobbyPromises: Promise<LobbyRecord>[] = [];
      
      for (let i = 0; i < Number(lobbyCount); i++) {
        lobbyPromises.push(contractService.getLobbyRecord(BigInt(i)) as Promise<LobbyRecord>);
      }
      
      const lobbyData = await Promise.all(lobbyPromises) as LobbyRecord[];
      setLobbies(lobbyData);
    } catch (err) {
      console.error('Error fetching lobbies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lobbies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbies();
  }, []);

  return { lobbies, loading, error, refetch: fetchLobbies };
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
      
      const state = await contractService.getPhaseState(lobbyAddress);
      setPhaseState(state);
    } catch (err) {
      console.error('Error fetching phase state:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch phase state');
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
      
      const result = await contractService.readContract(contractName, functionName, args);
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
