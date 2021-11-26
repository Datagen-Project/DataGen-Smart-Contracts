const TeamMainPool = artifacts.require('./TeamMainPool.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
} = require('openzeppelin-test-helpers');

require('chai').should();

contract('TeamMainPool', accounts => {
    let deployedTime = 0;
    beforeEach(async function() {
        let datagen_contract;
        this.token = await DataGen.new();

        

        const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
        const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
        deployedTime = deployedBlock.timestamp;
        
        this.contractDeployed = await TeamMainPool.deployed(); //use when nedd to test migration parameters
        this.contractClosed = await TeamMainPool.new(this.token.address); 
        
    });

    describe('Initialise TeamMainPool attributes', function() {
        it('has the correct totalAmount', async function() {
            const totalAmount = await this.contractDeployed.totalAmount();
            totalAmount.toString().should.equal("1700000000000000000000000"); 
        });
        it('has the correct lockTime1', async function() {
            const lockTime1 = await this.contractDeployed.lockTime1();
            lockTime1.toString().should.equal('1651363200');    //2022.5.1
        });
        it('has the correct lockTime2', async function() {
            const lockTime2 = await this.contractDeployed.lockTime2();
            lockTime2.toString().should.equal('1682899200');                   //2023.5.1
        });

        it('has the correct lockTime3', async function() {
            const lockTime3 = await this.contractDeployed.lockTime3();
            lockTime3.toString().should.equal('1703980800');                   //2023.12.31
        });

        it('has the correct leftAmount', async function() {
            const leftAmount = await this.contractDeployed.leftAmount();
            leftAmount.toString().should.equal('1700000000000000000000000');                   
        });

    });
    describe('sendSalary', async function() {
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
     
    });
});