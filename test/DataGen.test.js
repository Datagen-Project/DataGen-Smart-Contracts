const DataGen = artifacts.require('./DataGen.sol')

require('chai').should();

contract('DataGen', accounts => {

    describe('Inizialise DataGen token attributes', async function() {
        
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
        it('has the correct total total supply', async function() {
            const totalSupply = await this.token.totalSupply();
            totalSupply.toString().should.equal('15000000000000000000000000') // 15M * 10^18
        });
        it('has the correct initial owner balance', async function() {
            const ownerBalance = await this.token.balanceOf(accounts[0])
            ownerBalance.toString().should.equal('15000000000000000000000000')
        })
    });
});
