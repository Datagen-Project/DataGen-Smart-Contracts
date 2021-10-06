const CoFounderPool = artifacts.require('./CoFounderPool.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
} = require('openzeppelin-test-helpers');

require('chai').should();

contract('CoFounderPool', accounts => {
    let deployedTime = 0;
    beforeEach(async function() {
        let datagen_contract;
        this.token = await DataGen.new();

        

        const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
        const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
        deployedTime = deployedBlock.timestamp;
        
        this.contractDeployed = await CoFounderPool.deployed(); //use when nedd to test migration parameters
        this.contractClosed = await CoFounderPool.new(this.token.address,
            "0xAb9a7647f6f266C8dD77c41C1faaa0c4ce489B12",
            "0xBEE7764727e7FeACC9C640Ae6AC0809404C491Fa",
            deployedTime); 
        
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
                this.contractClosed.releaseDataGen(),
                'Zero #DG left.'
            );
        });
        it('has to revert if the contract has less than 2700000 #DG token', async function() {
            this.token.mint( this.contractClosed.address, 10000);
            await expectRevert (
                this.contractClosed.releaseDataGen(),
                'Beginning amount already released to co-founders'
            );
        });
        it('has to revert if the release 2+ times a day', async function() {
            this.contractClosed.setReleaseTime();
            this.token.mint( this.contractClosed.address, "2699999000000000000000000");
            this.contractClosed.releaseDataGen();
            await expectRevert (
                this.contractClosed.releaseDataGen(),
                'Already released.'
            );
        });
        
    });
});