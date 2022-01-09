const RetailPrivateSale = artifacts.require("./RetailPrivateSale.sol");
const DataGen = artifacts.require("./DataGen.sol");
const USDC = artifacts.require("./USDCtest.sol");
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
} = require('@openzeppelin/test-helpers');

require("chai").should();

//@dev  In order to test this functionalities you must add this functions in RetailPrivateSlae.sol

// function setDiscountLimitTest(uint256 _discountLimit) public {
//     discountLimit = _discountLimit;
// }

// function setAmountRaisedDGTest(uint256 _amountRaised) public {
//     amountRaisedDG = _amountRaised;
// }`

// function setEndTimeTest(uint256 _endtime) public {
//     endTime = _endtime;
// }

// function setMaxGoalTest(uint256 _maxGola) public {
//     maxGoal = _maxGola;
// }

contract("RetailPrivateSale", accounts => {
    beforeEach(async function () {
        this.DatagenToken = await DataGen.new();
        this.USDCToken = await USDC.new();

        //Use to test migration attributes 
        this.contractDeployed = await RetailPrivateSale.deployed();
        //Use to test contract closed situations
        this.contractClosed = await RetailPrivateSale.new(this.DatagenToken.address, 1631806094, 1631806094, this.USDCToken.address);
        //Use to test investments
        this.contractOpen = await RetailPrivateSale.new(this.DatagenToken.address, 1631806094, 4129998853, this.USDCToken.address);

        //Funding investors with USDC
        const fundUSDC = new BN("15000000000");
        await this.USDCToken.transfer(accounts[4], fundUSDC, { from: accounts[0] });
        await this.USDCToken.transfer(accounts[5], fundUSDC, { from: accounts[0] });
    });
    describe("initialise RetailPrivateSale attributes", function () {
        it("has the correct maxGoal", async function () {
            const maxGoal = await this.contractDeployed.maxGoal();
            maxGoal.toString().should.equal("150000000000000000000000");
        });
        it("has the correct amount of discunt token", async function () {
            const discountLimit = await this.contractDeployed.discountLimit();
            discountLimit.toString().should.equal("15000000000000000000000");
        });
        it("has the correct startTime", async function () {
            const startTime = await this.contractDeployed.startTime();
            startTime.toString().should.equal("1634810071");
        });
        it("has the correct endTime", async function () {
            const endTime = await this.contractDeployed.endTime();
            endTime.toString().should.equal("1634810071");
        });
        //if code remains at actual state see issue on github 
        it("has the correct price for discount token", async function () {
            const price = await this.contractDeployed.price();
            price.toString().should.equal("700000");
        });
        it("presale must be open", async function () {
            const presaleClosed = await this.contractDeployed.presaleClosed();
            presaleClosed.should.equal(false);
        });
        it("has the correct USDC address", async function () {
            const USDCaddress = await this.USDCToken.address;
            const USDCaddressRetail = await this.contractOpen.USDC_ADDRESS();
            USDCaddressRetail.toString().should.equal(USDCaddress.toString());
        });
    });
    describe("Invest", function () {
        it("has to revert if Presale is closed", async function () {
            await expectRevert(
                this.contractClosed.invest(100),
                "Presale is closed"
            );
        });
        it("has to revert if investment is less than 10,00 DG", async function () {
            const investment = new BN("9999999999999999999");
            await expectRevert(
                this.contractOpen.invest(investment, { from: accounts[1] }),
                "Fund is less than 10,00 DGT"
            );
        });
        it("has to revert if investment is more than 10.0000,00 DG", async function () {
            const investment = new BN("10000000000000000000001");
            await expectRevert(
                this.contractOpen.invest(investment, { from: accounts[1] }),
                "Fund is more than 10.000,00 DGT"
            );
        });
        it("has fund to invest", async function () {
            const balanceOf = await this.USDCToken.balanceOf(accounts[4]);
            balanceOf.toString().should.equal("15000000000");
        });
        it("has to invest 10DG at discunt price of 1DG = 0.7USDC", async function () {
            const investment = new BN("10000000000000000000");
            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });
            await this.contractOpen.invest(investment, { from: accounts[4] });

            const balacneOfUSDC = await this.contractOpen.checkFunds(accounts[4]);
            const balanceOfDG = await this.contractOpen.checkDataGenFunds(accounts[4]);

            balacneOfUSDC.toString().should.equal("7000000");
            balanceOfDG.toString().should.equal("10000000000000000000");
        });
        it("hat to invest 10DG at normal price of 1DG = 1USDC", async function () {
            const amountAlreadyRaised = new BN("15000000000000000000001");
            const investment = new BN("10000000000000000000");
            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaised);
            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });
            await this.contractOpen.invest(investment, { from: accounts[4] });

            const balanceOfUSDC = await this.contractOpen.checkFunds(accounts[4]);
            const balanceOfDG = await this.contractOpen.checkDataGenFunds(accounts[4]);

            balanceOfUSDC.toString().should.equal("10000000");
            balanceOfDG.toString().should.equal("10000000000000000000");
        });
        it("has to invest 10kDG, 1K at discount price and 9k at full price", async function () {
            const investment = new BN("10000000000000000000000");
            const amountAlreadyRaised = new BN("14000000000000000000000");

            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaised);
            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });

            const receipt = await this.contractOpen.invest(investment, { from: accounts[4] });
            await expectEvent(receipt, "FundTransfer", {
                backer: accounts[4],
                amountUSDC: "9700000000",
                isContribution: true,
                amountRaisedUSDC: "9700000000"
            });
        });
        it("has to invest 10kDG, 1K at discount price and 9k at full price, check DG", async function () {
            const investment = new BN("10000000000000000000000");
            const amountAlreadyRaised = new BN("14000000000000000000000");

            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaised);
            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });

            await this.contractOpen.invest(investment, { from: accounts[4] });
            const balanceOfDG = await this.contractOpen.checkDataGenFunds(accounts[4]);

            balanceOfDG.toString().should.equal("10000000000000000000000")
        });
        it("hat to invest 10kDG, 9K at discount price and 1k at full price", async function () {
            const investment = new BN("10000000000000000000000");
            const amountAlreadyRaised = new BN("6000000000000000000000");

            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaised);
            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });

            const receipt = await this.contractOpen.invest(investment, { from: accounts[4] });
            await expectEvent(receipt, "FundTransfer", {
                backer: accounts[4],
                amountUSDC: "7300000000",
                isContribution: true,
                amountRaisedUSDC: "7300000000"
            });
        });
        it("has to invest 10kDG, 9K at discount price and 1k at full price, check DG", async function () {
            const investment = new BN("10000000000000000000000");
            const amountAlreadyRaised = new BN("6000000000000000000000");

            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaised);
            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });

            await this.contractOpen.invest(investment, { from: accounts[4] });
            const balanceOfDG = await this.contractOpen.checkDataGenFunds(accounts[4]);

            balanceOfDG.toString().should.equal("10000000000000000000000")
        });
        it("has to invest 20kDG, 15k at discount price and 5k at full price", async function () {
            const investment = new BN("10000000000000000000000")

            await this.USDCToken.approve(this.contractOpen.address, investment, { from:accounts[4]} )
            await this.USDCToken.approve(this.contractOpen.address, investment, { from:accounts[5]} )
            await this.contractOpen.invest(investment, {from: accounts[4]});
            await this.contractOpen.invest(investment, {from: accounts[5]});

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            amountRaisedUSDC.toString().should.equal("15500000000");

        });
        it("has the correct amount raised", async function () {
            const investment = new BN("15000000000000000000");
            const investmentApprove = new BN("45000000000000000000")
            await this.USDCToken.approve(this.contractOpen.address, investmentApprove, { from: accounts[4] });

            for (i = 0; i < 3; i++) {
                await this.contractOpen.invest(investment, { from: accounts[4] });
            }

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            const amountRaisedDG = await this.contractOpen.amountRaisedDG();

            amountRaisedUSDC.toString().should.equal("31500000");
            amountRaisedDG.toString().should.equal("45000000000000000000");
        });
        it("has to emit a corret FundTranfer event", async function () {
            const investment = new BN("15000000000000000000");
            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });

            const receipt = await this.contractOpen.invest(investment, { from: accounts[4] });

            await expectEvent(receipt, "FundTransfer", {
                backer: accounts[4],
                amountUSDC: "10500000",
                isContribution: true,
                amountRaisedUSDC: "10500000"
            });
        });
        it("has to emit a correct GoalReached event", async function () {
            const maxGoal = new BN("10000000000000000000");
            const investment = new BN("15000000000000000000");

            await this.contractOpen.setMaxGoalTest(maxGoal);
            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });

            const receipt = await this.contractOpen.invest(investment, { from: accounts[4] });

            await expectEvent(receipt, "GoalReached", {
                beneficiary: accounts[4],
                amountRaisedUSDC: "10500000"
            });
        });
    });
    describe("Claim Datagen and USDC", function () {
        it("claimDatagen has to revert if presale is open", async function () {
            await expectRevert(
                this.contractOpen.claimDataGen(),
                "Distribution is off."
            );
        });
        it("has to revert if balance DG is 0", async function () {
            await expectRevert(
                this.contractClosed.claimDataGen({ from: accounts[4] }),
                "Zero #DG contributed."
            );
        });
        it("has to revert if balance of USDC is less than DG", async function () {
            const investment = new BN("10000000000000000000");

            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });
            await this.contractOpen.invest(investment, { from: accounts[4] });

            await this.contractOpen.setEndTimeTest(1631806094);

            await expectRevert(
                this.contractOpen.claimDataGen({ from: accounts[4] }),
                "Contract has less fund."
            );
        });
        it("has to transfer the right amount of DG", async function () {
            const investment = new BN("15000000000000000000");
            const fundDatagen = new BN("150000000000000000000000");

            await this.DatagenToken.transfer(this.contractOpen.address, fundDatagen, { from: accounts[0] });

            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });
            await this.contractOpen.invest(investment, { from: accounts[4] });

            await this.contractOpen.setEndTimeTest(1631806094);
            await this.contractOpen.claimDataGen({ from: accounts[4] });

            const balanceOfDG = await this.DatagenToken.balanceOf(accounts[4]);
            balanceOfDG.toString().should.equal("15000000000000000000");
        });
    });
    describe("Withdraw USDC and DG by the owner", function () {
        it("has to revert if balance of USDC is 0", async function () {
            await expectRevert(
                this.contractClosed.withdrawUSDC({ from: accounts[0] }),
                "Balance is zero."
            );
        });
        it("withdrawUSDC has to revert if caller isn't the owner", async function () {
            await expectRevert(
                this.contractClosed.withdrawUSDC({ from: accounts[4] }),
                "Ownable: caller is not the owner"
            );
        });
        it("owner must be able to withdraw the USDC raised", async function () {
            const investment = new BN("15000000000000000000");
            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });
            await this.contractOpen.invest(investment, { from: accounts[4] });

            await this.contractOpen.withdrawUSDC({ from: accounts[0] });

            const ownerUSDCBalance = await this.USDCToken.balanceOf(accounts[0]);
            //accounts[0] is also the owner of USDC so it has the total supply minus the fund transfer to account[4] and accounts[5]
            ownerUSDCBalance.toString().should.equal("29970010500000");
        });
        it("withdrawDataGen has to revert if caller isn't the owner", async function () {
            await expectRevert(
                this.contractClosed.withdrawDataGen({ from: accounts[4] }),
                "Ownable: caller is not the owner"
            );
        });
        it("withdrawDataGen has to revert if private sale is open", async function () {
            await expectRevert(
                this.contractOpen.withdrawDataGen({ from: accounts[0] }),
                "Distribution is off."
            );
        });
        it("withdrawDataGen has to withdraw the correct amount and left enought DG to be claim by investors", async function () {
            const investment = new BN("15000000000000000000");
            const amountAlreadyRaised = new BN("15000000000000000000001");
            const fundDatagen = new BN("150000000000000000000000");

            await this.DatagenToken.transfer(this.contractOpen.address, fundDatagen, { from: accounts[0] });
            await this.contractOpen.setAmountRaisedDGTest(amountAlreadyRaised);

            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[4] });
            await this.USDCToken.approve(this.contractOpen.address, investment, { from: accounts[5] });
            await this.contractOpen.invest(investment, { from: accounts[4] });
            await this.contractOpen.invest(investment, { from: accounts[5] });

            await this.contractOpen.setEndTimeTest(1631806094);

            await this.contractOpen.withdrawDataGen({ from: accounts[0] });
            const balanceOfOwner = await this.DatagenToken.balanceOf(accounts[0]);

            balanceOfOwner.toString().should.equal("14984969999999999999999999");
        });
    });
});