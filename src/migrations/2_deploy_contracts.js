var wCHXMapping = artifacts.require("./wCHXMapping.sol")
var wCHXToken = artifacts.require("./wCHXToken.sol")

module.exports = function (deployer) {
    deployer.deploy(wCHXMapping).then(function() {
        return deployer.deploy(wCHXToken, wCHXMapping.address);
      })
}
