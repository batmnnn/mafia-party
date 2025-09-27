# Mafia Party Contracts

This package contains the on-chain components for Mafia Party. It targets Foundry for Solidity development with future parity layers for Flow Cadence.

## Getting Started

1. Install [Foundry](https://book.getfoundry.sh/getting-started/installation).
2. Install dependencies and bind remapping rules (none required yet):

   ```bash
   forge install
   ```

3. Run the test suite:

   ```bash
   forge test
   ```

> **Note:** Cadence contracts will live alongside Solidity sources in future iterations under `cadence/`.

## Layout

- `src/` – Solidity sources.
- `test/` – Forge test contracts.
- `lib/` – External dependencies (managed via `forge install`).

## Next Steps

- Flesh out `LobbyRegistry` and `GameLobby` contracts with complete game rules and randomness integration.
- Add invariant tests and fuzz coverage for join/lock flows.
- Integrate CI (GitHub Actions) to run `forge test` and Slither analyses.
