'use client';

import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, type ContractName } from './contracts';

// Create a public client for reading from contracts
export const publicClient = createPublicClient({
  chain: worldchain,
  transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
});

// Contract interaction utilities
export class ContractService {
  private client = publicClient;

  // Read contract data
  async readContract<T = unknown>(
    contractName: ContractName,
    functionName: string,
    args: unknown[] = []
  ): Promise<T> {
    const address = CONTRACT_ADDRESSES[contractName];
    const abi = CONTRACT_ABIS[contractName as keyof typeof CONTRACT_ABIS];
    
    if (!address || (address as string) === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Contract ${contractName} not deployed`);
    }

    if (!abi) {
      throw new Error(`ABI not found for contract ${contractName}`);
    }

    return await this.client.readContract({
      address: address as `0x${string}`,
      abi,
      functionName,
      args,
    }) as T;
  }

  // Get lobby count
  async getLobbyCount(): Promise<bigint> {
    return await this.readContract('LobbyRegistry', 'getLobbyCount');
  }

  // Get lobby record
  async getLobbyRecord(lobbyId: bigint) {
    return await this.readContract('LobbyRegistry', 'getLobbyRecord', [lobbyId]);
  }

  // Check if lobby is locked
  async isLobbyLocked(lobbyId: bigint): Promise<boolean> {
    return await this.readContract('LobbyRegistry', 'isLobbyLocked', [lobbyId]);
  }

  // Get phase state for a lobby
  async getPhaseState(lobbyAddress: string) {
    return await this.readContract('PhaseEngine', 'getPhaseState', [lobbyAddress]);
  }

  // Get current phase for a lobby
  async getCurrentPhase(lobbyAddress: string): Promise<number> {
    return await this.readContract('PhaseEngine', 'currentPhase', [lobbyAddress]);
  }
}

export const contractService = new ContractService();
