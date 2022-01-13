const TAN = "0x1A6A52629B7f45f57471274883B2d73F7b19ad1d";
const ETH = "0xab5801a7d398351b8be11c439e05c5b3259aec9b";
const Craftsman = "0xCBdf25C4d4D02Bb25eC20cE605F480017A1463d5";
const Dev = "0x12AA6CFa23330A0dc71c776f349F824ae3579C1c";
const Treasury = "0x8ed6847A6E059bDBFe21F5b3a980A92d59B1FD21";


const TANVault = artifacts.require("TANVault");


module.exports = function (deployer) {
  deployer.deploy(TANVault, TAN, ETH, Craftsman, Dev, Treasury);
};
