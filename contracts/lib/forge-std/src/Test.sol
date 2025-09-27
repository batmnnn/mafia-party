// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @notice Minimal subset of forge-std's Vm cheatcode interface used for unit testing.
interface Vm {
    function prank(address newSender) external;

    function expectRevert(bytes4 revertSelector) external;

    function warp(uint256 newTimestamp) external;

    function expectRevert(bytes memory revertData) external;

    function expectRevert() external;
}

/// @notice Helper contract providing basic assertions for Foundry-style tests without pulling the full forge-std dependency.
abstract contract Test {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertEq(uint256 a, uint256 b) internal pure {
        if (a != b) {
            revert(string.concat("assertEq(uint256,uint256) failed: ", _toString(a), " != ", _toString(b)));
        }
    }

    function assertEq(address a, address b) internal pure {
        if (a != b) {
            revert(string.concat("assertEq(address,address) failed: ", _toHexString(a), " != ", _toHexString(b)));
        }
    }

    function assertTrue(bool value) internal pure {
        if (!value) {
            revert("assertTrue(bool) failed");
        }
    }

    function fail(string memory message) internal pure {
        revert(message);
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _toHexString(address account) private pure returns (string memory) {
        return _toHex(abi.encodePacked(account));
    }

    function _toHex(bytes memory data) private pure returns (string memory) {
        bytes16 alphabet = 0x30313233343536373839616263646566;
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
