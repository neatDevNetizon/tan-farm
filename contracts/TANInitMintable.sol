// SPDX-License-Identifier: GEO
pragma solidity ^0.8.0;

import "./lib/access/Ownable.sol";
import "./lib/token/ERC20/ERC20.sol";


contract TANInitMintable is ERC20("TANToken", "TAN"), Ownable {
  
    uint256 internal constant DIST_EPOCH = 30 days;
    uint256 internal constant SUPPLY_RATE = 1; // 0.01% of RemainingSupply  
    uint256 internal constant BLOCK_TIME = 6 seconds;  
    
    bool internal IsAfterFirstEpoch;
    uint256 internal NextDistributionTimestamp;
    uint256 internal MaxSupply;
    uint256 internal CirculatingSupply;
    uint256 internal SupplyPerEpoch;
    uint256 public SupplyPerBlock;

    event SupplyDistributed(uint256 amount);

    constructor(uint256 _maxSupply) {
        MaxSupply = _maxSupply;
        CirculatingSupply = 0;
        SupplyPerEpoch = _calculateSupplyPerEpoch(MaxSupply, CirculatingSupply);        
        SupplyPerBlock = _perEpochToPerBlock(SupplyPerEpoch);
        NextDistributionTimestamp = block.timestamp;
    }

    function distributeSupply(
        address[] memory _teamAddresses,
        uint256[] memory _teamAmounts
    ) public onlyOwner {
        require(block.timestamp >= NextDistributionTimestamp, "TANInitMintable: Not ready");
        require(_teamAddresses.length == _teamAmounts.length, "TANInitMintable: Array length mismatch");

        if (IsAfterFirstEpoch) {
            CirculatingSupply = CirculatingSupply + SupplyPerEpoch;
            SupplyPerEpoch = _calculateSupplyPerEpoch(MaxSupply, CirculatingSupply); 
        } else {
            IsAfterFirstEpoch = true;
        }

        uint256 communitySupplyPerEpoch = SupplyPerEpoch;
        for (uint256 i; i < _teamAddresses.length; i++) {
            _mint(_teamAddresses[i], _teamAmounts[i]);
            communitySupplyPerEpoch = communitySupplyPerEpoch - _teamAmounts[i];
        }

        require(communitySupplyPerEpoch >= (SupplyPerEpoch * 30 / 100));

        SupplyPerBlock = _perEpochToPerBlock(communitySupplyPerEpoch);
        NextDistributionTimestamp = NextDistributionTimestamp + DIST_EPOCH;
        emit SupplyDistributed(SupplyPerEpoch - communitySupplyPerEpoch);
    }

    function _calculateSupplyPerEpoch (
        uint256 _maxSupplyValue,
        uint256 _circulatingValue
    ) internal pure returns(uint256) {
        return (_maxSupplyValue - _circulatingValue) * SUPPLY_RATE / 100;
    }

    function _perEpochToPerBlock (uint256 perMonthValue) internal pure returns (uint256) {
        return perMonthValue * BLOCK_TIME / DIST_EPOCH;
    }
}
