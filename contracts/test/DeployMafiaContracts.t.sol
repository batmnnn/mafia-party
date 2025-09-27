// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import {DeployMafiaContracts} from "../script/DeployMafiaContracts.s.sol";

contract DeployMafiaContractsTest is Test {
    function testDeployContracts() public {
        DeployMafiaContracts deployer = new DeployMafiaContracts();
        
        (
            address lobbyRegistry,
            address phaseEngine,
            address actionValidator,
            address voteRegistry,
            address nightRegistry,
            address nightResolver,
            address eliminationEngine,
            address playerState,
            address killAbility,
            address protectAbility,
            address investigateAbility,
            address roleblockAbility
        ) = deployer.deploy();

        // Verify all contracts are deployed
        assertTrue(lobbyRegistry != address(0));
        assertTrue(phaseEngine != address(0));
        assertTrue(actionValidator != address(0));
        assertTrue(voteRegistry != address(0));
        assertTrue(nightRegistry != address(0));
        assertTrue(nightResolver != address(0));
        assertTrue(eliminationEngine != address(0));
        assertTrue(playerState != address(0));
        assertTrue(killAbility != address(0));
        assertTrue(protectAbility != address(0));
        assertTrue(investigateAbility != address(0));
        assertTrue(roleblockAbility != address(0));

        // Verify all addresses are unique
        assertTrue(lobbyRegistry != phaseEngine);
        assertTrue(phaseEngine != actionValidator);
        assertTrue(actionValidator != voteRegistry);
    }
}
