// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {GameLobby} from "./GameLobby.sol";
import {GameTypes} from "./GameTypes.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";
import {PhaseEngine} from "./PhaseEngine.sol";

/// @title LobbyRegistry
/// @notice Deploys and tracks individual game lobbies.
contract LobbyRegistry is ReentrancyGuard {
    using GameTypes for GameTypes.LobbyConfig;

    /// @notice Emitted whenever a new lobby is instantiated.
    event LobbyCreated(uint256 indexed lobbyId, address indexed lobbyAddress, address indexed creator);
    event PhaseEngineUpdated(address indexed newPhaseEngine);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error InvalidConfig();
    error LobbyNotFound(uint256 lobbyId);
    error InvalidPhaseEngine();
    error NotOwner();

    GameTypes.LobbyRecord[] private lobbyRecords;
    PhaseEngine public phaseEngine;
    address public owner;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// @notice Deploys a new lobby contract and records its metadata.
    function createLobby(
        GameTypes.LobbyConfig calldata config,
        bytes32 joinCodeHash,
        string calldata metadataURI
    ) external nonReentrant returns (uint256 lobbyId, address lobbyAddress) {
        _validateConfig(config);

        GameLobby lobby = new GameLobby(msg.sender, config, metadataURI, joinCodeHash);

        GameTypes.LobbyRecord memory record = GameTypes.LobbyRecord({
            lobbyAddress: address(lobby),
            creator: msg.sender,
            config: config,
            metadataURI: metadataURI,
            createdAt: block.timestamp
        });

        lobbyRecords.push(record);
        lobbyId = lobbyRecords.length - 1;

        if (address(phaseEngine) != address(0)) {
            phaseEngine.registerLobby(address(lobby));
        }

        emit LobbyCreated(lobbyId, address(lobby), msg.sender);
        return (lobbyId, address(lobby));
    }

    /// @notice Sets or updates the phase engine reference used for new lobbies.
    function setPhaseEngine(address phaseEngineAddress) external onlyOwner {
        if (phaseEngineAddress == address(0)) revert InvalidPhaseEngine();
        phaseEngine = PhaseEngine(phaseEngineAddress);
        emit PhaseEngineUpdated(phaseEngineAddress);
    }

    /// @notice Transfers contract ownership.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "INVALID_OWNER");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Returns the number of tracked lobbies.
    function getLobbyCount() external view returns (uint256) {
        return lobbyRecords.length;
    }

    /// @notice Returns a lobby record payload for discovery UIs.
    function getLobbyRecord(uint256 lobbyId) external view returns (GameTypes.LobbyRecord memory) {
        GameTypes.LobbyRecord storage stored = _getLobbyRecord(lobbyId);
        return GameTypes.LobbyRecord({
            lobbyAddress: stored.lobbyAddress,
            creator: stored.creator,
            config: stored.config,
            metadataURI: stored.metadataURI,
            createdAt: stored.createdAt
        });
    }

    /// @notice Returns whether a lobby is currently locked.
    function isLobbyLocked(uint256 lobbyId) external view returns (bool) {
        address lobbyAddress = _getLobbyAddress(lobbyId);
        return GameLobby(lobbyAddress).locked();
    }

    function _validateConfig(GameTypes.LobbyConfig calldata config) internal pure {
        if (config.minPlayers < 2 || config.maxPlayers > 100 || config.maxPlayers < config.minPlayers) {
            revert InvalidConfig();
        }
        if (config.joinTimeoutSeconds > 0) {
            // enforce a ceiling of 48 hours to avoid stale lobbies lingering forever
            uint32 maxTimeout = 48 hours;
            if (config.joinTimeoutSeconds > maxTimeout) revert InvalidConfig();
        }
    }

    function _getLobbyRecord(uint256 lobbyId) internal view returns (GameTypes.LobbyRecord storage) {
        if (lobbyId >= lobbyRecords.length) revert LobbyNotFound(lobbyId);
        return lobbyRecords[lobbyId];
    }

    function _getLobbyAddress(uint256 lobbyId) internal view returns (address) {
        if (lobbyId >= lobbyRecords.length) revert LobbyNotFound(lobbyId);
        return lobbyRecords[lobbyId].lobbyAddress;
    }
}
