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
  uint256 public startAmount = 4560 * (10**18);
  uint256 public beginAmount = 4560 * (10**18);

  /* Votation time*/
  uint256 public votationStartTime = 0;
  uint256 public votationDuration = 0;

  /* votation staking*/
  mapping( address => uint256 ) stakeAmount;
  mapping( uint256 => address ) stakers;
  uint256 public totalStakeAmount;
  uint256 public stakerCount = 0;

  /* votation info */
  mapping( address => uint256 ) voteInfo;
  mapping( uint256 => uint256 ) totalVoteInfo;
  mapping( uint256 => uint256 ) totalVotedDG;
  uint256 public voteOption;

  /* the address of the token contract */
	IERC20 public dataGen;

  /* Dead address */
  address miningWallet = 0x000000000000000000000000000000000000dEaD;
  address deadAddr = 0x000000000000000000000000000000000000dEaD;

  event SetMiningWalletAddress(address indexed user, address indexed miningWallet); 


  modifier duringVotation() {
    require( votationStartTime > 0, "votation start time is not set");
    require( votationDuration > 0, "votation duration is not set");
    require( block.timestamp >= votationStartTime, "votation is not started");
    require( block.timestamp <= votationStartTime + votationDuration, "votation ended");
    _;
  }
  
   modifier afterVotation() {
    require( votationStartTime > 0, "votation start time is not set");
    require( votationDuration > 0, "votation duration is not set");
    require( block.timestamp >= votationStartTime + votationDuration, "votation not ended");
    _;
  }
  /*  initialization, set the token address */
  constructor(IERC20 _dataGen) {
    dataGen = _dataGen;
  }

  function setMiningWallet(address _miningWallet) external onlyOwner afterVotation {
    miningWallet = _miningWallet;

    votationStartTime = 0;
    votationDuration = 0;

    emit SetMiningWalletAddress(msg.sender, miningWallet);
  }

  function stake( uint256 amount ) external nonReentrant{
    require( dataGen.balanceOf(msg.sender) >= amount, "you have not enough #DG to stake");
    require( votationStartTime == 0 && votationDuration == 0,"You can't stake before setting wallet");
    require( voteInfo[msg.sender] == 0, "you can't stake after vote");


    if( stakeAmount[msg.sender] == 0 ) {
      stakers[stakerCount] = msg.sender;
      stakerCount++;
    }
    stakeAmount[msg.sender] += amount;
    
    if( stakeAmount[msg.sender] >= 100000 * 10 **18 && votationStartTime == 0 && votationDuration == 0 ) {
      votationStartTime = block.timestamp + 3600 * 24 * 15;
      votationDuration = 3600 * 24 * 30;
    }
    totalStakeAmount += amount;
    dataGen.transferFrom(msg.sender, address(this), amount);
  }

  function vote( uint256 position ) external duringVotation nonReentrant {
    require( stakeAmount[msg.sender] > 0, "you must stake before vote");
    require( voteInfo[msg.sender] == 0, "you already voted");
    require( voteOption > 0,"total vote option is not set yet");
    require( position > 0, "vote position must be bigger than 0");
    require( position <= voteOption, "position must be less than total vote option count");

    voteInfo[msg.sender] = position;
    totalVoteInfo[position]++;
    totalVotedDG[position] += stakeAmount[msg.sender];
  }

  function getVoteInfo( uint256 position ) external view returns(uint256) {
    require( position > 0, "position must be bigger than 0");
    require( position <= voteOption, "position must be less than total vote option count");
    return totalVoteInfo[position];
  }

  function setVotationInfo( uint256 totalOption ) external onlyOwner {
    require( totalOption > 0, "option count must be bigger than 0");
    voteOption = totalOption;
  }

  function getWinner() external onlyOwner afterVotation returns(uint256) {
    uint256 winnerDGCount = 0;
    uint256 winnerInfo;
    for( uint256 i = 1; i <= voteOption; i++ ) {
      if( winnerDGCount < totalVotedDG[i] ) {
        winnerDGCount = totalVotedDG[i];
        winnerInfo = i;
      }
    }
    for( uint256 i = 0; i < stakerCount ; i++ ) {
      address stakerAddr = stakers[i];
      dataGen.transfer(stakerAddr, stakeAmount[stakerAddr]);
      voteInfo[stakerAddr] = 0;
      stakeAmount[stakerAddr] = 0;
      stakers[i] = deadAddr;  
    }

    for( uint i = 1 ; i <= voteOption; i++ ) {
      totalVoteInfo[i] = 0;
      totalVotedDG[i] = 0;
    }
    totalStakeAmount = 0;
    stakerCount = 0;

    return winnerInfo;
  }

  function releaseDataGen() public nonReentrant {
    require(dataGen.balanceOf(address(this)) > 0, "Zero #DG left.");
    require(block.timestamp >= lockTime, "Still locked.");
    
    uint256 balance = dataGen.balanceOf(address(this));

    uint256 plusDate = multipler.mul(1095).sub(1095); 
    uint256 epochs = block.timestamp.sub(lockTime).div(24 * 3600).add(1).sub(plusDate);
    if (epochs > 1095) {
      epochs = epochs - 1095;
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
    releaseAmount = beginAmount.mul(epochs).add(releaseAmount);
    uint256 leftAmount = totalLocked.sub(releaseAmount);

    require(balance > leftAmount, "Already released.");
    uint256 transferAmount = balance.sub(leftAmount);
    if(transferAmount > 0) {
      require(balance >= transferAmount, "Wrong amount to transfer");
      dataGen.transfer(miningWallet, transferAmount);
    }
	}
}