const DataGen = artifacts.require('./DataGen.sol')

require('chai').should();

contract('DataGen', accounts => {

    describe('Inizialise DataGen token attributes', async function() {
        this.token = await DataGen.new();
        it('has the correct name', async function () {
            const name = await this.token.name();
            name.should.equal('DataGen');
        });
    })
})
