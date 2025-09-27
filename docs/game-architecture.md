# Mafia Party – World Chain Game Architecture


## 1. Vision & Scope

- **Objective:** Deliver a verifiably fair social deduction experience that runs end-to-end on **World Chain**, using World ID for Sybil-resistant identity and Mini Apps for a native World App journey.
- **Primary Surface:** World App ↔ Mini App (`Next.js` 15 + MiniKit React). We optimize for mobile latency, deterministic state sync, and clear recovery paths so players can rejoin mid-round.
- **Guiding Principles:**
  - **Proof of Personhood first.** Every lobby uses World ID to gate entries and manage reputation.
  - **Deterministic core.** All gameplay-critical transitions (phases, votes, eliminations) settle on World Chain. Off-chain services are purely accelerators with on-chain commitments.
  - **Maintenance friendly.** Modular contracts, roll-forward migrations, and living documentation so new abilities or economy tweaks ship without disrupting live lobbies.

---

## 2. High-Level Architecture

```text
World App Wallet (World ID verified)
    │ MiniKit (Auth + Payments + Sign requests)
    ▼
Mini App Front-End (Next.js App Router, Tailwind, Mini Apps UI Kit)
    │
    ▼
API Layer (Next.js route handlers, viem, optional worker for timers)
    │
 ┌───────────────────────────────┬────────────────────────────┐
 │ Gameplay Contracts            │ Economy / Governance       │
 │ (Lobby, Phase, Night Actions) │ (Shop, Token, Safe admin)  │
 └───────────────────────────────┴────────────────────────────┘
    │
    ▼
Indexing & Analytics (Worldscan, custom Subgraph, Supabase cache)
```

- **Frontend:** Built entirely on `Next.js` 15 with the Mini Apps UI Kit. Authentication, wallet actions, and payments rely on MiniKit React hooks. Real-time UX comes from Server-Sent Events (`Next.js` route handlers) or Pusher channels keyed to lobby IDs.
- **Backend:** Route handlers dispatch `viem` calls to World Chain. No additional back-end services are required; an optional `Cloudflare` Worker handles watchdog calls to `autoAdvance()` if lobbies idle.
- **Smart Contracts:** Solidity contracts deployed to World Chain Sepolia and the primary World Chain network. Each domain (`LobbyRegistry`, `PhaseEngine`, `NightActionResolver`, etc.) is isolated behind an address registry stored on-chain.
- **Observability:** We consume logs via Alchemy’s World Chain RPC, push canonical state into `Supabase`, and expose read models to the Mini App.
- **Integrations:**
  - World ID Router `0x17B354dD2595411ff79041f930e491A4Df39A278` for proof verification.
  - Safe infrastructure (`SafeL2Singleton`, `SafeProxyFactory`) for treasury and operations.
  - Optional AI/automation via server wallet + rate-limited action relayer.

---

## 3. Core On-Chain Modules

### 3.1 Lobby Layer

| Contract | Responsibility | Key Storage | Events |
| --- | --- | --- | --- |
| `LobbyRegistry` | Create/search/join lobby instances. Holds metadata and contract addresses. | Lobby metadata, creator, allowed chains, fee settings. | `LobbyCreated`, `LobbyListed`, `LobbyJoined`. |
| `GameLobby` | Lobby-specific state machine until game start. | Config, player array, join codes, seed commitments. | `JoinRequested`, `JoinApproved`, `LobbyLocked`, `SeedRequested`. |

#### Workflow

1. Player authenticates through MiniKit → NextAuth session stored server-side → obtains lobby access token.
2. Lobby creator calls `LobbyRegistry.createLobby(config)` via `viem`. Registry seeds the new lobby with global addresses (PhaseEngine, ActionValidator) fetched from the address book.
3. Players join using World ID–verified accounts. `GameLobby.join(code?)` validates invite codes and ensures each root nullifier is unique (no double joins).
4. Hitting minimum players or pressing start triggers `forceLock()`, shifting to role assignment.

### 3.2 Role Assignment & Randomness

| Contract | Responsibility | Key Storage | Events |
| --- | --- | --- | --- |
| `WorldRandomnessRouter` | Bridges to World Chain native randomness. | Request ID → callback data. | `RandomnessRequested`, `RandomnessFulfilled`. |
| `AssignRoles` | Deterministic mapping using lobby seed. | Player commitments, encrypted payloads, re-roll counters. | `RolesAssigned`, `RoleRevealed`. |

#### Process

1. `GameLobby.lockLobby()` calls `WorldRandomnessRouter.requestRandomness(lobbyId)`.
2. World Chain fulfillment posts seed to `WorldRandomnessRouter.fulfill(requestId, seed)`.
3. `AssignRoles.assign(seed, lobbyConfig)` hashes addresses, applies deterministic shuffle, encrypts payload with `worldAppPublicKey` derived from World ID signal. Cipher text is stored on-chain; front-end decrypts client side.
4. Optional re-roll requires unanimous lobby vote and burns one `ReRollShard` item.

### 3.3 Phase Engine & Actions

| Contract | Responsibility | Core Functions |
| --- | --- | --- |
| `PhaseEngine` | Manages state machine per lobby. Tracks phase, round, deadlines. | `advancePhase()`, `setDeadline()`, `autoAdvance()` |
| `ActionValidator` | Gatekeeper ensuring phase correctness and alive checks for every action. | `validateDayAction()`, `validateNightAction()`, `markEliminated()` |
| `VoteRegistry` | Records votes (public and sealed). | `submitVote(hash)`, `revealVote(choice, salt)`, `tallyVotes()`. |
| `EliminationEngine` | Applies game logic to determine eliminations, tie-breaks, bribe effects. | `resolveDay()`, `resolveNight()`, `applyBribeWeights()`. |
| `NightActionRegistry` | Queues night abilities for deferred resolution. | `submitAction(target,data)`, `markActionConsumed()`, `getActions()` |
| `NightActionResolver` | Dispatches queued night actions to ability modules. | `registerAbility(id,addr)`, `resolveNight()`, `unregisterAbility()` |
| `KillAbility` | Standard kill module returning kill effects to resolver. | `executeNightAction()` |
| `ProtectAbility` | Applies protection flag to prevent next kill. | `executeNightAction()` |
| `InvestigateAbility` | Reveals mafia alignment for a target player. | `executeNightAction()`, `setAlignment()` |
| `RoleblockAbility` | Prevents a target player from executing their night action. | `executeNightAction()` |
| `PlayerState` | Tracks protection, investigation, and other player flags. | `applyProtection()`, `isProtected()`, `applyRoleblock()`, `isRoleblocked()` |

#### Timers

- On-chain: deadlines recorded in seconds since epoch. `advancePhase()` reverts if `block.timestamp` < deadline.
- Off-chain: `Next.js` server listens for `PhaseUpdated` events and mirrors timers through SSE/WebSocket. A lightweight cron worker calls `autoAdvance()` if all players stall beyond grace period.

### 3.4 Economy & Items

| Contract | Responsibility |
| --- | --- |
| `GameToken` | ERC20 on World Chain (minted via `PostGame` rewards or faucet). |
| `ItemShop` | Lists items (bribes, protections, re-rolls). Uses `WorldChain USDC` or `GameToken` for payment. |
| `BribeManager` | Applies bribe effects (vote weight, forced abstain). Emits receipts for audit. |
| `Inventory` | Tracks owned items per player (ERC1155 or custom mapping). Allows delegation/transfer. |

### 3.5 Meta & AI Layer

| Contract | Responsibility |
| --- | --- |
| `AIPlayerAdapter` | Rate-limited relayer for automated or AI-driven moves. |
| `AchievementNFT` | ERC721 with dynamic metadata for milestones. |
| `Leaderboard` | Maintains aggregated stats per World ID root. |

---

## 4. Frontend Module Specifications

### 4.1 Lobby Experience

- **Lobby Browser:** Query `LobbyRegistry.listLobbies(filter)` through `viem`. Display player caps, privacy, economy toggles, and minimum reputation requirements.
- **Create Form:** Configurable rules (role distribution, timers, economy settings). Validate on-chain before deploying.
- **Join Flow:** World ID orb verification → join request → waiting queue. Off-chain chat uses `Supabase` realtime; messages hash to `LogChatMessage` event on-chain for audit logs.

### 4.2 Role Reveal & Private Info

- Modal retrieves encrypted payload from `AssignRoles.roles(lobbyId, player)` and decrypts using session keys from World App.
- Optional badges minted through `AchievementNFT`. QR code share for social bragging inside World App.
- Re-roll UI enforces unanimous consent and item burn requirement.

### 4.3 Phase UI

- **Top bar:** Current phase, countdown timer synced with `deadline` from `PhaseEngine`.
- **Player board:** Avatars, alive/dead status, items, last actions.
- **Vote panel:** Different UIs for day (public votes) vs night (secret). Support commit-reveal for sealed ballots.
- **Action deck:** Role-specific actions (investigate, protect, bribe) contextually enabled.
- **Chat:**
  - Day chat stored in `Supabase` with message hashes recorded via `recordChatHash` event.
  - Night chat encrypted using lobby-specific keys derived from randomness seed; only mafia members possess the key.

### 4.4 Results & Post-Game

- Cinematic reveal driven by `EliminationEngine` + `WinCondition` events streamed via SSE.
- Post-game dashboard summarizes phase timeline, votes, investigations, and economy usage. Data fetched from `Supabase` cache built over Alchemy log subscriptions.
- Rematch clones lobby config, invites last lobby members, and reuses Safe for prize escrow.

---

## 5. Detailed Logic Flow

1. **World ID Session:** Player signs in via MiniKit → obtains `sessionToken` tied to root nullifier. Username stored in `Supabase` with pointer to nullifier hash.
2. **Lobby Creation:** Creator configures roles, timers, economy toggles, and optional buy-in currency. API handler mints lobby config hash and executes `LobbyRegistry.createLobby(config, hash, proof)`.
3. **Join:** Player supplies invite code (if private). `GameLobby.join(code, proof)` checks membership rules and ensures root nullifier unused.
4. **Lock:** Hitting capacity or manual start triggers `lockLobby()`, which requests randomness and stores commitments so players can prove membership later.
5. **Randomness:** Seed returned via World Chain native callback. `AssignRoles` writes encrypted payloads and emits `RolesAssigned`.
6. **Reveal:** Mini App downloads cipher via `viem`, decrypts using session keys, and shows role reveal modal. Optional `AchievementNFT` minted.
7. **Phase Loop:**
  - **Day:** players `commitVote(hash)` and optionally buy bribes from `ItemShop`. Reveal occurs before deadline; `EliminationEngine.resolveDay()` emits `PlayerEliminated` or `VoteTie`.
  - **Night:** players (or mafia multi-sig) submit actions to `NightActionRegistry`. `NightActionResolver.resolveNight()` iterates ability modules. Effects stored in `PlayerState`.
8. **Economy:** Items purchased with World Chain USDC or `GameToken`. `BribeManager` updates vote weights; `Inventory` tracks consumables.
9. **AI:** Optional AI agent listens to Supabase event mirror, crafts moves, and calls `AIPlayerAdapter.performAction()` under rate limits.
10. **Win Check:** `WinCondition.evaluate()` runs post-resolution. On completion, `PostGame.finalize()` distributes rewards, mints achievements, and posts replay hash.
11. **Post-Game:** Players access replay and analytics via `/lobby/[slug]/summary`. Lobby config can be cloned for rematch.

---

## 6. Randomness, Privacy & Security

- **Randomness:** Use World Chain randomness service (backed by OP Stack). Store `seedCommitment` before requesting, verify callbacks by ID. Chainlink VRF remains a fallback.
- **World ID Proofs:** All lobby joins, payments, and reward claims verify `nullifierHash` to prevent multi-accounting.
- **Role Secrecy:** Hybrid encryption using lobby salt + player session public key. Advanced option: integrate Semaphore-style proofs for zero-knowledge confirmations.
- **Commit-Reveal:** Day voting uses salted hash commitments; night mafia vote stays sealed until resolution.
- **Anti-Collusion:** Bribe spends logged via `BribeManager.BribeApplied`. Governance can slash or pause items via `GameGovernor` Safe.
- **Upgradeability:** Contracts behind UUPS proxies; upgrades executed via Safe transactions requiring governance quorum.
- **Audit Trail:** Every state mutation emits event; Subgraph captures deterministic replay for disputes.

---

## 7. Economy Design

- **Token economics:**
  - Base `GameToken` minted via faucet (`claimDaily()`); optional WLD/USDC buy-ins escrowed in Safe.
  - Rewards distributed after match through `PostGame.payRewards()` with on-chain history for audit.
  - Item pricing held in `ItemShop`. Governance proposals adjust via Safe-managed parameter updates.
- **Items:**
  - `BribeToken`: increases vote weight or enforces abstain.
  - `ProtectionCharm`: immune to elimination or protects target at night.
  - `InsightLens`: reveals one random clue or partial info.
  - `Re-Roll Shard`: triggers role re-roll if entire lobby consents.
- **NFT Integration:** Cosmetic skins, role badges, tournament trophies minted as ERC721. Metadata stored on IPFS; contract references pinned JSON.

---

## 8. AI & Meta Features

- **AI Player:** Optional off-chain agent uses LLM heuristics and plays through `AIPlayerAdapter` with cooldown windows. Every action emits `AIActionSubmitted` for visibility.
- **Hints System:** Optional `TipsIssued` event triggered when players consume `InsightLens`. Supports push notifications through MiniKit once released.
- **Leaderboard:** Aggregates wins, eliminations, streaks per World ID root. Off-chain mirror provides UI, proofs verify authenticity.
- **Achievements:** `AchievementNFT` criteria encoded on-chain; metadata refresh hooks allow evolving art layers based on stats.

---

## 9. Extensibility Roadmap

- **Spectator Mode:** Read-only view surfaces using Supabase + contract data. Spectator tips routed through Safe with rate limits.
- **Tournament Support:** `TournamentManager` schedules lobbies, manages shared pot, and distributes rewards via Safe workflows.
- **Streaming Integration:** SSE endpoints power overlays for Twitch/YouTube. Webhooks invite Discord bots to announce phase changes.
- **DAO Governance:** `RuleGovernor` contract lets token holders vote on presets. Safe executes upgrade after quorum.
- **Upgrade Strategy:** Address registry enables hot-swapping ability modules without redeploying the core resolver.

---

## 10. Delivery Milestones

| Phase | Deliverables | Tooling | Duration (est.) |
| --- | --- | --- | --- |
| 1. Foundation | Deploy core contracts (LobbyRegistry, GameLobby, PhaseEngine) to World Chain Sepolia. Basic lobby UI with World ID login. | Foundry, viem, MiniKit | 3 weeks |
| 2. Roles | Ship randomness router, AssignRoles encryption, role reveal UX. | Foundry, World Randomness | 2 weeks |
| 3. Day/Night Cycle | Complete VoteRegistry, NightAction stack, timers, notifications. | Foundry, Supabase, SSE | 4 weeks |
| 4. Economy | GameToken faucet, ItemShop, bribe mechanics, wallet balances in UI. | ERC20, Safe, MiniKit payments | 3 weeks |
| 5. Meta | Leaderboard, Achievement NFTs, replay export pipeline. | Subgraph, Supabase, ERC721 | 3 weeks |
| 6. Production Hardening | Monitoring, Safe-run upgrades, external audit, mainnet deploy. | Safe, Slither, Canelli tests | 4 weeks |

*Total initial build:* ~19 weeks with parallel frontend/contract tracks.

---

## 11. Implementation Considerations & Next Steps

1. **Proof-of-Concept:** Run end-to-end flow (create lobby → assign roles → resolve one day/night cycle) on World Chain Sepolia using the deployment steps in `/build`.
2. **DevOps:** Maintain Foundry `forge test` suite (already green). Add GitHub Actions job to deploy preview build and run contract tests on every PR.
3. **Monitoring:** Implement log subscriptions through Alchemy, push metrics into Grafana/Supabase.
4. **Security:** Run Slither + Echidna, coordinate external audit pre-mainnet. Keep upgrade keys in Safe with timelock.
5. **Documentation:** Keep `/docs` folder in sync with contract changes, and embed links to the Deployment Hub for reproducible setup.

---

## 12. Risk & Mitigation Checklist

- **Gas Costs:** Optimise structs, reuse storage slots, and batch resolves. Offload purely cosmetic logs to Supabase.
- **Randomness Availability:** Cache last valid seed and allow Safe-governed override if callback stalls. Chainlink VRF as failover.
- **Role Privacy:** Use audited libs, frequent key rotation, and optional SNARK proofs for sensitive reveals.
- **Player Inactivity:** Auto-advance with inactivity penalties; AI takeover after configurable timeout.
- **Economy Exploits:** Rate-limit purchases, audit bribe receipts, store price history for governance review.
- **Infrastructure:** Keep fallback RPC endpoints (Alchemy + community nodes). Cron worker retries failed automation calls.

---

## 13. Deliverable Summary

- Modular World Chain contract suite powering lobby lifecycle, role assignment, phase logic, economy, and meta systems.
- Next.js Mini App integrating World ID auth, viem-based transactions, and real-time updates.
- Documented deployment playbooks (see `/build`) plus monitoring, upgrade, and governance workflows tailored for World Chain.
- Roadmap for tournaments, spectators, and AI-driven enhancements while keeping fairness guarantees verifiable.

This document serves as the living blueprint for Mafia Party on World Chain. Keep it updated alongside contract deployments, governance proposals, and player feedback to ensure builders and operators share a single source of truth.
