const TAN = "0x1A6A52629B7f45f57471274883B2d73F7b19ad1d";

const Workbench = artifacts.require("Workbench");


module.exports = function (deployer) {
  deployer.deploy(Workbench, TAN);
};
