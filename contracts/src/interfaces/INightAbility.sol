// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {GameTypes} from "../GameTypes.sol";

/// @title INightAbility
/// @notice Ability contracts implement this interface to process night actions.
interface INightAbility {
    /// @notice Executes a night action for the given lobby context and returns its effect summary.
    /// @param lobby The lobby the action is associated with.
    /// @param actor The player performing the action.
    /// @param target The optional target of the action (zero address allowed).
    /// @param payload ABI-encoded ability-specific data.
    /// @return effect Structured effect data for the resolver to apply (e.g., kill target).
    function executeNightAction(
        address lobby,
        address actor,
        address target,
        bytes calldata payload
    ) external returns (GameTypes.AbilityEffect memory effect);
}
