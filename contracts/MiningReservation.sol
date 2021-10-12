// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MiningReservation is Ownable, ReentrancyGuard {
  using SafeMath for uint256;

  /*lock time */
  uint256 public lockTime = 1704067200;
  uint256 public totalLocked = 15000000 * (10**18);
  uint256 public multipler = 1;
  
  /* Available at first */
  uint256 public startAmount = 2280 * (10**18);
  uint256 public beginAmount = 2280 * (10**18);
  /* the address of the token contract */
	IERC20 public dataGen;

  /* Dead address */
  address miningWallet = 0x000000000000000000000000000000000000dEaD;

  event SetMiningWalletAddress(address indexed user, address indexed miningWallet); 

  /*  initialization, set the token address */
  constructor(IERC20 _dataGen) {
    dataGen = _dataGen;
  }

  function setMiningWallet(address _miningWallet) external onlyOwner {
    miningWallet = _miningWallet;
    emit SetMiningWalletAddress(msg.sender, miningWallet);
  }

  function releaseDataGen() public nonReentrant {
    require(dataGen.balanceOf(address(this)) > 0, "Zero #DG left.");
    require(block.timestamp >= lockTime, "Still locked.");

    uint256 balance = dataGen.balanceOf(address(this));

    uint256 plusDate = multipler.mul(1095).sub(1095); 
    uint256 epochs = block.timestamp.sub(lockTime).div(24 * 3600).add(1).sub(plusDate);
    if (epochs > 1095) {
      epochs = 1;
      multipler ++;
      beginAmount = beginAmount.div(2);
    }

    uint256 counter = multipler;
    uint256 releaseAmount = 0;
    uint256 mintUnitAmount = startAmount;
    while(counter > 1) {
      releaseAmount = releaseAmount + mintUnitAmount.mul(1095);
      mintUnitAmount = mintUnitAmount.div(2);
      counter--;
    }
    releaseAmount = beginAmount.mul(epochs);
    uint256 leftAmount = totalLocked.sub(releaseAmount);

    require(balance > leftAmount, "Already released.");
    uint256 transferAmount = balance.sub(leftAmount);
    if(transferAmount > 0) {
      require(balance >= transferAmount, "Wrong amount to transfer");
      dataGen.transfer(miningWallet, transferAmount);
    }
	}
}