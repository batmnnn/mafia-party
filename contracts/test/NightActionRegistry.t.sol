// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import {LobbyRegistry} from "../src/LobbyRegistry.sol";
import {GameLobby} from "../src/GameLobby.sol";
import {GameTypes} from "../src/GameTypes.sol";
import {PhaseEngine} from "../src/PhaseEngine.sol";
import {ActionValidator} from "../src/ActionValidator.sol";
import {NightActionRegistry} from "../src/NightActionRegistry.sol";

contract NightActionRegistryTest is Test {
	LobbyRegistry internal registry;
	PhaseEngine internal engine;
	ActionValidator internal validator;
	NightActionRegistry internal nightRegistry;
	address internal lobby;

	address internal constant PLAYER_ONE = address(0xBEEF);
	address internal constant PLAYER_TWO = address(0xCAFE);

	function setUp() public {
		registry = new LobbyRegistry();
		engine = new PhaseEngine(address(registry));
		validator = new ActionValidator(address(engine), address(this));
		nightRegistry = new NightActionRegistry(address(engine), address(validator));
		nightRegistry.setResolverAuthority(address(this));
		registry.setPhaseEngine(address(engine));

		GameTypes.LobbyConfig memory config = GameTypes.LobbyConfig({
			minPlayers: 2,
			maxPlayers: 6,
			isPrivate: false,
			joinTimeoutSeconds: 0
		});

		(, lobby) = registry.createLobby(config, bytes32(0), "ipfs://metadata.json");

		vm.prank(PLAYER_ONE);
		GameLobby(lobby).join("");

		vm.prank(PLAYER_TWO);
		GameLobby(lobby).join("");
	}

	function testSubmitActionStoresRecord() public {
		uint32 round = _enterNightPhase();
		bytes memory data = abi.encodePacked(uint8(1));

		vm.prank(PLAYER_ONE);
		uint256 index = nightRegistry.submitAction(lobby, PLAYER_TWO, data);
		assertEq(index, 0);
		assertTrue(nightRegistry.hasSubmitted(lobby, round, PLAYER_ONE));

		GameTypes.NightAction[] memory actions = nightRegistry.getActions(lobby, round);
		assertEq(actions.length, 1);
		assertEq(actions[0].actor, PLAYER_ONE);
		assertEq(actions[0].target, PLAYER_TWO);
		assertTrue(keccak256(actions[0].data) == keccak256(data));
		assertTrue(actions[0].consumed == false);
	}

	function testCannotSubmitOutsideNight() public {
		vm.prank(PLAYER_ONE);
		vm.expectRevert(NightActionRegistry.RoundNotInitialized.selector);
		nightRegistry.submitAction(lobby, PLAYER_TWO, "");
	}

	function testDuplicateSubmissionReverts() public {
		_enterNightPhase();

		vm.prank(PLAYER_ONE);
		nightRegistry.submitAction(lobby, PLAYER_TWO, "payload");

		vm.prank(PLAYER_ONE);
		vm.expectRevert(NightActionRegistry.DuplicateAction.selector);
		nightRegistry.submitAction(lobby, PLAYER_TWO, "payload");
	}

	function testMarkActionConsumed() public {
		uint32 round = _enterNightPhase();

		vm.prank(PLAYER_ONE);
		nightRegistry.submitAction(lobby, PLAYER_TWO, "payload");

		nightRegistry.markActionConsumed(lobby, round, PLAYER_ONE);

		GameTypes.NightAction[] memory actions = nightRegistry.getActions(lobby, round);
		assertTrue(actions[0].consumed);
	}

	function testResolverGuard() public {
		uint32 round = _enterNightPhase();

		vm.prank(PLAYER_ONE);
		nightRegistry.submitAction(lobby, PLAYER_TWO, "payload");

		nightRegistry.setResolverAuthority(address(0xABCD));

		vm.prank(address(0xCAFE));
		vm.expectRevert(NightActionRegistry.NotResolver.selector);
		nightRegistry.markActionConsumed(lobby, round, PLAYER_ONE);

		vm.prank(address(0xABCD));
		nightRegistry.markActionConsumed(lobby, round, PLAYER_ONE);
	}

	function testEliminatedActorsCannotSubmit() public {
		_enterNightPhase();
		validator.markEliminated(lobby, PLAYER_ONE);

		vm.prank(PLAYER_ONE);
		vm.expectRevert(ActionValidator.PlayerEliminated.selector);
		nightRegistry.submitAction(lobby, PLAYER_TWO, "payload");
	}

	function _enterNightPhase() internal returns (uint32 round) {
		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Day, 0, GameTypes.Phase.Night);

		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Night, 0, GameTypes.Phase.Resolution);

		round = engine.getPhaseState(lobby).round;
	}
}
