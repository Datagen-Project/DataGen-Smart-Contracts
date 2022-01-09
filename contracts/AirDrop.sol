//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AirDrop {
    /* the address of the token contract */
    IERC20 public dataGen;
    address public owner;

    mapping( string => uint256 ) referralCodes;
    mapping( address => uint256 ) claimedCount;
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
  
    function setReferralCode( string[] memory codes, uint256 value ) onlyOwner external {
        for( uint i = 0; i < codes.length; i++ ) {
            string memory myCode = codes[i];
            if( referralCodes[myCode] == 0 ) referralCodes[myCode] = value;
        }
    }

    function getAirdrop( string memory code ) external {
        require(claimedCount[msg.sender] < 2, "One wallet cann't get more than 2 airdrop");
        uint value = referralCodes[code];
        require( value > 0, "Code is incorrect or already used");
        uint256 toSend = value * 10 ** 18;
        referralCodes[code] = 0;
        claimedCount[msg.sender] ++;
        sendInternally(msg.sender, toSend, value);
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
