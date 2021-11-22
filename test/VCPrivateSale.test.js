const VCPrivateSale = artifacts.require('./VCPrivateSale.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
} = require('@openzeppelin/test-helpers');

require('chai').should();

contract('VCPrivateSale', accounts => {
    beforeEach(async function() {
        this.token = await DataGen.new();
        this.contractDeployed = await VCPrivateSale.deployed(); //use when nedd to test migration parameters
        this.contractClosed = await VCPrivateSale.new(this.token.address, 1631806094, 1631806094, 163180694); //closed VC
    });

    describe('Initialise VCPrivateSale attributes', function() {
        it('has the correct maxGoal', async function() {
            const maxGoal = await this.contractDeployed.maxGoal();
            maxGoal.toString().should.equal('2350000000000000000000000'); // 2350000 * 10^18
        });
        it('amountRaisedUSDC should be 0', async function() {
            const amountRaisedUSDC = await this.contractDeployed.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal('0');
        });
        it('amountRaisedDG should be 0', async function() {
            const amountRaisedDG = await this.contractDeployed.amountRaisedDG();
            amountRaisedDG.toString().should.equal('0');
        });
        it('has the correct start time', async function() {
            const startTime = await this.contractDeployed.startTime();
            startTime.toString().should.equal('1631806094');
            // go to truffle migration file and check if VCStartTime is correct 
        });
        it('has the correct end time', async function() {
            const endTime = await this.contractDeployed.endTime();
            endTime.toString().should.equal('1638193214');
            // got to truffle migration file and check if VCEndTime is correct
        });
        it('has the correct lock time', async function() {
            const lockTime = await this.contractDeployed.lockTime();
            lockTime.toString().should.equal('1631816094');
        });
        it('presale must be open', async function() {
            const presaleClosed = await this.contractDeployed.presaleClosed();
            presaleClosed.should.equal(false);
        });
    });
    describe('Invest', function() {
        it('has to revert if VC is closed', async function() {
            await expectRevert (
                this.contractClosed.invest(100),
                'Presale is closed'
            );
        });
        it('has to revert if less than 20.000,00 DG', async function() {
            const investment = new BN('19999999999999999999999');
            await expectRevert(
                this.contractDeployed.invest(investment,{from: accounts[1]}),
                'Fund is less than 20.000,00 DGT'
            );
        });
        it('has to revert if invest more than 2.350.000,00 DG', async function() {
            const investment = new BN('2350000000000000000000001');
            await expectRevert(
                this.contractDeployed.invest(investment,{from: accounts[1]}),
                'Fund is more than 2.350.000,00 DGT'
            );
        });
    });
});