// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

library GameTypes {
    enum Phase {
        Lobby,
        Day,
        Night,
        Resolution,
        Completed
    }

    /// @notice Configuration parameters for a game lobby instance.
    struct LobbyConfig {
        uint8 minPlayers;
        uint8 maxPlayers;
        bool isPrivate;
        uint32 joinTimeoutSeconds;
    }

    /// @notice Metadata snapshot stored in the registry for discovery.
    struct LobbyRecord {
        address lobbyAddress;
        address creator;
        LobbyConfig config;
        string metadataURI;
        uint256 createdAt;
    }

    /// @notice Tracks the current phase state for a lobby.
    struct PhaseState {
        Phase currentPhase;
        uint32 round;
        uint64 deadline;
        Phase scheduledPhase;
        bool autoAdvanceEnabled;
    }

    /// @notice Tracks a voter's commit/reveal status within a round.
    struct VoteRecord {
        bytes32 commitment;
        bool revealed;
        address target;
    }

    /// @notice Captures a queued night action for deferred resolution.
    struct NightAction {
        address actor;
        address target;
        bytes data;
        bool consumed;
    }

    enum Role {
        None,
        Godfather,
        Mafia,
        Detective,
        Doctor,
        Insomniac,
        Villager
    }

    /// @notice Tracks a player's state in the game.
    struct PlayerState {
        address player;
        Role role;
        bool isAlive;
        bool isBot;
    }

    enum AbilityEffectType {
        None,
        Kill,
        Protect,
        Investigate,
        Roleblock
    }

    struct AbilityEffect {
        AbilityEffectType effectType;
        address target;
        bytes data;
    }
}
