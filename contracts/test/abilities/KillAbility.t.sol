// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import {KillAbility} from "../../src/abilities/KillAbility.sol";
import {GameTypes} from "../../src/GameTypes.sol";

contract KillAbilityTest is Test {
	address internal constant EXECUTOR = address(0xA11CE);
	KillAbility internal ability;

	function setUp() public {
		ability = new KillAbility(EXECUTOR);
	}

	function testExecuteReturnsKillEffect() public {
		vm.prank(EXECUTOR);
		GameTypes.AbilityEffect memory effect = ability.executeNightAction(
			address(0x1),
			address(0x2),
			address(0x3),
			bytes("")
		);

		assertEq(uint256(effect.effectType), uint256(GameTypes.AbilityEffectType.Kill));
		assertEq(effect.target, address(0x3));
	}

	function testRevertsForUnauthorizedCaller() public {
		vm.expectRevert(KillAbility.NotExecutor.selector);
		GameTypes.AbilityEffect memory effect = ability.executeNightAction(
			address(0x1),
			address(0x2),
			address(0x3),
			bytes("")
		);
		effect;
	}

	function testRevertsForZeroTarget() public {
		vm.prank(EXECUTOR);
		vm.expectRevert(KillAbility.InvalidTarget.selector);
		GameTypes.AbilityEffect memory effect = ability.executeNightAction(
			address(0x1),
			address(0x2),
			address(0),
			bytes("")
		);
		effect;
	}
}
