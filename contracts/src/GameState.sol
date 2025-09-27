// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {GameTypes} from "./GameTypes.sol";

contract GameState {
    using GameTypes for GameTypes.PhaseState;
    using GameTypes for GameTypes.PlayerState;

    GameTypes.PhaseState public phaseState;
    GameTypes.PlayerState[] public players;
    mapping(address => GameTypes.VoteRecord) public votes;
    GameTypes.NightAction[] public nightActions;

    event RoleAssigned(address player, GameTypes.Role role);
    event VoteCommitted(address voter, bytes32 commitment);
    event NightActionQueued(address actor, address target);

    function assignRoles(address[] memory playerAddresses, bool[] memory isBots) external {
        require(players.length == 0, "Roles already assigned");
        GameTypes.Role[8] memory roles = [
            GameTypes.Role.Godfather,
            GameTypes.Role.Mafia,
            GameTypes.Role.Mafia,
            GameTypes.Role.Detective,
            GameTypes.Role.Doctor,
            GameTypes.Role.Insomniac,
            GameTypes.Role.Villager,
            GameTypes.Role.Villager
        ];
        // Shuffle roles (simplified, in practice use better randomness)
        for (uint i = 0; i < roles.length; i++) {
            uint j = uint(keccak256(abi.encodePacked(block.timestamp, i))) % roles.length;
            GameTypes.Role temp = roles[i];
            roles[i] = roles[j];
            roles[j] = temp;
        }
        for (uint i = 0; i < playerAddresses.length; i++) {
            players.push(GameTypes.PlayerState({
                player: playerAddresses[i],
                role: roles[i],
                isAlive: true,
                isBot: isBots[i]
            }));
            emit RoleAssigned(playerAddresses[i], roles[i]);
        }
    }

    function commitVote(bytes32 commitment) external {
        votes[msg.sender] = GameTypes.VoteRecord({
            commitment: commitment,
            revealed: false,
            target: address(0)
        });
        emit VoteCommitted(msg.sender, commitment);
    }

    function queueNightAction(address target, bytes memory data) external {
        nightActions.push(GameTypes.NightAction({
            actor: msg.sender,
            target: target,
            data: data,
            consumed: false
        }));
        emit NightActionQueued(msg.sender, target);
    }
}