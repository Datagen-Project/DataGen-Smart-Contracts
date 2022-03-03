const ReservedPool = artifacts.require('./ReservedPool.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
    time,
} = require('@openzeppelin/test-helpers');

require('chai').should();

contract('ReservedPool', accounts => {
    let deployedTime = 0;
    beforeEach(async function() {
        this.DataGenToken = await DataGen.new();

        const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
        const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
        deployedTime = deployedBlock.timestamp;
        
        this.contractDeployed = await ReservedPool.deployed(); //use when nedd to test migration parameters

        this.contractClosed = await ReservedPool.new(this.DataGenToken.address, accounts[4]); 
            
        const fundDG = new BN('1500000000000000000000000');
        this.DataGenToken.transfer(this.contractClosed.address, fundDG, {from: accounts[0]});
    });

    describe('Initialise ReservedPool attributes', function() {
        it('has the correct companyWallet', async function() {
            const companyWallet = await this.contractDeployed.companyWallet(0);
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
            await time.increaseTo(1703116800);
            await expectRevert (
                this.contractClosed.releaseDataGen(),
                'Zero #DG left.'
            );
        });
        it('has to revert if the release 2+ times a day in firstRelease', async function() {
            await time.increaseTo(1703116800);
            this.contractClosed.releaseDataGen();
            await expectRevert (
                this.contractClosed.releaseDataGen(),
                'Already released.'
            );
        });
        it('has to revert if the release 2+ times a day in secondRelease', async function() {
            await time.increaseTo(1703116800);
            this.contractClosed.releaseDataGen();
            await time.increaseTo(1734220800);
            this.contractClosed.releaseDataGen();
            await expectRevert (
                this.contractClosed.releaseDataGen(),
                'Already released.'
            );
        });
        it('has to release the correct amount', async function() {
            await time.increaseTo(1703116800);
            await this.contractClosed.releaseDataGen();

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            balanceAccount4.toString().should.equal('62500000000000000000000');
        });
        it('has to release the correct amount, 5 release', async function() {
            await time.increaseTo(1703116800);
            await this.contractClosed.releaseDataGen();

            for (i = 0; i < 4; i++) {
                await time.increase(time.duration.days(30));
                await this.contractClosed.releaseDataGen();
            }

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            balanceAccount4.toString().should.equal('312500000000000000000000');
        });
        it('has to release the correct amount, all release', async function() {
            await time.increaseTo(1703116800);
            await this.contractClosed.releaseDataGen();

            for (i = 0; i < 11; i++) {
                await time.increase(time.duration.days(30));
                await this.contractClosed.releaseDataGen();
            }

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            balanceAccount4.toString().should.equal('750000000000000000000000');
        });
        it('has to release the correct amount, all release in one time', async function() {
            await time.increaseTo(1703116800);

            for (i = 0; i < 11; i++) {
                await time.increase(time.duration.days(30));
            }

            await this.contractClosed.releaseDataGen();

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            balanceAccount4.toString().should.equal('750000000000000000000000');
        });
        it.only('has to release the correct amoount, all release firt/second', async function() {
            await time.increaseTo(1703116800);
            await this.contractClosed.releaseDataGen();

            for (i = 0; i < 11; i++) {
                await time.increase(time.duration.days(30));
                await this.contractClosed.releaseDataGen();
            }
           
            await time.increaseTo(1734220800);
            await this.contractClosed.releaseDataGen();

            for (i = 0; i < 23; i++) {
                await time.increase(time.duration.days(30));
                await this.contractClosed.releaseDataGen();
            }

            const balanceAccount4 = await this.DataGenToken.balanceOf(accounts[4]);
            balanceAccount4.toString().should.equal('1500000000000000000000000');
        })
    });
});