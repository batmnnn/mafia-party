// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {INightAbility} from "../interfaces/INightAbility.sol";
import {GameTypes} from "../GameTypes.sol";

/// @title InvestigateAbility
/// @notice Ability that reveals alignment information about a target player.
contract InvestigateAbility is INightAbility {
    struct AlignmentRecord {
        bool isSet;
        bool isMafia;
    }

    address public immutable executor;
    address public owner;

    mapping(address => AlignmentRecord) private _alignments;

    event InvestigationQueued(
        address indexed lobby,
        address indexed actor,
        address indexed target,
        bool isMafia
    );
    event AlignmentUpdated(address indexed player, bool isMafia);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error InvalidExecutor();
    error InvalidOwner();
    error NotExecutor();
    error NotOwner();
    error InvalidTarget();
    error InvalidArrayLength();
    error AlignmentNotConfigured();

    constructor(address executor_) {
        if (executor_ == address(0)) revert InvalidExecutor();
        executor = executor_;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setAlignment(address player, bool isMafia) public onlyOwner {
        if (player == address(0)) revert InvalidTarget();
        _alignments[player] = AlignmentRecord({isSet: true, isMafia: isMafia});
        emit AlignmentUpdated(player, isMafia);
    }

    function setAlignments(address[] calldata players, bool[] calldata flags) external onlyOwner {
        if (players.length != flags.length) revert InvalidArrayLength();
        for (uint256 i = 0; i < players.length; i++) {
            setAlignment(players[i], flags[i]);
        }
    }

    function executeNightAction(
        address lobby,
        address actor,
        address target,
        bytes calldata /* payload */
    ) external override returns (GameTypes.AbilityEffect memory effect) {
        if (msg.sender != executor) revert NotExecutor();
        if (target == address(0)) revert InvalidTarget();

        AlignmentRecord memory record = _alignments[target];
        if (!record.isSet) revert AlignmentNotConfigured();

        emit InvestigationQueued(lobby, actor, target, record.isMafia);

        effect = GameTypes.AbilityEffect({
            effectType: GameTypes.AbilityEffectType.Investigate,
            target: actor,
            data: abi.encode(target, record.isMafia)
        });
    }

    function getAlignment(address player) external view returns (AlignmentRecord memory) {
        return _alignments[player];
    }
}
