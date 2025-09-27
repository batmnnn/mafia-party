// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import {InvestigateAbility} from "../../src/abilities/InvestigateAbility.sol";
import {GameTypes} from "../../src/GameTypes.sol";

contract InvestigateAbilityTest is Test {
	address internal constant EXECUTOR = address(0xA11CE);
	address internal constant TARGET = address(0xBEEF);
	address internal constant ACTOR = address(0xCAFE);

	InvestigateAbility internal ability;

	function setUp() public {
		ability = new InvestigateAbility(EXECUTOR);
	}

	function testExecuteReturnsInvestigateEffect() public {
		ability.setAlignment(TARGET, true);

		vm.prank(EXECUTOR);
		GameTypes.AbilityEffect memory effect = ability.executeNightAction(
			address(0x1),
			ACTOR,
			TARGET,
			bytes("")
		);

		assertEq(uint256(effect.effectType), uint256(GameTypes.AbilityEffectType.Investigate));
		assertEq(effect.target, ACTOR);

		(address investigated, bool isMafia) = abi.decode(effect.data, (address, bool));
		assertEq(investigated, TARGET);
		assertTrue(isMafia);
	}

	function testRevertsWhenAlignmentNotConfigured() public {
		vm.prank(EXECUTOR);
		vm.expectRevert(InvestigateAbility.AlignmentNotConfigured.selector);
		GameTypes.AbilityEffect memory effect = ability.executeNightAction(
			address(0x1),
			ACTOR,
			TARGET,
			bytes("")
		);
		effect;
	}

	function testRevertsForUnauthorizedCaller() public {
		ability.setAlignment(TARGET, false);

		vm.expectRevert(InvestigateAbility.NotExecutor.selector);
		GameTypes.AbilityEffect memory effect = ability.executeNightAction(
			address(0x1),
			ACTOR,
			TARGET,
			bytes("")
		);
		effect;
	}

	function testRevertsForZeroTarget() public {
		ability.setAlignment(TARGET, false);

		vm.prank(EXECUTOR);
		vm.expectRevert(InvestigateAbility.InvalidTarget.selector);
		GameTypes.AbilityEffect memory effect = ability.executeNightAction(
			address(0x1),
			ACTOR,
			address(0),
			bytes("")
		);
		effect;
	}

	function testSetAlignmentsBatch() public {
		address[] memory players = new address[](2);
		players[0] = address(0x1);
		players[1] = address(0x2);

		bool[] memory flags = new bool[](2);
		flags[0] = true;
		flags[1] = false;

		ability.setAlignments(players, flags);

		InvestigateAbility.AlignmentRecord memory recordOne = ability.getAlignment(players[0]);
		assertTrue(recordOne.isSet);
		assertTrue(recordOne.isMafia);

		InvestigateAbility.AlignmentRecord memory recordTwo = ability.getAlignment(players[1]);
		assertTrue(recordTwo.isSet);
		assertTrue(!recordTwo.isMafia);
	}

	function testSetAlignmentsRevertsOnLengthMismatch() public {
		address[] memory players = new address[](1);
		players[0] = address(0x1);

		bool[] memory flags = new bool[](2);
		flags[0] = true;
		flags[1] = false;

		vm.expectRevert(InvestigateAbility.InvalidArrayLength.selector);
		ability.setAlignments(players, flags);
	}
}
