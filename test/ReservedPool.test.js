const ReservedPool = artifacts.require('./ReservedPool.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
} = require('openzeppelin-test-helpers');

require('chai').should();

contract('ReservedPool', accounts => {
    let deployedTime = 0;
    beforeEach(async function() {
        let datagen_contract;
        this.token = await DataGen.new();

        

        const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
        const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
        deployedTime = deployedBlock.timestamp;
        
        this.contractDeployed = await ReservedPool.deployed(); //use when nedd to test migration parameters
        this.contractClosed = await ReservedPool.new(this.token.address,
            "0x2A6823d42DeF025f73419B10cF63dFb593bB4978"); 
        
    });

    describe('Initialise ReservedPool attributes', function() {
        it('has the correct companyWallet', async function() {
            const companyWallet = await this.contractDeployed.companyWallet();
            companyWallet.toString().should.equal("0x2A6823d42DeF025f73419B10cF63dFb593bB4978"); 
        });
        it('has the correct frAmount', async function() {
            const frAmount = await this.contractDeployed.frAmount();
            frAmount.toString().should.equal('750000000000000000000000');    //750000 * 10^18
        });
        it('has the correct srAmount', async function() {
            const srAmount = await this.contractDeployed.srAmount();
            srAmount.toString().should.equal('750000000000000000000000');                   //(21/12/2023 00:00:00)
        });
        it('has the correct srStart', async function() {
            const srStart = await this.contractDeployed.srStart();
            srStart.toString().should.equal('1734220800'); 
        });


    });
    describe('releaseDataGen', async function() {
        it('has to revert if the contract does not start firstRelease', async function() {
            await expectRevert (
                this.contractClosed.releaseDataGen(),
                'Pool is Still locked.'
            );
        });
        it('has to revert if the contract has zero #DG token', async function() {
            this.contractClosed.setFirstReleaseTime();
            await expectRevert (
                this.contractClosed.releaseDataGen(),
                'Zero #DG left.'
            );
        });
        it('has to revert if the release 2+ times a day in firstRelease', async function() {
            this.contractClosed.setFirstReleaseTime();
            this.token.mint( this.contractClosed.address, "2699999000000000000000000");
            this.contractClosed.releaseDataGen();
            await expectRevert (
                this.contractClosed.releaseDataGen(),
                'Already released.'
            );
        });

        it('has to revert if the release 2+ times a day in secondRelease', async function() {
            this.contractClosed.setFirstReleaseTime();
            this.contractClosed.setSecondReleaseTime();
            this.token.mint( this.contractClosed.address, "750000000000000000000000");
            this.contractClosed.releaseDataGen();
            await expectRevert (
                this.contractClosed.releaseDataGen(),
                'Already released.'
            );
        });
        
    });
});