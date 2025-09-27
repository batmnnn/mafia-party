import LobbyRegistryABI from '@/abi/LobbyRegistry.json';
import GameLobbyABI from '@/abi/GameLobby.json';
import PhaseEngineABI from '@/abi/PhaseEngine.json';
import VoteRegistryABI from '@/abi/VoteRegistry.json';
import NightActionRegistryABI from '@/abi/NightActionRegistry.json';

// Contract addresses - these would be set after deployment
export const CONTRACT_ADDRESSES = {
  // TODO: Deploy contracts and update these addresses
  LobbyRegistry: '0x5aAdFB43eF8dAF45DD80F4676345b7676f1D70e3',
  PhaseEngine: '0xf13D09eD3cbdD1C930d4de74808de1f33B6b3D4f',
  ActionValidator: '0x5c4a3C2CD1ffE6aAfDF62b64bb3E620C696c832E',
  VoteRegistry: '0x6AE5E129054a5dBFCeBb9Dfcb1CE1AA229fB1Ddb',
  NightActionRegistry: '0xcD95e0E356A5f414894Be4bAD363acdaCcAb30a9',
  NightActionResolver: '0x41b343Df2196081e42ac8Da11a1aA38De08e8658',
  EliminationEngine: '0xC33F7eF76C2bBC678794516f038e62Ce3fAE6072',
  PlayerState: '0x961e384b66ae2Bb90c9bBdd3d5105397E70a7A37',
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
