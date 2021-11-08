const RetailPrivateSale = artifacts.require('./RetailPrivateSale.sol');
const DataGen = artifacts.require('./DataGen.sol');
const USDC = artifacts.require('./USDCtest.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    BN,
} = require('@openzeppelin/test-helpers');
const { Account } = require('ethereumjs-util');

require('chai').should();

contract('RetailPrivateSale', accounts => {
    beforeEach(async function() {
        this.DatagenToken = await DataGen.new();
        this.USDCToken = await USDC.new();

        //Use to test migration attributes 
        this.contractDeployed = await RetailPrivateSale.deployed();
        //Use to test contract closed situations
        this.contractClosed = await RetailPrivateSale.new(this.DatagenToken.address, 1631806094, 1631806094, this.USDCToken.address);
        //Use to test investments
        this.contractOpen = await RetailPrivateSale.new(this.DatagenToken.address, 1631806094, 1637829247, this.USDCToken.address);

        
        //funding the Presale contract
        const fundDatagen = new BN('150000000000000000000000');
        await this.DatagenToken.transfer(this.contractDeployed.address, fundDatagen, {from: accounts[0]});

        //Funding investors with USDC
        const fundUSDC = new BN('120000000000000000000');
        await this.USDCToken.transfer(accounts[4], fundUSDC, {from: accounts[0]});
    });

    describe('initialise RetailPrivateSale attributes', function() {
        it('has the correct maxGoal', async function() {
            const maxGoal = await this.contractDeployed.maxGoal();
            maxGoal.toString().should.equal('150000000000000000000000');
        });
        it('has the correct amount of discunt token', async function() {
            const discountLimit = await this.contractDeployed.discountLimit();
            discountLimit.toString().should.equal('15000000000000000000000');
        });
        it('has the correct startTime', async function() {
            const startTime = await this.contractDeployed.startTime();
            startTime.toString().should.equal('1634810071');
        });
        it('has the correct endTime', async function() {
            const endTime = await this.contractDeployed.endTime();
            endTime.toString().should.equal('1634810071');
        });
        //if code remains at actual state see issue on github 
        it('has the correct price for discount token', async function() {
            const price = await this.contractDeployed.price();
            price.toString().should.equal('70000000000000000');
        });
        it('presale must be open', async function() {
            const presaleClosed = await this.contractDeployed.presaleClosed();
            presaleClosed.should.equal(false);
        });
        it('has the correct USDC address', async function() {
            const USDCaddress = await this.USDCToken.address;
            const USDCaddressRetail = await this.contractOpen.USDC_ADDRESS();
            USDCaddressRetail.toString().should.equal(USDCaddress.toString());
        });
    });

    describe('Invest', function() {
        it('has to revert if Presale is closed', async function() {
            await expectRevert (
                this.contractClosed.invest(100),
                'Presale is closed'
            );
        });
        it('has to revert if investment is less than 10,00 DG', async function() {
            const investment = new BN('9999999999999999999');
            await expectRevert(
                this.contractDeployed.invest(investment, {from: accounts[1]}),
                'Fund is less than 10,00 DGT'
            );
        });
        it('has to revert if investment is more than 10.0000,00 DG', async function() {
            const investment = new BN('10000000000000000000001');
            await expectRevert(
                this.contractDeployed.invest(investment, {from: accounts[1]}),
                'Fund is more than 10.000,00 DGT'
            );
        });
        it('has fund to invest', async function() {
            const balanceOf = await this.USDCToken.balanceOf(accounts[4]);
            balanceOf.toString().should.equal('120000000000000000000');
        });
        it('has to invest 10DG at discunt price of 1DG = 0.7USDC', async function() {
            const investment = new BN('15000000000000000000');
            await this.USDCToken.approve(this.contractOpen.address, investment, {from: accounts[4]});            
            await this.contractOpen.invest(investment, {from: accounts[4]});
            
            const balacneOfUSDC = await this.contractOpen.checkFunds(accounts[4]);
            const balanceOfDG = await this.contractOpen.checkDataGenFunds(accounts[4]);

            balacneOfUSDC.toString().should.equal('10500000');
            balanceOfDG.toString().should.equal('15000000000000000000');
        });
        it('hat to invest 10DG at normal price of 1DG = 1USDC', async function() {
            //in order to test this functionality you must add this function in RetailPrivateSlae.sol
            // function setDiscountLimit(uint256 _discountLimit) public {
            //     discountLimit = _discountLimit;
            // }
            const discountLimit = 10;
            const investment = new BN('15000000000000000000');
            await this.contractOpen.setDiscountLimit(discountLimit);
            await this.USDCToken.approve(this.contractOpen.address, investment, {from: accounts[4]});
            await this.contractOpen.invest(investment, {from: accounts[4]});

            const balanceOfUSDC = await this.contractOpen.checkFunds(accounts[4]);
            const balanceOfDG = await this.contractOpen.checkDataGenFunds(accounts[4]);

            balanceOfUSDC.toString().should.equal('15000000000000000000');
            balanceOfDG.toString().should.equal('15000000000000000000');
        });
        it('has the correct amount raised', async function() {
            const investment = new BN('15000000000000000000');
            const investmentApprove = new BN('45000000000000000000')
            await this.USDCToken.approve(this.contractOpen.address, investmentApprove, {from: accounts[4]});
            
            for (i = 0; i < 3; i++) {
                await this.contractOpen.invest(investment, {from: accounts[4]});
            }

            const amountRaisedUSDC = await this.contractOpen.amountRaisedUSDC();
            const amountRaisedDG = await this.contractOpen.amountRaisedDG();

            amountRaisedUSDC.toString().should.equal('31500000');
            amountRaisedDG.toString().should.equal('45000000000000000000');
        })
    });
    describe('After closer', function() {
        it('has to revert if balance of USDC is 0', async function() {
            await expectRevert(
                this.contractClosed.withdrawUSDC({from: accounts[0]}),
                "Balance is zero."
            );
        });
    });
});