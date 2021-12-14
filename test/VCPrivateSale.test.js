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
const balance = require("@openzeppelin/test-helpers/src/balance");

require("chai").should();

//@dev  In order to test this functionalities you must add this functions in VCPrivateSale.sol

// function setAmountRaisedDGTest(uint256 _amountRaised) public {
//     amountRaisedDG = _amountRaised;
// }

// function setBalanceOfDGTest(address account, uint256 balance) public {
//     balanceOfDG[account] = balance;
// }

// function setTotalBalanceOfTest(address account, uint256 balance) public {
//     totalBalanceOfDG[account] = balance;
// }

// function setEndTimeTest(uint256 _endTime) public {
//     endTime = _endTime;
// }

// function setLockTimeTest(uint256 _lockTime) public {
//     lockTime = _lockTime;
// }

contract("VCPrivateSale", accounts => {
    beforeEach(async function() {
        this.DatagenToken = await DataGen.new();
        this.USDCToken = await USDC.new();

        //Use to test migration attributes 
        this.contractDeployed = await VCPrivateSale.deployed(); //use when nedd to test migration parameters
        //Use to test contract closed situations
        this.contractClosed = await VCPrivateSale.new(this.DatagenToken.address, 1631806094, 1631806094, this.USDCToken.address); //closed VC
        //Use to test investments
        this.contractOpen = await VCPrivateSale.new(this.DatagenToken.address, 1631806094, 1764619205, this.USDCToken.address);

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
            endTime.toString().should.equal("1645535464");
            // got to truffle migration file and check if VCEndTime is correct
        });
        it("has the correct lock time", async function() {
            const endTime = await this.contractDeployed.endTime();
            const lockTime = await this.contractDeployed.lockTime();
            
            const correctLockTime = parseInt(endTime) + 7776000;
            lockTime.toString().should.equal(correctLockTime.toString());
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
        it("has to claim 10% of DG in the first 90 days", async function() {
            const invested = new BN("1000000000000000000000000");                    
            const dateEndTime = Math.floor(Date.now() / 1000) - 10;
            
            await this.contractOpen.setEndTimeTest(dateEndTime);
            await this.contractOpen.setBalanceOfDGTest(accounts[4], invested);
            await this.contractOpen.setTotalBalanceOfTest(accounts[4], invested);
        
            await this.contractOpen.claimDataGen({from: accounts[4]}); 
            await this.contractOpen.claimDataGen({from: accounts[4]}); 

            const balanceOfDG = await this.DatagenToken.balanceOf(accounts[4]);
            balanceOfDG.toString().should.equal("100000000000000000000000");
        });
        it("has to claim 10% in the first 90 days and 10% of the rest invested amount", async function() {
            //In order to test this function you must inizialize the local blockcahin at every test
            
            const invested = new BN("1000000000000000000000000");
            const dateEndTime = Math.floor(Date.now() / 1000) - 10;
            const dateLockTime = (Math.floor(Date.now() / 1000) -10) + 90 * 24 * 3600;

            await this.contractOpen.setEndTimeTest(dateEndTime);
            await this.contractOpen.setLockTimeTest(dateLockTime);
            await this.contractOpen.setBalanceOfDGTest(accounts[4], invested);
            await this.contractOpen.setTotalBalanceOfTest(accounts[4], invested);

            const lock = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(lock.toString());

            //1st call
            await this.contractOpen.claimDataGen({from: accounts[4]});
            //try to claim more 
            await this.contractOpen.claimDataGen({from: accounts[4]});
            const first = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(first.toString());

            //2nd call
            await time.increase(time.duration.days(91))
            await this.contractOpen.claimDataGen({from: accounts[4]});
            //try to claim more 
            await this.contractOpen.claimDataGen({from: accounts[4]});
            const second = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(second.toString());

            //3th call
            await time.increase(time.duration.days(30))
            await this.contractOpen.claimDataGen({from: accounts[4]});
            //try to claim more 
            await this.contractOpen.claimDataGen({from: accounts[4]});
            const third = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(third.toString());

            //4th call
            await time.increase(time.duration.days(30))
            await this.contractOpen.claimDataGen({from: accounts[4]});
            //try to claim more 
            await this.contractOpen.claimDataGen({from: accounts[4]});
            const forth = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(forth.toString());

            //5th call
            await time.increase(time.duration.days(30))
            await this.contractOpen.claimDataGen({from: accounts[4]});
            //try to claim more 
            await this.contractOpen.claimDataGen({from: accounts[4]});
            const fifth = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(fifth.toString());

            //6th call
            await time.increase(time.duration.days(30))
            await this.contractOpen.claimDataGen({from: accounts[4]});
            //try to claim more 
            await this.contractOpen.claimDataGen({from: accounts[4]});
            const sixth = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(sixth.toString());

            //7th call
            await time.increase(time.duration.days(30))
            await this.contractOpen.claimDataGen({from: accounts[4]});
            //try to claim more 
            await this.contractOpen.claimDataGen({from: accounts[4]});
            const seventh = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(seventh.toString());

            //8th call
            await time.increase(time.duration.days(30))
            await this.contractOpen.claimDataGen({from: accounts[4]});
            //try to claim more 
            await this.contractOpen.claimDataGen({from: accounts[4]});
            const eighth = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(eighth.toString());

            //9th call
            await time.increase(time.duration.days(30))
            await this.contractOpen.claimDataGen({from: accounts[4]});
            //try to claim more 
            await this.contractOpen.claimDataGen({from: accounts[4]});
            const ninth = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(ninth.toString());

            //10th call
            await time.increase(time.duration.days(30))
            await this.contractOpen.claimDataGen({from: accounts[4]});
            //try to claim more 
            await this.contractOpen.claimDataGen({from: accounts[4]});
            const tenth = await this.contractOpen.checkDataGenFunds(accounts[4]);
            console.log(tenth.toString());


            //try to claim more
            await time.increase(time.duration.days(30))
            await this.contractOpen.claimDataGen({from: accounts[4]});
            await this.contractOpen.claimDataGen({from: accounts[4]});
            

            const timeNow = await time.latest();
            const endTime = await this.contractOpen.endTime();
            const lockTime = await this.contractOpen.lockTime();
            

            const balanceOf = await this.DatagenToken.balanceOf(accounts[4]);
            
            console.log("tempo ora: " + timeNow);
            console.log("endTime: " + endTime);
            console.log("lockTime: " + lockTime);

            balanceOf.toString().should.equal("1000000000000000000000000");
        });                          
    });
});