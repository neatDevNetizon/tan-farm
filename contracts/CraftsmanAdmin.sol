// SPDX-License-Identifier: GEO

pragma solidity 0.6.12;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import "./Craftsman.sol";

// import './lib/token/ERC20/IERC20.sol';
// import './lib/access/Ownable.sol';
// import "./Craftsman.sol";

interface ICraftsman {
    function add(uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate) external;
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) external;
    function updateSupply() external;
    function updateStakingRatio(uint256 _ratio) external;

    // Ownable
    function transferOwnership(address newOwner) external;
}

contract CraftsmanAdmin is Ownable {
    ICraftsman public craftsman;

    address public newOwner;
    uint256 public transferOwnershipTimeLock;
    uint256 public constant TRANSFER_OWNERSHIP_TIMELOCK = 3 days;

    event TransferOwnershipStart(address newOwner, uint256 transferOwnershipUnlockAt);

    constructor (
        ICraftsman _craftsman
    ) public {
        craftsman = _craftsman;
    }

    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        bool _withUpdate
    ) public onlyOwner {
        craftsman.add(_allocPoint, _lpToken, _withUpdate);
    }

    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOwner {
        craftsman.set(_pid, _allocPoint, _withUpdate);
    }

    function updateSupply() public onlyOwner {
        craftsman.updateSupply();
    }

    function updateStakingRatio(
        uint256 _ratio
    ) public onlyOwner {
        craftsman.updateStakingRatio(_ratio);
    }

    function enableTransferOwnership(
        address _newOwner
    ) public onlyOwner {
        newOwner = _newOwner;
        transferOwnershipTimeLock = block.timestamp + TRANSFER_OWNERSHIP_TIMELOCK;

        emit TransferOwnershipStart(newOwner, transferOwnershipTimeLock);
    }

    function transferOwnership() public onlyOwner {
        require(block.timestamp > transferOwnershipTimeLock, "CraftsmanAdmin: transferOwnership not ready");
        craftsman.transferOwnership(newOwner);
    }
}


