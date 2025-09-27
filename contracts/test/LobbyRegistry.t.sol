// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import {LobbyRegistry} from "../src/LobbyRegistry.sol";
import {GameTypes} from "../src/GameTypes.sol";
import {GameLobby} from "../src/GameLobby.sol";
import {PhaseEngine} from "../src/PhaseEngine.sol";

contract LobbyRegistrySmokeTest is Test {
	function testCreateLobbyStoresRecord() public {
		LobbyRegistry registry = new LobbyRegistry();
		PhaseEngine engine = new PhaseEngine(address(registry));
		registry.setPhaseEngine(address(engine));

		GameTypes.LobbyConfig memory config = GameTypes.LobbyConfig({
			minPlayers: 3,
			maxPlayers: 7,
			isPrivate: true,
			joinTimeoutSeconds: 30
		});

		string memory metadataURI = "ipfs://metadata.json";
		(uint256 lobbyId, address lobbyAddress) = registry.createLobby(config, keccak256("invite"), metadataURI);

		assertEq(lobbyId, 0);
		assertTrue(lobbyAddress != address(0));
		GameTypes.PhaseState memory phaseState = engine.getPhaseState(lobbyAddress);
		assertEq(uint256(phaseState.currentPhase), uint256(GameTypes.Phase.Lobby));

		GameTypes.LobbyRecord memory record = registry.getLobbyRecord(lobbyId);
		assertEq(record.lobbyAddress, lobbyAddress);
		assertEq(record.creator, address(this));
		assertEq(record.config.minPlayers, config.minPlayers);
		assertEq(record.config.maxPlayers, config.maxPlayers);
		assertTrue(record.config.isPrivate == config.isPrivate);
		assertEq(record.config.joinTimeoutSeconds, config.joinTimeoutSeconds);
		assertTrue(keccak256(bytes(record.metadataURI)) == keccak256(bytes(metadataURI)));
		assertTrue(record.createdAt > 0);
	}

	function testSetPhaseEngineOnlyOwner() public {
		LobbyRegistry registry = new LobbyRegistry();
		PhaseEngine engine = new PhaseEngine(address(registry));

		vm.prank(address(0xBEEF));
		vm.expectRevert(abi.encodeWithSelector(LobbyRegistry.NotOwner.selector));
		registry.setPhaseEngine(address(engine));

		registry.setPhaseEngine(address(engine));
		assertEq(address(registry.phaseEngine()), address(engine));
	}

	function testSetPhaseEngineRejectsZeroAddress() public {
		LobbyRegistry registry = new LobbyRegistry();
		vm.expectRevert(abi.encodeWithSelector(LobbyRegistry.InvalidPhaseEngine.selector));
		registry.setPhaseEngine(address(0));
	}

	function testTransferOwnership() public {
		LobbyRegistry registry = new LobbyRegistry();
		registry.transferOwnership(address(0x1234));
		PhaseEngine engine = new PhaseEngine(address(registry));
		vm.prank(address(0x1234));
		registry.setPhaseEngine(address(engine));
		assertEq(address(registry.phaseEngine()), address(engine));
	}

	function testCreateLobbyUpdatesCountAndLockState() public {
		LobbyRegistry registry = new LobbyRegistry();
		GameTypes.LobbyConfig memory config = GameTypes.LobbyConfig({
			minPlayers: 2,
			maxPlayers: 4,
			isPrivate: false,
			joinTimeoutSeconds: 0
		});

		assertEq(registry.getLobbyCount(), 0);
		(, address lobbyAddress) = registry.createLobby(config, bytes32(0), "ipfs://metadata.json");
		assertEq(registry.getLobbyCount(), 1);
		assertTrue(registry.isLobbyLocked(0) == false);

		vm.prank(address(registry));
		GameLobby(lobbyAddress).forceLock();
		assertTrue(registry.isLobbyLocked(0));
	}

	function testCreateLobbyRejectsInvalidConfig() public {
		LobbyRegistry registry = new LobbyRegistry();
		GameTypes.LobbyConfig memory invalidConfig = GameTypes.LobbyConfig({
			minPlayers: 5,
			maxPlayers: 4,
			isPrivate: false,
			joinTimeoutSeconds: 0
		});

		vm.expectRevert(LobbyRegistry.InvalidConfig.selector);
		registry.createLobby(invalidConfig, bytes32(0), "ipfs://metadata.json");
	}
}
