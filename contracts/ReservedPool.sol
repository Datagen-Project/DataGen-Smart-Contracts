// SPDX-License-Identifier: MIT

/**
 * B-Datagray Reserved Pool
 * Tokens inside this smart contract: 1,500,000.00 #DG
 * 100% locked until 21st December 2023
 * 750,000.00 #DGs will be released between 21st December 2023 and 15th December 2024, releasing them in 12 events, one every 30 days.
 * Other 750,000.00 #DGs will be locked in the Reserved Pool and from 15th December 2024, releasing them in 24 events, one every 30 days.
 */

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ReservedPool is Ownable, ReentrancyGuard {
  using SafeMath for uint256;
  
  /* First release tokens */
  uint256 public frAmount = 750000 * (10**18);
  /* First release start time(21/12/2023 00:00:00) */
  uint256 public frStart = 1703116800;
  /* Second release tokens */
  uint256 public srAmount = 750000 * (10**18);
  /* Second release start time */
  uint256 public srStart = 1734220800;
  /* the address of the token contract */
  IERC20 public dataGen;
  /* the address of the company wallet */
  address[] public companyWallet;
  uint256 public companyWalletLength;

  event SetCompanyWalletAddress(address indexed user, address[] indexed companyWallet); 

  /*  initialization, set the token address */
  constructor(IERC20 _dataGen, address _companyWallet) {
    dataGen = _dataGen;
    companyWallet.push(_companyWallet);
    companyWalletLength = 1;
  }

  modifier firstRelease() {
    require(block.timestamp >= frStart, "Pool is Still locked.");
    _;
  }

  function releaseDataGen() public firstRelease nonReentrant {
    require(dataGen.balanceOf(address(this)) > 0, "Zero #DG left.");

    if(block.timestamp < srStart ) {
      uint256 epochs = block.timestamp.sub(frStart).div(30 * 24 * 3600).add(1);
      if (epochs > 12) epochs = 12;

      uint256 releaseAmount = frAmount.div(12);
      uint256 balance = dataGen.balanceOf(address(this));
      uint256 leftAmount = frAmount.sub(releaseAmount.mul(epochs));

      require(balance.sub(srAmount) > leftAmount, "Already released.");
      uint256 transferAmount = balance.sub(srAmount).sub(leftAmount);
      if(transferAmount > 0) {
        require(balance.sub(srAmount) >= transferAmount, "Wrong amount to transfer");
        uint256 realAmount = transferAmount / companyWalletLength;
        for( uint i = 0; i < companyWalletLength - 1; i++ ) {
          dataGen.transfer(companyWallet[i], realAmount);
        }
        dataGen.transfer(companyWallet[companyWalletLength - 1], transferAmount - realAmount * (companyWalletLength-1));
      }
    }
    else {
      uint256 balance = dataGen.balanceOf(address(this));
      
      if( balance > srAmount) {
        uint256 realtransferAmount = balance.sub(srAmount);
        uint256 realAmount = realtransferAmount / companyWalletLength;
        for( uint i = 0; i < companyWalletLength - 1; i++ ) {
          dataGen.transfer(companyWallet[i], realAmount);
        }
        dataGen.transfer(companyWallet[companyWalletLength - 1], realtransferAmount - realAmount * (companyWalletLength-1));
      }

      uint256 epochs = (block.timestamp.sub(srStart)).div(30 * 24 * 3600).add(1);
      if (epochs > 24) epochs = 24;

      uint256 releaseAmount = srAmount.div(24);
      uint256 leftAmount = srAmount.sub(releaseAmount.mul(epochs));

      require(balance > leftAmount, "Already released.");
      uint256 transferAmount = balance.sub(leftAmount);
      if(transferAmount > 0) {
        uint256 realtransferAmount = transferAmount;
        uint256 realAmount = realtransferAmount / companyWalletLength;
        for( uint i = 0; i < companyWalletLength - 1; i++ ) {
          dataGen.transfer(companyWallet[i], realAmount);
        }
        dataGen.transfer(companyWallet[companyWalletLength - 1], realtransferAmount - realAmount * (companyWalletLength-1));
      }
    }
	}

  /* companyWallet update, only owner can do. */
  function setCompanyWallet(address[] memory _companyWallet) public onlyOwner {
    companyWallet = _companyWallet;
    companyWalletLength = _companyWallet.length;
    emit SetCompanyWalletAddress(msg.sender, _companyWallet);
  }

  function checkFunds() public view returns (uint256) {
		return dataGen.balanceOf(address(this));
	}
}
