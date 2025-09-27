// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import {LobbyRegistry} from "../src/LobbyRegistry.sol";
import {GameLobby} from "../src/GameLobby.sol";
import {GameTypes} from "../src/GameTypes.sol";
import {PhaseEngine} from "../src/PhaseEngine.sol";
import {VoteRegistry} from "../src/VoteRegistry.sol";
import {EliminationEngine} from "../src/EliminationEngine.sol";
import {ActionValidator} from "../src/ActionValidator.sol";

contract EliminationEngineTest is Test {
	LobbyRegistry internal registry;
	PhaseEngine internal engine;
	VoteRegistry internal voteRegistry;
	EliminationEngine internal elimination;
	ActionValidator internal validator;
	address internal lobby;

	address internal constant PLAYER_ONE = address(0xBEEF);
	address internal constant PLAYER_TWO = address(0xCAFE);
	address internal constant PLAYER_THREE = address(0xD00D);

	function setUp() public {
		registry = new LobbyRegistry();
		engine = new PhaseEngine(address(registry));
		voteRegistry = new VoteRegistry(address(engine));
		elimination = new EliminationEngine(address(engine), address(voteRegistry));
		validator = new ActionValidator(address(engine), address(0));
		registry.setPhaseEngine(address(engine));
		validator.setEliminationAuthority(address(elimination));
		elimination.setActionValidator(address(validator));

		GameTypes.LobbyConfig memory config = GameTypes.LobbyConfig({
			minPlayers: 3,
			maxPlayers: 6,
			isPrivate: false,
			joinTimeoutSeconds: 0
		});

		(, lobby) = registry.createLobby(config, bytes32(0), "ipfs://metadata.json");

		vm.prank(PLAYER_ONE);
		GameLobby(lobby).join("");

		vm.prank(PLAYER_TWO);
		GameLobby(lobby).join("");

		vm.prank(PLAYER_THREE);
		GameLobby(lobby).join("");
	}

	function testResolveDayEliminatesHighestVotes() public {
		uint32 round = _startDayAndGetRound();

		bytes32 salt = keccak256("salt-majority");
		bytes32 commitmentCreator = _commitment(address(this), PLAYER_TWO, salt, round);
		vm.prank(address(this));
		voteRegistry.submitVote(lobby, commitmentCreator);

		bytes32 commitmentOne = _commitment(PLAYER_ONE, PLAYER_TWO, salt, round);
		vm.prank(PLAYER_ONE);
		voteRegistry.submitVote(lobby, commitmentOne);

		_transitionToResolution();

		vm.prank(address(this));
		voteRegistry.revealVote(lobby, PLAYER_TWO, salt);
		vm.prank(PLAYER_ONE);
		voteRegistry.revealVote(lobby, PLAYER_TWO, salt);

		(address eliminated, bool didEliminate) = elimination.resolveDay(lobby);

		assertTrue(didEliminate);
		assertEq(eliminated, PLAYER_TWO);
		assertTrue(validator.isAlive(lobby, PLAYER_TWO) == false);
	}

	function testResolveDayTieReturnsNoElimination() public {
		uint32 round = _startDayAndGetRound();

		bytes32 saltOne = keccak256("salt-tie-1");
		bytes32 saltTwo = keccak256("salt-tie-2");

		vm.prank(address(this));
		voteRegistry.submitVote(lobby, _commitment(address(this), PLAYER_ONE, saltOne, round));
		vm.prank(PLAYER_ONE);
		voteRegistry.submitVote(lobby, _commitment(PLAYER_ONE, PLAYER_TWO, saltTwo, round));

		_transitionToResolution();

		vm.prank(address(this));
		voteRegistry.revealVote(lobby, PLAYER_ONE, saltOne);
		vm.prank(PLAYER_ONE);
		voteRegistry.revealVote(lobby, PLAYER_TWO, saltTwo);

		(address eliminated, bool didEliminate) = elimination.resolveDay(lobby);

		assertTrue(didEliminate == false);
		assertEq(eliminated, address(0));
	}

	function testResolveDayNoVotes() public {
		_startDayAndGetRound();
		_transitionToResolution();

		(address eliminated, bool didEliminate) = elimination.resolveDay(lobby);
		assertTrue(didEliminate == false);
		assertEq(eliminated, address(0));
	}

	function testResolveRequiresResolutionPhase() public {
		_startDayAndGetRound();
		vm.expectRevert(abi.encodeWithSelector(EliminationEngine.InvalidPhase.selector, GameTypes.Phase.Resolution, GameTypes.Phase.Day));
		elimination.resolveDay(lobby);
	}

	function _startDayAndGetRound() internal returns (uint32) {
		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Day, 0, GameTypes.Phase.Night);
		return engine.getPhaseState(lobby).round;
	}

	function _transitionToResolution() internal {
		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Night, 0, GameTypes.Phase.Resolution);

		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Resolution, 0, GameTypes.Phase.Day);
	}

	function _commitment(
		address voter,
		address target,
		bytes32 salt,
		uint32 round
	) internal view returns (bytes32) {
		return keccak256(abi.encodePacked(lobby, round, voter, target, salt));
	}
}
