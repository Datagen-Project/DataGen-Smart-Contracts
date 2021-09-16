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
            const maxGoal = this.contract.maxGoal();
            maxGoal.toString().should.equal('2350000000000000000000000'); // 2350000 * 10^18
        });
    });
});