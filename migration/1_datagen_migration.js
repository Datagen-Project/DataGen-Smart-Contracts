const DataGen = artifacts.require("./DataGen.sol");
const RetailPrivateSale = artifacts.require("./RetailPrivateSale.sol");
const VCPrivateSale = artifacts.require("./VCPrivateSale.sol");
const ReservedPool = artifacts.require("./ReservedPool.sol");
const CoFounderPool = artifacts.require("./CoFounderPool.sol");
const TeamMainPool = artifacts.require("./TeamMainPool.sol");
const TeamBonusPool = artifacts.require("./TeamBonusPool.sol");

//Need to change when the contract is being deployed.
const companyWallet = "0x2A5f12b2F128cE1b394201B9A24Ca257af25720F";
//Angela & Luca's wallet
const aWallet = "0x02F1283563545EefCa20578358A650DE84e9f46b";
const lWallet = "0x29Da73Bc911089059841a37927Ccd2e2A656D084";

//Set time to the VC contract
const VCStartTime = '1631806094';
const VCEndTime = '163180694';
const VCLockTime = '1631816094';

//Set time to Retail contract
const RetailStartTime = '1631806094';
const RetailEndTime = '163180694';


module.exports = async function (deployer) {
  await deployer.deploy(DataGen);
  const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
  const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
  const deployedTime = deployedBlock.timestamp;
    
  await deployer.deploy(RetailPrivateSale, DataGen.address, VCStartTime, VCEndTime, VCLockTime);
  await deployer.deploy(VCPrivateSale, DataGen.address, RetailStartTime, RetailEndTime);
  await deployer.deploy(ReservedPool, DataGen.address, companyWallet);
  await deployer.deploy(CoFounderPool, DataGen.address, aWallet, lWallet, deployedTime);
  await deployer.deploy(TeamMainPool, DataGen.address);
  await deployer.deploy(TeamBonusPool, DataGen.address);
};
