const DataGen = artifacts.require('./DataGen.sol')

require('chai').should();

contracts('DataGen', accounts => {

    describe('Inizialise DataGen token attributes', function() {
        this.token = await DataGen.new();
        it('has the correct name', async function () {
            const name = await this.token.name();
            name.should.equal('DataGen');
        });
    })
})
