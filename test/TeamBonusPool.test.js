const TeamBonusPool = artifacts.require('./TeamBonusPool.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
    time,
} = require("@openzeppelin/test-helpers");

require('chai').should();

contract('TeamBonusPool', accounts => {
    let deployedTime = 0;
    beforeEach(async function () {
        let datagen_contract;
        this.DataGenToken = await DataGen.new();



        const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
        const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
        deployedTime = deployedBlock.timestamp;

        this.contractDeployed = await TeamBonusPool.deployed(); //use when nedd to test migration parameters

        const fundDG = new BN('300000000000000000000000');

        this.contractClosed = await TeamBonusPool.new(this.DataGenToken.address);
        await this.DataGenToken.transfer(this.contractClosed.address, fundDG, {from: accounts[0]});

    });

    describe('Initialise TeamBonusPool attributes', function () {
        it('has the correct totalAmount', async function () {
            const totalAmount = await this.contractDeployed.totalAmount();
            totalAmount.toString().should.equal("300000000000000000000000");
        });
        it('has the correct lockTime', async function () {
            const lockTime = await this.contractDeployed.lockTime();
            lockTime.toString().should.equal('1659304800');    //2022.6.1
        });
        it('has the correct leftAmount', async function () {
            const leftAmount = await this.contractDeployed.leftAmount();
            leftAmount.toString().should.equal('300000000000000000000000');                   //(21/12/2023 00:00:00)
        });

    });
    describe('setBonus function', async function () {
        it('has to revert if the receiver address is deadAddress', async function () {
            await expectRevert(
                this.contractClosed.setBonus("0x000000000000000000000000000000000000dEaD", 100),
                'You are sending tokens to dead Address.'
            );
        });
        it('has to revert if the contract has less #DG token than amount', async function () {
            this.contractClosed.setBonus(accounts[0], "300000000000000000000000");
            await expectRevert(
                this.contractClosed.setBonus("0xBEE7764727e7FeACC9C640Ae6AC0809404C491Fa", 1000),
                'Left token is not enough.'
            );
        });
        it('has to set the correct bonus to new team member', async function() {
            this.contractClosed.setBonus(accounts[4], '100000000000000000000', {from: accounts[0]});

            const bonus = await this.contractClosed.checkBonus(accounts[4]);
            bonus.toString().should.equal('100000000000000000000');
        })
    });

    describe('releaseBonus function', async function () {
        it('has to revert if the not started releaseBonus', async function () {
            await expectRevert(
                this.contractClosed.releaseBonus(),
                'Pool is locked until 1st of August 2022.'
            );
        });
        it('has to revert if the caller is not bonus receiver', async function () {
            this.contractClosed.setLockTime();
            await expectRevert(
                this.contractClosed.releaseBonus({ from: accounts[1] }),
                'You are not bonus Receiver.'
            );
        });
        it('has to release the correct amount of #DG to the team member (1st release)', async function() {
            this.contractClosed.setBonus(accounts[4], '100000000000000000000', {from: accounts[0]});
            await time.increaseTo(1659304801);

            this.contractClosed.releaseBonus({from: accounts[4]});

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            balanceAccount4.toString().should.equal('10000000000000000000');

        });
        it('has to release the correct amount of #DG to the team member (5 releases)', async function() {
            this.contractClosed.setBonus(accounts[4], '100000000000000000000', {from: accounts[0]});
            await time.increaseTo(1659304801);

            this.contractClosed.releaseBonus({from: accounts[4]});

            for(i = 0; i < 4; i++) {
                await time.increase(time.duration.days(30));
                this.contractClosed.releaseBonus({from: accounts[4]});
            }

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            balanceAccount4.toString().should.equal('50000000000000000000');

        });
        it('has to release the correct amount of #DG to the team member (all release)', async function() {
            this.contractClosed.setBonus(accounts[4], '100000000000000000000', {from: accounts[0]});
            await time.increaseTo(1659304801);

            this.contractClosed.releaseBonus({from: accounts[4]});

            for(i = 0; i < 9; i++) {
                await time.increase(time.duration.days(30));
                this.contractClosed.releaseBonus({from: accounts[4]});
            }

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            balanceAccount4.toString().should.equal('100000000000000000000');
        });
        it.only('has to release the correct amount of #DG to the team member (all release) in one time', async function() {
            this.contractClosed.setBonus(accounts[4], '100000000000000000000', {from: accounts[0]});
            await time.increaseTo(1659304801);

            for(i = 0; i < 9; i++) {
                await time.increase(time.duration.days(30));
            }

            this.contractClosed.releaseBonus({from: accounts[4]});

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            balanceAccount4.toString().should.equal('100000000000000000000');
        });

        it('has to revert if the already release today', async function () {
            this.contractClosed.setBonus(accounts[0], "10000");
            this.contractClosed.setLockTime();

            this.contractClosed.releaseBonus({ from: accounts[0] });
            await expectRevert(
                this.contractClosed.releaseBonus(),
                'Already released.'
            );
        });

    });
});