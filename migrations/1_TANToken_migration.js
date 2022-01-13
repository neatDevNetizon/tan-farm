const BigNumber = require("bignumber.js");
const MaxSupply = BigNumber(10000000000000000000000000);
const DAO = "0x3cAbfe79a4F333d72dCc413FbD810B8916084830";
const Growth = "0xd3454548735394565c2958F5195BA321697AB4e0";
const LP = "0xDd1203B1cC1feCd60F325Ef719579549dA2F336B";
const Team = "0xB1Ee7E082Cc867f84d3Af659d507402de755af15";

const TANToken = artifacts.require("TANToken");


module.exports = function (deployer) {
  deployer.deploy(TANToken, MaxSupply, DAO, Growth, LP, Team);
};
