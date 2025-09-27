// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {GameTypes} from "./GameTypes.sol";

/// @title PlayerState
/// @notice Tracks per-lobby player flags such as protection and investigation notes.
contract PlayerState {
    event ProtectionApplied(address indexed lobby, uint32 indexed round, address indexed player, uint32 expiresRound);
    event ProtectionCleared(address indexed lobby, uint32 indexed round, address indexed player);
    event InvestigationRecorded(
        address indexed lobby,
        uint32 indexed round,
        address indexed investigator,
        address target,
        bool isMafia
    );
    event RoleblockApplied(address indexed lobby, uint32 indexed round, address indexed player, uint32 expiresRound);
    event RoleblockCleared(address indexed lobby, uint32 indexed round, address indexed player);

    error InvalidLobby();
    error InvalidInvestigator();
    error InvalidTarget();

    struct ProtectionRecord {
        uint32 round;
        uint32 expiresRound;
    }

    mapping(address => mapping(address => ProtectionRecord)) private _protections;
    struct InvestigationRecord {
        uint32 round;
        address target;
        bool isMafia;
    }

    mapping(address => mapping(address => InvestigationRecord)) private _investigations;
    struct RoleblockRecord {
        uint32 round;
        uint32 expiresRound;
    }

    mapping(address => mapping(address => RoleblockRecord)) private _roleblocks;

    function applyProtection(address lobby, address player, uint32 round, uint32 duration) external {
        if (lobby == address(0) || player == address(0)) revert InvalidLobby();
        uint32 expiry = round + duration;
        _protections[lobby][player] = ProtectionRecord({round: round, expiresRound: expiry});
        emit ProtectionApplied(lobby, round, player, expiry);
    }

    function clearProtection(address lobby, address player, uint32 round) external {
        if (_protections[lobby][player].round != 0) {
            delete _protections[lobby][player];
            emit ProtectionCleared(lobby, round, player);
        }
    }

    function isProtected(address lobby, address player, uint32 round) external view returns (bool) {
        ProtectionRecord memory record = _protections[lobby][player];
        return record.round != 0 && round <= record.expiresRound;
    }

    function recordInvestigationResult(
        address lobby,
        address investigator,
        address target,
        bool isMafia,
        uint32 round
    ) external {
        if (lobby == address(0)) revert InvalidLobby();
        if (investigator == address(0)) revert InvalidInvestigator();
        if (target == address(0)) revert InvalidTarget();

        _investigations[lobby][investigator] = InvestigationRecord({
            round: round,
            target: target,
            isMafia: isMafia
        });

        emit InvestigationRecorded(lobby, round, investigator, target, isMafia);
    }

    function getInvestigationResult(address lobby, address investigator)
        external
        view
        returns (InvestigationRecord memory)
    {
        return _investigations[lobby][investigator];
    }

    function applyRoleblock(address lobby, address player, uint32 round, uint32 duration) external {
        if (lobby == address(0) || player == address(0)) revert InvalidLobby();
        uint32 expiry = round + duration;
        _roleblocks[lobby][player] = RoleblockRecord({round: round, expiresRound: expiry});
        emit RoleblockApplied(lobby, round, player, expiry);
    }

    function clearRoleblock(address lobby, address player, uint32 round) external {
        if (_roleblocks[lobby][player].round != 0) {
            delete _roleblocks[lobby][player];
            emit RoleblockCleared(lobby, round, player);
        }
    }

    function isRoleblocked(address lobby, address player, uint32 round) external view returns (bool) {
        RoleblockRecord memory record = _roleblocks[lobby][player];
        return record.round != 0 && round <= record.expiresRound;
    }
}
