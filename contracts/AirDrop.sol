//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AirDrop {
    /* the address of the token contract */
    IERC20 public dataGen;
    address public owner;
  
    event TransferredToken(address indexed to, uint256 value);
    event FailedTransfer(address indexed to, uint256 value);

    constructor ( IERC20 _dataGen ) {
        owner = msg.sender;
        dataGen = _dataGen;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0));
        owner = newOwner;
    }
  
    // this function can be used when you want to send same number of tokens to all the recipients
    function sendTokensSingleValue(address[] memory dests, uint256 value) onlyOwner external {
        uint256 i = 0;
        uint256 toSend = value *10^18; // Change 10^18  - change the 18 to whatever decimal that your ERC20 Token uses
        while (i < dests.length) {
            sendInternally(dests[i] , toSend, value);
            i++;
        }
    }

    function sendInternally(address recipient, uint256 tokensToSend, uint256 valueToPresent) internal {
        if(recipient == address(0)) return;

        if(tokensAvailable() >= tokensToSend) {
            dataGen.transfer(recipient, tokensToSend);
            emit TransferredToken(recipient, valueToPresent);
        } else {
            emit FailedTransfer(recipient, valueToPresent); 
        }
    }
 
    function tokensAvailable() public view returns (uint256) {
        return dataGen.balanceOf(address(this));
    }

    function withdraw() external onlyOwner {
        uint256 balance = tokensAvailable();
        require (balance > 0);
        dataGen.transfer(owner, balance);
    }
}
