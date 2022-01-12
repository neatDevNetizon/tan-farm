const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert } = require("chai");
const TANToken = artifacts.require('TANToken');
const Workbench = artifacts.require('Workbench');
const Craftsman = artifacts.require('Craftsman');
const CraftsmanAdmin = artifacts.require('CraftsmanAdmin');
const MockERC20 = artifacts.require('MockERC20');

contract('CraftsmanAdmin', ([DAO, Growth, LP, Team, alice, newOwner, newOwner1, dev, minter]) => {
 beforeEach(async () => {
  // To make our discussion to simple, we suppose "supply per block" is "1000"
  // So we can calculate at first epoch like:
  // 
  //          1000 supply per block 
  // =   432000000 supply per epoch
  // = 43200000000 remaining supply ( = supply per epoch * 100)
  // = 43200000000 farming supply ( = remaining supply + circulating supply(0))
  // = 65454545455 maximum supply ( = farming supply / 0.66)
  // 
  // Therefore, our maximum supply is 65454545455
  this.TAN = await TANToken.new(65454545455, DAO, Growth, LP, Team, { from: minter });
  this.bench = await Workbench.new(this.TAN.address, { from: minter });
  this.craft = await Craftsman.new(this.TAN.address, this.bench.address, dev, '100', { from: minter });
  this.craftsAdmin = await CraftsmanAdmin.new(this.craft.address, { from: minter });

  await this.TAN.transferOwnership(this.craft.address, { from: minter });
  await this.bench.transferOwnership(this.craft.address, { from: minter });
  await this.craft.transferOwnership(this.craftsAdmin.address, { from: minter });

  this.lp1 = await MockERC20.new('LPToken', 'LP1', '1000000', { from: minter });
 });

 describe('add', () => {
  it('only owner can call', async () => {
   await expectRevert(this.craftsAdmin.add(1000, this.lp1.address, true, { from: alice }), 'Ownable: caller is not the owner');
  });

  it('can call add', async () => {
   await this.craftsAdmin.add(1000, this.lp1.address, true, { from: minter });
   assert.equal(await this.craft.poolLength(), 2);
  });
 });

 describe('set', () => {
  beforeEach(async () => {
   await this.craftsAdmin.add(1000, this.lp1.address, true, { from: minter });
  });

  it('only owner can call', async () => {
   await expectRevert(this.craftsAdmin.set(1, 2000, true, { from: alice }), 'Ownable: caller is not the owner');
  });

  it('can call set', async () => {
   await this.craftsAdmin.set(1, 2000, true, { from: minter });
   const pool = await this.craft.poolInfo(1);
   assert.equal(pool.allocPoint, 2000);
  });
 });

 describe('updateSupply', () => {
  beforeEach(() => {});
  it('only owner can call', async () => {
   await expectRevert(this.craftsAdmin.updateSupply({ from: alice }), 'Ownable: caller is not the owner');
  });

  it('can call updateSupply', async () => {
   await this.craftsAdmin.updateSupply({ from: minter });
   assert.equal(await this.TAN.SupplyPerBlock(), 1000);
  });
 });

 describe('updateStakingRatio', () => {
  it('only owner can call', async () => {
   await expectRevert(this.craftsAdmin.updateStakingRatio(10, { from: alice }), 'Ownable: caller is not the owner');
  });

  it('can call updateSupply', async () => {
   await this.craftsAdmin.updateStakingRatio(10, { from: minter });
   assert.equal(await this.craft.TANStakingRatio(), 10);
  });
 });

 describe('enableTransferOwnership', () => {
  it('only owner can call', async () => {
   await expectRevert(this.craftsAdmin.enableTransferOwnership(newOwner, { from: alice }), 'Ownable: caller is not the owner');
  });

  it('can call enableTransferOwnership', async () => {
   const timelock = await this.craftsAdmin.TRANSFER_OWNERSHIP_TIMELOCK();
   await this.craftsAdmin.enableTransferOwnership(newOwner, { from: minter });
   assert.equal((await this.craftsAdmin.newOwner()).toString(), newOwner);
   assert.equal(
    (await this.craftsAdmin.transferOwnershipTimeLock()).toString(),
    (await time.latest()).add(timelock).toString()
   );
  });

  it('changing newOwner resets the timer', async () => {
   const timelock = await this.craftsAdmin.TRANSFER_OWNERSHIP_TIMELOCK();
   await this.craftsAdmin.enableTransferOwnership(newOwner, { from: minter });
   await time.increase(timelock);
   await this.craftsAdmin.enableTransferOwnership(newOwner1, { from: minter });

   assert.equal((await this.craftsAdmin.newOwner()).toString(), newOwner1);
   assert.equal(
    (await this.craftsAdmin.transferOwnershipTimeLock()).toString(),
    (await time.latest()).add(timelock).toString()
   );
  });
 });

 describe('transferOwnership', () => {
  it('only owner can call', async () => {
   await expectRevert(this.craftsAdmin.transferOwnership({ from: alice }), 'Ownable: caller is not the owner');
  });

  it('cannot call when timelock timestamp not reached', async () => {
   await this.craftsAdmin.enableTransferOwnership(newOwner, { from: minter });

   await time.increase(
    (await this.craftsAdmin.TRANSFER_OWNERSHIP_TIMELOCK())
     .sub(time.duration.seconds(1)));
   await expectRevert(this.craftsAdmin.transferOwnership({ from: minter }), "CraftsmanAdmin: transferOwnership not ready");

  });

  it('can transferOwnership after timelock timestamp', async () => {
   await this.craftsAdmin.enableTransferOwnership(newOwner, { from: minter });

   await time.increase(await this.craftsAdmin.TRANSFER_OWNERSHIP_TIMELOCK());
   await time.increase(time.duration.seconds(1));
   await this.craftsAdmin.transferOwnership({ from: minter });
   assert.equal((await this.craft.owner()).toString(), newOwner);
  });
 });
});
