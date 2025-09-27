// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import {LobbyRegistry} from "../src/LobbyRegistry.sol";
import {GameLobby} from "../src/GameLobby.sol";
import {GameTypes} from "../src/GameTypes.sol";
import {PhaseEngine} from "../src/PhaseEngine.sol";
import {ActionValidator} from "../src/ActionValidator.sol";

contract ActionValidatorTest is Test {
	LobbyRegistry internal registry;
	PhaseEngine internal engine;
	ActionValidator internal validator;
	address internal lobby;

	address internal constant PLAYER_ONE = address(0xBEEF);
	address internal constant PLAYER_TWO = address(0xCAFE);

	function setUp() public {
		registry = new LobbyRegistry();
		engine = new PhaseEngine(address(registry));
		validator = new ActionValidator(address(engine), address(this));
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

	function testValidateDayActionRequiresDayPhase() public {
		vm.expectRevert(abi.encodeWithSelector(ActionValidator.InvalidPhase.selector, GameTypes.Phase.Day, GameTypes.Phase.Lobby));
		validator.validateDayAction(lobby, PLAYER_ONE);

		_enterDayPhase();
		validator.validateDayAction(lobby, PLAYER_ONE);
	}

	function testValidateNightActionChecksTargets() public {
		_enterDayPhase();
		_transitionToNight();

		validator.validateNightAction(lobby, PLAYER_ONE, address(0));

		validator.markEliminated(lobby, PLAYER_ONE);

		vm.expectRevert(ActionValidator.PlayerEliminated.selector);
		validator.validateNightAction(lobby, PLAYER_ONE, PLAYER_TWO);
	}

	function testIsAliveReflectsElimination() public {
		_enterDayPhase();
		assertTrue(validator.isAlive(lobby, PLAYER_ONE));
		validator.markEliminated(lobby, PLAYER_ONE);
		assertTrue(validator.isAlive(lobby, PLAYER_ONE) == false);
	}

	function _enterDayPhase() internal {
		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Day, 0, GameTypes.Phase.Night);
	}

	function _transitionToNight() internal {
		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Night, 0, GameTypes.Phase.Resolution);
	}
}
