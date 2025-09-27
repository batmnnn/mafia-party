# Mafia Party - Deployment Guide

This guide will help you deploy the Mafia Party smart contracts and connect them to the frontend.

## Prerequisites

1. **Node.js** (LTS version)
2. **Foundry** - Install from [getfoundry.sh](https://getfoundry.sh)
3. **World Chain RPC URL** - Get one from [Alchemy](https://alchemy.com) or [Infura](https://infura.io)
4. **Private Key** - For deploying contracts (use a test wallet, never mainnet)

## Step 1: Environment Setup

Create a `.env` file in the contracts directory:

```bash
# .env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

## Step 2: Deploy Contracts

```bash
cd contracts

# Compile contracts
forge build

# Deploy all contracts
forge script script/DeployMafiaContracts.s.sol --rpc-url $RPC_URL --broadcast --verify
```

## Step 3: Update Frontend Configuration

After deployment, copy the contract addresses from the deployment output and update `src/lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  LobbyRegistry: '0x...', // Replace with actual address
  PhaseEngine: '0x...',   // Replace with actual address
  // ... other contracts
} as const;
```

## Step 4: Register Abilities (Optional)

If you want to enable night actions, register the ability contracts:

```bash
# Register abilities with NightActionResolver
cast send $NIGHT_ACTION_RESOLVER_ADDRESS \
  "registerAbility(bytes32,address)" \
  $(cast keccak256 "KillAbility") \
  $KILL_ABILITY_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

## Step 5: Test the Application

1. Start the frontend: `npm run dev`
2. Navigate to `/build` to create a lobby
3. Navigate to `/lobbies` to see created lobbies

## Troubleshooting

### "Contract not deployed" Error
- Make sure you've updated `CONTRACT_ADDRESSES` in `src/lib/contracts.ts`
- Restart the frontend after updating addresses

### "Transaction failed" Error
- Check that your RPC URL is correct
- Ensure you have enough gas/WLD tokens
- Verify the private key has permission to deploy

### "ABI not found" Error
- Make sure the ABI files are copied to `src/abi/`
- Check that the contract names match between ABI and address config

## Contract Architecture

The deployed contracts work together as follows:

1. **LobbyRegistry** - Creates and tracks game lobbies
2. **PhaseEngine** - Manages game phases (Lobby → Day → Night → Resolution)
3. **ActionValidator** - Validates player actions and eliminations
4. **VoteRegistry** - Handles commit-reveal voting
5. **NightActionRegistry** - Queues night actions
6. **NightActionResolver** - Executes night actions
7. **EliminationEngine** - Resolves eliminations and win conditions
8. **PlayerState** - Tracks player status and effects
9. **Ability Contracts** - Kill, Protect, Investigate, Roleblock abilities

## Next Steps

Once deployed, you can:
- Create lobbies with custom configurations
- Join lobbies as players
- Execute the full game flow from lobby to completion
- Add custom abilities and game modes
- Implement the economy system (tokens, items, bribes)
