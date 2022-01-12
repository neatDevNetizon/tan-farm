// SPDX-License-Identifier: GEO

pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


contract TANToken is ERC20("TANToken", "TAN"), Ownable {
    uint256 internal constant DIST_EPOCH = 30 days;
    uint256 internal constant BLOCK_TIME = 6 seconds; 
    uint256 internal constant SUPPLY_RATE = 1; //  1% of RemainingSupply  
    uint256 internal constant FARM_RATE = 66;  // 66% goes to Farming
    uint256 internal constant TEAM_RATE = 1;   //  1% give 1% as team allocation 
    uint256 internal constant DAO_RATE = 11;   // 11% goes to the DAO
    uint256 internal constant GTH_RATE = 11;   // 11% goes to Growth fund (For Development and Marketing intiatives) 
    uint256 internal constant ILP_RATE = 11;   // 11% will be used to bootstrap initial Liquidty Pools. 

    bool internal IsAfterFirstEpoch;
    uint256 internal NextDistributionTimestamp;
    uint256 public FarmSupply;
    uint256 public CirculatingSupply;
    uint256 public SupplyPerEpoch;
    uint256 public SupplyPerBlock;

    event supplyUpdated(uint256 amount);

    constructor (
        uint256 _maxSupply,
        address _dao,
        address _gth,
        address _ilp,
        address _team
    ) public {
        _mint(_dao, _maxSupply.mul(DAO_RATE).div(100));
        _mint(_gth, _maxSupply.mul(GTH_RATE).div(100));
        _mint(_ilp, _maxSupply.mul(ILP_RATE).div(100)); 
        _mint(_team, _maxSupply.mul(TEAM_RATE).div(100));
               
        FarmSupply = _maxSupply.mul(FARM_RATE).div(100);

        CirculatingSupply = 0;
        SupplyPerEpoch = _calculateSupplyPerEpoch(FarmSupply, CirculatingSupply);        
        SupplyPerBlock = _perEpochToPerBlock(SupplyPerEpoch);

        NextDistributionTimestamp = block.timestamp;
    }

    function updateSupply() public onlyOwner {
        require(block.timestamp >= NextDistributionTimestamp, "TANToken: Not ready to update supply!");

        if (IsAfterFirstEpoch) {
            CirculatingSupply = CirculatingSupply.add(SupplyPerEpoch);
            SupplyPerEpoch = _calculateSupplyPerEpoch(FarmSupply, CirculatingSupply); 
        } else {
            IsAfterFirstEpoch = true;
        }
        SupplyPerBlock = _perEpochToPerBlock(SupplyPerEpoch);
        NextDistributionTimestamp = NextDistributionTimestamp.add(DIST_EPOCH);
        emit supplyUpdated(SupplyPerEpoch);
    }

    function _calculateSupplyPerEpoch (
        uint256 _farmSupplyValue,
        uint256 _circulatingValue
    ) internal pure returns(uint256) {
        return _farmSupplyValue.sub(_circulatingValue).mul(SUPPLY_RATE).div(100);
    }

    function _perEpochToPerBlock (
        uint256 perEpochValue
    ) internal pure returns (uint256) {
        return perEpochValue.mul(BLOCK_TIME).div(DIST_EPOCH);
    }

    /// @notice Creates `_amount` token to `_to`. Must only be called by the owner (Craftsman).
    function mint(
        address _to,
        uint256 _amount
    ) public onlyOwner {
        _mint(_to, _amount);
    }
}
