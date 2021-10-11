const DataGen = artifacts.require("./DataGen.sol");
const RetailPrivateSale = artifacts.require("./RetailPrivateSale.sol");
const VCPrivateSale = artifacts.require("./VCPrivateSale.sol");
const ReservedPool = artifacts.require("./ReservedPool.sol");
const CoFounderPool = artifacts.require("./CoFounderPool.sol");
const TeamMainPool = artifacts.require("./TeamMainPool.sol");
const TeamBonusPool = artifacts.require("./TeamBonusPool.sol");
const MiningReservation = artifacts.require("MiningReservation");

//Need to change when the contract is being deployed.
const companyWallet = "";
//Angela & Luca's wallet
const aWallet = "";
const lWallet = "";

//Set time to the VC contract
const VCStartTime = "";
const VCEndTime = "";
const VCLockTime = "";

//Set time to Retail contract
const RetailStartTime = "";
const RetailEndTime = "";


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
  await deployer.deploy(MiningReservation, DataGen.address);
};
