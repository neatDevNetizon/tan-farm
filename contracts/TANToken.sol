// SPDX-License-Identifier: GEO

pragma solidity 0.6.12;

import "./TANInitMintable.sol";


contract TANToken is TANInitMintable {

    constructor (
        uint256 _maxSupply
    ) TANInitMintable(_maxSupply) public {}

    /// @notice Creates `_amount` token to `_to`. Must only be called by the owner (Craftsman).
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }
}
