// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {PhaseEngine} from "./PhaseEngine.sol";
import {VoteRegistry} from "./VoteRegistry.sol";
import {GameTypes} from "./GameTypes.sol";
import {ActionValidator} from "./ActionValidator.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

/// @title EliminationEngine
/// @notice Resolves day-phase vote tallies into elimination outcomes.
contract EliminationEngine is ReentrancyGuard {
    /// @notice Emitted when a single player is eliminated by vote.
    event PlayerEliminated(address indexed lobby, uint32 indexed round, address indexed target, uint256 votes);

    /// @notice Emitted when multiple players tie for top votes.
    event VoteTie(address indexed lobby, uint32 indexed round, address[] tiedPlayers, uint256 votes);

    /// @notice Emitted when no votes are cast during the round.
    event NoElimination(address indexed lobby, uint32 indexed round);

    error InvalidPhaseEngine();
    error InvalidVoteRegistry();
    error InvalidActionValidator();
    error NotOwner();
    error InvalidPlayersResponse();
    error InvalidPhase(GameTypes.Phase expected, GameTypes.Phase actual);
    error RoundNotInitialized();

    PhaseEngine public immutable phaseEngine;
    VoteRegistry public immutable voteRegistry;
    ActionValidator public actionValidator;
    address public owner;

    event ActionValidatorSet(address indexed validator);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address phaseEngineAddress, address voteRegistryAddress) {
        if (phaseEngineAddress == address(0)) revert InvalidPhaseEngine();
        if (voteRegistryAddress == address(0)) revert InvalidVoteRegistry();
        phaseEngine = PhaseEngine(phaseEngineAddress);
        voteRegistry = VoteRegistry(voteRegistryAddress);
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Resolves the day vote for a lobby, emitting elimination/tie events.
    function resolveDay(address lobby) external nonReentrant returns (address eliminated, bool didEliminate) {
        GameTypes.PhaseState memory state = phaseEngine.getPhaseState(lobby);
        if (state.round == 0) revert RoundNotInitialized();
        if (state.currentPhase != GameTypes.Phase.Resolution) {
            revert InvalidPhase(GameTypes.Phase.Resolution, state.currentPhase);
        }

        address[] memory players = _getPlayers(lobby);
        if (players.length == 0) revert InvalidPlayersResponse();

        uint256[] memory tallies = voteRegistry.getTallyBatch(lobby, state.round, players);

        uint256 maxVotes;
        uint256 maxIndex;
        uint256 tieCount;

        for (uint256 i = 0; i < tallies.length; i++) {
            uint256 votes = tallies[i];
            if (votes == 0) {
                continue;
            }

            if (votes > maxVotes) {
                maxVotes = votes;
                maxIndex = i;
                tieCount = 1;
            } else if (votes == maxVotes) {
                tieCount += 1;
            }
        }

        if (maxVotes == 0) {
            emit NoElimination(lobby, state.round);
            return (address(0), false);
        }

        if (tieCount > 1) {
            address[] memory tiedPlayers = new address[](tieCount);
            uint256 cursor;
            for (uint256 i = 0; i < tallies.length; i++) {
                if (tallies[i] == maxVotes) {
                    tiedPlayers[cursor] = players[i];
                    cursor++;
                }
            }
            emit VoteTie(lobby, state.round, tiedPlayers, maxVotes);
            return (address(0), false);
        }

        address target = players[maxIndex];
        emit PlayerEliminated(lobby, state.round, target, maxVotes);
        if (address(actionValidator) != address(0)) {
            actionValidator.markEliminated(lobby, target);
        }
        return (target, true);
    }

    /// @notice Updates the action validator hook used to flag eliminations.
    function setActionValidator(address validator) external onlyOwner {
        if (validator == address(0)) revert InvalidActionValidator();
        actionValidator = ActionValidator(validator);
        emit ActionValidatorSet(validator);
    }

    /// @notice Transfers ownership of the elimination engine.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "INVALID_OWNER");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _getPlayers(address lobby) internal view returns (address[] memory players) {
        (bool success, bytes memory data) = lobby.staticcall(abi.encodeWithSignature("getPlayers()"));
        if (!success || data.length == 0) revert InvalidPlayersResponse();
        players = abi.decode(data, (address[]));
    }
}
