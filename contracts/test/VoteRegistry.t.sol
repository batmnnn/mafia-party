// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import {LobbyRegistry} from "../src/LobbyRegistry.sol";
import {GameLobby} from "../src/GameLobby.sol";
import {GameTypes} from "../src/GameTypes.sol";
import {PhaseEngine} from "../src/PhaseEngine.sol";
import {VoteRegistry} from "../src/VoteRegistry.sol";

contract VoteRegistryTest is Test {
	LobbyRegistry internal registry;
	PhaseEngine internal engine;
	VoteRegistry internal voteRegistry;
	address internal lobby;

	address internal constant PLAYER_ONE = address(0xBEEF);
	address internal constant PLAYER_TWO = address(0xCAFE);

	function setUp() public {
		registry = new LobbyRegistry();
		engine = new PhaseEngine(address(registry));
		voteRegistry = new VoteRegistry(address(engine));
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

	function testSubmitVoteRequiresDayPhase() public {
		bytes32 commitment = _makeCommitment(PLAYER_ONE, PLAYER_TWO, bytes32("salt"), 0);

		vm.prank(PLAYER_ONE);
		vm.expectRevert(VoteRegistry.RoundNotInitialized.selector);
		voteRegistry.submitVote(lobby, commitment);
	}

	function testCommitAndRevealTalliesVote() public {
		_enterDayPhase();

		bytes32 salt = keccak256("salt-one");
		GameTypes.PhaseState memory state = engine.getPhaseState(lobby);
		bytes32 commitment = _makeCommitment(PLAYER_ONE, PLAYER_TWO, salt, state.round);

		vm.prank(PLAYER_ONE);
		voteRegistry.submitVote(lobby, commitment);

		GameTypes.VoteRecord memory record = voteRegistry.getVoteRecord(lobby, state.round, PLAYER_ONE);
		assertTrue(record.commitment == commitment);
		assertTrue(record.revealed == false);

		_transitionToResolution();

		vm.prank(PLAYER_ONE);
		voteRegistry.revealVote(lobby, PLAYER_TWO, salt);

		GameTypes.VoteRecord memory afterReveal = voteRegistry.getVoteRecord(lobby, state.round, PLAYER_ONE);
		assertTrue(afterReveal.revealed);
		assertEq(afterReveal.target, PLAYER_TWO);
		assertEq(voteRegistry.getTally(lobby, state.round, PLAYER_TWO), 1);
	}

	function testRevealRejectedInNightPhase() public {
		_enterDayPhase();

		bytes32 salt = keccak256("salt-two");
		uint32 round = engine.getPhaseState(lobby).round;
		bytes32 commitment = _makeCommitment(PLAYER_ONE, address(0), salt, round);

		vm.prank(PLAYER_ONE);
		voteRegistry.submitVote(lobby, commitment);

		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Night, 0, GameTypes.Phase.Resolution);

		vm.prank(PLAYER_ONE);
		vm.expectRevert(abi.encodeWithSelector(VoteRegistry.InvalidRevealPhase.selector, GameTypes.Phase.Night));
		voteRegistry.revealVote(lobby, address(0), salt);

		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Resolution, 0, GameTypes.Phase.Day);

		vm.prank(PLAYER_ONE);
		voteRegistry.revealVote(lobby, address(0), salt);
		assertEq(voteRegistry.getTally(lobby, round, address(0)), 1);
	}

	function testCannotCommitTwiceSameRound() public {
		_enterDayPhase();
		uint32 round = engine.getPhaseState(lobby).round;

		bytes32 salt = keccak256("salt-three");
		bytes32 commitment = _makeCommitment(PLAYER_ONE, PLAYER_TWO, salt, round);

		vm.prank(PLAYER_ONE);
		voteRegistry.submitVote(lobby, commitment);

		vm.prank(PLAYER_ONE);
		vm.expectRevert(VoteRegistry.AlreadyCommitted.selector);
		voteRegistry.submitVote(lobby, commitment);
	}

	function testNewRoundAllowsFreshCommit() public {
		_enterDayPhase();
		uint32 roundOne = engine.getPhaseState(lobby).round;

		bytes32 saltOne = keccak256("salt-four");
		bytes32 commitmentOne = _makeCommitment(PLAYER_ONE, PLAYER_TWO, saltOne, roundOne);

		vm.prank(PLAYER_ONE);
		voteRegistry.submitVote(lobby, commitmentOne);

		_transitionToResolution();

		vm.prank(PLAYER_ONE);
		voteRegistry.revealVote(lobby, PLAYER_TWO, saltOne);

		// start new day -> round increments
		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Day, 0, GameTypes.Phase.Night);
		uint32 roundTwo = engine.getPhaseState(lobby).round;
		assertEq(roundTwo, roundOne + 1);

		bytes32 saltTwo = keccak256("salt-five");
		bytes32 commitmentTwo = _makeCommitment(PLAYER_ONE, PLAYER_TWO, saltTwo, roundTwo);

		vm.prank(PLAYER_ONE);
		voteRegistry.submitVote(lobby, commitmentTwo);

		GameTypes.VoteRecord memory record = voteRegistry.getVoteRecord(lobby, roundTwo, PLAYER_ONE);
		assertTrue(record.commitment == commitmentTwo);
	}

	function _enterDayPhase() internal {
		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Day, 0, GameTypes.Phase.Night);
	}

	function _transitionToResolution() internal {
		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Night, 0, GameTypes.Phase.Resolution);

		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Resolution, 0, GameTypes.Phase.Day);
	}

	function _makeCommitment(
		address voter,
		address target,
		bytes32 salt,
		uint32 round
	) internal view returns (bytes32) {
		return keccak256(abi.encodePacked(lobby, round, voter, target, salt));
	}
}
