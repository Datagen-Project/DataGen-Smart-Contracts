const DataGen = artifacts.require("DataGen");
const RetailPrivateSale = artifacts.require("RetailPrivateSale");
const VCPrivateSale = artifacts.require("VCPrivateSale");
const ReservedPool = artifacts.require("ReservedPool");

//Need to change when the contract is being deployed.
const companyWallet = "";

module.exports = async function (deployer) {
  await deployer.deploy(DataGen);
  await deployer.deploy(RetailPrivateSale);
  await deployer.deploy(VCPrivateSale);
  await deployer.deploy(ReservedPool, DataGen.address, companyWallet);
};
