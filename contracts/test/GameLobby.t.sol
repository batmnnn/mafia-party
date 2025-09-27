// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

import {GameLobby} from "../src/GameLobby.sol";
import {GameTypes} from "../src/GameTypes.sol";

contract GameLobbySmokeTest is Test {
	function testCreatorAutoJoinsAndConfigMatches() public {
		GameTypes.LobbyConfig memory config = GameTypes.LobbyConfig({
			minPlayers: 3,
			maxPlayers: 8,
			isPrivate: false,
			joinTimeoutSeconds: 15
		});

		GameLobby lobby = new GameLobby(address(this), config, "ipfs://metadata.json", bytes32(0));

		assertEq(lobby.playerCount(), 1);
		assertTrue(lobby.hasJoined(address(this)));

		GameTypes.LobbyConfig memory stored = lobby.getConfig();
		assertEq(stored.minPlayers, config.minPlayers);
		assertEq(stored.maxPlayers, config.maxPlayers);
		assertTrue(stored.isPrivate == config.isPrivate);
		assertEq(stored.joinTimeoutSeconds, config.joinTimeoutSeconds);
	}

	function testPrivateLobbyRejectsWrongInviteCode() public {
		bytes32 inviteHash = keccak256(abi.encodePacked("secret"));
		GameTypes.LobbyConfig memory config = GameTypes.LobbyConfig({
			minPlayers: 2,
			maxPlayers: 5,
			isPrivate: true,
			joinTimeoutSeconds: 0
		});

		GameLobby lobby = new GameLobby(address(this), config, "ipfs://metadata.json", inviteHash);

		vm.expectRevert(abi.encodeWithSelector(GameLobby.LobbyPrivate.selector, inviteHash));
		vm.prank(address(0xBEEF));
		lobby.join("wrong-secret");

		vm.prank(address(0xBEEF));
		lobby.join("secret");
		assertTrue(lobby.hasJoined(address(0xBEEF)));
	}

	function testLobbyAutoLocksAtCapacity() public {
		GameTypes.LobbyConfig memory config = GameTypes.LobbyConfig({
			minPlayers: 2,
			maxPlayers: 2,
			isPrivate: false,
			joinTimeoutSeconds: 0
		});

		GameLobby lobby = new GameLobby(address(this), config, "ipfs://metadata.json", bytes32(0));

		vm.prank(address(0xBEEF));
		lobby.join("");

		assertTrue(lobby.locked());
		assertEq(lobby.playerCount(), 2);

		vm.expectRevert(GameLobby.LobbyLockedError.selector);
		vm.prank(address(0xCAFE));
		lobby.join("");
	}

	function testJoinRespectsTimeout() public {
		GameTypes.LobbyConfig memory config = GameTypes.LobbyConfig({
			minPlayers: 2,
			maxPlayers: 6,
			isPrivate: false,
			joinTimeoutSeconds: 10
		});

		GameLobby lobby = new GameLobby(address(this), config, "ipfs://metadata.json", bytes32(0));

		uint256 newTime = block.timestamp + 11;
		vm.warp(newTime);

		vm.expectRevert(GameLobby.LobbyExpired.selector);
		vm.prank(address(0xBEEF));
		lobby.join("");
	}

	function testForceLockAccessControl() public {
		GameTypes.LobbyConfig memory config = GameTypes.LobbyConfig({
			minPlayers: 2,
			maxPlayers: 5,
			isPrivate: false,
			joinTimeoutSeconds: 0
		});

		GameLobby lobby = new GameLobby(address(this), config, "ipfs://metadata.json", bytes32(0));
		lobby.forceLock();
		assertTrue(lobby.locked());

		GameLobby secondLobby = new GameLobby(address(0xC0DE), config, "ipfs://metadata.json", bytes32(0));

		vm.expectRevert(GameLobby.Unauthorized.selector);
		vm.prank(address(0xBEEF));
		secondLobby.forceLock();

		vm.prank(address(0xC0DE));
		secondLobby.forceLock();
		assertTrue(secondLobby.locked());
	}
}
