const DataGen = artifacts.require("./DataGen.sol");
const USDC = artifacts.require("./USDCtest.sol");
const RetailPrivateSale = artifacts.require("./RetailPrivateSale.sol");
const VCPrivateSale = artifacts.require("./VCPrivateSale.sol");
const ReservedPool = artifacts.require("./ReservedPool.sol");
const CoFounderPool = artifacts.require("./CoFounderPool.sol");
const TeamMainPool = artifacts.require("./TeamMainPool.sol");
const TeamBonusPool = artifacts.require("./TeamBonusPool.sol");
const MiningReservation = artifacts.require("MiningReservation");

//Need to change when the contract is being deployed.
const companyWallet = "0x21A11f33DC993A76C9eADB724743Bc72DFE72532";
//Angela & Luca's wallet
const aWallet = "0x0d657482dfB400866f30a9a7864E7D6c6be901BE";
const lWallet = "0xEBf61FBf93604E69FA611373b0755a1d598C740a";

const USDC_address = "0xe1b28f5e9133c2B912e7A684242363E1b3d87373";

//Set time to the VC contract
const VCStartTime = "1635084664";
const VCEndTime = "1637759464";

//Set time to Retail contract
const RetailStartTime = "1635084664";
const RetailEndTime = "1637759464";

module.exports = async function (deployer) {
  await deployer.deploy(DataGen);
  //await deployer.deploy(USDC);
  const transaction = await web3.eth.getTransaction(DataGen.transactionHash);
  const deployedBlock = await web3.eth.getBlock(transaction.blockNumber);
  const deployedTime = deployedBlock.timestamp;

  // await deployer.deploy(RetailPrivateSale, DataGen.address, RetailStartTime, RetailEndTime, USDC_address);
  // await deployer.deploy(VCPrivateSale, DataGen.address, VCStartTime, VCEndTime, USDC_address);
  // await deployer.deploy(ReservedPool, DataGen.address, companyWallet);
  // await deployer.deploy(CoFounderPool, DataGen.address, aWallet, lWallet, deployedTime);
  // await deployer.deploy(TeamMainPool, DataGen.address);
  // await deployer.deploy(TeamBonusPool, DataGen.address);
  // await deployer.deploy(MiningReservation, DataGen.address);
};
