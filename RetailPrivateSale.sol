// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RetailPrivateSale is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    /* the maximum amount of tokens to be sold */
	uint256 public maxGoal = 150000 * (10**20);
	/* the amount of the first discounted tokens */
	uint256 public discountLimit = 15000 * (10**20);
	/* how much has been raised by retail investors (in USDT) */
	uint256 public amountRaisedUSDT;
	/* how much has been raised by retail investors (in #DG) */
	uint256 public amountRaisedDG;

	/* the start & end date of the private sale */
	uint256 public start;
	uint256 public deadline;
	uint256 public endOfICO;

	/* the price per #DG (in USDT) */
	/* there are different prices in different time intervals */
	uint256 public price = 7 * 10**5;

	address private USDT_ADDRESS = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;

	/* the address of the token contract */
	IERC20 private tokenReward;
	/* the address of the usdt token */
	IERC20 private usdt = IERC20(USDT_ADDRESS);

	/* indicates if the private sale has been closed already */
	bool public presaleClosed = false;
	/* the balances (in USDT) of all investors */
	mapping(address => uint256) public balanceOfUSDT;
	/* the balances (in #DG) of all investors */
	mapping(address => uint256) public balanceOfDG;
	/* notifying transfers and the success of the private sale*/
	event GoalReached(address beneficiary, uint256 amountRaisedUSDT);
	event FundTransfer(address backer, uint256 amountUSDT, bool isContribution, uint256 amountRaisedUSDT);

    /*  initialization, set the token address */
    constructor(IERC20 _token, uint256 _start, uint256 _dead, uint256 _end) {
        tokenReward = _token;
		start = _start;
		deadline = _dead;
		endOfICO = _end;
    }

    /* invest by sending usdt to the contract. */
    receive () external payable{
    }

	function checkFunds(address addr) public view returns (uint256) {
		return balanceOfUSDT[addr];
	}

	function checkDataGenFunds(address addr) public view returns (uint256) {
		return balanceOfDG[addr];
	}

	function getETHBalance() public view returns (uint256) {
		return address(this).balance;
	}

	function setEndOfICO(uint256 _endOfICO) public {
		endOfICO = _endOfICO;
	}

    /* make an investment
     * only callable if the private sale started and hasn't been closed already and the maxGoal wasn't reached yet.
     * the current token price is looked up and the corresponding number of tokens is transfered to the receiver.
     * the sent value is directly forwarded to a safe multisig wallet.
     * this method allows to purchase tokens in behalf of another address. 
     */
    function invest(uint256 amountDG) external {
		require(presaleClosed == false && block.timestamp >= start && block.timestamp < deadline, "Presale is closed");
		require(amountDG >= 10 * (10 ** 20), "Fund is less than 10,00 DGT");
		require(amountDG <= 10000 * (10 ** 20), "Fund is more than 10.000,00 DGT");

		uint256 amountUSDT;

		if (balanceOfDG[msg.sender].add(amountDG) <= discountLimit) {
			amountUSDT = amountDG.mul(price).div(10**20);
		} else {
			uint256 amountDG1 = discountLimit.sub(balanceOfDG[msg.sender]);
			uint256 amountDG2 = amountDG.sub(amountDG1);
			uint256 amountUSDT1 = amountDG1.mul(price).div(10**20);
			price = 10**6;
			uint256 amountUSDT2 = amountDG2.mul(price).div(10**20);
			amountUSDT = amountUSDT1 + amountUSDT2;
		}

		usdt.transferFrom(msg.sender, address(this), amountUSDT);

		balanceOfUSDT[msg.sender] = balanceOfUSDT[msg.sender].add(amountUSDT);
		amountRaisedUSDT = amountRaisedUSDT.add(amountUSDT);

		balanceOfDG[msg.sender] = balanceOfDG[msg.sender].add(amountDG);
		amountRaisedDG = amountRaisedDG.add(amountDG);

		if (amountRaisedDG >= maxGoal) {
			presaleClosed = true;
			emit GoalReached(msg.sender, amountRaisedUSDT);
		}
		
        emit FundTransfer(msg.sender, amountUSDT, true, amountRaisedUSDT);
    }

    modifier afterClosed() {
        require(block.timestamp >= endOfICO, "Distribution is off.");
        _;
    }

	function claimDataGen() public afterClosed nonReentrant {
		require(balanceOfDG[msg.sender] > 0, "Zero #DG contributed.");
		uint256 amount = balanceOfDG[msg.sender];
		uint256 balance = tokenReward.balanceOf(address(this));
		require(balance >= amount, "Contract has less fund.");
		balanceOfDG[msg.sender] = 0;
		tokenReward.transfer(msg.sender, amount);
	}

	function withdrawUSDT() public onlyOwner afterClosed {
		uint256 balance = usdt.balanceOf(address(this));
		require(balance > 0, "Balance is zero.");
		usdt.transfer(owner(), balance);
	}

	function withdrawDataGen() public onlyOwner afterClosed{
		uint256 balance = tokenReward.balanceOf(address(this));
		require(balance > 0, "Balance is zero.");
		tokenReward.transfer(owner(), balance);
	}
}