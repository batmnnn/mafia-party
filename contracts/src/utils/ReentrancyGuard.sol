// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @notice Minimal copy of OpenZeppelin's ReentrancyGuard to avoid external dependency.
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "REENTRANT_CALL");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}
