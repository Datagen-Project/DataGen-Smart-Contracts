const MiningReservation = artifacts.require("./MiningReservation.sol");
const DataGen = artifacts.require("./DataGen.sol");
const USDC = artifacts.require("./USDCtest.sol");
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
    time,
} = require("@openzeppelin/test-helpers");

require("chai").should();

contract("MiningReservation", accounts => {
    beforeEach(async function() {
        this.DatagenToken = await DataGen.new();
        this.USDCToken = await USDC.new();

        this.MiningReservation = await MiningReservation.new(this.DatagenToken.address);
    });

    describe("Initial attributes", function() {
        it("Has the correct lockTime", async function() {
            const lockTime = await this.MiningReservation.lockTime();

            lockTime.toString().should.equal("1704067200");
        }); 
    });
});