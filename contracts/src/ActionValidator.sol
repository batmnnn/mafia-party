// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {PhaseEngine} from "./PhaseEngine.sol";
import {GameTypes} from "./GameTypes.sol";

/// @title ActionValidator
/// @notice Enforces phase alignment and alive-status constraints for lobby actions.
contract ActionValidator {
    error InvalidPhaseEngine();
    error InvalidAuthority();
    error NotAuthority();
    error NotOwner();
    error PlayerNotParticipant();
    error PlayerEliminated();
    error InvalidPhase(GameTypes.Phase expected, GameTypes.Phase actual);

    PhaseEngine public immutable phaseEngine;
    address public eliminationAuthority;
    address public owner;

    mapping(address => mapping(address => bool)) private _eliminated;

    event EliminationAuthorityUpdated(address indexed authority);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PlayerMarkedEliminated(address indexed lobby, address indexed player);

    constructor(address phaseEngineAddress, address eliminationAuthority_) {
        if (phaseEngineAddress == address(0)) revert InvalidPhaseEngine();
        phaseEngine = PhaseEngine(phaseEngineAddress);
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);

        if (eliminationAuthority_ != address(0)) {
            eliminationAuthority = eliminationAuthority_;
            emit EliminationAuthorityUpdated(eliminationAuthority_);
        }
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAuthority() {
        if (msg.sender != eliminationAuthority) revert NotAuthority();
        _;
    }

    /// @notice Registers a new authority allowed to mark eliminations.
    function setEliminationAuthority(address authority) external onlyOwner {
        if (authority == address(0)) revert InvalidAuthority();
        eliminationAuthority = authority;
        emit EliminationAuthorityUpdated(authority);
    }

    /// @notice Transfers ownership of the validator contract.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "INVALID_OWNER");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Marks a player as eliminated, preventing further actions.
    function markEliminated(address lobby, address player) external onlyAuthority {
        _ensureParticipant(lobby, player);
        _eliminated[lobby][player] = true;
        emit PlayerMarkedEliminated(lobby, player);
    }

    /// @notice Returns true if the player is alive (joined and not eliminated).
    function isAlive(address lobby, address player) public view returns (bool) {
        if (_eliminated[lobby][player]) {
            return false;
        }
        return _hasJoined(lobby, player);
    }

    /// @notice Ensures the actor may perform a day-phase action.
    function validateDayAction(address lobby, address actor) external view {
        _validatePhase(lobby, GameTypes.Phase.Day);
        _ensureAlive(lobby, actor);
    }

    /// @notice Ensures the actor may perform a night-phase action.
    function validateNightAction(address lobby, address actor, address target) external view {
        _validatePhase(lobby, GameTypes.Phase.Night);
        _ensureAlive(lobby, actor);
        if (target != address(0)) {
            _ensureAlive(lobby, target);
        }
    }

    function _validatePhase(address lobby, GameTypes.Phase expected) internal view {
        GameTypes.PhaseState memory state = phaseEngine.getPhaseState(lobby);
        if (state.currentPhase != expected) {
            revert InvalidPhase(expected, state.currentPhase);
        }
    }

    function _ensureAlive(address lobby, address player) internal view {
        if (!_hasJoined(lobby, player)) revert PlayerNotParticipant();
        if (_eliminated[lobby][player]) revert PlayerEliminated();
    }

    function _ensureParticipant(address lobby, address player) internal view {
        if (!_hasJoined(lobby, player)) revert PlayerNotParticipant();
    }

    function _hasJoined(address lobby, address player) internal view returns (bool joined) {
        (bool success, bytes memory data) = lobby.staticcall(abi.encodeWithSignature("hasJoined(address)", player));
        if (!success || data.length == 0) return false;
        joined = abi.decode(data, (bool));
    }
}
