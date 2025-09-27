// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import {LobbyRegistry} from "../src/LobbyRegistry.sol";
import {GameLobby} from "../src/GameLobby.sol";
import {GameTypes} from "../src/GameTypes.sol";
import {PhaseEngine} from "../src/PhaseEngine.sol";
import {ActionValidator} from "../src/ActionValidator.sol";
import {NightActionRegistry} from "../src/NightActionRegistry.sol";
import {NightActionResolver} from "../src/NightActionResolver.sol";
import {INightAbility} from "../src/interfaces/INightAbility.sol";
import {GameTypes} from "../src/GameTypes.sol";
import {PlayerState} from "../src/PlayerState.sol";
import {InvestigateAbility} from "../src/abilities/InvestigateAbility.sol";

contract MockAbility is INightAbility {
	struct Invocation {
		address lobby;
		address actor;
		address target;
		bytes payload;
	}

	Invocation[] public executions;
	GameTypes.AbilityEffect private _effect;

	function executeNightAction(
		address lobby,
		address actor,
		address target,
		bytes calldata payload
	) external override returns (GameTypes.AbilityEffect memory) {
		executions.push(Invocation({lobby: lobby, actor: actor, target: target, payload: payload}));
		return _effect;
	}

	function executionCount() external view returns (uint256) {
		return executions.length;
	}

	function getInvocation(uint256 index) external view returns (Invocation memory) {
		return executions[index];
	}

	function setEffect(GameTypes.AbilityEffect memory effect) external {
		_effect = effect;
	}
}

contract NightActionResolverTest is Test {
	LobbyRegistry internal registry;
	PhaseEngine internal engine;
	ActionValidator internal validator;
	NightActionRegistry internal nightRegistry;
	NightActionResolver internal resolver;
	PlayerState internal playerState;
	MockAbility internal ability;
	address internal lobby;

	bytes32 internal constant ABILITY_ID = keccak256("MOCK_ABILITY");
	bytes32 internal constant INVESTIGATE_ID = keccak256("INVESTIGATE");
	bytes32 internal constant ROLEBLOCK_ID = keccak256("ROLEBLOCK");

	address internal constant PLAYER_ONE = address(0xBEEF);
	address internal constant PLAYER_TWO = address(0xCAFE);

	function setUp() public {
		registry = new LobbyRegistry();
		engine = new PhaseEngine(address(registry));
		validator = new ActionValidator(address(engine), address(this));
		nightRegistry = new NightActionRegistry(address(engine), address(validator));
		playerState = new PlayerState();
		resolver = new NightActionResolver(
			address(engine),
			address(validator),
			address(nightRegistry),
			address(playerState)
		);
		nightRegistry.setResolverAuthority(address(resolver));
		validator.setEliminationAuthority(address(resolver));
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

		ability = new MockAbility();
		ability.setEffect(GameTypes.AbilityEffect({
			effectType: GameTypes.AbilityEffectType.None,
			target: address(0),
			data: ""
		}));
		resolver.registerAbility(ABILITY_ID, address(ability));
	}

	function testResolveNightExecutesAbility() public {
		uint32 round = _enterNightPhase();
		bytes memory payload = abi.encode(uint8(7));
		bytes memory actionData = abi.encode(ABILITY_ID, payload);

		vm.prank(PLAYER_ONE);
		nightRegistry.submitAction(lobby, PLAYER_TWO, actionData);

		resolver.resolveNight(lobby);

		assertEq(ability.executionCount(), 1);
		MockAbility.Invocation memory invocation = ability.getInvocation(0);
		assertEq(invocation.lobby, lobby);
		assertEq(invocation.actor, PLAYER_ONE);
		assertEq(invocation.target, PLAYER_TWO);
		assertTrue(keccak256(invocation.payload) == keccak256(payload));

		GameTypes.NightAction[] memory actions = nightRegistry.getActions(lobby, round);
		assertTrue(actions[0].consumed);
	}

	function testResolveNightSkipsWhenActorDead() public {
		_enterNightPhase();
		bytes memory actionData = abi.encode(ABILITY_ID, bytes(""));
		vm.prank(PLAYER_ONE);
		nightRegistry.submitAction(lobby, PLAYER_TWO, actionData);

		vm.prank(address(resolver));
		validator.markEliminated(lobby, PLAYER_ONE);

		resolver.resolveNight(lobby);
		assertEq(ability.executionCount(), 0);
	}

	function testResolveNightKillEffectMarksElimination() public {
		_enterNightPhase();
		bytes memory actionData = abi.encode(ABILITY_ID, bytes(""));
		ability.setEffect(GameTypes.AbilityEffect({
			effectType: GameTypes.AbilityEffectType.Kill,
			target: PLAYER_TWO,
			data: ""
		}));

		vm.prank(PLAYER_ONE);
		nightRegistry.submitAction(lobby, PLAYER_TWO, actionData);

		resolver.resolveNight(lobby);
		assertTrue(validator.isAlive(lobby, PLAYER_TWO) == false);
	}

	function testResolveNightProtectionBlocksKill() public {
		uint32 round = _enterNightPhase();

		// Queue protect ability first
		bytes32 protectAbilityId = keccak256("PROTECT");
		MockAbility protectAbility = new MockAbility();
		protectAbility.setEffect(GameTypes.AbilityEffect({
			effectType: GameTypes.AbilityEffectType.Protect,
			target: PLAYER_TWO,
			data: ""
		}));
		resolver.registerAbility(protectAbilityId, address(protectAbility));

		bytes memory protectData = abi.encode(protectAbilityId, bytes(""));
		vm.prank(PLAYER_TWO);
		nightRegistry.submitAction(lobby, PLAYER_TWO, protectData);

		// Queue kill ability
		bytes memory killData = abi.encode(ABILITY_ID, bytes(""));
		ability.setEffect(GameTypes.AbilityEffect({
			effectType: GameTypes.AbilityEffectType.Kill,
			target: PLAYER_TWO,
			data: ""
		}));
		vm.prank(PLAYER_ONE);
		nightRegistry.submitAction(lobby, PLAYER_TWO, killData);

		resolver.resolveNight(lobby);

		assertTrue(validator.isAlive(lobby, PLAYER_TWO));
		assertTrue(playerState.isProtected(lobby, PLAYER_TWO, round) == false);
	}

	function testResolveNightRequiresRegisteredAbility() public {
		_enterNightPhase();
		bytes32 otherAbility = keccak256("UNKNOWN");
		bytes memory actionData = abi.encode(otherAbility, bytes(""));

		vm.prank(PLAYER_ONE);
		nightRegistry.submitAction(lobby, PLAYER_TWO, actionData);

		vm.expectRevert(NightActionResolver.AbilityNotRegistered.selector);
		resolver.resolveNight(lobby);
	}

	function testResolveNightRequiresNightPhase() public {
		bytes memory actionData = abi.encode(ABILITY_ID, bytes(""));
		vm.prank(PLAYER_ONE);
		vm.expectRevert(NightActionRegistry.RoundNotInitialized.selector);
		nightRegistry.submitAction(lobby, PLAYER_TWO, actionData);
	}

	function testResolveNightRecordsInvestigation() public {
		uint32 round = _enterNightPhase();
		InvestigateAbility investigate = new InvestigateAbility(address(resolver));
		investigate.setAlignment(PLAYER_TWO, true);
		resolver.registerAbility(INVESTIGATE_ID, address(investigate));

		bytes memory actionData = abi.encode(INVESTIGATE_ID, bytes(""));
		vm.prank(PLAYER_ONE);
		nightRegistry.submitAction(lobby, PLAYER_TWO, actionData);

		resolver.resolveNight(lobby);

		PlayerState.InvestigationRecord memory record = playerState.getInvestigationResult(lobby, PLAYER_ONE);
		assertEq(record.round, round);
		assertEq(record.target, PLAYER_TWO);
		assertTrue(record.isMafia);
	}

	function testResolveNightRoleblockPreventsAction() public {
		uint32 round = _enterNightPhase();
		MockAbility roleblockAbility = new MockAbility();
		roleblockAbility.setEffect(GameTypes.AbilityEffect({
			effectType: GameTypes.AbilityEffectType.Roleblock,
			target: PLAYER_TWO,
			data: ""
		}));
		resolver.registerAbility(ROLEBLOCK_ID, address(roleblockAbility));

		// PLAYER_ONE roleblocks PLAYER_TWO
		bytes memory blockData = abi.encode(ROLEBLOCK_ID, bytes(""));
		vm.prank(PLAYER_ONE);
		nightRegistry.submitAction(lobby, PLAYER_TWO, blockData);

		// PLAYER_TWO attempts to execute ability but should be skipped
		bytes memory killData = abi.encode(ABILITY_ID, bytes(""));
		ability.setEffect(GameTypes.AbilityEffect({
			effectType: GameTypes.AbilityEffectType.Kill,
			target: PLAYER_ONE,
			data: ""
		}));
		vm.prank(PLAYER_TWO);
		nightRegistry.submitAction(lobby, PLAYER_ONE, killData);

		resolver.resolveNight(lobby);

		// Roleblock executed, kill ability skipped
		assertEq(roleblockAbility.executionCount(), 1);
		assertEq(ability.executionCount(), 0);

		GameTypes.NightAction[] memory roundActions = nightRegistry.getActions(lobby, round);
		assertTrue(roundActions[0].consumed);
		assertTrue(roundActions[1].consumed);
		assertTrue(!playerState.isRoleblocked(lobby, PLAYER_TWO, round));
	}

	function _enterNightPhase() internal returns (uint32) {
		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Day, 0, GameTypes.Phase.Night);

		vm.prank(address(registry));
		engine.advancePhase(lobby, GameTypes.Phase.Night, 0, GameTypes.Phase.Resolution);

		return engine.getPhaseState(lobby).round;
	}
}
