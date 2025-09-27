// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {PhaseEngine} from "./PhaseEngine.sol";
import {ActionValidator} from "./ActionValidator.sol";
import {NightActionRegistry} from "./NightActionRegistry.sol";
import {GameTypes} from "./GameTypes.sol";
import {PlayerState} from "./PlayerState.sol";
import {INightAbility} from "./interfaces/INightAbility.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

/// @title NightActionResolver
/// @notice Executes queued night actions using registered ability handlers.
contract NightActionResolver is ReentrancyGuard {
    event AbilityRegistered(bytes32 indexed abilityId, address indexed ability);
    event AbilityUnregistered(bytes32 indexed abilityId);
    event NightActionExecuted(
        address indexed lobby,
        uint32 indexed round,
        address indexed actor,
        bytes32 abilityId,
        GameTypes.AbilityEffectType effectType,
        address target
    );
    event NightActionSkipped(address indexed lobby, uint32 indexed round, address indexed actor, bytes32 abilityId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error InvalidPhaseEngine();
    error InvalidActionValidator();
    error InvalidNightActionRegistry();
    error InvalidPlayerState();
    error InvalidAbility();
    error AbilityAlreadyRegistered();
    error AbilityNotRegistered();
    error NotOwner();
    error InvalidPhase(GameTypes.Phase expected, GameTypes.Phase actual);
    error RoundNotInitialized();

    PhaseEngine public immutable phaseEngine;
    ActionValidator public immutable actionValidator;
    NightActionRegistry public immutable nightRegistry;
    PlayerState public immutable playerState;

    mapping(bytes32 => address) private _abilities;

    address public owner;

    constructor(
        address phaseEngineAddress,
        address validatorAddress,
        address nightRegistryAddress,
        address playerStateAddress
    ) {
        if (phaseEngineAddress == address(0)) revert InvalidPhaseEngine();
        if (validatorAddress == address(0)) revert InvalidActionValidator();
        if (nightRegistryAddress == address(0)) revert InvalidNightActionRegistry();
        if (playerStateAddress == address(0)) revert InvalidPlayerState();

        phaseEngine = PhaseEngine(phaseEngineAddress);
        actionValidator = ActionValidator(validatorAddress);
        nightRegistry = NightActionRegistry(nightRegistryAddress);
        playerState = PlayerState(playerStateAddress);
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Registers an ability handler contract for a given identifier.
    function registerAbility(bytes32 abilityId, address ability) external onlyOwner {
        if (ability == address(0)) revert InvalidAbility();
        if (_abilities[abilityId] != address(0)) revert AbilityAlreadyRegistered();
        _abilities[abilityId] = ability;
        emit AbilityRegistered(abilityId, ability);
    }

    /// @notice Removes a previously registered ability handler.
    function unregisterAbility(bytes32 abilityId) external onlyOwner {
        if (_abilities[abilityId] == address(0)) revert AbilityNotRegistered();
        delete _abilities[abilityId];
        emit AbilityUnregistered(abilityId);
    }

    /// @notice Transfers ownership of the resolver.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "INVALID_OWNER");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Resolves all queued night actions for a lobby.
    function resolveNight(address lobby) external nonReentrant {
        GameTypes.PhaseState memory state = phaseEngine.getPhaseState(lobby);
        if (state.round == 0) revert RoundNotInitialized();
        if (state.currentPhase != GameTypes.Phase.Night) {
            revert InvalidPhase(GameTypes.Phase.Night, state.currentPhase);
        }

        GameTypes.NightAction[] memory actions = nightRegistry.getActions(lobby, state.round);

        for (uint256 i = 0; i < actions.length; i++) {
            GameTypes.NightAction memory action = actions[i];
            if (action.consumed) {
                continue;
            }

            (bytes32 abilityId, bytes memory payload) = _decodeAbilityData(action.data);

            if (playerState.isRoleblocked(lobby, action.actor, state.round)) {
                nightRegistry.markActionConsumed(lobby, state.round, action.actor);
                playerState.clearRoleblock(lobby, action.actor, state.round);
                emit NightActionSkipped(lobby, state.round, action.actor, abilityId);
                continue;
            }

            address ability = _abilities[abilityId];
            if (ability == address(0)) {
                revert AbilityNotRegistered();
            }

            bool actorAlive = actionValidator.isAlive(lobby, action.actor);
            bool targetAlive = action.target == address(0) || actionValidator.isAlive(lobby, action.target);

            if (!actorAlive || !targetAlive) {
                nightRegistry.markActionConsumed(lobby, state.round, action.actor);
                emit NightActionSkipped(lobby, state.round, action.actor, abilityId);
                continue;
            }

            GameTypes.AbilityEffect memory effect = INightAbility(ability).executeNightAction(
                lobby,
                action.actor,
                action.target,
                payload
            );

            if (effect.effectType == GameTypes.AbilityEffectType.Protect) {
                address protectTarget = effect.target == address(0) ? action.target : effect.target;
                playerState.applyProtection(lobby, protectTarget, state.round, 1);
            } else if (effect.effectType == GameTypes.AbilityEffectType.Kill) {
                address killTarget = effect.target == address(0) ? action.target : effect.target;
                bool protectedTarget = playerState.isProtected(lobby, killTarget, state.round);
                if (!protectedTarget) {
                    actionValidator.markEliminated(lobby, killTarget);
                } else {
                    playerState.clearProtection(lobby, killTarget, state.round);
                }
            } else if (effect.effectType == GameTypes.AbilityEffectType.Roleblock) {
                address roleblockTarget = effect.target == address(0) ? action.target : effect.target;
                _applyRoleblockEffect(lobby, roleblockTarget, state.round);
            } else if (effect.effectType == GameTypes.AbilityEffectType.Investigate) {
                _applyInvestigationEffect(lobby, action.actor, effect, state.round);
            }

            nightRegistry.markActionConsumed(lobby, state.round, action.actor);

            address emittedTarget = effect.target;
            if (effect.effectType == GameTypes.AbilityEffectType.Investigate) {
                if (emittedTarget == address(0)) {
                    emittedTarget = action.actor;
                }
            } else if (emittedTarget == address(0)) {
                emittedTarget = action.target;
            }

            emit NightActionExecuted(
                lobby,
                state.round,
                action.actor,
                abilityId,
                effect.effectType,
                emittedTarget
            );
        }
    }

    function _applyRoleblockEffect(address lobby, address target, uint32 round) internal {
        if (target == address(0)) revert InvalidAbility();
        playerState.applyRoleblock(lobby, target, round, 1);
    }

    function _applyInvestigationEffect(
        address lobby,
        address actor,
        GameTypes.AbilityEffect memory effect,
        uint32 round
    ) internal {
        (address investigated, bool isMafia) = abi.decode(effect.data, (address, bool));
        if (investigated == address(0)) revert InvalidAbility();

        address investigationRecipient = effect.target == address(0) ? actor : effect.target;
        playerState.recordInvestigationResult(lobby, investigationRecipient, investigated, isMafia, round);
    }

    function _decodeAbilityData(bytes memory data) private pure returns (bytes32 abilityId, bytes memory payload) {
        if (data.length == 0) revert InvalidAbility();
        (abilityId, payload) = abi.decode(data, (bytes32, bytes));
    }

    /// @notice Returns the ability handler address for a given identifier.
    function getAbility(bytes32 abilityId) external view returns (address) {
        return _abilities[abilityId];
    }
}
