const CoFounderPool = artifacts.require('./CoFounderPool.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
    time,
} = require('@openzeppelin/test-helpers');

require('chai').should();

contract('CoFounderPool', accounts => {
    let deployedTime = 0;
    beforeEach(async function() {
        let datagen_contract;
        this.DataGenToken = await DataGen.new();

        

        const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
        const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
        deployedTime = deployedBlock.timestamp;
        
        this.contractDeployed = await CoFounderPool.deployed(); //use when nedd to test migration parameters
        this.contractClosed = await CoFounderPool.new(this.DataGenToken.address, accounts[4], accounts[5], deployedTime); 
        
        const fundDG = new BN('3000000000000000000000000');
        await this.DataGenToken.transfer(this.contractClosed.address, fundDG, {from: accounts[0]});
    });

    describe('Initialise CoFounderPool attributes', function() {
        it('has the correct releaseStart', async function() {
            const releaseStart = await this.contractDeployed.releaseStart();
            const checkTime = deployedTime + 1095 * 24 * 60 * 60;  //1095 days
             releaseStart.toString().should.equal(checkTime.toString()); 
        });
        it('has the correct cfAmount', async function() {
            const cfAmount = await this.contractDeployed.cfAmount();
            cfAmount.toString().should.equal('3000000000000000000000000');  //3000000 * 10^18
        });
        it('has the correct rcfAmount', async function() {
            const rcfAmount = await this.contractDeployed.rcfAmount();
            rcfAmount.toString().should.equal('2700000000000000000000000');  //2700000 * 10^18
        });
        it('has the correct beginAmount', async function() {
            const beginAmount = await this.contractDeployed.beginAmount();
            beginAmount.toString().should.equal('300000000000000000000000');  //300000 * 10^18
        });


    });
    describe('releaseDataGen', async function() {
        it('has to revert if the contract has zero #DG token', async function() {
            await expectRevert (
                this.contractDeployed.releaseDataGen(),
                'Zero #DG left.'
            );
        });
        it('has to revert if the release 2+ times a day', async function() {
            time.increase(time.duration.days(1095));
            this.contractClosed.releaseDataGen();
            await expectRevert (
                this.contractClosed.releaseDataGen(),
                'Already released.'
            );
        });
        it('has to release the correct amount first release', async function() {
            this.contractClosed.releaseDataGen();

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            const balanceAccount5 = await this.DataGenToken.balanceOf(accounts[5]);

            const totalAmount = balanceAccount4.add(balanceAccount5);

            totalAmount.toString().should.equal('300000000000000000000000');
        });
        it.only('has to release the correct amount, first release + 10 release second release', async function() {
            await this.contractClosed.releaseDataGen();

            await time.increase(time.duration.days(1095));
            await this.contractClosed.releaseDataGen();

            for (i = 0; i < 9; i++) {
                await time.increase(time.duration.days(1));
                await this.contractClosed.releaseDataGen();
            }

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            const balanceAccount5 = await this.DataGenToken.balanceOf(accounts[5]);

            const totalAmount = balanceAccount4.add(balanceAccount5);

            totalAmount.toString().should.equal('305400000000000000000000');
        });
    });
});

