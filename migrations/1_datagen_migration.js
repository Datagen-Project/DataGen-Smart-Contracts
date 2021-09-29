const DataGen = artifacts.require("./DataGen.sol");
const RetailPrivateSale = artifacts.require("./RetailPrivateSale.sol");
const VCPrivateSale = artifacts.require("./VCPrivateSale.sol");
const ReservedPool = artifacts.require("./ReservedPool.sol");
const CoFounderPool = artifacts.require("./CoFounderPool.sol");
const TeamMainPool = artifacts.require("./TeamMainPool.sol");
const TeamBonusPool = artifacts.require("./TeamBonusPool.sol");

//Need to change when the contract is being deployed.
const companyWallet = "0x2A6823d42DeF025f73419B10cF63dFb593bB4978";
//Angela & Luca's wallet
const aWallet = "0x292A7A1748b196fb1dF3238C12c1e2EF0150b214";
const lWallet = "0x683B91b8b9CbEdB6FC832489A148f4CA79A5427B";

//Set time to the VC contract
const VCStartTime = '1631806094';
const VCEndTime = '1638193214';
const VCLockTime = '1631816094';

//Set time to Retail contract
const RetailStartTime = '1631806094';
const RetailEndTime = '163180694';


module.exports = async function (deployer) {
  await deployer.deploy(DataGen);
  const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
  const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
  const deployedTime = deployedBlock.timestamp;
    
  await deployer.deploy(RetailPrivateSale, DataGen.address, RetailStartTime, RetailEndTime);
  await deployer.deploy(VCPrivateSale, DataGen.address, VCStartTime, VCEndTime, VCLockTime);
  await deployer.deploy(ReservedPool, DataGen.address, companyWallet);
  await deployer.deploy(CoFounderPool, DataGen.address, aWallet, lWallet, deployedTime);
  await deployer.deploy(TeamMainPool, DataGen.address);
  await deployer.deploy(TeamBonusPool, DataGen.address);
};
