const { assert } = require("chai");

const TANToken = artifacts.require('TANToken');

contract('TANToken', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.TAN = await TANToken.new('10000000000000000000000000', { from: minter });
    });


    it('mint', async () => {
        await this.TAN.mint(alice, 1000, { from: minter });
        assert.equal((await this.TAN.balanceOf(alice)).toString(), '1000');
    })
});
