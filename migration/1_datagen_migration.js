const DataGen = artifacts.require("DataGen");
const RetailPrivateSale = artifacts.require("RetailPrivateSale");
const VCPrivateSale = artifacts.require("VCPrivateSale");
const ReservedPool = artifacts.require("ReservedPool");
const CoFounderPool = artifacts.require("CoFounderPool");
const TeamMainPool = artifacts.require("TeamMainPool");
const TeamBonusPool = artifacts.require("TeamBonusPool");

//Need to change when the contract is being deployed.
const companyWallet = "";
//Angela & Luca's wallet
const aWallet = "";
const lWallet = "";

module.exports = async function (deployer) {
  await deployer.deploy(DataGen);
  const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
  const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
  const deployedTime = deployedBlock.timestamp;
    
  await deployer.deploy(RetailPrivateSale);
  await deployer.deploy(VCPrivateSale);
  await deployer.deploy(ReservedPool, DataGen.address, companyWallet);
  await deployer.deploy(CoFounderPool, DataGen.address, aWallet, lWallet, deployedTime);
  await deployer.deploy(TeamMainPool, DataGen.address);
  await deployer.deploy(TeamBonusPool, DataGen.address);
};
