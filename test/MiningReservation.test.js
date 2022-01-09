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

        const fundDG = new BN("15000000000000000000000000");
        await this.DatagenToken.transfer(this.MiningReservation.address, fundDG, {from: accounts[0]});
    });

    describe("Initial attributes", function() {
        it("has the correct lockTime", async function() {
            const lockTime = await this.MiningReservation.lockTime();

            lockTime.toString().should.equal("1711922400");
        });
        it("has the correct totalLocked amount of DG", async function() {
            const totalLocked = await this.MiningReservation.totalLocked();

            totalLocked.toString().should.equal("15000000000000000000000000");
        });
        it("has the correct initial multipler = 1", async function() {
            const multipler = await this.MiningReservation.multipler();

            multipler.toString().should.equal("1");
        });
        it("has the correct minReleaseRate", async function() {
            const minReleaseRate = await this.MiningReservation.minReleaseRate();

            minReleaseRate.toString().should.equal("71250000000000000000");
        });
    });
});
