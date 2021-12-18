const DataGen = artifacts.require("./DataGen.sol");
const RetailPrivateSale = artifacts.require("./RetailPrivateSale.sol");
const VCPrivateSale = artifacts.require("./VCPrivateSale.sol");
const ReservedPool = artifacts.require("./ReservedPool.sol");
const CoFounderPool = artifacts.require("./CoFounderPool.sol");
const TeamMainPool = artifacts.require("./TeamMainPool.sol");
const TeamBonusPool = artifacts.require("./TeamBonusPool.sol");

//Need to change when the contract is being deployed.
const companyWallet = "0x40985df70659b5E81aE5838d6c88796cAa9b0c6c";
//Angela & Luca's wallet
const aWallet = "0x63F0aB2B6c23dF32b7dCa489717a12D800CDb96E";
const lWallet = "0x3Ee4d1c7EaE445bB57c865D4B176BeD31703822b";

const USDC_address = "0x438a84B53C7Be4E6AFd2273c5623CD0605B7e190"


//Set time to the VC contract
const VCStartTime = "1639652400";
const VCEndTime = "1639998000";
const VCLockTime = "1639911600";

//Set time to Retail contract
const RetailStartTime = "1639652400";
const RetailEndTime = "1639998000";


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
