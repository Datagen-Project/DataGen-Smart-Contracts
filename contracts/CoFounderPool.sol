// SPDX-License-Identifier: MIT

/**
 * B-Datagray co-founder Pool
 * Tokens inside this smart contract: 3,000,000.00 #DG.
 * 1,500,000 + 1,500,000 #DG each (3.000.000#DG in total) to the 2 original co-founders, Angela & Luca.
 * 150,000 #DG (300,000 #DG in total) unlocked and available from the beginning.
 * The other 1,350,000 #DG (2,700,000 #DG in total) will be totally locked in the smart-contract for 3 years (1,095 days).
 * Then the smart contract will automatically unlock 270 #DG daily for each (520 #DG daily in total).
 * So that they will be totally unlocked in 5,000 days.
 */

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CoFounderPool is Ownable, ReentrancyGuard {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;
  
  /* Token amount for co-founders */
  uint256 public constant cfAmount = 3000000 * (10**18);
  /* Release amount for co-founders */
  uint256 public constant rcfAmount = 2700000 * (10**18);
  /* Release start time after deployed the token (1,095 days later)*/
  uint256 public releaseStart;
  /* Available at first(both of Angela & Luca) */
  uint256 public constant beginAmount = 300000 * (10**18);
  /* the address of the token contract */
  IERC20 public dataGen;
  /* the address of the Angela's wallet */
  address public aWallet;
  /* the address of the Luca's wallet */
  address public lWallet;

  event SetaWalletAddress(address indexed user, address indexed aWallet); 
  event SetlWalletAddress(address indexed user, address indexed lWallet); 

  /* modifier for only Angela,Luca can call setaWallet,setlWallet function */
  modifier onlyAngela( address _angela) {
    require( aWallet == _angela,"You are not the wallet owner.");
    _;
  }

  modifier onlyLuca( address _luca) {
    require( lWallet == _luca,"You are not the wallet owner.");
    _;
  }

  /*  initialization, set the token address, co-founder's wallet address and deployed time of DataGen */
  constructor(IERC20 _dataGen, address _aWallet, address _lWallet, uint256 _deployedTime) {
    dataGen = _dataGen;
    aWallet = _aWallet;
    lWallet = _lWallet;
    releaseStart = _deployedTime + 1095 days; //1,095 days

  }

  function releaseDataGen() external nonReentrant {
    require(dataGen.balanceOf(address(this)) > 0, "Zero #DG left.");



    if(block.timestamp < releaseStart ) {
      firstRelease();
    }
    else {
      uint256 balance = dataGen.balanceOf(address(this));
      
      if( balance > rcfAmount) {
        firstRelease();
      }
      uint256 epochs = block.timestamp.sub(releaseStart).div(24 * 3600).add(1);
      if (epochs > 5000) epochs = 5000;

      uint256 releaseAmount = rcfAmount.div(5000);
      uint256 leftAmount = rcfAmount.sub(releaseAmount.mul(epochs));

      require(balance > leftAmount, "Already released.");
      uint256 transferAmount = balance.sub(leftAmount);
      if(transferAmount > 0) {
        require(balance >= transferAmount, "Wrong amount to transfer");
        uint256 half = transferAmount.div(2);
        uint256 otherHalf = transferAmount.sub(half);
        dataGen.safeTransfer(aWallet, half);
        dataGen.safeTransfer(lWallet, otherHalf);
      }
    }
  }

  function firstRelease() private {
    require(dataGen.balanceOf(address(this)) > rcfAmount, "Beginning amount already released to co-founders");
    uint256 totalBalance = dataGen.balanceOf(address(this));
    if(totalBalance >= cfAmount){
      uint256 half = beginAmount.div(2);
      uint256 otherHalf = beginAmount.sub(half);
      dataGen.safeTransfer(aWallet, half);
      dataGen.safeTransfer(lWallet, otherHalf);
    }
    else {
      uint256 firstReleaseAmount = totalBalance.sub(rcfAmount);
      uint256 half = firstReleaseAmount.div(2);
      uint256 otherHalf = firstReleaseAmount.sub(half);
      dataGen.safeTransfer(aWallet, half);
      dataGen.safeTransfer(lWallet, otherHalf);
    }
  }

  /* aWallet update, only Angela can do. */
  function setaWallet(address _aWallet) external onlyAngela(msg.sender) {
    aWallet = _aWallet;
    emit SetaWalletAddress(msg.sender, _aWallet);
  }

  /* lWallet update, only Luca can do. */
  function setlWallet(address _lWallet) external onlyLuca(msg.sender) {
    lWallet = _lWallet;
    emit SetlWalletAddress(msg.sender, _lWallet);
  }

  function checkFunds() public view returns (uint256) {
    return dataGen.balanceOf(address(this));
  }

}
