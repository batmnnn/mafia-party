// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {INightAbility} from "../interfaces/INightAbility.sol";
import {GameTypes} from "../GameTypes.sol";

/// @title KillAbility
/// @notice Simple ability that instructs the resolver to eliminate the target.
contract KillAbility is INightAbility {
    address public immutable executor;

    event KillQueued(address indexed lobby, address indexed actor, address indexed target);

    error NotExecutor();
    error InvalidTarget();
    error InvalidExecutor();

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

        emit KillQueued(lobby, actor, target);

        effect = GameTypes.AbilityEffect({
            effectType: GameTypes.AbilityEffectType.Kill,
            target: target,
            data: ""
        });
    }
}
