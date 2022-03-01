// SPDX-License-Identifier: MIT

/**
 * B-Datagray Team bonus remuration Pool
 * Tokens inside this smart contract: 300,000.00 #DG
 * Tokens will be locked until 1th of August 2022.
 * Then is released in 10 equal release events (in each of them 10% of the liquidity is made available
 * for withdrawal), one every 30 days.
 */

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TeamBonusPool is Ownable, ReentrancyGuard {
  using SafeMath for uint256;
  
  /* Total token amount in the Bonus Pool */
  uint256 public constant totalAmount = 300000 * (10**18);
  /* Lock time 1th of August 2022 GMT Timezone */
  uint256 public lockTime = 1659304800;
  /* Left token after sending bonus */
  uint256 public leftAmount;
  /* the address of the token contract */
	IERC20 public dataGen;

  address public constant deadAddress = 0x000000000000000000000000000000000000dEaD;

  mapping (address => uint256) bonus;
  mapping (address => uint256) leftBonus;
  mapping (address => bool) isBonusReceiver;

  event updateLeftAmount(address indexed user, uint256 indexed leftAmount);

  /*  initialization, set the token address */
  constructor(IERC20 _dataGen) {
    dataGen = _dataGen;
    leftAmount = totalAmount;
  }

  function setBonus(address _receiver, uint256 _amount) external onlyOwner {
    require(_receiver != deadAddress, "You are sending tokens to dead Address.");
    require(leftAmount >= _amount, "Left token is not enough.");
    if(isBonusReceiver[_receiver] != true) {
      isBonusReceiver[_receiver] = true;
      bonus[_receiver] = _amount;
      leftBonus[_receiver] = _amount;
    }
    else {
      bonus[_receiver] = bonus[_receiver] + _amount;
      leftBonus[_receiver] = leftBonus[_receiver] + _amount;
    }
    leftAmount = leftAmount - _amount;
    emit updateLeftAmount(msg.sender, leftAmount);
  }

  function releaseBonus() external nonReentrant {
    require(block.timestamp >= lockTime, "Pool is locked until 1st of August 2022.");
    require(isBonusReceiver[msg.sender] == true, "You are not bonus Receiver.");
    require(leftBonus[msg.sender] > 0, "You don't have enough funds.");
    
    uint256 epochs = block.timestamp.sub(lockTime).div(30 * 24 * 3600).add(1);
    if (epochs > 10) epochs = 10;

    uint256 leftBonusAmount = bonus[msg.sender].sub(bonus[msg.sender].mul(epochs).div(10));
    
    require(leftBonus[msg.sender] > leftBonusAmount, "Already released.");
    uint256 transferAmount = leftBonus[msg.sender].sub(leftBonusAmount);
    uint256 balance = dataGen.balanceOf(address(this));
    if(transferAmount > 0) {
      require(leftBonus[msg.sender] >= transferAmount, "Wrong amount to transfer");
      require(balance >= transferAmount, "Wrong amount to transfer");
      dataGen.transfer(address(msg.sender), transferAmount);
      leftBonus[msg.sender] = leftBonus[msg.sender] - transferAmount;
    }
  }

  function checkBonus(address _checker) public view returns (uint256) {
    require(isBonusReceiver[_checker], "You are not Bonus Receiver.");
    return leftBonus[_checker];
  }
  
  function checkBalance() public view returns (uint256) {
    return leftAmount;
  }

  function setLockTime() external onlyOwner {
    lockTime = block.timestamp;
  }
}
