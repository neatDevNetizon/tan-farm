const { advanceBlockTo } = require('@openzeppelin/test-helpers/src/time');
const { assert } = require('chai');
const TANToken = artifacts.require('TANToken');
const Workbench = artifacts.require('Workbench');

contract('Workbench', ([DAO, Growth, LP, Team, alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.TAN = await TANToken.new(1000000, DAO, Growth, LP, Team, { from: minter });
    this.bench = await Workbench.new(this.TAN.address, { from: minter });
  });

  it('mint', async () => {
    await this.bench.mint(alice, 1000, { from: minter });
    assert.equal((await this.bench.balanceOf(alice)).toString(), '1000');
  });

  it('burn', async () => {
    await advanceBlockTo('800');
    await this.bench.mint(alice, 1000, { from: minter });
    await this.bench.mint(bob, 1000, { from: minter });
    assert.equal((await this.bench.totalSupply()).toString(), '2000');
    await this.bench.burn(alice, 200, { from: minter });

    assert.equal((await this.bench.balanceOf(alice)).toString(), '800');
    assert.equal((await this.bench.totalSupply()).toString(), '1800');
  });

  it('safeTANTransfer', async () => {
    assert.equal(
      (await this.TAN.balanceOf(this.bench.address)).toString(),
      '0'
    );
    await this.TAN.mint(this.bench.address, 1000, { from: minter });
    await this.bench.safeTANTransfer(bob, 200, { from: minter });
    assert.equal((await this.TAN.balanceOf(bob)).toString(), '200');
    assert.equal(
      (await this.TAN.balanceOf(this.bench.address)).toString(),
      '800'
    );
    await this.bench.safeTANTransfer(bob, 2000, { from: minter });
    assert.equal((await this.TAN.balanceOf(bob)).toString(), '1000');
  });
});
