// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {PhaseEngine} from "./PhaseEngine.sol";
import {ActionValidator} from "./ActionValidator.sol";
import {GameTypes} from "./GameTypes.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

/// @title NightActionRegistry
/// @notice Collects night-phase actions for deferred execution while enforcing phase and alive checks.
contract NightActionRegistry is ReentrancyGuard {
    event NightActionSubmitted(
        address indexed lobby,
        uint32 indexed round,
        address indexed actor,
        address target,
        bytes data
    );

    event NightActionConsumed(address indexed lobby, uint32 indexed round, address indexed actor);
    event ResolverAuthorityUpdated(address indexed resolverAuthority);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error InvalidPhaseEngine();
    error InvalidActionValidator();
    error InvalidResolverAuthority();
    error NotOwner();
    error NotResolver();
    error InvalidPhase(GameTypes.Phase expected, GameTypes.Phase actual);
    error RoundNotInitialized();
    error DuplicateAction();
    error ActionNotFound();
    error ActionAlreadyConsumed();

    PhaseEngine public immutable phaseEngine;
    ActionValidator public immutable actionValidator;

    address public owner;
    address public resolverAuthority;

    mapping(address => mapping(uint32 => GameTypes.NightAction[])) private _actions;
    mapping(address => mapping(uint32 => mapping(address => uint256))) private _actionIndex;
    mapping(address => mapping(uint32 => mapping(address => bool))) private _actorHasAction;

    constructor(address phaseEngineAddress, address actionValidatorAddress) {
        if (phaseEngineAddress == address(0)) revert InvalidPhaseEngine();
        if (actionValidatorAddress == address(0)) revert InvalidActionValidator();

        phaseEngine = PhaseEngine(phaseEngineAddress);
        actionValidator = ActionValidator(actionValidatorAddress);
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyResolver() {
        if (msg.sender != resolverAuthority && msg.sender != owner) revert NotResolver();
        _;
    }

    /// @notice Submits a night action for the calling actor.
    function submitAction(address lobby, address target, bytes calldata data) external nonReentrant returns (uint256) {
        GameTypes.PhaseState memory state = phaseEngine.getPhaseState(lobby);
        if (state.round == 0) revert RoundNotInitialized();
        if (state.currentPhase != GameTypes.Phase.Night) {
            revert InvalidPhase(GameTypes.Phase.Night, state.currentPhase);
        }

        actionValidator.validateNightAction(lobby, msg.sender, target);

        if (_actorHasAction[lobby][state.round][msg.sender]) revert DuplicateAction();

        GameTypes.NightAction memory action = GameTypes.NightAction({
            actor: msg.sender,
            target: target,
            data: data,
            consumed: false
        });

        _actions[lobby][state.round].push(action);
        uint256 index = _actions[lobby][state.round].length - 1;
        _actionIndex[lobby][state.round][msg.sender] = index;
        _actorHasAction[lobby][state.round][msg.sender] = true;

        emit NightActionSubmitted(lobby, state.round, msg.sender, target, data);
        return index;
    }

    /// @notice Returns all recorded actions for a lobby/round.
    function getActions(address lobby, uint32 round) external view returns (GameTypes.NightAction[] memory) {
        return _actions[lobby][round];
    }

    /// @notice Returns whether an actor has submitted an action for a lobby/round.
    function hasSubmitted(address lobby, uint32 round, address actor) external view returns (bool) {
        return _actorHasAction[lobby][round][actor];
    }

    /// @notice Marks an action as consumed by the resolver authority.
    function markActionConsumed(address lobby, uint32 round, address actor) external onlyResolver {
        if (!_actorHasAction[lobby][round][actor]) revert ActionNotFound();
        uint256 index = _actionIndex[lobby][round][actor];
        GameTypes.NightAction storage action = _actions[lobby][round][index];
        if (action.actor != actor) revert ActionNotFound();
        if (action.consumed) revert ActionAlreadyConsumed();

        action.consumed = true;
        emit NightActionConsumed(lobby, round, actor);
    }

    /// @notice Updates the resolver authority allowed to consume actions.
    function setResolverAuthority(address resolver) external onlyOwner {
        if (resolver == address(0)) revert InvalidResolverAuthority();
        resolverAuthority = resolver;
        emit ResolverAuthorityUpdated(resolver);
    }

    /// @notice Transfers contract ownership.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "INVALID_OWNER");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
