const TAN = "0x1A6A52629B7f45f57471274883B2d73F7b19ad1d";
const Workbench = "0xA8D36F2d5C01C36191CA763A04609B3a13f0bC1e";
const Dev = "0x12AA6CFa23330A0dc71c776f349F824ae3579C1c";
const StartBlock = 0;


const Craftsman = artifacts.require("Craftsman");


module.exports = function (deployer) {
  deployer.deploy(Craftsman, TAN, Workbench, Dev, StartBlock);
};
