// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {GameTypes} from "./GameTypes.sol";

/// @title GameLobby
/// @notice Tracks a single lobby configuration and manages player joins prior to lock.
contract GameLobby {
    using GameTypes for GameTypes.LobbyConfig;

    /// @notice Emitted whenever a player is added to the lobby.
    event PlayerJoined(address indexed player, uint256 indexed playerIndex);

    /// @notice Emitted when the lobby is locked and cannot accept further joins.
    event LobbyLocked(uint256 timestamp);

    error NotRegistry();
    error Unauthorized();
    error LobbyLockedError();
    error LobbyFull();
    error LobbyPrivate(bytes32 expectedHash);
    error DuplicatePlayer();
    error LobbyExpired();

    address public immutable registry;
    address public immutable creator;
    GameTypes.LobbyConfig private config;
    bytes32 public immutable joinCodeHash;
    string public metadataURI;
    uint256 public immutable createdAt;
    bool public locked;

    address[] private players;
    mapping(address => bool) private playerExists;

    modifier onlyRegistry() {
        if (msg.sender != registry) revert NotRegistry();
        _;
    }

    modifier onlyRegistryOrCreator() {
        if (msg.sender != registry && msg.sender != creator) revert Unauthorized();
        _;
    }

    constructor(
        address creator_,
        GameTypes.LobbyConfig memory config_,
        string memory metadataURI_,
        bytes32 joinCodeHash_
    ) {
        require(config_.maxPlayers >= config_.minPlayers, "INVALID_PLAYER_COUNTS");
        require(config_.minPlayers >= 2, "MIN_PLAYERS_TOO_LOW");
        require(config_.maxPlayers <= 100, "MAX_PLAYERS_TOO_HIGH");

        registry = msg.sender;
        creator = creator_;
        config = config_;
        metadataURI = metadataURI_;
        joinCodeHash = joinCodeHash_;
        createdAt = block.timestamp;

        _addPlayer(creator_);
    }

    /// @notice Allows a player to join the lobby if requirements are satisfied.
    function join(string calldata inviteCode) external {
        if (locked) revert LobbyLockedError();
        if (config.joinTimeoutSeconds > 0) {
            if (block.timestamp > createdAt + config.joinTimeoutSeconds) revert LobbyExpired();
        }

        if (config.isPrivate) {
            bytes32 providedHash = keccak256(abi.encodePacked(inviteCode));
            if (providedHash != joinCodeHash) revert LobbyPrivate(joinCodeHash);
        }

        if (players.length >= config.maxPlayers) revert LobbyFull();

        _addPlayer(msg.sender);

        if (players.length >= config.maxPlayers) {
            locked = true;
            emit LobbyLocked(block.timestamp);
        }
    }

    /// @notice Locks the lobby, preventing further joins.
    function forceLock() external onlyRegistryOrCreator {
        if (!locked) {
            locked = true;
            emit LobbyLocked(block.timestamp);
        }
    }

    /// @notice Returns the lobby configuration snapshot.
    function getConfig() external view returns (GameTypes.LobbyConfig memory) {
        return config;
    }

    /// @notice Returns the current list of players.
    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    /// @notice Returns the total number of registered players.
    function playerCount() external view returns (uint256) {
        return players.length;
    }

    /// @notice Checks whether a given address has already joined.
    function hasJoined(address player) external view returns (bool) {
        return playerExists[player];
    }

    function _addPlayer(address player) internal {
        if (playerExists[player]) revert DuplicatePlayer();
        playerExists[player] = true;
        players.push(player);
        emit PlayerJoined(player, players.length - 1);
    }
}
