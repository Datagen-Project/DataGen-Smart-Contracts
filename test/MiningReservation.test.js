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
    beforeEach(async function () {
        this.DatagenToken = await DataGen.new();
        this.contractDeployed = await MiningReservation.deployed();

        const initialDG = new BN("1000000000000000000000");
        await this.DatagenToken.transfer(this.contractDeployed.address, initialDG, { from: accounts[0] });
    });

    describe("Initialise MiningReservation attributes", function () {
        it("has the correct totalLocked", async function () {
            const totalLocked = await this.contractDeployed.totalLocked();
            totalLocked.toString().should.equal("15000000000000000000000000"); // 15000000 * 10^18
        });
        it("multipler should be 1", async function () {
            const multipler = await this.contractDeployed.multipler();
            multipler.toString().should.equal("1");
        });
        it("has the correct minReleaseRate", async function () {
            const minReleaseRate = await this.contractDeployed.minReleaseRate();
            minReleaseRate.toString().should.equal("71250000000000000000"); // 71.25 * 10 ** 18
        });
        it("has the correct startAmount", async function () {
            const startAmount = await this.contractDeployed.startAmount();
            startAmount.toString().should.equal("4560000000000000000000"); // 4560 * (10**18)
        });
        it("has the correct beginAmount", async function () {
            const beginAmount = await this.contractDeployed.beginAmount();
            beginAmount.toString().should.equal("4560000000000000000000"); // 4560 * (10**18)
        });
        it("votationDuration should be 0", async function () {
            const votationDuration = await this.contractDeployed.votationDuration();
            votationDuration.toString().should.equal("0");
        });
        it("votationStartTime should be 0", async function () {
            const votationStartTime = await this.contractDeployed.votationStartTime();
            votationStartTime.toString().should.equal("0");
        });
        it("has the correct voteSetter", async function () {
            const voteSetter = await this.contractDeployed.voteSetter();
            voteSetter.toString().should.equal("0x000000000000000000000000000000000000dEaD");
        });
        it("voteAddrSetStartTime should be 0", async function () {
            const voteAddrSetStartTime = await this.contractDeployed.voteAddrSetStartTime();
            voteAddrSetStartTime.toString().should.equal("0");
        });
        it("has the correct miningWallet", async function () {
            const miningWallet = await this.contractDeployed.miningWallet();
            miningWallet.toString().should.equal("0x000000000000000000000000000000000000dEaD");
        });
        it("has the correct deadAddr", async function () {
            const deadAddr = await this.contractDeployed.deadAddr();
            deadAddr.toString().should.equal("0x000000000000000000000000000000000000dEaD");
        });
        it("has the correct newMiningWallet", async function () {
            const newMiningWallet = await this.contractDeployed.newMiningWallet();
            newMiningWallet.toString().should.equal("0x000000000000000000000000000000000000dEaD");
        });
        it("has the correct voteAddrSetDuration", async function () {
            const voteAddrSetDuration = await this.contractDeployed.voteAddrSetDuration();
            voteAddrSetDuration.toString().should.equal("4924800");
        });
        it("voteOption should be 2", async function () {
            const voteOption = await this.contractDeployed.voteOption();
            voteOption.toString().should.equal("2");
        });
    });
    describe("Stake", function () {
        it("has to revert if have not enough #DG", async function () {
            await expectRevert(
                this.contractDeployed.stake(2000 * 10 ** 18),
                "you have not enough #DG to stake"
            );
        });
        it("has to revert while votation", async function () {
            await this.contractDeployed.vote(1)
            await expectRevert(
                this.contractOpen.stake(1000 * 10 ** 18),
                "you can't stake after vote"
            );
        });
        it("total stake amount needs to increase", async function () {
            await this.contractOpen.stake(1000 * 10 ** 18)
            const totalStakeAmount = await this.contractDeployed.totalStakeAmount();
            totalStakeAmount.toString().should.equal("1000000000000000000000"); // 1000 * 10^18
        });
        it("transfer stake amount to the smart contract address", async function () {
            await this.contractOpen.stake(1000 * 10 ** 18)
            const balance = await this.DatagenToken.balanceOf(contractOpen.address)
            balance.toString().should.equal("1000000000000000000000"); // 1000 * 10^18
        });
    });
    describe("Vote", function () {
        it("has to revert if you are voting before you stake", function () {
            await expectRevert(
                this.contractDeployed.vote(1),
                "you must stake before vote"
            );
        });
        it("has to revert if you have already voted", function () {
            await this.contractOpen.stake(1000 * 10 ** 18)
            await this.contractDeployed.vote(1)
            await expectRevert(
                this.contractDeployed.vote(1),
                "you already voted"
            );
        });
    });
});