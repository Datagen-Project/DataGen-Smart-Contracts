// SPDX-License-Identifier: MIT

/**
 * B-Datagray Team main remuration Pool
 * Tokens inside this smart contract: 1,700,000.00 #DG
 * 10% of #DG(170,000.00 #DG) will be unlocked and available from the beginning.
 * 30% of #DG(510,000.00 #DG) will be locked in smart contract until 1st of August 2022 (and
 * gradually released in three release events, one each 30 days from the August 1st 2022).
 * 30% of #DG(510,000.00 #DG) will be locked until 1st August 2023 (and gradually released in three 
 * release events, one each 30 days from the August 1st 2023).
 * remaining 30% will be locked until 31st March 2024 and released gradually in four years 
 * from then, so in 48 release events (one each 30 days).
 */

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TeamMainPool is Ownable, ReentrancyGuard {
  using SafeMath for uint256;
  
  /* Total token amount in the Team main Pool */
  uint256 public totalAmount = 1700000 * (10**18);
  /* 1st Lock time 1st of May 2022 GMT Timezone */
  uint256 public lockTime1 = 1641336000;
  /* 1st Lock time 1st of May 2023 GMT Timezone */
  uint256 public lockTime2 = lockTime1 + 1 minutes;
  /* 1st Lock time 31st of December 2023 GMT Timezone */
  uint256 public lockTime3 = lockTime2 + 1 minutes;
  /* Left token after sending rewards */
  uint256 public leftAmount;
  /* the address of the token contract */
	IERC20 public dataGen;

  address public deadAddress = 0x000000000000000000000000000000000000dEaD;

  mapping (address => uint256) mainSalary;
  mapping (address => uint256) leftSalary;
  mapping (address => bool) isSalaryReceiver;

  event updateLeftAmount(address indexed user, uint256 indexed leftAmount);

  /*  initialization, set the token address */
  constructor(IERC20 _dataGen) {
    dataGen = _dataGen;
    leftAmount = totalAmount;
  }

  function sendSalary(address _receiver, uint256 _amount) external onlyOwner {
    require(_receiver != deadAddress, "You are sending tokens to dead Address.");
    require(leftAmount >= _amount, "Left token is not enough.");
    if(isSalaryReceiver[_receiver] != true) {
      isSalaryReceiver[_receiver] = true;
      mainSalary[_receiver] = _amount;
      leftSalary[_receiver] = _amount;
    }
    else {
      mainSalary[_receiver] = mainSalary[_receiver] + _amount;
      leftSalary[_receiver] = leftSalary[_receiver] + _amount;
    }
    leftAmount = leftAmount - _amount;
    emit updateLeftAmount(msg.sender, leftAmount);
  }

  function releaseSalary() external nonReentrant {
    require(isSalaryReceiver[msg.sender] == true, "You are not salary Receiver.");
    require(leftSalary[msg.sender] > 0, "You don't have enough funds.");
    uint256 balance = dataGen.balanceOf(address(this));
    if(block.timestamp < lockTime1) {
      uint256 transferAmount = mainSalary[msg.sender].div(10);
      require(balance >= transferAmount, "Wrong amount to transfer");
      require(leftSalary[msg.sender] > mainSalary[msg.sender].sub(transferAmount), "");
      dataGen.transfer(msg.sender, transferAmount);
      leftSalary[msg.sender] = leftSalary[msg.sender] - transferAmount;
    }
    else if(block.timestamp <lockTime2) {
      uint256 firstReleaseAmount = mainSalary[msg.sender].div(10);
      if(leftSalary[msg.sender] > mainSalary[msg.sender].sub(firstReleaseAmount)) {
        uint256 releaseLeft = leftSalary[msg.sender].sub(mainSalary[msg.sender].sub(firstReleaseAmount));
        dataGen.transfer(msg.sender, releaseLeft);
        leftSalary[msg.sender] = leftSalary[msg.sender].sub(releaseLeft);
      }

      uint256 epochs = block.timestamp.sub(lockTime1).div(60).add(2);
      if (epochs > 4) epochs = 4;

      uint256 releaseAmount = mainSalary[msg.sender].div(10);
      uint256 leftSalaryAmount = mainSalary[msg.sender].sub(releaseAmount.mul(epochs));
      
      require(leftSalary[msg.sender] > leftSalaryAmount, "Already released.");
      uint256 transferAmount = leftSalary[msg.sender].sub(leftSalaryAmount);
      
      if(transferAmount > 0) {
        require(leftSalary[msg.sender] >= transferAmount, "Wrong amount to transfer");
        require(balance >= transferAmount, "Wrong amount to transfer");
        dataGen.transfer(address(msg.sender), transferAmount);
        leftSalary[msg.sender] = leftSalary[msg.sender] - transferAmount;
      }
    }
    else if(block.timestamp < lockTime3) {
      uint256 secondReleaseAmount = mainSalary[msg.sender].div(10).mul(4);
      if(leftSalary[msg.sender] > mainSalary[msg.sender].sub(secondReleaseAmount)) {
        uint256 releaseLeft = leftSalary[msg.sender].sub(mainSalary[msg.sender].sub(secondReleaseAmount));
        dataGen.transfer(msg.sender, releaseLeft);
        leftSalary[msg.sender] = leftSalary[msg.sender].div(releaseLeft);
      }

      uint256 epochs = block.timestamp.sub(lockTime2).div(60).add(5);
      if (epochs > 7) epochs = 7;

      uint256 releaseAmount = mainSalary[msg.sender].div(10);
      uint256 leftSalaryAmount = mainSalary[msg.sender].sub(releaseAmount.mul(epochs));
      
      require(leftSalary[msg.sender] > leftSalaryAmount, "Already released.");
      uint256 transferAmount = leftSalary[msg.sender].sub(leftSalaryAmount);
      
      if(transferAmount > 0) {
        require(leftSalary[msg.sender] >= transferAmount, "Wrong amount to transfer");
        require(balance >= transferAmount, "Wrong amount to transfer");
        dataGen.transfer(address(msg.sender), transferAmount);
        leftSalary[msg.sender] = leftSalary[msg.sender] - transferAmount;
      }   
    }
    else {
      uint256 thirdReleaseAmount = mainSalary[msg.sender].div(10).mul(7);
      if(leftSalary[msg.sender] > mainSalary[msg.sender].sub(thirdReleaseAmount)) {
        uint256 releaseLeft = leftSalary[msg.sender].sub(mainSalary[msg.sender].sub(thirdReleaseAmount));
        dataGen.transfer(msg.sender, releaseLeft);
        leftSalary[msg.sender] = leftSalary[msg.sender].div(releaseLeft);
      }

      uint256 epochs = block.timestamp.sub(lockTime3).div(60).add(1);
      if (epochs > 48) epochs = 48;

      uint256 releaseAmount = mainSalary[msg.sender].div(10).mul(3).div(48);
      uint256 leftSalaryAmount = mainSalary[msg.sender].div(10).mul(3).sub(releaseAmount.mul(epochs));
      
      require(leftSalary[msg.sender] > leftSalaryAmount, "Already released.");
      uint256 transferAmount = leftSalary[msg.sender].sub(leftSalaryAmount);
      
      if(transferAmount > 0) {
        require(leftSalary[msg.sender] >= transferAmount, "Wrong amount to transfer");
        require(balance >= transferAmount, "Wrong amount to transfer");
        dataGen.transfer(address(msg.sender), transferAmount);
        leftSalary[msg.sender] = leftSalary[msg.sender] - transferAmount;
      }   
    }
  }

  function checkSalary(address _checker) public view returns (uint256) {
    require(isSalaryReceiver[_checker], "You are not Salary Receiver.");
    return leftSalary[_checker];
  }
  
  function checkBalance() public view returns (uint256) {
    return leftAmount;
  }
}
