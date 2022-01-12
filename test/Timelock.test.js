const { expectRevert, time } = require('@openzeppelin/test-helpers');
const ethers = require('ethers');
const TANToken = artifacts.require('TANToken');
const Craftsman = artifacts.require('Craftsman');
const MockERC20 = artifacts.require('libs/MockERC20');
const Timelock = artifacts.require('Timelock');
const Workbench = artifacts.require('Workbench');

function encodeParameters(types, values) {
    const abi = new ethers.utils.AbiCoder();
    return abi.encode(types, values);
}

contract('Timelock', ([DAO, Growth, LP, Team, alice, bob, carol, dev, minter]) => {
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
        this.TAN = await TANToken.new(65454545455, DAO, Growth, LP, Team, { from: alice });
        this.timelock = await Timelock.new(bob, '28800', { from: alice }); //8hours
    });

    it('should not allow non-owner to do operation', async () => {
        await this.TAN.transferOwnership(this.timelock.address, { from: alice });
        await expectRevert(
            this.TAN.transferOwnership(carol, { from: alice }),
            'Ownable: caller is not the owner',
        );
        await expectRevert(
            this.TAN.transferOwnership(carol, { from: bob }),
            'Ownable: caller is not the owner',
        );
        await expectRevert(
            this.timelock.queueTransaction(
                this.TAN.address, '0', 'transferOwnership(address)',
                encodeParameters(['address'], [carol]),
                (await time.latest()).add(time.duration.hours(6)),
                { from: alice },
            ),
            'Timelock::queueTransaction: Call must come from admin.',
        );
    });

    it('should do the timelock thing', async () => {
        await this.TAN.transferOwnership(this.timelock.address, { from: alice });
        const eta = (await time.latest()).add(time.duration.hours(9));
        await this.timelock.queueTransaction(
            this.TAN.address, '0', 'transferOwnership(address)',
            encodeParameters(['address'], [carol]), eta, { from: bob },
        );
        await time.increase(time.duration.hours(1));
        await expectRevert(
            this.timelock.executeTransaction(
                this.TAN.address, '0', 'transferOwnership(address)',
                encodeParameters(['address'], [carol]), eta, { from: bob },
            ),
            "Timelock::executeTransaction: Transaction hasn't surpassed time lock.",
        );
        await time.increase(time.duration.hours(8));
        await this.timelock.executeTransaction(
            this.TAN.address, '0', 'transferOwnership(address)',
            encodeParameters(['address'], [carol]), eta, { from: bob },
        );
        assert.equal((await this.TAN.owner()).valueOf(), carol);
    });

    it('should also work with Craftsman', async () => {
        this.lp1 = await MockERC20.new('LPToken', 'LP', '10000000000', { from: minter });
        this.lp2 = await MockERC20.new('LPToken', 'LP', '10000000000', { from: minter });
        this.bench = await Workbench.new(this.TAN.address, { from: minter });
        this.craft = await Craftsman.new(this.TAN.address, this.bench.address, dev, '0', { from: alice });
        await this.TAN.transferOwnership(this.craft.address, { from: alice });
        await this.bench.transferOwnership(this.craft.address, { from: minter });
        await this.craft.add('100', this.lp1.address, true, { from: alice });
        await this.craft.transferOwnership(this.timelock.address, { from: alice });
        await expectRevert(
            this.craft.add('100', this.lp1.address, true, { from: alice }),
            "Ownable: caller is not the owner",
        );

        const eta = (await time.latest()).add(time.duration.hours(9));
        await this.timelock.queueTransaction(
            this.craft.address, '0', 'transferOwnership(address)',
            encodeParameters(['address'], [minter]), eta, { from: bob },
        );
        // await this.timelock.queueTransaction(
        //     this.craft.address, '0', 'add(uint256,address,bool)',
        //     encodeParameters(['uint256', 'address', 'bool'], ['100', this.lp2.address, false]), eta, { from: bob },
        // );
        await time.increase(time.duration.hours(9));
        await this.timelock.executeTransaction(
            this.craft.address, '0', 'transferOwnership(address)',
            encodeParameters(['address'], [minter]), eta, { from: bob },
        );
        await expectRevert(
            this.craft.add('100', this.lp1.address, true, { from: alice }),
            "Ownable: caller is not the owner",
        );
        await this.craft.add('100', this.lp1.address, true, { from: minter })
        // await this.timelock.executeTransaction(
        //     this.craft.address, '0', 'add(uint256,address,bool)',
        //     encodeParameters(['uint256', 'address', 'bool'], ['100', this.lp2.address, false]), eta, { from: bob },
        // );
        // assert.equal((await this.craft.poolInfo('0')).valueOf().allocPoint, '200');
        // assert.equal((await this.craft.totalAllocPoint()).valueOf(), '300');
        // assert.equal((await this.craft.poolLength()).valueOf(), '2');
    });
});
