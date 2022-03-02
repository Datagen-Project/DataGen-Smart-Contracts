const TeamMainPool = artifacts.require('./TeamMainPool.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
    time,
} = require('@openzeppelin/test-helpers');
const { should } = require('chai');

require('chai').should();

contract('TeamMainPool', accounts => {
    let deployedTime = 0;
    beforeEach(async function() {
        let datagen_contract;
        this.DataGenToken = await DataGen.new();

        const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
        const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
        deployedTime = deployedBlock.timestamp;
        
        this.contractDeployed = await TeamMainPool.deployed(); //use when nedd to test migration parameters
        this.contractClosed = await TeamMainPool.new(this.DataGenToken.address);

        const fundDG = new BN('1700000000000000000000000');
        await this.DataGenToken.transfer(this.contractClosed.address, fundDG, {from: accounts[0]});
    });

    describe('Initialise TeamMainPool attributes', function() {
        it('has the correct totalAmount', async function() {
            const totalAmount = await this.contractDeployed.totalAmount();
            totalAmount.toString().should.equal("1700000000000000000000000"); 
        });
        it('has the correct lockTime1', async function() {
            const lockTime1 = await this.contractDeployed.lockTime1();
            lockTime1.toString().should.equal('1659312000');
        });
        it('has the correct lockTime2', async function() {
            const lockTime2 = await this.contractDeployed.lockTime2();
            lockTime2.toString().should.equal('1690848000');
        });

        it('has the correct lockTime3', async function() {
            const lockTime3 = await this.contractDeployed.lockTime3();
            lockTime3.toString().should.equal('1711816800');
        });

        it('has the correct leftAmount', async function() {
            const leftAmount = await this.contractDeployed.leftAmount();
            leftAmount.toString().should.equal('1700000000000000000000000');                   
        });

    });
    describe('setSalary', async function() {
        it('has to revert if the receiver address is deadAddress', async function() {
            await expectRevert (
                this.contractClosed.sendSalary("0x000000000000000000000000000000000000dEaD", 100),
                'You are sending tokens to dead Address.'
            );
        });
        it('has to revert if the contract has less #DG token than amount', async function() {
            await expectRevert (
                this.contractClosed.sendSalary(accounts[0], "1700000000000000000000001"),
                'Left token is not enough.'
            );
        });
     
    });
    describe('releaseSalary', async function() {
        it('has to revert if the caller is not salary receiver', async function() {
            await expectRevert (
                this.contractClosed.releaseSalary( { from: accounts[1] } ),
                'You are not salary Receiver.'
            );
        });
        it('has to release the correct salary before lock time', async function() {
            const salary = new BN('1000000000000000000000');

            await this.contractClosed.setSalary(accounts[4], salary, {from: accounts[0]});
            
            await this.contractClosed.releaseSalary({from: accounts[4]});
            const tenPercentSalary = await this.DataGenToken.balanceOf(accounts[4]);

            tenPercentSalary.toString().should.equal('100000000000000000000');
        });
        it('has to release the correct salary first lock time', async function() {
            const salary = new BN('1000000000000000000000');

            await this.contractClosed.setSalary(accounts[4], salary, {from: accounts[0]});
            await this.contractClosed.releaseSalary({from: accounts[4]});

            await time.increaseTo(1659312000);
            await this.contractClosed.releaseSalary({from: accounts[4]});

            for (i = 0; i < 2; i++) {
                await time.increase(time.duration.days(30));
                await this.contractClosed.releaseSalary({from: accounts[4]})
            }

            const fortyPercentSalary = await this.DataGenToken.balanceOf(accounts[4])

            fortyPercentSalary.toString().should.equal('400000000000000000000');
        });
        it('has to release the correct salary second lock time', async function() {
            const salary = new BN('1000000000000000000000');

            await this.contractClosed.setSalary(accounts[4], salary, {from: accounts[0]});
            await this.contractClosed.releaseSalary({from: accounts[4]});

            await time.increaseTo(1659312000);
            await this.contractClosed.releaseSalary({from: accounts[4]});

            for (i = 0; i < 2; i++) {
                await time.increase(time.duration.days(30));
                await this.contractClosed.releaseSalary({from: accounts[4]})
            }

            time.increaseTo(1690848000);
            await this.contractClosed.releaseSalary({from: accounts[4]});

            for (i = 0; i < 2; i++) {
                await time.increase(time.duration.days(30));
                await this.contractClosed.releaseSalary({from: accounts[4]})
            }

            const seventyPercentSalary = await this.DataGenToken.balanceOf(accounts[4])

            seventyPercentSalary.toString().should.equal('700000000000000000000');
        });
        it.only('has to release the correct salary third lock time', async function() {
            const salary = new BN('1000000000000000000000');

            await this.contractClosed.setSalary(accounts[4], salary, {from: accounts[0]});
            await this.contractClosed.releaseSalary({from: accounts[4]});

            await time.increaseTo(1659312000);
            await this.contractClosed.releaseSalary({from: accounts[4]});

            for (i = 0; i < 2; i++) {
                await time.increase(time.duration.days(30));
                await this.contractClosed.releaseSalary({from: accounts[4]})
            }

            time.increaseTo(1690848000);
            await this.contractClosed.releaseSalary({from: accounts[4]});

            for (i = 0; i < 2; i++) {
                await time.increase(time.duration.days(30));
                await this.contractClosed.releaseSalary({from: accounts[4]});
            }

            time.increaseTo(1711816800);
            await this.contractClosed.releaseSalary({from: accounts[4]});

            for (i = 0; i < 47; i++) {
                await time.increase(time.duration.days(30));
                await this.contractClosed.releaseSalary({from: accounts[4]});
            }

            const totalSalary = await this.DataGenToken.balanceOf(accounts[4])

            totalSalary.toString().should.equal('1000000000000000000000');
        });
    });
});