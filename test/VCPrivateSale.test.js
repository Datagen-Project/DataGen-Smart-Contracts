const VCPrivateSale = artifacts.require('./VCPrivateSale.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

require('chai').should();

contract('VCPrivateSale', accounts => {
    beforeEach(async function() {
        this.contract = await VCPrivateSale.deployed();
    });

    describe('Initialise VCPrivateSale attributes', function() {
        it('has the correct maxGoal', async function() {
            const maxGoal = await this.contract.maxGoal();
            maxGoal.toString().should.equal('2350000000000000000000000'); // 2350000 * 10^18
        });
        it('amountRaisedUSDC should be 0', async function() {
            const amountRaisedUSDC = await this.contract.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal('0');
        });
        it('amountRaisedDG should be 0', async function() {
            const amountRaisedDG = await this.contract.amountRaisedDG();
            amountRaisedDG.toString().should.equal('0');
        });
        it('has the correct start time', async function() {
            const startTime = await this.contract.startTime();
            startTime.toString().should.equal('1631806094');
            // go to truffle migration file and check if VCStartTime is correct 
        });
        it('has the correct end time', async function() {
            const endTime = await this.contract.endTime();
            endTime.toString().should.equal('163180694');
            // got to truffle migration file and check if VCEndTime is correct
        });
        it('has the correct lock time', async function() {
            const lockTime = await this.contract.lockTime();
            lockTime.toString().should.equal('1631816094');
        });
    });
});