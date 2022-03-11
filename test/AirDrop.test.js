const AirDrop = artifacts.require('./AirDrop.sol');
const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
    time,
} = require('@openzeppelin/test-helpers');
const { inTransaction } = require('@openzeppelin/test-helpers/src/expectEvent');

require('chai').should();

contract("AirDorp", accounts => {
    beforeEach(async function() {
        this.DataGenToken = await DataGen.new();
        this.contract = await AirDrop.new(this.DataGenToken.address);

        const fundDG = new BN('3000000000000000000000000');
        await this.DataGenToken.transfer(this.contract.address, fundDG, {from: accounts[0]});
    })
    
    describe('Some test on airdrop', function() {
        it('try to get airdrop', async function() {
            const code = new Array ("asdf", "qwer");
            await this.contract.setReferralCode(code, 100);

            await this.contract.getAirdrop("asdf", {from: accounts[4]});
            await this.contract.getAirdrop("qwer", {from: accounts[5]});

            const value = await this.DataGenToken.balanceOf(accounts[4]);
            value.toString().should.equal("100000000000000000000");
        });
    });
})