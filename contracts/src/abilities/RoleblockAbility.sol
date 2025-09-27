// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {INightAbility} from "../interfaces/INightAbility.sol";
import {GameTypes} from "../GameTypes.sol";

/// @title RoleblockAbility
/// @notice Ability that prevents a target player from acting during the current night.
contract RoleblockAbility is INightAbility {
    address public immutable executor;

    event RoleblockQueued(address indexed lobby, address indexed actor, address indexed target);

    error InvalidExecutor();
    error NotExecutor();
    error InvalidTarget();

    constructor(address executor_) {
        if (executor_ == address(0)) revert InvalidExecutor();
        executor = executor_;
    }

    function executeNightAction(
        address lobby,
        address actor,
        address target,
        bytes calldata /* payload */
    ) external override returns (GameTypes.AbilityEffect memory effect) {
        if (msg.sender != executor) revert NotExecutor();
        if (target == address(0)) revert InvalidTarget();

        emit RoleblockQueued(lobby, actor, target);

        effect = GameTypes.AbilityEffect({
            effectType: GameTypes.AbilityEffectType.Roleblock,
            target: target,
            data: ""
        });
    }
}
