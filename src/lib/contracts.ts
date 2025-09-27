import LobbyRegistryABI from '@/abi/LobbyRegistry.json';
import GameLobbyABI from '@/abi/GameLobby.json';
import PhaseEngineABI from '@/abi/PhaseEngine.json';
import VoteRegistryABI from '@/abi/VoteRegistry.json';
import NightActionRegistryABI from '@/abi/NightActionRegistry.json';

// Contract addresses - these would be set after deployment
export const CONTRACT_ADDRESSES = {
  // TODO: Deploy contracts and update these addresses
  LobbyRegistry: '0x0000000000000000000000000000000000000000',
  PhaseEngine: '0x0000000000000000000000000000000000000000',
  ActionValidator: '0x0000000000000000000000000000000000000000',
  VoteRegistry: '0x0000000000000000000000000000000000000000',
  NightActionRegistry: '0x0000000000000000000000000000000000000000',
  NightActionResolver: '0x0000000000000000000000000000000000000000',
  EliminationEngine: '0x0000000000000000000000000000000000000000',
  PlayerState: '0x0000000000000000000000000000000000000000',
} as const;

export const CONTRACT_ABIS = {
  LobbyRegistry: LobbyRegistryABI.abi,
  GameLobby: GameLobbyABI.abi,
  PhaseEngine: PhaseEngineABI.abi,
  VoteRegistry: VoteRegistryABI.abi,
  NightActionRegistry: NightActionRegistryABI.abi,
} as const;

export type ContractName = keyof typeof CONTRACT_ADDRESSES;
export type ContractABIName = keyof typeof CONTRACT_ABIS;
