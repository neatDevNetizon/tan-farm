const { assert } = require("chai");
const BigNumber = require("bignumber.js");
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR, DECIMAL_PLACES: 0 });

const TANInitMintable = artifacts.require('TANInitMintable');

contract('TANInitMintable', ([alice, bob, carol, dev, minter]) => {
    const _maxSupply = "10000000000000000000000000"; // 10,000,000 TAN
    beforeEach(async () => {
        this.TANInitMintable = await TANInitMintable.new(_maxSupply, { from: minter });
    });


    it('distributeSupply', async () => {
        const supplyPerBlock = new BigNumber("6700000000000000000000000").multipliedBy(1).dividedBy(100).multipliedBy(6).dividedBy(30).dividedBy(86400);
        await this.TANInitMintable.distributeSupply([alice, bob, carol], ["11000000000000000000000", "11000000000000000000000", "11000000000000000000000"],  { from: minter });
        assert.equal((await this.TANInitMintable.balanceOf(alice)).toString(), '11000000000000000000000');
        assert.equal((await this.TANInitMintable.balanceOf(bob)).toString(), '11000000000000000000000');
        assert.equal((await this.TANInitMintable.balanceOf(carol)).toString(), '11000000000000000000000');
        assert.equal((await this.TANInitMintable.SupplyPerBlock()).toString(), supplyPerBlock.toString());
    });

    it('should only be called once before nextDistributionWindow', async () => {
        await this.TANInitMintable.distributeSupply([alice, bob, carol], ["11000000000000000000000", "11000000000000000000000", "11000000000000000000000"],  { from: minter });
        assert.equal((await this.TANInitMintable.balanceOf(alice)).toString(), '11000000000000000000000');
        assert.equal((await this.TANInitMintable.balanceOf(bob)).toString(), '11000000000000000000000');
        assert.equal((await this.TANInitMintable.balanceOf(carol)).toString(), '11000000000000000000000');

        // 29th day
        await network.provider.send("evm_increaseTime", [86400 * 29]);
        await network.provider.send("evm_mine");
        try {
            await this.TANInitMintable.distributeSupply([alice, bob, carol], ["11000000000000000000000", "11000000000000000000000", "11000000000000000000000"],  { from: minter });
        } catch (err) {
            assert.include(err.message, "Not ready");
            assert.equal((await this.TANInitMintable.balanceOf(alice)).toString(), '11000000000000000000000');
            assert.equal((await this.TANInitMintable.balanceOf(bob)).toString(), '11000000000000000000000');
            assert.equal((await this.TANInitMintable.balanceOf(carol)).toString(), '11000000000000000000000');
        }

        // 30th day
        await network.provider.send("evm_increaseTime", [86400]);
        await network.provider.send("evm_mine");
        await this.TANInitMintable.distributeSupply([alice, bob, carol], ["11000000000000000000000", "11000000000000000000000", "11000000000000000000000"],  { from: minter });
        assert.equal((await this.TANInitMintable.balanceOf(alice)).toString(), '22000000000000000000000');
        assert.equal((await this.TANInitMintable.balanceOf(bob)).toString(), '22000000000000000000000');
        assert.equal((await this.TANInitMintable.balanceOf(carol)).toString(), '22000000000000000000000');
    });
});
