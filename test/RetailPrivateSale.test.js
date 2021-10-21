const RetailPrivateSale = artifacts.require('./RetailPrivateSale.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
} = require('@openzeppelin/test-helpers');

require('chai').should();

contract('RetailPrivateSale', accounts => {
    beforeEach(async function() {
        this.token = await DataGen.new();
        this.contractDeployed = await RetailPrivateSale.deployed();
        this.contractClosed = await RetailPrivateSale.new(this.token.address, 1631806094, 1631806094);
    });

    describe('initialise RetailPrivateSale attributes', function() {
        it('has the correct maxGoal', async function() {
            const maxGoal = await this.contractDeployed.maxGoal();
            maxGoal.toString().should.equal('150000000000000000000000');
        });
        it('has the correct amount of discunt token', async function() {
            const discountLimit = await this.contractDeployed.discountLimit();
            discountLimit.toString().should.equal('15000000000000000000000');
        });
        it('has the correct startTime', async function() {
            const startTime = await this.contractDeployed.startTime();
            startTime.toString().should.equal('1634810071');
        });
        it('has the correct endTime', async function() {
            const endTime = await this.contractDeployed.endTime();
            endTime.toString().should.equal('1634810071');
        });
        //if code remains at actual state see issue on github 
        it('has the correct price for discount token', async function() {
            const price = await this.contractDeployed.price();
            price.toString().should.equal('70000000000000000');
        });
        it('presale must be open', async function() {
            const presaleClosed = await this.contractDeployed.presaleClosed();
            presaleClosed.should.equal(false);
        });
    });

    describe('Invest', function() {
        it('has to revert if Presale is closed', async function() {
            await expectRevert (
                this.contractClosed.invest(100),
                'Presale is closed'
            );
        });
        it('has to revert if investment is less than 10,00 DG', async function() {
            const investment = new BN('9999999999999999999');
            await expectRevert(
                this.contractDeployed.invest(investment, {from: accounts[1]}),
                'Found is less than 10,00 DGT'
            );
        });
        it('has to revert if investment is more than 10.0000,00 DG', async function() {
            const investment = new BN('10000000000000000000001');
            await expectRevert(
                this.contractDeployed.invest(investment, {from: accounts[1]}),
                'Found is more than 10.000,00 DGT'
            );
        });
    }); 
});