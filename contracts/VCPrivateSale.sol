// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract VCPrivateSale is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    /* the maximum amount of tokens to be sold */
	uint256 public constant maxGoal = 2350000 * (10**18);
	/* how much has been raised by retail investors (in USDC) */
	uint256 public amountRaisedUSDC;
	/* how much has been raised by retail investors (in #DG) */
	uint256 public amountRaisedDG;

	/* the start & end date of the private sale */
	uint256 public startTime;
	uint256 public endTime;
	uint256 public lockTime;

	/* the price per #DG (in USDC) */
	/* there are different prices in different time intervals */
	uint256 public constant firstPrice = 7 * 10**5;
	uint256 public constant secondPrice = 9 * 10**5;
	uint public constant thirdPrice = 11 * 10**5;

	address private USDC_ADDRESS;

	/* the address of the token contract */
	IERC20 private tokenReward;
	/* the address of the usdc token */
	IERC20 private usdc;

	/* indicates if the private sale has been closed already */
	bool public presaleClosed = false;
	/* the balances (in USDC) of all investors */
	mapping(address => uint256) public balanceOfUSDC;
	/* the balances (in #DG) of all investors */
	mapping(address => uint256) public balanceOfDG;
	/* the total balances (in #DG) of all investors */
	mapping(address => uint256) public totalBalanceOfDG;
	/* notifying transfers and the success of the private sale*/
	event GoalReached(address beneficiary, uint256 amountRaisedUSDC);
	event FundTransfer(address backer, uint256 amountUSDC, bool isContribution, uint256 amountRaisedUSDC);

    /*  initialization, set the token address */
    constructor(IERC20 _token, uint256 _startTime, uint256 _endTime, uint256 _lockTime, address _USDC_ADDRESS) {
        tokenReward = _token;
		startTime = _startTime;
		endTime = _endTime;
		lockTime = _lockTime;
		USDC_ADDRESS = _USDC_ADDRESS;
		usdc = IERC20(USDC_ADDRESS);
    }

	function checkFunds(address addr) external view returns (uint256) {
		return balanceOfUSDC[addr];
	}

	function checkDataGenFunds(address addr) external view returns (uint256) {
		return balanceOfDG[addr];
	}

	//Test functions
	function setAmountRaisedDGTest(uint256 _amountRaised) public {
    	amountRaisedDG = _amountRaised;
	}

	function setBalanceOfDGTest(address account, uint256 balance) public {
		balanceOfDG[account] = balance;
	}

	function setTotalBalanceOfTest(address account, uint256 balance) public {
		totalBalanceOfDG[account] = balance;
	}

	function setEndTimeTest(uint256 _endTime) public {
		endTime = _endTime;
	}

	function setLockTimeTest(uint256 _lockTime) public {
		lockTime = _lockTime;
	}

    /* make an investment
     * only callable if the private sale started and hasn't been closed already and the maxGoal wasn't reached yet.
     * the current token price is looked up and the corresponding number of tokens is transfered to the receiver.
     * the sent value is directly forwarded to a safe multisig wallet.
     * this method allows to purchase tokens in behalf of another address. 
     */
    function invest(uint256 amountDG) external {
		require(presaleClosed == false && block.timestamp >= startTime && block.timestamp < endTime, "Presale is closed");
		require(amountDG >= 20000 * (10 ** 18), "Fund is less than 20.000,00 DGT");
		require(amountDG <= 2350000 * (10 ** 18), "Fund is more than 2.350.000,00 DGT");

		uint256 amountUSDC;
		
		/* the amount of the first discounted tokens */
		uint256 discountLimit1 = 300000 * (10**18);

		/* the amount of the first discounted tokens */
		uint256 discountLimit2 = 1300000 * (10**18);

		if (amountRaisedDG + amountDG <= discountLimit1) {
			amountUSDC = amountDG.mul(firstPrice).div(10**18);
		} else if (amountRaisedDG >= discountLimit2) {
			amountUSDC = amountDG.mul(thirdPrice).div(10**18);
		} else if (amountRaisedDG >= discountLimit1 && amountRaisedDG + amountDG <= discountLimit2) {
			amountUSDC = amountDG.mul(secondPrice).div(10**18);
		} else if (amountRaisedDG <= discountLimit1 && amountRaisedDG + amountDG <= discountLimit2) {
			uint256 amountSecondPrice = (amountRaisedDG + amountDG) - discountLimit1;
			uint256 amountFirstPrice = (amountDG - amountSecondPrice).mul(firstPrice).div(10**18);
			amountSecondPrice = amountSecondPrice.mul(secondPrice).div(10**18);
			amountUSDC = amountSecondPrice + amountFirstPrice;
		} else if (amountRaisedDG >= discountLimit1 && amountRaisedDG <= discountLimit2) {
			uint256 amountThirdPrice = (amountRaisedDG + amountDG) - discountLimit2;
			uint256 amountSecondPrice = (amountDG - amountThirdPrice).mul(secondPrice).div(10**18);
			amountThirdPrice = amountThirdPrice.mul(thirdPrice).div(10**18);
			amountUSDC = amountSecondPrice + amountThirdPrice;
		} else if (amountRaisedDG <= discountLimit1 && amountDG >= discountLimit2) {
			uint256 amountThirdPrice = (amountRaisedDG + amountDG) - discountLimit2;
			uint256 amountSecondPrice = (10**24);
			uint256 amountFirstPrice = (amountDG - amountRaisedDG - amountThirdPrice - amountSecondPrice).mul(firstPrice).div(10**18);

			amountSecondPrice = amountSecondPrice.mul(secondPrice).div(10**18);
			amountThirdPrice = amountThirdPrice.mul(thirdPrice).div(10**18);
			amountUSDC = amountFirstPrice + amountSecondPrice + amountThirdPrice;
		}

		usdc.transferFrom(msg.sender, address(this), amountUSDC);

		balanceOfUSDC[msg.sender] = balanceOfUSDC[msg.sender].add(amountUSDC);
		amountRaisedUSDC = amountRaisedUSDC.add(amountUSDC);

		balanceOfDG[msg.sender] = balanceOfDG[msg.sender].add(amountDG);
		totalBalanceOfDG[msg.sender] = balanceOfDG[msg.sender];
		amountRaisedDG = amountRaisedDG.add(amountDG);

		if (amountRaisedDG >= maxGoal) {
			presaleClosed = true;
			emit GoalReached(msg.sender, amountRaisedUSDC);
		}
		
        emit FundTransfer(msg.sender, amountUSDC, true, amountRaisedUSDC);
    }

    modifier afterClosed() {
        require(block.timestamp >= endTime, "Distribution is off.");
        _;
    }

	function claimDataGen() external afterClosed nonReentrant {
		require(totalBalanceOfDG[msg.sender] > 0, "Zero #DG contributed.");

		uint256 epochs = 0;
		if (block.timestamp < lockTime) {
			epochs = 1;
		} else {
			epochs = block.timestamp.sub(lockTime).div(30 * 24 * 3600).add(1);
			if (epochs > 10) epochs = 10;
		}
		
		uint256 maxAmount = totalBalanceOfDG[msg.sender].mul(epochs).div(10);
		uint256 amount = maxAmount.sub(totalBalanceOfDG[msg.sender].sub(balanceOfDG[msg.sender]));
		uint256 balance = tokenReward.balanceOf(address(this));

		require(balance >= amount, "Contract has less fund.");

		balanceOfDG[msg.sender].sub(amount);
		tokenReward.transfer(msg.sender, amount);
	}

	function withdrawUSDC() external onlyOwner {
		uint256 balance = usdc.balanceOf(address(this));
		require(balance > 0, "Balance is zero.");
		usdc.transfer(owner(), balance);
	}

	function withdrawDataGen() external onlyOwner afterClosed{
		uint256 balance = tokenReward.balanceOf(address(this));
		require(balance > 0, "Balance is zero.");
		tokenReward.transfer(owner(), balance);
	}
}
