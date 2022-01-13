// SPDX-License-Identifier: GEO

pragma solidity 0.6.12;

import "./libs/ERC20.sol";
import "./libs/Ownable.sol";
import "./TANToken.sol";


// Workbench with Governance.
contract Workbench is ERC20('Workbench Token', 'BENCH'), Ownable {
    /// @notice Creates `_amount` token to `_to`. Must only be called by the owner (Craftsman).
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    function burn(address _from ,uint256 _amount) public onlyOwner {
        _burn(_from, _amount);
    }

    // The TAN TOKEN!
    TANToken public TAN;

    constructor (TANToken _TAN) public {
        TAN = _TAN;
    }

    // Safe TAN transfer function, just in case if rounding error causes pool to not have enough TANs.
    function safeTANTransfer(address _to, uint256 _amount) public onlyOwner {
        uint256 TANBal = TAN.balanceOf(address(this));
        if (_amount > TANBal) {
            TAN.transfer(_to, TANBal);
        } else {
            TAN.transfer(_to, _amount);
        }
    }
}
