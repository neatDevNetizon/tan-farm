const Multicall2 = artifacts.require("Multicall2");


module.exports = function (deployer) {
  deployer.deploy(Multicall2);
};
