// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import {PhaseEngine} from "../src/PhaseEngine.sol";
import {GameTypes} from "../src/GameTypes.sol";

contract DummyRegistry {
    PhaseEngine public engine;

    constructor() {
        engine = new PhaseEngine(address(this));
    }

    function register(address lobby) external {
        engine.registerLobby(lobby);
    }

    function advance(
        address lobby,
        GameTypes.Phase nextPhase,
        uint64 deadline,
        GameTypes.Phase autoTarget
    ) external {
        engine.advancePhase(lobby, nextPhase, deadline, autoTarget);
    }
}

contract PhaseEngineTest is Test {
    DummyRegistry internal registry;
    PhaseEngine internal engine;
    address internal lobby = address(0xAAAA);

    function setUp() public {
        registry = new DummyRegistry();
        engine = registry.engine();
        registry.register(lobby);
    }

    function testRegisterInitialState() public {
        GameTypes.PhaseState memory state = engine.getPhaseState(lobby);
        assertEq(uint256(state.currentPhase), uint256(GameTypes.Phase.Lobby));
        assertEq(state.round, 0);
        assertEq(state.deadline, 0);
        assertEq(uint256(state.scheduledPhase), uint256(GameTypes.Phase.Lobby));
        assertTrue(state.autoAdvanceEnabled == false);
    }

    function testAdvanceToDayIncrementsRound() public {
        registry.advance(lobby, GameTypes.Phase.Day, 0, GameTypes.Phase.Lobby);
        GameTypes.PhaseState memory state = engine.getPhaseState(lobby);
        assertEq(uint256(state.currentPhase), uint256(GameTypes.Phase.Day));
        assertEq(state.round, 1);
    }

    function testAutoAdvanceAfterDeadline() public {
        registry.advance(lobby, GameTypes.Phase.Day, uint64(block.timestamp + 5), GameTypes.Phase.Night);
        vm.warp(block.timestamp + 6);
        engine.tryAutoAdvance(lobby);
        GameTypes.PhaseState memory state = engine.getPhaseState(lobby);
        assertEq(uint256(state.currentPhase), uint256(GameTypes.Phase.Night));
        assertEq(state.deadline, 0);
        assertTrue(state.autoAdvanceEnabled == false);
    }

    function testInvalidTransitionReverts() public {
        vm.expectRevert();
        registry.advance(lobby, GameTypes.Phase.Night, 0, GameTypes.Phase.Lobby);
    }

    function testCompleteClearsSchedule() public {
        registry.advance(lobby, GameTypes.Phase.Day, 0, GameTypes.Phase.Night);
        registry.advance(lobby, GameTypes.Phase.Night, 0, GameTypes.Phase.Resolution);
        registry.advance(lobby, GameTypes.Phase.Completed, 0, GameTypes.Phase.Completed);
        GameTypes.PhaseState memory state = engine.getPhaseState(lobby);
        assertEq(uint256(state.currentPhase), uint256(GameTypes.Phase.Completed));
        assertEq(state.deadline, 0);
        assertTrue(state.autoAdvanceEnabled == false);
    }
}
