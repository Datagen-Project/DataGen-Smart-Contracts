// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RetailPrivateSale is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    /* the maximum amount of tokens to be sold */
	uint256 public maxGoal = 150000 * (10**18);
	/* the amount of the first discounted tokens */
	uint256 public discountLimit = 15000 * (10**18);
	/* how much has been raised by retail investors (in USDC) */
	uint256 public amountRaisedUSDC;
	/* how much has been raised by retail investors (in #DG) */
	uint256 public amountRaisedDG;

	/* the start & end date of the private sale */
	uint256 public startTime;
	uint256 public endTime;

	/* the price per #DG (in USDC) */
	/* there are different prices in different time intervals */
	uint256 public price = 7 * 10**5;

	address public USDC_ADDRESS;

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
	/* notifying transfers and the success of the private sale*/
	
	mapping(uint256 => address) public investers;
	uint256 public invester_count;
	
	event GoalReached(address beneficiary, uint256 amountRaisedUSDC);
	event FundTransfer(address backer, uint256 amountUSDC, bool isContribution, uint256 amountRaisedUSDC);

    /*  initialization, set the token address */
    constructor(IERC20 _token, uint256 _startTime, uint256 _endTime, address _USDC_ADDRESS) {
        tokenReward = _token;
		startTime = _startTime;
		endTime = _endTime;
		USDC_ADDRESS = _USDC_ADDRESS;
		usdc = IERC20(USDC_ADDRESS);
		
		invester_count = 0;
    }

	function checkFunds(address addr) external view returns (uint256) {
		return balanceOfUSDC[addr];
	}

	function checkDataGenFunds(address addr) external view returns (uint256) {
		return balanceOfDG[addr];
	}

    /* make an investment
     * only callable if the private sale started and hasn't been closed already and the maxGoal wasn't reached yet.
     * the current token price is looked up and the corresponding number of tokens is transfered to the receiver.
     * the sent value is directly forwarded to a safe multisig wallet.
     * this method allows to purchase tokens in behalf of another address. 
     */
    function invest(uint256 amountDG) external {
		require(presaleClosed == false && block.timestamp >= startTime && block.timestamp < endTime, "Presale is closed");
		require(amountDG >= 10 * (10 ** 18), "Fund is less than 10,00 DGT");
		require(balanceOfDG[msg.sender] + amountDG <= 10000 * (10 ** 18), "Fund is more than 10.000,00 DGT");

		uint256 amountUSDC;

		if (amountRaisedDG + amountDG <= discountLimit) {
			amountUSDC = amountDG.mul(price).div(10**18);
		} else if (amountRaisedDG >= discountLimit){
			amountUSDC = amountDG.div(10**12);
		} else {
			uint256 fullPrice = (amountRaisedDG + amountDG) - discountLimit;
			uint256 discountPrice = amountDG - fullPrice;

			discountPrice = discountPrice.mul(price).div(10**18);
			fullPrice = fullPrice.div(10**12);
			amountUSDC = discountPrice + fullPrice;
		}

		usdc.transferFrom(msg.sender, address(this), amountUSDC);

		if( balanceOfDG[msg.sender] == 0 ) {
			investers[invester_count] = msg.sender;
			invester_count++;
		}
		
		balanceOfUSDC[msg.sender] = balanceOfUSDC[msg.sender].add(amountUSDC);
		amountRaisedUSDC = amountRaisedUSDC.add(amountUSDC);

		balanceOfDG[msg.sender] = balanceOfDG[msg.sender].add(amountDG);
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

	function claimDataGen() external nonReentrant afterClosed onlyOwner{	
		for( uint256 i = 0; i < invester_count; i++ ) {
			address invester = investers[i];
			
			if( balanceOfDG[invester] <= 0 ) continue;
			uint256 amount = balanceOfDG[invester];
			uint256 balance = tokenReward.balanceOf(address(this));
			if( balance < amount ) continue;
			balanceOfDG[invester] = 0;
			tokenReward.transfer(invester, amount);
		}
	}

	function withdrawUSDC() external onlyOwner {
		uint256 balance = usdc.balanceOf(address(this));
		require(balance > 0, "Balance is zero.");
		usdc.transfer(owner(), balance);
	}

	function withdrawDataGen() external onlyOwner afterClosed{
		uint256 balance = tokenReward.balanceOf(address(this));
		require(balance > 0, "Balance is zero.");
		uint256 balanceMinusToClaim = balance - amountRaisedDG;
		tokenReward.transfer(owner(), balanceMinusToClaim);
	}
}
