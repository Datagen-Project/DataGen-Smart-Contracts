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
const balance = require("@openzeppelin/test-helpers/src/balance");

require("chai").should();

/* Test functions 

@dev  In order to test this functionalities you must add this functions in VCPrivateSale.sol also you need 
to set accounts[9] as deadAddr and as voteSetter in the contract.

    function getStakeAmountTest(address _addr) view external returns(uint256) {
        return stakeAmount[_addr];
    }

    function getMiningLogicInfoTest(address _addr) view external returns(address[] memory, uint256[] memory, uint256) {
        MiningLogicManagerAddressInfo memory info = miningLogicInfo[_addr];

        return (info.MiningLogicManagerAddress, info.percent, info.voteStartTime);
    }

    function getNewMiningLogicManagerAddressTest() view external returns(address[] memory) {
        return newMiningLogicManagerAddress;
    }

    function getNewPercentTest() view external returns(uint256[] memory) {
        return new_percent;
    }

    function getVoteInfoTest(address _addr) view external returns(uint256) {
        return voteInfo[_addr];
    }

    function getTotalVotedDGTest(uint256 _position) view external returns(uint256) {
        return totalVotedDG[_position];
    }

    function getDeadAddrTest() view external returns(address) {
        return deadAddr;
    }
    
    function getMiningLogicManagerAddressTest() view external returns(address[] memory) {
        return MiningLogicManagerAddress;
    }

    function getPercentTest() view external returns(uint256[] memory) {
        return percent;
    }

End test functions 

    @dev to test releaseDataGen you must change this variables into the function and make them public.

        uint256 public counter;
        uint256 public epochs;
        uint256 public balance;
        uint256 public leftAmount;

*/

contract("MiningReservation", accounts => {
    beforeEach(async function() {
        this.DatagenToken = await DataGen.new();
        this.USDCToken = await USDC.new();

        this.MiningReservation = await MiningReservation.new(this.DatagenToken.address);
        this.MiningReservationNoDG = await MiningReservation.new(this.DatagenToken.address);

        const fundDG = new BN("15000000000000000000000000");
            await this.DatagenToken.transfer(this.MiningReservation.address, fundDG, {from: accounts[0]});

        const fundDGStaker = new BN("200000000000000000000000");
            await this.DatagenToken.transfer(accounts[4], fundDGStaker, {from: accounts[0]});        
            await this.DatagenToken.transfer(accounts[5], fundDGStaker, {from: accounts[0]});        
            await this.DatagenToken.transfer(accounts[6], fundDGStaker, {from: accounts[0]});        

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
        it("has to have initial stakerCount equal to 0", async function() {
            const stakerCount = await this.MiningReservation.stakerCount();

            stakerCount.toString().should.equal("0");
        });
    });
    describe("voteOptionSet function, setting the votation", function() {
        it("has revert if voteStartTime is less than 3 days", async function() {
            const address = new Array (accounts[6], accounts[7]);
            const percent = new Array (50, 50);
            const start = Math.floor(Date.now() / 1000)

            await expectRevert(
                this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]}),
                "voteStartTime must be bigger than 3 days from now and lesser than 60 days from now"
            );
        });
        it("has to revert if voteStartTime is more than 60 days", async function() {
            const address = new Array (accounts[6], accounts[7]);
            const percent = new Array (50, 50);
            const start = Math.floor(Date.now() / 1000) + 61 * 24 * 3600;

            await expectRevert(
                this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]}),
                "voteStartTime must be bigger than 3 days from now and lesser than 60 days from now"
            );
        });
        it("has to revert if newMiningLogicMamangerAddress array has more elements than percent", async function() {
            const address = new Array (accounts[6], accounts[7]);
            const percent = new Array (50);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            await expectRevert(
                this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]}),
                "_newMiningLogicManagerAddress and percent count are not match"
            );
        });
        it("has to revert if percent array has more elements than newMiningLogicMamangerAddress", async function() {
            const address = new Array (accounts[6]);
            const percent = new Array (50, 50);

            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            await expectRevert(
                this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]}),
                "_newMiningLogicManagerAddress and percent count are not match"
            );
        });
        it("has to revert if total percent isn't 100", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (50, 49);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            await expectRevert(
                this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]}),
                "total percent must be 100"
            );
        });
        it("has to revert if a newMiningManagerAddress is already set", async function() {
            const address = new Array (accounts[9]);
            const percent = [100];
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            await expectRevert(
                this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]}),
                "already set new mining wallet address"
            );
        });
        it("has to revert if try to call the function after stake more than 100k", async function() {
            const address = Array (accounts[5], accounts[6]);
            const percent = Array (50, 50);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            await expectRevert(
                this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]}),
                "you can't set voteOption currently"
            );
        });
        it("has the correct new MiningLogicmanagerAddresses in miningLogicInfo when interact with voteOptionSet", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (50, 50);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            const miningLogicInfo = await this.MiningReservation.getMiningLogicInfoTest(accounts[4])
            
            const checkString = miningLogicInfo[0][0].toString() + miningLogicInfo[0][1].toString();
            
            checkString.should.equal(accounts[5].toString() + accounts[6].toString());

        });
        it("has the correct percent in miningLogicInfo when interact with voteOptionSet", async function() {
            const address = new Array (accounts[5], accounts[9], accounts[7]);
            const percent = new Array (50, 30, 20);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            await this.MiningReservation.voteOptionSet(address,percent, start, {from: accounts[4]});
            const miningLogicInfo = await this.MiningReservation.getMiningLogicInfoTest(accounts[4]);

            const checkString = miningLogicInfo[1][0].toString() + miningLogicInfo[1][1].toString() + miningLogicInfo[1][2];
            
            checkString.should.equal("503020");
        });
        it("has the correct voteStartTime in miningLogicInfo when interact with voteOptionSet", async function () {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (50, 50);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;


            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            const miningLogicInfo = await this.MiningReservation.getMiningLogicInfoTest(accounts[4]);
            const voteStartTime = miningLogicInfo[2].toString() 

            voteStartTime.should.equal(start.toString())
        });
    });
    describe("stake function", function() {
        it("has to revert if don't have enough DG to stake", async function() {
            await expectRevert(
                this.MiningReservation.stake(1, {from: accounts[8]}),
                "you have not enough #DG to stake"
            );
        });
        //need to test revert after vote   
        it("has to transfer the correct amount to the contract", async function() {
            const staked = new BN("10000000000000000000000");
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});

            await this.MiningReservation.stake(staked, {from: accounts[4]});
            const balanceOfMiningReservation = await this.DatagenToken.balanceOf(this.MiningReservation.address);

            balanceOfMiningReservation.toString().should.equal("15010000000000000000000000");
        });
        it("has to increase the stakerCount by 3", async function() {
            const staked =  new BN("10000000000000000000000");
            const halfStaked = new BN("5000000000000000000000");

            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[6]});

            await this.MiningReservation.stake(staked, {from: accounts[4]});            
            await this.MiningReservation.stake(staked, {from: accounts[5]});            
            await this.MiningReservation.stake(halfStaked, {from: accounts[6]});
            await this.MiningReservation.stake(halfStaked, {from: accounts[6]});
            
            const stakerCount = await this.MiningReservation.stakerCount();

            stakerCount.toString().should.equal("3");
        });
        it("has to have correct staker number with address", async function() {
            const staked =  new BN("10000000000000000000000");
            const halfStaked = new BN("5000000000000000000000");

            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[6]});

            await this.MiningReservation.stake(staked, {from: accounts[4]});            
            await this.MiningReservation.stake(staked, {from: accounts[5]});            
            await this.MiningReservation.stake(halfStaked, {from: accounts[6]});
            await this.MiningReservation.stake(halfStaked, {from: accounts[6]});
            
            const staker4 = await this.MiningReservation.getStakerTest(0);
            const staker5 = await this.MiningReservation.getStakerTest(1);
            const staker6 = await this.MiningReservation.getStakerTest(2);

            const fullStakerString = await staker4.toString() + staker5.toString() + staker6.toString()

            fullStakerString.toString().should.equal(accounts[4].toString() + accounts[5].toString() + accounts[6].toString());
        });
        it("has the correct staked amount", async function() {
            const staked = new BN("5000000000000000000000");
            const approved = new BN("10000000000000000000000");

            await this.DatagenToken.approve(this.MiningReservation.address, approved, {from: accounts[4]});
            
            await this.MiningReservation.stake(staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            const stakedBy4 = await this.MiningReservation.getStakeAmountTest(accounts[4]);

            stakedBy4.toString().should.equal("10000000000000000000000");
        });
        it("has the correct staked amount for each address", async function() {
            const staked = new BN("5000000000000000000000");
            const approved = new BN("10000000000000000000000");

            await this.DatagenToken.approve(this.MiningReservation.address, approved, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[5]});
            
            await this.MiningReservation.stake(staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[5]});

            const stakedBy4 = await this.MiningReservation.getStakeAmountTest(accounts[4]);
            const stakedBy5 = await this.MiningReservation.getStakeAmountTest(accounts[5]);

            const totalStaked = stakedBy4.add(stakedBy5);

            totalStaked.toString().should.equal("15000000000000000000000");
        });
        it("has the correct totalStakeAmount", async function() {
            const staked = new BN("5000000000000000000000");
            const approved = new BN("10000000000000000000000");

            await this.DatagenToken.approve(this.MiningReservation.address, approved, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[5]});
            
            await this.MiningReservation.stake(staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[5]});

            const totalStakeAmount = await this.MiningReservation.totalStakeAmount();

            totalStakeAmount.toString().should.equal("15000000000000000000000");
        });
        it("has to revert if who stake more than 100k DG don't set vote options", async function() {
            const staked = new BN("100000000000000000000000");

            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});

            await expectRevert(
                this.MiningReservation.stake(staked, {from: accounts[4]}),
                "You must set vote option using voteOptionSet before stake 100000 DG"
            );
        });
        it("has to became voteSetter if stake more than 100k DG and set vote option", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (50, 50);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;
            
            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]})
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            const voteSetter = await this.MiningReservation.voteSetter()

            voteSetter.toString().should.equal(accounts[4].toString());
        });
        it("has the correct votationStartTime set by new voteSetter", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (50, 50);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            const votationStartTime = await this.MiningReservation.votationStartTime();

            votationStartTime.toString().should.equal(start.toString());
        });
        it("has the correct votationDuration", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (50, 50);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            const votationDuration = await this.MiningReservation.votationDuration();

            votationDuration.toString().should.equal("2592000");
        });
        it("has the correct newMiningLogicManagerAddress set by new voteSetter", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (50, 50);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            const newMiningLogicManagerAddress = await this.MiningReservation.getNewMiningLogicManagerAddressTest();

            const checkString = newMiningLogicManagerAddress[0].toString() + newMiningLogicManagerAddress[1].toString();

            checkString.should.equal(accounts[5].toString() + accounts[6].toString());
        })
        it("has the correct new_percent set by new voteSetter", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            const new_percent = await this.MiningReservation.getNewPercentTest();

            const checkString = new_percent[0].toString() + new_percent[1].toString();

            checkString.should.equal("4951");
        });
        it("has to not allow to set a new voteSetter if alrady set", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[5]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[5]});

            const voteSetter = await this.MiningReservation.voteSetter()

            voteSetter.toString().should.equal(accounts[4].toString());
        })
    });
    describe("vote function", function() {
        it("has to revert if votation start time is not set", async function() {
            await expectRevert(
                this.MiningReservation.vote(2, {from: accounts[4]}),
                "votation start time is not set"
            );
        });
        it("has to revert if votation isn't start", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            await expectRevert(
                this.MiningReservation.vote(2, {from: accounts[4]}),
                "votation is not started"
            );
        });
        it("has to revert if votation is finished", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(35));

            await expectRevert(
                this.MiningReservation.vote(2, {from: accounts[4]}),
                "votation ended"
            );
        });
        it("has to revert if stake less than 20DG", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));

            await expectRevert(
                this.MiningReservation.vote(2, {from: accounts[7]}),
                "you must stake before vote"
            );
        });
        it("has to revert if alrady voted", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));

            await this.MiningReservation.vote(2, {from: accounts[4]});

            await expectRevert(
                this.MiningReservation.vote(2, {from: accounts[4]}),
                "you already voted"
            );
        });
        it("has to revert if set posizion <= 0", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));

            await expectRevert(
                this.MiningReservation.vote(0, {from: accounts[4]}),
                "vote position must be bigger than 0"
            );
        });
        it("has to revert if set position is more than vote option", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));

            await expectRevert(
                this.MiningReservation.vote(3, {from: accounts[4]}),
                "position must be less than total vote option count"
            );
        });
        it("has the correct voteInfo for the staker (check what staker voted)", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));

            await this.MiningReservation.vote(2, {from: accounts[4]});

            const voteInfo = await this.MiningReservation.getVoteInfoTest(accounts[4]);
            voteInfo.toString().should.equal("2");
        });
        it("has the correct totalVoteInfo for all the stakers", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            const staked2 = new BN("50000000000000000000000")

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked2, {from: accounts[5]});
            await this.MiningReservation.stake(staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));

            await this.MiningReservation.vote(2, {from: accounts[4]});
            await this.MiningReservation.vote(2, {from: accounts[5]});
            await this.MiningReservation.vote(1, {from: accounts[6]});

            const position1 = await this.MiningReservation.getVoteInfo(1);
            const position2 = await this.MiningReservation.getVoteInfo(2);

            const checkString = position1.toString() + position2.toString();
            checkString.should.equal("12");
        });
        it("has the correct totalVotesDG (check how many DG have stakers who voted for that position)", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            const staked2 = new BN("50000000000000000000000")

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked2, {from: accounts[5]});
            await this.MiningReservation.stake(staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));

            await this.MiningReservation.vote(2, {from: accounts[4]});
            await this.MiningReservation.vote(2, {from: accounts[5]});
            await this.MiningReservation.vote(1, {from: accounts[6]});

            const positionDG1 = await this.MiningReservation.getTotalVotedDGTest(1);
            const positionDG2 = await this.MiningReservation.getTotalVotedDGTest(2);

            const checkString = positionDG1.toString() + positionDG2.toString();

            checkString.should.equal("50000000000000000000000150000000000000000000000");
        });
    });
    describe("getWinner function", function() {
        it("has to revert if votation start time is not set", async function() {
            await expectRevert(
                this.MiningReservation.getWinner(),
                "votation start time is not set"
            );
        });
        it("has to revert if votation isn't finished", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49,51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            await expectRevert(
                this.MiningReservation.getWinner({from: accounts[5]}),
                "votation not ended"
            );
        });
        it("has to revert if caller is not a staker", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49,51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(35));

            await expectRevert(
                this.MiningReservation.getWinner({from: accounts[5]}),
                "you are not staker"
            );
        });
        it("has to set the correct winner", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            const staked2 = new BN("50000000000000000000000")

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked2, {from: accounts[5]});
            await this.MiningReservation.stake(staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));

            await this.MiningReservation.vote(2, {from: accounts[4]});
            await this.MiningReservation.vote(2, {from: accounts[5]});
            await this.MiningReservation.vote(1, {from: accounts[6]});

            time.increase(time.duration.days(31));

            const winnerInfo = await this.MiningReservation.getWinner.call({from: accounts[6]});

            winnerInfo.toString().should.equal("2");
        });
        it("has to redistribute the DG staked to stakers", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            const staked2 = new BN("50000000000000000000000")

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked2, {from: accounts[5]});
            await this.MiningReservation.stake(staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));
            
            await this.MiningReservation.vote(2, {from: accounts[4]});
            await this.MiningReservation.vote(2, {from: accounts[5]});
            await this.MiningReservation.vote(1, {from: accounts[6]});

            time.increase(time.duration.days(31));

            await this.MiningReservation.getWinner({from: accounts[4]});

            const balanceAccount4 = await this.DatagenToken.balanceOf(accounts[4]);
            const balanceAccount5 = await this.DatagenToken.balanceOf(accounts[5]);
            const balanceAccount6 = await this.DatagenToken.balanceOf(accounts[6]);

            const checkString = balanceAccount4.toString() + balanceAccount5.toString() + balanceAccount6.toString();
            checkString.should.equal("200000000000000000000000200000000000000000000000200000000000000000000000");
        });
        it("has the correct MiningLogicManagerAddress after the voting", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            const staked2 = new BN("50000000000000000000000")

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked2, {from: accounts[5]});
            await this.MiningReservation.stake(staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));
            
            await this.MiningReservation.vote(2, {from: accounts[4]});
            await this.MiningReservation.vote(2, {from: accounts[5]});
            await this.MiningReservation.vote(1, {from: accounts[6]});

            time.increase(time.duration.days(31));

            await this.MiningReservation.getWinner({from: accounts[4]});

            const MiningLogicManagerAddress = await this.MiningReservation.getMiningLogicManagerAddressTest();
            
            const Address1 = MiningLogicManagerAddress[0].toString();
            const Address2 = MiningLogicManagerAddress[1].toString();

            const checkString = Address1 + Address2;

            checkString.should.equal(accounts[5].toString() + accounts[6].toString());
        });
        it("has the correct percent after the voting", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            const staked2 = new BN("50000000000000000000000")

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked2, {from: accounts[5]});
            await this.MiningReservation.stake(staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));
            
            await this.MiningReservation.vote(2, {from: accounts[4]});
            await this.MiningReservation.vote(2, {from: accounts[5]});
            await this.MiningReservation.vote(1, {from: accounts[6]});

            time.increase(time.duration.days(31));

            await this.MiningReservation.getWinner({from: accounts[4]});

            const newPercent = await this.MiningReservation.getPercentTest();

            const Percent1 = newPercent[0].toString();
            const Percent2 = newPercent[1].toString();

            const checkString = Percent1 + Percent2;

            checkString.should.equal("4951");
        });
        it("has deadAddress set after voting", async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            const staked2 = new BN("50000000000000000000000")

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked2, {from: accounts[5]});
            await this.MiningReservation.stake(staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));
            
            await this.MiningReservation.vote(2, {from: accounts[4]});
            await this.MiningReservation.vote(2, {from: accounts[5]});
            await this.MiningReservation.vote(1, {from: accounts[6]});

            time.increase(time.duration.days(31));

            await this.MiningReservation.getWinner({from: accounts[4]});   
        });
        it.only("has to be able to vote a second time after getWinner", async function() {
            const address = new Array (accounts[5]);
            const percent = [100];
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const address2 = new Array (accounts[6]);
            const percent2 = [100];
            const start2 = Math.floor(Date.now() / 1000) + 40 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            const staked2 = new BN("50000000000000000000000");

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked2, {from: accounts[5]});
            await this.MiningReservation.stake(staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));
            
            await this.MiningReservation.vote(2, {from: accounts[4]});
            await this.MiningReservation.vote(2, {from: accounts[5]});
            await this.MiningReservation.vote(1, {from: accounts[6]});

            time.increase(time.duration.days(31));

            await this.MiningReservation.getWinner({from: accounts[4]});

            await this.MiningReservation.claimStakedToken({from: accounts[4]})
            await this.MiningReservation.claimStakedToken({from: accounts[5]})
            await this.MiningReservation.claimStakedToken({from: accounts[6]})

            const MiningLogicManagerAddress = await this.MiningReservation.getMiningLogicManagerAddressTest();
            
            const Address1 = MiningLogicManagerAddress[0].toString();

            await this.MiningReservation.voteOptionSet(address2, percent2, start2, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked, {from: accounts[5]});
            await this.MiningReservation.stake(staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked2, {from: accounts[4]});

            time.increase(time.duration.days(5));
            
            await this.MiningReservation.vote(2, {from: accounts[4]});
            await this.MiningReservation.vote(2, {from: accounts[5]});
            await this.MiningReservation.vote(1, {from: accounts[6]});

            time.increase(time.duration.days(31));

            await this.MiningReservation.getWinner({from: accounts[4]});
            
            const MiningLogicManagerAddress1 = await this.MiningReservation.getMiningLogicManagerAddressTest();
            
            const Address2 = MiningLogicManagerAddress1[0].toString();

            const checkString = Address1 + Address2;

            checkString.should.equal(accounts[5].toString() + accounts[6].toString());
        });
    });
    describe("releseDataGen function", function() {
        this.timeout(0);
        it("has to revert if contract has zero DG", async function() {
            await expectRevert(
                this.MiningReservationNoDG.releaseDataGen(),
                "Zero #DG left."
            );
        });
        it("has to revert if still lock by time", async function() {
            await expectRevert(
                this.MiningReservation.releaseDataGen(),
                "Still locked."
            );
        });
        it("has to release to dead address after 1st april 2024", async function() {
            await time.increaseTo(1711922400);
            await this.MiningReservation.releaseDataGen();
            const balanceOfDeadAddress = await this.DatagenToken.balanceOf(accounts[9]);

            balanceOfDeadAddress.toString().should.equal("4560000000000000000000");
        });
        it("has to release to dead address after 1st april 2024 all release", async function() {
            await time.increaseTo(1711922400);
            
            for(i = 0; i < 7665; i++) {
                const epochs = await this.MiningReservation.epochs();
                const balance = await this.MiningReservation.balance();
                const leftAmount = await this.MiningReservation.leftAmount();
                const multipler = await this.MiningReservation.multipler();
                const diff = balance.sub(leftAmount);
                console.log("epoch: %s, balance: %s, leftAmount: %s, diff: %s, multipler: %s", epochs, balance, leftAmount, diff, multipler);
                await this.MiningReservation.releaseDataGen();
                await time.increase(time.duration.days(1));
            }

            const balanceOfDeadAddress = await this.DatagenToken.balanceOf(accounts[9]);
            
            balanceOfDeadAddress.toString().should.equal("9908381250000000000000000");
        });
        it("has to release to dead address after 1st april 2024 one release every H time ", async function() {
            await time.increaseTo(1711922400);
        
            await time.increase(time.duration.days(1094));
            for(i = 0; i < 7; i++) {
                const epochs = await this.MiningReservation.epochs();
                const balance = await this.MiningReservation.balance();
                const leftAmount = await this.MiningReservation.leftAmount();
                const multipler = await this.MiningReservation.multipler();
                const diff = balance.sub(leftAmount);
                console.log("epoch: %s, balance: %s, leftAmount: %s, diff: %s, multipler: %s", epochs, balance, leftAmount, diff, multipler);
                await this.MiningReservation.releaseDataGen();
                await time.increase(time.duration.days(1095));
            }

            const balanceOfDeadAddress = await this.DatagenToken.balanceOf(accounts[9]);
            
            balanceOfDeadAddress.toString().should.equal("9908381250000000000000000");
        });
        it("has to release to dead address after 1st april 2024 all h1 and h2 in one release", async function() {     
            await time.increaseTo(1711922400);
            await time.increase(time.duration.days(2189));

            let epochs = await this.MiningReservation.epochs();
            let balance = await this.MiningReservation.balance();
            let leftAmount = await this.MiningReservation.leftAmount();
            let multipler = await this.MiningReservation.multipler();
            let diff = balance.sub(leftAmount);
            console.log("epoch: %s, balance: %s, leftAmount: %s, diff: %s, multipler: %s", epochs, balance, leftAmount, diff, multipler);
            
            await this.MiningReservation.releaseDataGen();
            
            epochs = await this.MiningReservation.epochs();
            balance = await this.MiningReservation.balance();
            leftAmount = await this.MiningReservation.leftAmount();
            multipler = await this.MiningReservation.multipler();
            diff = balance.sub(leftAmount);
            console.log("epoch: %s, balance: %s, leftAmount: %s, diff: %s, multipler: %s", epochs, balance, leftAmount, diff, multipler);
            
            const balanceOfDeadAddress = await this.DatagenToken.balanceOf(accounts[9]);

            balanceOfDeadAddress.toString().should.equal("7489800000000000000000000");
        });
    });
    describe('claimStakedToken function', function() {
        it('has to claim the correct amount of #DG by a staker', async function() {
            const address = new Array (accounts[5], accounts[6]);
            const percent = new Array (49, 51);
            const start = Math.floor(Date.now() / 1000) + 4 * 24 * 3600;

            const staked = new BN("100000000000000000000000");
            const staked2 = new BN("50000000000000000000000")

            await this.MiningReservation.voteOptionSet(address, percent, start, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked, {from: accounts[4]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[5]});
            await this.DatagenToken.approve(this.MiningReservation.address, staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked2, {from: accounts[5]});
            await this.MiningReservation.stake(staked2, {from: accounts[6]});
            await this.MiningReservation.stake(staked, {from: accounts[4]});

            time.increase(time.duration.days(5));

            await this.MiningReservation.vote(2, {from: accounts[4]});
            await this.MiningReservation.vote(2, {from: accounts[5]});
            await this.MiningReservation.vote(1, {from: accounts[6]});

            time.increase(time.duration.days(31));

            await this.MiningReservation.getWinner({from: accounts[4]});

            await this.MiningReservation.claimStakedToken({from: accounts[4]});
            const balanceAccount4 = await this.DatagenToken.balanceOf(accounts[4]);

            balanceAccount4.toString().should.equal('200000000000000000000000');
        });
    })
}); 