// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {GameTypes} from "./GameTypes.sol";
import {PhaseEngine} from "./PhaseEngine.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

/// @title VoteRegistry
/// @notice Records commit/reveal style votes for Mafia Party day phases.
contract VoteRegistry is ReentrancyGuard {
    /// @notice Emitted when a commitment is stored for a lobby round.
    event VoteCommitted(address indexed lobby, uint32 indexed round, address indexed voter, bytes32 commitment);

    /// @notice Emitted when a commitment is revealed and tallied.
    event VoteRevealed(
        address indexed lobby,
        uint32 indexed round,
        address indexed voter,
        address target,
        bytes32 salt
    );

    error InvalidPhaseEngine();
    error InvalidCommitment();
    error InvalidPhase(GameTypes.Phase expectedPhase, GameTypes.Phase actualPhase);
    error InvalidRevealPhase(GameTypes.Phase actualPhase);
    error RoundNotInitialized();
    error AlreadyCommitted();
    error NotLobbyPlayer();
    error VoteNotCommitted();
    error AlreadyRevealed();
    error CommitmentMismatch();

    PhaseEngine public immutable phaseEngine;

    mapping(address => mapping(uint32 => mapping(address => GameTypes.VoteRecord))) private _votes;
    mapping(address => mapping(uint32 => mapping(address => uint256))) private _tallies;

    constructor(address phaseEngineAddress) {
        if (phaseEngineAddress == address(0)) revert InvalidPhaseEngine();
        phaseEngine = PhaseEngine(phaseEngineAddress);
    }

    /// @notice Stores a vote commitment for the caller in the current lobby day round.
    /// @param lobby The lobby being voted in.
    /// @param commitment The keccak256 hash of (lobby, round, voter, target, salt).
    function submitVote(address lobby, bytes32 commitment) external nonReentrant {
        if (commitment == bytes32(0)) revert InvalidCommitment();

        GameTypes.PhaseState memory state = phaseEngine.getPhaseState(lobby);
        if (state.round == 0) revert RoundNotInitialized();
        if (state.currentPhase != GameTypes.Phase.Day) {
            revert InvalidPhase(GameTypes.Phase.Day, state.currentPhase);
        }

        _ensurePlayer(lobby, msg.sender);

        GameTypes.VoteRecord storage record = _votes[lobby][state.round][msg.sender];
        if (record.commitment != bytes32(0) || record.revealed) revert AlreadyCommitted();

        record.commitment = commitment;
        record.revealed = false;
        record.target = address(0);

        emit VoteCommitted(lobby, state.round, msg.sender, commitment);
    }

    /// @notice Reveals the caller's commitment, tallying their vote for the specified target.
    /// @param lobby The lobby being voted in.
    /// @param target The address the voter selected (zero address represents abstain).
    /// @param salt The salt used when generating the commitment.
    function revealVote(address lobby, address target, bytes32 salt) external nonReentrant {
        GameTypes.PhaseState memory state = phaseEngine.getPhaseState(lobby);
        if (state.round == 0) revert RoundNotInitialized();
        if (
            state.currentPhase != GameTypes.Phase.Day &&
            state.currentPhase != GameTypes.Phase.Resolution &&
            state.currentPhase != GameTypes.Phase.Completed
        ) {
            revert InvalidRevealPhase(state.currentPhase);
        }

        _ensurePlayer(lobby, msg.sender);

        GameTypes.VoteRecord storage record = _votes[lobby][state.round][msg.sender];
        if (record.commitment == bytes32(0)) revert VoteNotCommitted();
        if (record.revealed) revert AlreadyRevealed();

        bytes32 computed = keccak256(abi.encodePacked(lobby, state.round, msg.sender, target, salt));
        if (computed != record.commitment) revert CommitmentMismatch();

        record.revealed = true;
        record.target = target;

        _tallies[lobby][state.round][target] += 1;

        emit VoteRevealed(lobby, state.round, msg.sender, target, salt);
    }

    /// @notice Returns a voter's record for a lobby round.
    function getVoteRecord(
        address lobby,
        uint32 round,
        address voter
    ) external view returns (GameTypes.VoteRecord memory) {
        GameTypes.VoteRecord memory record = _votes[lobby][round][voter];
        return record;
    }

    /// @notice Returns the tally count for a given target within a lobby round.
    function getTally(address lobby, uint32 round, address target) external view returns (uint256) {
        return _tallies[lobby][round][target];
    }

    /// @notice Returns tallies for a batch of targets within a lobby round.
    function getTallyBatch(
        address lobby,
        uint32 round,
        address[] calldata targets
    ) external view returns (uint256[] memory tallies) {
        tallies = new uint256[](targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            tallies[i] = _tallies[lobby][round][targets[i]];
        }
    }

    function _ensurePlayer(address lobby, address player) internal view {
        (bool success, bytes memory data) = lobby.staticcall(abi.encodeWithSignature("hasJoined(address)", player));
        if (!success || data.length == 0) revert NotLobbyPlayer();
        bool joined = abi.decode(data, (bool));
        if (!joined) revert NotLobbyPlayer();
    }
}
