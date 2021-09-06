const DataGen = artifacts.require('./DataGen.sol')
const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

require('chai').should();

contract('DataGen', accounts => {

    describe('Initialise DataGen token attributes', function() {
        
        beforeEach(async function() {
            this.token = await DataGen.new();
        });

        it('has the correct name', async function () {
            const name = await this.token.name();
            name.should.equal('DataGen');
        });
        it('has the correct symbol', async function() {
            const symbol = await this.token.symbol();
            symbol.should.equal('#DG');
        });
        it('has the correct decimals', async function() {
            const decimals = await this.token.decimals();
            decimals.toString().should.equal('18');
        });
        it('has the correct total supply', async function() {
            const totalSupply = await this.token.totalSupply();
            totalSupply.toString().should.equal('15000000000000000000000000') // 15M * 10^18
        });
        it('has the correct initial owner balance', async function() {
            const ownerBalance = await this.token.balanceOf(accounts[0])
            ownerBalance.toString().should.equal('15000000000000000000000000')
        });
    });

    describe('Transfer DataGen', function() {

        beforeEach(async function() {
            this.token = await DataGen.new();
        });

        it('transfer 100 DG from owner account to account 1', async function() {
            await this.token.transfer(accounts[1], 100, {from: accounts[0]})
            const account1Balance = await this.token.balanceOf(accounts[1]);
            const account0Balance = await this.token.balanceOf(accounts[0]);
            account0Balance.toString().should.equal('14999999999999999999999900')
            account1Balance.toString().should.equal('100')
        });
        // it('has to revert if sender is zero address', async function() {
        //     await expectRevert(
        //         this.token.transfer(accounts[1], 100, {from: constants.ZERO_ADDRESS}),
        //         'ERC20: transfer from the zero address',
        //     );
        // });
        it('has to revert if recipient is zero address', async function() {
            await expectRevert(
                this.token.transfer(constants.ZERO_ADDRESS, 100, {from: accounts[0]}),
                'ERC20: transfer to the zero address',
            );
        });
        it('has to revert if amount exceeds balance', async function() {
            await expectRevert(
                this.token.transfer(accounts[1], constants.MAX_INT256 , {from: accounts[0]}),
                'ERC20: transfer amount exceeds balance',
            );
        });
        it('has to emit a Transfer event for a valid transaction', async function() {
            const receipt = await this.token.transfer(accounts[1], 100, {from: accounts[0]});     
            await expectEvent(receipt, 'Transfer', {
                from: accounts[0],
                to: accounts[1],
                value: '100',
            });
        });
    });
});
