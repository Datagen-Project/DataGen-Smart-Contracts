const DataGen = artifacts.require("DataGen");
const RetailPrivateSale = artifacts.require("RetailPrivateSale");
const VCPrivateSale = artifacts.require("VCPrivateSale");

module.exports = function (deployer) {
  deployer.deploy(DataGen);
  deployer.deploy(RetailPrivateSale);
  deployer.deploy(VCPrivateSale);
};
