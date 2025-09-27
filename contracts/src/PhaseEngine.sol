// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {GameTypes} from "./GameTypes.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

/// @title PhaseEngine
/// @notice Manages the per-lobby phase machine, deadlines, and optional auto-advance scheduling.
contract PhaseEngine is ReentrancyGuard {
    /// @notice Emitted when a lobby is registered with the engine.
    event LobbyRegistered(address indexed lobby);

    /// @notice Emitted whenever a lobby transitions to a new phase.
    event PhaseAdvanced(
        address indexed lobby,
        GameTypes.Phase previousPhase,
        GameTypes.Phase newPhase,
        uint32 round
    );

    /// @notice Emitted when a deadline is (re)scheduled for a lobby.
    event DeadlineScheduled(address indexed lobby, uint64 deadline);

    /// @notice Emitted when an auto-advance target is configured.
    event AutoAdvanceScheduled(address indexed lobby, GameTypes.Phase targetPhase);

    /// @notice Emitted when an existing auto-advance schedule is cleared.
    event AutoAdvanceCleared(address indexed lobby);

    error InvalidRegistry();
    error InvalidLobby();
    error LobbyAlreadyRegistered();
    error LobbyNotRegistered();
    error NotRegistry();
    error UnauthorizedCaller();
    error InvalidTransition(GameTypes.Phase currentPhase, GameTypes.Phase nextPhase);
    error AutoAdvanceRequiresDeadline();
    error InvalidAutoAdvanceTarget(GameTypes.Phase currentPhase, GameTypes.Phase targetPhase);
    error AutoAdvanceDisabled();
    error DeadlineNotReached();
    error DeadlineInPast();

    address public immutable registry;

    mapping(address => GameTypes.PhaseState) private _phaseStates;
    mapping(address => bool) private _registered;

    modifier onlyRegistry() {
        if (msg.sender != registry) revert NotRegistry();
        _;
    }

    modifier onlyRegistryOrLobby(address lobby) {
        if (msg.sender != registry && msg.sender != lobby) revert UnauthorizedCaller();
        _;
    }

    constructor(address registry_) {
        if (registry_ == address(0)) revert InvalidRegistry();
        registry = registry_;
    }

    /// @notice Registers a lobby with the phase engine. Must be called once by the registry.
    function registerLobby(address lobby) external onlyRegistry {
        if (lobby == address(0)) revert InvalidLobby();
        if (_registered[lobby]) revert LobbyAlreadyRegistered();

        _registered[lobby] = true;
        GameTypes.PhaseState storage state = _phaseStates[lobby];
        state.currentPhase = GameTypes.Phase.Lobby;
        state.round = 0;
        state.deadline = 0;
        state.scheduledPhase = GameTypes.Phase.Lobby;
        state.autoAdvanceEnabled = false;

        emit LobbyRegistered(lobby);
    }

    /// @notice Returns whether a lobby has been registered.
    function isLobbyRegistered(address lobby) external view returns (bool) {
        return _registered[lobby];
    }

    /// @notice Fetches the current phase state snapshot for a lobby.
    function getPhaseState(address lobby) external view returns (GameTypes.PhaseState memory) {
        _ensureRegistered(lobby);
        GameTypes.PhaseState storage stored = _phaseStates[lobby];
        return GameTypes.PhaseState({
            currentPhase: stored.currentPhase,
            round: stored.round,
            deadline: stored.deadline,
            scheduledPhase: stored.scheduledPhase,
            autoAdvanceEnabled: stored.autoAdvanceEnabled
        });
    }

    /// @notice Returns the current phase enum for a lobby.
    function currentPhase(address lobby) external view returns (GameTypes.Phase) {
        _ensureRegistered(lobby);
        return _phaseStates[lobby].currentPhase;
    }

    /// @notice Manually advances a lobby to the next phase, optionally scheduling an auto-advance.
    /// @param lobby The lobby whose phase is being advanced.
    /// @param nextPhase The phase to transition into.
    /// @param newDeadline The UNIX timestamp when the phase should expire (0 to clear).
    /// @param autoAdvanceTarget The phase to automatically transition into once the deadline elapses (ignored when zero deadline).
    function advancePhase(
        address lobby,
        GameTypes.Phase nextPhase,
        uint64 newDeadline,
        GameTypes.Phase autoAdvanceTarget
    ) external nonReentrant onlyRegistryOrLobby(lobby) {
        _ensureRegistered(lobby);
        if (newDeadline != 0 && newDeadline <= block.timestamp) revert DeadlineInPast();

        GameTypes.PhaseState storage state = _phaseStates[lobby];
        _advanceWithState(lobby, state, nextPhase, newDeadline, autoAdvanceTarget, newDeadline > 0 && autoAdvanceTarget != nextPhase);
    }

    /// @notice Attempts to auto-advance a lobby if the deadline has elapsed and a target is scheduled.
    function tryAutoAdvance(address lobby) external nonReentrant {
        _ensureRegistered(lobby);
        GameTypes.PhaseState storage state = _phaseStates[lobby];

        if (!state.autoAdvanceEnabled) revert AutoAdvanceDisabled();
        if (state.deadline == 0 || block.timestamp < state.deadline) revert DeadlineNotReached();

        GameTypes.Phase targetPhase = state.scheduledPhase;
        _advanceWithState(lobby, state, targetPhase, 0, GameTypes.Phase.Lobby, false);
    }

    function _advanceWithState(
        address lobby,
        GameTypes.PhaseState storage state,
        GameTypes.Phase nextPhase,
        uint64 newDeadline,
        GameTypes.Phase autoAdvanceTarget,
        bool enableAutoAdvance
    ) private {
        GameTypes.Phase previous = state.currentPhase;
        if (nextPhase == previous) revert InvalidTransition(previous, nextPhase);
    _validateTransition(previous, nextPhase);

        bool hadAuto = state.autoAdvanceEnabled;

        state.currentPhase = nextPhase;

        if (nextPhase == GameTypes.Phase.Day) {
            if (previous == GameTypes.Phase.Lobby) {
                state.round = 1;
            } else if (previous == GameTypes.Phase.Resolution) {
                state.round += 1;
            }
        }

        if (nextPhase == GameTypes.Phase.Completed) {
            state.deadline = 0;
            state.autoAdvanceEnabled = false;
            state.scheduledPhase = GameTypes.Phase.Completed;
            if (hadAuto) emit AutoAdvanceCleared(lobby);
            emit PhaseAdvanced(lobby, previous, nextPhase, state.round);
            return;
        }

        state.deadline = newDeadline;
        emit DeadlineScheduled(lobby, newDeadline);

        state.autoAdvanceEnabled = false;
        state.scheduledPhase = nextPhase;

        if (enableAutoAdvance) {
            if (newDeadline == 0) revert AutoAdvanceRequiresDeadline();
            if (autoAdvanceTarget == nextPhase) revert InvalidAutoAdvanceTarget(nextPhase, autoAdvanceTarget);
            _validateTransition(nextPhase, autoAdvanceTarget);
            state.autoAdvanceEnabled = true;
            state.scheduledPhase = autoAdvanceTarget;
            emit AutoAdvanceScheduled(lobby, autoAdvanceTarget);
        } else if (hadAuto) {
            emit AutoAdvanceCleared(lobby);
        }

        emit PhaseAdvanced(lobby, previous, nextPhase, state.round);
    }

    function _ensureRegistered(address lobby) private view {
        if (!_registered[lobby]) revert LobbyNotRegistered();
    }

    function _validateTransition(GameTypes.Phase fromPhase, GameTypes.Phase toPhase) private pure {
        if (fromPhase == GameTypes.Phase.Lobby) {
            if (toPhase != GameTypes.Phase.Day) revert InvalidTransition(fromPhase, toPhase);
            return;
        }

        if (fromPhase == GameTypes.Phase.Day) {
            if (
                toPhase != GameTypes.Phase.Night &&
                toPhase != GameTypes.Phase.Resolution &&
                toPhase != GameTypes.Phase.Completed
            ) revert InvalidTransition(fromPhase, toPhase);
            return;
        }

        if (fromPhase == GameTypes.Phase.Night) {
            if (toPhase != GameTypes.Phase.Resolution && toPhase != GameTypes.Phase.Completed)
                revert InvalidTransition(fromPhase, toPhase);
            return;
        }

        if (fromPhase == GameTypes.Phase.Resolution) {
            if (toPhase != GameTypes.Phase.Day && toPhase != GameTypes.Phase.Completed)
                revert InvalidTransition(fromPhase, toPhase);
            return;
        }

        if (fromPhase == GameTypes.Phase.Completed) revert InvalidTransition(fromPhase, toPhase);
    }
}
