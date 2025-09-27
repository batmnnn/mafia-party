// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LobbyRegistry} from "../src/LobbyRegistry.sol";
import {PhaseEngine} from "../src/PhaseEngine.sol";
import {ActionValidator} from "../src/ActionValidator.sol";
import {VoteRegistry} from "../src/VoteRegistry.sol";
import {NightActionRegistry} from "../src/NightActionRegistry.sol";
import {NightActionResolver} from "../src/NightActionResolver.sol";
import {EliminationEngine} from "../src/EliminationEngine.sol";
import {PlayerState} from "../src/PlayerState.sol";
import {KillAbility} from "../src/abilities/KillAbility.sol";
import {ProtectAbility} from "../src/abilities/ProtectAbility.sol";
import {InvestigateAbility} from "../src/abilities/InvestigateAbility.sol";
import {RoleblockAbility} from "../src/abilities/RoleblockAbility.sol";

contract DeployMafiaContracts {
    function deploy() external returns (
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
    ) {
        // Deploy LobbyRegistry first
        lobbyRegistry = address(new LobbyRegistry());

        // Deploy PhaseEngine with registry address
        phaseEngine = address(new PhaseEngine(lobbyRegistry));

        // Deploy ActionValidator
        actionValidator = address(new ActionValidator(phaseEngine, address(0)));

        // Deploy VoteRegistry
        voteRegistry = address(new VoteRegistry(phaseEngine));

        // Deploy NightActionRegistry
        nightRegistry = address(new NightActionRegistry(phaseEngine, actionValidator));

        // Deploy PlayerState
        playerState = address(new PlayerState());

        // Deploy NightActionResolver
        nightResolver = address(new NightActionResolver(
            phaseEngine,
            actionValidator,
            nightRegistry,
            playerState
        ));

        // Deploy EliminationEngine
        eliminationEngine = address(new EliminationEngine(phaseEngine, actionValidator));

        // Deploy ability contracts
        killAbility = address(new KillAbility(nightResolver));
        protectAbility = address(new ProtectAbility(nightResolver));
        investigateAbility = address(new InvestigateAbility(nightResolver));
        roleblockAbility = address(new RoleblockAbility(nightResolver));

        // Set phase engine in registry
        LobbyRegistry(lobbyRegistry).setPhaseEngine(phaseEngine);
    }
}