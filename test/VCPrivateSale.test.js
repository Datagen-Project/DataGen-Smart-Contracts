const VCPrivateSale = artifacts.require("./VCPrivateSale.sol");
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

contract("VCPrivateSale", accounts => {
    beforeEach(async function() {
        this.DatagenToken = await DataGen.new();
        this.USDCToken = await USDC.new();

        //Use to test migration attributes 
        this.contractDeployed = await VCPrivateSale.deployed(); //use when nedd to test migration parameters
        //Use to test contract closed situations
        this.contractClosed = await VCPrivateSale.new(this.DatagenToken.address, 1631806094, 1631806094, 163180694, this.USDCToken.address); //closed VC
        //Use to test investments
        this.contractOpen = await VCPrivateSale.new(this.DatagenToken.address, 1631806094, 1764619205, 1764619205, this.USDCToken.address);

        //Funding investors with USDC
        const fundUSDC = new BN("10000000000000");
        await this.USDCToken.transfer(accounts[4], fundUSDC, {from: accounts[0]});

        const fundDG = new BN("2350000000000000000000000");
        await this.DatagenToken.transfer(this.contractOpen.address, fundDG, {from: accounts[0]});
    });

    describe("Initialise VCPrivateSale attributes", function() {
        it("has the correct maxGoal", async function() {
            const maxGoal = await this.contractDeployed.maxGoal();
            maxGoal.toString().should.equal("2350000000000000000000000"); // 2350000 * 10^18
        });
        it("amountRaisedUSDC should be 0", async function() {
            const amountRaisedUSDC = await this.contractDeployed.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("0");
        });
        it("amountRaisedDG should be 0", async function() {
            const amountRaisedDG = await this.contractDeployed.amountRaisedDG();
            amountRaisedDG.toString().should.equal("0");
        });
        it("has the correct start time", async function() {
            const startTime = await this.contractDeployed.startTime();
            startTime.toString().should.equal("1631806094");
            // go to truffle migration file and check if VCStartTime is correct 
        });
        it("has the correct end time", async function() {
            const endTime = await this.contractDeployed.endTime();
            endTime.toString().should.equal("1638193214");
            // got to truffle migration file and check if VCEndTime is correct
        });
        it("has the correct lock time", async function() {
            const lockTime = await this.contractDeployed.lockTime();
            lockTime.toString().should.equal("1631816094");
        });
        it("presale must be open", async function() {
            const presaleClosed = await this.contractDeployed.presaleClosed();
            presaleClosed.should.equal(false);
        });
    });
    describe("Invest", function() {
        it("has to revert if VC is closed", async function() {
            await expectRevert (
                this.contractClosed.invest(100),
                "Presale is closed"
            );
        });
        it("has to revert if less than 20.000,00 DG", async function() {
            const investment = new BN("19999999999999999999999");
            await expectRevert(
                this.contractOpen.invest(investment,{from: accounts[1]}),
                "Fund is less than 20.000,00 DGT"
            );
        });
        it("has to revert if invest more than 2.350.000,00 DG", async function() {
            const investment = new BN("2350000000000000000000001");
            await expectRevert(
                this.contractOpen.invest(investment,{from: accounts[1]}),
                "Fund is more than 2.350.000,00 DGT"
            );
        });
        it("has to invest 300k DG at discount price of 210k USDC", async function() {
            const investment = new BN("300000000000000000000000");
            
            await this.USDCToken.approve(this.contractOpen.address, investment, {from: accounts[4]}); 
            await this.contractOpen.invest(investment, {from: accounts[4]});

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("210000000000");
        });
        it("has to invest 1M DG at discount price of 900k USDC (amountRaisedDG started at 300k DG)", async function() {
            const investment = new BN("1000000000000000000000000");
            const amountAlreadyRaisedDG = new BN("300000000000000000000000")

            await this.USDCToken.approve(this.contractOpen.address, investment, {from: accounts[4]})
            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaisedDG);
            await this.contractOpen.invest(investment, {from: accounts[4]});

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("900000000000");
        });
        it("has to invest 1.05M DG at price of 1.155M USDC (amountRaisedDG started at 1,3M DG)", async function() {
            const investment = new BN("1050000000000000000000000");
            const allowance = new BN("1155000000000000000000000")
            const amountAlreadyRaisedDG = new BN("1300000000000000000000000");

            await this.USDCToken.approve(this.contractOpen.address, allowance, {from: accounts[4]});
            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaisedDG);
            await this.contractOpen.invest(investment, {from: accounts[4]});

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("1155000000000");
        });
        it("has to invest 1.001.000 DG at price of 900.700 USDC (amountRaisedDG started at 299k DG)", async function() {
            const investment = new BN("1001000000000000000000000");
            const amountAlreadyRaisedDG = new BN("299000000000000000000000");

            await this.USDCToken.approve(this.contractOpen.address, investment, {from: accounts[4]});
            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaisedDG);
            await this.contractOpen.invest(investment, {from: accounts[4]});

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("900700000000");
        });
        it("has to invest 301k DG at price of 210.900 USDC (amountRaisedDG started at 0 DG)", async function() {
            const investment = new BN("301000000000000000000000");

            await this.USDCToken.approve(this.contractOpen.address, investment, {from: accounts[4]});
            await this.contractOpen.invest(investment, {from: accounts[4]});

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("210900000000");
        });
        it("has to invest 1.051.000 DG at price of 1.155.900 USDC (amountRaisedDG started at 1.299.000 DG)", async function() {
            const investment = new BN("1051000000000000000000000");
            const allowance = new BN("1155900000000000000000000")
            const amountAlreadyRaisedDG = new BN("1299000000000000000000000");

            await this.USDCToken.approve(this.contractOpen.address, allowance, {from: accounts[4]});
            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaisedDG);
            await this.contractOpen.invest(investment, {from: accounts[4]});

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("1155900000000");
        });
        it("has to invest 1.001.000 DG at price of 901.100 USDC (amountRaisedDG started at 300.000 DG)", async function() {
            const investment = new BN("1001000000000000000000000");
            const amountAlreadyRaisedDG = new BN("300000000000000000000000");

            await this.USDCToken.approve(this.contractOpen.address, investment, {from: accounts[4]});
            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaisedDG);
            await this.contractOpen.invest(investment, {from: accounts[4]});

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("901100000000");
        });
        it("has to invest 2.350.000 DG at price of 2.265.000 USDC", async function() {
            const investment = new BN("2350000000000000000000000");

            await this.USDCToken.approve(this.contractOpen.address, investment, {from: accounts[4]});
            await this.contractOpen.invest(investment, {from: accounts[4]});

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("2265000000000");
        });
        it("has to invest 1,3M DG at price of 1,11M USDC", async function() {
            const investment = new BN("1300000000000000000000000");
            
            await this.USDCToken.approve(this.contractOpen.address, investment, {from: accounts[4]});
            await this.contractOpen.invest(investment, {from: accounts[4]});
            
            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("1110000000000");
        });
        it("has to emit GoalReached event if maxGoal is reached", async function() {
            const investment = new BN("2350000000000000000000000");

            await this.USDCToken.approve(this.contractOpen.address, investment, {from: accounts[4]});
            const receipt = await this.contractOpen.invest(investment, {from: accounts[4]});

            await expectEvent(receipt, "GoalReached", {
                beneficiary: accounts[4],
                amountRaisedUSDC: "2265000000000"
            });
        });
    });
    describe("Claim Datagen and USDC", function() {
        it("has to claim 10% in the first 90 days", async function() {
            const invested = new BN("1000000000000000000000000");
            const date = Math.floor(Date.now() / 1000) - 10;
            
            await this.contractOpen.setEndTimeTest(date);
            await this.contractOpen.setBalanceOfDGTest(accounts[4], invested);
            await this.contractOpen.setTotalBalanceOfTest(accounts[4], invested);

            await this.contractOpen.claimDataGen({from: accounts[4]});
            const balanceOfDG = await this.DatagenToken.balanceOf(accounts[4]);

            balanceOfDG.toString().should.equal("100000000000000000000000");
        });
        it("has to claim 10% in the first 90 days and 10% of the rest invested amount", async function() {
            const invested = new BN("1000000000000000000000000");
            const dateEndTime = Math.floor(Date.now() / 1000) - 10;
            const dateLockTime = (Math.floor(Date.now() / 1000) -10) + 90 * 24 * 3600;

            await this.contractOpen.setEndTimeTest(dateEndTime);
            await this.contractOpen.setLockTimeTest(dateLockTime);
            await this.contractOpen.setBalanceOfDGTest(accounts[4], invested);
            await this.contractOpen.setTotalBalanceOfTest(accounts[4], invested);

            await this.contractOpen.claimDataGen({from: accounts[4]});
            await time.increase(time.duration.days(91))
            await this.contractOpen.claimDataGen({from: accounts[4]});

            const balanceOf = await this.DatagenToken.balanceOf(accounts[4]);
            balanceOf.toString().should.equal("19000000000000000000000");
        });                           
    });
});