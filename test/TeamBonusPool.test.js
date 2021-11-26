const TeamBonusPool = artifacts.require('./TeamBonusPool.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
} = require('openzeppelin-test-helpers');

require('chai').should();

contract('TeamBonusPool', accounts => {
    let deployedTime = 0;
    beforeEach(async function() {
        let datagen_contract;
        this.token = await DataGen.new();

        

        const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
        const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
        deployedTime = deployedBlock.timestamp;
        
        this.contractDeployed = await TeamBonusPool.deployed(); //use when nedd to test migration parameters
        this.contractClosed = await TeamBonusPool.new(this.token.address); 
        
    });

    describe('Initialise TeamBonusPool attributes', function() {
        it('has the correct totalAmount', async function() {
            const totalAmount = await this.contractDeployed.totalAmount();
            totalAmount.toString().should.equal("300000000000000000000000"); 
        });
        it('has the correct lockTime', async function() {
            const lockTime = await this.contractDeployed.lockTime();
            lockTime.toString().should.equal('1646006400');    //2022.2.28
        });
        it('has the correct leftAmount', async function() {
            const leftAmount = await this.contractDeployed.leftAmount();
            leftAmount.toString().should.equal('300000000000000000000000');                   //(21/12/2023 00:00:00)
        });

    });
    describe('sendBonus', async function() {
        it('has to revert if the receiver address is deadAddress', async function() {
            await expectRevert (
                this.contractClosed.sendBonus("0x000000000000000000000000000000000000dEaD", 100),
                'You are sending tokens to dead Address.'
            );
        });
        it('has to revert if the contract has less #DG token than amount', async function() {
            this.contractClosed.sendBonus(accounts[0], "300000000000000000000000");
            await expectRevert (
                this.contractClosed.sendBonus("0xBEE7764727e7FeACC9C640Ae6AC0809404C491Fa", 1000),
                'Left token is not enough.'
            );
        });
     
    });

    describe('releaseBonus', async function() {
        it('has to revert if the not started releaseBonus', async function() {
            await expectRevert (
                this.contractClosed.releaseBonus( ),
                'Pool is locked until 1st of February 2022.'
            );
        });
        it('has to revert if the caller is not bonus receiver', async function() {
            this.contractClosed.setLockTime();
            await expectRevert (
                this.contractClosed.releaseBonus( { from: accounts[1] } ),
                'You are not bonus Receiver.'
            );
        });


        it('has to revert if the already release today', async function() {
            this.contractClosed.sendBonus(accounts[0], "10000");
            this.contractClosed.setLockTime();
            
            this.token.mint( this.contractClosed.address, "300000000000000000000000");
            this.contractClosed.releaseBonus( {from: accounts[0]} );
            await expectRevert (
                this.contractClosed.releaseBonus(),
                'Already released.'
            );
        });
     
    });
});