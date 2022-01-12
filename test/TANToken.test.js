const { assert } = require("chai");

const BigNumber = require("bignumber.js");
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR, DECIMAL_PLACES: 0 });

const TANToken = artifacts.require('TANToken');

contract('TANToken', ([DAO, Growth, LP, Team, alice, bob, carol, minter]) => {

    // We set the "maximum supply" value to 10000000000000000000000000(=10,000,000 * 10^18) TAN wei = 10,000,000 TAN 
    const _maxSupply = "10000000000000000000000000"; // maximum supply
    
    beforeEach(async () => {
        this.TAN = await TANToken.new(_maxSupply, DAO, Growth, LP, Team, { from: minter });
    });

    it('Distribute supply by 66%, 11%, 11%, 11% and 1%', async () => {
        // By constructing TANToken, supply is distributed like:
        //
        //         - 66% goes to Farming
        //         - 11% goes to the DAO
        //         - 11% goes to Growth fund (For Development and Marketing intiatives) 
        //         - 11% will be used to bootstrap initial Liquidty Pools. 
        //         -  1% give 1% as team allocation 
        //
        // So "Farming supply" is "6600000000000000000000000 wei" (66%). We confirm it by this assertion:
        assert.equal((await this.TAN.FarmSupply()).toString(), '6600000000000000000000000');

        // And the balances of "DAO", "Growth", "LP" and "Team" will be 11%, 11%, 11% and 1% of maximum supply.
        
        // We confirm if "1100000000000000000000000 wei" (11%) is distributed to "DAO" by this assertion:
        assert.equal((await this.TAN.balanceOf(DAO)).toString(), '1100000000000000000000000');

        // We confirm if "1100000000000000000000000 wei" (11%) is distributed to "Growth" by this assertion:
        assert.equal((await this.TAN.balanceOf(Growth)).toString(), '1100000000000000000000000');

        // We confirm if "1100000000000000000000000 wei" (11%) is distributed to "LP" by this assertion:
        assert.equal((await this.TAN.balanceOf(LP)).toString(), '1100000000000000000000000');

        // We confirm if "100000000000000000000000 wei" (1%) is distributed to "Team" by this assertion:
        assert.equal((await this.TAN.balanceOf(Team)).toString(), '100000000000000000000000');

        // We make the console logs of "Farming supply", balances of "DAO", "Growth", "LP" and "Team"
        console.log("\tFarming supply    (66%): " + (await this.TAN.FarmSupply()).toString());
        console.log("\tBalance of DAO    (11%): " + (await this.TAN.balanceOf(DAO)).toString());
        console.log("\tBalance of Growth (11%): " + (await this.TAN.balanceOf(Growth)).toString());
        console.log("\tBalance of LP     (11%): " + (await this.TAN.balanceOf(LP)).toString());
        console.log("\tBalance of Team   ( 1%):  " + (await this.TAN.balanceOf(Team)).toString());
    });        


    it('updateSupply checking', async () => {

        // And we consider the "distribution epoch" to "30 days". (It is defined in "contracts/TANToken.sol".)
        // By the first epoch, our "circulating supply" is "zero" TAN wei.
        // So "remaining supply" is:
        // 
        //                6600000000000000000000000  (maximum supply)
        //                                      - 0  (circulating supply)
        //           -------------------------------------------------------
        //              = 6600000000000000000000000  (remaining supply)
        //
        // So "supply for this epoch" is 1% of "remaining supply":
        // 
        //                6600000000000000000000000  (remaining supply)
        //                                   * 0.01  (1% of remaining supply)
        //           -------------------------------------------------------
        //               =  66000000000000000000000  (supply for this epoch)
        //
        // We calculate "supply per block" by hand like:
        //
        //                  66000000000000000000000  (supply for this epoch)
        //                                      * 6  (time per one block generation: 6 seconds)
        //                     / (30 * 24 * 60 * 60) (one epoch by second unit: 30 d * 24 hr * 60 min * 60 s = 2,592,000 seconds)
        //           -----------------------------------------------------------------------------------------------------------------
        //                =      152777777777777777  (supply per block)
        //
        const supplyPerBlock = new BigNumber("66000000000000000000000").multipliedBy(6).dividedBy(2592000); // 152777777777777777 TAN wei
        //                                   -------------------------              ---           -------
        //                                     (supply for this epoch)          (block time)   (epoch time)

        await this.TAN.updateSupply({ from: minter });

        // We confirm if our function performs correctly.
        // SupplyPerblock calculation result of smart contract "TANToken.sol" is compared with our hand-calculation result "152777777777777777" by this assertion:
        assert.equal((await this.TAN.SupplyPerBlock()).toString(), supplyPerBlock.toString());
        //                      ---------------------              --------------
        //                  calculated by smart contract               by hand
        //
        // If they are not same, it occurs error, else not.
    });


    it('updateSupply should only be called once before next "distribution epoch"', async () => {
        // We called function "updateSupply" and calculated "supply per block" above.
        // So it can not be called before next 30 days.
        // We confirm this by calling it at "now", "after 29 days", "and 30 days".

        // Now. It can not be called now.
        // So the "supply for this epoch" and "supply per block" are the same with previous time.
        // If they are not same, it will occurs error, else not.
        await this.TAN.updateSupply({ from: minter });
        assert.equal((await this.TAN.SupplyPerEpoch()).toString(), '66000000000000000000000');
        assert.equal((await this.TAN.SupplyPerBlock()).toString(), '152777777777777777');

        // Time to 29th day. Increase time by 29 days = 86400 * 29 seconds.
        await network.provider.send("evm_increaseTime", [86400 * 29]);
        await network.provider.send("evm_mine");

        // 29th day. Also it can not be called at 29th day. 
        // So the "supply for this epoch" and "supply per block" are the same with previous time.
        // If they are not same, it will occurs error, else not.
        try {       
            await this.TAN.updateSupply({ from: minter });
        } catch (err) {
            // Because the time is not reach to epoch, it will occurs error message "TANToken: Not ready"(this defined in "TANToken.sol")
            // So we confirm if the error message is really occured here.
            // If the message is not occured, it will occurs error, else not.
            assert.include(err.message, "Not ready");
            assert.equal((await this.TAN.SupplyPerEpoch()).toString(), '66000000000000000000000');
            assert.equal((await this.TAN.SupplyPerBlock()).toString(), '152777777777777777');
        }

        // Time to 30th day. Increase time by 1 day = 86400 seconds.
        await network.provider.send("evm_increaseTime", [86400]);
        await network.provider.send("evm_mine");

        // 30th day. It can be called at 30th day.
        // So "remaining supply" is:
        //                6600000000000000000000000  (maximum supply)
        //                - 66000000000000000000000  (circulating supply)
        //           -------------------------------------------------------
        //              = 6534000000000000000000000  (remaining supply)
        //
        // So "supply for this epoch" is 1% of "remaining supply":
        // 
        //                6534000000000000000000000  (remaining supply)
        //                                   * 0.01  (1% of remaining supply)
        //           -------------------------------------------------------
        //               =  65340000000000000000000  (supply for this epoch)
        //
        // We calculate "supply per block" by hand like:
        //
        //                  65340000000000000000000  (supply for this epoch)
        //                                      * 6  (time per one block generation: 6 seconds)
        //                     / (30 * 24 * 60 * 60) (one epoch by second unit: 30 d * 24 hr * 60 min * 60 s = 2,592,000 seconds)
        //           -----------------------------------------------------------------------------------------------------------------
        //                =      151250000000000000  (supply per block)
        //
        // So the "supply for this epoch" is "65340000000000000000000" and "supply per block" is 151250000000000000.
        // If they are not, it will occurs error, else not. 
        await this.TAN.updateSupply({ from: minter });
        assert.equal((await this.TAN.SupplyPerEpoch()).toString(), '65340000000000000000000');
        assert.equal((await this.TAN.SupplyPerBlock()).toString(), '151250000000000000');
    });

    it('supply per block is decreased by each "distribution epoch"', async () => {
        
        console.log("\t     Epoch               Circulating Supply(TAN wel)     Supply per Epoch(TAN wei)    Supply per Block(TAN wei)");
        await this.TAN.updateSupply({ from: minter });
        console.log("\t 1st(launch day)                        "                   
                    + (await this.TAN.CirculatingSupply()).toString() + "                 " 
                    + (await this.TAN.SupplyPerEpoch()).toString() + "         " 
                    + (await this.TAN.SupplyPerBlock()).toString());
        
        // Increase time by 30 days = 86400 * 30 seconds.
        await network.provider.send("evm_increaseTime", [86400 * 30]);
        await network.provider.send("evm_mine");
        await this.TAN.updateSupply({ from: minter });
        console.log("\t 2nd( 30th day)            "                   
                    + (await this.TAN.CirculatingSupply()).toString() + "        " 
                    + (await this.TAN.SupplyPerEpoch()).toString() + "         " 
                    + (await this.TAN.SupplyPerBlock()).toString());
        
        // Increase time by 30 days = 86400 * 30 seconds.
        await network.provider.send("evm_increaseTime", [86400 * 30]);
        await network.provider.send("evm_mine");
        await this.TAN.updateSupply({ from: minter });
        console.log("\t 3td( 60th day)           "                   
                    + (await this.TAN.CirculatingSupply()).toString() + "        " 
                    + (await this.TAN.SupplyPerEpoch()).toString() + "         " 
                    + (await this.TAN.SupplyPerBlock()).toString());
        
        // Increase time by 30 days = 86400 * 30 seconds.
        await network.provider.send("evm_increaseTime", [86400 * 30]);
        await network.provider.send("evm_mine");
        await this.TAN.updateSupply({ from: minter });
        console.log("\t 4th( 90th day)           "                   
                    + (await this.TAN.CirculatingSupply()).toString() + "        " 
                    + (await this.TAN.SupplyPerEpoch()).toString() + "         " 
                    + (await this.TAN.SupplyPerBlock()).toString());
        
        // Increase time by 30 days = 86400 * 30 seconds.
        await network.provider.send("evm_increaseTime", [86400 * 30]);
        await network.provider.send("evm_mine");
        await this.TAN.updateSupply({ from: minter });
        console.log("\t 5th(120th day)           "                   
                    + (await this.TAN.CirculatingSupply()).toString() + "        " 
                    + (await this.TAN.SupplyPerEpoch()).toString() + "         " 
                    + (await this.TAN.SupplyPerBlock()).toString());
        console.log("\t\t ... ... ... ... ... ...");
    });

    it('mint', async () => {
        await this.TAN.mint(alice, 1000, { from: minter });
        assert.equal((await this.TAN.balanceOf(alice)).toString(), '1000');
    });
});
